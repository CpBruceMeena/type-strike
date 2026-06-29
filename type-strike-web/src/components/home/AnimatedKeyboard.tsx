"use client";

import { useEffect, useRef } from "react";

const KEY_ROWS = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["⇧", "Z", "X", "C", "V", "B", "N", "M", "⌫"],
];

const WIDE_KEYS = new Set(["⇧", "⌫"]);
const SPACE_KEY = true;

export default function AnimatedKeyboard() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const keys = container.querySelectorAll<HTMLDivElement>(".kbd-key:not(.kbd-wide):not(.kbd-space)");
    if (!keys.length) return;

    let currentIdx = 4; // Start at "T"
    keys[currentIdx]?.classList.add("kbd-glow");

    const interval = setInterval(() => {
      keys.forEach((k) => k.classList.remove("kbd-glow"));
      currentIdx = Math.floor(Math.random() * keys.length);
      keys[currentIdx]?.classList.add("kbd-glow");
    }, 900);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="kbd-3d-container" ref={containerRef}>
      <style>{`
        .kbd-3d-container {
          perspective: 1200px;
          width: 100%;
          max-width: 520px;
        }
        .kbd-inner {
          transform: rotateX(45deg) rotateZ(-15deg);
          transform-style: preserve-3d;
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding: 24px;
          background: linear-gradient(145deg, #1a1525, #0f0c18);
          border-radius: 20px;
          border: 1px solid rgba(255,107,26,0.2);
          box-shadow: 0 40px 80px rgba(0,0,0,0.6), 0 0 60px rgba(255,107,26,0.15), inset 0 1px 0 rgba(255,255,255,0.06);
          animation: kbdFloat 6s ease-in-out infinite;
        }
        .kbd-row {
          display: flex;
          gap: 6px;
          justify-content: center;
        }
        .kbd-key {
          width: 38px;
          height: 38px;
          border-radius: 8px;
          background: linear-gradient(180deg, #2a2238, #1a1428);
          border: 1px solid rgba(255,255,255,0.06);
          display: grid;
          place-items: center;
          font-family: var(--font-jetbrains-mono, "JetBrains Mono", monospace);
          font-size: 12px;
          font-weight: 700;
          color: var(--ts-text-dim, #9b94b3);
          box-shadow: 0 4px 0 #0a0810, 0 6px 12px rgba(0,0,0,0.4);
          transition: all 0.1s;
        }
        .kbd-key.kbd-wide {
          width: 60px;
        }
        .kbd-key.kbd-space {
          width: 200px;
          height: 38px;
        }
        .kbd-key.kbd-glow {
          background: linear-gradient(180deg, var(--ts-orange, #ff6b1a), var(--ts-red, #ff3d3d));
          color: #fff;
          box-shadow: 0 4px 0 #8a2a05, 0 0 20px var(--ts-orange, #ff6b1a), inset 0 1px 0 rgba(255,255,255,0.3);
          animation: keyPress 1.4s ease-in-out infinite;
        }
        @media (max-width: 600px) {
          .kbd-key { width: 28px; height: 30px; font-size: 9px; }
          .kbd-key.kbd-wide { width: 44px; }
          .kbd-key.kbd-space { width: 140px; }
          .kbd-inner { padding: 14px; gap: 5px; }
        }
      `}</style>
      <div className="kbd-inner">
        {KEY_ROWS.map((row, rowIdx) => (
          <div className="kbd-row" key={rowIdx}>
            {row.map((key) => (
              <div
                key={key}
                className={`kbd-key ${WIDE_KEYS.has(key) ? "kbd-wide" : ""}`}
              >
                {key}
              </div>
            ))}
          </div>
        ))}
        <div className="kbd-row">
          <div className="kbd-key kbd-space" />
        </div>
      </div>
    </div>
  );
}
