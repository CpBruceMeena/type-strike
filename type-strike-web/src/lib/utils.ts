import { COMBO_TIERS } from "./constants";
import type { LevelDetail } from "./types";

// ── WPM Calculation ─────────────────────────────────────

export function computeWpm(
  correctKeystrokes: number,
  elapsedMs: number
): number {
  if (elapsedMs < 1000) return 0;
  const minutes = elapsedMs / 60000;
  const wordsTyped = Math.floor(correctKeystrokes / 5);
  return minutes > 0 ? Math.round(wordsTyped / minutes) : 0;
}

// ── Accuracy Calculation ────────────────────────────────

export function computeAccuracy(
  correctKeystrokes: number,
  totalKeystrokes: number
): number {
  if (totalKeystrokes <= 0) return 1;
  return correctKeystrokes / totalKeystrokes;
}

// ── Combo ───────────────────────────────────────────────

export function computeGauge(combo: number): number {
  return Math.min(combo / 30, 1);
}

export function getActiveTierIndex(combo: number): number {
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
  const passWpm = detail.pass_wpm;
  const passAcc = detail.pass_accuracy / 100;

  if (wpm < passWpm || accuracy < passAcc) return 0;

  const meets2Star = wpm >= Math.round(passWpm * 1.15) && accuracy >= 0.95;
  const meets3Star = wpm >= Math.round(passWpm * 1.3) && accuracy >= 0.98 && errorCount === 0;

  if (meets3Star) return 3;
  if (meets2Star) return 2;
  return 1;
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
