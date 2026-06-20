"use client";

import { useEffect, useRef } from "react";

interface ParticleConfig {
  count: number;
  color: string;
  opacity: number;
  speed: number;
  sizeMin: number;
  sizeMax: number;
  glowEnabled: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
}

function detectQuality(): "high" | "medium" | "low" {
  if (typeof window === "undefined") return "low";
  // Simple detection based on device
  const isMobile = /Mobi|Android/i.test(navigator.userAgent);
  return isMobile ? "low" : "high";
}

function configFromQuality(quality: "high" | "medium" | "low"): ParticleConfig {
  switch (quality) {
    case "high":
      return { count: 60, color: "#FF5020", opacity: 0.35, speed: 0.3, sizeMin: 1, sizeMax: 3, glowEnabled: true };
    case "medium":
      return { count: 30, color: "#FF5020", opacity: 0.25, speed: 0.2, sizeMin: 1, sizeMax: 2.5, glowEnabled: true };
    case "low":
      return { count: 15, color: "#FF5020", opacity: 0.15, speed: 0.15, sizeMin: 1, sizeMax: 2, glowEnabled: false };
  }
}

interface ParticleFieldProps {
  config?: Partial<ParticleConfig>;
  className?: string;
}

export default function ParticleField({ config: overrides, className = "" }: ParticleFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animRef = useRef<number>(0);

  const quality = detectQuality();
  const baseConfig = configFromQuality(quality);
  const config: ParticleConfig = { ...baseConfig, ...overrides };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // Initialize particles
    particlesRef.current = Array.from({ length: config.count }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * config.speed,
      vy: -Math.random() * config.speed * 0.5 - 0.1,
      size: config.sizeMin + Math.random() * (config.sizeMax - config.sizeMin),
      opacity: 0.2 + Math.random() * 0.3,
    }));

    const animate = () => {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const p of particlesRef.current) {
        p.x += p.vx;
        p.y += p.vy;

        // Wrap around
        if (p.y < -10) {
          p.y = canvas.height + 10;
          p.x = Math.random() * canvas.width;
        }
        if (p.x < -10) p.x = canvas.width + 10;
        if (p.x > canvas.width + 10) p.x = -10;

        // Draw glow
        if (config.glowEnabled) {
          const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 4);
          gradient.addColorStop(0, `${config.color}${Math.round(p.opacity * 0.4 * 255).toString(16).padStart(2, "0")}`);
          gradient.addColorStop(1, `${config.color}00`);
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 4, 0, Math.PI * 2);
          ctx.fill();
        }

        // Draw particle
        ctx.fillStyle = `${config.color}${Math.round(p.opacity * config.opacity * 255).toString(16).padStart(2, "0")}`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      animRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [config.count, config.color, config.opacity, config.speed, config.sizeMin, config.sizeMax, config.glowEnabled]);

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none fixed inset-0 z-0 ${className}`}
      aria-hidden="true"
    />
  );
}
