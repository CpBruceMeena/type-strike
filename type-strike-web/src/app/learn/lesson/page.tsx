"use client";

/**
 * Type Strike — Lesson Gameplay Page
 *
 * Individual lesson page that combines finger guide visualization
 * with typing practice using a simplified game loop.
 * Shows finger placement for focus keys and tracks progress.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { getLessonById, LESSONS } from "@/lib/lessons";
import type { Lesson } from "@/lib/lessons";
import { TypingEngine } from "@/engine/TypingEngine";
import {
  KeyboardInputSource,
  NoTimer,
  StandardScoring,
  StandardComboSystem,
  TelemetryPipeline,
  LessonTextProvider,
} from "@/engine/implementations";
import type { GameResult, CharResult } from "@/engine/interfaces";
import FingerGuide from "@/components/game/FingerGuide";
import ParagraphDisplay from "@/components/game/ParagraphDisplay";
import CountdownOverlay from "@/components/game/CountdownOverlay";
import KineticText from "@/components/game/KineticText";
import GlassPanel from "@/components/ui/GlassPanel";
import type { GameState } from "@/lib/types";

// ── Lesson State ───────────────────────────────────────

interface LessonUIState {
  gameState: GameState;
  paragraph: string;
  currentCharIndex: number;
  charResults: CharResult[];
  totalKeystrokes: number;
  correctKeystrokes: number;
  combo: number;
  maxCombo: number;
  gaugeProgress: number;
  activeComboTierIndex: number;
  liveWpm: number;
  accuracy: number;
  elapsedMs: number;
  countdownValue: number;
  showGo: boolean;
  showKineticText: string | null;
  complete: boolean;
}

function createInitialState(): LessonUIState {
  return {
    gameState: "idle" as GameState,
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
    complete: false,
  };
}

// ── Main Content ───────────────────────────────────────

function LessonContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const lessonId = parseInt(searchParams.get("id") ?? "1", 10);
  const quickStart = searchParams.get("quickStart") === "true";

  const lesson = useMemo(() => getLessonById(lessonId), [lessonId]);

  const [state, setState] = useState<LessonUIState>(() => createInitialState());
  const engineRef = useRef<TypingEngine | null>(null);
  const inputRef = useRef<KeyboardInputSource | null>(null);
  const quickStartRef = useRef(quickStart);
  const lessonIdRef = useRef(lessonId);

  // ── Start Game ───────────────────────────────────────

  const startGame = useCallback(async () => {
    if (!lesson) return;

    // 🔥 CRITICAL: Destroy any previous engine/input before creating new ones.
    // When navigating between lessons (e.g., ?id=5 → ?id=6), Next.js reuses
    // the component. Without this cleanup, the old engine's keyboard listener
    // stays attached and interferes with the new lesson, causing ghost
    // keystrokes and auto-complete behavior.
    engineRef.current?.destroy();
    inputRef.current?.destroy();
    engineRef.current = null;
    inputRef.current = null;

    // Reset to initial state and immediately go to loading — single render cycle
    setState({ ...createInitialState(), gameState: "loading" as GameState });

    try {
      const textProvider = new LessonTextProvider(lessonId);
      const timer = new NoTimer();
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

      inputRef.current = input;
      engineRef.current = engine;

      await engine.initialize();

      // Guard: ignore stale callbacks from a previous lesson’s engine
      const currentLessonId = lessonId;

      // Callbacks
      engine.onCharUpdateCallback((index, result) => {
        if (lessonIdRef.current !== currentLessonId) return;
        setState((s) => {
          const updatedResults = [...s.charResults];
          updatedResults[index] = {
            charIndex: result.charIndex,
            char: result.char,
            isCorrect: result.isCorrect,
            isTyped: result.isTyped,
            timestamp: result.timestamp,
          };
          const nextIndex = result.isTyped ? index + 1 : index;
          return { ...s, charResults: updatedResults, currentCharIndex: nextIndex };
        });
      });

      engine.onStatsUpdateCallback((stats) => {
        if (lessonIdRef.current !== currentLessonId) return;
        setState((s) => ({
          ...s,
          liveWpm: stats.wpm,
          accuracy: stats.accuracy,
          combo: stats.combo,
          gaugeProgress: stats.gauge,
          activeComboTierIndex: stats.tierIndex,
          elapsedMs: stats.elapsed,
        }));
      });

      engine.onKineticTextCallback((text) => {
        if (lessonIdRef.current !== currentLessonId) return;
        if (text) {
          setState((s) => ({ ...s, showKineticText: text }));
          setTimeout(() => setState((s) => ({ ...s, showKineticText: null })), 1800);
        }
      });

      engine.onCompleteCallback((result: GameResult) => {
        if (lessonIdRef.current !== currentLessonId) return;
        setState((s) => ({
          ...s,
          complete: true,
          gameState: "complete" as GameState,
          liveWpm: result.wpm,
          accuracy: result.accuracy,
          elapsedMs: result.elapsedMs,
          totalKeystrokes: result.totalKeystrokes,
          correctKeystrokes: result.correctKeystrokes,
          maxCombo: result.maxCombo,
        }));
        engineRef.current?.destroy();
        inputRef.current?.destroy();
      });

      // Set paragraph
      setState((s) => ({
        ...s,
        paragraph: engine.getText(),
        charResults: engine.getCharResults().map((r) => ({
          charIndex: r.charIndex,
          char: r.char,
          isCorrect: r.isCorrect,
          isTyped: r.isTyped,
          timestamp: r.timestamp,
        })),
        gameState: "idle" as GameState,
      }));

      setState((s) => ({ ...s, gameState: "countdown" as GameState, countdownValue: 3 }));
    } catch (err) {
      console.error("Failed to start lesson:", err);
    }
  }, [lesson, lessonId]);

  // ── Countdown Sequence ───────────────────────────────

  const startCountdown = useCallback(async (skipToGo = false) => {
    const engine = engineRef.current;
    if (!engine) return;

    if (skipToGo) {
      // Quick start: just flash GO and begin
      setState((s) => ({ ...s, showGo: true }));
      await new Promise((r) => setTimeout(r, 400));
      setState((s) => ({ ...s, showGo: false, gameState: "typing" as GameState }));
      engine.start();
      inputRef.current?.attach();
      return;
    }

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

  // ── Keep lessonIdRef in sync ─────────────────────────

  useEffect(() => {
    lessonIdRef.current = lessonId;
  }, [lessonId]);

  // ── Auto-quick-start on mount ────────────────────────

  useEffect(() => {
    if (quickStartRef.current && state.gameState === "countdown") {
      // Auto-trigger quick start after a brief pause to see the new lesson
      const timer = setTimeout(() => {
        startCountdown(true);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [state.gameState, startCountdown]);

  // ── Start on mount / lesson change ────────────────────

  useEffect(() => {
    startGame();
  }, [startGame]);

  // ── Cleanup on unmount ────────────────────────────────

  useEffect(() => {
    return () => {
      engineRef.current?.destroy();
      inputRef.current?.destroy();
    };
  }, []);

  // ── Render States ────────────────────────────────────

  // Loading
  if (state.gameState === "loading") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4">
        <div
          className="h-8 w-8 animate-spin rounded-full border-2 border-transparent"
          style={{
            borderTopColor: "#22DD44",
            borderRightColor: "#22DD44",
          }}
        />
        <p className="text-xs tracking-[2px]" style={{ color: "var(--text-muted)" }}>
          LOADING LESSON…
        </p>
      </div>
    );
  }

  // Lesson not found
  if (!lesson) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4">
        <p className="text-lg font-black tracking-[3px]" style={{ color: "var(--text-white)" }}>
          LESSON NOT FOUND
        </p>
        <button
          onClick={() => router.push("/learn")}
          className="rounded-lg px-4 py-2 text-xs font-bold tracking-[2px]"
          style={{
            background: "#22DD44",
            color: "#000000",
          }}
        >
          BACK TO LESSONS
        </button>
      </div>
    );
  }

  // Complete
  if (state.complete) {
    const accuracyPct = state.totalKeystrokes > 0
      ? Math.round((state.correctKeystrokes / state.totalKeystrokes) * 100)
      : 100;
    const wpm = state.liveWpm;

    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4">
        <div className="text-center">
          <span className="text-5xl">🎉</span>
          <h1 className="mt-2 text-2xl font-black tracking-[4px]" style={{ color: "#22DD44" }}>
            LESSON COMPLETE!
          </h1>
          <p className="mt-1 text-xs tracking-[2px]" style={{ color: "var(--text-muted)" }}>
            {lesson.name}
          </p>
        </div>

        {/* Stats */}
        <div className="flex gap-4">
          <GlassPanel glow="none" blur="sm" depth={1} className="px-6 py-4 text-center">
            <p className="text-2xl font-black tabular-nums" style={{ color: "#22DD44" }}>
              {wpm}
            </p>
            <p className="text-[10px] font-bold tracking-[2px]" style={{ color: "var(--text-muted)" }}>
              WPM
            </p>
          </GlassPanel>
          <GlassPanel glow="none" blur="sm" depth={1} className="px-6 py-4 text-center">
            <p className="text-2xl font-black tabular-nums" style={{ color: "#FFCC00" }}>
              {accuracyPct}%
            </p>
            <p className="text-[10px] font-bold tracking-[2px]" style={{ color: "var(--text-muted)" }}>
              ACCURACY
            </p>
          </GlassPanel>
          <GlassPanel glow="none" blur="sm" depth={1} className="px-6 py-4 text-center">
            <p className="text-2xl font-black tabular-nums" style={{ color: "#CC44FF" }}>
              {state.maxCombo}
            </p>
            <p className="text-[10px] font-bold tracking-[2px]" style={{ color: "var(--text-muted)" }}>
              BEST COMBO
            </p>
          </GlassPanel>
        </div>

        {/* Actions */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex gap-3">
            <button
              onClick={() => router.push(`/learn/lesson?id=${lessonId}`)}
              className="rounded-xl px-5 py-3 text-xs font-bold tracking-[2px] transition-all hover:scale-105"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "var(--text-body)",
              }}
              title="Try this lesson again"
            >
              🔄 RETRY
            </button>
            <button
              onClick={() => router.push("/learn")}
              className="rounded-xl px-5 py-3 text-xs font-bold tracking-[2px] transition-all hover:scale-105"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "var(--text-body)",
              }}
              title="Back to all lessons"
            >
              ← ALL LESSONS
            </button>
          </div>
          {lessonId < LESSONS.length && (
            <button
              onClick={() => router.push(`/learn/lesson?id=${lessonId + 1}`)}
              title={`Continue to lesson ${lessonId + 1}`}
              className="group relative w-64 overflow-hidden rounded-xl py-3.5 text-sm font-bold tracking-[2px] transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(34,221,68,0.3)]"
              style={{
                background: "linear-gradient(135deg, #22DD44, #44DDAA)",
                color: "#000000",
              }}
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                NEXT LESSON
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="transition-transform duration-200 group-hover:translate-x-1">
                  <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
              <div className="absolute inset-0 -z-0 rounded-xl opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-40"
                style={{ background: "#22DD44" }}
              />
            </button>
          )}
        </div>
      </div>
    );
  }

  // Countdown overlay — skip START button flash for quick-start
  if (state.gameState === "countdown" || state.gameState === "idle") {
    if (quickStartRef.current) {
      // Quick-start: show nothing (or GO overlay) while waiting for auto-trigger
      if (state.showGo) {
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <span
              className="animate-bounce text-8xl font-black tracking-[8px]"
              style={{
                color: "#22DD44",
                textShadow: "0 0 60px rgba(34,221,68,0.6), 0 0 120px rgba(34,221,68,0.3)",
              }}
            >
              GO!
            </span>
          </div>
        );
      }
      // Show nothing during the brief pause before GO
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" />
      );
    }
    return (
      <div className="flex flex-1 flex-col items-center justify-center">
        <CountdownOverlay
          countdownValue={state.countdownValue}
          showGo={state.showGo}
          onStart={startCountdown}
        />
      </div>
    );
  }

  // Active typing
  return (
    <div className="flex flex-1 flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-3 py-2 md:px-6 md:py-3">
        <button
          onClick={() => router.push("/learn")}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-sm transition-colors hover:bg-white/5"
          style={{ color: "var(--text-body)" }}
          title="Back to lesson list"
        >
          ✕
        </button>
        <div className="flex items-center gap-3">
          <span
            className="text-xs font-bold tracking-[2px]"
            style={{ color: "#22DD44" }}
            title={`Lesson ${lesson.id} — ${lesson.category.replace("-", " ").toUpperCase()}`}
          >
            LESSON {lesson.id}
          </span>
          <span className="text-[10px] font-bold tracking-[1px]" style={{ color: "var(--text-muted)" }}>
            {lesson.name}
          </span>
        </div>
        {/* Progress */}
        <div className="flex items-center gap-2">
          <span
            className="text-xs font-bold tabular-nums"
            style={{ color: "var(--text-body)" }}
            title={`Completed: ${state.currentCharIndex} / ${state.paragraph.length} characters`}
          >
            {state.currentCharIndex}/{state.paragraph.length}
          </span>
        </div>
      </header>

      {/* Main area */}
      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4 pb-8">
        {/* Finger Guide */}
        <div className="w-full max-w-lg">
          <FingerGuide
            highlightKeys={lesson.focusKeys}
            allowedKeys={lesson.allowedKeys}
          />
        </div>

        {/* Paragraph */}
        <div className="w-full max-w-lg">
          <GlassPanel glow="none" blur="sm" depth={1} className="p-4 md:p-6">
            <ParagraphDisplay
              paragraph={state.paragraph}
              charResults={state.charResults}
              currentCharIndex={state.currentCharIndex}
              gameState={state.gameState}
            />
          </GlassPanel>
        </div>

        {/* Live Stats */}
        <div className="flex items-center gap-6">
          <div className="group text-center">
            <p className="text-lg font-black tabular-nums" style={{ color: "#22DD44" }}>
              {state.liveWpm}
            </p>
            <p className="text-[9px] font-bold tracking-[1.5px]" style={{ color: "var(--text-muted)" }}>
              WPM
            </p>
            <span className="block text-[8px] tracking-[0.5px] opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "var(--text-muted)" }}>
              Words per minute
            </span>
          </div>
          <div className="group text-center">
            <p className="text-lg font-black tabular-nums" style={{ color: "#FFCC00" }}>
              {state.totalKeystrokes > 0
                ? Math.round((state.correctKeystrokes / state.totalKeystrokes) * 100)
                : 100}%
            </p>
            <p className="text-[9px] font-bold tracking-[1.5px]" style={{ color: "var(--text-muted)" }}>
              ACC
            </p>
            <span className="block text-[8px] tracking-[0.5px] opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "var(--text-muted)" }}>
              Accuracy
            </span>
          </div>
          <div className="group text-center">
            <p className="text-lg font-black tabular-nums" style={{ color: "#CC44FF" }}>
              {state.combo}
            </p>
            <p className="text-[9px] font-bold tracking-[1.5px]" style={{ color: "var(--text-muted)" }}>
              COMBO
            </p>
            <span className="block text-[8px] tracking-[0.5px] opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "var(--text-muted)" }}>
              Consecutive correct
            </span>
          </div>
        </div>
      </div>

      {/* Kinetic text overlay */}
      <KineticText text={state.showKineticText} />
    </div>
  );
}

// ── Page (with Suspense for useSearchParams) ────────────

export default function LessonPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 flex-col items-center justify-center gap-4">
          <div
            className="h-8 w-8 animate-spin rounded-full border-2 border-transparent"
            style={{
              borderTopColor: "#22DD44",
              borderRightColor: "#22DD44",
            }}
          />
          <p className="text-xs tracking-[2px]" style={{ color: "var(--text-muted)" }}>
            LOADING LESSON…
          </p>
        </div>
      }
    >
      <LessonContent />
    </Suspense>
  );
}
