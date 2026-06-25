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
          }
        }
      } else if (diff < 0) {
        // Backspace
        trigger("backspace", currentCharIndex);
      }
      prevIdxRef.current = currentCharIndex;
    }
  }, [currentCharIndex, charResults, paragraph, trigger]);

  // Auto-scroll to keep cursor visible within the scrollable container
  useEffect(() => {
    if (cursorRef.current) {
      cursorRef.current.scrollIntoView({
        block: "center",
        behavior: "auto",
      });
    }
  }, [currentCharIndex]);

  const isActive = gameState === "typing" || gameState === "mistake";

  return (
    <div
      ref={containerRef}
      className="relative flex h-full w-full flex-col overflow-hidden rounded-2xl border border-[rgba(255,255,255,0.06)] p-5"
      style={{
        background: "rgba(15,15,25,0.7)",
        backdropFilter: "blur(16px)",
      }}
    >
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-none"
      >
        <p
          className="select-none text-lg leading-[1.75] tracking-wide whitespace-pre-wrap"
          style={{ fontFamily: "'Cascadia Code', 'Fira Code', 'JetBrains Mono', monospace" }}
        >
          {paragraph.split("").map((char, i) => {
            const result = charResults[i];
            const isCurrent = i === currentCharIndex;
            const isTyped = result?.isTyped ?? false;
            const isCorrect = result?.isCorrect ?? true;

            // Detect special characters for code snippets
            const isNewline = char === '\n';
            const isSpace = char === ' ';

            // Determine display character with visual indicators for special keys
            let displayChar: string | null = char;

            if (isNewline) {
              displayChar = '↵';
            } else if (isSpace && isCurrent) {
              // Only show · when cursor is on a space (never show for ALL spaces — too noisy)
              displayChar = '·';
            }

            let color: string;
            if (isCurrent && isActive) {
              color = "var(--text-white)";
            } else if (isTyped && isCorrect) {
              color = "var(--success-green)";
            } else if (isTyped && !isCorrect) {
              color = "var(--error-red)";
            } else if (isNewline) {
              // Dim special chars (↵) so they're visible but not distracting
              color = "rgba(106,106,122,0.35)";
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
                {/* Key-hint badge for current special character */}
                {isCurrent && isActive && isNewline && (
                  <span
                    className="absolute -top-5 left-1/2 -translate-x-1/2 z-10"
                  >
                    <span
                      className="whitespace-nowrap rounded px-1.5 py-0.5 text-[8px] font-bold tracking-[1px]"
                      style={{
                        background: 'rgba(34,221,68,0.15)',
                        color: '#22DD44',
                        border: '1px solid rgba(34,221,68,0.3)',
                      }}
                    >
                      ENTER
                    </span>
                  </span>
                )}
                {isCurrent && isActive && isSpace && (
                  <span
                    className="absolute -top-5 left-1/2 -translate-x-1/2 z-10"
                  >
                    <span
                      className="whitespace-nowrap rounded px-1.5 py-0.5 text-[8px] font-bold tracking-[1px]"
                      style={{
                        background: 'rgba(255,204,0,0.15)',
                        color: '#FFCC00',
                        border: '1px solid rgba(255,204,0,0.3)',
                      }}
                    >
                      SPACE
                    </span>
                  </span>
                )}

                {/* The display character */}
                {displayChar}
                {/* Preserve the actual newline for line breaks */}
                {isNewline && '\n'}

                {/* Cursor */}
                {isCurrent && isActive && (
                  <span
                    ref={cursorRef}
                    className="absolute left-0 top-0 h-full w-[2.5px]"
                    style={{
                      background: "var(--accent-primary)",
                      boxShadow: "0 0 10px rgba(255,80,32,0.9), 0 0 25px rgba(255,80,32,0.4)",
                      animation: "cursor-blink 1s step-end infinite",
                    }}
                  />
                )}
              </span>
            );
          })}
        </p>
      </div>
    </div>
  );
}
