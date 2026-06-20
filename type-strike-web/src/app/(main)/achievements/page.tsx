"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import TopBar from "@/components/layout/TopBar";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import GlassPanel from "@/components/ui/GlassPanel";

// ── Feat Definitions ─────────────────────────────────────

interface Feat {
  id: string;
  title: string;
  description: string;
  condition: string;
  icon: string;
  tier: "bronze" | "silver" | "gold" | "platinum";
  check: () => boolean | number; // boolean = unlocked, number = progress 0-1
  progress?: () => { current: number; target: number };
}

const FEATS: Feat[] = [
  // Speed feats
  {
    id: "speed_50",
    title: "Speed Demon",
    description: "Hit 50 WPM in any mode",
    condition: "Reach 50 WPM in a single test",
    icon: "⚡",
    tier: "bronze",
    check: () => false, // Stub — will be replaced with real check
  },
  {
    id: "speed_80",
    title: "Blazing Fast",
    description: "Hit 80 WPM in timed mode",
    condition: "Reach 80 WPM in 1/3/5 min mode",
    icon: "🔥",
    tier: "silver",
    check: () => false,
  },
  {
    id: "speed_120",
    title: "Supersonic",
    description: "Hit 120 WPM in any mode",
    condition: "Cross 120 WPM threshold",
    icon: "💨",
    tier: "gold",
    check: () => false,
  },
  {
    id: "speed_150",
    title: "Inhuman",
    description: "Surpass 150 WPM",
    condition: "Type at 150+ WPM in timed mode",
    icon: "👾",
    tier: "platinum",
    check: () => false,
  },

  // Accuracy feats
  {
    id: "acc_95",
    title: "Precision Strike",
    description: "Complete a test with 95%+ accuracy",
    condition: "Maintain 95%+ accuracy through a full test",
    icon: "🎯",
    tier: "bronze",
    check: () => false,
  },
  {
    id: "acc_99",
    title: "Flawless Form",
    description: "Finish with 99%+ accuracy",
    condition: "Type at 99%+ accuracy",
    icon: "💎",
    tier: "gold",
    check: () => false,
  },
  {
    id: "acc_perfect",
    title: "Perfect Run",
    description: "Complete a level with zero errors",
    condition: "0 errors • 100% accuracy • 3 stars",
    icon: "🏆",
    tier: "platinum",
    check: () => false,
  },

  // Combo feats
  {
    id: "combo_10",
    title: "On Fire",
    description: "Reach a 10-key combo streak",
    condition: "Type 10 consecutive correct keystrokes",
    icon: "💥",
    tier: "bronze",
    check: () => false,
  },
  {
    id: "combo_30",
    title: "Unstoppable",
    description: "Maintain a 30-key combo streak",
    condition: "30 correct keystrokes in a row",
    icon: "🚀",
    tier: "silver",
    check: () => false,
  },
  {
    id: "combo_50",
    title: "Machine Gun",
    description: "Hit a 50+ combo streak",
    condition: "50+ consecutive correct keystrokes",
    icon: "🤖",
    tier: "gold",
    check: () => false,
  },

  // Level progression feats
  {
    id: "level_10",
    title: "Apprentice",
    description: "Clear 10 levels",
    condition: "Pass 10 levels with at least 1 star",
    icon: "📖",
    tier: "bronze",
    check: () => false,
  },
  {
    id: "level_50",
    title: "Veteran",
    description: "Complete 50 levels",
    condition: "Pass 50 levels",
    icon: "⚔️",
    tier: "silver",
    check: () => false,
  },
  {
    id: "level_all",
    title: "Legend",
    description: "Clear all 100 levels",
    condition: "Beat every level in the game",
    icon: "👑",
    tier: "platinum",
    check: () => false,
  },
  {
    id: "star_collector",
    title: "Star Collector",
    description: "Earn 50 total stars across levels",
    condition: "Collect 50 stars from levels",
    icon: "⭐",
    tier: "silver",
    check: () => false,
  },

  // Timed mode feats
  {
    id: "timed_1min",
    title: "Sprinter",
    description: "Complete a 1-minute sprint",
    condition: "Finish a 1-minute timed run",
    icon: "⏱️",
    tier: "bronze",
    check: () => false,
  },
  {
    id: "timed_5min",
    title: "Marathon Runner",
    description: "Survive the 5-minute mode",
    condition: "Complete a full 5-minute typing test",
    icon: "🏃",
    tier: "silver",
    check: () => false,
  },
  {
    id: "contest_entry",
    title: "Contender",
    description: "Enter the daily contest",
    condition: "Submit an entry in the daily contest",
    icon: "🏅",
    tier: "bronze",
    check: () => false,
  },

  // Streak feats
  {
    id: "streak_7",
    title: "Weekly Warrior",
    description: "Maintain a 7-day streak",
    condition: "Type every day for 7 days",
    icon: "📅",
    tier: "silver",
    check: () => false,
  },
  {
    id: "streak_30",
    title: "Monthly Legend",
    description: "Stay active for 30 days straight",
    condition: "30-day streak",
    icon: "🗓️",
    tier: "gold",
    check: () => false,
  },
];

