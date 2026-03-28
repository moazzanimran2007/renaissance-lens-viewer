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
    const { image } = await req.json();
    if (!image) {
      return new Response(JSON.stringify({ error: "No image provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are an expert Renaissance art historian and iconographer. Analyze the uploaded painting image.

You MUST respond by calling the analyze_painting tool with your analysis. Do NOT respond with plain text.

CRITICAL RULES FOR FIGURE IDENTIFICATION:
- ONLY identify figures you can actually SEE in the image. Do NOT list figures you expect to be present based on the painting's title or iconographic tradition.
- If the image is cropped or partial, only describe what is visible.
- For partially visible figures (e.g., only a face edge is showing), mark them but note they are partially visible in the description.
- If you can only see 2 figures, only return 2 figures. Never fabricate or assume figures that are not visually present.
- Base your identification strictly on visual evidence in the uploaded image, not on art-historical knowledge of what "should" be there.

Instructions:
- Identify the painting: title, artist, approximate date
- Describe the scene: narrative, symbolism, religious/mythological context
- Identify ALL notable figures that are VISUALLY PRESENT (real historical people AND allegorical/fictional characters)
- For each figure, estimate their x,y position as a percentage of image dimensions (0-100)
- For each figure, write a SHORT description (1-2 sentences for tooltip)
- For each figure, write a DETAILED biography: 3-5 rich paragraphs covering their full life story, historical significance, role in the painting, relationships to other figures, famous anecdotes, birth/death dates if known, and why the artist chose to depict them. Use double newlines between paragraphs. Be as thorough as a museum docent giving a private tour.
- Write a rich 3-4 paragraph historical overview of the painting itself
- If you cannot identify the painting, still describe what you see

Be detailed, scholarly, and engaging. The biography for each figure should read like a mini-essay.`;

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
              {
                type: "image_url",
                image_url: { url: image },
              },
              {
                type: "text",
                text: "Analyze this Renaissance painting. Identify the work, describe its historical context, and locate all figures in the composition. Call the analyze_painting tool with your findings.",
              },
            ],
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "analyze_painting",
              description: "Return structured analysis of a Renaissance painting",
              parameters: {
                type: "object",
                properties: {
                  title: { type: "string", description: "Title of the painting" },
                  artist: { type: "string", description: "Artist name" },
                  date: { type: "string", description: "Date or period" },
                  paintingOverview: {
                    type: "string",
                    description: "3-4 paragraphs of rich historical narrative about the painting. Use double newlines between paragraphs.",
                  },
                  figures: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        label: { type: "string", description: "Name or role of the figure" },
                        description: {
                          type: "string",
                          description: "1-2 short sentences for tooltip display",
                        },
                        biography: {
                          type: "string",
                          description: "3-5 rich paragraphs covering the figure's full life story, historical significance, role in this painting, relationships to other figures, famous anecdotes, birth/death dates, and why the artist depicted them. Separate paragraphs with double newlines.",
                        },
                        isRealPerson: { type: "boolean" },
                        position: {
                          type: "object",
                          properties: {
                            x: { type: "number", description: "X position as percentage (0-100)" },
                            y: { type: "number", description: "Y position as percentage (0-100)" },
                          },
                          required: ["x", "y"],
                        },
                      },
                      required: ["label", "description", "biography", "isRealPerson", "position"],
                    },
                  },
                },
                required: ["title", "artist", "date", "paintingOverview", "figures"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "analyze_painting" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
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

    if (!toolCall?.function?.arguments) {
      throw new Error("No analysis returned from AI");
    }

    const analysis = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-painting error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
