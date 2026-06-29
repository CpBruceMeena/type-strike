"use client";

import { useMemo } from "react";
import { IconLock, IconGift } from "@tabler/icons-react";
import LevelNode from "./LevelNode";
import ZoneLockedOverlay from "./ZoneLockedOverlay";
import type { LevelDetail } from "@/lib/types";
import { TIERS } from "@/lib/constants";

interface ZoneGridProps {
  levels: LevelDetail[];
  onLevelClick: (level: LevelDetail) => void;
  onLockedClick?: (level: LevelDetail) => void;
  /** Which levels are considered "unlocked" (can be clicked) */
  isLevelUnlocked: (levelId: number) => boolean;
  /** Get current node state */
  getLevelState: (levelId: number) => "completed" | "current" | "locked";
  /** Get star count for a level */
  getLevelStars: (levelId: number) => number;
}

const ZONE_NAMES = ["EMBER", "IGNEOUS", "MAGMA CORE", "OBSIDIAN", "BEYOND"];

const ZONE_COLORS = [
  "var(--ember, #ff6b2b)",
  "var(--igneous, #ef4444)",
  "var(--magma, #dc2626)",
  "var(--obsidian, #7c3aed)",
  "var(--beyond, #f59e0b)",
];

const ZONE_REWARDS: Record<string, { icon: string; name: string }> = {
  EMBER: { icon: "👑", name: "Ember's Scorch Mark" },
  IGNEOUS: { icon: "🛡️", name: "Igneous Core Fragment" },
  "MAGMA CORE": { icon: "🌋", name: "Magma's Heart Ember" },
  OBSIDIAN: { icon: "🔮", name: "Obsidian Shard Talisman" },
  BEYOND: { icon: "⭐", name: "Celestial Flame Crest" },
};

const ZONE_PREVIEW_REWARDS: Record<string, { icon: string; name: string }[]> = {
  IGNEOUS: [
    { icon: "🏅", name: "Ember Tier Badge" },
    { icon: "⌨️", name: "Magma Theme" },
    { icon: "⭐", name: "+500 Bonus XP" },
  ],
  "MAGMA CORE": [
    { icon: "🏅", name: "Igneous Tier Badge" },
    { icon: "🔥", name: "Fire Trail Effect" },
    { icon: "⭐", name: "+1000 Bonus XP" },
  ],
  OBSIDIAN: [
    { icon: "🏅", name: "Magma Tier Badge" },
    { icon: "✨", name: "Purple Rain Effect" },
    { icon: "⭐", name: "+2000 Bonus XP" },
  ],
  BEYOND: [
    { icon: "🏅", name: "Obsidian Tier Badge" },
    { icon: "👑", name: "Golden Typing Effect" },
    { icon: "⭐", name: "+5000 Bonus XP" },
  ],
};

