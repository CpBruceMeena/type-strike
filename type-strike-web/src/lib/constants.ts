import type { ComboTier } from "./types";

// ── Player ──────────────────────────────────────────────

export const DEFAULT_PLAYER_ID = 1;

// ── Combo Tiers ─────────────────────────────────────────

export const COMBO_TIERS: ComboTier[] = [
  { minStreak: 0, title: "", color: "#FF5020", effect: "" },
  { minStreak: 5, title: "IGNITING!", color: "#FF6600", effect: "Gauge 25%" },
  { minStreak: 10, title: "BURNING!", color: "#FF5020", effect: "Gauge 50%" },
  { minStreak: 15, title: "CRITICAL COMBO!", color: "#CC44FF", effect: "Gauge 75%" },
  { minStreak: 20, title: "MAX FRENZY!", color: "#FF00AA", effect: "Gauge 100% • 1.2x WPM" },
  { minStreak: 30, title: "IGNITION SPEED!", color: "#FFFFFF", effect: "OVERDRIVE • 2x XP" },
];

// ── Tier Config ─────────────────────────────────────────

export interface TierConfig {
  key: string;
  label: string;
  startLevel: number;
  endLevel: number;
  color: string;
}

export const TIERS: TierConfig[] = [
  { key: "ember", label: "EMBER", startLevel: 1, endLevel: 25, color: "#FF5020" },
  { key: "igneious", label: "IGNEOUS", startLevel: 26, endLevel: 50, color: "#FF6600" },
  { key: "magma_core", label: "MAGMA CORE", startLevel: 51, endLevel: 75, color: "#CC44FF" },
  { key: "obsidian", label: "OBSIDIAN", startLevel: 76, endLevel: 100, color: "#CCCCCC" },
  { key: "beyond", label: "BEYOND", startLevel: 101, endLevel: Infinity, color: "#FFCC00" },
];

// ── Game Mode Config ────────────────────────────────────

export interface GameModeConfig {
  key: string;
  label: string;
  description: string;
  icon: string;
  durationSeconds: number | null;
}

export const GAME_MODES: GameModeConfig[] = [
  { key: "level", label: "LEVELS", description: "100 levels of fire", icon: "🗺️", durationSeconds: null },
  { key: "contest", label: "CONTEST", description: "Daily competition", icon: "🏆", durationSeconds: null },
  { key: "timed_1min", label: "1 MIN", description: "1-minute sprint", icon: "⏱️", durationSeconds: 60 },
  { key: "timed_3min", label: "3 MIN", description: "3-minute endurance", icon: "⏳", durationSeconds: 180 },
  { key: "timed_5min", label: "5 MIN", description: "5-minute marathon", icon: "🔥", durationSeconds: 300 },
];

// ── Level Config ────────────────────────────────────────

export const LEVEL_TOTAL_COUNT = 100;

// ── Stall Detection ─────────────────────────────────────

export const STALL_TIMEOUT_MS = 3000;

// ── XP Configuration ────────────────────────────────────

export const XP_TABLE: Record<number, number> = {
  1: 150, 2: 200, 3: 250, 4: 300, 5: 350, 6: 400, 7: 450,
  8: 500, 9: 550, 10: 600, 11: 650, 12: 700, 13: 750,
  14: 800, 15: 850, 16: 900, 17: 950, 18: 1000, 19: 1050,
  20: 1100,
};

export function xpForNextLevel(level: number): number {
  return XP_TABLE[level] ?? 1100 + (level - 20) * 50;
}

export function xpProgress(currentXp: number, level: number): number {
  const needed = xpForNextLevel(level);
  return Math.min(currentXp / needed, 1);
}
