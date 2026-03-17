import { scoreLabel, markerLeft, consensusScore } from "@/lib/scoring";

interface CommunityScoreProps {
  algorithmScore: number;
  communityScore: number | null;
  voteCount: number;
}

const THRESHOLD = 10;

export default function CommunityScore({ algorithmScore, communityScore, voteCount }: CommunityScoreProps) {
  const consensus = consensusScore(algorithmScore, communityScore);
  const hasCommunity = communityScore !== null;

  return (
    <div className="bg-card border border-border-warm rounded-card p-6 shadow-card space-y-5">
      <p className="text-xs font-semibold uppercase tracking-widest text-grey">Scores</p>

      {/* Algorithm score */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-grey">Algorithm</span>
          <span className="text-lg font-bold font-mono text-navy">
            {algorithmScore}% AI
          </span>
        </div>
        <div className="relative h-3 spectrum-bar w-full">
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-white border-2 border-navy shadow-sm transition-all"
            style={{ left: `${markerLeft(algorithmScore)}%` }}
          />
        </div>
      </div>

      {/* Community score */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-grey">
            Community{" "}
            <span className="text-xs text-grey-light">
              ({voteCount} {voteCount === 1 ? "vote" : "votes"})
            </span>
          </span>
          {hasCommunity ? (
            <span className="text-lg font-bold font-mono text-navy">
              {Math.round(communityScore!)}% AI
            </span>
          ) : (
            <span className="text-xs text-grey">
              {voteCount}/{THRESHOLD} votes needed
            </span>
          )}
        </div>
        {hasCommunity ? (
          <div className="relative h-3 spectrum-bar w-full">
            <div
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-white border-2 border-navy shadow-sm transition-all"
              style={{ left: `${markerLeft(Math.round(communityScore!))}%` }}
            />
          </div>
        ) : (
          <div className="h-3 rounded-full bg-border-light overflow-hidden">
            <div
              className="h-full rounded-full bg-human/30 transition-all"
              style={{ width: `${(voteCount / THRESHOLD) * 100}%` }}
            />
          </div>
        )}
      </div>

      {/* Consensus */}
      {hasCommunity && (
        <div className="pt-3 border-t border-border-light">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-navy">Consensus</span>
            <span className="text-xl font-bold font-mono text-navy">
              {consensus}% AI
            </span>
          </div>
          <div className="relative h-4 spectrum-bar w-full">
            <div
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-white border-2 border-navy shadow-sm transition-all"
              style={{ left: `${markerLeft(consensus)}%` }}
            />
          </div>
          <p className="text-xs text-grey mt-2 text-center">{scoreLabel(consensus)}</p>
        </div>
      )}
    </div>
  );
}
