"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import GlassPanel from "@/components/ui/GlassPanel";
import TierUpgradeCelebration from "@/components/game/TierUpgradeCelebration";
import { api } from "@/lib/api";
import { LEVEL_TOTAL_COUNT } from "@/lib/constants";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://typestrike.app";

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

  const starCount = Math.max(0, parseInt(stars, 10) || 0);

  // ── Dynamic OG meta tags (client-side update) ──
  // Server-side generateMetadata handles OG tags for crawlers (Facebook, Twitter, Discord).
  // This client-side effect updates them after SPA navigation, where the server head
  // is not re-evaluated. Both are needed for full coverage.
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

  const wpmPercentile =
    wpm <= 30
      ? "Beginner"
      : wpm <= 50
      ? "Average"
      : wpm <= 70
      ? "Good"
      : wpm <= 90
      ? "Fast"
      : wpm <= 120
      ? "Expert"
      : "Elite";

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

      {/* Tier Upgrade Celebration Modal */}
      <TierUpgradeCelebration
        show={showUpgradeModal}
        tierName={newTier}
        tierIcon={newTierIcon}
        tierColor={newTierColor}
        newUnlocks={newUnlocks}
        onDismiss={() => setShowUpgradeModal(false)}
      />

      {/* Stats panel */}
      <GlassPanel glow="gold" blur="md" depth={2} className="mb-6 w-full max-w-lg p-6">
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "WPM", value: String(wpm), color: "var(--accent-primary)" },
            { label: "ACC", value: `${(accuracy * 100).toFixed(0)}%`, color: "var(--accent-gold)" },
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

      {/* Performance Comparison */}
      <GlassPanel glow="magma" blur="md" depth={2} className="mb-6 w-full max-w-lg p-4">
        <p className="mb-3 text-[10px] font-bold tracking-[2px]" style={{ color: "var(--text-muted)" }}>
          PERFORMANCE COMPARISON
        </p>

        {/* Rating badge */}
        <div className="mb-3 text-center">
          <span
            className="inline-block rounded-full px-5 py-1.5 text-sm font-black tracking-[3px]"
            style={{
              background: `linear-gradient(135deg, ${wpmPercentile === "Elite" ? "#FFCC00" : wpmPercentile === "Expert" ? "#CC44FF" : wpmPercentile === "Fast" ? "#FF6600" : wpmPercentile === "Good" ? "#22FF44" : "#888888"}22, transparent)`,
              color: wpmPercentile === "Elite" ? "#FFCC00" : wpmPercentile === "Expert" ? "#CC44FF" : wpmPercentile === "Fast" ? "#FF6600" : wpmPercentile === "Good" ? "#22FF44" : "var(--text-muted)",
              border: `1px solid ${wpmPercentile === "Elite" ? "rgba(255,204,0,0.3)" : wpmPercentile === "Expert" ? "rgba(204,68,255,0.3)" : wpmPercentile === "Fast" ? "rgba(255,102,0,0.3)" : wpmPercentile === "Good" ? "rgba(34,255,68,0.3)" : "rgba(136,136,136,0.3)"}`,
            }}
          >
            {wpmPercentile}
          </span>
        </div>

        {/* Comparison bar */}
        {leaderboardData ? (
          <div>
            <div className="flex items-center justify-between text-[9px]" style={{ color: "var(--text-muted)" }}>
              <span>{leaderboardData.belowCount} below</span>
              <span className="font-bold" style={{ color: "var(--accent-gold)" }}>
                Top {leaderboardData.percentile}%
              </span>
              <span>{leaderboardData.aboveCount} above</span>
            </div>
            <div
              className="mt-1 h-2 w-full overflow-hidden rounded-full"
              style={{ background: "rgba(255,255,255,0.06)" }}
            >
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${leaderboardData.percentile}%`,
                  background: `linear-gradient(90deg, #FF5020, #FFCC00${leaderboardData.percentile > 70 ? ", #22FF44" : ""})`,
                  boxShadow: "0 0 10px rgba(255,80,32,0.4)",
                }}
              />
            </div>
            <p className="mt-1 text-[9px] text-center" style={{ color: "var(--text-muted)" }}>
              out of {leaderboardData.totalPlayers} players
            </p>
          </div>
        ) : (
          <p className="text-center text-[10px]" style={{ color: "var(--text-disabled)" }}>
            Loading comparison data…
          </p>
        )}
      </GlassPanel>

      {/* Actions */}
      <GlassPanel glow="none" blur="sm" depth={1} className="w-full max-w-lg p-4">
        <div className="flex flex-col gap-2">
          {/* Next Level — prominent CTA for level mode */}
          {mode.startsWith("level-") && (() => {
            const currentLevel = parseInt(mode.replace("level-", ""), 10);
            const nextLevel = currentLevel + 1;
            const hasNext = nextLevel <= LEVEL_TOTAL_COUNT;
            if (!hasNext) return null;
            return (
              <button
                onClick={() => {
                  router.push(`/play/level?id=${nextLevel}`);
                }}
                className="group relative w-full overflow-hidden rounded-xl py-3.5 text-sm font-extrabold tracking-[3px] transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  background: "linear-gradient(135deg, #FFCC00, #FF6600)",
                  color: "#000000",
                  boxShadow: "0 0 24px rgba(255,204,0,0.3)",
                }}
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <span>→</span>
                  <span>NEXT LEVEL</span>
                </span>
                {/* Shimmer overlay */}
                <div
                  className="absolute inset-0 -translate-x-full transition-transform duration-700 group-hover:translate-x-full"
                  style={{
                    background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)",
                  }}
                />
              </button>
            );
          })()}

          {/* Play Again + Home — side by side */}
          <div className="flex gap-2">
            <Button
              variant="primary"
              size="md"
              fullWidth
              onClick={handlePlayAgain}
            >
              <span className="flex items-center justify-center gap-1.5">
                <span>⚡</span>
                <span>PLAY AGAIN</span>
              </span>
            </Button>
            <Button
              variant="secondary"
              size="md"
              fullWidth
              onClick={() => router.push("/app/home")}
            >
              <span className="flex items-center justify-center gap-1.5">
                <span>⌂</span>
                <span>HOME</span>
              </span>
            </Button>
          </div>

          {/* Back — ghost, centered */}
          <button
            onClick={() => router.back()}
            className="flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold tracking-[2px] transition-all hover:brightness-125"
            style={{ color: "var(--text-muted)" }}
          >
            <span>←</span>
            <span>BACK</span>
          </button>
        </div>
      </GlassPanel>
    </div>
  );
}
