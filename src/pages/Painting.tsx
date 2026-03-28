import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AnalysisResult } from "@/types/analysis";
import PaintingView from "@/components/PaintingView";
import { Loader2 } from "lucide-react";

const Painting = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const load = async () => {
      const { data, error } = await supabase
        .from("paintings" as any)
        .select("*")
        .eq("id", id)
        .single() as { data: any; error: any };

      if (error || !data) {
        navigate("/gallery");
        return;
      }

      const { data: urlData } = supabase.storage.from("paintings").getPublicUrl(data.image_path);

      setImageUrl(urlData.publicUrl);
      setAnalysis({
        title: data.title,
        artist: data.artist,
        date: data.date || "",
        paintingOverview: data.painting_overview || "",
        figures: (data.figures as any) || [],
      });
      setLoading(false);
    };

    load();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen parchment-texture flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-gold animate-spin" />
      </div>
    );
  }

  if (!analysis) return null;

  return (
    <PaintingView
      imageUrl={imageUrl}
      analysis={analysis}
      onReset={() => navigate("/gallery")}
    />
  );
};

export default Painting;
