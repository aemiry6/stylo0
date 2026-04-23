// Analyze wardrobe images with Lovable AI (Gemini Vision) and return structured items.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are Stylo, an expert fashion AI that identifies clothing items in photos.
For each photo, identify EVERY visible clothing item / accessory / shoe.
Be precise about color (a real color name, not generic), garment type, fabric texture, and weight (light/medium/heavy).
If multiple items appear in one photo, return all of them.
Skip non-clothing objects (people, furniture, backgrounds).`;

const tool = {
  type: "function",
  function: {
    name: "report_wardrobe_items",
    description: "Return the structured list of clothing items detected across all input photos.",
    parameters: {
      type: "object",
      properties: {
        items: {
          type: "array",
          description: "All clothing items detected.",
          items: {
            type: "object",
            properties: {
              category: {
                type: "string",
                enum: ["top", "bottom", "outer", "shoes", "accessory", "dress", "underwear"],
                description: "Garment category bucket.",
              },
              type_en: { type: "string", description: "Specific garment name in English (e.g. T-shirt, Denim jeans, Wool coat)." },
              type_tr: { type: "string", description: "Specific garment name in Turkish." },
              color_en: { type: "string", description: "Primary color in English (e.g. Coral, Indigo, Forest green)." },
              color_tr: { type: "string", description: "Primary color in Turkish." },
              color_hex: { type: "string", description: "Approximate hex color like #E07A5F." },
              texture_en: { type: "string", description: "Fabric/texture in English (e.g. Cotton, Denim, Wool, Leather, Knit)." },
              texture_tr: { type: "string", description: "Fabric/texture in Turkish." },
              weight: {
                type: "string",
                enum: ["light", "medium", "heavy"],
                description: "Approximate garment weight / warmth.",
              },
              season_en: {
                type: "string",
                enum: ["Summer", "Spring", "Autumn", "Winter", "All season"],
              },
              season_tr: {
                type: "string",
                enum: ["Yaz", "İlkbahar", "Sonbahar", "Kış", "4 mevsim"],
              },
              emoji: { type: "string", description: "A single emoji that best represents the item." },
            },
            required: [
              "category",
              "type_en",
              "type_tr",
              "color_en",
              "color_tr",
              "color_hex",
              "texture_en",
              "texture_tr",
              "weight",
              "season_en",
              "season_tr",
              "emoji",
            ],
            additionalProperties: false,
          },
        },
      },
      required: ["items"],
      additionalProperties: false,
    },
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { images } = await req.json();
    if (!Array.isArray(images) || images.length === 0) {
      return new Response(JSON.stringify({ error: "images[] required (data URLs)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const userContent: any[] = [
      {
        type: "text",
        text: `Analyze the following ${images.length} wardrobe photo(s). Return EVERY clothing item visible.`,
      },
      ...images.slice(0, 8).map((url: string) => ({
        type: "image_url",
        image_url: { url },
      })),
    ];

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
          { role: "user", content: userContent },
        ],
        tools: [tool],
        tool_choice: { type: "function", function: { name: "report_wardrobe_items" } },
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
      console.error("No tool call returned", JSON.stringify(data).slice(0, 500));
      return new Response(JSON.stringify({ error: "No items detected" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const parsed = JSON.parse(call.function.arguments);

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-wardrobe error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
