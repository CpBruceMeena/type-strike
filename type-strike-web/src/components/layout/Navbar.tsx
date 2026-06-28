"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  IconFlame,
  IconArrowLeft,
  IconCrown,
  IconHash,
} from "@tabler/icons-react";
import { SignInButton, SignUpButton, UserButton, useUser } from "@clerk/nextjs";
import { usePlayer } from "@/hooks/usePlayer";
import { useProgression } from "@/hooks/useProgression";
import { api } from "@/lib/api";

// Pages that should NOT show the back-to-home button
const HOME_PAGES = new Set(["/app/home", "/", "/splash"]);

// Module-level cache for leaderboard rank (avoids re-fetch across layout re-mounts)
let cachedRank: number | null = null;
let cachedRankPlayerId: number | null = null;

// ── Component ───────────────────────────────────────────

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isSignedIn, user } = useUser();
  const { player, playerId } = usePlayer();
  const { progression } = useProgression(playerId);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [playerRank, setPlayerRank] = useState<number | null>(
    playerId === cachedRankPlayerId ? cachedRank : null
  );
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // Fetch numeric leaderboard rank
  const fetchRank = useCallback(async () => {
    if (!playerId) return;

    if (cachedRankPlayerId === playerId && cachedRank != null) {
      if (mountedRef.current) setPlayerRank(cachedRank);
      return;
    }

    try {
      const resp = await api.getPlayerRank(playerId);
      const rank = resp?.entry?.rank;
      if (rank != null && mountedRef.current) {
        cachedRank = rank;
        cachedRankPlayerId = playerId;
        setPlayerRank(rank);
      }
    } catch {
      // Non-critical
    }
  }, [playerId]);

  useEffect(() => {
    fetchRank();
  }, [fetchRank]);

  const isHomePage = HOME_PAGES.has(pathname);
  const currentTier = progression?.current_tier;
  const rankName = currentTier?.display_name ?? "RECRUIT";

  return (
    <>
      <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-neutral-800/60 bg-neutral-950/80 px-4 backdrop-blur-xl md:px-6">
        {/* ── Left: Logo + Back Button ────────────────── */}
        <div className="flex items-center gap-3 min-w-0">
          {!isHomePage && (
            <button
              onClick={() => router.push("/app/home")}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-neutral-800/60 text-neutral-400 transition-all hover:border-neutral-700/60 hover:text-neutral-200 active:scale-95"
              aria-label="Back to Home"
            >
              <IconArrowLeft size={18} />
            </button>
          )}

          <Link href="/app/home" className="flex items-center gap-2 shrink-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-gradient-to-br from-orange-500 to-red-600 shadow-[0_0_16px_rgba(249,115,22,0.2)]">
              <IconFlame size={16} className="text-neutral-950" />
            </div>
            <span className="hidden sm:inline text-sm font-extrabold tracking-[3px] text-neutral-100">
              TYPE<span className="text-orange-500">STRIKE</span>
            </span>
          </Link>
        </div>

        {/* ── Right: Profile / Rank / Sign In ─────────── */}
        <div className="flex items-center gap-2">
          {/* Rank badge (desktop) */}
          {player && (
            <div className="hidden md:flex items-center gap-1.5 rounded-xl border border-neutral-800/60 bg-neutral-900/40 px-2.5 py-1.5">
              <IconCrown size={14} className="text-orange-400" />
              <span className="text-[11px] font-bold text-orange-400">{rankName}</span>
              {playerRank != null && (
                <>
                  <span className="text-[11px] text-neutral-600">·</span>
                  <IconHash size={12} className="text-orange-400/70" />
                  <span className="text-[11px] font-bold text-orange-400">{playerRank}</span>
                </>
              )}
              <span className="text-[11px] text-neutral-500">· Lv{player.level}</span>
            </div>
          )}

          {/* Streak badge */}
          {player && (player.streak_count ?? 0) > 0 && (
            <div className="hidden sm:flex items-center gap-1 rounded-xl border border-orange-500/20 bg-orange-500/10 px-2 py-1.5">
              <IconFlame size={14} className="text-orange-400" />
              <span className="text-[11px] font-bold text-orange-400">{player.streak_count}</span>
            </div>
          )}

          {/* Profile / Auth */}
          {isSignedIn ? (
            <div className="flex items-center">
              <UserButton />
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-1.5">
              <SignInButton mode="modal">
                <button className="rounded-xl border border-neutral-800/60 px-3 py-1.5 text-[10px] font-bold tracking-[2px] text-neutral-300 transition-all hover:border-neutral-700/60 hover:text-neutral-100 active:scale-95">
                  SIGN IN
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="rounded-xl bg-gradient-to-r from-orange-500 to-red-600 px-3 py-1.5 text-[10px] font-bold tracking-[2px] text-neutral-950 shadow-[0_0_16px_rgba(249,115,22,0.15)] transition-all hover:brightness-110 active:scale-95">
                  SIGN UP
                </button>
              </SignUpButton>
            </div>
          )}

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex md:hidden h-9 w-9 items-center justify-center rounded-xl border border-neutral-800/60 text-neutral-400 hover:text-neutral-200 transition-all active:scale-95"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {mobileMenuOpen ? (
                <>
                  <path d="M4 4L14 14M14 4L4 14" />
                </>
              ) : (
                <>
                  <path d="M2 4H16M2 9H16M2 14H16" />
                </>
              )}
            </svg>
          </button>
        </div>
      </header>

      {/* ── Mobile Menu ─────────────────────────────────── */}
      {mobileMenuOpen && (
        <div className="fixed inset-x-0 top-14 z-40 border-b border-neutral-800/60 bg-neutral-950/95 backdrop-blur-xl md:hidden">
          <div className="flex flex-col px-4 pb-4 pt-3">
            {/* Mobile rank section */}
            {player && (
              <div className="flex items-center gap-2 px-3 py-3 mb-2 rounded-xl border border-neutral-800/40 bg-neutral-900/40">
                <IconCrown size={16} className="text-orange-400 shrink-0" />
                <span className="text-[13px] font-bold text-orange-400">{rankName}</span>
                {playerRank != null && (
                  <>
                    <span className="text-neutral-600">·</span>
                    <span className="text-[13px] font-bold text-orange-400">#{playerRank}</span>
                  </>
                )}
                <span className="text-neutral-600">·</span>
                <span className="text-[12px] text-neutral-400">Lv{player.level}</span>
                {player.streak_count > 0 && (
                  <>
                    <span className="text-neutral-700">·</span>
                    <IconFlame size={14} className="text-orange-400" />
                    <span className="text-[12px] font-bold text-orange-400">{player.streak_count}</span>
                  </>
                )}
              </div>
            )}

            {/* Mobile auth */}
            <div>
              {isSignedIn ? (
                <div className="flex items-center gap-3 px-3 py-2">
                  <UserButton />
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-bold text-neutral-200 truncate">
                      {user?.firstName || user?.username || "Player"}
                    </div>
                    <div className="text-[11px] text-neutral-500 truncate">
                      {user?.primaryEmailAddress?.emailAddress}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-2 px-3 pb-2">
                  <SignInButton mode="modal">
                    <button className="w-full rounded-xl border border-neutral-800/60 px-3 py-2.5 text-[11px] font-bold tracking-[2px] text-neutral-300 transition-all hover:border-neutral-700/60 active:scale-95">
                      SIGN IN
                    </button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <button className="w-full rounded-xl bg-gradient-to-r from-orange-500 to-red-600 px-3 py-2.5 text-[11px] font-bold tracking-[2px] text-neutral-950 shadow-[0_0_16px_rgba(249,115,22,0.15)] transition-all hover:brightness-110 active:scale-95">
                      SIGN UP
                    </button>
                  </SignUpButton>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
