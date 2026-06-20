"use client";

import TopBar from "@/components/layout/TopBar";
import Card from "@/components/ui/Card";

export default function StatsPage() {
  const stats = [
    { label: "GAMES", value: "0", accent: "#FF5020" },
    { label: "BEST WPM", value: "—", accent: "#FFCC00" },
    { label: "ACCURACY", value: "—%", accent: "#CC44FF" },
    { label: "XP", value: "0", accent: "#FF6600" },
  ];

  return (
    <div className="flex flex-1 flex-col">
      <TopBar showBack title="STATS" />

      <div className="flex-1 px-4 py-3">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-2">
          {stats.map((stat) => (
            <Card key={stat.label} className="text-center">
              <p className="text-lg font-black text-text-white">{stat.value}</p>
              <p
                className="mt-0.5 text-[8px] font-bold tracking-[1.5px]"
                style={{ color: stat.accent }}
              >
                {stat.label}
              </p>
            </Card>
          ))}
        </div>

        {/* Level Progress */}
        <Card className="mt-3">
          <p className="text-[9px] font-semibold tracking-[1.5px] text-text-muted">LEVEL PROGRESS</p>
          <p className="mt-2 text-sm font-bold text-text-white">0 / 100</p>
        </Card>

        {/* Activity */}
        <Card className="mt-3">
          <p className="text-[9px] font-semibold tracking-[1.5px] text-text-muted">RECENT ACTIVITY</p>
          <p className="mt-2 text-[11px] text-text-muted">No activity yet. Start typing!</p>
        </Card>
      </div>
    </div>
  );
}
