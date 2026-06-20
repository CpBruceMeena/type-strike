/**
 * Type Strike — Typing Engine (SOLID Implementation)
 *
 * Single Responsibility: Manages the core typing game loop.
 * Open/Closed: Accepts strategies via constructor injection.
 * Liskov: Any IInputSource/ITimerStrategy/IScoringStrategy works.
 * Interface Segregation: Depends on narrow interfaces only.
 * Dependency Inversion: Depends on abstractions, not concretions.
 */

import type {
  IInputSource,
  ITimerStrategy,
  IScoringStrategy,
  ITextProvider,
  IComboSystem,
  ITelemetryPipeline,
  GameResult,
  CharResult,
  LevelThreshold,
} from "./interfaces";
import type { GameMode } from "@/lib/types";
import { COMBO_TIERS } from "@/lib/constants";
import { computeXpEarned } from "@/lib/utils";

export class TypingEngine {
  private input: IInputSource;
  private timer: ITimerStrategy;
  private scoring: IScoringStrategy;
  private textProvider: ITextProvider;
  private combo: IComboSystem;
  private telemetry: ITelemetryPipeline;

  // Game state (mutable, not exposed directly)
  private text = "";
  private charResults: CharResult[] = [];
  private currentIndex = 0;
  private totalKeystrokes = 0;
  private correctKeystrokes = 0;
  private errorCount = 0;
  private wpmSamples: number[] = [];
  private isRunning = false;
  private mode: GameMode;
  private levelId: number | null = null;

  // Callbacks
  private onCharUpdate?: (index: number, result: CharResult) => void;
  private onStatsUpdate?: (stats: {
    wpm: number;
    accuracy: number;
    combo: number;
    gauge: number;
    tierIndex: number;
    elapsed: number;
  }) => void;
  private onKineticText?: (text: string | null) => void;
  private onComplete?: (result: GameResult) => void;

  constructor(
    input: IInputSource,
    timer: ITimerStrategy,
    scoring: IScoringStrategy,
    textProvider: ITextProvider,
    combo: IComboSystem,
    telemetry: ITelemetryPipeline,
    mode: GameMode
  ) {
    this.input = input;
    this.timer = timer;
    this.scoring = scoring;
    this.textProvider = textProvider;
    this.combo = combo;
    this.telemetry = telemetry;
    this.mode = mode;
  }

  // ── Lifecycle ──────────────────────────────────────

  async initialize(levelId?: number): Promise<void> {
    this.levelId = levelId ?? null;
    const bundle = await this.textProvider.getText();
    this.text = bundle.content;
    this.charResults = bundle.content.split("").map((char, i) => ({
      charIndex: i,
      char,
      isCorrect: true,
      isTyped: false,
      timestamp: 0,
    }));
    this.reset();
  }

  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;

    this.timer.reset();
    this.timer.start();

    this.input.onKeyDown((char: string) => this.handleKeyDown(char));
    this.input.onBackspace(() => this.handleBackspace());

    this.timer.onTick((elapsed) => {
      this.emitStats(elapsed);
    });

    this.timer.onExpire(() => {
      this.finish();
    });

