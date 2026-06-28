"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import StreakPanel from "@/components/game/StreakPanel";
import SpotlightCard from "@/components/react-bits/SpotlightCard";
import { usePlayer } from "@/hooks/usePlayer";
import { api } from "@/lib/api";
import type { StreakInfoResponse, DailyChallengesResponse } from "@/lib/types";

// ── Loading Skeleton ───────────────────────────────────

function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-neutral-800/40 ${className}`} />;
}

// ── Page ────────────────────────────────────────────────

export default function DailyChallengesPage() {
  const router = useRouter();
  const { player, playerId } = usePlayer();
  const [streakInfo, setStreakInfo] = useState<StreakInfoResponse | null>(null);
  const [dailyChallenges, setDailyChallenges] = useState<DailyChallengesResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // ── Calendar Stream: fetch streak info + daily challenges ──
  const fetchStream = useCallback(async () => {
    if (!playerId) return;
    setLoading(true);
    try {
      const [streak, challenges] = await Promise.all([
        api.getStreakInfo(playerId),
        api.getDailyChallenges(playerId),
      ]);
      setStreakInfo(streak);
      setDailyChallenges(challenges);
    } catch {
      // Non-critical — UI renders with fallback data
    } finally {
      setLoading(false);
    }
  }, [playerId]);

  // Auto-refresh on mount + poll every 60s for fresh data
  useEffect(() => {
    fetchStream();
    const interval = setInterval(fetchStream, 60_000);
    return () => clearInterval(interval);
  }, [fetchStream]);

  const streakCount = streakInfo?.streak_count ?? player?.streak_count ?? 0;
  const challengeList = dailyChallenges?.challenges ?? [];

  return (
    <div className="flex flex-1 flex-col">

      <div className="flex-1 px-4 py-6 md:px-6 md:py-8">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 lg:flex-row lg:items-stretch">

          {/* ── Left Column: Streak Panel ────────────── */}
          <div className="w-full lg:w-[420px] shrink-0 flex">
            {loading && !streakInfo ? (
              <SkeletonBlock className="h-[500px] w-full" />
            ) : (
              <StreakPanel
                streakCount={streakCount}
                streakInfo={streakInfo}
                hideFooterLink
              />
            )}
          </div>

          {/* ── Right Column: Challenge Cards ─────────── */}
          <div className="flex flex-1 flex-col gap-4 min-h-0">
            {/* Section header */}
            <div className="flex items-center justify-between">
              <h2 className="m-0 flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[3px] text-neutral-300">
                <span className="inline-block h-2 w-2 rounded-full bg-orange-500" />
                Today&apos;s Challenges
              </h2>
              {!loading && (
                <span className="text-[10px] text-neutral-500">
                  {streakCount} day streak · {challengeList.length} active
                </span>
              )}
            </div>

            {loading && challengeList.length === 0 ? (
              <div className="flex flex-col gap-4">
                {[1, 2, 3].map((i) => (
                  <SkeletonBlock key={i} className="h-28 w-full" />
                ))}
              </div>
            ) : challengeList.length === 0 ? (
              <SpotlightCard
                spotlightColor="rgba(249, 115, 22, 0.08)"
                className="flex flex-col items-center justify-center gap-3 rounded-[22px] border border-neutral-800/60 bg-neutral-900/30 p-8 text-center min-h-[300px]"
              >
                <span className="text-2xl">🎯</span>
                <p className="text-sm font-bold text-neutral-100">No challenges today</p>
                <p className="text-xs text-neutral-500">Check back tomorrow for new drills.</p>
              </SpotlightCard>
            ) : (
              <div className="flex flex-col gap-4">
                {challengeList.slice(0, 3).map((ch) => (
                  <button
                    key={ch.id}
                    onClick={() => router.push(`/play/level?id=${ch.level_id}`)}
                    className="flex flex-col gap-3 rounded-[22px] border border-neutral-800/60 bg-neutral-900/30 p-5 text-left transition-all hover:border-orange-500/20 hover:bg-neutral-900/40 active:scale-[0.98]"
                    style={{
                      backdropFilter: "blur(12px)",
                    }}
                  >
                    {/* Header row: icon + name + status */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-neutral-800/60 bg-neutral-950/40">
                          <span className="text-lg">{ch.icon || "🎯"}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-bold text-neutral-100">
                            {ch.challenge_name}
                          </p>
                          <p className="mt-0.5 text-[10px] text-neutral-500">
                            Target: {ch.target_wpm} WPM / {(ch.target_accuracy * 100).toFixed(0)}%
                          </p>
                        </div>
                      </div>

                      {/* Status badge */}
                      <span
                        className={`shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                          ch.completed
                            ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                            : "border-orange-500/20 bg-orange-500/10 text-orange-400"
                        }`}
                      >
                        {ch.completed ? "Done" : "Active"}
                      </span>
                    </div>

                    {/* Stats row */}
                    <div className="flex items-center justify-between border-t border-neutral-800/40 pt-3">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-400">
                        <span>+{ch.reward_xp} XP</span>
                        {ch.reward_stars > 0 && <span>· +{ch.reward_stars} ★</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        {ch.current_best_wpm > 0 ? (
                          <span className="text-[10px] text-neutral-500">
                            Best: <strong className="text-neutral-300">{ch.current_best_wpm} WPM</strong>
                          </span>
                        ) : (
                          <span className="text-[10px] text-neutral-500">Not attempted</span>
                        )}
                        <span className="text-[10px] font-bold text-orange-400 hover:text-orange-300 transition-colors">
                          Play →
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

          </div>

        </div>
      </div>
    </div>
  );
}
