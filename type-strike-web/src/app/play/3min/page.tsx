"use client";

import { useEffect } from "react";
import { useGameplay } from "@/hooks/useGameplay";
import GameplayUI from "@/components/game/GameplayUI";

export default function Timed3MinPage() {
  const { state, dataPoints, startGame, startCountdown } = useGameplay("timed_3min");

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
