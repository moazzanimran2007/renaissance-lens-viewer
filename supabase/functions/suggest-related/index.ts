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
    const { title, artist, date, paintingOverview } = await req.json();

    if (!title || !artist) {
      return new Response(JSON.stringify({ error: "Missing title or artist" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are an art historian. Given a painting, suggest 4-6 famous related paintings. Consider: same artist, same era/period, same subject matter, and artistic influences or companion pieces. Return structured data using the provided tool.`;

    const userPrompt = `Painting: "${title}" by ${artist}${date ? `, ${date}` : ''}.
${paintingOverview ? `Overview: ${paintingOverview}` : ''}

Suggest 4-6 famous related paintings with diverse relationship types.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "suggest_related_paintings",
              description: "Return a list of related famous paintings",
              parameters: {
                type: "object",
                properties: {
                  paintings: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        artist: { type: "string" },
                        year: { type: "string" },
                        relationship: {
                          type: "string",
                          enum: ["same artist", "same era", "same subject", "artistic influence"],
                        },
                        reason: { type: "string", description: "2-sentence explanation of the connection" },
                      },
                      required: ["title", "artist", "year", "relationship", "reason"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["paintings"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "suggest_related_paintings" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in response");

    const paintings = JSON.parse(toolCall.function.arguments);
    return new Response(JSON.stringify(paintings), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("suggest-related error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
