"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import GlassPanel from "@/components/ui/GlassPanel";
import { usePlayer } from "@/hooks/usePlayer";
import { useProgression } from "@/hooks/useProgression";
import { api } from "@/lib/api";
import RankBadge from "@/components/game/RankBadge";
import type { TierDetail, AllTiersDetailResponse, LeaderboardEntry, TimedLeaderboardEntry } from "@/lib/types";

// ── Helper: top 15 + self ──────────────────────────────

function applySelfRow(all: LeaderboardEntry[], playerId: number | null): LeaderboardEntry[] {
  const top15 = all.slice(0, 15);
  const selfEntry = all.find((e) => e.player_id === playerId);
  if (selfEntry && !top15.some((e) => e.player_id === playerId)) {
    return [...top15, { ...selfEntry, rank: all.indexOf(selfEntry) + 1 }];
  }
  return top15;
}

// ── Mini entry row for preview ─────────────────────────

function PreviewEntryRow({
  entry,
  isSelf,
}: {
  entry: LeaderboardEntry;
  isSelf: boolean;
}) {
  const rankColor =
    entry.rank === 1 ? "#FFCC00" : entry.rank === 2 ? "#C0C0C0" : entry.rank === 3 ? "#CD7F32" : "var(--ts-text-dim, #9b94b3)";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "6px 0",
        borderBottom: "1px solid rgba(255,255,255,0.03)",
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-orbitron, 'Orbitron', sans-serif)",
          fontWeight: 700,
          fontSize: 14,
          width: 32,
          textAlign: "center",
          color: rankColor,
        }}
      >
        {entry.rank <= 3 ? (["🥇", "🥈", "🥉"] as const)[entry.rank - 1] : `#${entry.rank}`}
      </span>
      <span
        style={{
          flex: 1,
          fontSize: 13,
          fontWeight: isSelf ? 700 : 500,
          color: isSelf ? "var(--ts-orange, #ff6b1a)" : "var(--ts-text, #f5f3ff)",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {entry.player_name || `Player ${entry.player_id}`}
        {isSelf && (
          <span style={{ fontSize: 9, color: "var(--ts-orange, #ff6b1a)", marginLeft: 6, letterSpacing: 1, fontWeight: 700 }}>
            YOU
          </span>
        )}
      </span>
      <span
        style={{
          fontFamily: "var(--font-jetbrains-mono, 'JetBrains Mono', monospace)",
          fontWeight: 700,
          fontSize: 12,
          color: "var(--ts-orange, #ff6b1a)",
        }}
      >
        {entry.best_wpm}
      </span>
    </div>
  );
}

// ── Preview Column ─────────────────────────────────────

