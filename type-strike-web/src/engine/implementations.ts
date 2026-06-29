/**
 * Type Strike — Engine Implementations
 *
 * Concrete implementations of all engine interfaces.
 * Each is swappable — the engine accepts any implementation.
 */

import type {
  IInputSource,
  ITimerStrategy,
  IScoringStrategy,
  IComboSystem,
  ITelemetryPipeline,
  ITextProvider,
  TextBundle,
  LevelThreshold,
} from "./interfaces";

import { COMBO_TIERS, STALL_TIMEOUT_MS } from "@/lib/constants";
import { api } from "@/lib/api";

// ── Keyboard Input Source ──────────────────────────────

export class KeyboardInputSource implements IInputSource {
  private keydownCb?: (char: string) => void;
  private backspaceCb?: () => void;
  private keyupCb?: () => void;
  private handler = (e: Event) => {
    const ke = e as KeyboardEvent;
    if (ke.repeat) return;
    if (ke.key === "Backspace") {
      ke.preventDefault();
      this.backspaceCb?.();
      return;
    }
    // Enter → \n for multi-line code snippet newlines
    if (ke.key === "Enter") {
      ke.preventDefault();
      this.keydownCb?.("\n");
      return;
    }
    // Tab → insert indentation spaces (matches code snippet style)
    if (ke.key === "Tab") {
      ke.preventDefault();
      const INDENT_SIZE = 2;
      for (let i = 0; i < INDENT_SIZE; i++) {
        this.keydownCb?.(" ");
      }
      return;
    }
    if (ke.key.length === 1) {
      ke.preventDefault();
      this.keydownCb?.(ke.key);
    }
  };

  private upHandler = () => {
    this.keyupCb?.();
  };

  onKeyDown(callback: (char: string) => void): void {
    this.keydownCb = callback;
  }

  onBackspace(callback: () => void): void {
    this.backspaceCb = callback;
  }

  onKeyUp(callback: () => void): void {
    this.keyupCb = callback;
  }

  destroy(): void {
    document.removeEventListener("keydown", this.handler);
    document.removeEventListener("keyup", this.upHandler);
  }

  isActive(): boolean {
    return !!this.keydownCb;
  }

  attach(element?: HTMLElement): void {
    const target = element ?? document;
    target.addEventListener("keydown", this.handler);
    target.addEventListener("keyup", this.upHandler);
  }
}

// ── No-Timer (Level Mode) ─────────────────────────────

export class NoTimer implements ITimerStrategy {
  private startTime = 0;
  private pausedTime = 0;
  private isPaused = false;
  private tickCb?: (elapsed: number) => void;
  private expireCb?: () => void;
  private intervalId?: ReturnType<typeof setInterval>;

  getElapsedMs(): number {
    if (this.startTime === 0) return 0;
    if (this.isPaused) return this.pausedTime;
    return Date.now() - this.startTime;
  }

  getRemainingMs(): number | null {
    return null; // No time limit
  }

  start(): void {
    this.startTime = Date.now();
    this.isPaused = false;
    this.intervalId = setInterval(() => {
      this.tickCb?.(this.getElapsedMs());
    }, 200);
  }

  pause(): void {
    if (!this.isPaused) {
      this.pausedTime = this.getElapsedMs();
      this.isPaused = true;
      clearInterval(this.intervalId);
    }
  }

  resume(): void {
    if (this.isPaused) {
      const elapsed = this.pausedTime;
      this.startTime = Date.now() - elapsed;
      this.isPaused = false;
      this.intervalId = setInterval(() => {
        this.tickCb?.(this.getElapsedMs());
      }, 200);
    }
  }

  reset(): void {
    this.startTime = 0;
    this.pausedTime = 0;
    this.isPaused = false;
    clearInterval(this.intervalId);
  }

  isExpired(): boolean {
    return false;
  }

  onTick(callback: (elapsed: number) => void): void {
    this.tickCb = callback;
  }

  onExpire(callback: () => void): void {
    this.expireCb = callback;
  }
}

// ── Countdown Timer (Timed Modes) ──────────────────────

export class CountdownTimer implements ITimerStrategy {
  private durationMs: number;
  private startTime = 0;
  private pausedTime = 0;
  private isPaused = false;
  private expired = false;
  private tickCb?: (elapsed: number) => void;
  private expireCb?: () => void;
  private intervalId?: ReturnType<typeof setInterval>;

