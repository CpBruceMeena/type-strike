import { COMBO_TIERS } from "./constants";
import { StandardScoring, StandardComboSystem } from "../engine/implementations";
import type { LevelDetail } from "./types";

// Single shared instances to avoid allocation overhead
const scoring = new StandardScoring();
const comboSys = new StandardComboSystem();

// ── WPM Calculation ─────────────────────────────────────
// Delegates to the engine's StandardScoring for a single source of truth.

export function computeWpm(
  correctKeystrokes: number,
  elapsedMs: number
): number {
  return scoring.calculateWpm(correctKeystrokes, elapsedMs);
}

// ── Accuracy Calculation ────────────────────────────────

export function computeAccuracy(
  correctKeystrokes: number,
  totalKeystrokes: number
): number {
  return scoring.calculateAccuracy(correctKeystrokes, totalKeystrokes);
}

// ── Combo ───────────────────────────────────────────────

export function computeGauge(combo: number): number {
  comboSys.addCorrect();
  // Reset because we only want the gauge calculation, not state mutation
  const gauge = Math.min(combo / 30, 1);
  comboSys.reset();
  return gauge;
}

export function getActiveTierIndex(combo: number): number {
  // Quick manual computation without state mutation
  let tierIdx = 0;
  for (let i = COMBO_TIERS.length - 1; i >= 0; i--) {
    if (combo >= COMBO_TIERS[i].minStreak) {
      tierIdx = i;
      break;
    }
  }
  return tierIdx;
}

// ── Stars ───────────────────────────────────────────────

export function computeStars(
  wpm: number,
  accuracy: number,
  detail: LevelDetail,
  errorCount: number
): number {
  return scoring.calculateStars(wpm, accuracy, {
    passWpm: detail.pass_wpm,
    passAccuracy: detail.pass_accuracy / 100,
  }, errorCount);
}

// ── Formatting ──────────────────────────────────────────

export function formatElapsed(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, "0")}`;
}

export function formatCountdown(seconds: number): string {
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return `${min}:${sec.toString().padStart(2, "0")}`;
}

// ── XP Calculation (simple) ─────────────────────────────

export function computeXpEarned(
  wpm: number,
  accuracy: number,
  starCount: number | null
): number {
  const base = Math.max(10, Math.floor(wpm * 0.5));
  const accBonus = Math.floor(accuracy * 100 - 80) * 2;
  const starBonus = starCount ? starCount * 15 : 0;
  return base + Math.max(0, accBonus) + starBonus;
}
