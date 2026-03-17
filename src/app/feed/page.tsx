import Link from "next/link";
import { prisma } from "@/lib/db";
import { getMascot, clamp } from "@/lib/scoring";
import { SECTIONS, getSection } from "@/lib/sections";
import SpectrumDisplay from "@/components/SpectrumDisplay";
import AdSlot from "@/components/AdSlot";

export const dynamic = "force-dynamic";

const SECTION_COLORS: Record<string, string> = {
  general: "#1A1A2E", news: "#1A1A2E", entertainment: "#6B4E71",
  viral: "#E07A5F", food: "#6B9E78", business: "#4A6FA5",
  academic: "#2D6A4F", creative: "#C17B74", health: "#5B9E9E",
};

export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<{ section?: string }>;
}) {
  const { section: rawSection } = await searchParams;
  const activeSection = rawSection ?? "all";

  const where =
    activeSection !== "all" ? { section: activeSection } : {};

  const items = await prisma.content.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { _count: { select: { comments: true, votes: true } } },
  });

  return (
    <div className="min-h-screen bg-paper px-4 py-12">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="font-serif text-3xl font-semibold text-navy mb-2">Community Feed</h1>
          <p className="text-grey">
            Every piece of content the community has submitted for a second opinion.
          </p>
        </div>

        {/* Section filter tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-8">
          <Link
            href="/feed"
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all border ${
              activeSection === "all"
                ? "bg-navy text-white border-navy"
                : "bg-card border-border-warm text-grey hover:text-navy hover:border-navy"
            }`}
          >
            🌐 All
          </Link>
          {SECTIONS.filter((s) => s.id !== "general").map((section) => {
            const sectionColor = SECTION_COLORS[section.id] ?? "#1A1A2E";
            return (
              <Link
                key={section.id}
                href={`/feed?section=${section.id}`}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all border ${
                  activeSection === section.id
                    ? "text-white border-transparent"
                    : "bg-card border-border-warm text-grey hover:text-navy"
                }`}
                style={
                  activeSection === section.id
                    ? { background: sectionColor, borderColor: sectionColor }
                    : {}
                }
              >
                {section.emoji} {section.label}
              </Link>
            );
          })}
        </div>

        <div className="mb-6">
          <AdSlot slot="feed-top" size="leaderboard" />
        </div>

        {items.length === 0 && (
          <div className="text-center py-20">
            <span className="text-4xl mb-4 block">🦾</span>
            <p className="text-grey mb-4">Nothing analyzed yet in this category.</p>
            <Link href="/" className="text-human hover:underline text-sm">
              Be the first to submit content →
            </Link>
          </div>
        )}

        <div className="space-y-4">
          {items.map((item) => {
            const aiScore = clamp(item.algorithmScore);
            const mascot = getMascot(aiScore);
            const section = getSection(item.section ?? "general");
            const sectionColor = SECTION_COLORS[item.section ?? "general"] ?? "#1A1A2E";

            return (
              <Link
                key={item.id}
                href={`/result/${item.id}`}
                className="block warm-card p-5 group"
              >
                <div className="flex items-start gap-4">
                  <span className="text-3xl shrink-0 mt-0.5">{mascot.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="font-mono text-2xl font-bold tabular-nums text-navy">
                        {aiScore}%
                      </span>
                      <span className="text-sm text-grey">
                        {mascot.name}
                      </span>
                      <span
                        className="ml-auto text-xs px-2 py-0.5 rounded-full font-medium border"
                        style={{
                          color: sectionColor,
                          background: `${sectionColor}12`,
                          borderColor: `${sectionColor}30`,
                        }}
                      >
                        {section.emoji} {section.label}
                      </span>
                    </div>

                    <SpectrumDisplay score={aiScore} size="sm" />

                    {item.excerpt && (
                      <p className="text-xs text-grey mt-2 truncate font-mono">
                        {item.excerpt.slice(0, 80)}
                      </p>
                    )}

                    <div className="flex items-center gap-3 mt-3 text-xs text-grey">
                      <span>{item._count.votes} votes</span>
                      <span>·</span>
                      <span>{item._count.comments} comments</span>
                      <span>·</span>
                      <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                      {item.communityScore !== null && (
                        <>
                          <span>·</span>
                          <span className="text-human font-medium">
                            Community: {Math.round(item.communityScore)}%
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
