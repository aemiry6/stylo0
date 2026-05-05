// Conversational stylist: chats with the user about their plans and, when ready,
// returns a structured summary used to compose an outfit.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM = (lang: string, weatherCtx: string) => `You are Stylo, a warm, witty personal stylist who chats with the user like a close friend.
Tone: friendly, casual, sometimes playfully funny, but never sarcastic about the user. Keep replies short (1-3 sentences) and natural — no bullet lists, no headings.
Language: respond in ${lang === "tr" ? "Turkish" : lang === "de" ? "German" : lang === "es" ? "Spanish" : "English"}.
${weatherCtx ? `Weather context you can reference if useful: ${weatherCtx}.` : ""}

Your job:
1) Ask the user what they're dressing for. If they already told you (occasion, vibe, who they'll see, formality, comfort needs), DON'T ask again.
2) Acknowledge with empathy and a touch of personality (e.g. "First work dinner — first impressions matter, let's nail it!").
3) WARDROBE AWARENESS: You will receive a "Wardrobe summary" listing which clothing categories the user has uploaded and counts. If the user EXCLUDES something (e.g. "I don't want to wear jeans today", "no skirts", "not in the mood for sneakers"), check the summary:
   - If the user has OTHER alternatives in that category (e.g. they say "no jeans" but also have chinos/shorts), just acknowledge naturally and continue.
   - If they have NO alternative in that category (e.g. they say "no jeans" but jeans are the ONLY bottoms they uploaded, or they ruled out the only shoes), gently tell them in a friendly way that you only see X in their wardrobe for that slot, and ask if they'd like to upload another option (e.g. another pair of pants/shorts) so you can see it too. Do NOT call the tool in this case — wait for them to upload or change their mind.
4) When you have enough to choose an outfit (occasion + vibe) AND the wardrobe can actually cover it, call the tool "ready_to_style" with a concise English summary (include any exclusions, e.g. "first work dinner, no jeans"). Don't call the tool until you have at least the occasion.
5) After calling the tool, also write a short closing line telling the user you're picking the outfit now.

Never list clothing items yourself — the outfit will appear as cards after you call the tool.`;

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
