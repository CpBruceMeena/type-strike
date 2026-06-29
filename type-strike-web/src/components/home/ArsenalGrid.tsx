"use client";

import { useRouter } from "next/navigation";
import { IconAward, IconMedal, IconTrophy, IconChartBar } from "@tabler/icons-react";

interface ArsenalGridProps {
  playerRank: number | null;
  achievementCount?: { unlocked: number; total: number };
  rankName: string;
  bestWpm: number;
}

export default function ArsenalGrid({
  playerRank,
  achievementCount,
  rankName,
  bestWpm,
}: ArsenalGridProps) {
  const router = useRouter();

  const items = [
    {
      label: "Leaderboard",
      desc: "Climb the ranks",
      color: "var(--ts-green, #22e07d)",
      icon: <IconAward size={18} />,
      value: playerRank ? `#${playerRank.toLocaleString()}` : "—",
      href: "/app/leaderboard",
    },
    {
      label: "Feats",
      desc: "Achievements & badges",
      color: "var(--ts-purple, #9d4dff)",
      icon: <IconMedal size={18} />,
      value: achievementCount ? `${achievementCount.unlocked} / ${achievementCount.total}` : "—",
      href: "/app/achievements",
    },
    {
      label: "Ranks",
      desc: "Bronze → Silver → Gold",
      color: "var(--ts-yellow, #ffb800)",
      icon: <IconTrophy size={18} />,
      value: rankName,
      href: "/app/ranks",
    },
    {
      label: "Stats",
      desc: "Your performance",
      color: "var(--ts-cyan, #00e5ff)",
      icon: <IconChartBar size={18} />,
      value: bestWpm > 0 ? `${bestWpm} WPM` : "—",
      href: "/app/stats",
    },
  ];

  return (
    <section
      className="section-arsenal"
      style={{
        position: "relative",
        zIndex: 1,
        maxWidth: 1400,
        margin: "0 auto",
        padding: "40px 32px",
      }}
    >
      <div
        className="section-head"
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          marginBottom: 32,
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div>
          <h2
            style={{
              fontFamily: "var(--font-orbitron, 'Orbitron', sans-serif)",
              fontWeight: 800,
              fontSize: 32,
              letterSpacing: "1px",
              color: "var(--ts-text, #f5f3ff)",
            }}
          >
            YOUR{" "}
            <span style={{ color: "var(--ts-orange, #ff6b1a)" }}>ARSENAL</span>
          </h2>
          <p style={{ color: "var(--ts-text-dim, #9b94b3)", fontSize: 14, marginTop: 6 }}>
            Track progress, unlock achievements, climb ranks.
          </p>
        </div>
      </div>

      <div
        className="arsenal-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 16,
        }}
      >
        {items.map((item) => (
          <div
            key={item.label}
            className="arsenal-card"
            onClick={() => router.push(item.href)}
            style={{
              padding: 22,
              borderRadius: 16,
              cursor: "pointer",
              background: "linear-gradient(160deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))",
              border: "1px solid rgba(255,255,255,0.06)",
              transition: "all 0.25s",
              position: "relative",
              overflow: "hidden",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = item.color;
              e.currentTarget.style.transform = "translateY(-3px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 10,
                display: "grid",
                placeItems: "center",
                background: `color-mix(in srgb, ${item.color} 18%, transparent)`,
                color: item.color,
                fontSize: 18,
                marginBottom: 14,
              }}
            >
              {item.icon}
            </div>
            <h5
              style={{
                fontFamily: "var(--font-orbitron, 'Orbitron', sans-serif)",
                fontSize: 16,
                fontWeight: 700,
                marginBottom: 4,
                color: "var(--ts-text, #f5f3ff)",
              }}
            >
              {item.label}
            </h5>
            <p style={{ fontSize: 12, color: "var(--ts-text-dim, #9b94b3)", margin: 0 }}>
              {item.desc}
            </p>
            <p
              style={{
                marginTop: 14,
                fontFamily: "var(--font-jetbrains-mono, 'JetBrains Mono', monospace)",
                fontWeight: 800,
                fontSize: 22,
                color: item.color,
              }}
            >
              {item.value}
            </p>
          </div>
        ))}
      </div>

      <style>{`
        @media (max-width: 960px) {
          .arsenal-grid { grid-template-columns: repeat(2, 1fr); }
          .section-head h2 { font-size: 24px; }
        }
        @media (max-width: 520px) {
          .section-arsenal { padding: 24px 18px; }
          .arsenal-grid { grid-template-columns: 1fr 1fr; }
        }
      `}</style>
    </section>
  );
}
