"use client";
import { getMascot } from "@/lib/scoring";
import { motion } from "framer-motion";

interface MascotCardProps {
  aiScore: number;
  size?: "sm" | "lg";
}

export default function MascotCard({ aiScore, size = "lg" }: MascotCardProps) {
  const mascot = getMascot(aiScore);
  if (size === "sm") {
    return (
      <div className="flex items-center gap-2">
        <span className="text-2xl">{mascot.emoji}</span>
        <div>
          <p className="text-sm font-semibold text-navy">{mascot.name}</p>
          <p className="text-xs text-grey italic">{mascot.tagline}</p>
        </div>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center text-center py-8">
      <motion.div
        className="text-7xl mb-4"
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
      >
        {mascot.emoji}
      </motion.div>
      <p className="font-serif text-2xl font-semibold text-navy mb-1">{mascot.name}</p>
      <p className="text-grey text-sm italic max-w-xs">&ldquo;{mascot.tagline}&rdquo;</p>
      <button
        onClick={() => typeof navigator !== "undefined" && navigator.clipboard?.writeText(`My content got a ${mascot.emoji} ${mascot.name} score on Spot AI Content — "${mascot.tagline}"`)}
        className="mt-4 text-xs px-3 py-1.5 rounded-full border border-border-warm text-grey hover:text-navy hover:border-navy transition bg-white"
      >
        Copy shareable score
      </button>
    </div>
  );
}
