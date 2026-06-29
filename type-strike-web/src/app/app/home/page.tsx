"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { usePlayer } from "@/hooks/usePlayer";
import { usePlayerStats } from "@/hooks/usePlayerStats";
import { useProgression } from "@/hooks/useProgression";
import { api } from "@/lib/api";
import type { LeaderboardEntry } from "@/lib/types";
import GridBackground from "@/components/home/GridBackground";
import EmberParticles from "@/components/home/EmberParticles";
import HeroSection from "@/components/home/HeroSection";
import ModeGrid from "@/components/home/ModeGrid";
import DailyBanner from "@/components/home/DailyBanner";
import ArsenalGrid from "@/components/home/ArsenalGrid";
import StreakWidget from "@/components/home/StreakWidget";
import LeaderboardPreview from "@/components/home/LeaderboardPreview";
import HomeFooter from "@/components/home/HomeFooter";
import ToastProvider, { showToast } from "@/components/home/ToastNotification";

// Module-level cache for leaderboard rank
let cachedRank: number | null = null;
let cachedRankPlayerId: number | null = null;

export default function HomePage() {
  const router = useRouter();
  const { user } = useUser();
  const { player, playerId, isLoading: playerLoading } = usePlayer();
  const { stats, isLoading: statsLoading } = usePlayerStats(playerId);
  const { progression } = useProgression(playerId);
  const [playerRank, setPlayerRank] = useState<number | null>(
    playerId === cachedRankPlayerId ? cachedRank : null
  );
  const [achievementCount, setAchievementCount] = useState<{ unlocked: number; total: number } | undefined>(undefined);
  const [leaderboardTop, setLeaderboardTop] = useState<LeaderboardEntry[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);

  const displayName = player?.display_name || player?.player_tag || "Player";
  const level = player?.level ?? 1;
  const currentTier = progression?.current_tier;
  const rankName = currentTier?.display_name ?? "RECRUIT";
  const streakCount = player?.streak_count ?? 0;

  const bestWpmOverall = Math.max(
    stats.best_wpm_by_mode.level,
    stats.best_wpm_by_mode.timed_1min,
    stats.best_wpm_by_mode.timed_3min,
    stats.best_wpm_by_mode.timed_5min,
    stats.best_wpm_by_mode.contest,
  );
  const totalXp = stats.total_xp;
  const avgAccuracy = stats.average_accuracy;

  // Fetch leaderboard rank
  const fetchRank = useCallback(async () => {
    if (!playerId) return;
    if (cachedRankPlayerId === playerId && cachedRank != null) {
      setPlayerRank(cachedRank);
      return;
    }
    try {
      const resp = await api.getPlayerRank(playerId);
      const rank = resp?.entry?.rank;
      if (rank != null) {
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

  // Fetch achievement count
  useEffect(() => {
    if (!playerId) return;
    api.getAchievementUnlockCount(playerId).then((resp) => {
      setAchievementCount({ unlocked: resp.unlocked_count, total: resp.total_count });
    }).catch(() => {});
  }, [playerId]);

  // Fetch top 5 leaderboard
  useEffect(() => {
    if (!playerId) return;
    setLeaderboardLoading(true);
    api.getLeaderboardTop(5).then((resp) => {
      setLeaderboardTop(resp.entries ?? []);
    }).catch(() => {}).finally(() => {
      setLeaderboardLoading(false);
    });
  }, [playerId]);

  const handleClaim = useCallback(async () => {
    if (!playerId) {
      showToast("Sign in to claim rewards!");
      return;
    }
    try {
      const result = await api.claimDailyReward(playerId);
      if (result.claimed) {
        showToast(`🔥 +${result.reward_value} XP claimed! Streak extended.`);
      } else {
        showToast("Already claimed today. Come back tomorrow!");
      }
    } catch {
      showToast("Failed to claim reward. Try again.");
    }
  }, [playerId]);

  // Keyboard shortcut: Enter → Strike mode
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        router.push("/app/map");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [router]);

  return (
    <ToastProvider>
      {/* Background effects */}
      <GridBackground />
      <EmberParticles />

      {/* Body background gradient */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          pointerEvents: "none",
          background: [
            "radial-gradient(ellipse at 20% 0%, rgba(255,107,26,0.18), transparent 50%)",
            "radial-gradient(ellipse at 80% 20%, rgba(157,77,255,0.12), transparent 50%)",
            "radial-gradient(ellipse at 50% 100%, rgba(255,61,154,0.1), transparent 60%)",
          ].join(", "),
        }}
        aria-hidden="true"
      />

      {/* Main content */}
      <div style={{ position: "relative", zIndex: 1 }}>
        <HeroSection
          displayName={displayName}
          rankName={rankName}
          level={level}
          bestWpm={bestWpmOverall}
          totalXp={totalXp}
          playerRank={playerRank}
          avgAccuracy={avgAccuracy}
          streakCount={streakCount}
        />

        <ModeGrid />

        <section
          className="section-with-daily"
          style={{
            position: "relative",
            zIndex: 1,
            maxWidth: 1400,
            margin: "0 auto",
            padding: "0 32px",
          }}
        >
          <DailyBanner />
        </section>

        <ArsenalGrid
          playerRank={playerRank}
          achievementCount={achievementCount}
          rankName={rankName}
          bestWpm={bestWpmOverall}
        />

        <StreakWidget
          streakCount={streakCount}
          onClaim={handleClaim}
        />

        <LeaderboardPreview 
          entries={leaderboardTop} 
          loading={leaderboardLoading}
          currentUserImageUrl={user?.imageUrl}
          currentPlayerId={playerId}
        />

        <HomeFooter />
      </div>

      <style>{`
        @media (max-width: 520px) {
          .section-with-daily { padding: 0 18px !important; }
        }
      `}</style>
    </ToastProvider>
  );
}
