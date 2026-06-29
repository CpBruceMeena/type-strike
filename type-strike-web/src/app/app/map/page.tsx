"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import GlassPanel from "@/components/ui/GlassPanel";
import { TIERS, DEFAULT_PLAYER_ID } from "@/lib/constants";
import { api } from "@/lib/api";
import { usePlayer } from "@/hooks/usePlayer";
import type { LevelDetail } from "@/lib/types";

export default function MapPage() {
  const router = useRouter();
  const { playerId } = usePlayer();
  const pid = playerId ?? DEFAULT_PLAYER_ID;
  const [levels, setLevels] = useState<LevelDetail[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<LevelDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [playerScore, setPlayerScore] = useState<{ wpm: number; acc: number; stars: number } | null>(null);

  // Shared data processing — extracts player score from level data
  function processLevelData(data: LevelDetail[]) {
    setLevels(data);
    const completedLevels = data.filter((l) => l.player_stars && l.player_stars > 0);
    if (completedLevels.length > 0) {
      const avgWpm = Math.round(
        completedLevels.reduce((sum, l) => sum + (l.player_best_wpm ?? 0), 0) /
          completedLevels.length
      );
      const avgAcc = Math.round(
        completedLevels.reduce((sum, l) => sum + ((l.player_best_acc ?? 0) * 100), 0) /
          completedLevels.length
      );
      const totalStars = completedLevels.reduce((sum, l) => sum + (l.player_stars ?? 0), 0);
      setPlayerScore({ wpm: avgWpm, acc: avgAcc, stars: totalStars });
    }
  }

  useEffect(() => {
    async function fetchLevels() {
      try {
        const data = await api.getAllLevels(pid);
        processLevelData(data);
      } catch {
        // Fallback: no data
      } finally {
        setLoading(false);
      }
    }

    // Initial fetch
    fetchLevels();

    // Silently re-fetch when page becomes visible again (e.g. after completing a level)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        api.getAllLevels(pid).then(processLevelData).catch(() => {});
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [pid]);

  const handleLevelClick = useCallback((level: LevelDetail) => {
    setSelectedLevel(level);
  }, []);

  const handleStartLevel = useCallback(() => {
    if (selectedLevel) {
      router.push(`/play/level?id=${selectedLevel.id}`);
    }
  }, [selectedLevel, router]);

  const getLevelDetail = useCallback(
    (levelId: number): LevelDetail | undefined => {
      return levels.find((l) => l.id === levelId);
    },
    [levels]
  );

  return (
    <div className="flex flex-1 flex-col">

      <div className="flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-6">
        {/* Player Score Summary */}
        {playerScore && (
          <div className="mx-auto mb-6 w-full max-w-4xl">
            <GlassPanel glow="gold" blur="sm" depth={1} className="px-5 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-2xl">🏆</span>
                  <div>
                    <p className="text-[10px] font-bold tracking-[2px]" style={{ color: "var(--text-muted)" }}>
                      YOUR PROGRESS
                    </p>
                    <p className="text-xs font-bold" style={{ color: "var(--text-white)" }}>
                      Avg {playerScore.wpm} WPM • {playerScore.acc}% ACC • {playerScore.stars} ⭐ total
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-black tabular-nums" style={{ color: "var(--accent-gold)" }}>
                    {levels.filter((l) => l.player_stars && l.player_stars > 0).length}/{levels.length}
                  </p>
                  <p className="text-[9px] font-bold tracking-[1.5px]" style={{ color: "var(--text-muted)" }}>
                    LEVELS CLEARED
                  </p>
                </div>
              </div>
            </GlassPanel>
          </div>
        )}

        <div className="mx-auto w-full max-w-4xl space-y-8">
          {TIERS.map((tier) => {
            // Determine which levels to show: completed + unlocked + next 5 locked
            let lastUnlockedIndex = -1;
            for (let i = 0; i < 100; i++) {
              const levelId = tier.startLevel + i;
              if (levelId > tier.endLevel) break;
              const isLocked = (() => {
                if (i < 3) return false;
                const prevDetail = getLevelDetail(levelId - 1);
                if (!prevDetail) return true;
                return !(prevDetail.player_stars && prevDetail.player_stars > 0);
              })();
              if (!isLocked) lastUnlockedIndex = i;
            }
            // Show up to 5 ahead of the last unlocked
            const showUpTo = Math.min(lastUnlockedIndex + 8, 99);

            const passedCount = Array.from({ length: 100 }, (_, i) => {
              const levelId = tier.startLevel + i;
              if (levelId > tier.endLevel) return 0;
              const detail = getLevelDetail(levelId);
              return detail?.player_stars && detail.player_stars > 0 ? 1 : 0;
            }).filter(Boolean).length;

            return (
              <div key={tier.key}>
                <div className="mb-3 flex items-center gap-3">
                  <div className="h-4 w-1 rounded-full" style={{ backgroundColor: tier.color }} />
                  <span className="text-sm font-bold tracking-[3px]" style={{ color: tier.color }}>
                    {tier.label}
                  </span>
                  <span className="text-xs text-text-muted">
                    ({tier.startLevel}-{tier.endLevel}) · {passedCount} cleared
                  </span>
                </div>
                <div className="grid grid-cols-5 gap-2 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12">
                  {Array.from({ length: showUpTo + 1 }, (_, i) => {
                    const levelId = tier.startLevel + i;
                    if (levelId > tier.endLevel) return null;
                    const detail = getLevelDetail(levelId);
                    const passed = detail?.player_stars && detail.player_stars > 0;
                    const stars = detail?.player_stars ?? 0;

                    // Level locking: first 3 in each tier always unlocked.
                    // Level 4+ requires the previous level to have >=1 star.
                    const isLocked = (() => {
                      if (i < 3) return false;
                      const prevDetail = getLevelDetail(levelId - 1);
                      if (!prevDetail) return true;
                      return !(prevDetail.player_stars && prevDetail.player_stars > 0);
                    })();

                    return (
                      <Card
                        key={levelId}
                        hoverable={!isLocked}
                        onClick={() => {
                          if (detail && !isLocked) handleLevelClick(detail);
                        }}
                        className={`flex flex-col items-center py-3 transition-all duration-200 ${
                          passed ? "border-accent-gold/30" : ""
                        } ${isLocked ? "cursor-not-allowed" : ""}`}
                        style={{
                          ...(passed ? { borderColor: "rgba(255,204,0,0.3)" } : {}),
                          ...(isLocked ? { opacity: 0.55 } : {}),
                        }}
                      >
                        {isLocked ? (
                          <>
                            <span className="text-sm">🔒</span>
                            <span className="text-[8px] text-text-muted mt-1">L{levelId}</span>
                          </>
                        ) : (
                          <>
                            <span className="text-[9px] text-text-muted">L{levelId}</span>
                            <span
                              className={`text-sm mt-0.5 ${
                                stars > 0
                                  ? "text-accent-gold"
                                  : "text-text-disabled"
                              }`}
                            >
                              {stars > 0 ? "★".repeat(stars) : "☆"}
                            </span>
                            {detail && (
                              <span className="mt-1 text-[7px] font-bold tracking-[0.5px] text-text-muted">
                                {detail.pass_wpm}/{detail.pass_accuracy}%
                              </span>
                            )}
                          </>
                        )}
                      </Card>
                    );
                  })}
                </div>
                {/* Show remaining count if levels are hidden */}
                {showUpTo < 99 && (
                  <div className="mt-3 text-center">
                    <p className="text-[10px] text-neutral-600">
                      Complete levels to unlock {99 - showUpTo} more
                    </p>
                  </div>
                )}
              </div>
            );
          })}

          {loading && (
            <div className="flex items-center justify-center py-8">
              <div
                className="h-6 w-6 animate-spin rounded-full border-2 border-transparent"
                style={{
                  borderTopColor: "var(--accent-primary)",
                  borderRightColor: "var(--accent-primary)",
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* ── Level Preview Modal ─────────────────────────── */}
      {selectedLevel && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setSelectedLevel(null)}
        >
          <GlassPanel
            glow="magma"
            blur="lg"
            depth={3}
            className="w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close */}
            <button
              onClick={() => setSelectedLevel(null)}
              className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-lg text-sm transition-colors hover:bg-white/5"
              style={{ color: "var(--text-muted)" }}
            >
              ✕
            </button>

            {/* Level name */}
            <div className="mb-4">
              <p className="text-[10px] font-bold tracking-[2px]" style={{ color: "var(--text-muted)" }}>
                LEVEL {selectedLevel.id}
              </p>
              <h2
                className="mt-1 text-xl font-black tracking-[2px]"
                style={{ color: "var(--text-white)" }}
              >
                {selectedLevel.name}
              </h2>
              <p className="mt-0.5 text-xs tracking-[1.5px]" style={{ color: "var(--text-muted)" }}>
                {selectedLevel.tier.toUpperCase()} • Difficulty {selectedLevel.difficulty}/5
              </p>
            </div>

            {/* Star display */}
            <div className="mb-4 flex items-center gap-2">
              {[1, 2, 3].map((s) => {
                const filled = selectedLevel.player_stars != null && s <= selectedLevel.player_stars;
                return (
                  <span
                    key={s}
                    className={`text-2xl transition-all ${
                      filled ? "opacity-100" : "opacity-30"
                    }`}
                    style={{
                      filter: filled ? "drop-shadow(0 0 6px rgba(255,204,0,0.4))" : "none",
                    }}
                  >
                    ⭐
                  </span>
                );
              })}
            </div>

            {/* Requirements */}
            <div className="mb-5 space-y-2 rounded-xl bg-black/20 p-4">
              <p className="text-[9px] font-bold tracking-[1.5px]" style={{ color: "var(--text-muted)" }}>
                PASS REQUIREMENTS
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-black/20 p-3 text-center">
                  <p className="text-xl font-black" style={{ color: "var(--accent-primary)" }}>
                    {selectedLevel.pass_wpm}
                  </p>
                  <p className="text-[9px] font-bold tracking-[1px]" style={{ color: "var(--text-muted)" }}>
                    MIN WPM
                  </p>
                </div>
                <div className="rounded-lg bg-black/20 p-3 text-center">
                  <p className="text-xl font-black" style={{ color: "var(--accent-gold)" }}>
                    {selectedLevel.pass_accuracy}%
                  </p>
                  <p className="text-[9px] font-bold tracking-[1px]" style={{ color: "var(--text-muted)" }}>
                    MIN ACCURACY
                  </p>
                </div>
              </div>

              {/* Star thresholds */}
              <div className="mt-2 space-y-1 text-[9px]" style={{ color: "var(--text-muted)" }}>
                <p>⭐ {selectedLevel.pass_wpm} WPM • {selectedLevel.pass_accuracy}% ACC to pass</p>
                <p>⭐⭐ {Math.round(selectedLevel.pass_wpm * 1.15)} WPM • 95% ACC for 2 stars</p>
                <p>⭐⭐⭐ {Math.round(selectedLevel.pass_wpm * 1.30)} WPM • 98% ACC • 0 errors for 3 stars</p>
              </div>
            </div>

            {/* Player best */}
            {selectedLevel.player_best_wpm != null && (
              <div className="mb-5 rounded-xl bg-accent-gold/5 p-3 text-center">
                <p className="text-[9px] font-bold tracking-[1px]" style={{ color: "var(--text-muted)" }}>
                  YOUR BEST
                </p>
                <p className="text-sm font-black" style={{ color: "var(--accent-gold)" }}>
                  {selectedLevel.player_best_wpm} WPM •{" "}
                  {selectedLevel.player_best_acc != null
                    ? `${(selectedLevel.player_best_acc * 100).toFixed(0)}%`
                    : "—"}
                </p>
              </div>
            )}

            {/* Paragraph preview */}
            <div className="mb-5 max-h-24 overflow-hidden rounded-lg bg-black/20 p-3">
              <p className="text-[9px] font-bold tracking-[1.5px]" style={{ color: "var(--text-muted)" }}>
                PREVIEW
              </p>
              <p
                className="mt-1 line-clamp-3 text-xs leading-relaxed"
                style={{ color: "var(--text-body)" }}
              >
                {selectedLevel.paragraph}
              </p>
            </div>

            {/* Actions */}
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={handleStartLevel}
            >
              <span className="flex items-center gap-2">
                <span>🔥</span>
                <span>STRIKE</span>
              </span>
            </Button>
          </GlassPanel>
        </div>
      )}
    </div>
  );
}
