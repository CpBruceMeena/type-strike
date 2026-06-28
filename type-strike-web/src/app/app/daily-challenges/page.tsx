"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import TopBar from "@/components/layout/TopBar";
import Card from "@/components/ui/Card";
import StreakModal from "@/components/game/StreakModal";
import { usePlayer } from "@/hooks/usePlayer";
import { api } from "@/lib/api";
import type { StreakInfoResponse } from "@/lib/types";

export default function DailyChallengesPage() {
  const router = useRouter();
  const { playerId } = usePlayer();
  const [streakInfo, setStreakInfo] = useState<StreakInfoResponse | null>(null);
  const [streakModalOpen, setStreakModalOpen] = useState(false);

  const fetchStreak = useCallback(async () => {
    if (!playerId) return;
    try {
      const info = await api.getStreakInfo(playerId);
      setStreakInfo(info);
    } catch {
      // Silently fail — streak info is non-critical
    }
  }, [playerId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchStreak();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchStreak]);

  const challenges = [
    { name: "Morning Blaze", target: "35 WPM / 85%", reward: "50 XP", icon: "🌅", href: "/play/1min" },
    { name: "Midday Inferno", target: "50 WPM / 90%", reward: "100 XP", icon: "☀️", href: "/play/3min" },
    { name: "Night Fury", target: "65 WPM / 93%", reward: "150 XP", icon: "🌙", href: "/play/5min" },
  ];

  return (
    <div className="flex flex-1 flex-col">
      <TopBar showBack title="DAILY" />

      <div className="flex-1 px-4 py-4 md:px-6 md:py-6">
        <div className="mx-auto w-full max-w-2xl space-y-4">
          {/* Streak Badge — clickable to open StreakModal */}
          <button
            onClick={() => setStreakModalOpen(true)}
            className="w-full text-left"
          >
            <Card className="flex items-center gap-3 bg-accent-gold/5 p-4 transition-all hover:bg-accent-gold/10">
              <span className="text-xl">🔥</span>
              <div className="flex-1">
                <p className="text-xs font-bold tracking-[1px] text-text-white">
                  {streakInfo ? `${streakInfo.streak_count} DAY STREAK` : "STREAK REWARDS"}
                </p>
                <p className="text-[10px] text-text-muted">
                  {streakInfo
                    ? `${streakInfo.total_days_claimed} days claimed • ❄️ ${streakInfo.streak_freezes} freezes`
                    : "Tap to view your streak rewards"}
                </p>
              </div>
              {streakInfo?.today_available && (
                <span className="rounded-full bg-accent-primary px-2 py-0.5 text-[9px] font-bold tracking-[1px] text-white">
                  CLAIM
                </span>
              )}
              <span className="text-lg text-text-muted">→</span>
            </Card>
          </button>

          {/* Challenge Cards */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {challenges.map((c, i) => (
              <button
                key={i}
                onClick={() => router.push(c.href)}
                className="text-left"
              >
                <Card hoverable className="flex flex-col gap-3 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-bg-surface-dark">
                      <span className="text-lg">{c.icon}</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-text-white">{c.name}</p>
                      <p className="text-[10px] text-text-muted">Target: {c.target}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between border-t border-border/50 pt-2">
                    <span className="text-xs font-bold text-accent-gold">{c.reward}</span>
                    <span className="text-[10px] text-text-muted">0 WPM</span>
                  </div>
                </Card>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Streak Modal */}
      <StreakModal
        playerId={playerId}
        open={streakModalOpen}
        onClose={() => {
          setStreakModalOpen(false);
          fetchStreak();
        }}
      />
    </div>
  );
}
