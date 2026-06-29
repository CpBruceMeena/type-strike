"use client";

interface GameModeCardProps {
  title: string;
  description: string;
  tag: string;
  color: string;
  icon: React.ReactNode;
  onClick: () => void;
}

export default function GameModeCard({
  title,
  description,
  tag,
  color,
  icon,
  onClick,
}: GameModeCardProps) {
  return (
    <div
      className="mode-card"
      onClick={onClick}
      style={
        {
          position: "relative",
          overflow: "hidden",
          padding: "32px 28px",
          borderRadius: "20px",
          cursor: "pointer",
          background: "linear-gradient(160deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))",
          border: "1px solid rgba(255,255,255,0.06)",
          transition: "all 0.3s",
          minHeight: "280px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          "--clr": color,
        } as React.CSSProperties
      }
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-6px)";
        e.currentTarget.style.borderColor = color;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
      }}
    >
      {/* Background gradient overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(circle at 70% 0%, ${color}, transparent 60%)`,
          opacity: 0.08,
          transition: "opacity 0.3s",
          pointerEvents: "none",
        }}
        className="mode-card-glow"
      />

      {/* Top line accent */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "2px",
          background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
          opacity: 0,
          transition: "opacity 0.3s",
          pointerEvents: "none",
        }}
        className="mode-card-line"
      />

      <div style={{ position: "relative", zIndex: 1 }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 14,
            background: `linear-gradient(135deg, ${color}, transparent)`,
            display: "grid",
            placeItems: "center",
            fontSize: 24,
            color: "#fff",
            boxShadow: "0 8px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.15)",
            marginBottom: 20,
          }}
        >
          {icon}
        </div>
        <h3
          style={{
            fontFamily: "var(--font-orbitron, 'Orbitron', sans-serif)",
            fontWeight: 800,
            fontSize: 24,
            letterSpacing: "1px",
            marginBottom: 8,
            color: "var(--ts-text, #f5f3ff)",
          }}
        >
          {title}
        </h3>
        <p
          className="mode-card-desc"
          style={{
            color: "var(--ts-text-dim, #9b94b3)",
            fontSize: 14,
            lineHeight: 1.5,
          }}
        >
          {description}
        </p>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: 20,
          paddingTop: 20,
          borderTop: "1px solid rgba(255,255,255,0.06)",
          position: "relative",
          zIndex: 1,
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-jetbrains-mono, 'JetBrains Mono', monospace)",
            fontSize: 11,
            color,
            letterSpacing: "1px",
            fontWeight: 700,
          }}
        >
          {tag}
        </span>
        <div
          className="mode-arrow"
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            display: "grid",
            placeItems: "center",
            transition: "all 0.2s",
            color: "var(--ts-text-dim, #9b94b3)",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 3l4 4-4 4" />
          </svg>
        </div>
      </div>
    </div>
  );
}
