interface FloatingBadgeProps {
  icon: React.ReactNode;
  label: string;
  color: string;
  style?: React.CSSProperties;
  className?: string;
}

export default function FloatingBadge({ icon, label, color, style, className = "" }: FloatingBadgeProps) {
  return (
    <div
      className={`floating-badge ${className}`}
      style={{
        position: "absolute",
        padding: "10px 16px",
        borderRadius: "12px",
        background: "rgba(13,10,20,0.9)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        border: "1px solid var(--ts-border, rgba(255,107,26,0.18))",
        display: "flex",
        alignItems: "center",
        gap: "10px",
        fontSize: "13px",
        fontWeight: 600,
        boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
        animation: "floatBob 4s ease-in-out infinite",
        color,
        ...style,
      } as React.CSSProperties}
    >
      {icon}
      <span>{label}</span>
    </div>
  );
}
