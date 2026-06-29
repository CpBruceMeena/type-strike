"use client";

import { IconStarFilled, IconPlayerPlayFilled, IconLock, IconCrown, IconBolt } from "@tabler/icons-react";

interface LevelNodeProps {
  levelNum: number;
  state: "completed" | "current" | "locked";
  isBoss: boolean;
  isMiniBoss: boolean;
  stars?: number;
  onClick: () => void;
  zoneColor: string;
}

export default function LevelNode({
  levelNum,
  state,
  isBoss,
  isMiniBoss,
  stars = 0,
  onClick,
  zoneColor,
}: LevelNodeProps) {
  const isDisabled = state === "locked";
  const isCurrent = state === "current";
  const isCompleted = state === "completed";

  // Premium nodes every 7th level (only when locked, as placeholder)
  const isPremium = levelNum % 7 === 0 && levelNum > 2 && !isCompleted;

  const nodeWidth = isBoss ? 76 : 68;
  const nodeHeight = isBoss ? 88 : 80;

  let borderColor = "var(--ts-bg-4, #1e1e35)";
  let bg = "var(--ts-bg-3, #13101c)";
  let levelColor = "var(--ts-text-dim, #9b94b3)";
  let cursor = "pointer";

  if (isCompleted) {
    borderColor = `${zoneColor}80`;
    bg = `rgba(255,107,43,0.08)`;
    levelColor = zoneColor;
  } else if (isCurrent) {
    borderColor = zoneColor;
    bg = `rgba(255,107,43,0.12)`;
    levelColor = zoneColor;
  } else if (isPremium) {
    borderColor = "rgba(192,132,252,0.3)";
    levelColor = "#c084fc";
  }

  if (isDisabled) {
    cursor = "not-allowed";
    borderColor = "var(--ts-bg-4, #1e1e35)";
  }

  const renderIcon = () => {
    if (isCompleted) return <IconStarFilled size={16} color={zoneColor} />;
    if (isCurrent) return <IconPlayerPlayFilled size={16} color={zoneColor} />;
    if (isBoss) return <IconCrown size={20} color="var(--ts-yellow, #ffb800)" />;
    if (isMiniBoss) return <IconBolt size={16} color="var(--ts-text-dim, #9b94b3)" />;
    if (isPremium) return <IconLock size={14} color="#c084fc" />;
    return <IconLock size={14} color="var(--ts-text-dim, #9b94b3)" />;
  };

  return (
    <div style={{ position: "relative", flexShrink: 0 }}>
      {/* Premium badge */}
      {isPremium && !isCompleted && (
        <div
          style={{
            position: "absolute",
            top: -8,
            right: -4,
            fontSize: 7,
            fontWeight: 800,
            color: "#fff",
            background: "linear-gradient(135deg, #a855f7, #c084fc)",
            padding: "2px 4px",
            borderRadius: 3,
            letterSpacing: "0.5px",
            zIndex: 3,
          }}
        >
          PRO
        </div>
      )}

      {/* Current indicator arrow */}
      {isCurrent && (
        <div
          style={{
            position: "absolute",
            top: -18,
            left: "50%",
            transform: "translateX(-50%)",
            fontSize: 12,
            color: zoneColor,
          }}
        >
          ▼
        </div>
      )}

      <div
        onClick={isDisabled ? undefined : onClick}
        style={{
          width: nodeWidth,
          height: nodeHeight,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 4,
          cursor,
          borderRadius: 8,
          border: `2px solid ${borderColor}`,
          background: bg,
          transition: "all 0.3s",
          position: "relative",
          opacity: isDisabled ? 0.4 : 1,
          boxShadow: isCurrent ? `0 0 0 4px ${zoneColor}30, 0 0 20px ${zoneColor}20` : isBoss ? "0 0 12px rgba(255,215,0,0.15)" : "none",
        }}
        onMouseEnter={(e) => {
          if (!isDisabled) {
            e.currentTarget.style.transform = "translateY(-3px)";
          }
        }}
        onMouseLeave={(e) => {
          if (!isDisabled) {
            e.currentTarget.style.transform = "translateY(0)";
          }
        }}
      >
        {isBoss ? (
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: "var(--ts-yellow, #ffb800)",
              fontFamily: "var(--font-orbitron, 'Orbitron', sans-serif)",
            }}
          >
            BOSS
          </span>
        ) : (
          <span style={{ fontSize: 11, color: levelColor, fontWeight: 600 }}>
            L{levelNum}
          </span>
        )}
        <span>{renderIcon()}</span>
        {isCompleted && stars > 0 && (
          <div style={{ display: "flex", gap: 2 }}>
            {Array.from({ length: stars }).map((_, i) => (
              <IconStarFilled key={i} size={8} color="var(--ts-yellow, #ffb800)" />
            ))}
          </div>
        )}
      </div>

      {/* Boss glow border */}
      {isBoss && !isDisabled && (
        <div
          style={{
            position: "absolute",
            inset: -2,
            borderRadius: 10,
            background: "linear-gradient(135deg, var(--ts-yellow, #ffb800), var(--ts-orange, #ff6b1a), var(--ts-yellow, #ffb800))",
            opacity: 0.15,
            zIndex: -1,
            pointerEvents: "none",
          }}
        />
      )}
    </div>
  );
}