  constructor(durationSeconds: number) {
    this.durationMs = durationSeconds * 1000;
  }

  getElapsedMs(): number {
    if (this.startTime === 0) return 0;
    if (this.isPaused) return this.pausedTime;
    return Date.now() - this.startTime;
  }

  getRemainingMs(): number {
    return Math.max(0, this.durationMs - this.getElapsedMs());
  }

  start(): void {
    this.startTime = Date.now();
    this.isPaused = false;
    this.expired = false;
    this.intervalId = setInterval(() => {
      const elapsed = this.getElapsedMs();
      this.tickCb?.(elapsed);
      if (elapsed >= this.durationMs) {
        this.expired = true;
        clearInterval(this.intervalId);
        this.expireCb?.();
      }
    }, 200);
  }

  pause(): void {
    if (!this.isPaused) {
      this.pausedTime = this.getElapsedMs();
      this.isPaused = true;
      clearInterval(this.intervalId);
    }
  }

  resume(): void {
    if (this.isPaused) {
      const elapsed = this.pausedTime;
      this.startTime = Date.now() - elapsed;
      this.isPaused = false;
      this.intervalId = setInterval(() => {
        const newElapsed = this.getElapsedMs();
        this.tickCb?.(newElapsed);
        if (newElapsed >= this.durationMs) {
          this.expired = true;
          clearInterval(this.intervalId);
          this.expireCb?.();
        }
      }, 200);
    }
  }

  reset(): void {
    this.startTime = 0;
    this.pausedTime = 0;
    this.isPaused = false;
    this.expired = false;
    clearInterval(this.intervalId);
  }

  isExpired(): boolean {
    return this.expired;
  }

  onTick(callback: (elapsed: number) => void): void {
    this.tickCb = callback;
  }

  onExpire(callback: () => void): void {
    this.expireCb = callback;
  }
}

// ── Standard Scoring ──────────────────────────────────

export class StandardScoring implements IScoringStrategy {
  calculateWpm(correctChars: number, elapsedMs: number): number {
    if (elapsedMs < 1000) return 0;
    const minutes = elapsedMs / 60000;
    const wordsTyped = Math.floor(correctChars / 5);
    return minutes > 0 ? Math.round(wordsTyped / minutes) : 0;
  }

  calculateRawWpm(totalChars: number, elapsedMs: number): number {
    if (elapsedMs < 1000) return 0;
    const minutes = elapsedMs / 60000;
    const wordsTyped = Math.floor(totalChars / 5);
    return minutes > 0 ? Math.round(wordsTyped / minutes) : 0;
  }

  calculateNetWpm(
    correctChars: number,
    errors: number,
    elapsedMs: number
  ): number {
    const netChars = Math.max(0, correctChars - errors);
    return this.calculateWpm(netChars, elapsedMs);
  }

  calculateAccuracy(correctKeystrokes: number, totalKeystrokes: number): number {
    if (totalKeystrokes <= 0) return 1;
    return correctKeystrokes / totalKeystrokes;
  }

  calculateStars(
    wpm: number,
    accuracy: number,
    threshold: LevelThreshold,
    errorCount: number
  ): number {
    const { passWpm, passAccuracy } = threshold;
    if (wpm < passWpm || accuracy < passAccuracy / 100) return 0;

    // More lenient thresholds:
    // 2 stars: 110% of pass WPM, 93%+ accuracy
    // 3 stars: 125% of pass WPM, 96%+ accuracy, 2 or fewer errors
    const meets2Star = wpm >= Math.round(passWpm * 1.10) && accuracy >= 0.93;
    const meets3Star =
      wpm >= Math.round(passWpm * 1.25) && accuracy >= 0.96 && errorCount <= 2;

    if (meets3Star) return 3;
    if (meets2Star) return 2;
    return 1;
  }

  calculateConsistency(wpmSamples: number[]): number {
    if (wpmSamples.length < 2) return 100;
    const avg = wpmSamples.reduce((s, v) => s + v, 0) / wpmSamples.length;
    if (avg === 0) return 100;
    const variance =
      wpmSamples.reduce((s, v) => s + (v - avg) ** 2, 0) / wpmSamples.length;
    const stdDev = Math.sqrt(variance);
    const cv = stdDev / avg;
    return Math.max(0, Math.round((1 - cv) * 100));
  }
}

// ── Combo System ──────────────────────────────────────

