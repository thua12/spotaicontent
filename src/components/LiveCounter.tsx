"use client";

import { useEffect, useState } from "react";

export default function LiveCounter() {
  const [stats, setStats] = useState<{ scoresToday: number; votesLastHour: number } | null>(null);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/stats");
      if (res.ok) setStats(await res.json());
    } catch { /* silent */ }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 60_000);
    return () => clearInterval(interval);
  }, []);

  if (!stats || (stats.scoresToday === 0 && stats.votesLastHour === 0)) return null;

  return (
    <span className="hidden sm:flex items-center gap-1.5 text-xs text-grey font-medium bg-paper border border-border-warm rounded-full px-3 py-1">
      <span className="w-1.5 h-1.5 rounded-full bg-human animate-pulse inline-block" />
      {stats.scoresToday.toLocaleString()} scores today
      {stats.votesLastHour > 0 && (
        <> · <span className="text-middle">{stats.votesLastHour} votes/hr</span></>
      )}
    </span>
  );
}