// ── Tier config ──────────────────────────────────────────

const TIER_COLORS: Record<string, string> = {
  bronze: "#CD7F32",
  silver: "#A8B4C0",
  gold: "#FFCC00",
  platinum: "#00E5FF",
};

const TIER_GLOW: Record<string, string> = {
  bronze: "rgba(205,127,50,0.3)",
  silver: "rgba(168,180,192,0.3)",
  gold: "rgba(255,204,0,0.4)",
  platinum: "rgba(0,229,255,0.4)",
};

// ── Component ────────────────────────────────────────────

export default function FeatsPage() {
  const router = useRouter();
  const [selectedFeat, setSelectedFeat] = useState<Feat | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleShare = useCallback((feat: Feat) => {
    setSelectedFeat(feat);
    setShowShareModal(true);
  }, []);

  const handleTakeScreenshot = useCallback(async () => {
    if (!cardRef.current || !selectedFeat) return;

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

      // Build share text
      const shareText = `🏆 I achieved "${selectedFeat.title}" on Type Strike!\n${selectedFeat.description}\n\nType with fury. Strike with fire. 🔥\nhttps://typestrike.app`;

      // Try native share with image
      if (navigator.share) {
        try {
          const blob = await (await fetch(dataUrl)).blob();
          const file = new File([blob], `typestrike-${selectedFeat.id}.png`, { type: "image/png" });
          await navigator.share({
            title: `Type Strike — ${selectedFeat.title}`,
            text: shareText,
            files: [file],
          });
          setShowShareModal(false);
          return;
        } catch {
          // Native share with files not supported or cancelled
        }
      }

      // Download the image
      const link = document.createElement("a");
      link.download = `typestrike-${selectedFeat.id}.png`;
      link.href = dataUrl;
      link.click();
      link.remove();
      setShowShareModal(false);
    } catch {
      // image generation failed — fallback to text share
      const shareText = `🏆 I achieved "${selectedFeat.title}" on Type Strike!\n${selectedFeat.description}\n\nType with fury. Strike with fire. 🔥\nhttps://typestrike.app`;

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
  }, [selectedFeat]);

  return (
    <div className="flex flex-1 flex-col">
      <TopBar showBack title="FEATS" />

      <div className="flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-6">
        <div className="mx-auto w-full max-w-4xl">
          {/* Feat grid by tier */}
          {(["bronze", "silver", "gold", "platinum"] as const).map((tier) => {
            const tierFeats = FEATS.filter((f) => f.tier === tier);
            const unlocked = tierFeats.filter((f) => f.check());
            return (
              <div key={tier} className="mb-8">
                {/* Tier header */}
                <div className="mb-3 flex items-center gap-3">
                  <div
                    className="h-4 w-1 rounded-full"
                    style={{ backgroundColor: TIER_COLORS[tier] }}
                  />
                  <span
                    className="text-sm font-bold tracking-[3px] uppercase"
                    style={{ color: TIER_COLORS[tier] }}
                  >
                    {tier}
                  </span>
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {unlocked.length}/{tierFeats.length}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                  {tierFeats.map((feat) => {
                    const isUnlocked = feat.check();
                    return (
                      <Card
                        key={feat.id}
                        hoverable
                        className={`p-4 transition-all duration-200 ${
                          isUnlocked ? "" : "opacity-60"
                        }`}
                        onClick={() => setSelectedFeat(feat)}
                        style={
                          isUnlocked
                            ? {
                                borderColor: `${TIER_COLORS[tier]}40`,
                                boxShadow: `0 0 15px ${TIER_GLOW[tier]}`,
                              }
                            : {}
                        }
                      >
                        <div className="text-center">
                          <span className="text-3xl">{feat.icon}</span>
                          <p
                            className="mt-1 text-[11px] font-bold tracking-[0.5px]"
                            style={{
                              color: isUnlocked ? TIER_COLORS[tier] : "var(--text-muted)",
                            }}
                          >
                            {feat.title}
                          </p>
                          <p
                            className="mt-0.5 text-[8px] leading-tight"
                            style={{ color: "var(--text-muted)" }}
                          >
                            {feat.description}
                          </p>

                          {/* Lock indicator */}
                          {!isUnlocked && (
                            <div className="mt-2">
                              <span className="text-[10px] font-bold tracking-[1px]" style={{ color: "var(--text-disabled)" }}>
                                {feat.condition}
                              </span>
                            </div>
                          )}
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Feat Detail Modal ────────────────────────────── */}
      {selectedFeat && !showShareModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setSelectedFeat(null)}
        >
          <GlassPanel
            glow="magma"
            blur="lg"
            depth={3}
            className="w-full max-w-sm p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedFeat(null)}
              className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-lg text-sm transition-colors hover:bg-white/5"
              style={{ color: "var(--text-muted)" }}
            >
              ✕
            </button>

            <div className="text-center">
              <span className="text-5xl">{selectedFeat.icon}</span>
              <h2
                className="mt-3 text-lg font-black tracking-[2px]"
                style={{ color: TIER_COLORS[selectedFeat.tier] }}
              >
                {selectedFeat.title}
              </h2>
              <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
                {selectedFeat.description}
              </p>

              {/* Condition */}
              <div className="mt-4 rounded-xl bg-black/20 p-3">
                <p className="text-[9px] font-bold tracking-[1.5px]" style={{ color: "var(--text-muted)" }}>
                  HOW TO UNLOCK
                </p>
                <p className="mt-1 text-xs font-bold" style={{ color: "var(--text-body)" }}>
                  {selectedFeat.condition}
                </p>
              </div>

              {/* [Stub] Progress bar */}
              <div className="mt-3">
                <div
                  className="h-1.5 w-full overflow-hidden rounded-full"
                  style={{ background: "rgba(255,255,255,0.08)" }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${(selectedFeat.check() ? 100 : 0)}%`,
                      background: `linear-gradient(90deg, ${TIER_COLORS[selectedFeat.tier]}, ${TIER_COLORS[selectedFeat.tier]}88)`,
                    }}
                  />
                </div>
                <p className="mt-1 text-[9px]" style={{ color: "var(--text-muted)" }}>
                  {selectedFeat.check() ? "UNLOCKED 🎉" : "0%"}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-5 flex gap-2">
              <Button
                variant="secondary"
                size="md"
                className="flex-1"
                onClick={() => handleShare(selectedFeat)}
              >
                📤 SHARE
              </Button>
              <Button
                variant="primary"
                size="md"
                className="flex-1"
                onClick={() => router.push("/map")}
              >
                PLAY
              </Button>
            </div>
          </GlassPanel>
        </div>
      )}

      {/* ── Share Card Modal ─────────────────────────────── */}
      {showShareModal && selectedFeat && (
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
                boxShadow: `0 0 60px ${TIER_GLOW[selectedFeat.tier]}, 0 0 120px rgba(0,0,0,0.5)`,
              }}
            >
              {/* Decorative glow */}
              <div
                className="pointer-events-none absolute -inset-20 opacity-30"
                style={{
                  background: `radial-gradient(circle at 50% 0%, ${TIER_COLORS[selectedFeat.tier]} 0%, transparent 60%)`,
                }}
              />

              {/* Brand */}
              <div className="relative mb-6 text-center">
                <div
                  className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl"
                  style={{
                    background: `linear-gradient(135deg, ${TIER_COLORS[selectedFeat.tier]}, ${TIER_COLORS[selectedFeat.tier]}66)`,
                    boxShadow: `0 0 20px ${TIER_GLOW[selectedFeat.tier]}`,
                  }}
                >
                  <span className="text-xl font-black text-black">TS</span>
                </div>
                <p className="text-[10px] font-bold tracking-[3px]" style={{ color: TIER_COLORS[selectedFeat.tier] }}>
                  TYPE STRIKE
                </p>
              </div>

              {/* Feat */}
              <div className="relative text-center">
                <span className="text-6xl">{selectedFeat.icon}</span>
                <h2
                  className="mt-3 text-2xl font-black tracking-[2px]"
                  style={{ color: TIER_COLORS[selectedFeat.tier] }}
                >
                  {selectedFeat.title}
                </h2>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--text-body)" }}>
                  {selectedFeat.description}
                </p>
              </div>

              {/* Divider */}
              <div className="relative my-6">
                <div
                  className="h-px w-full"
                  style={{
                    background: `linear-gradient(90deg, transparent, ${TIER_COLORS[selectedFeat.tier]}44, transparent)`,
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
                  setSelectedFeat(null);
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
