"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { usePlayer } from "@/hooks/usePlayer";
import { useProgression } from "@/hooks/useProgression";
import { DEFAULT_PLAYER_ID } from "@/lib/constants";
import {
  ParticleBackground,
  StrikeDashboard,
  StreakEngagement,
  ZoneGrid,
  LevelDetailModal,
} from "@/components/strike";
import type { LevelDetail } from "@/lib/types";

export default function MapPage() {
  const router = useRouter();
  const { player, playerId } = usePlayer();
  const pid = playerId ?? DEFAULT_PLAYER_ID;
  const { progression } = useProgression(playerId);
  const [levels, setLevels] = useState<LevelDetail[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<LevelDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [lockedPreviewLevel, setLockedPreviewLevel] = useState<LevelDetail | null>(null);

  // ── Fetch levels ─────────────────────────────────────

  const processLevelData = useCallback((data: LevelDetail[]) => {
    setLevels(data);
  }, []);

  useEffect(() => {
    async function fetchLevels() {
      try {
        const data = await api.getAllLevels(pid);
        processLevelData(data);
      } catch {
        // Fallback
      } finally {
        setLoading(false);
      }
    }
    fetchLevels();

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        api.getAllLevels(pid).then(processLevelData).catch(() => {});
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [pid, processLevelData]);

  // ── Level helpers ────────────────────────────────────

  const levelsMap = useMemo(
    () => new Map(levels.map((l) => [l.id, l])),
    [levels]
  );

  const getLevel = useCallback(
    (levelId: number): LevelDetail | undefined => levelsMap.get(levelId),
    [levelsMap]
  );

  const getLevelStars = useCallback(
    (levelId: number): number => getLevel(levelId)?.player_stars ?? 0,
    [getLevel]
  );

  const getLevelState = useCallback(
    (levelId: number): "completed" | "current" | "locked" => {
      const detail = getLevel(levelId);
      if (!detail) return "locked";
      if ((detail.player_stars ?? 0) > 0) return "completed";

      // Find the first uncompleted level (player_stars === 0) by iterating
      // sorted level IDs. The first one with 0 stars is "current" (next to play).
      // All subsequent levels with 0 stars are "locked".
      const sortedIds = [...levelsMap.keys()].sort((a, b) => a - b);
      const firstIncomplete = sortedIds.find(
        (id) => (getLevel(id)?.player_stars ?? 0) === 0
      );

      if (levelId === firstIncomplete) return "current";
      return "locked";
    },
    [getLevel, levelsMap]
  );

  const isLevelUnlocked = useCallback(
    (levelId: number): boolean => {
      const state = getLevelState(levelId);
      return state === "completed" || state === "current";
    },
    [getLevelState]
  );

  // ── Player stats for dashboard ──────────────────────

  const currentTier = progression?.current_tier;
  const rankName = currentTier?.display_name ?? "RECRUIT";
  const playerLevel = progression?.xp
    ? Math.floor(progression.xp / 500) + 1
    : 3;
  const currentXp = progression?.xp ?? 0;
  const xpToNext = progression?.xp_to_next_tier ?? 500;
  const streakCount = player?.streak_count ?? 0;

  // ── Handlers ─────────────────────────────────────────-

  const handleLevelClick = useCallback((level: LevelDetail) => {
    setSelectedLevel(level);
  }, []);

  const handleLockedClick = useCallback((level: LevelDetail) => {
    // Show the level modal in a locked preview state
    setLockedPreviewLevel(level);
  }, []);

  const handleStartLevel = useCallback(() => {
    if (selectedLevel) {
      router.push(`/play/level?id=${selectedLevel.id}`);
    }
  }, [selectedLevel, router]);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div
          className="h-8 w-8 animate-spin rounded-full border-2 border-transparent"
          style={{
            borderTopColor: "var(--ts-orange, #ff6b1a)",
            borderRightColor: "var(--ts-orange, #ff6b1a)",
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      {/* Particle background */}
      <ParticleBackground />

      <div
        className="main-content"
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: 1100,
          margin: "0 auto",
          padding: "24px 20px 80px",
          width: "100%",
        }}
      >
        {/* Dashboard: Rank + XP + Streak */}
        <StrikeDashboard
          rankName={rankName}
          level={playerLevel}
          currentXp={currentXp}
          xpToNext={xpToNext}
        />

        {/* Streak + Daily Challenge */}
        <StreakEngagement
          streakCount={streakCount}
          dailyChallengeAvailable={true}
        />

        {/* Zone Grid */}
        {levels.length > 0 && (
          <ZoneGrid
            levels={levels}
            onLevelClick={handleLevelClick}
            onLockedClick={handleLockedClick}
            isLevelUnlocked={isLevelUnlocked}
            getLevelState={getLevelState}
            getLevelStars={getLevelStars}
          />
        )}

        {levels.length === 0 && !loading && (
          <div
            style={{
              textAlign: "center",
              padding: "60px 20px",
              color: "var(--ts-text-dim, #9b94b3)",
            }}
          >
            <div style={{ fontSize: 48, marginBottom: 16 }}>🗺️</div>
            <h3
              style={{
                fontFamily: "var(--font-orbitron, 'Orbitron', sans-serif)",
                fontSize: 18,
                fontWeight: 700,
                color: "var(--ts-text, #f5f3ff)",
                marginBottom: 8,
              }}
            >
              No levels loaded
            </h3>
            <p style={{ fontSize: 13 }}>
              Connect to the backend server and refresh to see your strike zones.
            </p>
          </div>
        )}
      </div>

      {/* Level Detail Modal */}
      {selectedLevel && (
        <LevelDetailModal
          level={selectedLevel}
          onClose={() => setSelectedLevel(null)}
          onStart={handleStartLevel}
          zoneColor={
            selectedLevel.id <= 100
              ? "var(--ember, #ff6b2b)"
              : selectedLevel.id <= 200
              ? "var(--igneous, #ef4444)"
              : selectedLevel.id <= 300
              ? "var(--magma, #dc2626)"
              : selectedLevel.id <= 400
              ? "var(--obsidian, #7c3aed)"
              : "var(--beyond, #f59e0b)"
          }
          zoneName={
            selectedLevel.id <= 100
              ? "Ember"
              : selectedLevel.id <= 200
              ? "Igneous"
              : selectedLevel.id <= 300
              ? "Magma Core"
              : selectedLevel.id <= 400
              ? "Obsidian"
              : "Beyond"
          }
        />
      )}

      {/* Locked Level Preview */}
      {lockedPreviewLevel && !selectedLevel && (
        <div
          onClick={() => setLockedPreviewLevel(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.7)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            animation: "fadeIn 0.2s ease",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--ts-bg-3, #13101c)",
              border: "1px solid var(--ts-border, rgba(255,107,26,0.18))",
              borderRadius: 14,
              width: "90%",
              maxWidth: 400,
              textAlign: "center",
              padding: "40px 32px",
              animation: "modalSlide 0.3s ease",
            }}
          >
            <div style={{ fontSize: 56, marginBottom: 16 }}>🔒</div>
            <h3
              style={{
                fontFamily: "var(--font-orbitron, 'Orbitron', sans-serif)",
                fontSize: 18,
                fontWeight: 800,
                letterSpacing: 2,
                color: "var(--ts-text, #f5f3ff)",
                marginBottom: 8,
              }}
            >
              Level {lockedPreviewLevel.id} Locked
            </h3>
            <p style={{ color: "var(--ts-text-dim, #9b94b3)", fontSize: 14, lineHeight: 1.6, marginBottom: 6 }}>
              Complete the previous level first to unlock this one.
            </p>
            <p style={{ color: "var(--ts-text-dim, #9b94b3)", fontSize: 12 }}>
              Keep practicing to progress through the zone.
            </p>
            <button
              onClick={() => setLockedPreviewLevel(null)}
              style={{
                marginTop: 24,
                padding: "12px 28px",
                borderRadius: 8,
                border: "1px solid var(--ts-border, rgba(255,107,26,0.18))",
                background: "var(--ts-bg-4, #1e1e35)",
                color: "var(--ts-text-dim, #9b94b3)",
                fontWeight: 600,
                fontSize: 14,
                fontFamily: "var(--font-orbitron, 'Orbitron', sans-serif)",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--ts-bg-5, #2a2a45)";
                e.currentTarget.style.color = "var(--ts-text, #f5f3ff)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "var(--ts-bg-4, #1e1e35)";
                e.currentTarget.style.color = "var(--ts-text-dim, #9b94b3)";
              }}
            >
              GOT IT
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
