interface DayCardProps {
  label: string;
  isToday: boolean;
  isPast: boolean;
  isClaimed: boolean;
  isBonus: boolean;
  rewardXp: number;
  rewardIcon: string;
}

export default function DayCard({
  label,
  isToday,
  isPast,
  isClaimed,
  isBonus,
  rewardXp,
  rewardIcon,
}: DayCardProps) {
  let bg = "rgba(255,255,255,0.02)";
  let borderColor = "rgba(255,255,255,0.06)";
  let labelColor = "var(--ts-text-dim, #9b94b3)";
  let rewardColor = "var(--ts-text, #f5f3ff)";

  if (isToday) {
    bg = "linear-gradient(160deg, rgba(255,107,26,0.18), rgba(255,107,26,0.05))";
    borderColor = "var(--ts-orange, #ff6b1a)";
    labelColor = "var(--ts-orange, #ff6b1a)";
  } else if (isBonus) {
    bg = "linear-gradient(160deg, rgba(157,77,255,0.15), rgba(157,77,255,0.05))";
    borderColor = "var(--ts-purple, #9d4dff)";
    labelColor = "var(--ts-purple, #9d4dff)";
    rewardColor = "var(--ts-purple, #9d4dff)";
  }

  return (
    <div
      className="day-card"
      style={{
        position: "relative",
        padding: "18px 10px",
        borderRadius: 14,
        textAlign: "center",
        cursor: "pointer",
        background: bg,
        border: `1px solid ${borderColor}`,
        transition: "all 0.2s",
        opacity: isPast && isClaimed ? 0.6 : 1,
        boxShadow: isToday ? "0 0 24px rgba(255,107,26,0.25)" : "none",
      }}
      onMouseEnter={(e) => {
        if (!isClaimed) {
          e.currentTarget.style.borderColor = "var(--ts-orange, #ff6b1a)";
          e.currentTarget.style.transform = "translateY(-2px)";
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = borderColor;
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      {/* Checkmark for claimed */}
      {isPast && isClaimed && (
        <div
          style={{
            position: "absolute",
            top: 6,
            right: 6,
            width: 16,
            height: 16,
            borderRadius: "50%",
            background: "var(--ts-green, #22e07d)",
            display: "grid",
            placeItems: "center",
            fontSize: 9,
            color: "#000",
          }}
        >
          <svg width="8" height="8" viewBox="0 0 8 8" fill="none" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1.5 4L3 5.5L6.5 2" />
          </svg>
        </div>
      )}

      <div
        style={{
          fontSize: 10,
          letterSpacing: "1.5px",
          color: labelColor,
          fontWeight: 700,
          marginBottom: 8,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 22, margin: "4px 0" }}>{rewardIcon}</div>
      <div
        style={{
          fontFamily: "var(--font-jetbrains-mono, 'JetBrains Mono', monospace)",
          fontWeight: 800,
          fontSize: 14,
          color: rewardColor,
        }}
      >
        +{rewardXp}
      </div>
    </div>
  );
}
