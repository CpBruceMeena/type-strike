"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { usePlayer } from "@/hooks/usePlayer";
import { useAchievements } from "@/hooks/useAchievements";
import TopBar from "@/components/layout/TopBar";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import GlassPanel from "@/components/ui/GlassPanel";
import type { PlayerAchievement } from "@/lib/types";

// Must match the key used in Sidebar.tsx for tracking seen achievements
const SEEN_COUNT_KEY = "typestrike_seen_achievement_count";

// ── Category Config ─────────────────────────────────────

const CATEGORY_COLORS: Record<string, string> = {
  speed: "#FF5020",
  accuracy: "#00E5FF",
  combo: "#FFCC00",
  progression: "#22DD44",
  streak: "#8844FF",
  social: "#FF44CC",
};

const CATEGORY_LABELS: Record<string, string> = {
  speed: "SPEED",
  accuracy: "ACCURACY",
  combo: "COMBO",
  progression: "PROGRESSION",
  streak: "STREAK",
  social: "SOCIAL",
};

const CATEGORY_ORDER = ["speed", "accuracy", "combo", "progression", "streak", "social"];

// ── Component ────────────────────────────────────────────

export default function FeatsPage() {
  const router = useRouter();
  const { playerId } = usePlayer();
  const {
    achievements,
    unlockedCount,
    totalCount,
    loading,
  } = useAchievements(playerId);

  // When the achievements page loads, save the current unlock count to localStorage
  // so the sidebar badge stops showing the notification until new achievements arrive
  useEffect(() => {
    if (!loading && unlockedCount > 0) {
      try {
        localStorage.setItem(SEEN_COUNT_KEY, String(unlockedCount));
      } catch {}
    }
  }, [loading, unlockedCount]);

  const [selectedAchievement, setSelectedAchievement] = useState<PlayerAchievement | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleShare = useCallback((feat: PlayerAchievement) => {
    setSelectedAchievement(feat);
    setShowShareModal(true);
  }, []);

  const handleTakeScreenshot = useCallback(async () => {
    if (!cardRef.current || !selectedAchievement) return;

    const { toPng } = await import("html-to-image");

    try {
      const dataUrl = await toPng(cardRef.current, {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: "#0A0A14",
        style: {
          borderRadius: "24px",
        },
      });

      const shareText = `🏆 I achieved "${selectedAchievement.name}" on Type Strike!\n${selectedAchievement.description}\n\nType with fury. Strike with fire. 🔥\nhttps://typestrike.app`;

      if (navigator.share) {
        try {
          const blob = await (await fetch(dataUrl)).blob();
          const file = new File([blob], `typestrike-${selectedAchievement.key}.png`, { type: "image/png" });
          await navigator.share({
            title: `Type Strike — ${selectedAchievement.name}`,
            text: shareText,
            files: [file],
          });
          setShowShareModal(false);
          return;
        } catch {
          // Native share with files not supported or cancelled
        }
      }

      const link = document.createElement("a");
      link.download = `typestrike-${selectedAchievement.key}.png`;
      link.href = dataUrl;
      link.click();
      link.remove();
      setShowShareModal(false);
    } catch {
      const shareText = `🏆 I achieved "${selectedAchievement.name}" on Type Strike!\n${selectedAchievement.description}\n\nType with fury. Strike with fire. 🔥\nhttps://typestrike.app`;

      try {
        await navigator.clipboard.writeText(shareText);
        alert("Share text copied to clipboard! 📋");
        setShowShareModal(false);
      } catch {
        const textarea = document.createElement("textarea");
        textarea.value = shareText;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
        alert("Share text copied! 📋");
        setShowShareModal(false);
      }
    }
  }, [selectedAchievement]);

  const categoryAchievements = (category: string) =>
    achievements.filter((a) => a.category === category);

  const unlockedInCategory = (category: string) =>
    categoryAchievements(category).filter((a) => a.unlocked).length;

  const totalInCategory = (category: string) =>
    categoryAchievements(category).length;

  return (
    <div className="flex flex-1 flex-col">
      <TopBar showBack title="FEATS" />

      <div className="flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-6">
        <div className="mx-auto w-full max-w-4xl">
          {/* Summary banner */}
          <div className="mb-6 rounded-2xl border border-white/5 bg-gradient-to-r from-[#1A0A28] to-[#0A0A14] p-4">
            <p className="text-center text-[11px] font-bold tracking-[2px] text-text-muted">
              FEATS UNLOCKED
            </p>
            <p className="text-center text-3xl font-black text-white">
              {unlockedCount}{" "}
              <span className="text-lg font-bold" style={{ color: "var(--text-muted)" }}>
                / {totalCount}
              </span>
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-sm font-bold tracking-[2px]" style={{ color: "var(--text-muted)" }}>
                LOADING FEATS...
              </div>
            </div>
          ) : (
            CATEGORY_ORDER.map((category) => {
              const feats = categoryAchievements(category);
              if (feats.length === 0) return null;
              const unlocked = unlockedInCategory(category);
              const total = totalInCategory(category);
              const color = CATEGORY_COLORS[category] || "#CC44FF";

              return (
                <div key={category} className="mb-8">
                  {/* Category header */}
                  <div className="mb-3 flex items-center gap-3">
                    <div
                      className="h-4 w-1 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    <span
                      className="text-sm font-bold tracking-[3px] uppercase"
                      style={{ color }}
                    >
                      {CATEGORY_LABELS[category] || category}
                    </span>
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {unlocked}/{total}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                    {feats.map((feat) => {
                      const progressPct = feat.max_progress > 0
                        ? Math.round((feat.progress / feat.max_progress) * 100)
                        : 0;
                      return (
                        <Card
                          key={feat.achievement_id}
                          hoverable
                          className={`p-4 transition-all duration-200 ${
                            feat.unlocked ? "" : "opacity-60"
                          }`}
                          onClick={() => setSelectedAchievement(feat)}
                          style={
                            feat.unlocked
                              ? {
                                  borderColor: `${color}40`,
                                  boxShadow: `0 0 15px ${color}30`,
                                }
                              : {}
                          }
                        >
                          <div className="text-center">
                            <span className="text-3xl">{feat.icon}</span>
                            <p
                              className="mt-1 text-[11px] font-bold tracking-[0.5px]"
                              style={{
                                color: feat.unlocked ? color : "var(--text-muted)",
                              }}
                            >
                              {feat.name}
                            </p>
                            <p
                              className="mt-0.5 text-[8px] leading-tight"
                              style={{ color: "var(--text-muted)" }}
                            >
                              {feat.description}
                            </p>

                            {/* Progress bar */}
                            {!feat.unlocked && feat.max_progress > 1 && (
                              <div className="mt-2">
                                <div
                                  className="h-1 w-full overflow-hidden rounded-full"
                                  style={{ background: "rgba(255,255,255,0.06)" }}
                                >
                                  <div
                                    className="h-full rounded-full transition-all duration-300"
                                    style={{
                                      width: `${progressPct}%`,
                                      background: `linear-gradient(90deg, ${color}, ${color}66)`,
                                    }}
                                  />
                                </div>
                                <p className="mt-0.5 text-[8px]" style={{ color: "var(--text-muted)" }}>
                                  {feat.progress}/{feat.max_progress}
                                </p>
                              </div>
                            )}
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── Feat Detail Modal ────────────────────────────── */}
      {selectedAchievement && !showShareModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setSelectedAchievement(null)}
        >
          <GlassPanel
            glow="magma"
            blur="lg"
            depth={3}
            className="w-full max-w-sm p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedAchievement(null)}
              className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-lg text-sm transition-colors hover:bg-white/5"
              style={{ color: "var(--text-muted)" }}
            >
              ✕
            </button>

            <div className="text-center">
              <span className="text-5xl">{selectedAchievement.icon}</span>
              <h2
                className="mt-3 text-lg font-black tracking-[2px]"
                style={{ color: CATEGORY_COLORS[selectedAchievement.category] || "#CC44FF" }}
              >
                {selectedAchievement.name}
              </h2>
              <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
                {selectedAchievement.description}
              </p>

              {/* Progress */}
              <div className="mt-4 rounded-xl bg-black/20 p-3">
                <p className="text-[9px] font-bold tracking-[1.5px]" style={{ color: "var(--text-muted)" }}>
                  PROGRESS
                </p>
                <div className="mt-2">
                  <div
                    className="h-1.5 w-full overflow-hidden rounded-full"
                    style={{ background: "rgba(255,255,255,0.08)" }}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${selectedAchievement.max_progress > 0 ? Math.round((selectedAchievement.progress / selectedAchievement.max_progress) * 100) : 0}%`,
                        background: `linear-gradient(90deg, ${CATEGORY_COLORS[selectedAchievement.category] || "#CC44FF"}, ${(CATEGORY_COLORS[selectedAchievement.category] || "#CC44FF")}88)`,
                      }}
                    />
                  </div>
                  <p className="mt-1 text-[9px]" style={{ color: "var(--text-muted)" }}>
                    {selectedAchievement.unlocked
                      ? "UNLOCKED 🎉"
                      : `${selectedAchievement.progress}/${selectedAchievement.max_progress}`}
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-5 flex gap-2">
              <Button
                variant="secondary"
                size="md"
                className="flex-1"
                onClick={() => handleShare(selectedAchievement)}
              >
                📤 SHARE
              </Button>
              <Button
                variant="primary"
                size="md"
                className="flex-1"
                onClick={() => router.push("/app/map")}
              >
                PLAY
              </Button>
            </div>
          </GlassPanel>
        </div>
      )}

      {/* ── Share Card Modal ─────────────────────────────── */}
      {showShareModal && selectedAchievement && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md"
          onClick={() => setShowShareModal(false)}
        >
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm">
            {/* Shareable Card */}
            <div
              ref={cardRef}
              className="relative overflow-hidden rounded-3xl border border-[rgba(255,255,255,0.1)] p-8"
              style={{
                background: "linear-gradient(135deg, #0A0A14 0%, #1A0A28 50%, #0A0A14 100%)",
                boxShadow: `0 0 60px ${(CATEGORY_COLORS[selectedAchievement.category] || "#CC44FF")}30, 0 0 120px rgba(0,0,0,0.5)`,
              }}
            >
              {/* Decorative glow */}
              <div
                className="pointer-events-none absolute -inset-20 opacity-30"
                style={{
                  background: `radial-gradient(circle at 50% 0%, ${CATEGORY_COLORS[selectedAchievement.category] || "#CC44FF"} 0%, transparent 60%)`,
                }}
              />

              {/* Brand */}
              <div className="relative mb-6 text-center">
                <div
                  className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl"
                  style={{
                    background: `linear-gradient(135deg, ${CATEGORY_COLORS[selectedAchievement.category] || "#CC44FF"}, ${(CATEGORY_COLORS[selectedAchievement.category] || "#CC44FF")}66)`,
                    boxShadow: `0 0 20px ${(CATEGORY_COLORS[selectedAchievement.category] || "#CC44FF")}30`,
                  }}
                >
                  <span className="text-xl font-black text-black">TS</span>
                </div>
                <p className="text-[10px] font-bold tracking-[3px]" style={{ color: CATEGORY_COLORS[selectedAchievement.category] || "#CC44FF" }}>
                  TYPE STRIKE
                </p>
              </div>

              {/* Feat */}
              <div className="relative text-center">
                <span className="text-6xl">{selectedAchievement.icon}</span>
                <h2
                  className="mt-3 text-2xl font-black tracking-[2px]"
                  style={{ color: CATEGORY_COLORS[selectedAchievement.category] || "#CC44FF" }}
                >
                  {selectedAchievement.name}
                </h2>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--text-body)" }}>
                  {selectedAchievement.description}
                </p>
              </div>

              {/* Divider */}
              <div className="relative my-6">
                <div
                  className="h-px w-full"
                  style={{
                    background: `linear-gradient(90deg, transparent, ${(CATEGORY_COLORS[selectedAchievement.category] || "#CC44FF")}44, transparent)`,
                  }}
                />
              </div>

              {/* URL */}
              <div className="relative text-center">
                <p className="text-[10px] font-bold tracking-[2px]" style={{ color: "var(--text-muted)" }}>
                  typestrike.app
                </p>
                <p className="mt-1 text-[8px] tracking-[1px]" style={{ color: "var(--text-muted)" }}>
                  Type with fury. Strike with fire.
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="mt-4 flex gap-2">
              <Button
                variant="secondary"
                size="lg"
                className="flex-1"
                onClick={() => {
                  setShowShareModal(false);
                  setSelectedAchievement(null);
                }}
              >
                CLOSE
              </Button>
              <Button
                variant="primary"
                size="lg"
                className="flex-1"
                onClick={handleTakeScreenshot}
              >
                📤 SHARE
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
