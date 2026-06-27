"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import GlassPanel from "@/components/ui/GlassPanel";

// ── Explosion Glow ────────────────────────────────────────

function ExplosionGlow() {
  return (
    <div className="relative flex items-center justify-center">
      {/* Red/orange radial glow behind the explosion */}
      <div
        className="pointer-events-none absolute h-24 w-24 rounded-full opacity-40"
        style={{
          background:
            "radial-gradient(circle, rgba(255,34,0,0.5) 0%, rgba(255,80,32,0.15) 50%, transparent 70%)",
          filter: "blur(10px)",
          animation: "explosion-pulse 2s ease-in-out infinite",
        }}
      />
      {/* Explosion icon */}
      <div className="relative animate-scale-bounce text-5xl md:text-6xl">
        💥
      </div>
      <style>{`
        @keyframes explosion-pulse {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.08); }
        }
      `}</style>
    </div>
  );
}

// ── Stat Card ─────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string;
  accent: string;
  /** WPM gets the hero treatment */
  large?: boolean;
}

function StatCard({ label, value, accent, large }: StatCardProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-[rgba(255,255,255,0.06)] backdrop-blur-[12px] ${
        large
          ? "col-span-2 row-span-1 p-4"
          : "col-span-1 p-3"
      }`}
      style={{
        background: large
          ? "linear-gradient(135deg, rgba(255,34,0,0.08), rgba(30,30,48,0.5))"
          : "rgba(20,20,32,0.65)",
        boxShadow: large ? "0 4px 24px rgba(255,34,0,0.12)" : "none",
        borderTop: `2px solid ${accent}`,
      }}
    >
      {/* Value */}
      <p
        className={`font-black tabular-nums leading-none ${
          large ? "text-3xl md:text-4xl" : "text-xl md:text-2xl"
        }`}
        style={{ color: accent }}
      >
        {value}
      </p>
      {/* Label */}
      <p
        className={`mt-1 font-bold tracking-[1.5px] ${
          large ? "text-[9px]" : "text-[8px]"
        }`}
        style={{ color: "var(--text-muted)" }}
      >
        {label}
      </p>
    </div>
  );
}

// ── Tip Card ──────────────────────────────────────────────

const TIPS = [
  "Focus on accuracy first — speed will follow. Try to maintain 95%+ accuracy.",
  "Relax your shoulders and keep your wrists straight — tension slows you down.",
  "Look at the text, not your fingers. Trust your muscle memory.",
  "Use all 10 fingers. Proper home row positioning makes a huge difference.",
  "Breathe steadily — shallow breathing leads to rushed keystrokes and errors.",
  "Start slow and build up. Speed is a byproduct of consistent, accurate typing.",
];

function TipCard() {
  const tip = TIPS[Math.floor(Math.random() * TIPS.length)];

  return (
    <div
      className="rounded-xl border border-[rgba(255,255,255,0.06)] p-4 text-center"
      style={{ background: "rgba(255,34,0,0.04)" }}
    >
      <p className="text-[9px] font-bold tracking-[2px]" style={{ color: "var(--error-red)" }}>
        💡 TIP
      </p>
      <p className="mt-1.5 text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
        {tip}
      </p>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────

export default function FailedContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const wpm = searchParams.get("wpm") ?? "—";
  const accuracy = searchParams.get("accuracy") ?? "—";
  const xp = searchParams.get("xp") ?? "0";
  const mode = searchParams.get("mode") ?? "";

  const accuracyFormatted =
    typeof accuracy === "string"
      ? (() => {
          const parsed = parseFloat(accuracy);
          return isNaN(parsed) ? accuracy : `${(parsed * 100).toFixed(0)}%`;
        })()
      : accuracy;

  const wpmDisplay = typeof wpm === "string" ? (wpm === "—" ? "—" : wpm) : String(wpm);

  const handleRetry = useCallback(() => {
    if (mode.startsWith("level-")) {
      const levelId = mode.replace("level-", "");
      router.push(`/play/level?id=${levelId}`);
    } else if (mode === "timed_1min") {
      router.push("/play/1min");
    } else if (mode === "timed_3min") {
      router.push("/play/3min");
    } else if (mode === "timed_5min") {
      router.push("/play/5min");
    } else if (mode === "contest") {
      router.push("/play/contest");
    } else {
      router.push("/app/map");
    }
  }, [mode, router]);

  return (
    <div className="relative z-10 flex h-screen w-full flex-col items-center justify-center px-4 py-4 overflow-hidden">
      {/* ── Main card: max-w-[480px] centered ── */}
      <div className="flex w-full max-w-[480px] flex-col gap-4">
        {/* ── Hero Section ── */}
        <GlassPanel glow="magma" blur="md" depth={2} className="px-5 py-5 text-center">
          <div className="space-y-3">
            {/* Explosion with radial glow */}
            <ExplosionGlow />

            {/* FAILED title — same display weight as victory */}
            <div className="space-y-1">
              <h1
                className="text-4xl font-black tracking-[10px] md:text-5xl"
                style={{
                  color: "var(--error-red)",
                  textShadow: "0 0 30px rgba(255,34,0,0.25)",
                  fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
                  fontStretch: "condensed",
                }}
              >
                FAILED
              </h1>
              {mode && (
                <p
                  className="text-[9px] font-bold tracking-[4px]"
                  style={{ color: "rgba(255,255,255,0.35)" }}
                >
                  {mode.toUpperCase()}
                </p>
              )}
            </div>

            {/* Encouraging message */}
            <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
              Not quite there. Keep pushing — every attempt makes you faster.
            </p>
          </div>
        </GlassPanel>

        {/* ── Stats Row ── */}
        <GlassPanel glow="magma" blur="md" depth={2} className="p-4">
          <div className="grid grid-cols-3 gap-2">
            {/* WPM — largest visual weight, spans 2 cols */}
            <StatCard
              label="WPM"
              value={wpmDisplay}
              accent="var(--accent-primary)"
              large
            />
            <div className="flex flex-col gap-2">
              <StatCard
                label="ACC"
                value={accuracyFormatted}
                accent="var(--accent-gold)"
              />
              {xp !== "0" && (
                <StatCard
                  label="XP"
                  value={`+${xp}`}
                  accent="var(--electric-cyan)"
                />
              )}
            </div>
          </div>

          {/* Tip section */}
          <div className="mt-3">
            <TipCard />
          </div>
        </GlassPanel>

        {/* ── Actions ── */}
        <div className="space-y-3">
          {/* RETRY — full-width gradient CTA */}
          <button
            onClick={handleRetry}
            className="group relative w-full overflow-hidden rounded-xl py-3 text-xs font-extrabold tracking-[3px] transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: "linear-gradient(135deg, #FF5020, #CC3300)",
              color: "#FFFFFF",
              boxShadow: "0 0 30px rgba(255,80,32,0.25)",
            }}
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              <span className="text-base">⚡</span>
              <span>TRY AGAIN</span>
            </span>
            {/* Shimmer overlay */}
            <div
              className="absolute inset-0 -translate-x-full transition-transform duration-700 group-hover:translate-x-full"
              style={{
                background:
                  "linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)",
              }}
            />
          </button>

          {/* Home + Back — ghost/outline row */}
          <div className="flex gap-2">
            <button
              onClick={() => router.push("/app/home")}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[rgba(255,255,255,0.1)] py-2.5 text-[11px] font-extrabold tracking-[2px] transition-all hover:border-[rgba(255,255,255,0.2)] hover:bg-white/5 active:scale-[0.97]"
              style={{ color: "var(--text-body)" }}
            >
              <span>⌂</span>
              <span>HOME</span>
            </button>
            <button
              onClick={() => router.back()}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[rgba(255,255,255,0.1)] py-2.5 text-[11px] font-extrabold tracking-[2px] transition-all hover:border-[rgba(255,255,255,0.2)] hover:bg-white/5 active:scale-[0.97]"
              style={{ color: "var(--text-body)" }}
            >
              <span>←</span>
              <span>BACK</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
