"use client";

import { useEffect } from "react";
import { useGameplay } from "@/hooks/useGameplay";
import { usePlayer } from "@/hooks/usePlayer";
import GameplayUI from "@/components/game/GameplayUI";

export default function Timed5MinPage() {
  const { playerId } = usePlayer();
  const { state, dataPoints, startGame, startCountdown } = useGameplay("timed_5min", playerId ?? undefined);

  useEffect(() => {
    startGame();
  }, [startGame]);

  return (
    <GameplayUI
      state={state}
      dataPoints={dataPoints}
      onStartCountdown={startCountdown}
      onRetry={startGame}
    />
  );
}
