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

      <div className="flex-1 px-4 py-4 md:px-6 md:py-6">
        <div className="mx-auto w-full max-w-3xl space-y-4">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {stats.map((stat) => (
              <Card key={stat.label} className="text-center p-4">
                <p className="text-2xl font-black text-text-white md:text-3xl">{stat.value}</p>
                <p
                  className="mt-1 text-[9px] font-bold tracking-[1.5px]"
                  style={{ color: stat.accent }}
                >
                  {stat.label}
                </p>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Level Progress */}
            <Card className="p-4">
              <p className="text-[9px] font-semibold tracking-[1.5px] text-text-muted">LEVEL PROGRESS</p>
              <p className="mt-2 text-lg font-bold text-text-white md:text-xl">0 / 100</p>
            </Card>

            {/* Activity */}
            <Card className="p-4">
              <p className="text-[9px] font-semibold tracking-[1.5px] text-text-muted">RECENT ACTIVITY</p>
              <p className="mt-2 text-sm text-text-muted">No activity yet. Start typing!</p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
