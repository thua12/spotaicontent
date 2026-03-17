import Link from "next/link";
import { prisma } from "@/lib/db";
import { Mail } from "lucide-react";

export const dynamic = "force-dynamic";

const MASCOTS = [
  { range: "1–33%",  emoji: "👤", name: "Human",  label: "Reads like a person wrote it",  color: "#2D6A4F" },
  { range: "34–66%", emoji: "🦾", name: "Cyborg", label: "We honestly can't tell",         color: "#F4A261" },
  { range: "67–99%", emoji: "🤖", name: "Robot",  label: "Reads like a machine wrote it",  color: "#E63946" },
];

export default async function TransparencyPage() {
  const [totalContent, totalVotes, totalUsers] = await Promise.all([
    prisma.content.count(),
    prisma.vote.count(),
    prisma.user.count(),
  ]);

  const avgScoreResult = await prisma.content.aggregate({ _avg: { algorithmScore: true } });
  const avgScore = Math.round(avgScoreResult._avg.algorithmScore ?? 0);

  return (
    <div className="min-h-screen bg-paper">
      <div className="max-w-3xl mx-auto px-4 py-16 space-y-0">

        {/* Hero */}
        <section className="pb-12 border-b border-border-warm">
          <p className="text-xs font-semibold uppercase tracking-widest text-human mb-4">Transparency Report</p>
          <h1 className="font-serif text-5xl font-semibold text-navy leading-tight mb-4">
            We publish what we know,<br />including what we get wrong.
          </h1>
          <p className="text-grey text-lg leading-relaxed max-w-xl">
            Spot AI Content is a probabilistic tool. Every score is an estimate, not a verdict.
            This page explains exactly how we arrive at those estimates and where we fall short.
          </p>
        </section>

        {/* Stats */}
        <section className="py-12 border-b border-border-warm">
          <h2 className="font-serif text-2xl font-semibold text-navy mb-8">By the numbers</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { value: totalContent.toLocaleString(), label: "Content pieces scored", sub: "images, videos & text" },
              { value: totalVotes.toLocaleString(), label: "Community votes cast", sub: "human calibration signals" },
              { value: totalUsers.toLocaleString(), label: "Registered users", sub: "contributors & reviewers" },
            ].map((stat) => (
              <div key={stat.label} className="bg-card border border-border-warm rounded-card p-6 shadow-card text-center">
                <div className="font-serif text-4xl font-bold text-navy mb-1">{stat.value}</div>
                <div className="text-sm font-medium text-navy mb-0.5">{stat.label}</div>
                <div className="text-xs text-grey">{stat.sub}</div>
              </div>
            ))}
          </div>
          {avgScore > 0 && (
            <p className="text-xs text-grey mt-4 text-center">
              Average algorithm score across all content: <span className="font-mono font-semibold text-navy">{avgScore}%</span> AI probability
            </p>
          )}
        </section>

        {/* How the algorithm works */}
        <section className="py-12 border-b border-border-warm">
          <h2 className="font-serif text-2xl font-semibold text-navy mb-6">How the algorithm works</h2>
          <p className="text-grey leading-relaxed mb-6">
            Every piece of content submitted to Spot AI Content is scored through a three-layer pipeline.
            No single layer is definitive — we combine signals to reduce false positives and false negatives.
          </p>
          <div className="space-y-5">
            {[
              {
                step: "01",
                title: "External API calls",
                desc: "For text, we call GPTZero and parse their generated probability score. For images and video, we call Hive AI's content moderation API which returns AI-generation confidence scores. These are calibrated commercial models trained on millions of examples.",
              },
              {
                step: "02",
                title: "Score normalization",
                desc: "Raw scores from external APIs are mapped to our 1–99 scale. We intentionally avoid 0% and 100% — absolute certainty is epistemically dishonest. A score of 1 means 'as close to human as we can tell', 99 means 'as close to AI as we can tell'.",
              },
              {
                step: "03",
                title: "Community calibration",
                desc: "Once a piece receives 10+ community votes, we compute a weighted consensus score that blends the algorithm output with community judgment. High-trust users' votes carry slightly more weight. The algorithm score and community score are displayed separately so you can see where they diverge.",
              },
            ].map((item) => (
              <div key={item.step} className="flex gap-5">
                <div className="shrink-0 w-10 h-10 rounded-full bg-highlight flex items-center justify-center font-mono text-xs font-bold text-human">
                  {item.step}
                </div>
                <div className="flex-1 pb-5 border-b border-border-light last:border-0">
                  <h3 className="font-semibold text-navy mb-1.5">{item.title}</h3>
                  <p className="text-sm text-grey leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Score distribution */}
        <section className="py-12 border-b border-border-warm">
          <h2 className="font-serif text-2xl font-semibold text-navy mb-2">Score distribution</h2>
          <p className="text-grey text-sm mb-7">
            Each score range maps to one of three zones — our way of communicating uncertainty without false precision.
          </p>
          <div className="space-y-3">
            {MASCOTS.map((m) => (
              <div key={m.name} className="flex items-center gap-4 p-3 rounded-card bg-card border border-border-warm">
                <span className="text-2xl shrink-0">{m.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm text-navy">{m.name}</span>
                    <span className="font-mono text-xs text-grey">{m.range}</span>
                  </div>
                  <p className="text-xs text-grey mt-0.5">{m.label}</p>
                </div>
                <div className="w-3 h-3 rounded-full shrink-0" style={{ background: m.color }} />
              </div>
            ))}
          </div>
        </section>

        {/* Bias monitoring */}
        <section className="py-12 border-b border-border-warm">
          <h2 className="font-serif text-2xl font-semibold text-navy mb-4">Bias monitoring</h2>
          <p className="text-grey leading-relaxed mb-4">
            AI detection models can exhibit systematic biases. Non-native English writers, highly creative prose,
            and technical or domain-specific writing can score higher than they should. We take this seriously.
          </p>
          <div className="bg-highlight/40 border border-middle/30 rounded-card p-5 space-y-2">
            <p className="text-sm font-semibold text-navy">What we track:</p>
            <ul className="text-sm text-grey space-y-1.5 list-none">
              {[
                "False positive rates by content category (news, academic, creative)",
                "Community override rate — how often users disagree with the algorithm",
                "Score distribution across content types (image vs. text vs. video)",
                "Expert reviewer corrections vs. algorithm output",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="text-human mt-0.5">→</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <p className="text-sm text-grey mt-4">
            We publish aggregated bias statistics quarterly. If you notice a systematic issue,
            please{" "}
            <a href="mailto:hello@spotaicontent.com" className="text-human hover:underline">
              tell us
            </a>.
          </p>
        </section>

        {/* Model versioning */}
        <section className="py-12 border-b border-border-warm">
          <h2 className="font-serif text-2xl font-semibold text-navy mb-4">Model versioning</h2>
          <p className="text-grey leading-relaxed mb-4">
            Every piece of content scored by Spot AI Content records the model version that produced the score.
            This means we can retroactively audit how score distributions shift when we update our
            models or change our weighting methodology.
          </p>
          <p className="text-grey leading-relaxed">
            When we make significant changes to the scoring pipeline, we will note it here with a
            version number and a description of what changed and why. Old scores are never silently
            overwritten — if you shared a certificate, it reflects the score at the time of analysis.
          </p>
          <div className="mt-5 bg-card border border-border-warm rounded-card p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-grey mb-2">Current version</p>
            <div className="flex items-center gap-3">
              <span className="font-mono text-sm text-navy font-semibold">v1.0</span>
              <span className="text-xs text-grey">Hive AI + GPTZero, 1–99 linear scale, community weighting enabled at 10+ votes</span>
            </div>
          </div>
        </section>

        {/* What we're building */}
        <section className="py-12 border-b border-border-warm">
          <h2 className="font-serif text-2xl font-semibold text-navy mb-4">What we&apos;re building</h2>
          <p className="text-grey leading-relaxed mb-4">
            The long-term goal is a self-improving ML flywheel: community votes train better models,
            better models produce more accurate scores, more accurate scores build community trust,
            more trust brings more votes.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { title: "Fine-tuned model", desc: "Train a custom model on community-labeled data from Spot AI Content, reducing dependency on third-party APIs." },
              { title: "Confidence intervals", desc: "Instead of a single number, show a range: '65–78% likely AI' — more honest, more useful." },
              { title: "Provenance tracking", desc: "For images, detect known AI model signatures (Stable Diffusion, Midjourney, DALL-E) when possible." },
              { title: "Open dataset", desc: "Publish an anonymized, community-consented dataset of scored content for academic research." },
            ].map((item) => (
              <div key={item.title} className="bg-card border border-border-warm rounded-card p-4">
                <h3 className="font-semibold text-sm text-navy mb-1">{item.title}</h3>
                <p className="text-xs text-grey leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="py-12">
          <div className="flex items-center gap-3 mb-4">
            <Mail className="w-5 h-5 text-human" />
            <h2 className="font-serif text-2xl font-semibold text-navy">Noticed something wrong?</h2>
          </div>
          <p className="text-grey leading-relaxed mb-5">
            If you&apos;ve found a systematic error, a pattern of false positives, or something that just doesn&apos;t
            look right — tell us. We read every report.
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href="mailto:hello@spotaicontent.com?subject=Transparency Report Feedback"
              className="px-5 py-2.5 rounded-btn bg-navy text-white font-semibold text-sm hover:bg-navy-light transition-colors"
            >
              Tell us →
            </a>
            <Link
              href="/feed"
              className="px-5 py-2.5 rounded-btn border border-border-warm text-navy font-semibold text-sm hover:bg-highlight/50 transition-colors"
            >
              Browse scored content
            </Link>
          </div>
        </section>

      </div>
    </div>
  );
}