export class StandardComboSystem implements IComboSystem {
  private combo = 0;
  private maxCombo = 0;

  getCombo(): number {
    return this.combo;
  }

  getMaxCombo(): number {
    return this.maxCombo;
  }

  getGaugeProgress(): number {
    return Math.min(this.combo / 30, 1);
  }

  getActiveTierIndex(): number {
    let idx = 0;
    for (let i = COMBO_TIERS.length - 1; i >= 0; i--) {
      if (this.combo >= COMBO_TIERS[i].minStreak) {
        idx = i;
        break;
      }
    }
    return idx;
  }

  addCorrect(): void {
    this.combo++;
    this.maxCombo = Math.max(this.maxCombo, this.combo);
  }

  resetCombo(): void {
    this.combo = 0;
  }

  reset(): void {
    this.combo = 0;
    this.maxCombo = 0;
  }
}

// ── Telemetry Pipeline ────────────────────────────────

export class TelemetryPipeline implements ITelemetryPipeline {
  private buffer: Array<{ type: string; data: Record<string, unknown>; timestamp: number }> = [];
  private flushInterval: ReturnType<typeof setInterval>;
  private apiEndpoint: string;

  constructor(apiEndpoint = "/api/v1/telemetry/batch", autoFlushMs = 5000) {
    this.apiEndpoint = apiEndpoint;
    this.flushInterval = setInterval(() => this.flush(), autoFlushMs);
  }

  track(event: { type: string; data: Record<string, unknown> }): void {
    this.buffer.push({ ...event, timestamp: Date.now() });
    if (this.buffer.length >= 50) this.flush();
  }

  async flush(): Promise<void> {
    if (this.buffer.length === 0) return;
    const batch = [...this.buffer];
    this.buffer = [];
    try {
      await fetch(this.apiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ events: batch }),
        keepalive: true,
      });
    } catch {
      // Silent failure — never block gameplay
    }
  }

  getBufferSize(): number {
    return this.buffer.length;
  }

  destroy(): void {
    clearInterval(this.flushInterval);
    this.flush();
  }
}

// ── Text Providers ────────────────────────────────────

export class LevelTextProvider implements ITextProvider {
  private levelId: number;
  private playerId: number;
  private cached: TextBundle | null = null;

  constructor(levelId: number, playerId: number) {
    this.levelId = levelId;
    this.playerId = playerId;
  }

  async getText(): Promise<TextBundle> {
    if (this.cached) return this.cached;
    try {
      const detail = await api.getLevelDetail(this.levelId, this.playerId);
      this.cached = {
        content: detail.paragraph,
        source: "level",
        metadata: { levelId: this.levelId, name: detail.name, tier: detail.tier },
      };
      return this.cached;
    } catch {
      // Fallback
      this.cached = {
        content: "The fire burns brightly. A hot flame forges the stone.",
        source: "level",
        metadata: { levelId: this.levelId, fallback: true },
      };
      return this.cached;
    }
  }

  getMetadata(): Record<string, unknown> {
    return this.cached?.metadata ?? {};
  }
}

export class ContestTextProvider implements ITextProvider {
  private playerId: number;
  private cached: TextBundle | null = null;

  constructor(playerId: number) {
    this.playerId = playerId;
  }

  async getText(): Promise<TextBundle> {
    if (this.cached) return this.cached;
    try {
      const contest = await api.getCurrentContest(this.playerId);
      this.cached = {
        content: contest.paragraph,
        source: "contest",
        metadata: {
          contestId: contest.contest_id,
          difficulty: contest.difficulty,
        },
      };
      return this.cached;
    } catch {
      this.cached = {
        content: "Contest paragraph unavailable. The molten core accelerates beyond all known limits.",
        source: "contest",
        metadata: { fallback: true },
      };
      return this.cached;
    }
  }

  getMetadata(): Record<string, unknown> {
    return this.cached?.metadata ?? {};
  }
}

export class FreePracticeTextProvider implements ITextProvider {
  private paragraph: string;

  constructor(paragraph: string) {
    this.paragraph = paragraph;
  }

  async getText(): Promise<TextBundle> {
    return {
      content: this.paragraph,
      source: "practice",
      metadata: { generated: true },
    };
  }

  getMetadata(): Record<string, unknown> {
    return { generated: true };
  }
}

// ── Coder Text Provider (uses shared coder-data.ts) ─────

