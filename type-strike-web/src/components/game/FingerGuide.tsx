"use client";

/**
 * Type Strike — FingerGuide
 *
 * Visual keyboard overlay showing finger placement for touch typing.
 * Highlights the target key(s) for the current lesson and color-codes
 * each key based on which finger should press it.
 */

import { KEY_FINGER_MAP, FINGER_COLORS, FINGER_LABELS, type FingerName } from "@/lib/lessons";

interface FingerGuideProps {
  /** Keys to highlight (the current lesson's focus keys) */
  highlightKeys?: string[];
  /** All keys the user has learned so far */
  allowedKeys?: string[];
}

// ── Keyboard Layout ────────────────────────────────────

const ROWS = [
  ["`", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-", "=", "Bksp"],
  ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p", "[", "]", "\\"],
  ["a", "s", "d", "f", "g", "h", "j", "k", "l", ";", "'", "Enter"],
  ["z", "x", "c", "v", "b", "n", "m", ",", ".", "/", "Shift"],
];

const HAND_SPLIT = 5; // Split point between left and right hand on each row

// ── Component ──────────────────────────────────────────

export default function FingerGuide({ highlightKeys = [], allowedKeys = [] }: FingerGuideProps) {
  const focusSet = new Set(highlightKeys);
  const allowedSet = new Set(allowedKeys);

  return (
    <div className="w-full max-w-lg mx-auto">
      {/* Finger legend */}
      <div className="flex items-center justify-center gap-3 mb-3 flex-wrap">
        {([
          ["left-pinky", "Left Pinky"],
          ["left-ring", "Left Ring"],
          ["left-middle", "Left Mid"],
          ["left-index", "Left Idx"],
          ["right-index", "Right Idx"],
          ["right-middle", "Right Mid"],
          ["right-ring", "Right Ring"],
          ["right-pinky", "Right Pnk"],
        ] as [FingerName, string][]).map(([finger, label]) => (
          <div key={finger} className="flex items-center gap-1.5">
            <div
              className="h-2.5 w-2.5 rounded-full"
              style={{ background: FINGER_COLORS[finger] }}
            />
            <span className="text-[9px] font-bold tracking-[0.5px]" style={{ color: "var(--text-muted)" }}>
              {label}
            </span>
          </div>
        ))}
      </div>

      {/* Keyboard — bigger keys for better visibility */}
      <div className="flex flex-col items-center gap-1">
        {ROWS.map((row, rowIndex) => (
          <div
            key={rowIndex}
            className="flex items-center justify-center gap-1"
            style={{
              paddingLeft: rowIndex === 0 ? "0px" : rowIndex === 2 ? "8px" : "16px",
            }}
          >
            {row.map((key) => {
              const finger = KEY_FINGER_MAP[key];
              const color = finger ? FINGER_COLORS[finger] : "#555555";
              const isFocus = focusSet.has(key);
              const isLearned = allowedSet.has(key) || allowedSet.size === 0;

              const isSpecialKey = key.length > 1;
              const keyWidth = isSpecialKey ? "64px" : "40px";
              const keyHeight = "40px";

              return (
                <div
                  key={key}
                  title={isSpecialKey ? (key === "Bksp" ? "Backspace" : key === "Enter" ? "Enter" : key === "Shift" ? "Shift" : key) : finger ? `${key.toUpperCase()} — ${FINGER_LABELS[finger]} (${finger.includes("left") ? "Left" : "Right"} hand)` : key}
                  className="relative flex items-center justify-center rounded-lg text-xs font-bold transition-all duration-200"
                  style={{
                    width: keyWidth,
                    height: keyHeight,
                    background: isFocus
                      ? `${color}30`
                      : isLearned
                        ? "rgba(255,255,255,0.06)"
                        : "rgba(255,255,255,0.02)",
                    border: isFocus
                      ? `2px solid ${color}`
                      : isLearned
                        ? "1px solid rgba(255,255,255,0.08)"
                        : "1px solid rgba(255,255,255,0.03)",
                    color: isFocus
                      ? "#ffffff"
                      : isLearned
                        ? "var(--text-body)"
                        : "var(--text-disabled)",
                    boxShadow: isFocus ? `0 0 12px ${color}50` : "none",
                    transform: isFocus ? "scale(1.1)" : "scale(1)",
                    borderRadius: "10px",
                  }}
                >
                  <span className="uppercase">{isSpecialKey ? key.slice(0, 4) : key}</span>
                  {/* Finger dot */}
                  {finger && !isSpecialKey && (
                    <div
                      className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 h-1.5 w-1.5 rounded-full"
                      style={{ background: color, opacity: isFocus || isLearned ? 1 : 0.3 }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Instruction tooltip */}
      {highlightKeys.length > 0 && (
        <div className="mt-4 text-center">
          <div
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <span className="text-base">👆</span>              <span>
                <strong style={{ color: "var(--text-white)" }}>Focus keys: </strong>
                <span style={{ color: "var(--text-body)" }}>
                  {highlightKeys.map((k, i) => (
                    <span key={k}>
                      {i > 0 && ", "}
                      <kbd
                        className="mx-0.5 rounded border px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase"
                        style={{
                          borderColor: "rgba(255,255,255,0.12)",
                          background: "rgba(255,255,255,0.06)",
                          color: `var(--text-white)`,
                        }}
                      >
                        {k}
                      </kbd>
                    </span>
                  ))}
                  {" — "}
                  {highlightKeys.map((k) => {
                    const f = KEY_FINGER_MAP[k];
                    if (!f) return "";
                    const hand = f.startsWith("left-") ? "Left" : "Right";
                    const finger = f.replace("left-", "").replace("right-", "");
                    return `${hand} ${finger.charAt(0).toUpperCase() + finger.slice(1)}`;
                  }).filter(Boolean).join(", ")}
                </span>
              </span>
          </div>
        </div>
      )}
    </div>
  );
}
