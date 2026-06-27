"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import type {
  AllAchievementsResponse,
  AchievementUnlockEvent,
  PlayerAchievement,
} from "@/lib/types";

interface UseAchievementsReturn {
  achievements: PlayerAchievement[];
  unlockedCount: number;
  totalCount: number;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  checkForNewUnlocks: (params: {
    wpm?: number;
    accuracy?: number;
    max_combo?: number;
    levels_cleared?: number;
    streak_count?: number;
    contest_rank?: number;
  }) => Promise<AchievementUnlockEvent[]>;
}

export function useAchievements(playerId: number | null): UseAchievementsReturn {
  const [data, setData] = useState<AllAchievementsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!playerId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await api.getAchievements(playerId);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch achievements");
    } finally {
      setLoading(false);
    }
  }, [playerId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const checkForNewUnlocks = useCallback(
    async (params: {
      wpm?: number;
      accuracy?: number;
      max_combo?: number;
      levels_cleared?: number;
      streak_count?: number;
      contest_rank?: number;
    }): Promise<AchievementUnlockEvent[]> => {
      if (!playerId) return [];
      try {
        const result = await api.checkAchievements(playerId, params);
        // Refresh achievements list after checking
        if (result.new_unlocks.length > 0) {
          await refresh();
        }
        return result.new_unlocks;
      } catch {
        return [];
      }
    },
    [playerId, refresh]
  );

  return {
    achievements: data?.achievements ?? [],
    unlockedCount: data?.unlocked_count ?? 0,
    totalCount: data?.total_count ?? 0,
    loading,
    error,
    refresh,
    checkForNewUnlocks,
  };
}
