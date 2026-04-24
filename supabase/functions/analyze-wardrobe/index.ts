// Analyze wardrobe images with Lovable AI (Gemini Vision) and return structured items.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are Stylo, an expert fashion AI that performs Google Lens-style detailed analysis of clothing.
For each photo, identify EVERY visible clothing item, accessory or pair of shoes.
Be precise and concrete. Avoid generic words like "clothing" or "fabric" — name the actual garment, material and color.
For each item return:
- specific garment name (e.g. "Crewneck T-shirt", "Slim-fit denim jeans", "Wool overcoat")
- a real color name (e.g. "Coral", "Indigo", "Forest green") — never just "blue" or "dark"
- a precise hex color sampled from the photo
- the dominant material/fabric (e.g. "100% Cotton", "Denim", "Wool blend", "Genuine leather", "Polyester knit")
- pattern (Solid, Striped, Checked, Floral, Graphic print, Plaid, Polka dot, Animal print, Color block, Embroidered, Other)
- fit (Slim, Regular, Relaxed, Oversized, Tailored, Skinny, Straight, Cropped, N/A)
- style/aesthetic (Casual, Smart casual, Formal, Sporty, Streetwear, Bohemian, Minimal, Vintage, Y2K, Preppy, Grunge, Other)
- visible details (e.g. "V-neck, short sleeves", "Button-down, point collar, long sleeves", "High-waisted, 5 pockets")
- weight class (light / medium / heavy)
- approximate season suitability
- BRAND GUESS: only fill if you see a CLEAR, READABLE logo/label in the image. Otherwise return "Unknown".
- a confidence score between 0 and 1 for the overall identification
- a single emoji that best represents the item

If multiple items appear in one photo, return all of them.
Skip non-clothing objects (people, furniture, backgrounds, hangers).`;

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
              type_en: { type: "string", description: "Specific garment name in English (e.g. Crewneck T-shirt, Slim denim jeans, Wool overcoat)." },
              type_tr: { type: "string", description: "Specific garment name in Turkish." },
              color_en: { type: "string", description: "Primary color in English (e.g. Coral, Indigo, Forest green)." },
              color_tr: { type: "string", description: "Primary color in Turkish." },
              color_hex: { type: "string", description: "Approximate hex color like #E07A5F." },
              material_en: { type: "string", description: "Dominant fabric/material in English (e.g. 100% Cotton, Denim, Wool blend, Leather)." },
              material_tr: { type: "string", description: "Dominant fabric/material in Turkish." },
              pattern_en: {
                type: "string",
                enum: ["Solid", "Striped", "Checked", "Floral", "Graphic print", "Plaid", "Polka dot", "Animal print", "Color block", "Embroidered", "Other"],
              },
              pattern_tr: {
                type: "string",
                enum: ["Düz", "Çizgili", "Kareli", "Çiçekli", "Baskılı", "Ekose", "Puantiyeli", "Hayvan deseni", "Renk bloklu", "İşlemeli", "Diğer"],
              },
              fit_en: {
                type: "string",
                enum: ["Slim", "Regular", "Relaxed", "Oversized", "Tailored", "Skinny", "Straight", "Cropped", "N/A"],
              },
              fit_tr: {
                type: "string",
                enum: ["Dar", "Normal", "Rahat", "Oversize", "Kalıplı", "Skinny", "Düz", "Crop", "Yok"],
              },
              style_en: {
                type: "string",
                enum: ["Casual", "Smart casual", "Formal", "Sporty", "Streetwear", "Bohemian", "Minimal", "Vintage", "Y2K", "Preppy", "Grunge", "Other"],
              },
              style_tr: {
                type: "string",
                enum: ["Günlük", "Akıllı şık", "Resmi", "Sportif", "Sokak stili", "Bohem", "Minimal", "Vintage", "Y2K", "Preppy", "Grunge", "Diğer"],
              },
              details_en: { type: "string", description: "Short list of visible structural details in English (neckline, sleeves, closures, pockets, etc.)." },
              details_tr: { type: "string", description: "Short list of visible structural details in Turkish." },
              brand_guess: { type: "string", description: "Brand name ONLY if a logo/label is clearly visible. Otherwise 'Unknown'." },
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
              confidence: { type: "number", description: "0..1 confidence for the overall identification." },
              emoji: { type: "string", description: "A single emoji that best represents the item." },
            },
            required: [
              "category",
              "type_en",
              "type_tr",
              "color_en",
              "color_tr",
              "color_hex",
              "material_en",
              "material_tr",
              "pattern_en",
              "pattern_tr",
              "fit_en",
              "fit_tr",
              "style_en",
              "style_tr",
              "details_en",
              "details_tr",
              "brand_guess",
              "weight",
              "season_en",
              "season_tr",
              "confidence",
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
        text: `Analyze the following ${images.length} wardrobe photo(s) like Google Lens. For EVERY garment, return the full structured set of attributes (material, pattern, fit, style, details, brand if visible). Be specific and accurate.`,
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
        model: "google/gemini-2.5-pro",
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
