import { useState, useRef, useCallback } from "react";
import { AnalysisResult, Figure } from "@/types/analysis";
import { supabase } from "@/integrations/supabase/client";
import FigureMarker from "./FigureMarker";
import FigureThread from "./FigureThread";
import AudioWalkthrough from "./AudioWalkthrough";
import { useAudioWalkthrough } from "@/hooks/useAudioWalkthrough";
import { useTTSVoices } from "@/hooks/useTTSVoices";
import { Loader2, Crosshair } from "lucide-react";
import { toast } from "sonner";

interface PaintingViewProps {
  imageUrl: string;
  analysis: AnalysisResult;
  onReset: () => void;
}

const PaintingView = ({ imageUrl, analysis, onReset }: PaintingViewProps) => {
  const [selectedFigureIndex, setSelectedFigureIndex] = useState<number | null>(null);
  const [customFigure, setCustomFigure] = useState<Figure | null>(null);
  const [customClickPos, setCustomClickPos] = useState<{ x: number; y: number } | null>(null);
  const [isAnalyzingRegion, setIsAnalyzingRegion] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);
  const { voices, selectedVoice, setSelectedVoice } = useTTSVoices();
  const walkthrough = useAudioWalkthrough(analysis, selectedVoice);

  const handleImageClick = useCallback(
    async (e: React.MouseEvent<HTMLDivElement>) => {
      // Don't trigger if clicking on a marker button
      if ((e.target as HTMLElement).closest("button")) return;

      const rect = imgRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
      const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);

      setCustomClickPos({ x, y });
      setSelectedFigureIndex(null);
      setIsAnalyzingRegion(true);

      try {
        // Convert image to base64 for the edge function
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });

        const { data, error } = await supabase.functions.invoke("analyze-region", {
          body: {
            image: base64,
            x,
            y,
            paintingTitle: analysis.title,
            paintingArtist: analysis.artist,
          },
        });

        if (error) throw error;
        if (!data || data.error) throw new Error(data?.error || "Analysis failed");

        const figure: Figure = {
          label: data.label,
          description: data.description,
          biography: data.biography,
          isRealPerson: data.isRealPerson,
          position: { x, y },
        };

        setCustomFigure(figure);
      } catch (err: any) {
        console.error("Region analysis error:", err);
        toast.error("Could not analyze that area. Try again.");
        setCustomClickPos(null);
      } finally {
        setIsAnalyzingRegion(false);
      }
    },
    [imageUrl, analysis.title, analysis.artist]
  );

  const closeCustomFigure = useCallback(() => {
    setCustomFigure(null);
    setCustomClickPos(null);
  }, []);

  // Show either a pre-identified figure or a custom-selected one
  const activeFigure = selectedFigureIndex !== null ? analysis.figures[selectedFigureIndex] : customFigure;
  const isCustom = selectedFigureIndex === null && customFigure !== null;

  return (
    <div className="min-h-screen parchment-texture">
      <header className="text-center pt-10 pb-6 px-6">
        <h1 className="font-display text-3xl md:text-4xl font-semibold text-walnut">
          {analysis.title}
        </h1>
        <p className="font-body text-muted-foreground mt-2 text-sm">
          {analysis.artist} · {analysis.date}
        </p>
        <p className="font-body text-muted-foreground mt-1 text-xs flex items-center justify-center gap-1">
          <Crosshair className="w-3 h-3" />
          Click anywhere on the painting to analyze that area
        </p>
      </header>

      <div className="flex justify-center px-4 mb-12">
        <div
          ref={imgRef}
          className="relative inline-block max-w-[80vw] cursor-crosshair"
          onClick={handleImageClick}
        >
          <img
            src={imageUrl}
            alt={analysis.title}
            className="w-full h-auto rounded gold-border"
          />
          {analysis.figures.map((figure, i) => (
            <FigureMarker
              key={i}
              figure={figure}
              onClick={() => {
                setCustomFigure(null);
                setCustomClickPos(null);
                setSelectedFigureIndex(i);
              }}
              isActive={walkthrough.activeFigureIndex === i}
            />
          ))}
          {/* Custom click marker */}
          {customClickPos && (
            <div
              className="absolute pointer-events-none"
              style={{
                left: `${customClickPos.x}%`,
                top: `${customClickPos.y}%`,
                transform: "translate(-50%, -50%)",
              }}
            >
              {isAnalyzingRegion ? (
                <Loader2 className="w-6 h-6 text-gold animate-spin" />
              ) : (
                <span className="block w-[18px] h-[18px] rounded-full border-2 border-parchment bg-accent animate-pulse-gold" />
              )}
            </div>
          )}
        </div>
      </div>

      <section className="max-w-3xl mx-auto px-6 pb-16">
        <h2 className="font-display text-2xl md:text-3xl font-semibold text-walnut mb-6">
          About This Work
        </h2>
        <div className="gold-border rounded bg-parchment/60 p-6 md:p-8">
          {analysis.paintingOverview.split("\n\n").map((para, i) => (
            <p
              key={i}
              className="font-body text-foreground leading-[1.85] text-[15px] mb-4 last:mb-0"
            >
              {para}
            </p>
          ))}
        </div>
        <div className="flex justify-center mt-10">
          <button
            onClick={onReset}
            className="font-body text-sm text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors"
          >
            Analyze another painting
          </button>
        </div>
      </section>

      {activeFigure && (
        <FigureThread
          figure={activeFigure}
          onClose={() => {
            if (isCustom) {
              closeCustomFigure();
            } else {
              setSelectedFigureIndex(null);
            }
          }}
          voice={selectedVoice}
          voices={voices}
          onVoiceChange={setSelectedVoice}
        />
      )}

      <AudioWalkthrough
        state={walkthrough.state}
        currentLabel={walkthrough.currentLabel}
        currentSectionIndex={walkthrough.currentSectionIndex}
        totalSections={walkthrough.totalSections}
        onPlay={walkthrough.play}
        onPause={walkthrough.pause}
        onStop={walkthrough.stop}
        voices={voices}
        selectedVoice={selectedVoice}
        onVoiceChange={setSelectedVoice}
      />
    </div>
  );
};

export default PaintingView;
