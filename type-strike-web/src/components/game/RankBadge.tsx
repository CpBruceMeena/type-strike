"use client";

import type { RankTier } from "@/lib/types";

interface RankBadgeProps {
  tier: RankTier | null;
  xp?: number;
  xpToNext?: number;
  nextTier?: RankTier | null;
  size?: "sm" | "md" | "lg";
  showProgress?: boolean;
  className?: string;
}

const SIZE_MAP = {
  sm: { icon: "text-lg", name: "text-[10px]", badge: "h-8 w-8" },
  md: { icon: "text-2xl", name: "text-xs", badge: "h-10 w-10" },
  lg: { icon: "text-3xl", name: "text-sm", badge: "h-14 w-14" },
};

export default function RankBadge({
  tier,
  xp,
  xpToNext,
  nextTier,
  size = "md",
  showProgress = true,
  className = "",
}: RankBadgeProps) {
  if (!tier) {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <div className={`${SIZE_MAP[size].badge} flex items-center justify-center rounded-full bg-white/5`}>
          <span className="text-lg opacity-40">?</span>
        </div>
        <div>
          <div className={`${SIZE_MAP[size].name} font-bold tracking-[1px] text-text-muted`}>
            UNRANKED
          </div>
        </div>
      </div>
    );
  }

  const pct = xp != null && xpToNext != null && xpToNext > 0
    ? Math.min(100, Math.round(((xp ?? 0) - tier.min_xp) / ((tier.max_xp ?? xp + xpToNext) - tier.min_xp) * 100))
    : xpToNext != null && xpToNext <= 0 ? 100 : 0;

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Tier icon circle */}
      <div
        className={`${SIZE_MAP[size].badge} flex items-center justify-center rounded-full ring-2 ring-inset`}
        style={{
          background: `radial-gradient(circle at 30% 30%, ${tier.color}30, ${tier.color}15)`,
          borderColor: `${tier.color}40`,
          boxShadow: `0 0 20px ${tier.color}20`,
        }}
      >
        <span className={SIZE_MAP[size].icon}>{tier.icon}</span>
      </div>

      {/* Tier info */}
      <div className="flex flex-col">
        <span
          className={`${SIZE_MAP[size].name} font-black tracking-[2px]`}
          style={{ color: tier.color }}
        >
          {tier.display_name.toUpperCase()}
        </span>
        {nextTier && showProgress && (
          <span className="text-[9px] tracking-[1px] text-text-muted">
            {xpToNext != null && xpToNext > 0
              ? `${xpToNext} XP to ${nextTier.display_name}`
              : "MAX TIER"}
          </span>
        )}
        {!nextTier && showProgress && (
          <span className="text-[9px] tracking-[1px] text-text-muted">
            {xp != null ? `${xp.toLocaleString()} XP` : ""}
          </span>
        )}
      </div>

      {/* Progress bar */}
      {showProgress && nextTier && (
        <div className="ml-auto flex flex-col items-end gap-1">
          <div className="h-1.5 w-20 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${pct}%`,
                background: `linear-gradient(90deg, ${tier.color}, ${nextTier.color})`,
                boxShadow: `0 0 8px ${nextTier.color}`,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
