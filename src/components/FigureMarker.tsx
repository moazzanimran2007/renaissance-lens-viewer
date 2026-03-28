import { Figure } from "@/types/analysis";

interface FigureMarkerProps {
  figure: Figure;
  onClick: () => void;
  isActive?: boolean;
}

const FigureMarker = ({ figure, onClick, isActive }: FigureMarkerProps) => {
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
      <span className={`absolute inset-0 w-[18px] h-[18px] rounded-full animate-sonar ${isActive ? "bg-gold/70" : "bg-gold/40"}`} />
      {/* Dot */}
      <span className={`relative block w-[18px] h-[18px] rounded-full border-2 border-parchment cursor-pointer transition-all duration-200 group-hover:scale-125 ${isActive ? "bg-gold scale-150 gold-glow" : "bg-gold animate-pulse-gold"}`} />
      {/* Tooltip */}
      <span className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1 bg-walnut text-parchment font-display text-sm rounded whitespace-nowrap transition-opacity duration-200 pointer-events-none ${isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
        {figure.label}
      </span>
    </button>
  );
};

export default FigureMarker;
