"use client";

import { useEffect, useRef } from "react";

export default function EmberParticles() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const particles: HTMLDivElement[] = [];
    for (let i = 0; i < 25; i++) {
      const e = document.createElement("div");
      e.className = "ember-particle";
      e.style.cssText = `
        position: fixed;
        width: ${2 + Math.random() * 4}px;
        height: ${2 + Math.random() * 4}px;
        border-radius: 50%;
        background: var(--ts-orange, #ff6b1a);
        box-shadow: 0 0 12px var(--ts-orange-bright, #ff8a3d);
        pointer-events: none;
        opacity: 0;
        z-index: 0;
        left: ${Math.random() * 100}vw;
        animation: emberFloat ${8 + Math.random() * 10}s linear infinite;
        animation-delay: ${Math.random() * 10}s;
      `;
      container.appendChild(e);
      particles.push(e);
    }

    return () => {
      particles.forEach((p) => p.remove());
    };
  }, []);

  return <div ref={containerRef} aria-hidden="true" />;
}
