import { useState, useEffect, useCallback } from "react";
import { X, Volume2, Pause, Square } from "lucide-react";
import { Figure } from "@/types/analysis";

interface FigurePanelProps {
  figure: Figure;
  onClose: () => void;
}

type PlayState = "idle" | "playing" | "paused";

const FigurePanel = ({ figure, onClose }: FigurePanelProps) => {
  const storyText = figure.biography || figure.description;
  const paragraphs = storyText.split("\n\n").filter(Boolean);
  const [playState, setPlayState] = useState<PlayState>("idle");

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    setPlayState("idle");
  }, []);

  const play = useCallback(() => {
    if (playState === "paused") {
      window.speechSynthesis.resume();
      setPlayState("playing");
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(
      `${figure.label}. ${storyText.replace(/\n\n/g, " ")}`
    );
    utterance.rate = 0.95;
    utterance.onend = () => setPlayState("idle");
    utterance.onerror = (e) => {
      if (e.error !== "interrupted" && e.error !== "canceled") {
        setPlayState("idle");
      }
    };
    window.speechSynthesis.speak(utterance);
    setPlayState("playing");
  }, [playState, figure.label, storyText]);

  const pause = useCallback(() => {
    window.speechSynthesis.pause();
    setPlayState("paused");
  }, []);

  // Cleanup on unmount / figure change
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, [figure.label]);

  return (
    <>
      <div className="fixed inset-0 z-40 bg-ink/30" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md parchment-texture gold-border border-r-0 border-t-0 border-b-0 animate-slide-in-right overflow-y-auto">
        <div className="p-8">
          <button
            onClick={onClose}
            className="absolute top-6 right-6 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close panel"
          >
            <X className="w-5 h-5" />
          </button>

          <h2 className="font-display text-3xl font-semibold text-walnut mb-4 pr-8">
            {figure.label}
          </h2>

          <span
            className={`inline-block px-3 py-1 rounded-sm text-xs font-body font-medium tracking-wide uppercase mb-6 ${
              figure.isRealPerson
                ? "bg-gold/20 text-walnut border border-gold/40"
                : "bg-secondary text-secondary-foreground border border-border"
            }`}
          >
            {figure.isRealPerson ? "Historical Person" : "Allegorical Figure"}
          </span>

          <div className="w-16 h-px bg-gold/40 mb-6" />

          {/* Short description */}
          <p className="font-body text-muted-foreground italic text-sm leading-relaxed mb-6">
            {figure.description}
          </p>

          {/* Full biography */}
          {figure.biography && (
            <>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-px flex-1 bg-gold/30" />
                <span className="font-display text-xs uppercase tracking-widest text-gold">Full Story</span>
                <div className="h-px flex-1 bg-gold/30" />
              </div>

              {/* Audio controls */}
              <div className="flex items-center gap-2 mb-6">
                {playState === "idle" && (
                  <button
                    onClick={play}
                    className="flex items-center gap-2 px-4 py-2 rounded-sm bg-gold/15 text-walnut border border-gold/30 hover:bg-gold/25 transition-colors font-body text-sm"
                  >
                    <Volume2 className="w-4 h-4" />
                    Listen to Story
                  </button>
                )}
                {playState === "playing" && (
                  <>
                    <button
                      onClick={pause}
                      className="flex items-center gap-2 px-4 py-2 rounded-sm bg-gold/15 text-walnut border border-gold/30 hover:bg-gold/25 transition-colors font-body text-sm"
                    >
                      <Pause className="w-4 h-4" />
                      Pause
                    </button>
                    <button
                      onClick={stop}
                      className="flex items-center gap-2 px-3 py-2 rounded-sm text-muted-foreground hover:text-foreground transition-colors font-body text-sm"
                    >
                      <Square className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-xs text-gold/70 font-body italic ml-1 animate-pulse">
                      Reading…
                    </span>
                  </>
                )}
                {playState === "paused" && (
                  <>
                    <button
                      onClick={play}
                      className="flex items-center gap-2 px-4 py-2 rounded-sm bg-gold/15 text-walnut border border-gold/30 hover:bg-gold/25 transition-colors font-body text-sm"
                    >
                      <Volume2 className="w-4 h-4" />
                      Resume
                    </button>
                    <button
                      onClick={stop}
                      className="flex items-center gap-2 px-3 py-2 rounded-sm text-muted-foreground hover:text-foreground transition-colors font-body text-sm"
                    >
                      <Square className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-xs text-muted-foreground font-body italic ml-1">
                      Paused
                    </span>
                  </>
                )}
              </div>

              {paragraphs.map((para, i) => (
                <p
                  key={i}
                  className="font-body text-foreground leading-[1.85] text-[15px] mb-4 last:mb-0"
                >
                  {para}
                </p>
              ))}
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default FigurePanel;
