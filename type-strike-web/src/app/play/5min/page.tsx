"use client";

import { useEffect } from "react";
import { useGameplay } from "@/hooks/useGameplay";
import GameplayUI from "@/components/game/GameplayUI";

export default function Timed5MinPage() {
  const { state, dataPoints, startGame, startCountdown } = useGameplay("timed_5min");

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
