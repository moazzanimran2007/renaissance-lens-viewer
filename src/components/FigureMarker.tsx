import { Figure } from "@/types/analysis";

interface FigureMarkerProps {
  figure: Figure;
  onClick: () => void;
}

const FigureMarker = ({ figure, onClick }: FigureMarkerProps) => {
  return (
    <button
      className="absolute group"
      style={{
        left: `${figure.position.x}%`,
        top: `${figure.position.y}%`,
        transform: "translate(-50%, -50%)",
      }}
      onClick={onClick}
      aria-label={`View details about ${figure.label}`}
    >
      {/* Sonar ring */}
      <span className="absolute inset-0 w-[18px] h-[18px] rounded-full bg-gold/40 animate-sonar" />
      {/* Dot */}
      <span className="relative block w-[18px] h-[18px] rounded-full bg-gold border-2 border-parchment animate-pulse-gold cursor-pointer transition-transform duration-200 group-hover:scale-125" />
      {/* Tooltip */}
      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1 bg-walnut text-parchment font-display text-sm rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
        {figure.label}
      </span>
    </button>
  );
};

export default FigureMarker;
