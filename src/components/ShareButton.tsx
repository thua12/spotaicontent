"use client";

import { useState } from "react";
import { Share2, Check, Copy } from "lucide-react";

interface ShareButtonProps {
  id: string;
  aiScore: number;
}

export default function ShareButton({ id, aiScore }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const url = `${typeof window !== "undefined" ? window.location.origin : ""}/result/${id}`;
  const text = `I just checked this content — it scored ${aiScore}% AI probability on Spot AI Content. See the full analysis:`;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: "Spot AI Content AI Analysis", text, url });
      } catch {
        // user cancelled or error — fall through to clipboard
        await copyToClipboard();
      }
    } else {
      await copyToClipboard();
    }
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleShare}
      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-btn border border-border-warm text-navy font-semibold text-sm hover:bg-highlight/50 transition-colors"
    >
      {copied ? (
        <>
          <Check className="w-4 h-4 text-human" />
          Copied!
        </>
      ) : (
        <>
          <Share2 className="w-4 h-4" />
          Share result
        </>
      )}
    </button>
  );
}
