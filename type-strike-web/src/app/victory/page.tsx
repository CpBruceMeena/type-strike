"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import ParticleField from "@/components/effects/ParticleField";
import Button from "@/components/ui/Button";
import GlassPanel from "@/components/ui/GlassPanel";

function VictoryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const wpm = searchParams.get("wpm") ?? "—";
  const accuracy = searchParams.get("accuracy") ?? "—";
  const xp = searchParams.get("xp") ?? "0";
  const stars = searchParams.get("stars") ?? "0";
  const mode = searchParams.get("mode") ?? "";
  const rank = searchParams.get("rank");

  const starCount = parseInt(stars, 10);

  return (
    <div className="relative z-10 flex min-h-dvh w-full flex-col items-center justify-center px-6">
      {/* Victory icon */}
      <div className="mb-3 text-7xl">🏆</div>

      <h1
        className="mb-1 text-4xl font-black tracking-[8px] md:text-5xl"
        style={{ color: "var(--accent-gold)", textShadow: "0 0 40px rgba(255,204,0,0.3)" }}
      >
        VICTORY
      </h1>

      {mode && (
        <p className="mb-8 text-xs font-bold tracking-[4px]" style={{ color: "var(--text-muted)" }}>
          {mode.toUpperCase()}
        </p>
      )}

      {/* Stars */}
      <div className="mb-8 flex gap-3">
        {[1, 2, 3].map((s) => (
          <span
            key={s}
            className={`text-4xl transition-all duration-500 ${
              s <= starCount ? "opacity-100 scale-110" : "opacity-20 scale-90"
            }`}
            style={{
              filter: s <= starCount ? "drop-shadow(0 0 8px rgba(255,204,0,0.5))" : "none",
            }}
          >
            ⭐
          </span>
        ))}
      </div>

      {/* Stats panel */}
      <GlassPanel glow="gold" blur="md" depth={2} className="mb-8 w-full max-w-lg p-6">
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "WPM", value: wpm, color: "var(--accent-primary)" },
            { label: "ACC", value: typeof accuracy === "string" ? `${(parseFloat(accuracy) * 100).toFixed(0)}%` : accuracy, color: "var(--accent-gold)" },
            { label: "XP", value: `+${xp}`, color: "var(--electric-cyan)" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl bg-black/20 p-4 text-center">
              <p className="text-2xl font-black tabular-nums md:text-3xl" style={{ color: stat.color }}>
                {stat.value}
              </p>
              <p className="mt-1 text-[9px] font-bold tracking-[1.5px]" style={{ color: "var(--text-muted)" }}>
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        {/* Rank display */}
        {rank && (
          <div className="mt-4 text-center">
            <p className="text-lg font-black tabular-nums" style={{ color: "var(--plasma-purple)" }}>
              #{rank}
            </p>
            <p className="text-[9px] font-bold tracking-[1.5px]" style={{ color: "var(--text-muted)" }}>
              GLOBAL RANK
            </p>
          </div>
        )}
      </GlassPanel>

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          variant="primary"
          size="lg"
          onClick={() => router.push(mode ? `/play/${mode}` : "/map")}
        >
          PLAY AGAIN
        </Button>
        <Button variant="secondary" size="lg" onClick={() => router.push("/home")}>
          HOME
        </Button>
      </div>
    </div>
  );
}

export default function VictoryPage() {
  return (
    <>
      <ParticleField />
      <Suspense fallback={
        <div className="flex min-h-dvh items-center justify-center">
          <p style={{ color: "var(--text-muted)" }}>Loading results…</p>
        </div>
      }>
        <VictoryContent />
      </Suspense>
    </>
  );
}