export class CoderTextProvider implements ITextProvider {
  private playerId: number;
  private difficulty: string;
  private language?: string;
  private snippetIndex?: number;
  private cached: TextBundle | null = null;

  constructor(playerId: number, difficulty: string = "easy", language?: string, snippetIndex?: number) {
    this.playerId = playerId;
    this.difficulty = difficulty;
    this.language = language;
    this.snippetIndex = snippetIndex;
  }

  async getText(): Promise<TextBundle> {
    if (this.cached) return this.cached;

    // Dynamically import shared data to avoid circular deps
    const { getFilteredSnippets, LANGUAGE_COLORS } = await import("@/lib/coder-data");

    const pool = getFilteredSnippets(this.difficulty, this.language);
    if (pool.length === 0) {
      // Fallback: use full pool for the difficulty
      const { getSnippetPool } = await import("@/lib/coder-data");
      const fallback = getSnippetPool(this.difficulty);
      const idx = Math.floor(Math.random() * fallback.length);
      const snippet = fallback[idx];
      this.cached = {
        content: snippet.code,
        source: "coder",
        metadata: {
          difficulty: this.difficulty,
          snippetCount: fallback.length,
          language: snippet.language,
          languageColor: LANGUAGE_COLORS[snippet.language] ?? '#888888',
        },
      };
      return this.cached;
    }

    const idx = this.snippetIndex !== undefined && this.snippetIndex < pool.length
      ? this.snippetIndex
      : Math.floor(Math.random() * pool.length);
    const snippet = pool[idx];

    this.cached = {
      content: snippet.code,
      source: "coder",
      metadata: { 
        difficulty: this.difficulty, 
        snippetCount: pool.length,
        language: snippet.language,
        languageColor: LANGUAGE_COLORS[snippet.language] ?? '#888888',
        snippetIndex: idx,
        title: snippet.title,
      },
    };

    return this.cached;
  }

  getMetadata(): Record<string, unknown> {
    return this.cached?.metadata ?? {};
  }
}

// ── Lesson Text Provider ─────────────────────────────

export class LessonTextProvider implements ITextProvider {
  private lessonId: number;
  private cached: TextBundle | null = null;

  constructor(lessonId: number) {
    this.lessonId = lessonId;
  }

  async getText(): Promise<TextBundle> {
    if (this.cached) return this.cached;

    // Dynamically import lessons data
    try {
      const { getLessonById } = await import("@/lib/lessons");
      const lesson = getLessonById(this.lessonId);
      if (lesson) {
        this.cached = {
          content: lesson.paragraph,
          source: "practice",
          metadata: { lessonId: this.lessonId, name: lesson.name },
        };
        return this.cached;
      }
    } catch {
      // Fall through to fallback
    }

    this.cached = {
      content: "Type the letters f and j to practice your home row position.",
      source: "practice",
      metadata: { lessonId: this.lessonId, fallback: true },
    };
    return this.cached;
  }

  getMetadata(): Record<string, unknown> {
    return this.cached?.metadata ?? {};
  }
}

export class EnterpriseTextProvider implements ITextProvider {
  private customText: string;

  constructor(customText: string) {
    this.customText = customText;
  }

  async getText(): Promise<TextBundle> {
    return {
      content: this.customText,
      source: "enterprise",
      metadata: { custom: true },
    };
  }

  getMetadata(): Record<string, unknown> {
    return { custom: true };
  }
}

// ── Stall Detector ────────────────────────────────────

export class StallDetector {
  private timeoutMs: number;
  private timer?: ReturnType<typeof setTimeout>;
  private onStall?: () => void;
  private onUnstall?: () => void;
  private isStalled = false;

  constructor(timeoutMs = STALL_TIMEOUT_MS) {
    this.timeoutMs = timeoutMs;
  }

  onStallCallback(cb: () => void): void {
    this.onStall = cb;
  }

  onUnstallCallback(cb: () => void): void {
    this.onUnstall = cb;
  }

  registerActivity(): void {
    clearTimeout(this.timer);
    if (this.isStalled) {
      this.isStalled = false;
      this.onUnstall?.();
    }
    this.timer = setTimeout(() => {
      this.isStalled = true;
      this.onStall?.();
    }, this.timeoutMs);
  }

  isCurrentlyStalled(): boolean {
    return this.isStalled;
  }

  reset(): void {
    clearTimeout(this.timer);
    this.isStalled = false;
  }

  destroy(): void {
    clearTimeout(this.timer);
  }
}
