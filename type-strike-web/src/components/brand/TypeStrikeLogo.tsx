"use client";

import { useEffect, useState } from "react";

interface TypeStrikeLogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  sm: { icon: 16, text: "text-xs", tracking: "tracking-[2px]", gap: "gap-1" },
  md: { icon: 20, text: "text-sm", tracking: "tracking-[3px]", gap: "gap-1.5" },
  lg: { icon: 28, text: "text-lg", tracking: "tracking-[4px]", gap: "gap-2" },
};

/**
 * TypeStrikeLogo — A clean 2D wordmark with a subtle fire flicker and glow animation.
 * "TYPE" appears in warm ember tones, "STRIKE" blazes in fire-orange with a pulsing glow.
 */
export default function TypeStrikeLogo({
  size = "md",
  className = "",
}: TypeStrikeLogoProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const s = sizeMap[size];

  return (
    <div className={`inline-flex items-center ${s.gap} ${className}`}>
      {/* Stylized fire mark — 2D minimal flame */}
      <svg
        width={s.icon}
        height={s.icon}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ overflow: "visible" }}
        aria-hidden={true}
      >
        <defs>
          <linearGradient id="logoFlameGrad" x1="0.5" y1="1" x2="0.5" y2="0">
            <stop offset="0%" stopColor="#FF4500" />
            <stop offset="40%" stopColor="#FF6600" />
            <stop offset="70%" stopColor="#FF9500" />
            <stop offset="100%" stopColor="#FFCC00" />
          </linearGradient>
          <filter id="logoFlameGlow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Simple 2D flame shape — no 3D shading, flat vector */}
        <path
          d="M12 2.5C12 2.5 5.5 10 5.5 14.5C5.5 18.5 8.5 21.5 12 21.5C15.5 21.5 18.5 18.5 18.5 14.5C18.5 10 12 2.5 12 2.5Z"
          fill="url(#logoFlameGrad)"
          filter="url(#logoFlameGlow)"
          style={{
            animation: mounted
              ? "logoFlameFlicker 2s ease-in-out infinite"
              : "none",
            transformOrigin: "12px 14px",
          }}
        />

        {/* Inner highlight — flat white core */}
        <ellipse
          cx="12"
          cy="14"
          rx="3"
          ry="5"
          fill="#FFF8E1"
          opacity={0.35}
          style={{
            animation: mounted
              ? "logoCorePulse 1.5s ease-in-out infinite"
              : "none",
          }}
        />
      </svg>

      {/* "TYPE" — warm ember */}
      <span
        className={`font-bold ${s.text} ${s.tracking}`}
        style={{
          color: "#E88860",
          animation: mounted ? "logoTypeFlicker 2.4s ease-in-out infinite" : "none",
        }}
      >
        TYPE
      </span>

      {/* "STRIKE" — blazing fire */}
      <span
        className={`font-black ${s.text} ${s.tracking}`}
        style={{
          background: "linear-gradient(135deg, #FF5020 0%, #FF9500 50%, #FFCC00 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          filter: mounted ? "drop-shadow(0 0 6px rgba(255,80,32,0.4))" : "none",
          animation: mounted
            ? "logoStrikeGlow 1.8s ease-in-out infinite"
            : "none",
        }}
      >
        STRIKE
      </span>

      <style>{`
        @keyframes logoFlameFlicker {
          0%, 100% {
            transform: scaleY(1) scaleX(1);
            filter: drop-shadow(0 0 4px rgba(255,80,32,0.3));
          }
          30% {
            transform: scaleY(1.04) scaleX(0.97);
            filter: drop-shadow(0 0 8px rgba(255,80,32,0.5));
          }
          60% {
            transform: scaleY(0.97) scaleX(1.03);
            filter: drop-shadow(0 0 6px rgba(255,80,32,0.4));
          }
        }

        @keyframes logoCorePulse {
          0%, 100% { opacity: 0.3; transform: scaleY(1); }
          50% { opacity: 0.5; transform: scaleY(1.08); }
        }

        @keyframes logoTypeFlicker {
          0%, 100% { opacity: 0.9; }
          25% { opacity: 1; }
          50% { opacity: 0.85; }
          75% { opacity: 0.95; }
        }

        @keyframes logoStrikeGlow {
          0%, 100% {
            filter: drop-shadow(0 0 4px rgba(255,80,32,0.3));
          }
          50% {
            filter: drop-shadow(0 0 12px rgba(255,80,32,0.6)) drop-shadow(0 0 24px rgba(255,150,0,0.3));
          }
        }
      `}</style>
    </div>
  );
}
