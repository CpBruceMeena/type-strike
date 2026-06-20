"use client";

/**
 * Type Strike — useLevelGameplay Hook
 *
 * Dedicated hook for level-based gameplay (unlimited time).
 * Uses LevelTextProvider to fetch the level's paragraph,
 * NoTimer for unlimited time, and completeLevel for results.
 *
 * Game flow: idle → loading → countdown → typing → complete/failed
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { DEFAULT_PLAYER_ID } from "@/lib/constants";
import { TypingEngine } from "@/engine/TypingEngine";
import {
  KeyboardInputSource,
  NoTimer,
  StandardScoring,
  StandardComboSystem,
  TelemetryPipeline,
  LevelTextProvider,
} from "@/engine/implementations";
import { computeStars } from "@/lib/utils";
import type { GameplayUIState, GameState, LevelDetail } from "@/lib/types";
import type { GameResult } from "@/engine/interfaces";

// ── Initial State ──────────────────────────────────────

function createInitialState(): GameplayUIState {
  return {
    gameState: "idle" as GameState,
    mode: "level",
    levelId: null,
    levelName: "",
    tier: "",
    paragraph: "",
    currentCharIndex: 0,
    charResults: [],
    totalKeystrokes: 0,
    correctKeystrokes: 0,
    combo: 0,
    maxCombo: 0,
    gaugeProgress: 0,
    activeComboTierIndex: 0,
    liveWpm: 0,
    accuracy: 1,
    elapsedMs: 0,
    countdownValue: 3,
    showGo: false,
    showKineticText: null,
    timeRemaining: null,
    finalWpm: 0,
    finalAccuracy: 0,
    stars: 0,
  };
}

// ── Hook ────────────────────────────────────────────────

export function useLevelGameplay(levelId: number) {
  const router = useRouter();
  const [state, setState] = useState<GameplayUIState>(() => ({
    ...createInitialState(),
    levelId,
  }));
  const [levelDetail, setLevelDetail] = useState<LevelDetail | null>(null);
  const levelDetailRef = useRef<LevelDetail | null>(null);
  const engineRef = useRef<TypingEngine | null>(null);
  const inputRef = useRef<KeyboardInputSource | null>(null);
  const playerId = DEFAULT_PLAYER_ID;

  // Data points for the consistency graph
  const [dataPoints, setDataPoints] = useState<
    Array<{ wpm: number; raw: number; net: number; accuracy: number }>
  >([]);

  // ── Start Game ───────────────────────────────────────

  const startGame = useCallback(async () => {
    setState((s) => ({ ...s, gameState: "loading" as GameState }));

    try {
      // 1. Create text provider (fetches level paragraph)
      const textProvider = new LevelTextProvider(levelId, playerId);

      // 2. Create timer (no limit for level mode)
      const timer = new NoTimer();

      // 3. Create engine with all strategies
      const input = new KeyboardInputSource();
      const scoring = new StandardScoring();
      const comboSys = new StandardComboSystem();
      const telemetry = new TelemetryPipeline();

      const engine = new TypingEngine(
        input,
        timer,
        scoring,
        textProvider,
        comboSys,
        telemetry,
        "level"
      );

      // Store refs for cleanup
      inputRef.current = input;
      engineRef.current = engine;

      // 4. Initialize engine — loads paragraph
      await engine.initialize(levelId);

      // Store level detail for star calculation (use ref to avoid stale closure in callbacks)
      try {
        const detail = await api.getLevelDetail(levelId, playerId);
        levelDetailRef.current = detail;
        setLevelDetail(detail);
      } catch {
        // Optional — star calc will just use defaults
      }

      // 5. Set up callbacks
      engine.onCharUpdateCallback((index, result) => {
        setState((s) => {
          const updatedResults = [...s.charResults];
          updatedResults[index] = {
            charIndex: result.charIndex,
            char: result.char,
            isCorrect: result.isCorrect,
            isTyped: result.isTyped,
          };
          // Move cursor to the next untyped position
          const nextIndex = result.isTyped ? index + 1 : index;
          return { ...s, charResults: updatedResults, currentCharIndex: nextIndex };
        });
      });

      engine.onStatsUpdateCallback((stats) => {
        setState((s) => ({
          ...s,
          liveWpm: stats.wpm,
          accuracy: stats.accuracy,
          combo: stats.combo,
          gaugeProgress: stats.gauge,
          activeComboTierIndex: stats.tierIndex,
          elapsedMs: stats.elapsed,
          timeRemaining: null, // No timer in level mode
        }));

        setDataPoints((prev) => {
          const point = {
            wpm: stats.wpm,
            raw: stats.wpm,
            net: Math.round(stats.wpm * stats.accuracy),
            accuracy: stats.accuracy,
          };
          const last = prev[prev.length - 1];
          if (last && Math.abs(last.wpm - point.wpm) < 2) return prev;
          return [...prev.slice(-200), point];
        });
      });

      engine.onKineticTextCallback((text) => {
        if (text) {
          setState((s) => ({ ...s, showKineticText: text }));
          setTimeout(() => {
            setState((s) => ({ ...s, showKineticText: null }));
          }, 1800);
        }
      });

      engine.onCompleteCallback((result: GameResult) => {
        handleGameComplete(result);
      });

      // 6. Store paragraph for UI
      setState((s) => ({
        ...s,
        paragraph: engine.getText(),
        charResults: engine.getCharResults().map((r) => ({
          charIndex: r.charIndex,
          char: r.char,
          isCorrect: r.isCorrect,
          isTyped: r.isTyped,
        })),
        gameState: "idle" as GameState,
      }));

      // 7. Transition to countdown
      setState((s) => ({ ...s, gameState: "countdown" as GameState, countdownValue: 3 }));
    } catch (err) {
      console.error("Failed to start level game:", err);
      setState((s) => ({ ...s, gameState: "failed" as GameState }));
    }
  }, [levelId, playerId]);

  // ── Countdown Sequence ───────────────────────────────

  const startCountdown = useCallback(async () => {
    const engine = engineRef.current;
    if (!engine) return;

    for (let i = 3; i >= 1; i--) {
      setState((s) => ({ ...s, countdownValue: i, showGo: false }));
      await new Promise((r) => setTimeout(r, 700));
    }

    setState((s) => ({ ...s, showGo: true }));
    await new Promise((r) => setTimeout(r, 500));
    setState((s) => ({ ...s, showGo: false, gameState: "typing" as GameState }));

    engine.start();
    inputRef.current?.attach();
  }, []);

  // ── Handle Game Complete ─────────────────────────────

  const handleGameComplete = useCallback(
    async (result: GameResult) => {
      // Calculate stars — read from ref to avoid stale closure
      const detail = levelDetailRef.current;
      let stars = 0;
      if (detail) {
        stars = computeStars(
          result.wpm,
          result.accuracy,
          detail,
          result.errorCount
        );
      }

      // Submit to backend via completeLevel
      try {
        await api.completeLevel(playerId, levelId, {
          wpm: result.wpm,
          accuracy: result.accuracy,
          stars,
          completed: result.completed,
        });
      } catch (err) {
        console.error("Failed to submit level result:", err);
      }

      // Update state
      setState((s) => ({
        ...s,
        gameState: (result.completed ? "complete" : "failed") as GameState,
        finalWpm: result.wpm,
        finalAccuracy: result.accuracy,
        stars,
        elapsedMs: result.elapsedMs,
        totalKeystrokes: result.totalKeystrokes,
        correctKeystrokes: result.correctKeystrokes,
        maxCombo: result.maxCombo,
      }));

      // Navigate to result page
      const xpEarned = result.xpEarned;
      const params = new URLSearchParams({
        wpm: String(result.wpm),
        accuracy: String(result.accuracy),
        xp: String(xpEarned),
        stars: String(stars),
        mode: `level-${levelId}`,
      });

      setTimeout(() => {
        const dest = result.completed ? "/victory" : "/failed";
        router.push(`${dest}?${params.toString()}`);
      }, 1200);

      // Cleanup
      engineRef.current?.destroy();
      inputRef.current?.destroy();
    },
    [levelId, playerId, router]
  );

  // ── Cleanup on unmount ───────────────────────────────

  useEffect(() => {
    return () => {
      engineRef.current?.destroy();
      inputRef.current?.destroy();
    };
  }, []);

  // ── Return ───────────────────────────────────────────

  return {
    state,
    dataPoints,
    startGame,
    startCountdown,
  };
}
