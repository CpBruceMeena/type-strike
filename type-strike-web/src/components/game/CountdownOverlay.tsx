"use client";

import { useEffect, useState } from "react";

interface CountdownOverlayProps {
  countdownValue: number;
  showGo: boolean;
  onStart: () => void;
}

export default function CountdownOverlay({
  countdownValue,
  showGo,
  onStart,
}: CountdownOverlayProps) {
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (started) {
      onStart();
    }
  }, [started, onStart]);

  if (showGo) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
        <span
          className="animate-bounce text-8xl font-black tracking-[8px]"
          style={{
            color: "var(--accent-primary)",
            textShadow: "0 0 60px rgba(255,80,32,0.6), 0 0 120px rgba(255,80,32,0.3)",
          }}
        >
          GO!
        </span>
      </div>
    );
  }

  if (started) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
        <span
          key={countdownValue}
          className="animate-float text-9xl font-black"
          style={{
            color: "var(--text-white)",
            textShadow: "0 0 40px rgba(255,80,32,0.4)",
          }}
        >
          {countdownValue}
        </span>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <button
        onClick={() => setStarted(true)}
        className="group relative flex flex-col items-center gap-3 rounded-3xl border-2 border-[var(--accent-primary)] px-12 py-8 transition-all duration-300 hover:scale-105 hover:shadow-[0_0_60px_rgba(255,80,32,0.3)]"
        style={{
          background: "linear-gradient(135deg, rgba(255,80,32,0.15), rgba(255,80,32,0.05))",
        }}
      >
        {/* Glow behind button */}
        <div
          className="absolute inset-0 -z-10 rounded-3xl opacity-30 blur-2xl transition-opacity duration-500 group-hover:opacity-60"
          style={{ background: "var(--accent-primary)" }}
        />
        <span className="text-4xl">🔥</span>
        <span className="text-2xl font-black tracking-[4px]" style={{ color: "var(--text-white)" }}>
          START
        </span>
        <span className="text-xs tracking-[2px]" style={{ color: "var(--text-muted)" }}>
          Type with fury. Strike with fire.
        </span>
      </button>
    </div>
  );
}
