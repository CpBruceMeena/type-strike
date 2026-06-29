"use client";

import { useCallback, useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import GlassPanel from "@/components/ui/GlassPanel";
import ProgressBar from "@/components/ui/ProgressBar";
import { usePlayer } from "@/hooks/usePlayer";
import { api } from "@/lib/api";
import { xpForNextLevel, xpProgress } from "@/lib/constants";
import type { PlayerSummary, GameHistoryEntry, LevelCompleteResponse, ActivityEvent } from "@/lib/types";

// ── Types ──────────────────────────────────────────────

interface StatsData {
  totalGames: number;
  bestWpm: number;
  avgAccuracy: number;
  totalXp: number;
  levelsCleared: number;
  levelsTotal: number;
  streak: number;
  playerLevel: number;
  bestTimedWpm: number;
  totalStars: number;
  recentActivity: ActivityEvent[];
  gameHistory: GameHistoryEntry[];
  levelProgress: LevelCompleteResponse[];
}

// ── Loading Skeleton ───────────────────────────────────

function StatsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-4 text-center">
            <div className="mx-auto mb-2 h-7 w-16 animate-pulse rounded bg-white/5" />
            <div className="mx-auto h-3 w-12 animate-pulse rounded bg-white/5" />
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card className="p-4">
          <div className="mb-3 h-3 w-28 animate-pulse rounded bg-white/5" />
          <div className="mb-2 h-6 w-20 animate-pulse rounded bg-white/5" />
          <div className="h-2 w-full animate-pulse rounded bg-white/5" />
        </Card>
        <Card className="p-4">
          <div className="mb-3 h-3 w-24 animate-pulse rounded bg-white/5" />
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-4 w-full animate-pulse rounded bg-white/5" />
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ── Stat Card ──────────────────────────────────────────

function StatCard({
  label,
  value,
  accent,
  suffix,
}: {
  label: string;
  value: string | number;
  accent: string;
  suffix?: string;
}) {
  return (
    <GlassPanel glow="none" blur="sm" depth={1} className="p-4 text-center">
      <p
        className="text-2xl font-black tabular-nums md:text-3xl"
        style={{ color: accent }}
      >
        {value}
        {suffix && (
          <span className="ml-0.5 text-sm font-bold text-text-muted">{suffix}</span>
        )}
      </p>
      <p className="mt-1 text-[9px] font-bold tracking-[1.5px] text-text-muted">{label}</p>
    </GlassPanel>
  );
}

// ── Format time ago ────────────────────────────────────

function timeAgo(timestamp: string): string {
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  const diffSec = Math.floor((now - then) / 1000);
  if (diffSec < 60) return "just now";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  return `${Math.floor(diffSec / 86400)}d ago`;
}

// ── Activity Icon ──────────────────────────────────────

function activityIcon(type: string): string {
  switch (type) {
    case "level_completed": return "✅";
    case "level_failed": return "❌";
    case "achievement": return "🏅";
    case "level_up": return "⬆️";
    case "new_high_score": return "🔥";
    default: return "📝";
  }
}

// ── Main Page ─────────────────────────────────────────

export default function StatsPage() {
  const { playerId, isLoading: playerLoading } = usePlayer();

  const [data, setData] = useState<StatsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    if (!playerId) return;
    setIsLoading(true);
    setError(null);

    try {
      const [summary, history, progress] = await Promise.all([
        api.getPlayerSummary(playerId).catch(() => null),
        api.getGameHistory(playerId, undefined, 20).catch(() => null),
        api.getAllPlayerProgress(playerId).catch(() => null),
      ]);

      // If all three failed, show error
      if (!summary && !history && !progress) {
        throw new Error("All API calls failed");
      }

      // Compute best timed WPM from game history
      const completedGames = history?.games ?? [];
      const bestTimedWpm = completedGames
        .filter((g) => g.mode.startsWith("timed_"))
        .reduce((best, g) => Math.max(best, g.wpm), 0);

      // Compute average accuracy from game history
      const accuracies = completedGames
        .filter((g) => g.wpm > 0)
        .map((g) => g.accuracy);
      const avgAccuracy =
        accuracies.length > 0
          ? accuracies.reduce((s, a) => s + a, 0) / accuracies.length
          : summary?.player?.xp
          ? 0.9
          : 0;

      // Count all completed games
      const totalGames = completedGames.length || summary?.levels_cleared || 0;

      setData({
        totalGames: completedGames.length || 0,
        bestWpm: summary?.todays_best_wpm ?? bestTimedWpm,
        avgAccuracy,
        totalXp: summary?.player?.xp ?? 0,
        levelsCleared: summary?.levels_cleared ?? progress?.filter((p) => p.completed).length ?? 0,
        levelsTotal: summary?.levels_total ?? 100,
        streak: summary?.streak_count ?? 0,
        playerLevel: summary?.player?.level ?? 1,
        bestTimedWpm,
        totalStars: summary?.player?.total_stars ?? 0,
        recentActivity: summary?.recent_activity ?? [],
        gameHistory: completedGames,
        levelProgress: progress ?? [],
      });
    } catch (err) {
      console.error("Failed to fetch stats:", err);
      setError("Failed to load stats. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [playerId]);

  useEffect(() => {
    if (playerId) fetchStats();
  }, [playerId, fetchStats]);

  const loading = playerLoading || isLoading;

  if (loading) {
    return (
      <div className="flex flex-1 flex-col">
          <div className="flex-1 px-4 py-4 md:px-0 md:py-6">
          <div className="mx-auto w-full max-w-3xl">
            <StatsSkeleton />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-1 flex-col">
          <div className="flex flex-1 items-center justify-center p-8">
          <GlassPanel glow="magma" blur="md" depth={2} className="p-8 text-center">
            <p className="mb-1 text-3xl">⚠️</p>
            <p className="mb-3 text-sm font-bold text-text-body">{error}</p>
            <button
              onClick={fetchStats}
              className="rounded-lg bg-accent-primary/20 px-4 py-2 text-xs font-bold tracking-[1px] text-accent-primary hover:bg-accent-primary/30 transition-colors"
            >
              RETRY
            </button>
          </GlassPanel>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-1 flex-col">
          <div className="flex flex-1 items-center justify-center p-8">
          <GlassPanel glow="none" blur="md" depth={2} className="p-8 text-center">
            <p className="mb-2 text-3xl">📊</p>
            <p className="text-sm font-bold text-text-body">No stats yet</p>
            <p className="mt-1 text-xs text-text-muted">
              Complete some games to see your stats here!
            </p>
          </GlassPanel>
        </div>
      </div>
    );
  }

  const xpProgressVal = xpProgress(data.totalXp, data.playerLevel);
  const xpNeeded = xpForNextLevel(data.playerLevel);

  return (
    <div className="flex flex-1 flex-col">

      <div className="flex-1" style={{ padding: "32px 28px" }}>
        <div className="mx-auto w-full" style={{ maxWidth: 1100 }}>
          <div className="space-y-5">
          {/* Player Level Banner */}
          <GlassPanel glow="magma" blur="md" depth={2} className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-accent-primary/15 text-2xl font-black text-accent-primary">
                {data.playerLevel}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-text-white">
                  Level {data.playerLevel}
                </p>
                <p className="text-[10px] text-text-muted">
                  {data.totalXp.toLocaleString()} / {xpNeeded.toLocaleString()} XP —{" "}
                  {data.streak > 0 ? `${data.streak} day streak 🔥` : "No streak"}
                </p>
                <div className="mt-2">
                  <ProgressBar
                    value={xpProgressVal}
                    color="var(--accent-primary)"
                    height={4}
                  />
                </div>
              </div>
            </div>
          </GlassPanel>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatCard label="GAMES PLAYED" value={data.totalGames} accent="#FF5020" />
            <StatCard label="BEST WPM" value={data.bestWpm} accent="#FFCC00" suffix="WPM" />
            <StatCard
              label="AVG ACCURACY"
              value={`${(data.avgAccuracy * 100).toFixed(0)}`}
              accent="#CC44FF"
              suffix="%"
            />
            <StatCard
              label="TOTAL XP"
              value={data.totalXp.toLocaleString()}
              accent="#00F0FF"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Level Progress */}
            <GlassPanel glow="none" blur="sm" depth={1} className="p-4">
              <p className="mb-3 text-[9px] font-semibold tracking-[1.5px] text-text-muted">
                LEVEL PROGRESS
              </p>
              <p className="mb-1 text-lg font-bold text-text-white md:text-xl">
                {data.levelsCleared}{" "}
                <span className="text-sm font-normal text-text-muted">
                  / {data.levelsTotal}
                </span>
              </p>
              <ProgressBar
                value={data.levelsCleared / data.levelsTotal}
                color="#22DD44"
                height={6}
              />
              <div className="mt-2 flex items-center justify-between text-[9px] text-text-muted">
                <span>
                  {data.totalStars}★ total
                </span>
                <span>
                  {Math.round((data.levelsCleared / data.levelsTotal) * 100)}%
                </span>
              </div>
            </GlassPanel>

            {/* Recent Activity */}
            <GlassPanel glow="none" blur="sm" depth={1} className="p-4">
              <p className="mb-3 text-[9px] font-semibold tracking-[1.5px] text-text-muted">
                RECENT ACTIVITY
              </p>
              {data.recentActivity.length === 0 ? (
                <p className="text-sm text-text-muted">
                  No activity yet. Start typing!
                </p>
              ) : (
                <div className="space-y-2">
                  {data.recentActivity.slice(0, 6).map((a) => (
                    <div key={a.id} className="flex items-center gap-2 text-xs">
                      <span>{activityIcon(a.type)}</span>
                      <span className="flex-1 truncate text-text-body">
                        {a.type.replace(/_/g, " ")}
                      </span>
                      <span className="shrink-0 text-[9px] text-text-muted">
                        {timeAgo(a.timestamp)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </GlassPanel>
          </div>

          {/* Game History */}
          <GlassPanel glow="none" blur="sm" depth={1} className="p-4">
            <p className="mb-3 text-[9px] font-semibold tracking-[1.5px] text-text-muted">
              GAME HISTORY
            </p>
            {data.gameHistory.length === 0 ? (
              <p className="text-sm text-text-muted">No completed games yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-[9px] font-bold tracking-[1px] text-text-muted">
                      <th className="pb-2 pr-3">MODE</th>
                      <th className="pb-2 pr-3">WPM</th>
                      <th className="pb-2 pr-3">ACC</th>
                      <th className="pb-2 pr-3">COMBO</th>
                      <th className="pb-2 pr-3">XP</th>
                      <th className="pb-2 pr-3">WHEN</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.gameHistory.map((g) => (
                      <tr
                        key={g.id}
                        className="border-t border-white/5 text-text-body transition-colors hover:bg-white/[0.02]"
                      >
                        <td className="py-2 pr-3 font-medium">
                          {g.mode.replace("timed_", "").replace("_", " ").toUpperCase()}
                        </td>
                        <td className="py-2 pr-3 font-bold tabular-nums text-accent-gold">
                          {g.wpm}
                        </td>
                        <td className="py-2 pr-3 tabular-nums">
                          {(g.accuracy * 100).toFixed(0)}%
                        </td>
                        <td className="py-2 pr-3 tabular-nums">{g.max_combo}</td>
                        <td className="py-2 pr-3 tabular-nums text-electric-cyan">
                          +{g.xp_earned}
                        </td>
                        <td className="py-2 text-[9px] text-text-muted">
                          {timeAgo(g.played_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </GlassPanel>

          {/* Additional Stats Row */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <GlassPanel glow="none" blur="sm" depth={1} className="p-4 text-center">
              <p className="text-2xl font-black tabular-nums text-plasma-purple">
                {data.bestTimedWpm}
                <span className="ml-0.5 text-sm font-bold text-text-muted">WPM</span>
              </p>
              <p className="mt-1 text-[9px] font-bold tracking-[1.5px] text-text-muted">
                BEST TIMED
              </p>
            </GlassPanel>

            <GlassPanel glow="none" blur="sm" depth={1} className="p-4 text-center">
              <p className="text-2xl font-black tabular-nums text-text-white">
                {data.totalStars}
                <span className="ml-0.5 text-sm font-bold text-text-muted">★</span>
              </p>
              <p className="mt-1 text-[9px] font-bold tracking-[1.5px] text-text-muted">
                TOTAL STARS
              </p>
            </GlassPanel>

            <GlassPanel glow="none" blur="sm" depth={1} className="p-4 text-center">
              <p className="text-2xl font-black tabular-nums text-accent-gold">
                {data.streak}
                <span className="ml-0.5 text-sm font-bold text-text-muted">🔥</span>
              </p>
              <p className="mt-1 text-[9px] font-bold tracking-[1.5px] text-text-muted">
                DAY STREAK
              </p>
            </GlassPanel>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}
