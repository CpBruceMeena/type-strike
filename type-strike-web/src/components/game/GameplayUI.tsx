"use client";

/**
 * Type Strike — GameplayUI
 *
 * Full-bleed gameplay arena with HUD-style stat overlays.
 * Paragraph fills the full width, stats overlay at the bottom
 * like a gaming HUD. Desktop: side-by-side paragraph + analytics.
 * Mobile: stacked layout.
 */

import { useRouter } from "next/navigation";
import GlassPanel from "@/components/ui/GlassPanel";
import LiveStats from "@/components/analytics/LiveStats";
import ParagraphDisplay from "./ParagraphDisplay";

import ComboGauge from "./ComboGauge";
import CountdownOverlay from "./CountdownOverlay";
import KineticText from "./KineticText";
import type { GameplayUIState } from "@/lib/types";

interface GameplayUIProps {
  state: GameplayUIState;
  dataPoints: Array<{ wpm: number; raw: number; net: number; accuracy: number }>;
  onStartCountdown: () => void;
}

export default function GameplayUI({
  state,
  dataPoints,
  onStartCountdown,
}: GameplayUIProps) {
  const router = useRouter();

  // ── Loading state ────────────────────────────────────
  if (state.gameState === "loading") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4">
        <div
          className="h-8 w-8 animate-spin rounded-full border-2 border-transparent"
          style={{
            borderTopColor: "var(--accent-primary)",
            borderRightColor: "var(--accent-primary)",
          }}
        />
        <p className="text-xs tracking-[2px]" style={{ color: "var(--text-muted)" }}>
          PREPARING ARENA…
        </p>
      </div>
    );
  }

  // ── Countdown overlay ────────────────────────────────
  if (state.gameState === "countdown" || state.gameState === "idle") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center">
        <CountdownOverlay
          countdownValue={state.countdownValue}
          showGo={state.showGo}
          onStart={onStartCountdown}
        />
      </div>
    );
  }

  // ── Typing / Mistake gameplay ─────────────────────────
  const isActive = state.gameState === "typing" || state.gameState === "mistake";
  if (!isActive) {
    // Game is done, will redirect
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4">
        <p className="text-lg font-black tracking-[3px]" style={{ color: "var(--text-white)" }}>
          {state.gameState === "complete" ? "COMPLETE!" : "FAILED"}
        </p>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          {state.finalWpm} WPM • {(state.finalAccuracy * 100).toFixed(0)}% ACC
        </p>
      </div>
    );
  }

  const modeLabel = state.mode === "contest" ? "CONTEST" : state.mode.replace("timed_", "").toUpperCase();

  return (
    <div className="flex flex-1 flex-col h-full">
      {/* ── Arena header ────────────────────────────── */}
      <header className="flex items-center justify-between px-3 py-2 md:px-6 md:py-3">
        <button
          onClick={() => router.push("/home")}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-sm transition-colors hover:bg-white/5"
          style={{ color: "var(--text-body)" }}
        >
          ✕
        </button>

        <div className="flex items-center gap-4">
          {/* Mode badge */}
          <span
            className="text-xs font-bold tracking-[2px] md:text-sm"
            style={{ color: "var(--text-white)" }}
          >
            {modeLabel}
          </span>

          {/* Timer */}
          {state.timeRemaining !== null && (
            <div className="flex items-center gap-2">
              <div
                className="h-1.5 w-24 overflow-hidden rounded-full md:w-32"
                style={{ background: "rgba(255,255,255,0.08)" }}
              >
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: state.timeRemaining > 0 && (state.elapsedMs + state.timeRemaining) > 0
                      ? `${(state.timeRemaining / (state.elapsedMs + state.timeRemaining)) * 100}%`
                      : "100%",
                    background: state.timeRemaining < 30000
                      ? "var(--error-red)"
                      : "var(--accent-primary)",
                  }}
                />
              </div>
              <span
                className="min-w-[44px] text-right text-sm font-bold tabular-nums"
                style={{
                  color: state.timeRemaining < 30000
                    ? "var(--error-red)"
                    : "var(--text-body)",
                }}
              >
                {formatTime(state.timeRemaining)}
              </span>
            </div>
          )}
        </div>
      </header>

      {/* ── Main gameplay area ──────────────────────── */}
      <div className="flex flex-1 flex-col md:flex-row md:gap-6 px-3 md:px-8 pb-4 overflow-hidden">
        {/* Paragraph area - takes most of the space */}
        <div className="flex-1 flex flex-col justify-center min-w-0">
          <ParagraphDisplay
            paragraph={state.paragraph}
            charResults={state.charResults}
            currentCharIndex={state.currentCharIndex}
            gameState={state.gameState}
          />
        </div>

        {/* Stats sidebar - HUD panel on desktop */}
        <div className="md:w-[320px] lg:w-[380px] xl:w-[420px] flex flex-col gap-3 mt-3 md:mt-0">
          {/* Combo gauge + Stats header row */}
          <div className="grid grid-cols-2 gap-3">
            <GlassPanel glow="magma" blur="sm" depth={1} className="px-4 py-3">
              <ComboGauge
                combo={state.combo}
                maxCombo={state.maxCombo}
                gaugeProgress={state.gaugeProgress}
                activeTierIndex={state.activeComboTierIndex}
              />
            </GlassPanel>

            {/* Quick time/char info */}
            <GlassPanel glow="magma" blur="sm" depth={1} className="flex items-center justify-center px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="text-center">
                  <p className="text-lg font-black tabular-nums" style={{ color: "var(--text-body)" }}>
                    {state.currentCharIndex}
                    <span className="text-[10px] ml-0.5 opacity-50">/{state.paragraph.length}</span>
                  </p>
                  <p className="text-[9px] font-bold tracking-[1.5px]" style={{ color: "var(--text-muted)" }}>
                    CHARS
                  </p>
                </div>
                <div className="h-8 w-px" style={{ background: "rgba(255,255,255,0.06)" }} />
                <div className="text-center">
                  <p className="text-lg font-black tabular-nums" style={{ color: "var(--electric-cyan)" }}>
                    {state.liveWpm}
                  </p>
                  <p className="text-[9px] font-bold tracking-[1.5px]" style={{ color: "var(--text-muted)" }}>
                    WPM
                  </p>
                </div>
              </div>
            </GlassPanel>
          </div>

          {/* Live analytics - scrollable on mobile, fixed height on desktop */}
          <div className="flex-1 min-h-0 overflow-y-auto">
            <LiveStats
              data={dataPoints}
              currentWpm={state.liveWpm}
              rawWpm={state.liveWpm}
              netWpm={Math.round(state.liveWpm * state.accuracy)}
              accuracy={state.accuracy}
              consistency={
                dataPoints.length > 1
                  ? calculateConsistency(dataPoints.map((p) => p.wpm))
                  : 100
              }
              peakWpm={dataPoints.length > 0 ? Math.max(...dataPoints.map((p) => p.wpm)) : 0}
            />
          </div>
        </div>
      </div>

      {/* Kinetic text overlay */}
      <KineticText text={state.showKineticText} />
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────

function formatTime(ms: number): string {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, "0")}`;
}

function calculateConsistency(wpmSamples: number[]): number {
  if (wpmSamples.length < 2) return 100;
  const avg = wpmSamples.reduce((s, v) => s + v, 0) / wpmSamples.length;
  if (avg === 0) return 100;
  const variance =
    wpmSamples.reduce((s, v) => s + (v - avg) ** 2, 0) / wpmSamples.length;
  const stdDev = Math.sqrt(variance);
  const cv = stdDev / avg;
  return Math.max(0, Math.round((1 - cv) * 100));
}
