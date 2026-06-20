"use client";

interface ProgressBarProps {
  value: number;
  color?: string;
  height?: number;
  className?: string;
}

export default function ProgressBar({
  value,
  color = "var(--accent-primary)",
  height = 4,
  className = "",
}: ProgressBarProps) {
  const clamped = Math.min(Math.max(value, 0), 1);

  return (
    <div
      className={`overflow-hidden rounded-full bg-bg-surface-dark ${className}`}
      style={{ height }}
    >
      <div
        className="h-full rounded-full transition-all duration-300 ease-out"
        style={{
          width: `${clamped * 100}%`,
          backgroundColor: color,
        }}
      />
    </div>
  );
}
