import { useState, useRef, useCallback } from "react";
import { AnalysisResult, Figure } from "@/types/analysis";
import { supabase } from "@/integrations/supabase/client";
import FigureMarker from "./FigureMarker";
import FigureThread from "./FigureThread";
import AudioWalkthrough from "./AudioWalkthrough";
import { useAudioWalkthrough } from "@/hooks/useAudioWalkthrough";
import { useTTSVoices } from "@/hooks/useTTSVoices";
import { Loader2, MousePointerSquareDashed } from "lucide-react";
import { toast } from "sonner";

interface PaintingViewProps {
  imageUrl: string;
  analysis: AnalysisResult;
  onReset: () => void;
}

interface SelectionRect {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

function normalizeRect(r: SelectionRect) {
  return {
    x1: Math.min(r.startX, r.endX),
    y1: Math.min(r.startY, r.endY),
    x2: Math.max(r.startX, r.endX),
    y2: Math.max(r.startY, r.endY),
  };
}

const PaintingView = ({ imageUrl, analysis, onReset }: PaintingViewProps) => {
  const [selectedFigureIndex, setSelectedFigureIndex] = useState<number | null>(null);
  const [customFigure, setCustomFigure] = useState<Figure | null>(null);
  const [isAnalyzingRegion, setIsAnalyzingRegion] = useState(false);
  const [selection, setSelection] = useState<SelectionRect | null>(null);
  const [confirmedSelection, setConfirmedSelection] = useState<SelectionRect | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);
  const { voices, selectedVoice, setSelectedVoice } = useTTSVoices();
  const walkthrough = useAudioWalkthrough(analysis, selectedVoice);

  const getPercentPos = useCallback((e: React.MouseEvent) => {
    const rect = imgRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100)),
      y: Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100)),
    };
  }, []);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if ((e.target as HTMLElement).closest("button")) return;
      const pos = getPercentPos(e);
      setSelection({ startX: pos.x, startY: pos.y, endX: pos.x, endY: pos.y });
      setIsDragging(true);
      setConfirmedSelection(null);
      setCustomFigure(null);
    },
    [getPercentPos]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isDragging || !selection) return;
      const pos = getPercentPos(e);
      setSelection((prev) => prev ? { ...prev, endX: pos.x, endY: pos.y } : null);
    },
    [isDragging, selection, getPercentPos]
  );

  const handleMouseUp = useCallback(async () => {
    if (!isDragging || !selection) return;
    setIsDragging(false);

    const norm = normalizeRect(selection);
    const width = norm.x2 - norm.x1;
    const height = norm.y2 - norm.y1;

    // Ignore tiny selections (accidental clicks)
    if (width < 3 && height < 3) {
      setSelection(null);
      return;
    }

    setConfirmedSelection(selection);
    setSelectedFigureIndex(null);
    setIsAnalyzingRegion(true);

    const centerX = Math.round((norm.x1 + norm.x2) / 2);
    const centerY = Math.round((norm.y1 + norm.y2) / 2);

    try {
      // Crop the selected region from the image and send only that portion
      const croppedBase64 = await cropImageRegion(imageUrl, norm);

      const { data, error } = await supabase.functions.invoke("analyze-region", {
        body: {
          image: croppedBase64,
          x: 50,
          y: 50,
          regionBounds: { x1: 0, y1: 0, x2: 100, y2: 100 },
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
        position: { x: centerX, y: centerY },
      };

      setCustomFigure(figure);
    } catch (err: any) {
      console.error("Region analysis error:", err);
      toast.error("Could not analyze that area. Try again.");
      setConfirmedSelection(null);
      setSelection(null);
    } finally {
      setIsAnalyzingRegion(false);
    }
  }, [isDragging, selection, imageUrl, analysis.title, analysis.artist]);

  const closeCustomFigure = useCallback(() => {
    setCustomFigure(null);
    setConfirmedSelection(null);
    setSelection(null);
  }, []);

  const activeFigure = selectedFigureIndex !== null ? analysis.figures[selectedFigureIndex] : customFigure;
  const isCustom = selectedFigureIndex === null && customFigure !== null;

  // Rectangle to render (during drag or after confirmation)
  const visibleRect = isDragging ? selection : confirmedSelection;
  const normRect = visibleRect ? normalizeRect(visibleRect) : null;

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
          <MousePointerSquareDashed className="w-3 h-3" />
          Click &amp; drag on the painting to select an area to analyze
        </p>
      </header>

      <div className="flex justify-center px-4 mb-12">
        <div
          ref={imgRef}
          className="relative inline-block max-w-[80vw] cursor-crosshair select-none"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => {
            if (isDragging) handleMouseUp();
          }}
        >
          <img
            src={imageUrl}
            alt={analysis.title}
            className="w-full h-auto rounded gold-border pointer-events-none"
            draggable={false}
          />
          {analysis.figures.map((figure, i) => (
            <FigureMarker
              key={i}
              figure={figure}
              onClick={() => {
                setCustomFigure(null);
                setConfirmedSelection(null);
                setSelection(null);
                setSelectedFigureIndex(i);
              }}
              isActive={walkthrough.activeFigureIndex === i}
            />
          ))}

          {/* Selection rectangle */}
          {normRect && (
            <div
              className="absolute border-2 border-gold/70 bg-gold/10 rounded-sm pointer-events-none transition-none"
              style={{
                left: `${normRect.x1}%`,
                top: `${normRect.y1}%`,
                width: `${normRect.x2 - normRect.x1}%`,
                height: `${normRect.y2 - normRect.y1}%`,
              }}
            >
              {isAnalyzingRegion && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-gold animate-spin" />
                </div>
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
            if (isCustom) closeCustomFigure();
            else setSelectedFigureIndex(null);
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
