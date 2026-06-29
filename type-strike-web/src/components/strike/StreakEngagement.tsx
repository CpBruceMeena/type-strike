"use client";

import { useRouter } from "next/navigation";
import { IconFlame, IconBolt } from "@tabler/icons-react";

interface StreakEngagementProps {
  streakCount: number;
  dailyChallengeAvailable?: boolean;
}

export default function StreakEngagement({
  streakCount,
  dailyChallengeAvailable = true,
}: StreakEngagementProps) {
  const router = useRouter();

  // Build 7-day streak dots
  const dots = Array.from({ length: 7 }, (_, i) => i < streakCount);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 2fr",
        gap: 16,
        marginBottom: 28,
      }}
      className="strike-engagement"
    >
      {/* Streak Card */}
      <div
        style={{
          background: "linear-gradient(135deg, rgba(255,107,43,0.1), rgba(255,61,0,0.05))",
          border: "1px solid rgba(255,107,43,0.2)",
          borderRadius: 12,
          padding: "16px 20px",
          display: "flex",
          alignItems: "center",
          gap: 14,
        }}
      >
        <div style={{ fontSize: 36, animation: "flameFlicker 1.5s ease-in-out infinite alternate" }}>
          🔥
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span
            style={{
              fontFamily: "var(--font-jetbrains-mono, 'JetBrains Mono', monospace)",
              fontWeight: 700,
              fontSize: 16,
              color: "var(--ts-orange-bright, #ff8a3d)",
            }}
          >
            {streakCount} Day Streak!
          </span>
          <div style={{ display: "flex", gap: 5 }}>
            {dots.map((completed, idx) => (
              <div
                key={idx}
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  border: `2px solid ${completed ? "var(--ts-orange, #ff6b1a)" : "var(--ts-bg-4, #1e1e35)"}`,
                  background: completed ? "rgba(255,107,43,0.2)" : "transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 8,
                  color: completed ? "var(--ts-orange, #ff6b1a)" : "transparent",
                  fontWeight: 700,
                  transition: "all 0.3s",
                  boxShadow: idx === streakCount ? "0 0 0 4px rgba(255,107,43,0.15)" : "none",
                }}
              >
                {completed ? "✓" : ""}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Daily Challenge Card */}
      {dailyChallengeAvailable && (
        <div
          onClick={() => router.push("/app/daily-challenges")}
          style={{
            background: "linear-gradient(135deg, rgba(59,130,246,0.1), rgba(99,102,241,0.05))",
            border: "1px solid rgba(59,130,246,0.2)",
            borderRadius: 12,
            padding: "14px 20px",
            display: "flex",
            alignItems: "center",
            gap: 14,
            cursor: "pointer",
            transition: "all 0.25s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "rgba(59,130,246,0.4)";
            e.currentTarget.style.transform = "translateY(-1px)";
            e.currentTarget.style.boxShadow = "0 4px 20px rgba(59,130,246,0.1)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "rgba(59,130,246,0.2)";
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          <div style={{ fontSize: 28, filter: "drop-shadow(0 0 8px rgba(251,191,36,0.5))" }}>
            <IconBolt size={28} color="#fbbf24" />
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <span
              style={{
                fontSize: 10,
                textTransform: "uppercase",
                letterSpacing: "1.5px",
                color: "#3b82f6",
                fontWeight: 700,
              }}
            >
              Daily Challenge
            </span>
            <span style={{ fontSize: 13, color: "var(--ts-text-dim, #9b94b3)" }}>
              Complete for bonus XP & rewards
            </span>
          </div>
          <span
            style={{
              fontFamily: "var(--font-orbitron, 'Orbitron', sans-serif)",
              fontSize: 13,
              fontWeight: 700,
              color: "var(--ts-yellow, #ffb800)",
              whiteSpace: "nowrap",
            }}
          >
            +500 XP
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              router.push("/app/daily-challenges");
            }}
            style={{
              padding: "8px 20px",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              background: "linear-gradient(135deg, #3b82f6, #6366f1)",
              color: "#fff",
              fontWeight: 700,
              fontSize: 13,
              letterSpacing: "1px",
              textTransform: "uppercase",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "scale(1.05)";
              e.currentTarget.style.boxShadow = "0 4px 15px rgba(59,130,246,0.4)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            PLAY
          </button>
        </div>
      )}

      <style>{`
        @media (max-width: 900px) {
          .strike-engagement { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
