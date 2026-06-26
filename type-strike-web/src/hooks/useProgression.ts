"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import type { ProgressionResponse, TierUpgradeResponse } from "@/lib/types";

interface UseProgressionResult {
  progression: ProgressionResponse | null;
  isLoading: boolean;
  error: string | null;
  checkUpgrade: () => Promise<TierUpgradeResponse | null>;
  refresh: () => Promise<void>;
}

// Module-level cache: persists across component re-mounts
let cachedProgression: ProgressionResponse | null = null;
let cachedPlayerId: number | null = null;
const pendingFetches = new Map<number, Promise<ProgressionResponse>>();

export function useProgression(playerId: number | null): UseProgressionResult {
  const [progression, setProgression] = useState<ProgressionResponse | null>(
    playerId === cachedPlayerId ? cachedProgression : null
  );
  const [isLoading, setIsLoading] = useState(!cachedProgression && !!playerId);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const fetchProgression = useCallback(async () => {
    if (!playerId) return;

    // If we already have cached progression for this player, use it
    if (cachedProgression && cachedPlayerId === playerId) {
      if (mountedRef.current) {
        setProgression(cachedProgression);
        setIsLoading(false);
        setError(null);
      }
      return;
    }

    // Deduplicate concurrent fetches for the same player
    let pending = pendingFetches.get(playerId);
    if (!pending) {
      pending = api.getProgression(playerId)
        .then(result => {
          cachedPlayerId = playerId;
          cachedProgression = result;
          return result;
        })
        .finally(() => {
          pendingFetches.delete(playerId);
        });
      pendingFetches.set(playerId, pending);
    }

    try {
      if (mountedRef.current) setIsLoading(true);
      const p = await pending;
      if (mountedRef.current) {
        setProgression(p);
        setError(null);
      }
    } catch (err) {
      console.error("Failed to fetch progression:", err);
      if (mountedRef.current) {
        setError("Failed to load progression data");
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [playerId]);

  useEffect(() => {
    fetchProgression();
  }, [fetchProgression]);

  const checkUpgrade = useCallback(async () => {
    if (!playerId) return null;
    try {
      const result = await api.checkTierUpgrade(playerId);
      if (result.upgraded) {
        // Refresh progression data after upgrade
        cachedProgression = null;
        await fetchProgression();
      }
      return result;
    } catch (err) {
      console.error("Failed to check tier upgrade:", err);
      return null;
    }
  }, [playerId, fetchProgression]);

  const refresh = useCallback(async () => {
    cachedProgression = null;
    cachedPlayerId = null;
    await fetchProgression();
  }, [fetchProgression]);

  return { progression, isLoading, error, checkUpgrade, refresh };
}
