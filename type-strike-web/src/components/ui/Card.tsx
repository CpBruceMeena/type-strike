"use client";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}

export default function Card({
  children,
  className = "",
  onClick,
  hoverable = false,
}: CardProps) {
  const base = "rounded-xl bg-bg-surface/50 border border-border/50 p-3";
  const hover = hoverable ? "cursor-pointer hover:bg-bg-surface hover:border-border transition-colors" : "";

  return (
    <div
      className={`${base} ${hover} ${className}`}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === "Enter" || e.key === " ") onClick(); } : undefined}
    >
      {children}
    </div>
  );
}
