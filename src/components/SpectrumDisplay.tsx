import { markerLeft, scoreLabel } from "@/lib/scoring";

interface SpectrumDisplayProps {
  score: number;
  size?: "sm" | "md" | "lg";
}

export default function SpectrumDisplay({ score, size = "md" }: SpectrumDisplayProps) {
  const pct = markerLeft(score);
  const label = scoreLabel(score);
  const trackH = size === "lg" ? "h-5" : size === "sm" ? "h-3" : "h-4";
  const dotSize = size === "lg" ? "w-7 h-7" : size === "sm" ? "w-4 h-4" : "w-5 h-5";

  return (
    <div className="w-full">
      <div className="relative">
        <div className={`spectrum-bar w-full ${trackH}`} />
        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 transition-all duration-700" style={{ left: `${pct}%` }}>
          <div className={`${dotSize} rounded-full bg-white border-2 border-navy shadow-sm`} />
        </div>
      </div>
      <div className="flex justify-between mt-1">
        <span className={`${size === "sm" ? "text-[10px]" : "text-xs"} font-medium`} style={{ color: "#E63946" }}>AI</span>
        <span className={`${size === "sm" ? "text-[10px]" : "text-xs"} font-medium text-grey`}>{label}</span>
        <span className={`${size === "sm" ? "text-[10px]" : "text-xs"} font-medium`} style={{ color: "#2D6A4F" }}>Human</span>
      </div>
    </div>
  );
}
