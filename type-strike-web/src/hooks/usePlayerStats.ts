"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";

// ── Resilient stats shape ──────────────────────────────
// We define a local interface so that any response shape is
// mapped gracefully — even if the backend returns snake_case
// vs. camelCase, missing fields, or null values.

export interface SafePlayerStats {
  total_games: number;
  total_levels_cleared: number;
  best_wpm_by_mode: {
    level: number;
    timed_1min: number;
    timed_3min: number;
    timed_5min: number;
    contest: number;
  };
  average_accuracy: number;
  total_xp: number;
  recent_activity: Array<{
    id: number;
    player_id: number;
    type: string;
    timestamp: string;
    metadata?: Record<string, unknown>;
  }>;
  daily_stats_30_days: Array<{
    date: string;
    games: number;
    best_wpm: number;
  }>;
}

/** Safely coerce an unknown value into the SafePlayerStats shape. */
function sanitizeStats(raw: unknown): SafePlayerStats {
  if (!raw || typeof raw !== "object") return getDefaultStats();

  const d = raw as Record<string, unknown>;

  const safeNum = (v: unknown, fallback = 0): number => {
    if (typeof v === "number" && Number.isFinite(v)) return v;
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  };

  const safeObj = <T>(v: unknown, fallback: T): T =>
    v && typeof v === "object" ? (v as T) : fallback;

  const safeArr = <T>(v: unknown, fallback: T[]): T[] =>
    Array.isArray(v) ? v : fallback;

  const bpmRaw = d.best_wpm_by_mode;
  const bpmDefault = { level: 0, timed_1min: 0, timed_3min: 0, timed_5min: 0, contest: 0 };
  const bpm = bpmRaw && typeof bpmRaw === "object"
    ? { ...bpmDefault, ...(bpmRaw as Record<string, unknown>) }
    : bpmDefault;

  return {
    total_games: safeNum(d.total_games, 0),
    total_levels_cleared: safeNum(d.total_levels_cleared, 0),
    best_wpm_by_mode: {
      level: safeNum(bpm.level, 0),
      timed_1min: safeNum(bpm.timed_1min, 0),
      timed_3min: safeNum(bpm.timed_3min, 0),
      timed_5min: safeNum(bpm.timed_5min, 0),
      contest: safeNum(bpm.contest, 0),
    },
    average_accuracy: safeNum(d.average_accuracy, 0),
    total_xp: safeNum(d.total_xp, 0),
    recent_activity: safeArr(d.recent_activity, []),
    daily_stats_30_days: safeArr(d.daily_stats_30_days, []),
  };
}

function getDefaultStats(): SafePlayerStats {
  return {
    total_games: 0,
    total_levels_cleared: 0,
    best_wpm_by_mode: { level: 0, timed_1min: 0, timed_3min: 0, timed_5min: 0, contest: 0 },
    average_accuracy: 0,
    total_xp: 0,
    recent_activity: [],
    daily_stats_30_days: [],
  };
}

// ── Hook result ─────────────────────────────────────────

interface UsePlayerStatsResult {
  stats: SafePlayerStats;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

// Module-level cache
let cachedStats: SafePlayerStats | null = null;
let cachedPlayerId: number | null = null;
const pendingFetches = new Map<number, Promise<SafePlayerStats>>();

export function usePlayerStats(playerId: number | null): UsePlayerStatsResult {
  const [stats, setStats] = useState<SafePlayerStats>(
    playerId === cachedPlayerId && cachedStats ? cachedStats : getDefaultStats()
  );
  const [isLoading, setIsLoading] = useState(!cachedStats && !!playerId);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const fetchStats = useCallback(async () => {
    if (!playerId) return;

    if (cachedStats && cachedPlayerId === playerId) {
      if (mountedRef.current) {
        setStats(cachedStats);
        setIsLoading(false);
        setError(null);
      }
      return;
    }

    let pending = pendingFetches.get(playerId);
    if (!pending) {
      pending = api.getExtendedStats(playerId)
        .then((raw) => {
          const sanitized = sanitizeStats(raw);
          cachedPlayerId = playerId;
          cachedStats = sanitized;
          return sanitized;
        })
        .finally(() => {
          pendingFetches.delete(playerId);
        });
      pendingFetches.set(playerId, pending);
    }

    try {
      if (mountedRef.current) setIsLoading(true);
      const result = await pending;
      if (mountedRef.current) {
        setStats(result);
        setError(null);
      }
    } catch (err) {
      console.error("Failed to fetch player stats:", err);
      if (mountedRef.current) {
        // On error: keep default stats (all zeros) so the UI never shows NaN/undefined
        setStats(getDefaultStats());
        setError("Stats unavailable — play a game to see your numbers");
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [playerId]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const refresh = useCallback(async () => {
    cachedStats = null;
    cachedPlayerId = null;
    await fetchStats();
  }, [fetchStats]);

  return { stats, isLoading, error, refresh };
}
