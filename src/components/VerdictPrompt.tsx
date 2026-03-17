"use client";

import { useState } from "react";

interface VerdictPromptProps {
  contentId: string;
  algorithmScore: number;
  isLoggedIn: boolean;
}

type Verdict = "HUMAN" | "UNDECIDED" | "AI";

export default function VerdictPrompt({ contentId, algorithmScore, isLoggedIn }: VerdictPromptProps) {
  const [selected, setSelected] = useState<Verdict | null>(null);
  const [score, setScore] = useState(algorithmScore);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (verdict: Verdict) => {
    if (!isLoggedIn) {
      window.location.href = "/api/auth/signin";
      return;
    }
    setSelected(verdict);
    setLoading(true);
    await fetch("/api/vote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contentId, score, verdict }),
    });
    setLoading(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="bg-card border border-border-warm rounded-card p-6 shadow-card text-center">
        <p className="text-lg font-semibold text-navy mb-1">Vote recorded</p>
        <p className="text-sm text-grey">
          You concluded: <span className="font-semibold text-navy">{selected}</span>.
          Your vote contributes to the community consensus.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border-warm rounded-card p-6 shadow-card">
      <p className="text-xs font-semibold uppercase tracking-widest text-grey mb-1">
        Your verdict
      </p>
      <p className="text-base font-semibold text-navy mb-4">
        Based on this score, what&apos;s your conclusion?
      </p>

      {/* Spectrum slider */}
      <div className="mb-5">
        <div className="flex justify-between text-xs text-grey mb-2">
          <span>Human</span>
          <span className="font-mono text-navy">{score}% AI</span>
          <span>AI</span>
        </div>
        <input
          type="range"
          min={1}
          max={99}
          value={score}
          onChange={(e) => setScore(Number(e.target.value))}
          className="w-full h-2 rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, #2D6A4F, #F4A261 50%, #E63946)`,
          }}
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        {(["HUMAN", "UNDECIDED", "AI"] as Verdict[]).map((v) => {
          const isSelected = selected === v;
          let classes = "py-2.5 rounded-btn text-sm font-semibold border transition-all ";
          if (v === "HUMAN") {
            classes += isSelected
              ? "border-human bg-human/15 text-human"
              : "border-border-warm text-grey hover:border-human hover:text-human hover:bg-human/5";
          } else if (v === "AI") {
            classes += isSelected
              ? "border-ai bg-ai/15 text-ai"
              : "border-border-warm text-grey hover:border-ai hover:text-ai hover:bg-ai/5";
          } else {
            classes += isSelected
              ? "border-grey bg-grey/10 text-grey"
              : "border-border-warm text-grey hover:border-grey/60 hover:bg-highlight/30";
          }
          return (
            <button
              key={v}
              onClick={() => submit(v)}
              disabled={loading}
              className={classes}
            >
              {v === "HUMAN" ? "✓ Human" : v === "UNDECIDED" ? "? Undecided" : "⚠ AI"}
            </button>
          );
        })}
      </div>

      {!isLoggedIn && (
        <p className="text-xs text-grey text-center mt-3">
          Sign in to cast your vote and contribute to the community score
        </p>
      )}
    </div>
  );
}