function PreviewColumn({
  label,
  accent,
  entries,
  playerId,
  onViewAll,
}: {
  label: string;
  accent: string;
  entries: LeaderboardEntry[];
  playerId: number | null;
  onViewAll: () => void;
}) {
  return (
    <div
      className="preview-column"
      style={{
        background: "var(--ts-bg-3, #13101c)",
        border: "1px solid var(--ts-border, rgba(255,107,26,0.18))",
        borderRadius: 12,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          padding: "12px 14px",
          borderBottom: "1px solid var(--ts-border, rgba(255,107,26,0.18))",
          background: "var(--ts-bg-2, #0d0d18)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <h4
          style={{
            fontFamily: "var(--font-orbitron, 'Orbitron', sans-serif)",
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: 2,
            color: accent,
          }}
        >
          {label}
        </h4>
        <span style={{ fontSize: 10, color: "var(--ts-text-dim, #9b94b3)" }}>
          {entries.filter((e) => e.rank != null && e.rank <= 15).length}
        </span>
      </div>
      <div style={{ padding: "8px 14px", flex: 1 }}>
        {entries.length === 0 ? (
          <p style={{ fontSize: 11, color: "var(--ts-text-dim, #9b94b3)", textAlign: "center", padding: "16px 0" }}>
            No entries yet
          </p>
        ) : (
          entries.slice(0, 15).map((entry) => (
            <PreviewEntryRow
              key={entry.player_id}
              entry={entry}
              isSelf={playerId === entry.player_id}
            />
          ))
        )}
      </div>
      <div
        onClick={onViewAll}
        style={{
          padding: "10px 14px",
          borderTop: "1px solid var(--ts-border, rgba(255,107,26,0.18))",
          textAlign: "center",
          fontSize: 11,
          fontWeight: 600,
          color: accent,
          cursor: "pointer",
          transition: "background 0.2s",
        }}
      >
        View All →
      </div>
    </div>
  );
}

// ── Timed Mode Config ──────────────────────────────────

const TIMED_MODES = [
  { key: "1min", mode: "timed_1min", label: "1 MIN", icon: "⏱️", accent: "#00E5FF" },
  { key: "3min", mode: "timed_3min", label: "3 MIN", icon: "⏳", accent: "#CC44FF" },
  { key: "5min", mode: "timed_5min", label: "5 MIN", icon: "🔥", accent: "#FF6600" },
];

// ── Main Ranks Page ────────────────────────────────────

export default function RanksPage() {
  const router = useRouter();
  const { playerId } = usePlayer();
  const { progression, isLoading: progLoading } = useProgression(playerId);
  const [tierDetails, setTierDetails] = useState<AllTiersDetailResponse | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Leaderboard preview data
  const [globalEntries, setGlobalEntries] = useState<LeaderboardEntry[]>([]);
  const [dailyEntries, setDailyEntries] = useState<LeaderboardEntry[]>([]);
  const [timedData, setTimedData] = useState<Record<string, LeaderboardEntry[]>>({});
  const [lbLoading, setLbLoading] = useState(true);
  const [activeTimedTab, setActiveTimedTab] = useState("1min");

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

  const fetchLeaderboardPreviews = useCallback(async () => {
    setLbLoading(true);
    try {
      const [globalResp, dailyResp, timed1Resp, timed3Resp, timed5Resp] = await Promise.allSettled([
        api.getLeaderboardTop(50),
        api.getDailyLeaderboard(50),
        api.getTimedLeaderboard("timed_1min", 50),
        api.getTimedLeaderboard("timed_3min", 50),
        api.getTimedLeaderboard("timed_5min", 50),
      ]);

      if (globalResp.status === "fulfilled") {
        setGlobalEntries(applySelfRow(globalResp.value.entries ?? [], playerId));
      }
      if (dailyResp.status === "fulfilled") {
        setDailyEntries(applySelfRow(dailyResp.value.entries ?? [], playerId));
      }

      const timedAcc: Record<string, LeaderboardEntry[]> = {};
      const timedResults = [timed1Resp, timed3Resp, timed5Resp];
      const timedKeys = ["1min", "3min", "5min"];
      for (let i = 0; i < timedResults.length; i++) {
        const result = timedResults[i];
        const key = timedKeys[i];
        if (result.status === "fulfilled") {
          const mapped: LeaderboardEntry[] = result.value.entries.map((e: TimedLeaderboardEntry) => ({
            player_id: e.player_id,
            player_name: e.player_name || `Player ${e.player_id}`,
            level: 0,
            xp: 0,
            total_stars: 0,
            levels_cleared: 0,
            best_wpm: e.best_wpm,
            updated_at: e.achieved_at || "",
            rank: e.rank,
          }));
          timedAcc[key] = applySelfRow(mapped, playerId);
        } else {
          timedAcc[key] = [];
        }
      }
      setTimedData(timedAcc);
    } catch {
      // Non-critical
    } finally {
      setLbLoading(false);
    }
  }, [playerId]);

  useEffect(() => {
    if (playerId) fetchLeaderboardPreviews();
  }, [playerId, fetchLeaderboardPreviews]);

  const isLoading = progLoading || detailsLoading;
  const currentTierId = progression?.current_tier?.id;

  return (
    <div className="flex min-h-dvh flex-col">
      <div className="mx-auto w-full flex-1" style={{ maxWidth: 1100, padding: "32px 28px" }}>
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
                  <p style={{ fontFamily: "var(--font-orbitron, 'Orbitron', sans-serif)", fontSize: 9, fontWeight: 700, letterSpacing: "1.5px", color: "var(--ts-text-dim, #9b94b3)", textTransform: "uppercase" }}>HIGHEST</p>
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
              <div key={i} className="h-40 animate-pulse rounded-2xl bg-white/5" />
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
            {tierDetails.tiers.map((detail: TierDetail) => {
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
                      <div
                        className="flex h-14 w-14 items-center justify-center rounded-full text-2xl"
                        style={{
                          background: `radial-gradient(circle at 30% 30%, ${detail.tier.color}30, ${detail.tier.color}10)`,
                          boxShadow: `0 0 20px ${detail.tier.color}20`,
                        }}
                      >
                        {detail.tier.icon}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 style={{ fontFamily: "var(--font-orbitron, 'Orbitron', sans-serif)", fontSize: 18, fontWeight: 900, letterSpacing: 3, color: detail.tier.color }}>
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
                        <p className="text-xs text-text-muted">{detail.tier.description}</p>
                        <p className="mt-0.5 text-[10px] font-bold tracking-[1px] text-text-muted">
                          {detail.tier.min_xp.toLocaleString()} XP
                          {detail.tier.max_xp != null
                            ? ` — ${detail.tier.max_xp.toLocaleString()} XP`
                            : "+"}
                        </p>
                      </div>

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

                    <div className="mx-4 h-px bg-white/5" />

                    <div className="grid grid-cols-2 gap-4 p-4 pt-3">
                      <div>
                        <p className="mb-2 text-[9px] font-bold tracking-[2px] text-text-muted">TITLES</p>
                        <div className="space-y-1.5">
                          {detail.titles.length > 0 ? (
                            detail.titles.map((title) => {
                              const isTitleUnlocked = progression?.unlocked_titles?.includes(title.name);
                              return (
                                <div
                                  key={title.name}
                                  className={`flex items-center gap-2 rounded-lg p-1.5 transition-all ${
                                    isTitleUnlocked ? "bg-white/5" : "opacity-40"
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
                                    <p className="text-[9px] text-text-muted leading-tight">{title.description}</p>
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

                      <div>
                        <p className="mb-2 text-[9px] font-bold tracking-[2px] text-text-muted">THEMES</p>
                        <div className="space-y-1.5">
                          {detail.themes.length > 0 ? (
                            detail.themes.map((theme) => {
                              const isThemeUnlocked = progression?.unlocked_themes?.includes(theme.theme_key);
                              return (
                                <div
                                  key={theme.theme_key}
                                  className={`flex items-center gap-2 rounded-lg p-1.5 transition-all ${
                                    isThemeUnlocked ? "bg-white/5" : "opacity-40"
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
                                    <p className="text-[9px] text-text-muted leading-tight">{theme.description}</p>
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

        {/* ── Leaderboard Preview Columns ──────────────── */}
        <div className="mt-10">
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
              marginBottom: 20,
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <div>
              <h2
                style={{
                  fontFamily: "var(--font-orbitron, 'Orbitron', sans-serif)",
                  fontSize: 18,
                  fontWeight: 800,
                  letterSpacing: 2,
                  color: "var(--ts-text, #f5f3ff)",
                }}
              >
                TOP <span style={{ color: "var(--ts-orange, #ff6b1a)" }}>PLAYERS</span>
              </h2>
              <p style={{ color: "var(--ts-text-dim, #9b94b3)", fontSize: 13, marginTop: 4 }}>
                Global · Daily · Timed leaderboards
              </p>
            </div>
          </div>

          {lbLoading ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: 16,
              }}
            >
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  style={{
                    height: 320,
                    borderRadius: 12,
                    background: "var(--ts-bg-3, #13101c)",
                    border: "1px solid var(--ts-border, rgba(255,107,26,0.18))",
                    animation: "pulse 1.5s ease-in-out infinite",
                  }}
                />
              ))}
            </div>
          ) : (
            <div
              className="preview-columns-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: 16,
              }}
            >
              <PreviewColumn
                label="GLOBAL"
                accent="#FF5020"
                entries={globalEntries}
                playerId={playerId}
                onViewAll={() => router.push("/app/leaderboard")}
              />
              <PreviewColumn
                label="DAILY"
                accent="#FFCC00"
                entries={dailyEntries}
                playerId={playerId}
                onViewAll={() => router.push("/app/leaderboard")}
              />
              {/* TIMED — Tabbed Column */}
              <div
                className="preview-column"
                style={{
                  background: "var(--ts-bg-3, #13101c)",
                  border: "1px solid var(--ts-border, rgba(255,107,26,0.18))",
                  borderRadius: 12,
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {/* Header with pills on the right side of TIMED title */}
                <div
                  style={{
                    padding: "10px 14px",
                    borderBottom: "1px solid var(--ts-border, rgba(255,107,26,0.18))",
                    background: "var(--ts-bg-2, #0d0d18)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <h4
                        style={{
                          fontFamily: "var(--font-orbitron, 'Orbitron', sans-serif)",
                          fontSize: 12,
                          fontWeight: 700,
                          letterSpacing: 2,
                          color: "#00E5FF",
                        }}
                      >
                        TIMED
                      </h4>
                      {/* Pill tabs on right side of title */}
                      <div style={{ display: "flex", gap: 3 }}>
                        {TIMED_MODES.map((mode) => {
                          const isActive = activeTimedTab === mode.key;
                          return (
                            <button
                              key={mode.key}
                              onClick={(e) => { e.stopPropagation(); setActiveTimedTab(mode.key); }}
                              style={{
                                padding: "3px 8px",
                                borderRadius: 5,
                                border: "none",
                                cursor: "pointer",
                                fontSize: 9,
                                fontWeight: 700,
                                fontFamily: "var(--font-jetbrains-mono, 'JetBrains Mono', monospace)",
                                letterSpacing: "0.5px",
                                background: isActive ? `${mode.accent}18` : "transparent",
                                color: isActive ? mode.accent : "var(--ts-text-dim, #9b94b3)",
                                transition: "all 0.15s",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {mode.icon} {mode.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <span style={{ fontSize: 10, color: "var(--ts-text-dim, #9b94b3)" }}>
                      {(timedData[activeTimedTab] ?? []).filter((e) => e.rank != null && e.rank <= 15).length}
                    </span>
                  </div>
                </div>
                <div style={{ padding: "8px 14px", flex: 1 }}>
                  {(timedData[activeTimedTab] ?? []).length === 0 ? (
                    <p style={{ fontSize: 11, color: "var(--ts-text-dim, #9b94b3)", textAlign: "center", padding: "16px 0" }}>
                      No entries yet
                    </p>
                  ) : (
                    (timedData[activeTimedTab] ?? []).slice(0, 15).map((entry) => (
                      <PreviewEntryRow
                        key={entry.player_id}
                        entry={entry}
                        isSelf={playerId === entry.player_id}
                      />
                    ))
                  )}
                </div>
                <div
                  onClick={() => router.push("/app/leaderboard")}
                  style={{
                    padding: "10px 14px",
                    borderTop: "1px solid var(--ts-border, rgba(255,107,26,0.18))",
                    textAlign: "center",
                    fontSize: 11,
                    fontWeight: 600,
                    color: "#00E5FF",
                    cursor: "pointer",
                    transition: "background 0.2s",
                  }}
                >
                  View All →
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── User Rank Summary Row ──────────────────── */}
        {playerId && !lbLoading && (
          <div
            style={{
              marginTop: 24,
              padding: "16px 20px",
              background: "var(--ts-bg-3, #13101c)",
              border: "1px solid var(--ts-border, rgba(255,107,26,0.18))",
              borderRadius: 12,
              display: "flex",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 16,
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-orbitron, 'Orbitron', sans-serif)",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: 2,
                color: "var(--ts-text-dim, #9b94b3)",
                textTransform: "uppercase",
                whiteSpace: "nowrap",
              }}
            >
              YOUR RANKS
            </span>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
              {[
                { label: "Global", entries: globalEntries, color: "#FF5020" },
                { label: "Daily", entries: dailyEntries, color: "#FFCC00" },
                { label: "1min", entries: timedData["1min"] ?? [], color: "#00E5FF" },
                { label: "3min", entries: timedData["3min"] ?? [], color: "#CC44FF" },
                { label: "5min", entries: timedData["5min"] ?? [], color: "#FF6600" },
              ].map((cat) => {
                const selfEntry = cat.entries.find((e) => e.player_id === playerId);
                const rank = selfEntry?.rank ?? null;
                return (
                  <span
                    key={cat.label}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "6px 12px",
                      borderRadius: 8,
                      background: "var(--ts-bg-1, #0d0a14)",
                      border: `1px solid ${cat.color}25`,
                      fontSize: 13,
                      fontWeight: 600,
                      fontFamily: "var(--font-jetbrains-mono, 'JetBrains Mono', monospace)",
                    }}
                  >
                    <span style={{ color: "var(--ts-text-dim, #9b94b3)", fontSize: 10, fontWeight: 500 }}>
                      {cat.label}:
                    </span>
                    <span style={{ color: rank != null ? cat.color : "var(--ts-text-dim, #9b94b3)" }}>
                      {rank != null ? `#${rank}` : "—"}
                    </span>
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <style>{`
        .preview-columns-grid {
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        }
        @media (min-width: 900px) {
          .preview-columns-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }
        .preview-column:hover {
          border-color: rgba(255,107,26,0.35) !important;
        }
      `}</style>
    </div>
  );
}
