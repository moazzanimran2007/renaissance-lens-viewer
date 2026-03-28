import { X } from "lucide-react";
import { Figure } from "@/types/analysis";

interface FigurePanelProps {
  figure: Figure;
  onClose: () => void;
}

const FigurePanel = ({ figure, onClose }: FigurePanelProps) => {
  const storyText = figure.biography || figure.description;
  const paragraphs = storyText.split("\n\n").filter(Boolean);

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
              <div className="flex items-center gap-3 mb-6">
                <div className="h-px flex-1 bg-gold/30" />
                <span className="font-display text-xs uppercase tracking-widest text-gold">Full Story</span>
                <div className="h-px flex-1 bg-gold/30" />
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
