"use client";

import { useCallback, useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import Card from "@/components/ui/Card";
import GlassPanel from "@/components/ui/GlassPanel";
import { usePlayer } from "@/hooks/usePlayer";
import { api } from "@/lib/api";
import type { TimedLeaderboardEntry } from "@/lib/types";

// ── Column Config ─────────────────────────────────────

const COLUMNS: {
  key: string;
  label: string;
  accent: string;
}[] = [
  { key: "global", label: "GLOBAL", accent: "#FF5020" },
  { key: "daily", label: "DAILY", accent: "#FFCC00" },
  { key: "timed", label: "TIMED", accent: "#00E5FF" },
];

// ── Timed Mode Config ──────────────────────────────────

interface TimedModeDef {
  key: string;
  mode: string;
  label: string;
  icon: string;
  accent: string;
  description: string;
}

const TIMED_MODES: TimedModeDef[] = [
  { key: "1min", mode: "timed_1min", label: "1 MIN", icon: "⏱️", accent: "#00E5FF", description: "60-second sprint" },
  { key: "3min", mode: "timed_3min", label: "3 MIN", icon: "⏳", accent: "#CC44FF", description: "3-minute endurance" },
  { key: "5min", mode: "timed_5min", label: "5 MIN", icon: "🔥", accent: "#FF6600", description: "5-minute marathon" },
];

// ── Column Data Shape ─────────────────────────────────

interface ColumnData {
  entries: EntryShape[];
  totalCount: number;
}

// ── Entry Shape ────────────────────────────────────────

interface EntryShape {
  player_id: number;
  player_name: string;
  rank: number;
  best_wpm: number;
  best_accuracy?: number;
  xp?: number;
  levels_cleared?: number;
  total_stars?: number;
}

// ── Entry Row Component ────────────────────────────────

function EntryRow({
  entry,
  isSelf,
  currentUserImageUrl,
}: {
  entry: EntryShape;
  isSelf: boolean;
  currentUserImageUrl?: string | null;
}) {
  const rankColor =
    entry.rank === 1 ? "#FFCC00" : entry.rank === 2 ? "#C0C0C0" : entry.rank === 3 ? "#CD7F32" : "var(--ts-text-dim, #9b94b3)";

  return (
    <Card
      className={`flex items-center gap-4 py-2.5 transition-all ${
        isSelf ? "border-accent-primary/30 bg-accent-primary/5" : ""
      }`}
    >
      {/* Rank */}
      <span
        className="w-7 text-center text-sm font-black tabular-nums"
        style={{ color: rankColor }}
      >
        {entry.rank <= 3 ? (["🥇", "🥈", "🥉"] as const)[entry.rank - 1] : `#${entry.rank}`}
      </span>

      {/* Avatar */}
      <div className="h-9 w-9 shrink-0">
        {isSelf && currentUserImageUrl ? (
          <img
            src={currentUserImageUrl}
            alt={entry.player_name || "Profile"}
            referrerPolicy="no-referrer"
            className="h-9 w-9 rounded-full object-cover"
            style={{ border: "2px solid var(--accent-primary, #ff6b1a)" }}
          />
        ) : (
          <div
            className="flex h-9 w-9 items-center justify-center rounded-full text-[10px] font-black text-white"
            style={{
              background: isSelf
                ? "linear-gradient(135deg, #f97316, #dc2626)"
                : "linear-gradient(135deg, #2a2a3a, #1a1a28)",
            }}
          >
            {entry.player_name?.[0]?.toUpperCase() || "?"}
          </div>
        )}
      </div>

      {/* Name */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-bold text-text-white">
            {entry.player_name || `Player ${entry.player_id}`}
          </span>
          {isSelf && (
            <span className="shrink-0 rounded bg-accent-primary/20 px-1.5 py-0.5 text-[8px] font-bold tracking-[1px] text-accent-primary">
              YOU
            </span>
          )}
        </div>
        {entry.best_accuracy != null ? (
          <p className="text-[10px] text-text-muted">
            {(entry.best_accuracy * 100).toFixed(0)}% accuracy
          </p>
        ) : entry.xp != null ? (
          <p className="text-[10px] text-text-muted">
            {entry.xp.toLocaleString()} XP · {entry.levels_cleared ?? 0} levels
            {entry.total_stars != null && ` · ${entry.total_stars}★`}
          </p>
        ) : null}
      </div>

      {/* WPM */}
      <div className="text-right">
        <p className="text-sm font-black tabular-nums text-accent-gold">
          {entry.best_wpm}
          <span className="ml-0.5 text-[9px] font-bold text-text-muted">WPM</span>
        </p>
      </div>
    </Card>
  );
}

// ── Loading Skeleton ───────────────────────────────────

function LeaderboardSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <Card key={i} className="flex items-center gap-4 py-3">
          <div className="h-5 w-8 animate-pulse rounded bg-white/5" />
          <div className="h-10 w-10 animate-pulse rounded-full bg-white/5" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 w-28 animate-pulse rounded bg-white/5" />
            <div className="h-2.5 w-16 animate-pulse rounded bg-white/5" />
          </div>
          <div className="h-4 w-14 animate-pulse rounded bg-white/5" />
        </Card>
      ))}
    </div>
  );
}

