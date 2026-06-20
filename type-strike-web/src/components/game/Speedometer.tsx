"use client";

import { useMemo } from "react";

interface SpeedometerProps {
  wpm: number;
  maxWpm?: number;
  accuracy?: number;
  charsProgress?: { current: number; total: number };
  className?: string;
}

// ── Helpers ──────────────────────────────────────────────

function polarToCartesian(
  cx: number,
  cy: number,
  r: number,
  angleDeg: number
): { x: number; y: number } {
  // 0° = top (12 o'clock), clockwise
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

function describeArc(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number
): string {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const sweep = endAngle - startAngle;
  const large = sweep > 180 ? 1 : 0;
  // sweep-flag=0 for counter-clockwise (going through top)
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${large} 0 ${end.x} ${end.y}`;
}

// ── Color Zones ──────────────────────────────────────────

const ZONES = [
  { min: 0, max: 30, color: "#00F0FF", label: "WARM UP" },
  { min: 30, max: 60, color: "#22FF44", label: "GOOD" },
  { min: 60, max: 90, color: "#FF6600", label: "FAST" },
  { min: 90, max: 140, color: "#FF5020", label: "BLAZING" },
  { min: 140, max: 200, color: "#FF00AA", label: "FURY" },
];

function getColor(wpm: number): string {
  for (const z of ZONES) {
    if (wpm >= z.min && wpm < z.max) return z.color;
  }
  return ZONES[ZONES.length - 1].color;
}

function getZoneLabel(wpm: number): string {
  for (const z of ZONES) {
    if (wpm >= z.min && wpm < z.max) return z.label;
  }
  return ZONES[ZONES.length - 1].label;
}

// ── Component ────────────────────────────────────────────

export default function Speedometer({
  wpm,
  maxWpm = 200,
  accuracy,
  charsProgress,
  className = "",
}: SpeedometerProps) {
  // Arc params: 180° semi-circle opening at bottom (arc from 180° left to 0° right)
  const ARC_START = 180;
  const ARC_END = 0; // treated as 360 for calculation
  const ARC_SWEEP = 180;

  const cx = 100;
  const cy = 100;
  const outerR = 88;
  const innerR = 72;
  const tickR = 80;

  const progress = Math.min(wpm / maxWpm, 1);
  const currentAngle = ARC_START + ARC_SWEEP * progress;
  const color = useMemo(() => getColor(wpm), [wpm]);
  const zoneLabel = useMemo(() => getZoneLabel(wpm), [wpm]);

  // Track arc (full range)
  const trackArc = describeArc(cx, cy, outerR, ARC_START, 360);

  // Filled arc (progress from 0 to current)
  const filledEnd = ARC_START + ARC_SWEEP * progress;
  const filledArc = describeArc(cx, cy, outerR, ARC_START, filledEnd);

  // Needle
  const needleTip = polarToCartesian(cx, cy, outerR - 10, currentAngle);
  const needleBase = polarToCartesian(cx, cy, 18, currentAngle);

  // Tick marks (every 10 units)
  const ticks = [];
  for (let v = 0; v <= maxWpm; v += 10) {
    const p = v / maxWpm;
    const angle = ARC_START + ARC_SWEEP * p;
    const outer = polarToCartesian(cx, cy, tickR, angle);
    const inner = polarToCartesian(cx, cy, tickR - (v % 20 === 0 ? 8 : 4), angle);
    ticks.push({ x1: outer.x, y1: outer.y, x2: inner.x, y2: inner.y, major: v % 20 === 0, value: v });
  }

  // Speed labels at major ticks
  const labels = [];
  for (let v = 0; v <= maxWpm; v += 20) {
    const p = v / maxWpm;
    const angle = ARC_START + ARC_SWEEP * p;
    const pos = polarToCartesian(cx, cy, tickR + 14, angle);
    labels.push({ x: pos.x, y: pos.y, value: v });
  }

  // Gray arc for inner track ring
  const grayArc = describeArc(cx, cy, innerR, ARC_START, 360);

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <svg
        viewBox="0 0 200 140"
        className="h-full w-full"
        style={{ filter: "drop-shadow(0 0 20px rgba(255,80,32,0.15))" }}
      >
        {/* Background track */}
        <path
          d={trackArc}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="16"
          strokeLinecap="round"
        />

        {/* Inner ring */}
        <path
          d={grayArc}
          fill="none"
          stroke="rgba(255,255,255,0.03)"
          strokeWidth="4"
          strokeLinecap="round"
        />

        {/* Filled progress arc */}
        <path
          d={filledArc}
          fill="none"
          stroke={color}
          strokeWidth="16"
          strokeLinecap="round"
          style={{
            transition: "stroke 0.3s ease, d 0.15s ease",
            filter: `drop-shadow(0 0 8px ${color}60)`,
          }}
        />

        {/* Tick marks */}
        {ticks.map((t, i) => (
          <line
            key={i}
            x1={t.x1}
            y1={t.y1}
            x2={t.x2}
            y2={t.y2}
            stroke={wpm >= t.value ? color : "rgba(255,255,255,0.12)"}
            strokeWidth={t.major ? 2 : 1}
            strokeLinecap="round"
            opacity={t.major ? 0.8 : 0.4}
          />
        ))}

        {/* Speed labels */}
        {labels.map((l, i) => (
          <text
            key={i}
            x={l.x}
            y={l.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="rgba(255,255,255,0.25)"
            fontSize="7"
            fontFamily="system-ui"
            fontWeight="600"
          >
            {l.value}
          </text>
        ))}

        {/* Needle shadow */}
        <line
          x1={needleBase.x}
          y1={needleBase.y}
          x2={needleTip.x}
          y2={needleTip.y}
          stroke="rgba(0,0,0,0.4)"
          strokeWidth="5"
          strokeLinecap="round"
          style={{
            transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
          }}
        />

        {/* Needle */}
        <line
          x1={needleBase.x}
          y1={needleBase.y}
          x2={needleTip.x}
          y2={needleTip.y}
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          style={{
            transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
            filter: `drop-shadow(0 0 6px ${color}80)`,
          }}
        />

        {/* Needle center dot */}
        <circle
          cx={cx}
          cy={cy}
          r="8"
          fill="var(--bg-primary)"
          stroke={color}
          strokeWidth="2.5"
          style={{
            transition: "stroke 0.3s ease",
            filter: `drop-shadow(0 0 8px ${color}60)`,
          }}
        />
        <circle cx={cx} cy={cy} r="3" fill={color} style={{ transition: "fill 0.3s ease" }} />

        {/* WPM value */}
        <text
          x={cx}
          y={cy - 22}
          textAnchor="middle"
          dominantBaseline="middle"
          fill={color}
          fontSize="28"
          fontFamily="system-ui"
          fontWeight="900"
          style={{
            transition: "fill 0.3s ease",
            filter: `drop-shadow(0 0 12px ${color}40)`,
          }}
        >
          {wpm}
        </text>

        {/* WPM label */}
        <text
          x={cx}
          y={cy - 4}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="rgba(255,255,255,0.3)"
          fontSize="9"
          fontFamily="system-ui"
          fontWeight="700"
          letterSpacing="3"
        >
          WPM
        </text>

        {/* Zone label */}
        <text
          x={cx}
          y={cy + 14}
          textAnchor="middle"
          dominantBaseline="middle"
          fill={color}
          fontSize="8"
          fontFamily="system-ui"
          fontWeight="800"
          letterSpacing="2"
          style={{ transition: "fill 0.3s ease" }}
        >
          {zoneLabel}
        </text>

        {/* Bottom stats row */}
        {accuracy !== undefined && (
          <text
            x={45}
            y={135}
            textAnchor="middle"
            dominantBaseline="middle"
            fill={accuracy >= 0.95 ? "var(--accent-gold)" : "rgba(255,255,255,0.4)"}
            fontSize="11"
            fontFamily="system-ui"
            fontWeight="800"
          >
            {(accuracy * 100).toFixed(0)}%
          </text>
        )}
        {accuracy !== undefined && (
          <text
            x={45}
            y={125}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="rgba(255,255,255,0.2)"
            fontSize="6"
            fontFamily="system-ui"
            fontWeight="700"
            letterSpacing="2"
          >
            ACC
          </text>
        )}

        {charsProgress && (
          <>
            <text
              x={155}
              y={135}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="rgba(255,255,255,0.4)"
              fontSize="11"
              fontFamily="system-ui"
              fontWeight="800"
            >
              {charsProgress.current}
            </text>
            <text
              x={155}
              y={125}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="rgba(255,255,255,0.2)"
              fontSize="6"
              fontFamily="system-ui"
              fontWeight="700"
              letterSpacing="2"
            >
              CHARS
            </text>
          </>
        )}
      </svg>
    </div>
  );
}
