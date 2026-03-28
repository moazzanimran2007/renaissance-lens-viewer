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
  voices: SpeechSynthesisVoice[];
  selectedVoice: SpeechSynthesisVoice | null;
  onVoiceChange: (voice: SpeechSynthesisVoice) => void;
}

const AudioWalkthrough = ({
  state,
  currentLabel,
  currentSectionIndex,
  totalSections,
  onPlay,
  onPause,
  onStop,
  voices,
  selectedVoice,
  onVoiceChange,
}: AudioWalkthroughProps) => {
  const progress = totalSections > 0 ? ((currentSectionIndex + 1) / totalSections) * 100 : 0;

  const voiceSelect = voices.length > 1 && (
    <select
      value={selectedVoice?.name || ""}
      onChange={(e) => {
        const v = voices.find((x) => x.name === e.target.value);
        if (v) onVoiceChange(v);
      }}
      className="w-full text-xs font-body bg-parchment/80 border border-gold/30 rounded-sm px-2 py-1.5 text-walnut focus:outline-none focus:border-gold/60"
    >
      {voices.map((v) => (
        <option key={v.name} value={v.name}>
          {v.name} {v.lang ? `(${v.lang})` : ""}
        </option>
      ))}
    </select>
  );

  if (state === "idle") {
    return (
      <div className="fixed bottom-6 right-6 z-30 flex flex-col items-end gap-2">
        {voices.length > 1 && (
          <div className="w-64 rounded-lg gold-border bg-parchment/95 backdrop-blur-sm p-3">
            <label className="font-display text-xs uppercase tracking-widest text-gold mb-1.5 block">
              Voice
            </label>
            {voiceSelect}
          </div>
        )}
        <button
          onClick={onPlay}
          className="flex items-center gap-2 px-5 py-3 rounded-full gold-border bg-parchment/95 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 group gold-glow"
        >
          <Volume2 className="w-5 h-5 text-walnut group-hover:text-gold transition-colors" />
          <span className="font-display text-sm font-semibold text-walnut">Audio Walkthrough</span>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-30 w-72 rounded-lg gold-border bg-parchment/95 backdrop-blur-sm shadow-xl overflow-hidden">
      <div className="h-1 bg-secondary">
        <div
          className="h-full bg-gold transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="p-4">
        <p className="font-display text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
          Now narrating
        </p>
        <p className="font-display text-sm font-semibold text-walnut truncate mb-3">
          {currentLabel}
        </p>

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
