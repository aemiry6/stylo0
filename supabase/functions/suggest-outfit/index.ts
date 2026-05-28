// Suggest an outfit from the user's wardrobe based on purpose + weather.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are Stylo, a sharp personal stylist AI.
You receive the user's wardrobe (id, category, color, material, pattern, fit, style, weight, season) plus a detailed occasion summary, target formality and weather.
Compose the BEST outfit using ONLY items that exist in the wardrobe (match by id).

Hard rules:
- Match weight to weather: hot/sunny -> light only, cold/snow -> heavy outer required, rainy -> water-resistant outer if possible.
- Match formality PRECISELY to the requested target. This is the most important rule.
- Prefer harmonious color combinations (complementary, analogous, or a confident neutral base + one accent).
- Use 3-6 items. Required: at least one top + one bottom (or a dress) + shoes.

FORMALITY DISCIPLINE (CRITICAL — read carefully):
- smart / formal (e.g. business dinner, work meeting, interview, wedding, gala):
  * ONLY use polished pieces: tailored trousers/skirt, dress shirt/blouse, blazer, knit, dress, loafers/oxfords/heels/derbies, leather belt, structured bag, watch, subtle jewelry.
  * NEVER include: sneakers, trainers, hoodies, sweatshirts, t-shirts with prints, athletic wear, joggers, shorts, caps, beanies, baseball hats, bucket hats, sunglasses (unless outdoor daytime), backpacks, sporty/athletic items, flip-flops, sandals.
  * If the wardrobe truly lacks formal shoes, pick the cleanest minimal sneaker only as a last resort and mention the compromise in the rationale.
- smart_casual (dinner with friends, nicer date, office casual):
  * Tailored or clean-cut pieces; clean leather sneakers are OK; no athletic wear, no caps, no hoodies.
- casual / very_casual: relaxed pieces fine; still avoid pure gym wear unless asked.
- sport / gym: athletic pieces only.
- NEVER add a hat, cap, beanie or sunglasses unless (a) the weather requires it (cold -> beanie, very sunny outdoor -> cap/sunglasses) AND (b) the formality allows it. For any smart/formal occasion, NO hats. EVER.
- Accessories must serve the look: a leather belt or watch elevates smart looks; a baseball cap does not belong at a business dinner.

Layering & sophistication:
- When the wardrobe and weather allow, build LAYERED looks instead of basic top+bottom+shoes. Examples: shirt under a knit, knit under a blazer, t-shirt under an open shirt, dress with a jacket and belt.
- Mix textures and patterns deliberately. Keep the silhouette balanced (relaxed top + tailored bottom, or fitted top + wide bottom).
- Aim for stylist-level combinations like: black trousers + white striped shirt + brown knit + loafers + leather belt.

Variety rules (CRITICAL):
- You will receive a list of recently saved/worn outfits with dates. Treat last 7 days as "this week", last 30 days as "this month".
- Never repeat the exact same combination of item ids from this week.
- Avoid reusing more than ONE item that appeared in any outfit from this week. From this month, avoid reusing more than TWO items together.
- Actively change the silhouette, dominant color, or layering vs. the most recent outfits.
- If the wardrobe is small and you must reuse items, pair them with different partners and explain the twist in the rationale.

Always respond via the tool. Rationale must (a) tie the outfit to the occasion + formality in one warm sentence, and (b) briefly note how it differs from recent looks.`;


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
          minItems: 3,
          maxItems: 6,
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
${Array.isArray(savedCombinations) && savedCombinations.length ? `Recently saved/worn outfits with dates (newest first). Apply the variety rules strictly: ${JSON.stringify(savedCombinations)}. Today is ${new Date().toISOString().slice(0, 10)}.` : ""}

Pick the best outfit. Return only via the tool.`;

    const callModel = async (model: string) =>
      fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: userMsg },
          ],
          tools: [tool],
          tool_choice: { type: "function", function: { name: "compose_outfit" } },
        }),
      });

    let aiRes = await callModel("google/gemini-2.5-flash");

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

    let data = await aiRes.json();
    let call = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!call) {
      console.warn("Flash returned no tool call, retrying with pro. Raw:", JSON.stringify(data).slice(0, 800));
      aiRes = await callModel("google/gemini-2.5-pro");
      if (aiRes.ok) {
        data = await aiRes.json();
        call = data.choices?.[0]?.message?.tool_calls?.[0];
      }
    }
    if (!call) {
      console.error("No tool call after fallback. Raw:", JSON.stringify(data).slice(0, 800));
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
