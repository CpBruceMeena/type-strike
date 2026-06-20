"use client";

import { COMBO_TIERS } from "@/lib/constants";

interface KineticTextProps {
  text: string | null;
}

export default function KineticText({ text }: KineticTextProps) {
  if (!text) return null;

  const tier = COMBO_TIERS.find((t) => t.title === text);
  const color = tier?.color ?? "var(--accent-primary)";

  return (
    <div className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center">
      <p
        key={text}
        className="animate-float text-3xl font-black tracking-[4px]"
        style={{
          color,
          textShadow: `0 0 30px ${color}60, 0 0 60px ${color}30`,
          animation: "float 1.8s ease-out forwards",
        }}
      >
        {text}
      </p>
    </div>
  );
}
