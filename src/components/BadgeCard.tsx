"use client";

import { useState } from "react";
import { Copy, Check, ExternalLink, Code } from "lucide-react";
import Link from "next/link";
import { BadgeData, scoreLabel, scoreColor, clampScore } from "@/lib/badge";

interface BadgeCardProps {
  token: string;
  verifyUrl: string;
  data: BadgeData;
}

export default function BadgeCard({ token, verifyUrl, data }: BadgeCardProps) {
  const [copied, setCopied] = useState<string | null>(null);

  const clamped = clampScore(data.humanScore);
  const color = scoreColor(clamped);
  const label = scoreLabel(clamped);
  const markerPct = 2 + (clamped / 100) * 96;
  const origin = typeof window !== "undefined" ? window.location.origin : "";

  const copy = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const embedSnippet = `<a href="${verifyUrl}" target="_blank" rel="noopener" title="Spot AI Content authenticity score: ${clamped}% human">
  <img src="${origin}/badge.svg?token=${token}" alt="Spot AI Content: ${clamped}% human — ${label}" width="200" height="32" />
</a>`;

  const markdownBadge = `[![Spot AI Content: ${clamped}% human](${origin}/badge.svg?token=${token})](${verifyUrl})`;

  return (
    <div className="mt-6 warm-card overflow-hidden">
      {/* Badge preview */}
      <div className="px-6 py-6 bg-paper/50">
        <p className="text-xs font-semibold uppercase tracking-widest text-grey mb-4 text-center">
          Your Badge
        </p>

        {/* Mini spectrum */}
        <div className="max-w-xs mx-auto">
          <div className="relative mb-2">
            <div className="h-3 spectrum-bar w-full" />
            <div
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
              style={{ left: `${markerPct}%` }}
            >
              <div className="w-5 h-5 rounded-full bg-white border-2 border-navy shadow-sm" />
            </div>
          </div>
          <div className="flex justify-between text-xs">
            <span style={{ color: "#E63946" }}>AI</span>
            <span className="font-semibold font-mono" style={{ color }}>{clamped}% Human · {label}</span>
            <span style={{ color: "#2D6A4F" }}>Human</span>
          </div>
        </div>

        <div className="text-center mt-3">
          <p className="text-xs text-grey">
            Issued {new Date(data.issuedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} · {data.contentType}
          </p>
          <Link
            href={verifyUrl}
            target="_blank"
            className="inline-flex items-center gap-1 text-xs font-medium mt-1 hover:underline text-human"
          >
            View certificate <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* Share options */}
      <div className="divide-y divide-border-light">
        {/* Shareable link */}
        <div className="px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-grey mb-2">
            Shareable Link
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs bg-paper px-3 py-2 rounded-btn text-human truncate font-mono border border-border-warm">
              {verifyUrl}
            </code>
            <button
              onClick={() => copy(verifyUrl, "link")}
              className="shrink-0 p-2 rounded-btn bg-paper hover:bg-highlight/50 transition text-grey hover:text-navy border border-border-warm"
            >
              {copied === "link" ? <Check className="w-4 h-4 text-human" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* HTML embed */}
        <div className="px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-grey mb-2 flex items-center gap-1.5">
            <Code className="w-3 h-3" /> HTML Embed
          </p>
          <div className="flex items-start gap-2">
            <pre className="flex-1 text-xs bg-paper px-3 py-2 rounded-btn text-grey font-mono overflow-x-auto whitespace-pre-wrap break-all border border-border-warm">
              {embedSnippet}
            </pre>
            <button
              onClick={() => copy(embedSnippet, "html")}
              className="shrink-0 p-2 rounded-btn bg-paper hover:bg-highlight/50 transition text-grey hover:text-navy mt-0.5 border border-border-warm"
            >
              {copied === "html" ? <Check className="w-4 h-4 text-human" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Markdown */}
        <div className="px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-grey mb-2">
            Markdown
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs bg-paper px-3 py-2 rounded-btn text-grey truncate font-mono border border-border-warm">
              {markdownBadge}
            </code>
            <button
              onClick={() => copy(markdownBadge, "md")}
              className="shrink-0 p-2 rounded-btn bg-paper hover:bg-highlight/50 transition text-grey hover:text-navy border border-border-warm"
            >
              {copied === "md" ? <Check className="w-4 h-4 text-human" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Platform hints */}
        <div className="px-5 py-4 bg-paper/50">
          <p className="text-xs font-semibold uppercase tracking-widest text-grey mb-3">
            Paste it anywhere
          </p>
          <div className="flex flex-wrap gap-2">
            {[
              "YouTube Description",
              "Blog Post",
              "News Article",
              "Twitter / X Bio",
              "LinkedIn Post",
              "Substack",
              "WordPress",
              "Reddit Post",
              "GitHub README",
              "Research Paper",
              "Instagram Bio",
              "TikTok Bio",
              "Discord",
              "Forum Comment",
            ].map((p) => (
              <span
                key={p}
                className="text-xs px-2.5 py-1 rounded-full bg-card text-grey border border-border-warm"
              >
                {p}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
