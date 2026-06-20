"use client";

import TopBar from "@/components/layout/TopBar";
import Card from "@/components/ui/Card";

export default function DailyChallengesPage() {
  const challenges = [
    { name: "Morning Blaze", target: "35 WPM / 85%", reward: "50 XP", icon: "🌅" },
    { name: "Midday Inferno", target: "50 WPM / 90%", reward: "100 XP", icon: "☀️" },
    { name: "Night Fury", target: "65 WPM / 93%", reward: "150 XP", icon: "🌙" },
  ];

  return (
    <div className="flex flex-1 flex-col">
      <TopBar showBack title="DAILY" />

      <div className="flex-1 px-4 py-4 md:px-6 md:py-6">
        <div className="mx-auto w-full max-w-2xl space-y-4">
          {/* Streak Badge */}
          <Card className="flex items-center gap-3 bg-accent-gold/5 p-4">
            <span className="text-xl">🔥</span>
            <div>
              <p className="text-xs font-bold tracking-[1px] text-text-white">STREAK</p>
              <p className="text-[11px] text-text-muted">0 days — 1.0x multiplier</p>
            </div>
          </Card>

          {/* Challenge Cards */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {challenges.map((c, i) => (
              <Card key={i} hoverable className="flex flex-col gap-3 p-4">
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
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