// ── Helper: add player at bottom if not in top 15 ─────

function applySelfRow(all: EntryShape[], playerId: number | null): EntryShape[] {
  const top15 = all.slice(0, 15);
  const selfEntry = all.find((e) => e.player_id === playerId);
  if (selfEntry && !top15.some((e) => e.player_id === playerId)) {
    return [...top15, { ...selfEntry, rank: all.indexOf(selfEntry) + 1 }];
  }
  return top15;
}

// ── Column Entry List ──────────────────────────────────

function ColumnEntryList({
  entries,
  totalCount,
  playerId,
  userImageUrl,
  isLoading,
  accent,
}: {
  entries: EntryShape[];
  totalCount: number;
  playerId: number | null;
  userImageUrl?: string | null;
  isLoading: boolean;
  accent: string;
}) {
  if (isLoading) {
    return <LeaderboardSkeleton rows={6} />;
  }

  if (entries.length === 0) {
    return (
      <div style={{ padding: "24px 12px", textAlign: "center", color: "var(--ts-text-dim, #9b94b3)", fontSize: 12 }}>
        No entries yet
      </div>
    );
  }

  return (
    <div className="space-y-1" style={{ maxHeight: 560, overflowY: "auto" }}>
      {entries.map((entry) => (
        <EntryRow
          key={`${entry.player_id}-${entry.rank}`}
          entry={entry}
          isSelf={playerId === entry.player_id}
          currentUserImageUrl={entry.player_id === playerId ? userImageUrl : undefined}
        />
      ))}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────

export default function LeaderboardPage() {
  const { user } = useUser();
  const { playerId } = usePlayer();

  // All three columns fetched simultaneously
  const [globalData, setGlobalData] = useState<ColumnData>({ entries: [], totalCount: 0 });
  const [dailyData, setDailyData] = useState<ColumnData>({ entries: [], totalCount: 0 });
  const [timedData, setTimedData] = useState<Record<string, EntryShape[]>>({});
  const [activeTimedTab, setActiveTimedTab] = useState("1min");

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timedCounts, setTimedCounts] = useState<Record<string, number>>({});

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [globalResp, dailyResp, timed1Resp, timed3Resp, timed5Resp] = await Promise.allSettled([
        api.getLeaderboardTop(50),
        api.getDailyLeaderboard(50),
        api.getTimedLeaderboard("timed_1min", 50),
        api.getTimedLeaderboard("timed_3min", 50),
        api.getTimedLeaderboard("timed_5min", 50),
      ]);

      if (globalResp.status === "fulfilled") {
        const all = (globalResp.value.entries ?? []).map((e) => ({
          player_id: e.player_id,
          player_name: e.player_name,
          rank: e.rank,
          best_wpm: e.best_wpm,
          xp: e.xp,
          levels_cleared: e.levels_cleared,
          total_stars: e.total_stars,
        }));
        setGlobalData({
          entries: applySelfRow(all, playerId),
          totalCount: globalResp.value.total_count ?? all.length,
        });
      }

      if (dailyResp.status === "fulfilled") {
        const all = (dailyResp.value.entries ?? []).map((e) => ({
          player_id: e.player_id,
          player_name: e.player_name,
          rank: e.rank,
          best_wpm: e.best_wpm,
          xp: e.xp,
          levels_cleared: e.levels_cleared,
          total_stars: e.total_stars,
        }));
        setDailyData({
          entries: applySelfRow(all, playerId),
          totalCount: dailyResp.value.total_count ?? all.length,
        });
      }

      const timedResults = [timed1Resp, timed3Resp, timed5Resp];
      const timedKeys = ["1min", "3min", "5min"];
      const timedAcc: Record<string, EntryShape[]> = {};
      const timedCountAcc: Record<string, number> = {};
      for (let i = 0; i < timedResults.length; i++) {
        const result = timedResults[i];
        const key = timedKeys[i];
        if (result.status === "fulfilled") {
          const all = result.value.entries.map((e) => ({
            player_id: e.player_id,
            player_name: e.player_name || `Player ${e.player_id}`,
            rank: e.rank,
            best_wpm: e.best_wpm,
            best_accuracy: e.best_accuracy,
          }));
          timedAcc[key] = applySelfRow(all, playerId);
          timedCountAcc[key] = result.value.total_count ?? all.length;
        }
      }
      setTimedData(timedAcc);
      setTimedCounts(timedCountAcc);
    } catch (err) {
      console.error("Failed to fetch leaderboards:", err);
      setError("Failed to load leaderboard data.");
    } finally {
      setIsLoading(false);
    }
  }, [playerId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // ── Render ──────────────────────────────────────────

  if (error && !isLoading && !globalData.entries.length && !dailyData.entries.length && Object.keys(timedData).length === 0) {
    return (
      <div className="flex flex-1 flex-col" style={{ padding: "32px 28px" }}>
        <div style={{ textAlign: "center", padding: "60px 20px" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <p style={{ color: "var(--ts-text, #f5f3ff)", fontWeight: 600, marginBottom: 8 }}>{error}</p>
          <button
            onClick={fetchAll}
            style={{
              padding: "8px 20px",
              borderRadius: 8,
              border: "none",
              background: "var(--ts-orange, #ff6b1a)",
              color: "#fff",
              fontWeight: 600,
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            RETRY
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex-1" style={{ padding: "32px 28px" }}>
        <div className="mx-auto w-full" style={{ maxWidth: 1400 }}>
          {/* Three-column grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* GLOBAL */}
            <div
              className="column-card"
              style={{
                background: "var(--ts-bg-3, #13101c)",
                border: "1px solid var(--ts-border, rgba(255,107,26,0.18))",
                borderRadius: 14,
                overflow: "hidden",
              }}
            >
              <div
                className="column-header"
                style={{
                  padding: "14px 16px",
                  borderBottom: "1px solid var(--ts-border, rgba(255,107,26,0.18))",
                  background: "var(--ts-bg-2, #0d0d18)",
                }}
              >
                <h3
                  style={{
                    fontFamily: "var(--font-orbitron, 'Orbitron', sans-serif)",
                    fontSize: 14,
                    fontWeight: 800,
                    letterSpacing: 3,
                    color: "#FF5020",
                  }}
                >
                  GLOBAL
                </h3>
                <p style={{ fontSize: 11, color: "var(--ts-text-dim, #9b94b3)", marginTop: 2 }}>
                  {globalData.totalCount} players
                </p>
              </div>
              <div style={{ padding: "8px 12px" }}>
                <ColumnEntryList
                  entries={globalData.entries}
                  totalCount={globalData.totalCount}
                  playerId={playerId}
                  userImageUrl={user?.imageUrl}
                  isLoading={isLoading}
                  accent="#FF5020"
                />
              </div>
            </div>

            {/* DAILY */}
            <div
              className="column-card"
              style={{
                background: "var(--ts-bg-3, #13101c)",
                border: "1px solid var(--ts-border, rgba(255,107,26,0.18))",
                borderRadius: 14,
                overflow: "hidden",
              }}
            >
              <div
                className="column-header"
                style={{
                  padding: "14px 16px",
                  borderBottom: "1px solid var(--ts-border, rgba(255,107,26,0.18))",
                  background: "var(--ts-bg-2, #0d0d18)",
                }}
              >
                <h3
                  style={{
                    fontFamily: "var(--font-orbitron, 'Orbitron', sans-serif)",
                    fontSize: 14,
                    fontWeight: 800,
                    letterSpacing: 3,
                    color: "#FFCC00",
                  }}
                >
                  DAILY
                </h3>
                <p style={{ fontSize: 11, color: "var(--ts-text-dim, #9b94b3)", marginTop: 2 }}>
                  {dailyData.totalCount} players
                </p>
              </div>
              <div style={{ padding: "8px 12px" }}>
                <ColumnEntryList
                  entries={dailyData.entries}
                  totalCount={dailyData.totalCount}
                  playerId={playerId}
                  userImageUrl={user?.imageUrl}
                  isLoading={isLoading}
                  accent="#FFCC00"
                />
              </div>
            </div>

            {/* TIMED (pill tabs) */}
            <div
              className="column-card"
              style={{
                background: "var(--ts-bg-3, #13101c)",
                border: "1px solid var(--ts-border, rgba(255,107,26,0.18))",
                borderRadius: 14,
                overflow: "hidden",
              }}
            >
              <div
                className="column-header"
                style={{
                  padding: "14px 16px",
                  borderBottom: "1px solid var(--ts-border, rgba(255,107,26,0.18))",
                  background: "var(--ts-bg-2, #0d0d18)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <h3
                    style={{
                      fontFamily: "var(--font-orbitron, 'Orbitron', sans-serif)",
                      fontSize: 14,
                      fontWeight: 800,
                      letterSpacing: 3,
                      color: "#00E5FF",
                    }}
                  >
                    TIMED
                  </h3>
                  {/* Pill tabs inline */}
                  <div style={{ display: "flex", gap: 4 }}>
                    {TIMED_MODES.map((mode) => (
                      <button
                        key={mode.key}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveTimedTab(mode.key);
                        }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                          padding: "4px 8px",
                          borderRadius: 6,
                          border: "1px solid",
                          borderColor: activeTimedTab === mode.key ? mode.accent : "rgba(255,255,255,0.08)",
                          background: activeTimedTab === mode.key ? `${mode.accent}15` : "transparent",
                          cursor: "pointer",
                          fontFamily: "var(--font-orbitron, 'Orbitron', sans-serif)",
                          fontSize: 9,
                          fontWeight: 700,
                          letterSpacing: 1,
                          color: activeTimedTab === mode.key ? mode.accent : "var(--ts-text-dim, #9b94b3)",
                          transition: "all 0.15s",
                        }}
                      >
                        <span style={{ fontSize: 10 }}>{mode.icon}</span>
                        {mode.label}
                      </button>
                    ))}
                  </div>
                </div>
                <p style={{ fontSize: 11, color: "var(--ts-text-dim, #9b94b3)", marginTop: 2 }}>
                  {timedCounts[activeTimedTab] ?? 0} players · {TIMED_MODES.find(m => m.key === activeTimedTab)?.description}
                </p>
              </div>
              <div style={{ padding: "8px 12px" }}>
                <ColumnEntryList
                  entries={timedData[activeTimedTab] ?? []}
                  totalCount={timedCounts[activeTimedTab] ?? 0}
                  playerId={playerId}
                  userImageUrl={user?.imageUrl}
                  isLoading={isLoading}
                  accent={TIMED_MODES.find(m => m.key === activeTimedTab)?.accent ?? "#00E5FF"}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .column-card {
          transition: border-color 0.2s;
        }
        .column-card:hover {
          border-color: rgba(255,107,26,0.3);
        }
        @media (max-width: 768px) {
          .column-card { margin-bottom: 12px; }
        }
      `}</style>
    </div>
  );
}
