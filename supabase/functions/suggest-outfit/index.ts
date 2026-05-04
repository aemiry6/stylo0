// Suggest an outfit from the user's wardrobe based on purpose + weather.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are Stylo, a personal stylist AI.
You receive the user's wardrobe (a list of items with id, category, color, texture, weight) plus an occasion and weather.
Pick the BEST outfit ONLY from items that exist in the wardrobe.
Rules:
- Match weight to weather: hot/sunny -> light only, cold/snow -> heavy outer required, rainy -> water-resistant outer if possible.
- Match formality to purpose (work=smart, party=bold, sport=athletic, casual=relaxed, date=stylish, travel=comfortable+layered).
- Prefer harmonious color combinations (complementary or analogous).
- Use 2-5 items: at least one top + one bottom (or a dress) + shoes. Add outer/accessory only when it improves the outfit.
- Always respond via the tool.`;

const tool = {
  type: "function",
  function: {
    name: "compose_outfit",
    description: "Pick the best outfit from the available wardrobe.",
    parameters: {
      type: "object",
      properties: {
        item_ids: {
          type: "array",
          items: { type: "string" },
          description: "IDs (from the provided wardrobe) of the items selected for the outfit.",
          minItems: 2,
          maxItems: 5,
        },
        rationale_en: { type: "string", description: "1-3 sentence explanation in English why this outfit works for the weather + occasion." },
        rationale_tr: { type: "string", description: "1-3 sentence explanation in Turkish." },
        confidence: { type: "number", description: "0..1 confidence score." },
      },
      required: ["item_ids", "rationale_en", "rationale_tr", "confidence"],
      additionalProperties: false,
    },
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { wardrobe, purpose, purposeSummary, formality, weather, temperature, weatherNote, lang, avoidIds, savedCombinations } = await req.json();
    if (!Array.isArray(wardrobe) || wardrobe.length === 0) {
      return new Response(JSON.stringify({ error: "wardrobe[] required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const userMsg = `Wardrobe (JSON):
${JSON.stringify(wardrobe, null, 2)}

Occasion: ${purpose}
${purposeSummary ? `Detailed context: ${purposeSummary}` : ""}
${formality ? `Formality target: ${formality}` : ""}
Weather: ${weather}${temperature !== undefined ? ` (${temperature}°C)` : ""}
${typeof weatherNote === "string" && weatherNote.trim() ? `User-described weather: ${weatherNote.trim()}` : ""}
Preferred response language: ${lang || "tr"}
${Array.isArray(avoidIds) && avoidIds.length ? `Avoid repeating exactly these item ids together: ${avoidIds.join(", ")}` : ""}
${Array.isArray(savedCombinations) && savedCombinations.length ? `Previously saved/worn outfits, do NOT repeat these exact combinations and prefer different silhouettes or colors where possible: ${JSON.stringify(savedCombinations)}` : ""}

Pick the best outfit. Return only via the tool.`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userMsg },
        ],
        tools: [tool],
        tool_choice: { type: "function", function: { name: "compose_outfit" } },
      }),
    });

    if (!aiRes.ok) {
      if (aiRes.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, try again shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiRes.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Add funds in Settings → Workspace → Usage." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await aiRes.text();
      console.error("AI gateway error:", aiRes.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await aiRes.json();
    const call = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!call) {
      return new Response(JSON.stringify({ error: "No outfit composed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const parsed = JSON.parse(call.function.arguments);
    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("suggest-outfit error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
