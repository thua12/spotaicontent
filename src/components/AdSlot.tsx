"use client";

interface AdSlotProps {
  slot: string;        // AdSense slot ID or internal name
  size?: "banner" | "rectangle" | "leaderboard";
  className?: string;
}

const SIZE_CLASSES = {
  banner: "h-[90px] w-full",           // 728x90 leaderboard
  rectangle: "h-[250px] w-[300px]",   // 300x250 medium rectangle
  leaderboard: "h-[90px] w-full",      // full-width banner
};

export default function AdSlot({ slot, size = "banner", className = "" }: AdSlotProps) {
  const adsenseClient = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;

  if (!adsenseClient) {
    // Placeholder — shows in dev and when no AdSense is configured
    // In production without AdSense, either hide or sell directly
    return (
      <div className={`${SIZE_CLASSES[size]} ${className} flex items-center justify-center bg-paper border border-border-warm rounded-btn`}>
        <span className="text-xs text-grey/40 font-mono select-none">advertisement</span>
      </div>
    );
  }

  // Google AdSense — only renders client-side
  return (
    <div className={`${className} overflow-hidden`}>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={adsenseClient}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
