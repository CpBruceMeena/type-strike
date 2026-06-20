"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useLevelGameplay } from "@/hooks/useLevelGameplay";
import GameplayUI from "@/components/game/GameplayUI";

function LevelPlayContent() {
  const searchParams = useSearchParams();
  const levelId = parseInt(searchParams.get("id") ?? "1", 10);

  const { state, dataPoints, startGame, startCountdown } = useLevelGameplay(levelId);

  useEffect(() => {
    startGame();
  }, [startGame]);

  return (
    <GameplayUI
      state={state}
      dataPoints={dataPoints}
      onStartCountdown={startCountdown}
    />
  );
}

export default function LevelPlayPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 flex-col items-center justify-center gap-4">
          <div
            className="h-8 w-8 animate-spin rounded-full border-2 border-transparent"
            style={{
              borderTopColor: "var(--accent-primary)",
              borderRightColor: "var(--accent-primary)",
            }}
          />
          <p className="text-xs tracking-[2px]" style={{ color: "var(--text-muted)" }}>
            LOADING LEVEL…
          </p>
        </div>
      }
    >
      <LevelPlayContent />
    </Suspense>
  );
}
