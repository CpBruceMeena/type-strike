"use client";

import { useProgression } from "@/hooks/useProgression";
import RankBadge from "./RankBadge";
import type { RankTier } from "@/lib/types";

interface ProgressionSummaryProps {
  playerId: number | null;
  compact?: boolean;
  className?: string;
}

export default function ProgressionSummary({
  playerId,
  compact = false,
  className = "",
}: ProgressionSummaryProps) {
  const { progression, isLoading } = useProgression(playerId);

  if (isLoading) {
    return (
      <div className={`flex items-center gap-3 px-3 py-2 ${className}`}>
        <div className="h-8 w-8 animate-pulse rounded-full bg-white/5" />
        <div className="flex flex-col gap-1">
          <div className="h-3 w-16 animate-pulse rounded bg-white/5" />
          <div className="h-2 w-12 animate-pulse rounded bg-white/5" />
        </div>
      </div>
    );
  }

  if (!progression || !progression.current_tier) {
    return null;
  }

  return (
    <div className={`flex items-center gap-3 px-3 py-2 ${className}`}>
      <RankBadge
        tier={progression.current_tier}
        xp={progression.xp}
        xpToNext={progression.xp_to_next_tier}
        nextTier={progression.next_tier}
        size="sm"
        showProgress={!compact}
      />
    </div>
  );
}
