import { verifyBadgeToken, scoreLabel, scoreColor, clampScore } from "@/lib/badge";
import { ShieldCheck, ShieldX, Calendar, FileType, ExternalLink } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Verify Badge — Spot AI Content",
};

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <ShieldX className="w-16 h-16 text-grey mx-auto mb-4" />
          <h1 className="font-serif text-2xl font-semibold text-navy mb-2">No badge token provided</h1>
          <p className="text-grey mb-6">
            This page verifies Spot AI Content authenticity badges. Follow a badge link to verify content.
          </p>
          <Link href="/" className="inline-flex px-6 py-3 rounded-btn bg-navy text-white font-semibold text-sm hover:bg-navy-light transition-colors">
            Analyze Content
          </Link>
        </div>
      </div>
    );
  }

  const data = verifyBadgeToken(token);

  if (!data) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <ShieldX className="w-16 h-16 text-ai mx-auto mb-4" />
          <h1 className="font-serif text-2xl font-semibold text-navy mb-2">Invalid or tampered badge</h1>
          <p className="text-grey mb-6">
            This badge could not be verified. It may have been modified or is not a genuine Spot AI Content certificate.
          </p>
          <Link href="/" className="inline-flex px-6 py-3 rounded-btn bg-navy text-white font-semibold text-sm hover:bg-navy-light transition-colors">
            Create a real badge
          </Link>
        </div>
      </div>
    );
  }

  const clamped = clampScore(data.humanScore);
  const color = scoreColor(clamped);
  const label = scoreLabel(clamped);
  const markerPct = 2 + (clamped / 100) * 96;

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="bg-card border border-border-warm rounded-card overflow-hidden shadow-card">
          {/* Header */}
          <div className="px-8 py-7 border-b border-border-light text-center">
            <ShieldCheck className="w-10 h-10 mx-auto mb-3 text-human" />
            <p className="text-xs font-semibold uppercase tracking-widest text-grey mb-1">
              Spot AI Content Certificate
            </p>
            <h1 className="font-serif text-2xl font-semibold text-navy">
              Authenticity Score
            </h1>
          </div>

          {/* Spectrum */}
          <div className="px-8 py-7 border-b border-border-light">
            <div className="text-center mb-6">
              <span className="font-mono text-6xl font-bold tabular-nums" style={{ color }}>
                {clamped}%
              </span>
              <p className="text-lg font-semibold text-navy mt-1">{label}</p>
            </div>

            <div className="relative mb-2">
              <div className="h-5 spectrum-bar w-full" />
              <div
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
                style={{ left: `${markerPct}%` }}
              >
                <div className="w-7 h-7 rounded-full bg-white border-2 border-navy shadow-sm" />
              </div>
            </div>
            <div className="flex justify-between text-xs mt-2">
              <span style={{ color: "#E63946" }} className="font-medium">AI Generated</span>
              <span style={{ color: "#2D6A4F" }} className="font-medium">Human Created</span>
            </div>

            <div className="mt-4 bg-highlight/50 border border-middle/30 rounded-card p-3 text-xs text-navy text-center leading-relaxed">
              Absolute certainty is impossible. This is a probabilistic estimate — human
              judgment always comes first.
            </div>
          </div>

          {/* Metadata */}
          <div className="divide-y divide-border-light">
            <div className="px-6 py-3.5 flex items-center gap-3 text-sm">
              <FileType className="w-4 h-4 text-grey shrink-0" />
              <span className="text-grey">Content type:</span>
              <span className="font-medium text-navy capitalize ml-auto">{data.contentType}</span>
            </div>

            {data.contentIdentifier && data.contentIdentifier !== "text-submission" && (
              <div className="px-6 py-3.5 flex items-center gap-3 text-sm overflow-hidden">
                <ExternalLink className="w-4 h-4 text-grey shrink-0" />
                <span className="text-grey shrink-0">Content:</span>
                <span className="text-human truncate ml-auto text-xs font-mono">{data.contentIdentifier}</span>
              </div>
            )}

            <div className="px-6 py-3.5 flex items-center gap-3 text-sm">
              <Calendar className="w-4 h-4 text-grey shrink-0" />
              <span className="text-grey">Issued:</span>
              <span className="font-medium text-navy ml-auto">
                {new Date(data.issuedAt).toLocaleString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>

            <div className="px-6 py-3.5 flex items-center gap-3 text-sm">
              <ShieldCheck className="w-4 h-4 text-grey shrink-0" />
              <span className="text-grey">Certificate ID:</span>
              <span className="font-mono text-xs text-navy ml-auto">{data.id.slice(0, 8)}…</span>
            </div>
          </div>

          {/* Footer CTA */}
          <div className="px-6 py-5 bg-paper/50 text-center">
            <p className="text-xs text-grey mb-3">
              Verified by Spot AI Content — your second opinion on content authenticity
            </p>
            <Link
              href="/"
              className="inline-flex px-5 py-2.5 rounded-btn bg-navy text-white font-semibold text-sm hover:bg-navy-light transition-colors"
            >
              Certify your own content →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
