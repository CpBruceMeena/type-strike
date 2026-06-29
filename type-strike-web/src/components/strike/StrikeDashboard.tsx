interface StrikeDashboardProps {
  rankName: string;
  level: number;
  currentXp: number;
  xpToNext: number;
}

export default function StrikeDashboard({
  rankName,
  level,
  currentXp,
  xpToNext,
}: StrikeDashboardProps) {
  const xpProgress = xpToNext > 0 ? Math.min(currentXp / (currentXp + xpToNext), 1) : 0;
  const xpDisplay = xpToNext > 0 ? `${currentXp} / ${currentXp + xpToNext} XP` : `${currentXp} XP`;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 2fr",
        gap: 16,
        marginBottom: 20,
      }}
      className="strike-dashboard"
    >
      {/* Rank Card */}
      <div
        style={{
          background: "var(--ts-bg-2, #13101c)",
          border: "1px solid var(--ts-border, rgba(255,107,26,0.18))",
          borderRadius: 12,
          padding: "16px 20px",
          display: "flex",
          alignItems: "center",
          gap: 14,
        }}
      >
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #cd7f32, #8B4513)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 26,
            boxShadow: "0 0 20px rgba(205,127,50,0.3)",
            border: "2px solid rgba(205,127,50,0.4)",
          }}
        >
          🥉
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span
            style={{
              fontFamily: "var(--font-orbitron, 'Orbitron', sans-serif)",
              fontSize: 14,
              fontWeight: 700,
              color: "var(--ts-orange, #ff6b1a)",
            }}
          >
            {rankName}
          </span>
          <span style={{ fontSize: 12, color: "var(--ts-text-dim, #9b94b3)" }}>
            Level {level}
          </span>
        </div>
      </div>

      {/* XP Card */}
      <div
        style={{
          background: "var(--ts-bg-2, #13101c)",
          border: "1px solid var(--ts-border, rgba(255,107,26,0.18))",
          borderRadius: 12,
          padding: "16px 20px",
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 12,
            color: "var(--ts-text-dim, #9b94b3)",
          }}
        >
          <span>Experience</span>
          <span style={{ fontWeight: 600, color: "var(--ts-text, #f5f3ff)" }}>
            {xpDisplay}
          </span>
        </div>
        <div
          style={{
            height: 8,
            background: "var(--ts-bg-2, #13101c)",
            borderRadius: 4,
            overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.04)",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${xpProgress * 100}%`,
              background: "linear-gradient(90deg, var(--ts-orange, #ff6b1a), var(--ts-yellow, #ffb800))",
              borderRadius: 4,
              transition: "width 1s ease",
              position: "relative",
              boxShadow: "0 0 8px var(--ts-orange, #ff6b1a)",
            }}
          />
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .strike-dashboard { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
