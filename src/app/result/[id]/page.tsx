import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { scoreLabel, clamp } from "@/lib/scoring";
import { scoreExplanation } from "@/lib/score-explanation";
import { getSection } from "@/lib/sections";
import SpectrumDisplay from "@/components/SpectrumDisplay";
import MascotCard from "@/components/MascotCard";
import CommunityScore from "@/components/CommunityScore";
import VerdictPrompt from "@/components/VerdictPrompt";
import CommentSection from "@/components/CommentSection";
import AdSlot from "@/components/AdSlot";
import { ExternalLink, Award } from "lucide-react";
import ShareButton from "@/components/ShareButton";

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

export default async function ResultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [content, session] = await Promise.all([
    prisma.content.findUnique({
      where: { id },
      include: {
        comments: { include: { user: { select: { name: true, image: true } } }, orderBy: { createdAt: "asc" } },
        _count: { select: { votes: true } },
      },
    }),
    auth(),
  ]);

  if (!content) notFound();

  const aiScore = clamp(content.algorithmScore);
  const color = scoreDisplayColor(aiScore);
  const isLoggedIn = !!session?.user;
  const sectionInfo = getSection(content.section ?? "general");
  const sectionColor = SECTION_COLORS[content.section ?? "general"] ?? "#1A1A2E";

  const sentences: Array<{ sentence: string; generated_prob: number }> = content.sentences
    ? JSON.parse(content.sentences)
    : [];

  const explanation = scoreExplanation(aiScore, content.contentType, sentences.length);

  return (
    <div className="min-h-screen bg-paper px-4 py-12">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Section label */}
        <div className="flex items-center gap-2">
          <span className="text-lg">{sectionInfo.emoji}</span>
          <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: sectionColor }}>
            {sectionInfo.label}
          </span>
        </div>

        {/* Header */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-grey mb-2">Second Opinion</p>
          <div className="flex items-baseline gap-3 mb-1">
            <span className="font-mono text-6xl font-bold tabular-nums" style={{ color }}>{aiScore}%</span>
            <span className="text-xl font-semibold text-navy">AI probability</span>
          </div>
          <div className="flex items-center gap-3 mt-2">
            <p className="text-sm text-grey">{scoreLabel(aiScore)}</p>
            <ShareButton id={id} aiScore={aiScore} />
          </div>
        </div>

        {/* Spectrum */}
        <div className="bg-card border border-border-warm rounded-card p-6 shadow-card">
          <SpectrumDisplay score={aiScore} size="lg" />
          <div className="mt-4 bg-highlight/50 border border-middle/30 rounded-card p-4 text-sm text-navy">
            Absolute certainty is impossible — this is a probabilistic estimate, not a verdict.
            Human judgment always comes first.
          </div>
        </div>

        {/* Score explanation */}
        <div className="bg-card border border-border-warm rounded-card px-6 py-5 shadow-card">
          <p className="text-xs font-semibold uppercase tracking-widest text-grey mb-2">Why this score?</p>
          <p className="text-sm text-navy leading-relaxed">{explanation}</p>
        </div>

        {/* Mascot */}
        <div className="bg-card border border-border-warm rounded-card shadow-card">
          <MascotCard aiScore={aiScore} />
        </div>

        {/* Content info */}
        {content.excerpt && (
          <div className="bg-card border border-border-warm rounded-card px-5 py-4 flex items-center gap-3 text-sm shadow-card">
            <ExternalLink className="w-4 h-4 text-grey shrink-0" />
            <span className="text-grey shrink-0 capitalize">{content.contentType}:</span>
            <span className="text-human truncate font-mono text-xs">{content.excerpt}</span>
          </div>
        )}

        {/* Sentence analysis (text only) */}
        {sentences.length > 0 && (
          <div className="bg-card border border-border-warm rounded-card p-6 shadow-card">
            <p className="text-xs font-semibold uppercase tracking-widest text-grey mb-3">Passage Analysis</p>
            <div className="text-sm leading-relaxed max-h-52 overflow-y-auto text-navy">
              {sentences.map((s, i) => (
                <span key={i} style={{
                  background: s.generated_prob > 0.75 ? "rgba(230,57,70,0.12)" : s.generated_prob > 0.5 ? "rgba(244,162,97,0.15)" : "transparent",
                  borderRadius: "3px", padding: "1px 2px",
                }}>
                  {s.sentence}{" "}
                </span>
              ))}
            </div>
            <p className="text-xs text-grey mt-2">
              <span className="inline-block w-2 h-2 rounded-sm bg-ai/20 mr-1 align-middle" />High AI probability&nbsp;
              <span className="inline-block w-2 h-2 rounded-sm bg-middle/25 mr-1 align-middle" />Moderate
            </p>
          </div>
        )}

        {/* Community + Algorithm scores */}
        <CommunityScore
          algorithmScore={aiScore}
          communityScore={content.communityScore ? Math.round(content.communityScore) : null}
          voteCount={content.voteCount}
        />

        {/* Verdict prompt */}
        <VerdictPrompt contentId={id} algorithmScore={aiScore} isLoggedIn={isLoggedIn} />

        {/* Certificate link */}
        <div className="bg-card border border-border-warm rounded-card px-6 py-5 shadow-card flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-sm font-semibold text-navy flex items-center gap-2">
              <Award className="w-4 h-4 text-human" /> Get a shareable certificate
            </p>
            <p className="text-xs text-grey mt-0.5">
              Embeddable badge for blogs, YouTube, LinkedIn, anywhere
            </p>
          </div>
          <Link
            href={`/certificate/${id}`}
            className="shrink-0 px-5 py-2.5 rounded-btn bg-navy text-white font-semibold text-sm hover:bg-navy-light transition-colors"
          >
            View Certificate →
          </Link>
        </div>

        {/* Ad slot between spectrum result and comments */}
        <div className="my-6">
          <AdSlot slot="result-inline" size="leaderboard" />
        </div>

        {/* Comments */}
        <CommentSection
          contentId={id}
          initial={content.comments.map((c) => ({ ...c, createdAt: c.createdAt.toISOString() }))}
          isLoggedIn={isLoggedIn}
        />

        <p className="text-xs text-grey text-center pb-4">
          Analyzed {new Date(content.createdAt).toLocaleString()} · ID {id.slice(0, 8)}
        </p>
      </div>
    </div>
  );
}
