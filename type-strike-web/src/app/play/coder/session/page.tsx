"use client";

import { useEffect, useCallback, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { TypingEngine } from "@/engine/TypingEngine";
import {
  KeyboardInputSource,
  NoTimer,
  StandardScoring,
  StandardComboSystem,
  TelemetryPipeline,
  CoderTextProvider,
} from "@/engine/implementations";
import type { ITextProvider } from "@/engine/interfaces";
import { usePlayer } from "@/hooks/usePlayer";
import GameplayUI from "@/components/game/GameplayUI";
import type { GameplayUIState, GameState } from "@/lib/types";
import type { GameResult } from "@/engine/interfaces";
import { DEFAULT_PLAYER_ID } from "@/lib/constants";
import { computeXpEarned } from "@/lib/utils";

function createInitialState(): GameplayUIState {
  return {
    gameState: "idle" as GameState,
    mode: "coder",
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

function CoderSessionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const difficulty = searchParams.get("difficulty") ?? "easy";
  const language = searchParams.get("language") ?? undefined;
  const snippetIndexStr = searchParams.get("snippet");
  const snippetIndex = snippetIndexStr ? parseInt(snippetIndexStr, 10) : undefined;

  const [state, setState] = useState<GameplayUIState>(createInitialState);
  const [dataPoints, setDataPoints] = useState<
    Array<{ wpm: number; raw: number; net: number; accuracy: number }>
  >([]);

  const engineRef = useRef<TypingEngine | null>(null);
  const inputRef = useRef<KeyboardInputSource | null>(null);
  const { playerId: clerkPlayerId } = usePlayer();
  const playerId = clerkPlayerId ?? DEFAULT_PLAYER_ID;

  const startGame = useCallback(async () => {
    setState((s) => ({ ...s, gameState: "loading" as GameState }));

    try {
      const timer = new NoTimer();
      const textProvider: ITextProvider = new CoderTextProvider(playerId, difficulty, language, snippetIndex);

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
        "coder"
      );

      inputRef.current = input;
      engineRef.current = engine;

      await engine.initialize();

      // Read language info from text provider metadata
      const meta = textProvider.getMetadata();
      const snippetLanguage = meta.language as string | undefined;
      const snippetColor = meta.languageColor as string | undefined;

      setState((s) => ({
        ...s,
        language: snippetLanguage,
        languageColor: snippetColor,
      }));

      engine.onCharUpdateCallback((index, result) => {
        setState((s) => {
          const updatedResults = [...s.charResults];
          updatedResults[index] = {
            charIndex: result.charIndex,
            char: result.char,
            isCorrect: result.isCorrect,
            isTyped: result.isTyped,
          };
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
          timeRemaining: null, // No timer in coder mode (unlimited time)
        }));

        setDataPoints((prev) => {
          const point = { wpm: stats.wpm, raw: stats.wpm, net: Math.round(stats.wpm * stats.accuracy), accuracy: stats.accuracy };
          const last = prev[prev.length - 1];
          if (last && Math.abs(last.wpm - point.wpm) < 2) return prev;
          return [...prev.slice(-200), point];
        });
      });

      engine.onCompleteCallback((result: GameResult) => {
        handleGameComplete(result);
      });

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

      setState((s) => ({ ...s, gameState: "countdown" as GameState, countdownValue: 3 }));
    } catch (err) {
      console.error("Failed to start coder game:", err);
      setState((s) => ({ ...s, gameState: "failed" as GameState }));
    }
  }, [difficulty, language, snippetIndex, playerId]);

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

  const handleGameComplete = useCallback(
    async (result: GameResult) => {
      const xp = computeXpEarned(result.wpm, result.accuracy, null);

      setState((s) => ({
        ...s,
        gameState: (result.completed ? "complete" : "failed") as GameState,
        finalWpm: result.wpm,
        finalAccuracy: result.accuracy,
        stars: 0,
        elapsedMs: result.elapsedMs,
        maxCombo: result.maxCombo,
      }));

      const params = new URLSearchParams({
        wpm: String(result.wpm),
        accuracy: String(result.accuracy),
        xp: String(xp),
        stars: "0",
        mode: `coder_${difficulty}`,
      });

      // Also try to submit to backend if available (non-blocking)
      setTimeout(() => {
        const dest = result.completed ? "/victory" : "/failed";
        router.push(`${dest}?${params.toString()}`);
      }, 1200);

      engineRef.current?.destroy();
      inputRef.current?.destroy();
    },
    [difficulty, router]
  );

  useEffect(() => {
    startGame();
  }, [startGame]);

  useEffect(() => {
    return () => {
      engineRef.current?.destroy();
      inputRef.current?.destroy();
    };
  }, []);

  return (
    <GameplayUI
      state={state}
      dataPoints={dataPoints}
      onStartCountdown={startCountdown}
    />
  );
}

export default function CoderSessionPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-1 flex-col items-center justify-center gap-4">
        <div
          className="h-8 w-8 animate-spin rounded-full border-2 border-transparent"
          style={{ borderTopColor: "var(--electric-cyan)", borderRightColor: "var(--electric-cyan)" }}
        />
        <p className="text-xs tracking-[2px]" style={{ color: "var(--text-muted)" }}>
          LOADING CODE ARENA…
        </p>
      </div>
    }>
      <CoderSessionContent />
    </Suspense>
  );
}
