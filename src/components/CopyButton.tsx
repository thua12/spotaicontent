"use client";
import { useState } from "react";
import { Copy, Check } from "lucide-react";

export default function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={copy}
      className="shrink-0 p-2 rounded-btn bg-paper hover:bg-highlight/50 transition text-grey hover:text-navy border border-border-warm"
      aria-label="Copy"
    >
      {copied ? (
        <Check className="w-4 h-4 text-human" />
      ) : (
        <Copy className="w-4 h-4" />
      )}
    </button>
  );
}
