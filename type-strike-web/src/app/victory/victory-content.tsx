"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import GlassPanel from "@/components/ui/GlassPanel";
import ConfettiAnimation from "@/components/effects/ConfettiAnimation";
import TierUpgradeCelebration from "@/components/game/TierUpgradeCelebration";
import { api } from "@/lib/api";
import { LEVEL_TOTAL_COUNT } from "@/lib/constants";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://typestrike.app";

// ── Trophy Glow ──────────────────────────────────────────

function TrophyGlow() {
  return (
    <div className="relative flex items-center justify-center">
      {/* Soft radial glow behind the trophy */}
      <div
        className="pointer-events-none absolute h-24 w-24 rounded-full opacity-40"
        style={{
          background:
            "radial-gradient(circle, rgba(255,204,0,0.5) 0%, rgba(255,204,0,0.15) 50%, transparent 70%)",
          filter: "blur(10px)",
          animation: "trophy-pulse 2s ease-in-out infinite",
        }}
      />
      {/* Trophy */}
      <div className="relative animate-scale-bounce text-5xl md:text-6xl">
        🏆
      </div>
      <style>{`
        @keyframes trophy-pulse {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.05); }
        }
      `}</style>
    </div>
  );
}

// ── Star Ribbon ───────────────────────────────────────────

