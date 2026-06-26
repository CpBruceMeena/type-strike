"use client";

import { useEffect, useState } from "react";
import ConfettiAnimation from "@/components/effects/ConfettiAnimation";
import GlassPanel from "@/components/ui/GlassPanel";
import { api } from "@/lib/api";
import type { AllTiersDetailResponse, Title, ThemeUnlock } from "@/lib/types";

interface TierUpgradeCelebrationProps {
  /** Whether to show the celebration modal */
  show: boolean;
  /** New tier display name (e.g. "Gold") */
  tierName: string;
  /** New tier icon (emoji) */
  tierIcon: string;
  /** New tier color (hex) */
  tierColor: string;
  /** Array of new unlock identifiers (title names + theme keys) */
  newUnlocks: string[];
  /** Called when the user dismisses the modal */
  onDismiss: () => void;
}

export default function TierUpgradeCelebration({
  show,
  tierName,
  tierIcon,
  tierColor,
  newUnlocks,
  onDismiss,
}: TierUpgradeCelebrationProps) {
  const [visible, setVisible] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);
  const [tierDetails, setTierDetails] = useState<AllTiersDetailResponse | null>(null);

  // Fetch tier details on mount to resolve names → display info
  useEffect(() => {
    if (!show) return;
    api.getTierDetails().then(setTierDetails).catch(() => {});
  }, [show]);

  // Entrance animation sequence
  useEffect(() => {
    if (!show) {
      setVisible(false);
      setAnimateIn(false);
      return;
    }
    setVisible(true);
    const t = setTimeout(() => setAnimateIn(true), 50);
    return () => clearTimeout(t);
  }, [show]);

  // Categorize new_unlocks into titles and themes using resolved details
  const resolved: { titles: Title[]; themes: ThemeUnlock[] } = { titles: [], themes: [] };
  if (tierDetails && newUnlocks.length > 0) {
    const allTitles = tierDetails.tiers.flatMap((t) => t.titles);
    const allThemes = tierDetails.tiers.flatMap((t) => t.themes);
    for (const key of newUnlocks) {
      const title = allTitles.find((t) => t.name === key);
      if (title) {
        resolved.titles.push(title);
        continue;
      }
      const theme = allThemes.find((t) => t.theme_key === key);
      if (theme) resolved.themes.push(theme);
    }
  }

  // Fallback if details haven't loaded yet
  const displayTitles = resolved.titles.length > 0 ? resolved.titles : null;
  const displayThemes = resolved.themes.length > 0 ? resolved.themes : null;
  const showGeneric = newUnlocks.length > 0 && !displayTitles && !displayThemes;

  if (!show || !visible) return null;

  const confettiColors = [
    tierColor,
    "#FFCC00",
    "#CC44FF",
    "#00E5FF",
    "#22FF44",
    "#FF44CC",
    ...(newUnlocks.length > 0 ? ["#FF6600", "#00FFCC"] : []),
  ];

  return (
    <>
      {/* Confetti */}
      <ConfettiAnimation
        active={animateIn}
        duration={4000}
        count={100}
        colors={confettiColors}
      />

      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 flex items-center justify-center p-4"
        style={{
          background: "rgba(0,0,0,0.8)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        }}
      >
        {/* Close on backdrop click */}
        <div className="absolute inset-0" onClick={onDismiss} />

        {/* Modal */}
        <div
          className={`relative z-10 w-full max-w-sm transition-all duration-700 ${
            animateIn
              ? "translate-y-0 scale-100 opacity-100"
              : "translate-y-12 scale-90 opacity-0"
          }`}
        >
          <GlassPanel glow="purple" blur="lg" depth={3} className="overflow-visible p-0">
            {/* Tier icon — floats above the panel */}
            <div className="flex justify-center" style={{ marginTop: "-2.5rem" }}>
              <div
                className="flex h-20 w-20 items-center justify-center rounded-full text-4xl"
                style={{
                  background: `radial-gradient(circle at 35% 35%, ${tierColor}50, ${tierColor}20)`,
                  boxShadow: `0 0 40px ${tierColor}40, 0 0 80px ${tierColor}20, inset 0 -4px 8px rgba(0,0,0,0.3)`,
                  border: `2px solid ${tierColor}60`,
                }}
              >
                {tierIcon}
              </div>
            </div>

            <div className="px-6 pb-2 pt-4 text-center">
              {/* TIER UPGRADE label */}
              <p
                className="mb-1 text-[10px] font-bold tracking-[4px]"
                style={{ color: "var(--text-muted)" }}
              >
                TIER UPGRADE
              </p>

              {/* Tier name */}
              <h2
                className="text-3xl font-black tracking-[4px]"
                style={{
                  color: tierColor,
                  textShadow: `0 0 30px ${tierColor}60`,
                }}
              >
                {tierName.toUpperCase()}
              </h2>
            </div>

            {/* New Unlocks Section */}
            {newUnlocks.length > 0 && (
              <div className="px-6 pb-4 pt-3">
                <div className="mb-3 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                {/* Resolved Titles */}
                {displayTitles && displayTitles.length > 0 && (
                  <div className="mb-3">
                    <p
                      className="mb-2 text-[9px] font-bold tracking-[2px]"
                      style={{ color: "var(--text-muted)" }}
                    >
                      TITLES UNLOCKED
                    </p>
                    <div className="space-y-1.5">
                      {displayTitles.map((title) => (
                        <div
                          key={title.name}
                          className="flex items-center gap-2.5 rounded-lg bg-white/5 px-3 py-2"
                        >
                          <span className="text-lg">{title.icon}</span>
                          <div className="flex-1 text-left">
                            <p
                              className="text-xs font-bold tracking-[1px]"
                              style={{ color: "var(--text-white)" }}
                            >
                              {title.display_name}
                            </p>
                            <p
                              className="text-[9px] leading-tight"
                              style={{ color: "var(--text-muted)" }}
                            >
                              {title.description}
                            </p>
                          </div>
                          <span className="text-xs" style={{ color: tierColor }}>
                            ✓
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Resolved Themes */}
                {displayThemes && displayThemes.length > 0 && (
                  <div>
                    <p
                      className="mb-2 text-[9px] font-bold tracking-[2px]"
                      style={{ color: "var(--text-muted)" }}
                    >
                      THEMES UNLOCKED
                    </p>
                    <div className="space-y-1.5">
                      {displayThemes.map((theme) => (
                        <div
                          key={theme.theme_key}
                          className="flex items-center gap-2.5 rounded-lg bg-white/5 px-3 py-2"
                        >
                          <div
                            className="flex h-8 w-8 items-center justify-center rounded-full text-sm"
                            style={{
                              background: `${theme.preview_color}30`,
                              boxShadow: `0 0 8px ${theme.preview_color}40`,
                            }}
                          >
                            {theme.icon}
                          </div>
                          <div className="flex-1 text-left">
                            <p
                              className="text-xs font-bold tracking-[1px]"
                              style={{ color: "var(--text-white)" }}
                            >
                              {theme.display_name}
                            </p>
                            <p
                              className="text-[9px] leading-tight"
                              style={{ color: "var(--text-muted)" }}
                            >
                              {theme.description}
                            </p>
                          </div>
                          {/* Preview color dot */}
                          <div
                            className="h-3 w-3 rounded-full"
                            style={{
                              background: theme.preview_color,
                              boxShadow: `0 0 6px ${theme.preview_color}`,
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Fallback: raw names if details haven't loaded */}
                {showGeneric && (
                  <div>
                    <p
                      className="mb-2 text-[9px] font-bold tracking-[2px]"
                      style={{ color: "var(--text-muted)" }}
                    >
                      NEW UNLOCKS
                    </p>
                    <div className="space-y-1">
                      {newUnlocks.map((key) => (
                        <div
                          key={key}
                          className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-1.5"
                        >
                          <span className="text-xs" style={{ color: tierColor }}>
                            ✦
                          </span>
                          <span
                            className="text-xs font-bold tracking-[1px]"
                            style={{ color: "var(--text-label)" }}
                          >
                            {key.replace(/_/g, " ")}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Divider */}
            <div className="mx-6 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

            {/* CTA */}
            <div className="px-6 pb-6 pt-4">
              <button
                onClick={onDismiss}
                className="w-full rounded-xl py-3 text-sm font-extrabold tracking-[2px] transition-all hover:brightness-110 active:scale-[0.97]"
                style={{
                  background: `linear-gradient(135deg, ${tierColor}, ${tierColor}CC)`,
                  color: "#000000",
                  boxShadow: `0 0 24px ${tierColor}50`,
                }}
              >
                CONTINUE
              </button>
            </div>
          </GlassPanel>
        </div>
      </div>
    </>
  );
}
