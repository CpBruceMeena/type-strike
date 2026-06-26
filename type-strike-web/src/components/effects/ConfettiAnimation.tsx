"use client";

import { useEffect, useRef } from "react";

interface ConfettiPiece {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  size: { w: number; h: number };
  color: string;
  opacity: number;
  decay: number;
  shape: "rect" | "circle" | "star";
}

interface ConfettiAnimationProps {
  /** Duration in ms before animation ends and canvas is hidden */
  duration?: number;
  /** Number of confetti pieces */
  count?: number;
  /** Colors to use (tier color will be dominant) */
  colors?: string[];
  /** Whether to play on mount */
  active?: boolean;
  className?: string;
}

function generateConfetti(
  count: number,
  colors: string[],
  width: number,
  height: number
): ConfettiPiece[] {
  return Array.from({ length: count }, () => {
    const color = colors[Math.floor(Math.random() * colors.length)];
    const shapeTypes: ("rect" | "circle" | "star")[] = ["rect", "circle", "star"];
    const shape = shapeTypes[Math.floor(Math.random() * shapeTypes.length)];

    return {
      x: width * (0.3 + Math.random() * 0.4), // center burst zone
      y: height * (0.2 + Math.random() * 0.3),
      vx: (Math.random() - 0.5) * 16,
      vy: -Math.random() * 14 - 4,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.3,
      size: {
        w: 4 + Math.random() * 8,
        h: 4 + Math.random() * 6,
      },
      color,
      opacity: 0.7 + Math.random() * 0.3,
      decay: 0.003 + Math.random() * 0.004,
      shape,
    };
  });
}

function drawStar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number
) {
  const spikes = 5;
  const outerRadius = r;
  const innerRadius = r * 0.4;
  let rot = (Math.PI / 2) * 3;
  const step = Math.PI / spikes;

  ctx.beginPath();
  ctx.moveTo(cx, cy - outerRadius);
  for (let i = 0; i < spikes; i++) {
    ctx.lineTo(
      cx + Math.cos(rot) * outerRadius,
      cy + Math.sin(rot) * outerRadius
    );
    rot += step;
    ctx.lineTo(
      cx + Math.cos(rot) * innerRadius,
      cy + Math.sin(rot) * innerRadius
    );
    rot += step;
  }
  ctx.lineTo(cx, cy - outerRadius);
  ctx.closePath();
}

export default function ConfettiAnimation({
  duration = 3000,
  count = 80,
  colors = ["#FF5020", "#FFCC00", "#CC44FF", "#00E5FF", "#22FF44", "#FF44CC"],
  active = true,
  className = "",
}: ConfettiAnimationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<ConfettiPiece[]>([]);
  const animRef = useRef<number>(0);
  const startRef = useRef<number>(0);

  useEffect(() => {
    if (!active) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();

    // Generate initial burst
    particlesRef.current = generateConfetti(
      count,
      colors,
      canvas.width,
      canvas.height
    );
    startRef.current = performance.now();

    const animate = (now: number) => {
      if (!ctx || !canvas) return;

      const elapsed = now - startRef.current;
      if (elapsed > duration) {
        // Fade out over final 500ms
        const fadeProgress = Math.min(1, (elapsed - duration + 500) / 500);
        if (fadeProgress >= 1) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          return;
        }
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const gravity = 0.25;
      const drag = 0.98;

      for (const p of particlesRef.current) {
        p.vy += gravity;
        p.vx *= drag;
        p.vy *= drag;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;
        p.opacity -= p.decay;

        // Floor bounce
        if (p.y > canvas.height - 10) {
          p.y = canvas.height - 10;
          p.vy *= -0.3;
          p.vx *= 0.8;
        }

        // Skip drawing if fully faded
        if (p.opacity <= 0) continue;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.globalAlpha = Math.max(0, p.opacity);

        ctx.fillStyle = p.color;

        switch (p.shape) {
          case "rect":
            ctx.fillRect(-p.size.w / 2, -p.size.h / 2, p.size.w, p.size.h);
            break;
          case "circle":
            ctx.beginPath();
            ctx.arc(0, 0, p.size.w / 2, 0, Math.PI * 2);
            ctx.fill();
            break;
          case "star":
            drawStar(ctx, 0, 0, p.size.w / 2);
            ctx.fill();
            break;
        }

        ctx.restore();
      }

      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animRef.current);
    };
  }, [active, duration, count, colors]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none fixed inset-0 z-50 ${className}`}
      aria-hidden="true"
    />
  );
}
