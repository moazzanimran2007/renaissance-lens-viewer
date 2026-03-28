import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { image, x, y, regionBounds, paintingTitle, paintingArtist } = await req.json();
    if (!image || x == null || y == null) {
      return new Response(
        JSON.stringify({ error: "Missing image or coordinates" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are an expert Renaissance art historian. The image you are seeing is a CROPPED SECTION from a larger painting. It shows ONLY the area the user selected.
${paintingTitle ? `The full painting is "${paintingTitle}" by ${paintingArtist || "unknown artist"}.` : ""}

CRITICAL: Analyze ONLY what you can actually see in this cropped image. Do NOT guess or assume what might be in other parts of the painting. If the cropped area shows:
- A figure: identify them based on visual evidence only and provide a detailed biography
- An object, symbol, or architectural element: explain its significance and iconographic meaning
- Background, landscape, or empty space: describe what is visible — colors, textures, brushwork, composition choices
- A partial or unclear element: describe what you see honestly, noting it may be partially cropped

Do NOT hallucinate figures or elements that are not visible in this specific crop. Be scholarly but honest about what the image contains.

You MUST respond by calling the analyze_region tool.

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              { type: "image_url", image_url: { url: image } },
              {
                type: "text",
                text: "This is a cropped section from a painting. Analyze exactly what you see in this image. Call the analyze_region tool with your findings.",
              },
            ],
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "analyze_region",
              description: "Return analysis of a specific region in the painting",
              parameters: {
                type: "object",
                properties: {
                  label: {
                    type: "string",
                    description: "Name of the figure, object, or element at this position",
                  },
                  description: {
                    type: "string",
                    description: "1-2 sentence summary of what's at this position",
                  },
                  biography: {
                    type: "string",
                    description:
                      "3-5 rich paragraphs about this element — if a figure, their life story; if an object or symbol, its iconographic meaning, historical context, and artistic significance. Separate paragraphs with double newlines.",
                  },
                  isRealPerson: {
                    type: "boolean",
                    description: "True if this is a real historical person, false otherwise",
                  },
                },
                required: ["label", "description", "biography", "isRealPerson"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "analyze_region" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please try again." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      throw new Error("AI analysis failed");
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) throw new Error("No analysis returned");

    const analysis = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-region error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
