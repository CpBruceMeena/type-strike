"use client";

import { useEffect } from "react";
import { useGameplay } from "@/hooks/useGameplay";
import GameplayUI from "@/components/game/GameplayUI";

export default function ContestPage() {
  const { state, dataPoints, startGame, startCountdown } = useGameplay("contest");

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
