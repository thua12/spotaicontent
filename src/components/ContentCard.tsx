import Link from "next/link";
import { getMascot, clamp, markerLeft } from "@/lib/scoring";
import { getSection } from "@/lib/sections";

interface ContentCardProps {
  id: string;
  contentType: string;
  section: string;
  excerpt: string | null;
  url: string | null;
  algorithmScore: number;
  communityScore: number | null;
  voteCount: number;
  commentCount: number;
  createdAt: Date;
  urgentVote?: boolean;
}

const SECTION_COLORS: Record<string, string> = {
  general: "#1A1A2E", news: "#1A1A2E", entertainment: "#6B4E71",
  viral: "#E07A5F", food: "#6B9E78", business: "#4A6FA5",
  academic: "#2D6A4F", creative: "#C17B74", health: "#5B9E9E",
};

export default function ContentCard({ id, section, excerpt, algorithmScore, communityScore, voteCount, createdAt, urgentVote }: ContentCardProps) {
  const aiScore = clamp(algorithmScore);
  const mascot = getMascot(aiScore);
  const sectionData = getSection(section);
  const sectionColor = SECTION_COLORS[section] ?? "#1A1A2E";
  const pct = markerLeft(aiScore);
  const isContested = communityScore !== null && Math.abs(aiScore - Math.round(communityScore)) >= 15;
  const isNew = Date.now() - new Date(createdAt).getTime() < 1000 * 60 * 60 * 6;

  return (
    <div className={`warm-card w-72 shrink-0 flex flex-col${urgentVote ? " border-middle/40" : ""}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-semibold uppercase tracking-wide" style={{ color: sectionColor }}>
            {sectionData.emoji} {sectionData.label}
          </span>
        </div>
        <div className="flex gap-1">
          {isContested && <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "#FFF3E0", color: "#F4A261" }}>🔥 Disputed</span>}
          {isNew && !isContested && <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "#E8F5E9", color: "#2D6A4F" }}>NEW</span>}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-3 flex-1">
        <div className="flex items-start gap-2 mb-2">
          <span className="text-2xl shrink-0">{mascot.emoji}</span>
          <p className="font-serif text-navy text-sm font-medium leading-snug line-clamp-2">
            {excerpt ? excerpt.slice(0, 90) : "Content submitted for analysis"}
          </p>
        </div>
        <p className="text-xs text-grey mb-3 font-mono">{new Date(createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>

        {/* Spectrum */}
        <div className="relative mb-1.5">
          <div className="h-3 spectrum-bar w-full" />
          <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 transition-all duration-500" style={{ left: `${pct}%` }}>
            <div className="w-4 h-4 rounded-full bg-white border-2 border-navy shadow-sm" />
          </div>
        </div>
        <div className="flex justify-between text-[10px] text-grey mb-2">
          <span style={{ color: "#E63946" }}>AI</span>
          <span className="font-mono font-medium text-navy">{aiScore}%</span>
          <span style={{ color: "#2D6A4F" }}>Human</span>
        </div>

        {/* Scores */}
        <div className="text-xs text-grey space-y-0.5">
          <div className="flex items-center justify-between">
            <span>🤖 Algorithm</span>
            <span className="font-mono font-medium text-navy">{aiScore}% AI</span>
          </div>
          {communityScore !== null && (
            <div className="flex items-center justify-between">
              <span>👥 Community</span>
              <span className="font-mono font-medium text-navy">{Math.round(communityScore)}% AI ({voteCount} votes)</span>
            </div>
          )}
          {communityScore === null && voteCount > 0 && (
            <p className="text-[10px] text-grey">{voteCount} vote{voteCount > 1 ? "s" : ""} · {10 - voteCount} more needed for consensus</p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 pb-4 flex flex-col gap-2 mt-auto">
        {urgentVote && (
          <p className="text-[10px] font-medium" style={{ color: "#F4A261" }}>
            Only {voteCount} vote{voteCount === 1 ? "" : "s"} so far
          </p>
        )}
        <div className="flex gap-2 items-center">
          <Link href={`/result/${id}`}
            className="flex-1 text-center py-2 rounded-btn text-xs font-semibold bg-navy text-white hover:bg-navy-light transition-colors">
            Vote Now
          </Link>
          <Link href={`/result/${id}`}
            className="flex-1 text-center py-2 rounded-btn text-xs font-semibold border border-border-warm text-grey hover:text-navy hover:border-navy transition-colors">
            Read More →
          </Link>
        </div>
        <p className="text-[10px] text-grey text-center">
          {voteCount > 0 ? `${voteCount} votes` : "No votes yet"}
        </p>
      </div>
    </div>
  );
}
