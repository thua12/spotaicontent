"use client";

import { scoreLabel, scoreColor, clampScore } from "@/lib/badge";

interface ResultCardProps {
  humanScore: number;
  aiScore: number;
  sentences?: Array<{ sentence: string; generated_prob: number }>;
  onGetBadge: () => void;
  isGeneratingBadge: boolean;
}

export default function ResultCard({
  humanScore,
  aiScore,
  sentences,
  onGetBadge,
  isGeneratingBadge,
}: ResultCardProps) {
  const clamped = clampScore(humanScore);
  const color = scoreColor(clamped);
  const label = scoreLabel(clamped);
  // Marker position: map 1–99 to 2%–98% so it's never at the edge
  const markerPct = 2 + (clamped / 100) * 96;

  return (
    <div className="mt-8 warm-card overflow-hidden">
      {/* Result header */}
      <div className="px-6 pt-6 pb-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-grey mb-1">
          Second Opinion
        </p>
        <div className="flex items-baseline gap-3">
          <span className="font-mono text-5xl font-bold tabular-nums" style={{ color }}>
            {clamped}%
          </span>
          <span className="text-lg font-semibold text-navy">{label}</span>
        </div>
        <p className="text-xs text-grey mt-1">
          {clamped}% human · {clampScore(aiScore)}% AI
        </p>
      </div>

      {/* Spectrum bar */}
      <div className="px-6 pb-6">
        <div className="relative">
          <div className="h-4 spectrum-bar w-full" />
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 transition-all duration-700"
            style={{ left: `${markerPct}%` }}
          >
            <div className="w-6 h-6 rounded-full bg-white border-2 border-navy shadow-sm" />
          </div>
        </div>

        {/* Labels */}
        <div className="flex justify-between mt-2">
          <span className="text-xs font-medium" style={{ color: "#E63946" }}>AI</span>
          <span className="text-xs font-medium" style={{ color: "#2D6A4F" }}>Human</span>
        </div>

        {/* Caveat */}
        <div className="mt-3 bg-highlight/50 border border-middle/30 rounded-card p-3 text-xs text-navy text-center leading-relaxed">
          Absolute certainty is impossible — this is a probabilistic estimate, not a verdict.
          Human judgment always comes first.
        </div>
      </div>

      {/* Sentence analysis */}
      {sentences && sentences.length > 0 && (
        <div className="px-6 pb-5 border-t border-border-light pt-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-grey mb-3">
            Passage Analysis
          </p>
          <div className="text-sm leading-relaxed max-h-52 overflow-y-auto text-navy">
            {sentences.map((s, i) => (
              <span
                key={i}
                style={{
                  background:
                    s.generated_prob > 0.75
                      ? "rgba(230,57,70,0.12)"
                      : s.generated_prob > 0.5
                      ? "rgba(244,162,97,0.15)"
                      : "transparent",
                  borderRadius: "3px",
                  padding: "1px 2px",
                }}
              >
                {s.sentence}{" "}
              </span>
            ))}
          </div>
          <p className="text-xs text-grey mt-2">
            <span className="inline-block w-2.5 h-2.5 rounded-sm bg-ai/20 mr-1 align-middle" />
            High AI probability &nbsp;
            <span className="inline-block w-2.5 h-2.5 rounded-sm bg-middle/25 mr-1 align-middle" />
            Moderate
          </p>
        </div>
      )}

      {/* Badge CTA */}
      <div className="px-6 py-4 border-t border-border-light bg-paper/50">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-sm font-semibold text-navy">
              Add this to your content
            </p>
            <p className="text-xs text-grey mt-0.5">
              Get a badge anyone can verify — paste it anywhere on the internet
            </p>
          </div>
          <button
            onClick={onGetBadge}
            disabled={isGeneratingBadge}
            className="shrink-0 px-5 py-2.5 rounded-btn font-semibold text-sm text-white bg-navy hover:bg-navy-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGeneratingBadge ? "Generating..." : "Get Badge →"}
          </button>
        </div>
      </div>
    </div>
  );
}
