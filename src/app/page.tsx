import { prisma } from "@/lib/db";
import { SECTIONS } from "@/lib/sections";
import SubmitForm from "@/components/SubmitForm";
import ContentCard from "@/components/ContentCard";
import StoriesBar from "@/components/StoriesBar";
import AdSlot from "@/components/AdSlot";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

const SECTION_COLORS: Record<string, string> = {
  general: "#1A1A2E", news: "#1A1A2E", entertainment: "#6B4E71",
  viral: "#E07A5F", food: "#6B9E78", business: "#4A6FA5",
  academic: "#2D6A4F", creative: "#C17B74", health: "#5B9E9E",
};

export default async function Home() {
  // "Needs Your Vote Right Now" — fewest votes + most ambiguous scores
  const needsVotes = await prisma.content.findMany({
    where: {
      algorithmScore: { gte: 35, lte: 65 }, // ambiguous zone
      voteCount: { lt: 10 },
    },
    include: { _count: { select: { votes: true, comments: true } } },
    orderBy: [{ voteCount: "asc" }, { createdAt: "desc" }],
    take: 6,
  });

  // Fetch most contested (communityScore set)
  const allWithCommunity = await prisma.content.findMany({
    where: { communityScore: { not: null } },
    include: { _count: { select: { votes: true, comments: true } } },
    take: 20,
  });

  const mostContested = [...allWithCommunity]
    .sort(
      (a, b) =>
        Math.abs(b.algorithmScore - (b.communityScore ?? b.algorithmScore)) -
        Math.abs(a.algorithmScore - (a.communityScore ?? a.algorithmScore))
    )
    .slice(0, 6);

  // Fetch recent per section
  type ContentWithCount = Awaited<ReturnType<typeof prisma.content.findMany<{
    include: { _count: { select: { votes: true; comments: true } } };
  }>>>[number];

  const sectionData: Record<string, ContentWithCount[]> = {};
  for (const section of SECTIONS.filter((s) => s.id !== "general")) {
    sectionData[section.id] = await prisma.content.findMany({
      where: { section: section.id },
      include: { _count: { select: { votes: true, comments: true } } },
      orderBy: { createdAt: "desc" },
      take: 4,
    });
  }

  const userCount = await prisma.user.count();

  return (
    <>
      {/* Hero */}
      <section className="bg-paper py-20 border-b border-border-warm">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-human mb-4">Community-powered · Human-first</p>
          <h1 className="font-serif text-5xl sm:text-6xl font-semibold text-navy leading-tight mb-4">
            The internet votes on what&apos;s real.
          </h1>
          <p className="text-grey text-lg mb-2 max-w-lg mx-auto">
            Every article, video, and image gets a score. You decide if the algorithm got it right.
          </p>
          <p className="text-sm text-grey/60 italic mb-6">Voting is free, forever. Always.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
            <Link href="/feed" className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-btn bg-navy text-white font-semibold text-sm hover:bg-navy-light transition-colors">
              Start voting →
            </Link>
            <Link href="#check" className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-btn border border-border-warm text-navy hover:border-human hover:text-human transition-all font-semibold text-sm">
              Check your content
            </Link>
          </div>
          <p className="text-xs text-grey/50">Join {userCount > 0 ? userCount.toLocaleString() : "people"} building a more honest internet</p>
        </div>
      </section>

      {/* Ad slot — below hero */}
      <div className="max-w-4xl mx-auto px-4 py-4">
        <AdSlot slot="homepage-top" size="leaderboard" />
      </div>

      {/* Needs Your Vote Right Now */}
      {needsVotes.length > 0 && (
        <section className="py-12 border-b border-border-warm bg-highlight/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">👀</span>
                <h2 className="font-serif text-2xl font-semibold text-navy">Needs Your Eyes Right Now</h2>
              </div>
              <p className="text-grey text-sm ml-8">
                Algorithm scored these — now we need humans. These are the most ambiguous pieces with the fewest votes.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {needsVotes.map((item) => (
                <ContentCard
                  key={item.id}
                  id={item.id}
                  contentType={item.contentType}
                  section={item.section ?? "general"}
                  excerpt={item.excerpt}
                  url={item.url}
                  algorithmScore={item.algorithmScore}
                  communityScore={item.communityScore}
                  voteCount={item._count.votes}
                  commentCount={item._count.comments}
                  createdAt={item.createdAt}
                  urgentVote={true}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Ad slot — after Needs Your Vote */}
      <div className="max-w-4xl mx-auto px-4 py-4 border-b border-border-warm">
        <AdSlot slot="homepage-mid" size="leaderboard" />
      </div>

      {/* Stories Bar — most contested */}
      <StoriesBar items={mostContested.slice(0, 5).map(item => ({
        id: item.id,
        excerpt: item.excerpt,
        algorithmScore: item.algorithmScore,
        communityScore: item.communityScore,
      }))} />

      {/* Most Contested */}
      {mostContested.length > 0 && (
        <section className="py-16 border-b border-border-warm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-8 flex items-end justify-between gap-4">
              <div>
                <h2 className="font-serif text-2xl font-semibold text-navy section-header-contested">Most Contested</h2>
                <p className="text-grey text-sm mt-1">
                  Where algorithm and community disagree most
                </p>
              </div>
              <Link
                href="/feed"
                className="flex items-center gap-1.5 text-sm text-human hover:underline"
              >
                View all <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-4">
              {mostContested.map((item) => (
                <ContentCard
                  key={item.id}
                  id={item.id}
                  contentType={item.contentType}
                  section={item.section ?? "general"}
                  excerpt={item.excerpt}
                  url={item.url}
                  algorithmScore={item.algorithmScore}
                  communityScore={item.communityScore}
                  voteCount={item._count.votes}
                  commentCount={item._count.comments}
                  createdAt={item.createdAt}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Content Sections */}
      {SECTIONS.filter((s) => s.id !== "general").map((section) => {
        const items = sectionData[section.id] ?? [];
        if (items.length === 0) return null;
        const headerColor = SECTION_COLORS[section.id] ?? "#1A1A2E";
        return (
          <section key={section.id} className="py-12 border-b border-border-warm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="mb-6 flex items-end justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{section.emoji}</span>
                  <div>
                    <h2
                      className="font-serif text-xl font-semibold"
                      style={{ color: headerColor }}
                    >
                      {section.label}
                    </h2>
                    <p className="text-grey text-xs mt-0.5">
                      {section.description}
                    </p>
                  </div>
                </div>
                <Link
                  href={`/feed?section=${section.id}`}
                  className="flex items-center gap-1.5 text-sm text-grey hover:text-human transition-colors"
                >
                  See more <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              <div className="flex gap-4 overflow-x-auto pb-4">
                {items.map((item) => (
                  <ContentCard
                    key={item.id}
                    id={item.id}
                    contentType={item.contentType}
                    section={item.section ?? "general"}
                    excerpt={item.excerpt}
                    url={item.url}
                    algorithmScore={item.algorithmScore}
                    communityScore={item.communityScore}
                    voteCount={item._count.votes}
                    commentCount={item._count.comments}
                    createdAt={item.createdAt}
                  />
                ))}
              </div>
            </div>
          </section>
        );
      })}

      {/* Check your content — anchor section */}
      <section id="check" className="py-16 border-b border-border-warm bg-card">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-grey mb-3">Check your own content</p>
          <h2 className="font-serif text-3xl font-semibold text-navy mb-2">Is your content flagged as AI?</h2>
          <p className="text-grey text-sm mb-2">Writers, journalists, and students — verify your work is seen as human.</p>
          <p className="text-xs text-grey/60 mb-8">3 free checks/day · Sign in for 10/month free · Pro for 100/month</p>
          <SubmitForm />
        </div>
      </section>

      {/* Spectrum icons */}
      <section className="py-20 border-b border-border-warm bg-card">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="font-serif text-3xl font-semibold text-navy mb-3">The spectrum</h2>
          <p className="text-grey mb-10">
            Every score lands somewhere between fully human and fully AI — most land in between.
          </p>
          <div className="grid grid-cols-3 gap-6">
            {[
              { emoji: "👤", name: "Human",  range: "1–33%",  desc: "Reads like a person wrote it",  color: "#2D6A4F" },
              { emoji: "🦾", name: "Cyborg", range: "34–66%", desc: "We honestly can't tell",         color: "#F4A261" },
              { emoji: "🤖", name: "Robot",  range: "67–99%", desc: "Reads like a machine wrote it",  color: "#E63946" },
            ].map((m) => (
              <div key={m.name} className="warm-card p-6 text-center">
                <div className="text-5xl mb-3">{m.emoji}</div>
                <p className="text-sm font-semibold text-navy mb-1">{m.name}</p>
                <p className="text-xs font-mono mb-2" style={{ color: m.color }}>{m.range} AI</p>
                <p className="text-xs text-grey">{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Vision footer */}
      <section className="py-20 bg-card border-t border-border-warm text-center">
        <div className="max-w-2xl mx-auto px-4">
          <span className="text-2xl mb-4 block">🦾</span>
          <h2 className="font-serif text-3xl font-semibold text-navy mb-4">
            Join {userCount > 0 ? <span className="text-human">{userCount.toLocaleString()}</span> : "people"} building a more honest internet
          </h2>
          <p className="text-grey leading-relaxed mb-8">Every vote matters. Transparency about how content was created is the foundation of trust online.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/api/auth/signin"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-btn bg-navy text-white font-semibold text-sm hover:bg-navy-light transition-colors"
            >
              Join the community <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/feed"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-btn border border-border-warm text-navy hover:border-human hover:text-human transition-all font-semibold text-sm"
            >
              Browse the feed
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
