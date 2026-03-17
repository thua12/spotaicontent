import Link from "next/link";
import { getMascot, clamp } from "@/lib/scoring";

interface StoryItem {
  id: string;
  excerpt: string | null;
  algorithmScore: number;
  communityScore: number | null;
}

interface StoriesBarProps {
  items: StoryItem[];
}

export default function StoriesBar({ items }: StoriesBarProps) {
  if (items.length === 0) return null;

  return (
    <div className="border-b border-border-warm bg-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex gap-4 overflow-x-auto py-4 scrollbar-thin">
          {items.map((item) => {
            const aiScore = clamp(item.algorithmScore);
            const mascot = getMascot(aiScore);
            const isContested = item.communityScore !== null && Math.abs(aiScore - Math.round(item.communityScore)) >= 15;
            return (
              <Link key={item.id} href={`/result/${item.id}`}
                className="flex flex-col items-center gap-1.5 shrink-0 group cursor-pointer">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl border-[3px] transition-all ${isContested ? "border-middle" : "border-human"} group-hover:scale-105`}
                  style={{ background: isContested ? "#FFF3E0" : "#E8F5E9" }}>
                  {mascot.emoji}
                </div>
                <p className="text-[10px] text-grey text-center w-14 truncate font-medium">
                  {item.excerpt ? item.excerpt.slice(0, 12) + "…" : mascot.name}
                </p>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
