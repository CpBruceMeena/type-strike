"use client";

import { useRouter } from "next/navigation";
import TopBar from "@/components/layout/TopBar";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

export default function HomePage() {
  const router = useRouter();

  const modes = [
    { key: "levels", label: "LEVELS", desc: "100 levels of fire", icon: "🗺️", href: "/map", accent: "#FF5020" },
    { key: "contest", label: "CONTEST", desc: "Daily competition", icon: "🏆", href: "/play/contest", accent: "#FFCC00" },
    { key: "1min", label: "1 MIN", desc: "1-minute sprint", icon: "⏱️", href: "/play/1min", accent: "#FF6600" },
    { key: "3min", label: "3 MIN", desc: "3-minute endurance", icon: "⏳", href: "/play/3min", accent: "#CC44FF" },
    { key: "5min", label: "5 MIN", desc: "5-minute marathon", icon: "🔥", href: "/play/5min", accent: "#FF00AA" },
  ];

  return (
    <div className="flex flex-1 flex-col">
      <TopBar streakCount={0} />

      <div className="flex flex-1 flex-col items-center justify-center px-4 md:px-8">
        {/* Player Crest */}
        <div className="mb-6 text-center md:mb-8">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-accent-primary to-accent-primary-dark shadow-lg shadow-accent-primary/30 md:h-24 md:w-24">
            <span className="text-3xl font-black text-text-white md:text-4xl">1</span>
          </div>
          <p className="mt-2 text-xs font-bold tracking-[4px] text-text-body md:text-sm">RECRUIT</p>
        </div>

        {/* Hero Button */}
        <Button
          variant="primary"
          size="xl"
          className="mb-8 w-full max-w-sm"
          onClick={() => router.push("/map")}
        >
          <span className="flex items-center gap-3">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L15 9L22 9.97L17 14.53L18 22L12 18.27L6 22L7 14.53L2 9.97L9 9L12 2Z" fill="currentColor" opacity="0.9"/>
            </svg>
            <span className="text-base font-black tracking-[6px]">STRIKE</span>
          </span>
        </Button>

        {/* Mode Cards - responsive grid */}
        <div className="grid w-full max-w-2xl grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
          {modes.map((mode) => (
            <Card
              key={mode.key}
              hoverable
              onClick={() => router.push(mode.href)}
              className="text-center"
            >
              <span className="text-xl md:text-2xl">{mode.icon}</span>
              <p className="mt-1 text-xs font-bold tracking-[1.5px]" style={{ color: mode.accent }}>
                {mode.label}
              </p>
              <p className="text-[10px] text-text-muted">{mode.desc}</p>
            </Card>
          ))}
        </div>

        {/* Daily Badge */}
        <Card
          hoverable
          onClick={() => router.push("/daily-challenges")}
          className="mt-6 w-full max-w-sm"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-accent-gold/15">
              <span className="text-sm">🎯</span>
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold tracking-[1px] text-text-white">DAILY CHALLENGES</p>
            </div>
            <span className="text-lg font-bold text-text-disabled">→</span>
          </div>
        </Card>
      </div>
    </div>
  );
}
