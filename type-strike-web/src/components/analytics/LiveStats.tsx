"use client";

import { useMemo } from "react";
import GlassPanel from "@/components/ui/GlassPanel";
import ConsistencyGraph from "./ConsistencyGraph";

interface DataPoint {
  wpm: number;
  raw: number;
  net: number;
  accuracy: number;
}

interface LiveStatsProps {
  data: DataPoint[];
  currentWpm: number;
  rawWpm: number;
  netWpm: number;
  accuracy: number;
  consistency: number;
  peakWpm: number;
  className?: string;
}

export default function LiveStats({
  data,
  currentWpm,
  rawWpm,
  netWpm,
  accuracy,
  consistency,
  peakWpm,
  className = "",
}: LiveStatsProps) {
  const tank = useMemo(
    () =>
      accuracy >= 0.98
        ? "green"
        : accuracy >= 0.95
        ? "gold"
        : accuracy >= 0.85
        ? "magma"
        : "red",
    [accuracy]
  );

  const tankColor =
    tank === "green"
      ? "var(--success-green)"
      : tank === "gold"
      ? "var(--accent-gold)"
      : tank === "magma"
      ? "var(--accent-primary)"
      : "var(--error-red)";

  return (
    <GlassPanel glow="magma" blur="md" depth={2} className={`p-4 ${className}`}>
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[10px] font-bold tracking-[2px] text-text-muted">
          LIVE STATS
        </span>
        <span
          className="text-xl font-black tabular-nums"
          style={{ color: tankColor }}
        >
          {currentWpm}
          <span className="ml-1 text-[10px] font-bold tracking-[1px] text-text-muted">
            WPM
          </span>
        </span>
      </div>

      {/* Stat Quads */}
      <div className="mb-3 grid grid-cols-4 gap-2">
        {[
          { label: "WPM", value: currentWpm, color: tankColor },
          { label: "RAW", value: rawWpm, color: "var(--electric-cyan)" },
          { label: "NET", value: netWpm, color: "var(--plasma-purple)" },
          {
            label: "ACC",
            value: `${(accuracy * 100).toFixed(0)}%`,
            color: tankColor,
          },
        ].map((stat) => (
          <div key={stat.label} className="rounded-lg bg-black/20 p-2 text-center">
            <p
              className="text-lg font-black tabular-nums"
              style={{ color: stat.color }}
            >
              {stat.value}
            </p>
            <p className="mt-0.5 text-[8px] font-bold tracking-[1.5px] text-text-muted">
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      {/* Consistency Graph */}
      <div className="mb-2 h-16 w-full">
        <ConsistencyGraph data={data} />
      </div>

      {/* Footer Metrics */}
      <div className="flex items-center justify-between text-[9px] text-text-muted">
        <span>
          Consistency:{" "}
          <span className="font-bold text-text-body">{consistency.toFixed(0)}%</span>
        </span>
        <span>
          Peak:{" "}
          <span className="font-bold text-electric-cyan">{peakWpm} WPM</span>
        </span>
      </div>
    </GlassPanel>
  );
}
