import { Play, Pause, Square, Volume2 } from "lucide-react";
import { WalkthroughState } from "@/hooks/useAudioWalkthrough";

interface AudioWalkthroughProps {
  state: WalkthroughState;
  currentLabel: string;
  currentSectionIndex: number;
  totalSections: number;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
}

const AudioWalkthrough = ({
  state,
  currentLabel,
  currentSectionIndex,
  totalSections,
  onPlay,
  onPause,
  onStop,
}: AudioWalkthroughProps) => {
  const progress = totalSections > 0 ? ((currentSectionIndex + 1) / totalSections) * 100 : 0;

  if (state === "idle") {
    return (
      <button
        onClick={onPlay}
        className="fixed bottom-6 right-6 z-30 flex items-center gap-2 px-5 py-3 rounded-full gold-border bg-parchment/95 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 group gold-glow"
      >
        <Volume2 className="w-5 h-5 text-walnut group-hover:text-gold transition-colors" />
        <span className="font-display text-sm font-semibold text-walnut">Audio Walkthrough</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-30 w-72 rounded-lg gold-border bg-parchment/95 backdrop-blur-sm shadow-xl overflow-hidden">
      {/* Progress bar */}
      <div className="h-1 bg-secondary">
        <div
          className="h-full bg-gold transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="p-4">
        {/* Current section label */}
        <p className="font-display text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
          Now narrating
        </p>
        <p className="font-display text-sm font-semibold text-walnut truncate mb-3">
          {currentLabel}
        </p>

        {/* Controls */}
        <div className="flex items-center gap-2">
          {state === "playing" ? (
            <button
              onClick={onPause}
              className="flex items-center justify-center w-9 h-9 rounded-full bg-gold/20 hover:bg-gold/30 transition-colors"
              aria-label="Pause"
            >
              <Pause className="w-4 h-4 text-walnut" />
            </button>
          ) : (
            <button
              onClick={onPlay}
              className="flex items-center justify-center w-9 h-9 rounded-full bg-gold/20 hover:bg-gold/30 transition-colors"
              aria-label="Resume"
            >
              <Play className="w-4 h-4 text-walnut" />
            </button>
          )}
          <button
            onClick={onStop}
            className="flex items-center justify-center w-9 h-9 rounded-full bg-gold/20 hover:bg-gold/30 transition-colors"
            aria-label="Stop"
          >
            <Square className="w-4 h-4 text-walnut" />
          </button>
          <span className="ml-auto font-body text-xs text-muted-foreground">
            {currentSectionIndex + 1} / {totalSections}
          </span>
        </div>
      </div>
    </div>
  );
};

export default AudioWalkthrough;
