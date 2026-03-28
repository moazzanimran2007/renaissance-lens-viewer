import { useState, useRef } from "react";
import { AnalysisResult } from "@/types/analysis";
import FigureMarker from "./FigureMarker";
import FigurePanel from "./FigurePanel";
import AudioWalkthrough from "./AudioWalkthrough";
import { useAudioWalkthrough } from "@/hooks/useAudioWalkthrough";

interface PaintingViewProps {
  imageUrl: string;
  analysis: AnalysisResult;
  onReset: () => void;
}

const PaintingView = ({ imageUrl, analysis, onReset }: PaintingViewProps) => {
  const [selectedFigureIndex, setSelectedFigureIndex] = useState<number | null>(null);
  const imgRef = useRef<HTMLDivElement>(null);
  const walkthrough = useAudioWalkthrough(analysis);

  return (
    <div className="min-h-screen parchment-texture">
      <header className="text-center pt-10 pb-6 px-6">
        <h1 className="font-display text-3xl md:text-4xl font-semibold text-walnut">
          {analysis.title}
        </h1>
        <p className="font-body text-muted-foreground mt-2 text-sm">
          {analysis.artist} · {analysis.date}
        </p>
      </header>

      <div className="flex justify-center px-4 mb-12">
        <div ref={imgRef} className="relative inline-block max-w-[80vw]">
          <img
            src={imageUrl}
            alt={analysis.title}
            className="w-full h-auto rounded gold-border"
          />
          {analysis.figures.map((figure, i) => (
            <FigureMarker
              key={i}
              figure={figure}
              onClick={() => setSelectedFigureIndex(i)}
              isActive={walkthrough.activeFigureIndex === i}
            />
          ))}
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

      {selectedFigureIndex !== null && (
        <FigurePanel
          figure={analysis.figures[selectedFigureIndex]}
          onClose={() => setSelectedFigureIndex(null)}
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
      />
    </div>
  );
};

export default PaintingView;
