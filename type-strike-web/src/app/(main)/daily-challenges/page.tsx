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

      <div className="flex-1 space-y-2 px-4 py-3">
        {/* Streak Badge */}
        <Card className="flex items-center gap-2 bg-accent-gold/5">
          <span className="text-lg">🔥</span>
          <div>
            <p className="text-[10px] font-bold tracking-[1px] text-text-white">STREAK</p>
            <p className="text-[9px] text-text-muted">0 days — 1.0x multiplier</p>
          </div>
        </Card>

        {/* Challenge Cards */}
        {challenges.map((c, i) => (
          <Card key={i} hoverable className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-bg-surface-dark">
              <span className="text-base">{c.icon}</span>
            </div>
            <div className="flex-1">
              <p className="text-[11px] font-bold text-text-white">{c.name}</p>
              <p className="text-[9px] text-text-muted">Target: {c.target}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-accent-gold">{c.reward}</p>
              <p className="text-[8px] text-text-muted">0 WPM</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
