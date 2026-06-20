"use client";

import { useEffect, useRef } from "react";
import type { CharResult, GameState } from "@/lib/types";
import { useMicroInteractions } from "@/hooks/useMicroInteractions";

interface ParagraphDisplayProps {
  paragraph: string;
  charResults: CharResult[];
  currentCharIndex: number;
  gameState: GameState;
}

export default function ParagraphDisplay({
  paragraph,
  charResults,
  currentCharIndex,
  gameState,
}: ParagraphDisplayProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLSpanElement>(null);
  const { registerChar, containerRef, trigger } = useMicroInteractions();

  // Trigger micro-interactions when char changes
  const prevIdxRef = useRef(currentCharIndex);
  useEffect(() => {
    if (currentCharIndex !== prevIdxRef.current) {
      const diff = currentCharIndex - prevIdxRef.current;
      if (diff > 0) {
        // A character was typed
        const typedIndex = currentCharIndex - 1;
        const result = charResults[typedIndex];
        if (result) {
          if (result.isCorrect) {
            trigger("correct", typedIndex);
          } else {
            trigger("error", typedIndex);
          }
          if (paragraph[typedIndex] === " ") {
            trigger("space");
          }
        }
      } else if (diff < 0) {
        // Backspace
        trigger("backspace", currentCharIndex);
      }
      prevIdxRef.current = currentCharIndex;
    }
  }, [currentCharIndex, charResults, paragraph, trigger]);

  // Auto-scroll to keep cursor visible
  useEffect(() => {
    if (cursorRef.current) {
      cursorRef.current.scrollIntoView({
        block: "center",
        behavior: "smooth",
      });
    }
  }, [currentCharIndex]);

  const isActive = gameState === "typing" || gameState === "stalled" || gameState === "mistake";

  return (
    <div
      ref={containerRef}
      className="relative mx-auto w-full max-w-[440px] overflow-hidden rounded-2xl border border-[rgba(255,255,255,0.06)] p-5"
      style={{
        background: "rgba(15,15,25,0.7)",
        backdropFilter: "blur(16px)",
      }}
    >
      <div
        ref={scrollRef}
        className="max-h-[280px] overflow-y-auto scrollbar-none"
      >
        <p
          className="select-none text-lg leading-[2] tracking-wide"
          style={{ fontFamily: "'Cascadia Code', 'Fira Code', 'JetBrains Mono', monospace" }}
        >
          {paragraph.split("").map((char, i) => {
            const result = charResults[i];
            const isCurrent = i === currentCharIndex;
            const isTyped = result?.isTyped ?? false;
            const isCorrect = result?.isCorrect ?? true;

            let color: string;
            if (isCurrent && isActive) {
              color = "var(--text-white)";
            } else if (isTyped && isCorrect) {
              color = "var(--success-green)";
            } else if (isTyped && !isCorrect) {
              color = "var(--error-red)";
            } else {
              color = "rgba(106,106,122,0.6)";
            }

            return (
              <span
                key={i}
                ref={registerChar(i)}
                data-ts-color={isTyped && isCorrect ? "var(--success-green)" : "rgba(106,106,122,0.6)"}
                className="relative transition-colors duration-75"
                style={{
                  color,
                  fontWeight: isCurrent ? 700 : 400,
                  textShadow:
                    isCurrent && isActive
                      ? "0 0 8px rgba(255,255,255,0.3)"
                      : "none",
                }}
              >
                {char === " " ? "\u00A0" : char}
                {isCurrent && isActive && (
                  <span
                    ref={cursorRef}
                    className="absolute -bottom-0.5 left-0 h-0.5 w-full animate-pulse"
                    style={{
                      background: "var(--accent-primary)",
                      boxShadow: "0 0 8px rgba(255,80,32,0.6)",
                    }}
                  />
                )}
              </span>
            );
          })}
        </p>
      </div>

      {/* Gradient fades at top/bottom of scrollable area */}
      <div
        className="pointer-events-none absolute left-0 right-0 top-0 h-6"
        style={{
          background: "linear-gradient(to bottom, rgba(15,15,25,1), transparent)",
        }}
      />
      <div
        className="pointer-events-none absolute bottom-0 left-0 right-0 h-6"
        style={{
          background: "linear-gradient(to top, rgba(15,15,25,1), transparent)",
        }}
      />
    </div>
  );
}
