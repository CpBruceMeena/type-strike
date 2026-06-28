"use client";

import { motion } from "framer-motion";
import { FINGER_COLORS, KEY_FINGER_MAP, FINGER_LABELS } from "@/lib/lessons";
import type { FingerName } from "@/lib/lessons";

// ── Keyboard Layout ─────────────────────────────────────

interface KeyConfig {
  label: string;
  row: number;
  col: number;
  width?: number; // 1 = standard, 1.5 = wider, 2 = double width
}

const KEYBOARD_ROWS: KeyConfig[][] = [
  // Row 0: Number row
  [
    { label: "`", row: 0, col: 0, width: 1.3 },
    { label: "1", row: 0, col: 1 }, { label: "2", row: 0, col: 2 },
    { label: "3", row: 0, col: 3 }, { label: "4", row: 0, col: 4 },
    { label: "5", row: 0, col: 5 }, { label: "6", row: 0, col: 6 },
    { label: "7", row: 0, col: 7 }, { label: "8", row: 0, col: 8 },
    { label: "9", row: 0, col: 9 }, { label: "0", row: 0, col: 10 },
    { label: "-", row: 0, col: 11 }, { label: "=", row: 0, col: 12, width: 1.3 },
  ],
  // Row 1: Top letter row (QWERTYUIOP)
  [
    { label: "q", row: 1, col: 0, width: 1.2 },
    { label: "w", row: 1, col: 1 }, { label: "e", row: 1, col: 2 },
    { label: "r", row: 1, col: 3 }, { label: "t", row: 1, col: 4 },
    { label: "y", row: 1, col: 5 }, { label: "u", row: 1, col: 6 },
    { label: "i", row: 1, col: 7 }, { label: "o", row: 1, col: 8 },
    { label: "p", row: 1, col: 9 }, { label: "[", row: 1, col: 10, width: 1.2 },
    { label: "]", row: 1, col: 11, width: 1.3 },
    { label: "\\", row: 1, col: 12, width: 1.5 },
  ],
  // Row 2: Home row (ASDFGHJKL;)
  [
    { label: "a", row: 2, col: 0, width: 1.4 },
    { label: "s", row: 2, col: 1 }, { label: "d", row: 2, col: 2 },
    { label: "f", row: 2, col: 3 }, { label: "g", row: 2, col: 4 },
    { label: "h", row: 2, col: 5 }, { label: "j", row: 2, col: 6 },
    { label: "k", row: 2, col: 7 }, { label: "l", row: 2, col: 8 },
    { label: ";", row: 2, col: 9 }, { label: "'", row: 2, col: 10, width: 1.3 },
  ],
  // Row 3: Bottom row (ZXCVBNM,./)
  [
    { label: "z", row: 3, col: 0, width: 1.6 },
    { label: "x", row: 3, col: 1 }, { label: "c", row: 3, col: 2 },
    { label: "v", row: 3, col: 3 }, { label: "b", row: 3, col: 4 },
    { label: "n", row: 3, col: 5 }, { label: "m", row: 3, col: 6 },
    { label: ",", row: 3, col: 7 }, { label: ".", row: 3, col: 8 },
    { label: "/", row: 3, col: 9, width: 1.6 },
  ],
  // Row 4: Space bar row
  [
    { label: "space", row: 4, col: 0, width: 11 },
  ],
];

// ── Get finger for a key ────────────────────────────────

function getFinger(key: string): FingerName | null {
  return KEY_FINGER_MAP[key.toLowerCase()] ?? null;
}

function getFingerColor(key: string): string | null {
  const finger = getFinger(key);
  return finger ? FINGER_COLORS[finger] : null;
}

// ── Props ────────────────────────────────────────────────

interface Keyboard3DProps {
  highlightKeys?: string[];
  allowedKeys?: string[];
  showLabels?: boolean;
  className?: string;
}

// ── Component ────────────────────────────────────────────

