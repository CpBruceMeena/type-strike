"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import GlassPanel from "@/components/ui/GlassPanel";
import { api } from "@/lib/api";

// ── Stat Card ─────────────────────────────────────────────

function StatCard({
  label,
  value,
  accent,
  large,
}: {
  label: string;
  value: string;
  accent: string;
  large?: boolean;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-[rgba(255,255,255,0.06)] backdrop-blur-[12px] ${
        large ? "col-span-2 row-span-1 p-4" : "col-span-1 p-3"
      }`}
      style={{
        background: large
          ? "linear-gradient(135deg, rgba(0,229,255,0.08), rgba(30,30,48,0.5))"
          : "rgba(20,20,32,0.65)",
        boxShadow: large ? "0 4px 24px rgba(0,229,255,0.12)" : "none",
        borderTop: `2px solid ${accent}`,
      }}
    >
      <p
        className={`font-black tabular-nums leading-none ${
          large ? "text-3xl md:text-4xl" : "text-xl md:text-2xl"
        }`}
        style={{ color: accent }}
      >
        {value}
      </p>
      <p
        className={`mt-1 font-bold tracking-[1.5px] ${
          large ? "text-[9px]" : "text-[8px]"
        }`}
        style={{ color: "var(--ts-text-dim, #9b94b3)" }}
      >
        {label}
      </p>
    </div>
  );
}

// ── Hurray Toast ──────────────────────────────────────────

function HurrayToast({ type, value }: { type: "personal-best" | "top-15"; value: string }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setVisible(false), 4000);
    return () => clearTimeout(t);
  }, []);

  if (!visible) return null;

  const isPB = type === "personal-best";

  return (
    <div
      className="animate-slide-down"
      style={{
        position: "fixed",
        top: 20,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 999,
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "14px 24px",
        borderRadius: 14,
        background: isPB
          ? "linear-gradient(135deg, rgba(255,204,0,0.2), rgba(255,80,32,0.15))"
          : "linear-gradient(135deg, rgba(0,229,255,0.2), rgba(157,77,255,0.15))",
        border: `1px solid ${isPB ? "rgba(255,204,0,0.3)" : "rgba(0,229,255,0.3)"}`,
        backdropFilter: "blur(12px)",
        boxShadow: isPB
          ? "0 4px 24px rgba(255,204,0,0.2)"
          : "0 4px 24px rgba(0,229,255,0.2)",
        animation: "slideInTop 0.4s ease-out",
      }}
    >
      <span style={{ fontSize: 24 }}>{isPB ? "🏆" : "🌟"}</span>
      <div>
        <p
          style={{
            fontWeight: 800,
            fontSize: 13,
            color: isPB ? "#FFCC00" : "#00E5FF",
            fontFamily: "var(--font-orbitron, 'Orbitron', sans-serif)",
            letterSpacing: 1,
          }}
        >
          {isPB ? "NEW PERSONAL BEST!" : "TOP 15 GLOBALLY!"}
        </p>
        <p style={{ fontSize: 11, color: "var(--ts-text-dim, #9b94b3)", marginTop: 2 }}>
          {value}
        </p>
      </div>
      <style>{`
        @keyframes slideInTop {
          from { opacity: 0; transform: translateX(-50%) translateY(-20px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </div>
  );
}

// ── Performance Bar ───────────────────────────────────────

function PerformanceBar({
  percentile,
  totalPlayers,
  wpm,
}: {
  percentile: number;
  totalPlayers: number;
  wpm: number;
}) {
  const [markerVisible, setMarkerVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMarkerVisible(true), 400);
    return () => clearTimeout(t);
  }, []);

  const barColor =
    percentile >= 90
      ? "linear-gradient(90deg, #FFCC00, #22FF44)"
      : percentile >= 70
      ? "linear-gradient(90deg, #00E5FF, #FFCC00)"
      : percentile >= 50
      ? "linear-gradient(90deg, #00E5FF, #00E5FF88)"
      : "linear-gradient(90deg, #8844FF, #00E5FF)";

  return (
    <div className="space-y-3">
      <div className="text-center">
        <p
          className="text-2xl font-black tabular-nums leading-none md:text-3xl"
          style={{
            color: percentile >= 90 ? "#FFCC00" : "var(--ts-text, #f5f3ff)",
            textShadow: percentile >= 90 ? "0 0 20px rgba(255,204,0,0.3)" : "none",
          }}
        >
          Top {percentile}%
        </p>
        <p className="mt-0.5 text-[9px] font-bold tracking-[2px]" style={{ color: "var(--ts-text-dim, #9b94b3)" }}>
          OF {totalPlayers.toLocaleString()} PLAYERS
        </p>
      </div>

      <div className="relative">
        <div className="mb-1 flex items-center justify-between text-[8px] font-bold tracking-[1px]" style={{ color: "var(--ts-text-dim, #9b94b3)" }}>
          <span>Slowest</span>
          <span>Fastest</span>
        </div>

        <div
          className="relative h-2 w-full overflow-hidden rounded-full"
          style={{ background: "rgba(255,255,255,0.04)" }}
        >
          <div
            className="h-full rounded-full transition-all duration-1000 ease-out"
            style={{
              width: `${Math.max(2, percentile)}%`,
              background: barColor,
              boxShadow: `0 0 12px ${
                percentile >= 90 ? "rgba(255,204,0,0.4)" : "rgba(0,229,255,0.3)"
              }`,
            }}
          />

          {markerVisible && (
            <div
              className="absolute top-1/2 -translate-y-1/2 transition-all duration-700 ease-out"
              style={{
                left: `${Math.max(2, Math.min(98, percentile))}%`,
                transform: "translate(-50%, -50%)",
              }}
            >
              <div className="mx-auto h-1 w-[2px] rounded-full" style={{ background: "#00E5FF" }} />
              <div
                className="flex h-5 w-5 items-center justify-center rounded-full border-2 shadow-lg"
                style={{
                  borderColor: "#00E5FF",
                  background: "linear-gradient(135deg, #00E5FF, #0099CC)",
                  boxShadow: "0 0 12px rgba(0,229,255,0.4)",
                }}
              >
                <span className="text-[9px]">⚡</span>
              </div>
            </div>
          )}
        </div>

        <div className="mt-1 flex items-center justify-between text-[9px]" style={{ color: "var(--ts-text-dim, #9b94b3)" }}>
          <span>{Math.round(totalPlayers * (1 - percentile / 100))} below</span>
          <span>{Math.round(totalPlayers * (percentile / 100))} above</span>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────

export default function TimedResultContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const wpm = parseInt(searchParams.get("wpm") ?? "0", 10);
  const accuracy = parseFloat(searchParams.get("accuracy") ?? "0");
  const xp = searchParams.get("xp") ?? "0";
  const rankStr = searchParams.get("rank");
  const mode = searchParams.get("mode") ?? "";

  const modeLabel =
    mode === "timed_1min" ? "1 MIN" : mode === "timed_3min" ? "3 MIN" : mode === "timed_5min" ? "5 MIN" : mode.toUpperCase();

  // ── Hurray state ──
  const [hurray, setHurray] = useState<{ type: "personal-best" | "top-15"; value: string } | null>(null);

  // ── Leaderboard comparison data ──
  const [leaderboardData, setLeaderboardData] = useState<{
    totalPlayers: number;
    aboveCount: number;
    belowCount: number;
    percentile: number;
  } | null>(null);

  useEffect(() => {
    async function fetchComparison() {
      try {
        const lbMode = mode.replace("timed_", "");
        const resp = await api.getTimedLeaderboard(lbMode, 100);
        const total = resp.total_count || resp.entries.length;
        const above = resp.entries.filter((e) => e.best_wpm > wpm).length;
        const percentile = total > 0 ? Math.round((1 - above / total) * 100) : 50;
        setLeaderboardData({
          totalPlayers: total,
          aboveCount: above,
          belowCount: Math.max(0, total - above),
          percentile,
        });

        // Check hurray conditions
        // Top 15: if rank is provided and <= 15
        const rank = rankStr ? parseInt(rankStr, 10) : null;
        if (rank != null && rank <= 15) {
          setHurray({ type: "top-15", value: `Ranked #${rank} out of ${total} players` });
        }
        // Personal best: if user ranks in top 80th percentile or beat their own record
        // For simplicity: if percentile >= 80, show personal best toast
        if (percentile >= 80 && !(rank != null && rank <= 15)) {
          setHurray({ type: "personal-best", value: `${wpm} WPM · Top ${percentile}%` });
        }
      } catch {
        // Silently fail
      }
    }
    fetchComparison();
  }, [wpm, mode, rankStr]);

  const handlePlayAgain = useCallback(() => {
    if (mode === "timed_1min") router.push("/play/1min");
    else if (mode === "timed_3min") router.push("/play/3min");
    else if (mode === "timed_5min") router.push("/play/5min");
    else router.push("/play/contest");
  }, [mode, router]);

  return (
    <div className="relative z-10 flex h-screen w-full flex-col items-center justify-center px-4 py-4 overflow-hidden">
      {/* Hurray Toast */}
      {hurray && <HurrayToast type={hurray.type} value={hurray.value} />}

      <div className="flex w-full max-w-[480px] flex-col gap-4">
        {/* ── Header Section ── */}
        <GlassPanel glow="cyan" blur="md" depth={2} className="px-5 py-5 text-center">
          <div className="space-y-2.5">
            {/* Timer icon */}
            <div className="relative flex items-center justify-center">
              <div
                className="pointer-events-none absolute h-20 w-20 rounded-full opacity-30"
                style={{
                  background: "radial-gradient(circle, rgba(0,229,255,0.4) 0%, rgba(0,229,255,0.1) 50%, transparent 70%)",
                  filter: "blur(10px)",
                }}
              />
              <div className="relative text-4xl md:text-5xl">⏱️</div>
            </div>

            <div className="space-y-1">
              <h1
                className="text-3xl font-black tracking-[8px] md:text-4xl"
                style={{
                  color: "var(--ts-text, #f5f3ff)",
                  fontFamily: "var(--font-orbitron, 'Orbitron', sans-serif)",
                }}
              >
                TIME&apos;S UP
              </h1>
              <p
                className="text-[10px] font-bold tracking-[4px]"
                style={{ color: "#00E5FF" }}
              >
                {modeLabel}
              </p>
            </div>
          </div>
        </GlassPanel>

        {/* ── Stats Row ── */}
        <GlassPanel glow="cyan" blur="md" depth={2} className="p-4">
          <div className="grid grid-cols-3 gap-2">
            <StatCard
              label="WPM"
              value={String(wpm)}
              accent="#00E5FF"
              large
            />
            <div className="flex flex-col gap-2">
              <StatCard
                label="ACC"
                value={`${(accuracy * 100).toFixed(0)}%`}
                accent="#22FF44"
              />
              <StatCard
                label="XP"
                value={`+${xp}`}
                accent="#FFCC00"
              />
            </div>
          </div>
        </GlassPanel>

        {/* ── Performance Comparison ── */}
        <GlassPanel glow="cyan" blur="md" depth={2} className="p-4">
          <p className="mb-3 text-[9px] font-bold tracking-[2px]" style={{ color: "var(--ts-text-dim, #9b94b3)" }}>
            LEADERBOARD COMPARISON
          </p>

          {leaderboardData ? (
            <PerformanceBar
              percentile={leaderboardData.percentile}
              totalPlayers={leaderboardData.totalPlayers}
              wpm={wpm}
            />
          ) : (
            <p className="text-center text-[10px]" style={{ color: "var(--ts-text-dim, #9b94b3)" }}>
              Loading comparison data…
            </p>
          )}
        </GlassPanel>

        {/* ── Actions ── */}
        <div className="space-y-3">
          {/* Play Again */}
          <button
            onClick={handlePlayAgain}
            className="group relative w-full overflow-hidden rounded-xl py-3 text-xs font-extrabold tracking-[3px] transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: "linear-gradient(135deg, #00E5FF, #0099CC)",
              color: "#000000",
              boxShadow: "0 0 30px rgba(0,229,255,0.25)",
            }}
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              <span className="text-base">⚡</span>
              <span>PLAY AGAIN</span>
            </span>
            <div
              className="absolute inset-0 -translate-x-full transition-transform duration-700 group-hover:translate-x-full"
              style={{
                background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)",
              }}
            />
          </button>

          {/* Home + Contest Selection */}
          <div className="flex gap-2">
            <button
              onClick={() => router.push("/play/contest")}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[rgba(255,255,255,0.1)] py-3 text-xs font-extrabold tracking-[2px] transition-all hover:border-[rgba(255,255,255,0.2)] hover:bg-white/5 active:scale-[0.97]"
              style={{ color: "var(--ts-text-dim, #9b94b3)" }}
            >
              <span>⏱️</span>
              <span>MODES</span>
            </button>
            <button
              onClick={() => router.push("/app/home")}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[rgba(255,255,255,0.1)] py-3 text-xs font-extrabold tracking-[2px] transition-all hover:border-[rgba(255,255,255,0.2)] hover:bg-white/5 active:scale-[0.97]"
              style={{ color: "var(--ts-text-dim, #9b94b3)" }}
            >
              <span>⌂</span>
              <span>HOME</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
