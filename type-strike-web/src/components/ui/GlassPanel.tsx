"use client";

interface GlassPanelProps {
  children: React.ReactNode;
  glow?: "none" | "magma" | "cyan" | "gold" | "purple";
  blur?: "sm" | "md" | "lg";
  depth?: 1 | 2 | 3;
  className?: string;
  as?: "div" | "section" | "article" | "button";
  onClick?: (e: React.MouseEvent) => void;
}

const BLUR_MAP = {
  sm: "backdrop-blur-[8px]",
  md: "backdrop-blur-[16px]",
  lg: "backdrop-blur-[24px]",
};

const GLOW_STYLES: Record<string, string> = {
  none: "",
  magma: "shadow-[0_0_30px_rgba(255,80,32,0.3)]",
  cyan: "shadow-[0_0_30px_rgba(0,240,255,0.25)]",
  gold: "shadow-[0_0_30px_rgba(255,204,0,0.25)]",
  purple: "shadow-[0_0_30px_rgba(136,68,255,0.25)]",
};

export default function GlassPanel({
  children,
  glow = "none",
  blur = "md",
  depth = 1,
  className = "",
  as: Tag = "div",
  onClick,
}: GlassPanelProps) {
  const depthStyles = [
    "bg-[rgba(20,20,32,0.85)]",
    "bg-[rgba(30,30,48,0.7)]",
    "bg-[rgba(40,40,60,0.55)]",
  ];

  const RimElement = () => (
    <>
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px rounded-t-[inherit]"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px rounded-b-[inherit]"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(0,0,0,0.4), transparent)",
        }}
      />
    </>
  );

  return (
    <Tag
      onClick={onClick}
      className={`relative overflow-hidden rounded-2xl border border-[rgba(255,255,255,0.08)] ${depthStyles[depth - 1]} ${BLUR_MAP[blur]} ${GLOW_STYLES[glow]} transition-all duration-200 ${className}`}
    >
      <RimElement />
      {children}
    </Tag>
  );
}
