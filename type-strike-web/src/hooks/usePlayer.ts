"use client";

import { useUser } from "@clerk/nextjs";
import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import type { Player } from "@/lib/types";

interface UsePlayerResult {
  player: Player | null;
  playerId: number | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * usePlayer — links the signed-in Clerk user to a player record in the DB.
 *
 * On mount (or when the Clerk user changes):
 * 1. Reads the Clerk user's email, firstName, lastName
 * 2. Calls POST /api/v1/players/register (get-or-create)
 * 3. Returns the player record with a numeric playerId for API calls
 *
 * The result is cached globally so that subsequent mounts on different
 * pages don't re-fire the API call — they return the cached player immediately.
 */

// Module-level cache: persists across component re-mounts
let cachedPlayer: Player | null = null;
let cachedEmail: string | null = null;
const pendingRegistrations = new Map<string, Promise<Player>>();

export function usePlayer(): UsePlayerResult {
  const { isSignedIn, user, isLoaded } = useUser();
  const [player, setPlayer] = useState<Player | null>(cachedPlayer);
  const [isLoading, setIsLoading] = useState(!cachedPlayer && isLoaded);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const register = useCallback(async () => {
    if (!isLoaded) return;
    if (!isSignedIn || !user) {
      // Clear player state and cache on sign-out
      cachedPlayer = null;
      cachedEmail = null;
      if (mountedRef.current) {
        setPlayer(null);
        setIsLoading(false);
      }
      return;
    }

    const email = user.primaryEmailAddress?.emailAddress;
    if (!email) {
      if (mountedRef.current) {
        setError("No email address found on Clerk user");
        setIsLoading(false);
      }
      return;
    }

    // If we already have a cached player for this email, use it
    if (cachedPlayer && cachedEmail === email) {
      if (mountedRef.current) {
        setPlayer(cachedPlayer);
        setIsLoading(false);
        setError(null);
      }
      return;
    }

    // Deduplicate concurrent registration requests for the same email
    let pending = pendingRegistrations.get(email);
    if (!pending) {
      const displayName = [user.firstName, user.lastName]
        .filter(Boolean)
        .join(" ")
        .trim();

      pending = api.registerPlayer({
        email,
        display_name: displayName || email.split("@")[0],
      }).then(result => {
        cachedEmail = email;
        cachedPlayer = result.player;
        return result.player;
      }).finally(() => {
        pendingRegistrations.delete(email);
      });

      pendingRegistrations.set(email, pending);
    }

    try {
      if (mountedRef.current) setIsLoading(true);
      const p = await pending;
      if (mountedRef.current) {
        setPlayer(p);
        setError(null);
      }
    } catch (err) {
      console.error("Failed to register player:", err);
      if (mountedRef.current) {
        setError("Failed to register player");
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [isSignedIn, user, isLoaded]);

  useEffect(() => {
    register();
  }, [register]);

  return {
    player,
    playerId: player?.id ?? null,
    isLoading,
    error,
  };
}
