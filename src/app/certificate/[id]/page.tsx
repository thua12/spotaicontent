import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { getMascot, scoreLabel, consensusScore, clamp, markerLeft } from "@/lib/scoring";
import { ShieldCheck, Copy } from "lucide-react";

function scoreDisplayColor(score: number): string {
  if (score <= 30) return "#2D6A4F";
  if (score <= 54) return "#F4A261";
  return "#E63946";
}

export default async function CertificatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const content = await prisma.content.findUnique({ where: { id } });
  if (!content) notFound();

  const aiScore = clamp(content.algorithmScore);
  const color = scoreDisplayColor(aiScore);
  const mascot = getMascot(aiScore);
  const communityRounded = content.communityScore ? Math.round(content.communityScore) : null;
  const consensus = consensusScore(aiScore, communityRounded);
  const pct = markerLeft(consensus);

  const baseUrl = process.env.NEXTAUTH_URL ?? "https://aidetect.app";
  const resultUrl = `${baseUrl}/result/${id}`;
  const certUrl = `${baseUrl}/certificate/${id}`;
  const embedHtml = `<a href="${certUrl}" target="_blank" rel="noopener" title="Spot AI Content: ${aiScore}% AI probability"><img src="${baseUrl}/api/badge-image/${id}" alt="Spot AI Content score: ${aiScore}% AI — ${scoreLabel(aiScore)}" width="220" height="36" /></a>`;
  const embedMd = `[![Spot AI Content: ${aiScore}% AI](${baseUrl}/api/badge-image/${id})](${certUrl})`;

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md space-y-4">
        {/* Certificate card */}
        <div className="bg-card border border-border-warm rounded-card overflow-hidden shadow-card">
          <div className="px-8 py-7 text-center border-b border-border-light">
            <ShieldCheck className="w-10 h-10 mx-auto mb-3 text-human" />
            <p className="text-xs font-semibold uppercase tracking-widest text-grey mb-1">Spot AI Content Certificate</p>
            <h1 className="font-serif text-2xl font-semibold text-navy">Authenticity Score</h1>
          </div>

          <div className="px-8 py-7 border-b border-border-light">
            {/* Mascot */}
            <div className="flex items-center gap-3 mb-6">
              <span className="text-4xl">{mascot.emoji}</span>
              <div>
                <p className="font-semibold text-navy">{mascot.name}</p>
                <p className="text-xs text-grey italic">&ldquo;{mascot.tagline}&rdquo;</p>
              </div>
            </div>

            {/* Score */}
            <div className="text-center mb-5">
              <span className="font-mono text-5xl font-bold tabular-nums" style={{ color }}>{aiScore}%</span>
              <p className="text-base font-semibold text-navy mt-1">AI probability</p>
              <p className="text-sm text-grey">{scoreLabel(aiScore)}</p>
            </div>

            {/* Spectrum */}
            <div className="relative mb-2">
              <div className="h-5 spectrum-bar w-full" />
              <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2" style={{ left: `${pct}%` }}>
                <div className="w-7 h-7 rounded-full bg-white border-2 border-navy shadow-sm" />
              </div>
            </div>
            <div className="flex justify-between text-xs mb-5">
              <span style={{ color: "#E63946" }}>AI Generated</span>
              <span style={{ color: "#2D6A4F" }}>Human Created</span>
            </div>

            {communityRounded !== null && (
              <div className="text-center text-xs text-grey mb-5">
                Algorithm: {aiScore}% · Community: {communityRounded}% · Consensus: {consensus}%
              </div>
            )}

            <div className="bg-highlight/50 border border-middle/30 rounded-card p-3 text-xs text-navy text-center leading-relaxed">
              Absolute certainty is impossible — this is a probabilistic estimate, not a verdict.
              Human judgment always comes first.
            </div>
          </div>

          <div className="px-6 py-4 divide-y divide-border-light text-sm">
            <div className="py-3 flex justify-between">
              <span className="text-grey">Content type</span>
              <span className="font-medium text-navy capitalize">{content.contentType}</span>
            </div>
            <div className="py-3 flex justify-between">
              <span className="text-grey">Analyzed</span>
              <span className="font-medium text-navy">{new Date(content.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="py-3 flex justify-between">
              <span className="text-grey">Certificate ID</span>
              <span className="font-mono text-xs text-navy">{id.slice(0, 12)}…</span>
            </div>
          </div>

          <div className="px-6 py-4 bg-paper/50 text-center">
            <Link href={resultUrl} className="text-xs text-human hover:underline">View full result & community discussion →</Link>
          </div>
        </div>

        {/* Embed options */}
        <div className="bg-card border border-border-warm rounded-card divide-y divide-border-light overflow-hidden shadow-card">
          <div className="px-5 py-3 bg-paper/50">
            <p className="text-xs font-semibold uppercase tracking-widest text-grey">Embed This Badge</p>
          </div>
          {[
            { label: "Shareable Link", value: certUrl, key: "link" },
            { label: "HTML (websites, blogs, articles)", value: embedHtml, key: "html" },
            { label: "Markdown (GitHub, Substack, Docs)", value: embedMd, key: "md" },
          ].map((opt) => (
            <div key={opt.key} className="px-5 py-3">
              <p className="text-xs text-grey mb-1.5">{opt.label}</p>
              <div className="flex items-start gap-2">
                <code className="flex-1 text-xs bg-paper px-3 py-2 rounded-btn text-human font-mono truncate break-all whitespace-pre-wrap overflow-hidden border border-border-warm" style={{ maxHeight: "4rem" }}>
                  {opt.value}
                </code>
                <CopyButton value={opt.value} />
              </div>
            </div>
          ))}
          <div className="px-5 py-4 bg-paper/50">
            <p className="text-xs font-semibold uppercase tracking-widest text-grey mb-2">Works on</p>
            <div className="flex flex-wrap gap-1.5">
              {["YouTube", "Blogs", "News Articles", "LinkedIn", "Twitter/X", "Substack", "GitHub", "Reddit", "WordPress", "Research Papers"].map((p) => (
                <span key={p} className="text-xs px-2 py-0.5 rounded-full bg-card text-grey border border-border-warm">{p}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CopyButton({ value }: { value: string }) {
  return (
    <button
      data-copy={value}
      className="shrink-0 p-2 rounded-btn bg-paper hover:bg-highlight/50 transition text-grey hover:text-navy mt-0.5 copy-btn border border-border-warm"
      aria-label="Copy"
    >
      <Copy className="w-4 h-4" />
    </button>
  );
}