    this.telemetry.track({
      type: "game_start",
      data: { mode: this.mode, textLength: this.text.length },
    });
  }

  pause(): void {
    this.timer.pause();
  }

  resume(): void {
    this.timer.resume();
  }

  destroy(): void {
    this.isRunning = false;
    this.timer.pause();
    this.input.destroy();
  }

  // ── Event Subscriptions ────────────────────────────

  onCharUpdateCallback(cb: (index: number, result: CharResult) => void): void {
    this.onCharUpdate = cb;
  }

  onStatsUpdateCallback(
    cb: (stats: {
      wpm: number;
      accuracy: number;
      combo: number;
      gauge: number;
      tierIndex: number;
      elapsed: number;
    }) => void
  ): void {
    this.onStatsUpdate = cb;
  }

  onKineticTextCallback(cb: (text: string | null) => void): void {
    this.onKineticText = cb;
  }

  onCompleteCallback(cb: (result: GameResult) => void): void {
    this.onComplete = cb;
  }

  // ── Input Handling ─────────────────────────────────

  private handleKeyDown(char: string): void {
    if (!this.isRunning || this.currentIndex >= this.text.length) return;

    const expected = this.text[this.currentIndex];
    const isCorrect = char === expected;

    const result: CharResult = {
      charIndex: this.currentIndex,
      char,
      isCorrect,
      isTyped: true,
      timestamp: Date.now(),
    };

    this.charResults[this.currentIndex] = result;
    this.totalKeystrokes++;

    if (isCorrect) {
      this.correctKeystrokes++;
      this.combo.addCorrect();
      this.onCharUpdate?.(this.currentIndex, result);
      this.currentIndex++;
    } else {
      this.errorCount++;
      this.combo.resetCombo();
      this.onCharUpdate?.(this.currentIndex, result);
      this.currentIndex++;
    }

    // Check completion
    if (this.currentIndex >= this.text.length) {
      this.finish();
      return;
    }

    // Sample WPM every ~second
    const elapsed = this.timer.getElapsedMs();
    const wpm = this.scoring.calculateWpm(this.correctKeystrokes, Math.max(elapsed, 1));
    if (this.wpmSamples.length === 0 || elapsed > this.wpmSamples.length * 1000) {
      this.wpmSamples.push(wpm);
    }

    // Kinetic text on tier change
    const tierIndex = this.combo.getActiveTierIndex();
    if (tierIndex >= 2) {
      this.onKineticText?.(COMBO_TIERS[tierIndex]?.title ?? null);
    }

    this.emitStats(elapsed);

    // Telemetry sample (1% sampling)
    if (Math.random() < 0.01) {
      this.telemetry.track({
        type: "keystroke",
        data: { wpm, accuracy: this.getCurrentAccuracy(), combo: this.combo.getCombo() },
      });
    }
  }

  private handleBackspace(): void {
    if (this.currentIndex <= 0) return;

    const prevIdx = this.currentIndex - 1;
    const prev = this.charResults[prevIdx];

    if (!prev.isTyped) return;

    this.charResults[prevIdx] = {
      ...prev,
      isTyped: false,
    };

    this.totalKeystrokes = Math.max(0, this.totalKeystrokes - 1);
    if (prev.isCorrect) {
      this.correctKeystrokes = Math.max(0, this.correctKeystrokes - 1);
    } else {
      this.errorCount = Math.max(0, this.errorCount - 1);
    }

    this.combo.resetCombo();
    this.currentIndex = prevIdx;
    this.onCharUpdate?.(prevIdx, this.charResults[prevIdx]);

    const elapsed = this.timer.getElapsedMs();
    this.emitStats(elapsed);
  }

  // ── Completion ─────────────────────────────────────

  private finish(): void {
    this.isRunning = false;
    this.timer.pause();

    const elapsed = this.timer.getElapsedMs();
    const wpm = this.scoring.calculateWpm(this.correctKeystrokes, Math.max(elapsed, 1));
    const rawWpm = this.scoring.calculateRawWpm(this.totalKeystrokes, Math.max(elapsed, 1));
    const netWpm = this.scoring.calculateNetWpm(
      this.correctKeystrokes,
      this.errorCount,
      Math.max(elapsed, 1)
    );
    const accuracy = this.scoring.calculateAccuracy(this.correctKeystrokes, this.totalKeystrokes);
    const consistency = this.scoring.calculateConsistency(this.wpmSamples);

    let stars: number | null = this._stars;
    if (stars === null && this.mode === "level" && this.levelId) {
      stars = 0;
    }

    const xpEarned = computeXpEarned(wpm, accuracy, stars);

    const result: GameResult = {
      mode: this.mode,
      wpm,
      rawWpm,
      netWpm,
      accuracy,
      consistency,
      totalKeystrokes: this.totalKeystrokes,
      correctKeystrokes: this.correctKeystrokes,
      errorCount: this.errorCount,
      maxCombo: this.combo.getMaxCombo(),
      stars,
      elapsedMs: elapsed,
      completed: this.currentIndex >= this.text.length,
      charResults: this.charResults,
      xpEarned,
      wpmSamples: this.wpmSamples,
    };

    this.onComplete?.(result);
    this._stars = null;

    this.telemetry.track({
      type: "game_complete",
      data: {
        mode: this.mode,
        wpm,
        accuracy,
        stars,
        elaspedMs: elapsed,
      },
    });
    this.telemetry.flush();
  }

  // ── Helpers ────────────────────────────────────────

  private getCurrentAccuracy(): number {
    return this.scoring.calculateAccuracy(this.correctKeystrokes, this.totalKeystrokes);
  }

  private emitStats(elapsed: number): void {
    const wpm = this.scoring.calculateWpm(this.correctKeystrokes, Math.max(elapsed, 1));
    const accuracy = this.getCurrentAccuracy();
    const combo = this.combo.getCombo();
    const gauge = this.combo.getGaugeProgress();
    const tierIndex = this.combo.getActiveTierIndex();

    this.onStatsUpdate?.({ wpm, accuracy, combo, gauge, tierIndex, elapsed });
  }

  // ── Accessors ──────────────────────────────────────

  getText(): string {
    return this.text;
  }

  getCharResults(): CharResult[] {
    return this.charResults;
  }

  getCurrentIndex(): number {
    return this.currentIndex;
  }

  isGameRunning(): boolean {
    return this.isRunning;
  }

  private reset(): void {
    this.currentIndex = 0;
    this.totalKeystrokes = 0;
    this.correctKeystrokes = 0;
    this.errorCount = 0;
    this.wpmSamples = [];
    this.combo.reset();
    this.isRunning = false;
  }

  private _stars: number | null = null;

  setStars(stars: number): void {
    this._stars = stars;
  }

  getMode(): GameMode {
    return this.mode;
  }
}