export default function Keyboard3D({
  highlightKeys = [],
  allowedKeys,
  showLabels = true,
  className = "",
}: Keyboard3DProps) {
  const highlightSet = new Set(highlightKeys.map((k) => k.toLowerCase()));

  // Determine which fingers are highlighted
  const highlightedFingers = new Set<FingerName>();
  for (const key of highlightKeys) {
    const finger = getFinger(key);
    if (finger) highlightedFingers.add(finger);
  }

  return (
    <div className={`${className}`}>
      {showLabels && highlightedFingers.size > 0 && (
        <div className="mb-3 flex flex-wrap items-center justify-center gap-2">
          {Array.from(highlightedFingers).map((finger) => {
            const fingerColor = FINGER_COLORS[finger];
            const fingerLabel = FINGER_LABELS[finger];
            const hand = finger.startsWith("left") ? "Left" : "Right";
            return (
              <motion.div
                key={finger}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[9px] font-bold"
                style={{
                  background: `${fingerColor}20`,
                  border: `1px solid ${fingerColor}40`,
                  color: fingerColor,
                }}
              >
                <div className="h-2 w-2 rounded-full" style={{ background: fingerColor }} />
                {hand} {fingerLabel}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* 3D Keyboard Container */}
      <div
        className="mx-auto max-w-[420px]"
        style={{
          perspective: "800px",
          perspectiveOrigin: "50% 30%",
        }}
      >
        <motion.div
          initial={{ rotateX: 25, opacity: 0, y: 20 }}
          animate={{ rotateX: 25, opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="rounded-xl bg-neutral-900/80 p-2.5 border border-neutral-800/60 shadow-[0_10px_40px_rgba(0,0,0,0.4)]"
          style={{
            transformStyle: "preserve-3d",
            transform: "rotateX(25deg)",
          }}
        >
          {KEYBOARD_ROWS.map((row, rowIdx) => (
            <div key={rowIdx} className="flex gap-[3px] mb-[3px] last:mb-0 justify-center">
              {row.map((key) => {
                const lowerLabel = key.label.toLowerCase();
                const finger = key.label === "space" ? null : getFinger(key.label);
                const fingerColor = finger ? FINGER_COLORS[finger] : null;
                const isHighlighted = highlightSet.has(lowerLabel);
                const isAllowed = allowedKeys
                  ? new Set(allowedKeys.map((k) => k.toLowerCase())).has(lowerLabel)
                  : true;

                // Opacity based on allowed status
                const keyOpacity = isAllowed ? 1 : 0.25;

                return (
                  <motion.div
                    key={key.label}
                    layout
                    className="relative flex items-center justify-center rounded-[6px] text-[10px] font-bold font-mono select-none transition-shadow"
                    style={{
                      width: `${(key.width ?? 1) * 100}%`,
                      height: 32,
                      opacity: keyOpacity,
                      background: isHighlighted
                        ? `${fingerColor}25`
                        : "rgba(255,255,255,0.04)",
                      border: isHighlighted
                        ? `1.5px solid ${fingerColor}60`
                        : "1px solid rgba(255,255,255,0.06)",
                      color: isHighlighted
                        ? fingerColor ?? "#e4e4e7"
                        : key.label === "space" ? "#52525b" : "#71717a",
                      boxShadow: isHighlighted
                        ? `0 0 12px ${fingerColor}20, inset 0 0 8px ${fingerColor}10`
                        : "none",
                      transformStyle: "preserve-3d",
                    }}
                    whileHover={isHighlighted && key.label !== "space" ? { scale: 1.08, z: 8 } : { scale: 1.02 }}
                    whileTap={isHighlighted && key.label !== "space" ? { scale: 0.95, z: -4 } : undefined}
                    animate={isHighlighted ? {
                      boxShadow: [
                        `0 0 8px ${fingerColor}15`,
                        `0 0 16px ${fingerColor}30`,
                        `0 0 8px ${fingerColor}15`,
                      ],
                    } : {}}
                    transition={isHighlighted ? {
                      boxShadow: { repeat: Infinity, duration: 2 },
                    } : {}}
                  >
                    {key.label}

                    {/* Finger indicator dot */}
                    {isHighlighted && fingerColor && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full"
                        style={{ background: fingerColor }}
                      />
                    )}
                  </motion.div>
                );
              })}
            </div>
          ))}
        </motion.div>
      </div>

      {/* Legend */}
      {showLabels && (
        <div className="mt-3 flex items-center justify-center gap-3 text-[8px] tracking-[1px] text-neutral-600 font-bold uppercase">
          <span>⌨️ QWERTY</span>
          {highlightKeys.length > 0 && (
            <>
              <span>·</span>
              <span className="text-orange-400/60">
                Focus: {highlightKeys.join(", ")}
              </span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
