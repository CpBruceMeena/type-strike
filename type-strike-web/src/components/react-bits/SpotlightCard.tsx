"use client";

import { useCallback, useRef, type ReactNode } from "react";

interface SpotlightCardProps {
  children: ReactNode;
  className?: string;
  spotlightColor?: string;
  as?: "div" | "section" | "article";
}

export default function SpotlightCard({
  children,
  className = "",
  spotlightColor = "rgba(6, 182, 212, 0.08)",
  as: Tag = "div",
}: SpotlightCardProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const el = containerRef.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      // Calculate angle and distance for dynamic spotlight
      const angle = Math.atan2(y - centerY, x - centerX);
      const distance = Math.min(
        1,
        Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2) /
          Math.max(rect.width, rect.height)
      );

      // Position the spotlight near the cursor
      const spotX = (x / rect.width) * 100;
      const spotY = (y / rect.height) * 100;

      el.style.setProperty("--spotlight-x", `${spotX}%`);
      el.style.setProperty("--spotlight-y", `${spotY}%`);
      el.style.setProperty("--spotlight-opacity", String(1 - distance * 0.4));
      el.style.setProperty("--spotlight-angle", `${angle}rad`);
    },
    []
  );

  const handlePointerLeave = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    el.style.setProperty("--spotlight-opacity", "0");
  }, []);

  return (
    <Tag
      ref={containerRef as React.RefObject<HTMLDivElement>}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className={`relative overflow-hidden ${className}`}
      style={{
        "--spotlight-x": "50%",
        "--spotlight-y": "50%",
        "--spotlight-opacity": "0",
        "--spotlight-angle": "0rad",
      } as React.CSSProperties}
    >
      {/* Spotlight overlay */}
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-300"
        style={{
          background: `radial-gradient(600px circle at var(--spotlight-x) var(--spotlight-y), ${spotlightColor}, transparent 60%)`,
          opacity: "var(--spotlight-opacity)",
        }}
        aria-hidden="true"
      />
      {children}
    </Tag>
  );
}
