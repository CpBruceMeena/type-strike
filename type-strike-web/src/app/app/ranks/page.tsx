"use client";

import { useEffect, useState } from "react";
import TopBar from "@/components/layout/TopBar";
import GlassPanel from "@/components/ui/GlassPanel";
import { usePlayer } from "@/hooks/usePlayer";
import { useProgression } from "@/hooks/useProgression";
import { api } from "@/lib/api";
import RankBadge from "@/components/game/RankBadge";
import type { TierDetail, AllTiersDetailResponse } from "@/lib/types";

export default function RanksPage() {
  const { playerId } = usePlayer();
  const { progression, isLoading: progLoading } = useProgression(playerId);
  const [tierDetails, setTierDetails] = useState<AllTiersDetailResponse | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDetails() {
      try {
        const data = await api.getTierDetails();
        setTierDetails(data);
      } catch {
        setError("Failed to load tier details");
      } finally {
        setDetailsLoading(false);
      }
    }
    fetchDetails();
  }, []);

  const isLoading = progLoading || detailsLoading;

  // Current tier index for highlighting
  const currentTierId = progression?.current_tier?.id;

  return (
    <div className="flex min-h-dvh flex-col">
      <TopBar showBack title="RANKS" />

      <div className="mx-auto w-full max-w-3xl flex-1 px-4 pb-6 md:px-0">
        {/* Player Rank Summary */}
        {progression && (
          <GlassPanel
            glow="purple"
            blur="md"
            depth={2}
            className="mb-6 mt-4 p-4"
          >
            <div className="flex items-center justify-between">
              <RankBadge
                tier={progression.current_tier}
                xp={progression.xp}
                xpToNext={progression.xp_to_next_tier}
                nextTier={progression.next_tier}
                size="md"
                showProgress={false}
              />
              {progression.highest_tier && progression.highest_tier.id !== progression.current_tier?.id && (
                <div className="text-right">
                  <p className="text-[9px] font-bold tracking-[1.5px] text-text-muted">HIGHEST</p>
                  <p className="text-sm font-bold" style={{ color: progression.highest_tier.color }}>
                    {progression.highest_tier.icon} {progression.highest_tier.display_name}
                  </p>
                </div>
              )}
            </div>
          </GlassPanel>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-40 animate-pulse rounded-2xl bg-white/5"
              />
            ))}
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <GlassPanel glow="magma" blur="md" depth={1} className="mt-4 p-6 text-center">
            <p className="text-sm font-bold text-error-red">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-3 text-xs font-bold tracking-[2px] text-accent-primary hover:underline"
            >
              RETRY
            </button>
          </GlassPanel>
        )}

        {/* Tier Cards */}
        {!isLoading && !error && tierDetails?.tiers && (
          <div className="space-y-4 pb-8">
            {tierDetails.tiers.map((detail: TierDetail, index: number) => {
              const isCurrentTier = detail.tier.id === currentTierId;
              const isUnlocked = progression?.current_tier
                ? detail.tier.sort_order <= progression.current_tier.sort_order
                : false;
              const isNext = progression?.next_tier?.id === detail.tier.id;

              return (
                <div key={detail.tier.id} className="relative">
                  {/* Next tier indicator */}
                  {isNext && !isCurrentTier && (
                    <div className="mb-2 flex items-center gap-2">
                      <div className="h-px flex-1 bg-gradient-to-r from-transparent to-accent-gold/40" />
                      <span
                        className="rounded-full px-3 py-0.5 text-[9px] font-bold tracking-[2px]"
                        style={{
                          background: "linear-gradient(135deg, rgba(255,204,0,0.2), transparent)",
                          color: "var(--accent-gold)",
                          border: "1px solid rgba(255,204,0,0.3)",
                        }}
                      >
                        NEXT UNLOCK
                      </span>
                      <div className="h-px flex-1 bg-gradient-to-r from-accent-gold/40 to-transparent" />
                    </div>
                  )}

                  <GlassPanel
                    glow={isCurrentTier ? "purple" : "none"}
                    blur="md"
                    depth={isCurrentTier ? 3 : 1}
                    className={`overflow-hidden transition-all duration-300 ${
                      isCurrentTier ? "ring-1" : ""
                    }`}
                    style={
                      isCurrentTier
                        ? { borderColor: `${detail.tier.color}50`, boxShadow: `0 0 30px ${detail.tier.color}20` }
                        : {}
                    }
                  >
                    {/* Tier Header */}
                    <div className="flex items-center gap-4 p-4 pb-3">
                      {/* Tier icon */}
                      <div
                        className="flex h-14 w-14 items-center justify-center rounded-full text-2xl"
                        style={{
                          background: `radial-gradient(circle at 30% 30%, ${detail.tier.color}30, ${detail.tier.color}10)`,
                          boxShadow: `0 0 20px ${detail.tier.color}20`,
                        }}
                      >
                        {detail.tier.icon}
                      </div>

                      {/* Tier info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3
                            className="text-lg font-black tracking-[3px]"
                            style={{ color: detail.tier.color }}
                          >
                            {detail.tier.display_name}
                          </h3>
                          {isCurrentTier && (
                            <span
                              className="rounded-full px-2 py-0.5 text-[8px] font-bold tracking-[2px]"
                              style={{
                                background: `${detail.tier.color}30`,
                                color: detail.tier.color,
                                border: `1px solid ${detail.tier.color}50`,
                              }}
                            >
                              CURRENT
                            </span>
                          )}
                          {isUnlocked && !isCurrentTier && (
                            <span className="text-xs text-electric-cyan">✓</span>
                          )}
                        </div>
                        <p className="text-xs text-text-muted">
                          {detail.tier.description}
                        </p>
                        <p className="mt-0.5 text-[10px] font-bold tracking-[1px] text-text-muted">
                          {detail.tier.min_xp.toLocaleString()} XP
                          {detail.tier.max_xp != null
                            ? ` — ${detail.tier.max_xp.toLocaleString()} XP`
                            : "+"}
                        </p>
                      </div>

                      {/* XP progress bar */}
                      {isCurrentTier && progression?.next_tier && (
                        <div className="flex flex-col items-end gap-1">
                          <div className="h-2 w-24 overflow-hidden rounded-full bg-white/10">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${Math.min(100, Math.round(
                                  ((progression.xp - detail.tier.min_xp) /
                                    Math.max(1, (progression.next_tier.min_xp - detail.tier.min_xp))) * 100
                                ))}%`,
                                background: `linear-gradient(90deg, ${detail.tier.color}, ${progression.next_tier.color})`,
                                boxShadow: `0 0 8px ${progression.next_tier.color}`,
                              }}
                            />
                          </div>
                          <span className="text-[9px] text-text-muted">
                            {progression.xp_to_next_tier > 0
                              ? `${progression.xp_to_next_tier} XP to go`
                              : "Ready!"}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Divider */}
                    <div className="mx-4 h-px bg-white/5" />

                    {/* Titles & Themes Grid */}
                    <div className="grid grid-cols-2 gap-4 p-4 pt-3">
                      {/* Titles column */}
                      <div>
                        <p className="mb-2 text-[9px] font-bold tracking-[2px] text-text-muted">
                          TITLES
                        </p>
                        <div className="space-y-1.5">
                          {detail.titles.length > 0 ? (
                            detail.titles.map((title) => {
                              const isTitleUnlocked = progression?.unlocked_titles?.includes(title.name);
                              return (
                                <div
                                  key={title.name}
                                  className={`flex items-center gap-2 rounded-lg p-1.5 transition-all ${
                                    isTitleUnlocked
                                      ? "bg-white/5"
                                      : "opacity-40"
                                  }`}
                                >
                                  <span className="text-base">{title.icon}</span>
                                  <div>
                                    <p
                                      className={`text-xs font-bold tracking-[1px] ${
                                        isTitleUnlocked ? "text-text-white" : "text-text-muted"
                                      }`}
                                    >
                                      {title.display_name}
                                    </p>
                                    <p className="text-[9px] text-text-muted leading-tight">
                                      {title.description}
                                    </p>
                                  </div>
                                  {isTitleUnlocked && (
                                    <span className="ml-auto text-[9px] text-electric-cyan">✓</span>
                                  )}
                                </div>
                              );
                            })
                          ) : (
                            <p className="text-[10px] text-text-disabled italic">No titles</p>
                          )}
                        </div>
                      </div>

                      {/* Themes column */}
                      <div>
                        <p className="mb-2 text-[9px] font-bold tracking-[2px] text-text-muted">
                          THEMES
                        </p>
                        <div className="space-y-1.5">
                          {detail.themes.length > 0 ? (
                            detail.themes.map((theme) => {
                              const isThemeUnlocked = progression?.unlocked_themes?.includes(theme.theme_key);
                              return (
                                <div
                                  key={theme.theme_key}
                                  className={`flex items-center gap-2 rounded-lg p-1.5 transition-all ${
                                    isThemeUnlocked
                                      ? "bg-white/5"
                                      : "opacity-40"
                                  }`}
                                >
                                  <span className="text-base">{theme.icon}</span>
                                  <div>
                                    <p
                                      className={`text-xs font-bold tracking-[1px] ${
                                        isThemeUnlocked ? "text-text-white" : "text-text-muted"
                                      }`}
                                    >
                                      {theme.display_name}
                                    </p>
                                    <p className="text-[9px] text-text-muted leading-tight">
                                      {theme.description}
                                    </p>
                                  </div>
                                  {isThemeUnlocked && (
                                    <span className="ml-auto text-[9px] text-electric-cyan">✓</span>
                                  )}
                                </div>
                              );
                            })
                          ) : (
                            <p className="text-[10px] text-text-disabled italic">No themes</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </GlassPanel>
                </div>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && (!tierDetails || tierDetails.tiers.length === 0) && (
          <GlassPanel glow="magma" blur="md" depth={1} className="mt-4 p-6 text-center">
            <p className="text-sm font-bold text-text-muted">No rank tiers found</p>
          </GlassPanel>
        )}
      </div>
    </div>
  );
}
