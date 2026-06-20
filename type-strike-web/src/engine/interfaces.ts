/**
 * Type Strike — Engine Interfaces
 *
 * SOLID Principle: Interface Segregation
 * Each interface defines a single responsibility within the typing pipeline.
 */

import type { GameMode } from "@/lib/types";

// ── Text Provider ──────────────────────────────────────

export interface TextBundle {
  content: string;
  source: "level" | "contest" | "practice" | "enterprise";
  metadata: Record<string, unknown>;
}

export interface ITextProvider {
  getText(): Promise<TextBundle>;
  getMetadata(): Record<string, unknown>;
}

// ── Input Source ───────────────────────────────────────

export type KeyEvent = {
  char: string;
  timestamp: number;
  isCorrect: boolean;
};

export interface IInputSource {
  onKeyDown(callback: (char: string) => void): void;
  onBackspace(callback: () => void): void;
  onKeyUp(callback: () => void): void;
  destroy(): void;
  isActive(): boolean;
}

// ── Timer Strategy ─────────────────────────────────────

export interface ITimerStrategy {
  getElapsedMs(): number;
  getRemainingMs(): number | null; // null = no limit (level mode)
  start(): void;
  pause(): void;
  resume(): void;
  reset(): void;
  isExpired(): boolean;
  onTick(callback: (elapsed: number) => void): void;
  onExpire(callback: () => void): void;
}

// ── Scoring Strategy ──────────────────────────────────

export interface LevelThreshold {
  passWpm: number;
  passAccuracy: number;
}

export interface IScoringStrategy {
  calculateWpm(correctChars: number, elapsedMs: number): number;
  calculateRawWpm(totalChars: number, elapsedMs: number): number;
  calculateNetWpm(correctChars: number, errors: number, elapsedMs: number): number;
  calculateAccuracy(correctKeystrokes: number, totalKeystrokes: number): number;
  calculateStars(wpm: number, accuracy: number, threshold: LevelThreshold, errorCount: number): number;
  calculateConsistency(wpmSamples: number[]): number;
}

// ── Combo System ───────────────────────────────────────

export interface IComboSystem {
  getCombo(): number;
  getMaxCombo(): number;
  getGaugeProgress(): number;
  getActiveTierIndex(): number;
  addCorrect(): void;
  resetCombo(): void;
  reset(): void;
}

// ── Telemetry Pipeline ─────────────────────────────────

export interface TelemetryEvent {
  type: string;
  data: Record<string, unknown>;
  timestamp: number;
}

export interface ITelemetryPipeline {
  track(event: Omit<TelemetryEvent, "timestamp">): void;
  flush(): Promise<void>;
  getBufferSize(): number;
}

// ── Game Result ────────────────────────────────────────

export interface GameResult {
  mode: GameMode;
  wpm: number;
  rawWpm: number;
  netWpm: number;
  accuracy: number;
  consistency: number;
  totalKeystrokes: number;
  correctKeystrokes: number;
  errorCount: number;
  maxCombo: number;
  stars: number | null;
  elapsedMs: number;
  completed: boolean;
  charResults: CharResult[];
  xpEarned: number;
  wpmSamples: number[];
}

export interface CharResult {
  charIndex: number;
  char: string;
  isCorrect: boolean;
  isTyped: boolean;
  timestamp: number;
}
