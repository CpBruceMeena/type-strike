"use client";

import { useCallback, useRef } from "react";

type FeedbackType = "correct" | "error" | "backspace" | "combo" | "space";

const CORRECT_CFG = { color: "#22FF44" as const, duration: 150 };
const ERROR_CFG = { color: "#FF2200" as const, duration: 200, shakePx: 3 };
const BACKSPACE_CFG = { opacityMin: 0.4, duration: 100 };
const COMBO_CFG = { glowIntensity: 0.5, duration: 600 };
const SPACE_CFG = { flexPx: 2, duration: 80 };

export function useMicroInteractions() {
  const charRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const gaugeRef = useRef<HTMLDivElement | null>(null);

  // Direct DOM mutation — zero React reconciliation cost
  const trigger = useCallback((type: FeedbackType, charIndex?: number) => {

    switch (type) {
      case "correct": {
        const el = charRefs.current[charIndex!];
        if (!el) return;
        const baseline = el.dataset.tsColor ?? "";
        el.style.transition = `color ${CORRECT_CFG.duration}ms ease-out`;
        el.style.color = CORRECT_CFG.color;
        setTimeout(() => {
          el.style.color = baseline;
        }, CORRECT_CFG.duration);
        break;
      }

      case "error": {
        const el = charRefs.current[charIndex!];
        if (el) {
          el.style.color = ERROR_CFG.color;
        }
        if (containerRef.current) {
          containerRef.current.classList.remove("animate-shake");
          void containerRef.current.offsetWidth;
          containerRef.current.classList.add("animate-shake");
          setTimeout(() => {
            containerRef.current?.classList.remove("animate-shake");
            if (el) el.style.color = "";
          }, ERROR_CFG.duration);
        }
        break;
      }

      case "backspace": {
        const el = charRefs.current[charIndex!];
        if (!el) return;
        el.style.transition = `opacity ${BACKSPACE_CFG.duration}ms`;
        el.style.opacity = String(BACKSPACE_CFG.opacityMin);
        setTimeout(() => {
          el.style.opacity = "1";
        }, BACKSPACE_CFG.duration);
        break;
      }

      case "combo": {
        if (gaugeRef.current) {
          gaugeRef.current.style.transition = `box-shadow ${COMBO_CFG.duration}ms ease-out`;
          gaugeRef.current.style.boxShadow = `0 0 ${30 * COMBO_CFG.glowIntensity}px rgba(255, 80, 32, ${COMBO_CFG.glowIntensity})`;
          setTimeout(() => {
            if (gaugeRef.current) gaugeRef.current.style.boxShadow = "";
          }, COMBO_CFG.duration);
        }
        break;
      }

      case "space": {
        if (containerRef.current) {
          containerRef.current.style.transition = `padding ${SPACE_CFG.duration}ms`;
          containerRef.current.style.paddingBottom = `${SPACE_CFG.flexPx}px`;
          setTimeout(() => {
            if (containerRef.current) containerRef.current.style.paddingBottom = "";
          }, SPACE_CFG.duration);
        }
        break;
      }
    }
  }, []);

  const registerChar = useCallback(
    (index: number) => (el: HTMLSpanElement | null) => {
      charRefs.current[index] = el;
    },
    []
  );

  return {
    trigger,
    registerChar,
    containerRef,
    gaugeRef,
    charRefs,
  };
}