// Pre-compute zone metadata for all tiers
function buildZoneData(levels: LevelDetail[]) {
  const firstIncompleteZoneIndex = (() => {
    for (let zi = 0; zi < TIERS.length; zi++) {
      const tier = TIERS[zi];
      const tierLevels = levels.filter(
        (l) => l.id >= tier.startLevel && l.id <= tier.endLevel
      );
      const allCompleted = tierLevels.every(
        (l) => (l.player_stars ?? 0) > 0
      );
      if (!allCompleted || tierLevels.length === 0) return zi;
    }
    return TIERS.length - 1;
  })();

  return TIERS.map((tier, zoneIndex) => {
    const zoneName = ZONE_NAMES[zoneIndex] || tier.label;
    const zoneColor = ZONE_COLORS[zoneIndex] || "var(--ts-orange, #ff6b1a)";
    const zoneUnlocked = zoneIndex <= firstIncompleteZoneIndex;
    const zoneCompleted = zoneIndex < firstIncompleteZoneIndex;

    const zoneLevels = levels.filter(
      (l) => l.id >= tier.startLevel && l.id <= tier.endLevel
    );

    const clearedCount = zoneLevels.filter(
      (l) => (l.player_stars ?? 0) > 0
    ).length;
    const totalInZone = tier.endLevel - tier.startLevel + 1;
    const progressPercent =
      totalInZone > 0 ? Math.round((clearedCount / totalInZone) * 100) : 0;
    const trackWidth = Math.min((clearedCount / 15) * 100, 100);

    // Determine visible levels
    let visibleLevels: LevelDetail[];
    let forceLockedIds: number[] = [];
    if (zoneUnlocked) {
      const completed = zoneLevels.filter((l) => (l.player_stars ?? 0) > 0);
      const remaining = zoneLevels.filter((l) => (l.player_stars ?? 0) === 0);
      // Show completed + next uncompleted + a few locked levels beyond for preview
      const showRemaining = remaining.slice(0, 15 - completed.length);
      const showLockedPreview = remaining.slice(showRemaining.length, showRemaining.length + 4);
      visibleLevels = [...completed, ...showRemaining, ...showLockedPreview].slice(0, 19);
      forceLockedIds = showLockedPreview.map(l => l.id);
    } else {
      // Locked zone: show first 8 as preview
      visibleLevels = zoneLevels.slice(0, 8);
    }

    const remainingCount = totalInZone - visibleLevels.length;
    const isDeepLocked = zoneIndex > firstIncompleteZoneIndex + 1;
    const isNextLocked = zoneIndex === firstIncompleteZoneIndex + 1;

    return {
      zoneIndex,
      tier,
      zoneName,
      zoneColor,
      zoneUnlocked,
      zoneCompleted,
      zoneLevels,
      clearedCount,
      totalInZone,
      progressPercent,
      trackWidth,
      visibleLevels,
      remainingCount,
      isDeepLocked,
      isNextLocked,
      hasPreviewRewards: !!ZONE_PREVIEW_REWARDS[zoneName],
      forceLockedIds,
    };
  });
}

