"use client";

import { useEffect, useState } from "react";

interface AnimatedFireIconProps {
  size?: number;
  className?: string;
}

/**
 * AnimatedFireIcon — a living flame SVG that flickers, pulses, and glows.
 * Replaces the static 🔥 emoji as the Type Strike brand mark.
 */
export default function AnimatedFireIcon({
  size = 20,
  className = "",
}: AnimatedFireIconProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Type Strike"
      style={{ overflow: "visible" }}
    >
      <defs>
        {/* Glow filter */}
        <filter id="fireGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <filter id="fireGlowOuter" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>

        {/* Flame gradient — bottom to top */}
        <linearGradient id="flameGrad" x1="0.5" y1="1" x2="0.5" y2="0">
          <stop offset="0%" stopColor="#FF4500" />
          <stop offset="35%" stopColor="#FF6600" />
          <stop offset="65%" stopColor="#FF9500" />
          <stop offset="85%" stopColor="#FFCC00" />
          <stop offset="100%" stopColor="#FFE033" />
        </linearGradient>

        {/* Inner core gradient — hotter */}
        <linearGradient id="coreGrad" x1="0.5" y1="1" x2="0.5" y2="0">
          <stop offset="0%" stopColor="#FF8C00" />
          <stop offset="50%" stopColor="#FFD700" />
          <stop offset="100%" stopColor="#FFF5CC" />
        </linearGradient>

        {/* Ambient glow gradient */}
        <radialGradient id="ambientGlow" cx="0.5" cy="0.6" r="0.5">
          <stop offset="0%" stopColor="#FF5020" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#FF5020" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Ambient glow behind the flame */}
      <ellipse
        cx="12"
        cy="14"
        rx="10"
        ry="8"
        fill="url(#ambientGlow)"
        style={{
          animation: mounted ? "fireAmbientPulse 2s ease-in-out infinite" : "none",
        }}
      />

      {/* Outer flame glow */}
      <path
        d="M12 2C12 2 6 9 6 14C6 18 8.5 22 12 22C15.5 22 18 18 18 14C18 9 12 2 12 2Z"
        fill="#FF5020"
        opacity={0.15}
        filter="url(#fireGlowOuter)"
        style={{
          animation: mounted
            ? "fireOuterGlow 1.8s ease-in-out infinite"
            : "none",
        }}
      />

      {/* Main flame body */}
      <path
        d="M12 3C12 3 7 9.5 7 14C7 17.5 9 21 12 21C15 21 17 17.5 17 14C17 9.5 12 3 12 3Z"
        fill="url(#flameGrad)"
        filter="url(#fireGlow)"
        style={{
          animation: mounted
            ? "fireMainFlame 1.6s ease-in-out infinite"
            : "none",
          transformOrigin: "12px 18px",
        }}
      />

      {/* Flame core (hottest inner part) */}
      <path
        d="M12 6C12 6 9 10.5 9 14C9 16.5 10.5 19 12 19C13.5 19 15 16.5 15 14C15 10.5 12 6 12 6Z"
        fill="url(#coreGrad)"
        style={{
          animation: mounted
            ? "fireCoreFlame 1.2s ease-in-out infinite"
            : "none",
          transformOrigin: "12px 16px",
        }}
      />

      {/* Bright white core (hottest point) */}
      <ellipse
        cx="12"
        cy="14"
        rx="1.8"
        ry="3"
        fill="#FFFBE6"
        opacity={0.7}
        style={{
          animation: mounted
            ? "fireWhiteCore 1s ease-in-out infinite"
            : "none",
        }}
      />

      {/* Separate flame wisps for flickering tips */}
      <path
        d="M11 2.5C11 2.5 10.5 4 10.5 5C10.5 5.8 11 6.5 11 6.5"
        stroke="#FFCC00"
        strokeWidth="1.2"
        strokeLinecap="round"
        fill="none"
        opacity={0.6}
        style={{
          animation: mounted
            ? "fireWisp1 1.4s ease-in-out infinite"
            : "none",
        }}
      />
      <path
        d="M13 3C13 3 13.8 4.5 13.8 5.5C13.8 6.3 13.3 7 13 7"
        stroke="#FF9500"
        strokeWidth="1"
        strokeLinecap="round"
        fill="none"
        opacity={0.4}
        style={{
          animation: mounted
            ? "fireWisp2 1.7s ease-in-out infinite"
            : "none",
        }}
      />

      {/* Ember particles */}
      <circle
        cx="10"
        cy="4"
        r="0.8"
        fill="#FFCC00"
        opacity={0}
        style={{
          animation: mounted
            ? "fireEmber1 2.5s ease-out infinite"
            : "none",
        }}
      />
      <circle
        cx="14"
        cy="5"
        r="0.6"
        fill="#FF9500"
        opacity={0}
        style={{
          animation: mounted
            ? "fireEmber2 3s ease-out infinite"
            : "none",
        }}
      />
      <circle
        cx="11"
        cy="3"
        r="0.5"
        fill="#FFCC00"
        opacity={0}
        style={{
          animation: mounted
            ? "fireEmber3 2.8s ease-out infinite 1s"
            : "none",
        }}
      />

      <style>{`
        @keyframes fireMainFlame {
          0%, 100% {
            transform: scaleY(1) scaleX(1);
          }
          25% {
            transform: scaleY(1.06) scaleX(0.96);
          }
          50% {
            transform: scaleY(0.97) scaleX(1.03);
          }
          75% {
            transform: scaleY(1.04) scaleX(0.98);
          }
        }

        @keyframes fireCoreFlame {
          0%, 100% {
            transform: scaleY(1) scaleX(1);
          }
          30% {
            transform: scaleY(1.08) scaleX(0.95);
          }
          60% {
            transform: scaleY(0.96) scaleX(1.05);
          }
        }

        @keyframes fireWhiteCore {
          0%, 100% {
            transform: scaleY(1);
            opacity: 0.7;
          }
          50% {
            transform: scaleY(1.15);
            opacity: 0.9;
          }
        }

        @keyframes fireOuterGlow {
          0%, 100% {
            opacity: 0.12;
            transform: scale(1);
          }
          50% {
            opacity: 0.22;
            transform: scale(1.05);
          }
        }

        @keyframes fireAmbientPulse {
          0%, 100% {
            opacity: 0.3;
            transform: scale(1);
          }
          50% {
            opacity: 0.45;
            transform: scale(1.08);
          }
        }

        @keyframes fireWisp1 {
          0%, 100% {
            opacity: 0.5;
            transform: translateY(0) translateX(0);
          }
          50% {
            opacity: 0.8;
            transform: translateY(-1px) translateX(0.5px);
          }
        }

        @keyframes fireWisp2 {
          0%, 100% {
            opacity: 0.3;
            transform: translateY(0) translateX(0);
          }
          50% {
            opacity: 0.6;
            transform: translateY(-1.5px) translateX(-0.5px);
          }
        }

        @keyframes fireEmber1 {
          0% {
            opacity: 0;
            transform: translateY(0) translateX(0);
          }
          20% {
            opacity: 0.8;
          }
          100% {
            opacity: 0;
            transform: translateY(-18px) translateX(4px);
          }
        }

        @keyframes fireEmber2 {
          0% {
            opacity: 0;
            transform: translateY(0) translateX(0);
          }
          20% {
            opacity: 0.6;
          }
          100% {
            opacity: 0;
            transform: translateY(-15px) translateX(-3px);
          }
        }

        @keyframes fireEmber3 {
          0% {
            opacity: 0;
            transform: translateY(0) translateX(0);
          }
          20% {
            opacity: 0.7;
          }
          100% {
            opacity: 0;
            transform: translateY(-20px) translateX(2px);
          }
        }
      `}</style>
    </svg>
  );
}
