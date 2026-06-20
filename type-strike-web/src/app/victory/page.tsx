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
    <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-[480px] flex-col items-center justify-center px-5">
      {/* Victory icon */}
      <div className="mb-2 text-6xl">🏆</div>

      <h1
        className="mb-1 text-3xl font-black tracking-[6px]"
        style={{ color: "var(--accent-gold)", textShadow: "0 0 40px rgba(255,204,0,0.3)" }}
      >
        VICTORY
      </h1>

      {mode && (
        <p className="mb-6 text-[10px] font-bold tracking-[3px]" style={{ color: "var(--text-muted)" }}>
          {mode.toUpperCase()}
        </p>
      )}

      {/* Stars */}
      <div className="mb-6 flex gap-2">
        {[1, 2, 3].map((s) => (
          <span
            key={s}
            className={`text-3xl transition-all duration-500 ${
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

      {/* Stats */}
      <GlassPanel glow="gold" blur="sm" depth={2} className="mb-6 w-full p-4">
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "WPM", value: wpm, color: "var(--accent-primary)" },
            { label: "ACC", value: typeof accuracy === "string" ? `${(parseFloat(accuracy) * 100).toFixed(0)}%` : accuracy, color: "var(--accent-gold)" },
            { label: "XP", value: `+${xp}`, color: "var(--electric-cyan)" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl bg-black/20 p-3 text-center">
              <p className="text-xl font-black tabular-nums" style={{ color: stat.color }}>
                {stat.value}
              </p>
              <p className="mt-0.5 text-[8px] font-bold tracking-[1.5px]" style={{ color: "var(--text-muted)" }}>
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        {/* Rank display */}
        {rank && (
          <div className="mt-3 text-center">
            <p className="text-sm font-black tabular-nums" style={{ color: "var(--plasma-purple)" }}>
              #{rank}
            </p>
            <p className="text-[8px] font-bold tracking-[1.5px]" style={{ color: "var(--text-muted)" }}>
              GLOBAL RANK
            </p>
          </div>
        )}
      </GlassPanel>

      {/* Actions */}
      <Button
        variant="primary"
        size="lg"
        fullWidth
        className="mb-2"
        onClick={() => router.push(mode ? `/play/${mode}` : "/map")}
      >
        PLAY AGAIN
      </Button>
      <Button variant="secondary" size="md" fullWidth className="mb-2" onClick={() => router.push("/home")}>
        HOME
      </Button>
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