export default function ZoneGrid({
  levels,
  onLevelClick,
  onLockedClick,
  isLevelUnlocked,
  getLevelState,
  getLevelStars,
}: ZoneGridProps) {
  const zones = useMemo(() => buildZoneData(levels), [levels]);

  return (
    <div className="zone-grid">
      {zones.map(
        ({
          zoneIndex,
          tier,
          zoneName,
          zoneColor,
          zoneUnlocked,
          zoneCompleted,
          clearedCount,
          totalInZone,
          progressPercent,
          trackWidth,
          visibleLevels,
          remainingCount,
          isDeepLocked,
          isNextLocked,
          forceLockedIds,
        }) => (
          <div
            key={tier.key}
            className={`zone ${zoneUnlocked ? "zone-active" : "zone-locked"}`}
            style={{
              marginBottom: 20,
              position: "relative",
              opacity: isDeepLocked ? 0.35 : 1,
              transition: "opacity 0.4s",
            }}
          >
            {/* Zone Header */}
            <div
              className="zone-header"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                padding: "16px 24px",
                background: "var(--ts-bg-3, #13101c)",
                border: "1px solid var(--ts-border, rgba(255,107,26,0.18))",
                borderRadius: "12px 12px 0 0",
                position: "relative",
                overflow: "hidden",
                transition: "background 0.2s",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: 4,
                  height: "100%",
                  borderRadius: 2,
                  background: zoneColor,
                }}
              />
              <div
                className="zone-title"
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: 8,
                  minWidth: 180,
                }}
              >
                <h2
                  style={{
                    fontFamily: "var(--font-orbitron, 'Orbitron', sans-serif)",
                    fontSize: 16,
                    fontWeight: 800,
                    letterSpacing: 3,
                    color: zoneColor,
                  }}
                >
                  {zoneName}
                </h2>
                <span
                  className="zone-range"
                  style={{ fontSize: 12, color: "var(--ts-text-dim, #9b94b3)" }}
                >
                  ({tier.startLevel}-{tier.endLevel})
                </span>
              </div>
              <div
                className="zone-progress"
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <span
                  className="zone-cleared"
                  style={{
                    fontSize: 12,
                    color: "var(--ts-text-dim, #9b94b3)",
                    minWidth: 65,
                  }}
                >
                  {clearedCount} cleared
                </span>
                <div
                  className="zone-progress-bar"
                  style={{
                    flex: 1,
                    height: 6,
                    background: "var(--ts-bg-5, #2a2a45)",
                    borderRadius: 3,
                    overflow: "hidden",
                  }}
                >
                  <div
                    className="zone-progress-fill"
                    style={{
                      height: "100%",
                      width: `${progressPercent}%`,
                      borderRadius: 3,
                      background: `linear-gradient(90deg, ${zoneColor}, ${zoneColor}88)`,
                      transition: "width 1.5s ease",
                    }}
                  />
                </div>
                <span
                  className="zone-percent"
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "var(--ts-text-dim, #9b94b3)",
                    minWidth: 32,
                    textAlign: "right",
                  }}
                >
                  {progressPercent}%
                </span>
              </div>
              <div
                className="zone-reward"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "6px 14px",
                  background: "var(--ts-bg-1, #0d0a14)",
                  border: "1px solid var(--ts-border, rgba(255,107,26,0.18))",
                  borderRadius: 8,
                }}
              >
                <span
                  className="reward-label"
                  style={{
                    fontSize: 10,
                    color: "var(--ts-text-dim, #9b94b3)",
                    textTransform: "uppercase",
                    letterSpacing: 1,
                  }}
                >
                  Reward
                </span>
                <div
                  className="reward-item"
                  style={{ display: "flex", alignItems: "center", gap: 6 }}
                >
                  <span style={{ fontSize: 20 }}>
                    {ZONE_REWARDS[zoneName]?.icon || "🎁"}
                  </span>
                  <span
                    className="reward-name"
                    style={{ fontSize: 12, fontWeight: 600, color: "var(--ts-text-dim, #9b94b3)" }}
                  >
                    {ZONE_REWARDS[zoneName]?.name || "Mystery Reward"}
                  </span>
                </div>
              </div>
            </div>

            {/* Zone Path (Level Nodes) */}
            <div
              className="zone-path"
              style={{
                background: "var(--ts-bg-2, #0d0d18)",
                border: "1px solid var(--ts-border, rgba(255,107,26,0.18))",
                borderTop: "none",
                borderRadius: "0 0 12px 12px",
                padding: "20px 24px 16px",
                position: "relative",
                overflow: zoneUnlocked ? "visible" : "hidden",
              }}
            >
              <div style={{ position: "relative", marginBottom: 8 }}>
                {/* Track line */}
                <div
                  className="path-track"
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: 24,
                    right: 60,
                    height: 3,
                    background: "var(--ts-bg-5, #2a2a45)",
                    borderRadius: 2,
                    transform: "translateY(-50%)",
                  }}
                >
                  <div
                    className="path-track-fill"
                    style={{
                      height: "100%",
                      width: `${trackWidth}%`,
                      borderRadius: 2,
                      background: `linear-gradient(90deg, ${zoneColor}, ${zoneColor}88)`,
                      transition: "width 1s ease",
                    }}
                  />
                </div>

                {/* Level nodes */}
                <div
                  className="path-nodes"
                  style={{
                    display: "flex",
                    gap: 12,
                    overflowX: "auto",
                    padding: "8px 0 12px",
                    position: "relative",
                    zIndex: 2,
                    scrollBehavior: "smooth",
                  }}
                >
                  {visibleLevels.map((level) => {
                    const isForceLocked = forceLockedIds.includes(level.id);
                    const state = isForceLocked ? "locked" : getLevelState(level.id);
                    const isBoss = level.id % 50 === 0;
                    const isMiniBoss = level.id % 10 === 0 && !isBoss;
                    const stars = getLevelStars(level.id);
                    const unlocked = isLevelUnlocked(level.id) && !isForceLocked;

                    return (
                      <LevelNode
                        key={level.id}
                        levelNum={level.id}
                        state={state}
                        isBoss={isBoss}
                        isMiniBoss={isMiniBoss}
                        stars={stars || undefined}
                        onClick={() => {
                          if (unlocked) {
                            onLevelClick(level);
                          } else if (onLockedClick) {
                            onLockedClick(level);
                          }
                        }}
                        zoneColor={zoneColor}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Remaining levels indicator */}
              {remainingCount > 0 && (
                <div
                  className="path-more"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    padding: 8,
                    color: "var(--ts-text-dim, #9b94b3)",
                    fontSize: 12,
                    cursor: "pointer",
                    transition: "color 0.2s",
                  }}
                >
                  <span>
                    +{remainingCount} more level{remainingCount !== 1 ? "s" : ""}
                  </span>
                </div>
              )}

              {/* Locked overlays */}
              {isNextLocked && (
                <ZoneLockedOverlay
                  zoneName={zoneName}
                  prevZoneName={ZONE_NAMES[zoneIndex - 1]}
                />
              )}
              {isDeepLocked && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 2,
                    background: "rgba(7,7,13,0.8)",
                    backdropFilter: "blur(4px)",
                    WebkitBackdropFilter: "blur(4px)",
                    borderRadius: "0 0 12px 12px",
                    gap: 8,
                  }}
                >
                  <IconLock size={28} color="var(--ts-text-dim, #9b94b3)" />
                  <span
                    style={{
                      fontSize: 13,
                      color: "var(--ts-text-dim, #9b94b3)",
                      fontWeight: 500,
                    }}
                  >
                    Complete previous zone to unlock
                  </span>
                </div>
              )}
            </div>

            {/* Zone footer / Preview rewards for locked zones */}
            {zoneUnlocked ? (
              <div
                className="zone-footer"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 24px",
                  background: "var(--ts-bg-2, #0d0d18)",
                  border: "1px solid var(--ts-border, rgba(255,107,26,0.18))",
                  borderTop: "none",
                  borderRadius: "0 0 12px 12px",
                  marginTop: -1,
                }}
              >
                <span
                  className="zone-footer-text"
                  style={{ fontSize: 12, color: "var(--ts-text-dim, #9b94b3)" }}
                >
                  {zoneCompleted
                    ? "Zone completed! 🎉"
                    : "Complete levels to unlock more rewards"}
                </span>
                <div
                  className="zone-footer-reward"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 12,
                    color: "var(--ts-text-dim, #9b94b3)",
                  }}
                >
                  <IconGift size={12} />
                  Zone completion: {ZONE_REWARDS[zoneName]?.name || "Mystery Reward"}
                </div>
              </div>
            ) : (
              ZONE_PREVIEW_REWARDS[zoneName] && (
                <div
                  className="zone-preview-rewards"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "12px 24px",
                    background: "var(--ts-bg-3, #13101c)",
                    border: "1px solid var(--ts-border, rgba(255,107,26,0.18))",
                    borderTop: "none",
                    borderRadius: "0 0 12px 12px",
                    marginTop: -1,
                  }}
                >
                  <span
                    className="preview-label"
                    style={{
                      fontSize: 11,
                      color: "var(--ts-text-dim, #9b94b3)",
                      textTransform: "uppercase",
                      letterSpacing: 1,
                    }}
                  >
                    Preview Rewards
                  </span>
                  <div
                    className="preview-items"
                    style={{
                      display: "flex",
                      gap: 12,
                      flex: 1,
                      flexWrap: "wrap",
                    }}
                  >
                    {ZONE_PREVIEW_REWARDS[zoneName].map((reward, ri) => (
                      <div
                        key={ri}
                        className="preview-item"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "4px 10px",
                          background: "var(--ts-bg-1, #0d0a14)",
                          border: "1px solid var(--ts-border, rgba(255,107,26,0.18))",
                          borderRadius: 6,
                          fontSize: 11,
                          color: "var(--ts-text-dim, #9b94b3)",
                        }}
                      >
                        <span>{reward.icon}</span>
                        <span>{reward.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            )}
          </div>
        )
      )}

      <style>{`
        .zone-grid { max-width: 100%; }
        .zone { scroll-margin-top: 80px; }
        .zone-header:hover { background: var(--ts-bg-4, #1a1a2e); }
        .path-nodes::-webkit-scrollbar { height: 4px; }
        .path-nodes::-webkit-scrollbar-thumb { background: var(--ts-bg-5, #2a2a45); border-radius: 2px; }
        @media (max-width: 900px) {
          .zone-header { flex-wrap: wrap; gap: 10px; padding: 14px 16px; }
          .zone-progress { width: 100%; order: 3; }
          .zone-reward { order: 4; }
          .zone-path { padding: 16px; }
        }
        @media (max-width: 520px) {
          .zone-header { padding: 12px 14px; }
          .zone-title { min-width: auto; }
          .zone-title h2 { font-size: 14px; }
        }
      `}</style>
    </div>
  );
}
