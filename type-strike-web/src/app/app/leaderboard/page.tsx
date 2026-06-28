"use client";

import { useCallback, useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import GlassPanel from "@/components/ui/GlassPanel";
import { usePlayer } from "@/hooks/usePlayer";
import { api } from "@/lib/api";
import type { TimedLeaderboardEntry } from "@/lib/types";

// ── Tab Config ─────────────────────────────────────────

interface TabDef {
  key: string;
  label: string;
  accent: string;
  type: "global" | "daily" | "timed" | "contest";
}

const TABS: TabDef[] = [
  { key: "global", label: "GLOBAL", accent: "#FF5020", type: "global" },
  { key: "daily", label: "DAILY", accent: "#FFCC00", type: "daily" },
  { key: "timed", label: "TIMED", accent: "#00E5FF", type: "timed" },
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

// ── Entry Row ──────────────────────────────────────────

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

function EntryRow({
  entry,
  isSelf,
}: {
  entry: EntryShape;
  isSelf: boolean;
}) {
  const rankColor =
    entry.rank === 1 ? "#FFCC00" : entry.rank === 2 ? "#C0C0C0" : entry.rank === 3 ? "#CD7F32" : "var(--text-muted)";

  return (
    <Card
      className={`flex items-center gap-4 py-2.5 transition-all ${
        isSelf ? "border-accent-primary/30 bg-accent-primary/5" : ""
      }`}
    >
      {/* Rank medal */}
      <span
        className="w-7 text-center text-sm font-black tabular-nums"
        style={{ color: rankColor }}
      >
        {entry.rank <= 3 ? (["🥇", "🥈", "🥉"] as const)[entry.rank - 1] : `#${entry.rank}`}
      </span>

      {/* Avatar — gradient initials */}
      <div className="h-9 w-9 shrink-0">
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

// ── Timed Mode Section (collapsible) ───────────────────

function TimedSection({
  config,
  entries,
  playerId,
  isLoading,
}: {
  config: TimedModeDef;
  entries: TimedLeaderboardEntry[];
  playerId: number | null;
  isLoading: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const displayLimit = expanded ? entries.length : 5;
  const visible = entries.slice(0, displayLimit);
  const hasMore = entries.length > 5;

  return (
    <GlassPanel glow="none" blur="sm" depth={1} className="overflow-hidden">
      {/* Section header — clickable to expand/collapse */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-3 px-4 py-3 transition-colors hover:bg-white/[0.02]"
      >
        <span className="text-lg">{config.icon}</span>
        <div className="flex-1 text-left">
          <p className="text-xs font-bold tracking-[2px]" style={{ color: config.accent }}>
            {config.label}
          </p>
          <p className="text-[9px] text-text-muted">{config.description}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-black tabular-nums text-accent-gold">
            {entries.length > 0 ? entries[0].best_wpm : "—"}
            <span className="ml-0.5 text-[8px] font-bold text-text-muted">TOP</span>
          </p>
        </div>
        <span
          className={`ml-1 text-xs text-text-muted transition-transform duration-200 ${
            expanded ? "rotate-180" : ""
          }`}
        >
          ▼
        </span>
      </button>

      {/* Divider */}
      <div className="mx-4 h-px bg-white/[0.04]" />

      {/* Entry list */}
      <div className="px-3 py-2">
        {isLoading ? (
          <LeaderboardSkeleton rows={3} />
        ) : entries.length === 0 ? (
          <p className="py-6 text-center text-xs text-text-muted">
            No entries yet for {config.label}
          </p>
        ) : (
          <div className="space-y-1">
            {visible.map((entry) => (
              <EntryRow
                key={`${config.key}-${entry.player_id}`}
                entry={{
                  player_id: entry.player_id,
                  player_name: entry.player_name || `Player ${entry.player_id}`,
                  rank: entry.rank,
                  best_wpm: entry.best_wpm,
                  best_accuracy: entry.best_accuracy,
                }}
                isSelf={playerId === entry.player_id}
              />
            ))}
          </div>
        )}

        {/* Expand toggle */}
        {hasMore && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-1 w-full py-2 text-center text-[9px] font-bold tracking-[1.5px] text-text-muted transition-colors hover:text-text-body"
          >
            {expanded
              ? `SHOW LESS ↑`
              : `SHOW ALL ${entries.length} PLAYERS ↓`}
          </button>
        )}
      </div>
    </GlassPanel>
  );
}

// ── Main Page ──────────────────────────────────────────

export default function LeaderboardPage() {
  const { playerId } = usePlayer();
  const [activeTab, setActiveTab] = useState("global");

  // Global / Daily state
  const [entries, setEntries] = useState<EntryShape[]>([]);
  const [totalCount, setTotalCount] = useState(0);

  // Timed state (fetches all three modes)
  const [timedEntries, setTimedEntries] = useState<Record<string, TimedLeaderboardEntry[]>>({});
  const [timedLoading, setTimedLoading] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currentTab = TABS.find((t) => t.key === activeTab)!;

  // ── Fetch global/daily ──────────────────────────────

  const fetchStandardLeaderboard = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (currentTab.type === "global") {
        const resp = await api.getLeaderboardTop(50);
        setEntries(resp.entries?.map((e) => ({
          player_id: e.player_id,
          player_name: e.player_name,
          rank: e.rank,
          best_wpm: e.best_wpm,
          best_accuracy: undefined,
          xp: e.xp,
          levels_cleared: e.levels_cleared,
          total_stars: e.total_stars,
        })) ?? []);
        setTotalCount(resp.total_count ?? resp.entries?.length ?? 0);
      } else if (currentTab.type === "daily") {
        const resp = await api.getDailyLeaderboard(50);
        setEntries(resp.entries?.map((e) => ({
          player_id: e.player_id,
          player_name: e.player_name,
          rank: e.rank,
          best_wpm: e.best_wpm,
          best_accuracy: undefined,
          xp: e.xp,
          levels_cleared: e.levels_cleared,
          total_stars: e.total_stars,
        })) ?? []);
        setTotalCount(resp.total_count ?? resp.entries?.length ?? 0);
      }
    } catch (err) {
      console.error("Failed to fetch leaderboard:", err);
      setError("Failed to load leaderboard data.");
    } finally {
      setIsLoading(false);
    }
  }, [currentTab]);

  // ── Fetch all three timed leaderboards ──────────────

  const fetchTimedLeaderboards = useCallback(async () => {
    setTimedLoading(true);
    setError(null);
    try {
      const results = await Promise.allSettled(
        TIMED_MODES.map((mode) =>
          api.getTimedLeaderboard(mode.mode, 50).then((resp) => ({
            key: mode.key,
            entries: resp.entries ?? [],
          }))
        )
      );

      const acc: Record<string, TimedLeaderboardEntry[]> = {};
      for (const result of results) {
        if (result.status === "fulfilled") {
          acc[result.value.key] = result.value.entries;
        }
      }
      setTimedEntries(acc);
    } catch (err) {
      console.error("Failed to fetch timed leaderboards:", err);
      setError("Failed to load timed leaderboard data.");
    } finally {
      setTimedLoading(false);
    }
  }, []);

  // ── Effect: fetch on tab change ─────────────────────

  useEffect(() => {
    if (currentTab.type === "timed") {
      fetchTimedLeaderboards();
    } else {
      fetchStandardLeaderboard();
    }
  }, [currentTab, fetchStandardLeaderboard, fetchTimedLeaderboards]);

  // ── Render: Tab content ─────────────────────────────

  function renderContent() {
    if (isLoading || timedLoading) {
      return <LeaderboardSkeleton />;
    }

    if (error) {
      return (
        <GlassPanel glow="magma" blur="md" depth={2} className="p-8 text-center">
          <p className="mb-1 text-3xl">⚠️</p>
          <p className="mb-3 text-sm font-bold text-text-body">{error}</p>
          <button
            onClick={() => {
              if (currentTab.type === "timed") fetchTimedLeaderboards();
              else fetchStandardLeaderboard();
            }}
            className="rounded-lg bg-accent-primary/20 px-4 py-2 text-xs font-bold tracking-[1px] text-accent-primary hover:bg-accent-primary/30 transition-colors"
          >
            RETRY
          </button>
        </GlassPanel>
      );
    }

    // ── Timed layout: stacked vertical sections ─────
    if (currentTab.type === "timed") {
      return (
        <div className="space-y-3">
          {/* Personal best summary row */}
          <div className="grid grid-cols-3 gap-2">
            {TIMED_MODES.map((mode) => {
              const userEntry = timedEntries[mode.key]?.find((e) => e.player_id === playerId);
              return (
                <GlassPanel key={mode.key} glow="none" blur="sm" depth={1} className="p-3 text-center">
                  <p className="mb-0.5 text-xs">{mode.icon}</p>
                  <p className="text-lg font-black tabular-nums" style={{ color: mode.accent }}>
                    {userEntry?.best_wpm ?? "—"}
                    <span className="ml-0.5 text-[8px] font-bold text-text-muted">WPM</span>
                  </p>
                  <p className="mt-0.5 text-[8px] font-bold tracking-[1.5px] text-text-muted">
                    {mode.label}
                  </p>
                </GlassPanel>
              );
            })}
          </div>

          {/* Stacked timed sections */}
          {TIMED_MODES.map((mode) => (
            <TimedSection
              key={mode.key}
              config={mode}
              entries={timedEntries[mode.key] ?? []}
              playerId={playerId}
              isLoading={timedLoading}
            />
          ))}
        </div>
      );
    }

    // ── Global / Daily layout ─────────────────────────
    return (
      <div className="space-y-1.5">
        <div className="mb-2 flex items-center justify-between px-1">
          <span className="text-[10px] font-bold tracking-[1.5px] text-text-muted">
            {totalCount} player{totalCount !== 1 ? "s" : ""}
          </span>
          <span className="text-[10px] font-bold tracking-[1.5px] text-text-muted">
            BEST WPM
          </span>
        </div>
        {entries.length === 0 ? (
          <GlassPanel glow="none" blur="md" depth={2} className="p-8 text-center">
            <p className="mb-2 text-3xl">🏆</p>
            <p className="text-sm font-bold text-text-body">No entries yet</p>
            <p className="mt-1 text-xs text-text-muted">
              Complete levels and games to appear on the leaderboard!
            </p>
          </GlassPanel>
        ) : (
          entries.map((entry) => (
            <EntryRow
              key={`${entry.player_id}`}
              entry={entry}
              isSelf={playerId === entry.player_id}
            />
          ))
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">

      {/* Tab strip — centered with content */}
      <div className="mx-auto w-full max-w-3xl px-4 pb-3 pt-4 md:px-0 md:pt-6">
        <div className="flex gap-1.5 overflow-x-auto scrollbar-none">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="relative shrink-0 rounded-lg px-3.5 py-2 text-[10px] font-bold tracking-[2px] transition-all"
              style={{
                color: activeTab === tab.key ? tab.accent : "var(--text-muted)",
                background: activeTab === tab.key ? `${tab.accent}14` : "transparent",
              }}
            >
              {activeTab === tab.key && (
                <span
                  className="absolute inset-0 rounded-lg"
                  style={{ boxShadow: `inset 0 0 0 1px ${tab.accent}30` }}
                />
              )}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 pb-4 md:px-0 md:pb-6">
        <div className="mx-auto w-full max-w-3xl">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
