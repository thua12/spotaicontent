import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { trustLabel, trustColor } from "@/lib/trust";
import { getSection } from "@/lib/sections";
import { getMascot, clamp } from "@/lib/scoring";
import Link from "next/link";
import Image from "next/image";
import { CalendarDays, MessageSquare, ThumbsUp, FileText } from "lucide-react";

export const dynamic = "force-dynamic";

const SECTION_COLORS: Record<string, string> = {
  general: "#1A1A2E", news: "#1A1A2E", entertainment: "#6B4E71",
  viral: "#E07A5F", food: "#6B9E78", business: "#4A6FA5",
  academic: "#2D6A4F", creative: "#C17B74", health: "#5B9E9E",
};

function scoreDisplayColor(score: number): string {
  if (score <= 30) return "#2D6A4F";
  if (score <= 54) return "#F4A261";
  return "#E63946";
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ user: string }>;
}) {
  const { user: userId } = await params;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      trustScore: true,
      votes: {
        include: { content: true },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      comments: {
        include: { content: true },
        orderBy: { createdAt: "desc" },
        take: 5,
      },
      content: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      _count: { select: { votes: true, comments: true, content: true } },
    },
  });

  if (!user) notFound();

  const trust = user.trustScore?.score ?? 50;
  const tLabel = trustLabel(trust);
  const tColor = trustColor(trust);

  const joinDate = new Date(user.createdAt).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  // Trust score breakdown
  const accountAgeMs = Date.now() - user.createdAt.getTime();
  const accountAgeDays = Math.floor(accountAgeMs / (1000 * 60 * 60 * 24));
  const agePts = Math.min(20, Math.floor(accountAgeDays / 7) * 2);
  const activityPts = Math.min(20, user._count.votes * 2 + user._count.comments);
  const profilePts = [user.name, user.email, user.image].filter(Boolean).length * 3;

  return (
    <div className="min-h-screen bg-paper px-4 py-12">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Profile header */}
        <div className="bg-card border border-border-warm rounded-card p-6 shadow-card flex items-start gap-5 flex-wrap">
          <div className="shrink-0">
            {user.image ? (
              <Image
                src={user.image}
                alt={user.name ?? "User"}
                width={80}
                height={80}
                className="w-20 h-20 rounded-card object-cover"
              />
            ) : (
              <div className="w-20 h-20 rounded-card bg-highlight flex items-center justify-center text-navy text-3xl font-bold">
                {(user.name ?? "?")[0].toUpperCase()}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="font-serif text-2xl font-semibold text-navy">
                {user.name ?? "Anonymous User"}
              </h1>
              <span
                className="text-xs px-2.5 py-1 rounded-full font-semibold border"
                style={{
                  color: tColor,
                  borderColor: `${tColor}40`,
                  background: `${tColor}15`,
                }}
              >
                {tLabel}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1.5 text-grey text-sm">
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Joined {joinDate}</span>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: <ThumbsUp className="w-4 h-4" />, value: user._count.votes, label: "Votes" },
            { icon: <MessageSquare className="w-4 h-4" />, value: user._count.comments, label: "Comments" },
            { icon: <FileText className="w-4 h-4" />, value: user._count.content, label: "Submissions" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-card border border-border-warm rounded-card p-4 shadow-card text-center"
            >
              <div className="flex items-center justify-center gap-1.5 text-grey mb-1">
                {stat.icon}
                <span className="text-xs uppercase tracking-wider">{stat.label}</span>
              </div>
              <div className="font-serif text-2xl font-semibold text-navy">
                {stat.value}
              </div>
            </div>
          ))}
        </div>

        {/* Trust score breakdown */}
        <div className="bg-card border border-border-warm rounded-card p-6 shadow-card">
          <p className="text-xs font-semibold uppercase tracking-widest text-grey mb-4">
            Trust Score Breakdown
          </p>
          <div className="flex items-end gap-4 mb-5">
            <span className="font-mono text-4xl font-bold" style={{ color: tColor }}>
              {trust}
            </span>
            <span className="text-grey text-sm mb-1">/ 100 · {tLabel}</span>
          </div>

          {/* Progress bar */}
          <div className="relative h-2 bg-border-light rounded-full overflow-hidden mb-6">
            <div
              className="absolute inset-y-0 left-0 rounded-full transition-all"
              style={{ width: `${trust}%`, background: tColor }}
            />
          </div>

          {/* Breakdown items */}
          <div className="space-y-3">
            {[
              { label: "Base score", pts: 30, max: 30 },
              { label: "Account age", pts: agePts, max: 20 },
              { label: "Activity (votes + comments)", pts: activityPts, max: 20 },
              { label: "Profile completeness", pts: profilePts, max: 9 },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-grey">{item.label}</span>
                    <span className="text-xs font-mono text-navy">
                      {item.pts}/{item.max}
                    </span>
                  </div>
                  <div className="h-1.5 bg-border-light rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-human/50"
                      style={{ width: `${(item.pts / item.max) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent votes */}
        {user.votes.length > 0 && (
          <div className="bg-card border border-border-warm rounded-card p-6 shadow-card">
            <p className="text-xs font-semibold uppercase tracking-widest text-grey mb-4">
              Recent Votes
            </p>
            <div className="space-y-3">
              {user.votes.map((vote) => {
                const score = clamp(vote.content.algorithmScore);
                const color = scoreDisplayColor(score);
                const mascot = getMascot(score);
                const section = getSection(vote.content.section ?? "general");
                const sectionColor = SECTION_COLORS[vote.content.section ?? "general"] ?? "#1A1A2E";
                return (
                  <Link
                    key={vote.id}
                    href={`/result/${vote.content.id}`}
                    className="flex items-center gap-3 p-3 rounded-btn hover:bg-highlight/30 transition-all"
                  >
                    <span className="text-2xl shrink-0">{mascot.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-medium" style={{ color: sectionColor }}>
                          {section.emoji} {section.label}
                        </span>
                        <span className="text-xs text-grey">
                          · {new Date(vote.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      {vote.content.excerpt && (
                        <p className="text-xs text-grey mt-0.5 truncate font-mono">
                          {vote.content.excerpt.slice(0, 60)}
                        </p>
                      )}
                    </div>
                    <div className="shrink-0 text-right">
                      <span className="text-sm font-bold font-mono tabular-nums" style={{ color }}>
                        {score}%
                      </span>
                      <div className="text-xs text-grey">
                        You: {vote.score}%
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Recent submissions */}
        {user.content.length > 0 && (
          <div className="bg-card border border-border-warm rounded-card p-6 shadow-card">
            <p className="text-xs font-semibold uppercase tracking-widest text-grey mb-4">
              Recent Submissions
            </p>
            <div className="space-y-3">
              {user.content.map((item) => {
                const score = clamp(item.algorithmScore);
                const color = scoreDisplayColor(score);
                const mascot = getMascot(score);
                const section = getSection(item.section ?? "general");
                const sectionColor = SECTION_COLORS[item.section ?? "general"] ?? "#1A1A2E";
                return (
                  <Link
                    key={item.id}
                    href={`/result/${item.id}`}
                    className="flex items-center gap-3 p-3 rounded-btn hover:bg-highlight/30 transition-all"
                  >
                    <span className="text-2xl shrink-0">{mascot.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-medium" style={{ color: sectionColor }}>
                          {section.emoji} {section.label}
                        </span>
                        <span className="text-xs text-grey capitalize">
                          · {item.contentType}
                        </span>
                      </div>
                      {item.excerpt && (
                        <p className="text-xs text-grey mt-0.5 truncate font-mono">
                          {item.excerpt.slice(0, 60)}
                        </p>
                      )}
                    </div>
                    <div className="shrink-0 text-right">
                      <span className="text-sm font-bold font-mono tabular-nums" style={{ color }}>
                        {score}%
                      </span>
                      <div className="text-xs text-grey">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty state */}
        {user.votes.length === 0 && user.content.length === 0 && (
          <div className="text-center py-12 text-grey">
            <p>No activity yet.</p>
            <Link href="/" className="text-human hover:underline text-sm mt-2 block">
              Start by submitting content →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
