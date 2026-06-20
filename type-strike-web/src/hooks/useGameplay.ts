"use client";

/**
 * Type Strike — useGameplay Hook
 *
 * Orchestrates the SOLID TypingEngine with backend API calls
 * for timed modes (1min, 3min, 5min) and contest mode.
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
  CountdownTimer,
  StandardScoring,
  StandardComboSystem,
  TelemetryPipeline,
} from "@/engine/implementations";
import type { ITextProvider } from "@/engine/interfaces";
import { ContestTextProvider, FreePracticeTextProvider } from "@/engine/implementations";
import type { GameMode, GameplayUIState, GameState } from "@/lib/types";
import type { GameResult } from "@/engine/interfaces";

// ── Initial State ──────────────────────────────────────

function createInitialState(mode: GameMode): GameplayUIState {
  return {
    gameState: "idle" as GameState,
    mode,
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

export function useGameplay(mode: GameMode) {
  const router = useRouter();
  const [state, setState] = useState<GameplayUIState>(() => createInitialState(mode));
  const engineRef = useRef<TypingEngine | null>(null);
  const inputRef = useRef<KeyboardInputSource | null>(null);
  const timerRef = useRef<CountdownTimer | null>(null);
  const gameIdRef = useRef<string | null>(null);
  const playerId = DEFAULT_PLAYER_ID;

  // Data points for the consistency graph
  const [dataPoints, setDataPoints] = useState<
    Array<{ wpm: number; raw: number; net: number; accuracy: number }>
  >([]);

  // ── Start Game ───────────────────────────────────────

  const startGame = useCallback(async () => {
    setState((s) => ({ ...s, gameState: "loading" as GameState }));

    try {
      // 1. Start session on backend
      const session = await api.startGame({ player_id: playerId, mode });
      gameIdRef.current = session.game_id;

      // 2. Determine duration
      const durationSec = session.duration_seconds ?? 300;

      // 3. Create timer
      const timer = new CountdownTimer(durationSec);

      // 4. Create text provider
      const textProvider: ITextProvider =
        mode === "contest"
          ? new ContestTextProvider(playerId)
          : new FreePracticeTextProvider(session.paragraph);

      // 5. Create engine with all strategies
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
        mode
      );

      // Store refs for cleanup
      inputRef.current = input;
      timerRef.current = timer;
      engineRef.current = engine;

      // 6. Initialize engine — loads paragraph
      await engine.initialize();

      // 7. Set up callbacks
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
          // After typing: cursor moves to index + 1
          // After backspace: cursor stays at index (result.isTyped = false)
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
          timeRemaining: timer.isExpired()
            ? 0
            : timer.getRemainingMs(),
        }));

        // Add data point for graph every ~200ms (throttled by stats emit)
        setDataPoints((prev) => {
          const point = {
            wpm: stats.wpm,
            raw: stats.wpm,
            net: Math.round(stats.wpm * stats.accuracy),
            accuracy: stats.accuracy,
          };
          // Deduplicate: only add if wpm changed significantly
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

      // 8. Store paragraph for UI
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

      // 9. Transition to countdown
      setState((s) => ({ ...s, gameState: "countdown" as GameState, countdownValue: 3 }));
    } catch (err) {
      console.error("Failed to start game:", err);
      setState((s) => ({ ...s, gameState: "failed" as GameState }));
    }
  }, [mode, playerId]);

  // ── Countdown Sequence ───────────────────────────────

  const startCountdown = useCallback(async () => {
    const engine = engineRef.current;
    if (!engine) return;

    // Countdown: 3 → 2 → 1 → GO!
    for (let i = 3; i >= 1; i--) {
      setState((s) => ({ ...s, countdownValue: i, showGo: false }));
      await new Promise((r) => setTimeout(r, 700));
    }

    setState((s) => ({ ...s, showGo: true }));
    await new Promise((r) => setTimeout(r, 500));
    setState((s) => ({ ...s, showGo: false, gameState: "typing" as GameState }));

    // Start engine + attach keyboard
    engine.start();
    inputRef.current?.attach();

  }, []);

  // ── Handle Game Complete ─────────────────────────────

  const handleGameComplete = useCallback(
    async (result: GameResult) => {
      // Submit to backend
      try {
        if (gameIdRef.current) {
          const response = await api.completeGame(gameIdRef.current, {
            player_id: playerId,
            wpm: result.wpm,
            accuracy: result.accuracy,
            correct_keystrokes: result.correctKeystrokes,
            total_keystrokes: result.totalKeystrokes,
            error_count: result.errorCount,
            consistency: result.consistency,
            max_combo: result.maxCombo,
            completed: result.completed,
          });

          // Update state with final results
          setState((s) => ({
            ...s,
            gameState: (result.completed ? "complete" : "failed") as GameState,
            finalWpm: response.wpm,
            finalAccuracy: response.accuracy,
            stars: response.stars ?? 0,
            elapsedMs: result.elapsedMs,
            totalKeystrokes: result.totalKeystrokes,
            correctKeystrokes: result.correctKeystrokes,
            maxCombo: result.maxCombo,
          }));

          // Navigate to result page after a brief delay
          const params = new URLSearchParams({
            wpm: String(response.wpm),
            accuracy: String(response.accuracy),
            xp: String(response.xp_earned),
            stars: String(response.stars ?? 0),
            mode,
            gameId: gameIdRef.current,
          });
          if (response.rank !== null && response.rank !== undefined) {
            params.set("rank", String(response.rank));
          }

          setTimeout(() => {
            const dest = result.completed ? "/victory" : "/failed";
            router.push(`${dest}?${params.toString()}`);
          }, 1200);
        }
      } catch (err) {
        console.error("Failed to submit game result:", err);
        setState((s) => ({
          ...s,
          gameState: "failed" as GameState,
        }));
      }

      // Cleanup engine
      engineRef.current?.destroy();
      inputRef.current?.destroy();
    },
    [playerId, mode, router]
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
