// Conversational stylist: chats with the user about their plans and, when ready,
// returns a structured summary used to compose an outfit.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM = (lang: string, weatherCtx: string) => `You are Stylo, a warm, witty personal stylist who chats with the user like a close friend.
Tone: friendly, casual, briefly playful, never sarcastic. Keep replies VERY short (1 sentence, max 2). No bullet lists, no headings, no filler.
Language: respond in ${lang === "tr" ? "Turkish" : lang === "de" ? "German" : lang === "es" ? "Spanish" : "English"}.
${weatherCtx ? `Weather context you can reference if useful: ${weatherCtx}.` : ""}

Your job — BE FAST. Do NOT drag the conversation:
1) On the first user message, if they already named an occasion (e.g. "iş yemeğim var", "date", "spor"), that is ENOUGH. Immediately call the tool "ready_to_style" in the SAME turn and write one short closing line like "Harika, kombinini hazırlıyorum…". Do NOT ask follow-up questions like "vibe?", "where?", "with whom?" — infer formality from the occasion itself (work dinner = smart, gym = sport, etc.).
2) Only ask ONE clarifying question if the occasion is truly ambiguous (e.g. "dışarı çıkıyorum" with no hint). Never ask more than one question total before calling the tool.
3) WARDROBE AWARENESS: You will receive a "Wardrobe summary". If the user excludes something (e.g. "no jeans") and they have NO alternative in that slot, tell them once and ask them to upload one — do NOT call the tool. Otherwise just acknowledge and continue.
4) When calling the tool, the purpose_summary must be specific (include the occasion, implied formality, and any exclusions). Then write one short closing line.

Never list clothing items yourself — the outfit appears as cards after the tool call.`;


const tool = {
  type: "function",
  function: {
    name: "ready_to_style",
    description: "Call this when you have enough context to recommend an outfit.",
    parameters: {
      type: "object",
      properties: {
        purpose_summary: {
          type: "string",
          description: "Short English description of the occasion + vibe (e.g. 'first business dinner with new boss, wants to look sharp and confident').",
        },
        purpose_key: {
          type: "string",
          enum: ["work", "date", "casual", "sport", "party", "travel", "school", "event", "shopping", "dinner", "home", "friends"],
          description: "Closest matching purpose category.",
        },
        formality: {
          type: "string",
          enum: ["very_casual", "casual", "smart_casual", "smart", "formal"],
        },
      },
      required: ["purpose_summary", "purpose_key", "formality"],
      additionalProperties: false,
    },
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, lang = "tr", weather, wardrobeSummary } = await req.json();
    if (!Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "messages[] required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const weatherCtx = weather
      ? `${weather.condition || ""}${weather.temp !== undefined ? `, ${Math.round(weather.temp)}°C` : ""}${weather.city ? `, ${weather.city}` : ""}`
      : "";

    const wardrobeMsg = wardrobeSummary
      ? `Wardrobe summary (categories the user has uploaded, with counts and notable types/colors):\n${wardrobeSummary}`
      : "";

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM(lang, weatherCtx) },
          ...(wardrobeMsg ? [{ role: "system", content: wardrobeMsg }] : []),
          ...messages,
        ],
        tools: [tool],
        tool_choice: "auto",
        temperature: 0.8,
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
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const tx = await aiRes.text();
      console.error("AI gateway error:", aiRes.status, tx);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await aiRes.json();
    const msg = data.choices?.[0]?.message ?? {};
    const reply: string = msg.content || "";
    const call = msg.tool_calls?.[0];
    let ready: { purpose_summary: string; purpose_key: string; formality: string } | null = null;
    if (call?.function?.name === "ready_to_style") {
      try {
        ready = JSON.parse(call.function.arguments);
      } catch (e) {
        console.error("tool args parse failed", e);
      }
    }

    return new Response(JSON.stringify({ reply, ready }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("chat-stylist error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
