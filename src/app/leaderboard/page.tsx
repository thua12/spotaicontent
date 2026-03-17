import { prisma } from "@/lib/db";
import { trustLabel, trustColor } from "@/lib/trust";
import { SECTIONS } from "@/lib/sections";
import Link from "next/link";
import { Trophy, Users, Medal } from "lucide-react";
import Image from "next/image";

export const dynamic = "force-dynamic";

const SECTION_COLORS: Record<string, string> = {
  general: "#1A1A2E", news: "#1A1A2E", entertainment: "#6B4E71",
  viral: "#E07A5F", food: "#6B9E78", business: "#4A6FA5",
  academic: "#2D6A4F", creative: "#C17B74", health: "#5B9E9E",
};

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ section?: string }>;
}) {
  const { section: activeSection } = await searchParams;
  const currentSection = activeSection ?? "all";

  const topVoters = await prisma.user.findMany({
    include: {
      _count: { select: { votes: true, comments: true } },
      trustScore: true,
    },
    orderBy: { votes: { _count: "desc" } },
    take: 20,
  });

  // Filter for section tabs — get top 5 by vote count per section
  const sectionLeaders: Record<string, typeof topVoters> = {};
  for (const section of SECTIONS.filter((s) => s.id !== "general")) {
    const voters = await prisma.user.findMany({
      where: {
        votes: {
          some: { content: { section: section.id } },
        },
      },
      include: {
        _count: { select: { votes: true, comments: true } },
        trustScore: true,
      },
      take: 5,
    });
    sectionLeaders[section.id] = voters;
  }

  const displayList =
    currentSection === "all"
      ? topVoters
      : (sectionLeaders[currentSection] ?? []);

  return (
    <div className="min-h-screen bg-paper px-4 py-12">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-10 flex items-center gap-4">
          <div className="w-12 h-12 rounded-card bg-highlight flex items-center justify-center shadow-card">
            <Trophy className="w-6 h-6 text-navy" />
          </div>
          <div>
            <h1 className="font-serif text-3xl font-semibold text-navy">Leaderboard</h1>
            <p className="text-grey text-sm mt-0.5">
              Top community contributors by votes cast
            </p>
          </div>
        </div>

        {/* Section filter tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-8">
          <Link
            href="/leaderboard"
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all border ${
              currentSection === "all"
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
                href={`/leaderboard?section=${section.id}`}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all border ${
                  currentSection === section.id
                    ? "text-white border-transparent"
                    : "bg-card border-border-warm text-grey hover:text-navy"
                }`}
                style={
                  currentSection === section.id
                    ? { background: sectionColor, borderColor: sectionColor }
                    : {}
                }
              >
                {section.emoji} {section.label}
              </Link>
            );
          })}
        </div>

        {/* Leaderboard */}
        {displayList.length === 0 ? (
          <div className="text-center py-20">
            <Users className="w-12 h-12 text-grey mx-auto mb-4" />
            <p className="text-grey mb-2">No contributors yet in this section.</p>
            <Link href="/" className="text-human hover:underline text-sm">
              Be the first to vote →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {displayList.map((user, idx) => {
              const trust = user.trustScore?.score ?? 50;
              const tLabel = trustLabel(trust);
              const tColor = trustColor(trust);
              const medal =
                idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : null;

              return (
                <Link
                  key={user.id}
                  href={`/profile/${user.id}`}
                  className="flex items-center gap-4 p-4 warm-card group"
                >
                  {/* Rank */}
                  <div className="w-8 text-center shrink-0">
                    {medal ? (
                      <span className="text-xl">{medal}</span>
                    ) : (
                      <span className="text-grey font-mono text-sm">
                        #{idx + 1}
                      </span>
                    )}
                  </div>

                  {/* Avatar */}
                  <div className="shrink-0">
                    {user.image ? (
                      <Image
                        src={user.image}
                        alt={user.name ?? "User"}
                        width={40}
                        height={40}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-highlight flex items-center justify-center text-navy font-bold text-sm">
                        {(user.name ?? "?")[0].toUpperCase()}
                      </div>
                    )}
                  </div>

                  {/* Name + trust */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-navy truncate">
                        {user.name ?? "Anonymous"}
                      </span>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-medium border"
                        style={{
                          color: tColor,
                          borderColor: `${tColor}40`,
                          background: `${tColor}15`,
                        }}
                      >
                        {tLabel}
                      </span>
                    </div>
                    <p className="text-xs text-grey mt-0.5">
                      {user._count.votes} votes · {user._count.comments} comments
                    </p>
                  </div>

                  {/* Trust score */}
                  <div className="shrink-0 text-right">
                    <div
                      className="text-xl font-bold font-mono tabular-nums"
                      style={{ color: tColor }}
                    >
                      {trust}
                    </div>
                    <div className="text-xs text-grey">trust</div>
                  </div>

                  <Medal className="w-4 h-4 text-grey opacity-0 group-hover:opacity-100 transition shrink-0" />
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
