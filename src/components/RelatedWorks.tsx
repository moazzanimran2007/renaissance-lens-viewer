import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Palette } from "lucide-react";

interface RelatedPainting {
  title: string;
  artist: string;
  year: string;
  relationship: string;
  reason: string;
}

interface RelatedWorksProps {
  title: string;
  artist: string;
  date: string;
  paintingOverview: string;
}

const relationshipColors: Record<string, string> = {
  "same artist": "bg-amber-100 text-amber-800 border-amber-300",
  "same era": "bg-emerald-100 text-emerald-800 border-emerald-300",
  "same subject": "bg-sky-100 text-sky-800 border-sky-300",
  "artistic influence": "bg-violet-100 text-violet-800 border-violet-300",
};

const RelatedWorks = ({ title, artist, date, paintingOverview }: RelatedWorksProps) => {
  const [paintings, setPaintings] = useState<RelatedPainting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const fetchRelated = async () => {
      try {
        const { data, error: fnError } = await supabase.functions.invoke("suggest-related", {
          body: { title, artist, date, paintingOverview },
        });

        if (cancelled) return;
        if (fnError || !data?.paintings) {
          setError(true);
          return;
        }
        setPaintings(data.paintings);
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchRelated();
    return () => { cancelled = true; };
  }, [title, artist, date, paintingOverview]);

  if (error) return null;

  return (
    <section className="max-w-3xl mx-auto px-6 pb-16">
      <h2 className="font-display text-2xl md:text-3xl font-semibold text-walnut mb-6 flex items-center gap-2">
        <Palette className="w-6 h-6 text-gold" />
        Related Works
      </h2>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-gold animate-spin" />
          <span className="ml-3 font-body text-muted-foreground text-sm italic">
            Discovering related masterpieces…
          </span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {paintings.map((p, i) => (
            <div
              key={i}
              className="gold-border rounded bg-parchment/60 p-5 hover:bg-parchment transition-colors"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="font-display text-base font-semibold text-walnut leading-tight">
                  {p.title}
                </h3>
                <span
                  className={`text-[10px] font-body px-2 py-0.5 rounded-full border whitespace-nowrap ${
                    relationshipColors[p.relationship] || "bg-muted text-muted-foreground border-border"
                  }`}
                >
                  {p.relationship}
                </span>
              </div>
              <p className="font-body text-xs text-muted-foreground mb-2">
                {p.artist} · {p.year}
              </p>
              <p className="font-body text-sm text-foreground/80 leading-relaxed">
                {p.reason}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default RelatedWorks;