function StarRibbon({ starCount }: { starCount: number }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[rgba(255,204,0,0.15)] to-transparent" />
      <div className="flex items-center gap-2">
        {[1, 2, 3].map((s) => {
          const filled = s <= starCount;
          return (
            <span
              key={s}
              className={`relative transition-all duration-500 ${
                filled
                  ? "scale-110 opacity-100"
                  : "scale-90 opacity-20"
              }`}
              style={{
                fontSize: filled ? "1.25rem" : "1.1rem",
                filter: filled
                  ? "drop-shadow(0 0 6px rgba(255,204,0,0.5))"
                  : "none",
                transitionDelay: filled ? `${(s - 1) * 150}ms` : "0ms",
              }}
            >
              {filled ? "⭐" : "☆"}
            </span>
          );
        })}
      </div>
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[rgba(255,204,0,0.15)] to-transparent" />
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
          ? "linear-gradient(135deg, rgba(255,80,32,0.08), rgba(30,30,48,0.5))"
          : "rgba(20,20,32,0.65)",
        boxShadow: large ? "0 4px 24px rgba(255,80,32,0.15)" : "none",
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
  const barRef = useRef<HTMLDivElement>(null);
  const [markerVisible, setMarkerVisible] = useState(false);

  useEffect(() => {
    // Trigger marker animation after mount
    const t = setTimeout(() => setMarkerVisible(true), 400);
    return () => clearTimeout(t);
  }, []);

  // Determine color based on percentile
  const barColor =
    percentile >= 90
      ? "linear-gradient(90deg, #FFCC00, #22FF44)"
      : percentile >= 70
      ? "linear-gradient(90deg, #FF5020, #FFCC00)"
      : percentile >= 50
      ? "linear-gradient(90deg, #FF5020, #FF6600)"
      : "linear-gradient(90deg, #8844FF, #FF5020)";

  return (
    <div className="space-y-3">
      {/* Top X% callout */}
      <div className="text-center">            <p
          className="text-2xl font-black tabular-nums leading-none md:text-3xl"
          style={{
            color:
              percentile >= 90
                ? "var(--accent-gold)"
                : percentile >= 70
                ? "var(--accent-primary)"
                : "var(--text-body)",
            textShadow:
              percentile >= 90
                ? "0 0 20px rgba(255,204,0,0.3)"
                : "none",
          }}
        >
          Top {percentile}%
        </p>
        <p className="mt-0.5 text-[9px] font-bold tracking-[2px]" style={{ color: "var(--text-muted)" }}>
          OF {totalPlayers.toLocaleString()} PLAYERS
        </p>
      </div>

      {/* Bar track */}
      <div className="relative" ref={barRef}>
        {/* Endpoint labels */}
        <div className="mb-1 flex items-center justify-between text-[8px] font-bold tracking-[1px]" style={{ color: "var(--text-disabled)" }}>
          <span>Slowest</span>
          <span>Fastest</span>
        </div>

        {/* Bar track */}          <div
          className="relative h-2 w-full overflow-hidden rounded-full"
          style={{ background: "rgba(255,255,255,0.04)" }}
        >
          {/* Filled progress */}
          <div
            className="h-full rounded-full transition-all duration-1000 ease-out"
            style={{
              width: `${Math.max(2, percentile)}%`,
              background: barColor,
              boxShadow: `0 0 12px ${
                percentile >= 90
                  ? "rgba(255,204,0,0.4)"
                  : "rgba(255,80,32,0.3)"
              }`,
            }}
          />

          {/* Avatar pin marker at user's position */}
          {markerVisible && (
            <div
              className="absolute top-1/2 -translate-y-1/2 transition-all duration-700 ease-out"
              style={{
                left: `${Math.max(2, Math.min(98, percentile))}%`,
                transform: "translate(-50%, -50%)",
              }}
            >
              {/* Pin stem */}
              <div
                className="mx-auto h-1 w-[2px] rounded-full"
                style={{ background: "var(--accent-gold)" }}
              />
              {/* Avatar dot */}
              <div
                className="flex h-5 w-5 items-center justify-center rounded-full border-2 shadow-lg"
                style={{
                  borderColor: "var(--accent-gold)",
                  background:
                    "linear-gradient(135deg, var(--accent-primary), var(--accent-gold))",
                  boxShadow: "0 0 12px rgba(255,204,0,0.4)",
                }}
              >
                <span className="text-[9px]">⚡</span>
              </div>
            </div>
          )}
        </div>

        {/* Below / Above counts */}
        <div className="mt-1 flex items-center justify-between text-[9px]" style={{ color: "var(--text-disabled)" }}>
          <span>{Math.round(totalPlayers * (1 - percentile / 100))} below</span>
          <span>{Math.round(totalPlayers * (percentile / 100))} above</span>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────

export default function VictoryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const wpm = parseInt(searchParams.get("wpm") ?? "0", 10);
  const accuracyStr = searchParams.get("accuracy") ?? "0";
  const accuracy = parseFloat(accuracyStr);
  const xp = searchParams.get("xp") ?? "0";
  const stars = searchParams.get("stars") ?? "0";
  const mode = searchParams.get("mode") ?? "";
  const rank = searchParams.get("rank");
  const upgraded = searchParams.get("upgraded") === "true";
  const newTier = searchParams.get("newTier") ?? "";
  const newTierIcon = searchParams.get("newTierIcon") ?? "🏆";
  const newTierColor = searchParams.get("newTierColor") ?? "#FF5020";
  const newUnlocksParam = searchParams.get("newUnlocks");
  const newUnlocks: string[] = newUnlocksParam ? (() => {
    try { return JSON.parse(newUnlocksParam); } catch { return []; }
  })() : [];

  const [showUpgradeModal, setShowUpgradeModal] = useState(upgraded);
  const [showConfetti, setShowConfetti] = useState(true);

  const starCount = Math.max(0, parseInt(stars, 10) || 0);

  // Auto-dismiss confetti after 1.2s
  useEffect(() => {
    const t = setTimeout(() => setShowConfetti(false), 1200);
    return () => clearTimeout(t);
  }, []);

  // ── Dynamic OG meta tags (client-side update) ──
  useEffect(() => {
    const ogUrl = `${BASE_URL}/api/og?victory=true&wpm=${wpm}&accuracy=${accuracy}&stars=${stars}&mode=${encodeURIComponent(mode)}`;
    const existing = document.querySelector('meta[property="og:image"]');
    if (existing) existing.setAttribute("content", ogUrl);
    const twitterImg = document.querySelector('meta[name="twitter:image"]');
    if (twitterImg) twitterImg.setAttribute("content", ogUrl);
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute("content", `Victory — ${wpm} WPM on Type Strike`);
    document.title = `Victory — ${wpm} WPM | Type Strike`;
  }, [wpm, accuracy, stars, mode]);

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
        if (mode.startsWith("level-") || mode === "contest") {
          const resp = await api.getLeaderboardTop(100);
          const total = resp.total_count || resp.entries.length;
          const above = resp.entries.filter((e) => e.best_wpm > wpm).length;
          const percentile = total > 0 ? Math.round((1 - above / total) * 100) : 50;
          setLeaderboardData({
            totalPlayers: total,
            aboveCount: above,
            belowCount: Math.max(0, total - above),
            percentile,
          });
        } else {
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
        }
      } catch {
        // Silently fail — comparison is optional
      }
    }
    fetchComparison();
  }, [wpm, mode]);

  const handlePlayAgain = useCallback(() => {
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

  const handleNextLevel = useCallback(() => {
    if (mode.startsWith("level-")) {
      const currentLevel = parseInt(mode.replace("level-", ""), 10);
      const nextLevel = currentLevel + 1;
      if (nextLevel <= LEVEL_TOTAL_COUNT) {
        router.push(`/play/level?id=${nextLevel}`);
      }
    }
  }, [mode, router]);

  const hasNextLevel =
    mode.startsWith("level-") &&
    parseInt(mode.replace("level-", ""), 10) + 1 <= LEVEL_TOTAL_COUNT;

  return (
    <>
      {/* Confetti celebration — auto-dismisses after 1.2s */}
      <ConfettiAnimation
        active={showConfetti}
        duration={1200}
        count={60}
        colors={["#FFCC00", "#FF5020", "#CC44FF", "#00E5FF", "#22FF44"]}
      />

      <div className="relative z-10 flex h-screen w-full flex-col items-center justify-center px-4 py-4 overflow-hidden">
        {/* ── Main card: max-w-[480px] centered ── */}
        <div className="flex w-full max-w-[480px] flex-col gap-4">
          {/* ── Hero Section ── */}
          <GlassPanel glow="gold" blur="md" depth={2} className="px-5 py-5 text-center">
            <div className="space-y-2.5">
              {/* Trophy with radial glow */}
              <TrophyGlow />

              {/* VICTORY title — larger, display weight */}
              <div className="space-y-1">
                <h1
                  className="text-4xl font-black tracking-[10px] md:text-5xl"
                  style={{
                    color: "var(--accent-gold)",
                    textShadow: "0 0 30px rgba(255,204,0,0.25)",
                    fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
                    fontStretch: "condensed",
                  }}
                >
                  VICTORY
                </h1>
                {mode && (
                  <p
                    className="text-[10px] font-bold tracking-[4px]"
                    style={{ color: "rgba(255,255,255,0.35)" }}
                  >
                    {mode.toUpperCase()}
                  </p>
                )}
              </div>

              {/* Stars as decorative ribbon */}
              <StarRibbon starCount={starCount} />
            </div>
          </GlassPanel>

          {/* ── Stats Row ── */}
          <GlassPanel glow="gold" blur="md" depth={2} className="p-4">
            <div className="grid grid-cols-3 gap-2">
              {/* WPM — largest visual weight, spans 2 cols */}
              <StatCard
                label="WPM"
                value={String(wpm)}
                accent="var(--accent-primary)"
                large
              />
              <div className="flex flex-col gap-2">
                <StatCard
                  label="ACC"
                  value={`${(accuracy * 100).toFixed(0)}%`}
                  accent="var(--accent-gold)"
                />
                <StatCard
                  label="XP"
                  value={`+${xp}`}
                  accent="var(--electric-cyan)"
                />
              </div>
            </div>              {/* Rank display (conditionally shown) */}
            {rank && (
              <div className="mt-3 text-center">
                <p
                  className="text-base font-black tabular-nums"
                  style={{ color: "var(--plasma-purple)" }}
                >
                  #{rank}
                </p>
                <p className="text-[8px] font-bold tracking-[1.5px]" style={{ color: "var(--text-muted)" }}>
                  GLOBAL RANK
                </p>
              </div>
            )}
          </GlassPanel>

          {/* ── Performance Comparison ── */}
          <GlassPanel glow="magma" blur="md" depth={2} className="p-4">
            <p className="mb-3 text-[9px] font-bold tracking-[2px]" style={{ color: "var(--text-muted)" }}>
              PERFORMANCE COMPARISON
            </p>

            {leaderboardData ? (
              <PerformanceBar
                percentile={leaderboardData.percentile}
                totalPlayers={leaderboardData.totalPlayers}
                wpm={wpm}
              />
            ) : (
              <p className="text-center text-[10px]" style={{ color: "var(--text-disabled)" }}>
                Loading comparison data…
              </p>
            )}
          </GlassPanel>

          {/* ── Actions ── */}
          <div className="space-y-3">
            {/* Next Level — full-width gradient CTA */}
            {hasNextLevel && (
              <button
                onClick={handleNextLevel}
                className="group relative w-full overflow-hidden rounded-xl py-3 text-xs font-extrabold tracking-[3px] transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  background: "linear-gradient(135deg, #FFCC00, #FF6600)",
                  color: "#000000",
                  boxShadow: "0 0 30px rgba(255,204,0,0.25)",
                }}
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <span className="text-base">→</span>
                  <span>NEXT LEVEL</span>
                </span>
                {/* Shimmer overlay */}
                <div
                  className="absolute inset-0 -translate-x-full transition-transform duration-700 group-hover:translate-x-full"
                  style={{
                    background:
                      "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)",
                  }}
                />
              </button>
            )}

            {/* Play Again + Home — ghost/outline row */}
            <div className="flex gap-2">
              <button
                onClick={handlePlayAgain}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[rgba(255,255,255,0.1)] py-3 text-xs font-extrabold tracking-[2px] transition-all hover:border-[rgba(255,255,255,0.2)] hover:bg-white/5 active:scale-[0.97]"
                style={{ color: "var(--text-body)" }}
              >
                <span>⚡</span>
                <span>PLAY AGAIN</span>
              </button>
              <button
                onClick={() => router.push("/app/home")}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[rgba(255,255,255,0.1)] py-3 text-xs font-extrabold tracking-[2px] transition-all hover:border-[rgba(255,255,255,0.2)] hover:bg-white/5 active:scale-[0.97]"
                style={{ color: "var(--text-body)" }}
              >
                <span>⌂</span>
                <span>HOME</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tier Upgrade Celebration Modal */}
      <TierUpgradeCelebration
        show={showUpgradeModal}
        tierName={newTier}
        tierIcon={newTierIcon}
        tierColor={newTierColor}
        newUnlocks={newUnlocks}
        onDismiss={() => setShowUpgradeModal(false)}
      />
    </>
  );
}
