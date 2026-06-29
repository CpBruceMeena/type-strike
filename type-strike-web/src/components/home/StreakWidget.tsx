"use client";

import { IconFlame, IconGift } from "@tabler/icons-react";
import RewardCalendar from "./RewardCalendar";

interface StreakWidgetProps {
  streakCount: number;
  onClaim: () => void;
}

export default function StreakWidget({ streakCount, onClaim }: StreakWidgetProps) {
  return (
    <section
      className="section-streak"
      style={{
        position: "relative",
        zIndex: 1,
        maxWidth: 1400,
        margin: "0 auto",
        padding: "40px 32px",
      }}
    >
      <div
        className="streak-card"
        style={{
          padding: 32,
          borderRadius: 20,
          background: "linear-gradient(160deg, rgba(255,107,26,0.08), rgba(255,61,61,0.04))",
          border: "1px solid var(--ts-border, rgba(255,107,26,0.18))",
        }}
      >
        {/* Streak header */}
        <div
          className="streak-head"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 24,
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <div
            className="streak-info"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 18,
            }}
          >
            <div
              className="streak-flame"
              style={{
                width: 60,
                height: 60,
                borderRadius: 16,
                background: "linear-gradient(135deg, var(--ts-orange, #ff6b1a), var(--ts-red, #ff3d3d))",
                display: "grid",
                placeItems: "center",
                fontSize: 28,
                color: "#fff",
                boxShadow: "0 0 30px rgba(255,107,26,0.5)",
                animation: "flameFlicker 1.5s ease-in-out infinite",
              }}
            >
              <IconFlame size={28} fill="currentColor" />
            </div>
            <div>
              <p
                style={{
                  fontSize: 11,
                  letterSpacing: 2,
                  color: "var(--ts-text-dim, #9b94b3)",
                  textTransform: "uppercase",
                  fontWeight: 600,
                  margin: 0,
                }}
              >
                Active Streak
              </p>
              <p
                style={{
                  fontFamily: "var(--font-orbitron, 'Orbitron', sans-serif)",
                  fontWeight: 800,
                  fontSize: 28,
                  margin: 0,
                  color: "var(--ts-text, #f5f3ff)",
                }}
              >
                <span style={{ color: "var(--ts-orange, #ff6b1a)", marginRight: 6 }}>
                  {streakCount}
                </span>
                days
              </p>
            </div>
          </div>

          <button
            className="claim-btn"
            onClick={onClaim}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              padding: "14px 22px",
              borderRadius: 12,
              cursor: "pointer",
              border: "none",
              background: "linear-gradient(135deg, var(--ts-orange, #ff6b1a), var(--ts-red, #ff3d3d))",
              color: "#fff",
              fontFamily: "var(--font-orbitron, 'Orbitron', sans-serif)",
              fontWeight: 700,
              fontSize: 13,
              letterSpacing: "1.5px",
              textTransform: "uppercase",
              boxShadow: "0 8px 24px rgba(255,107,26,0.4)",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 12px 32px rgba(255,107,26,0.55)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 8px 24px rgba(255,107,26,0.4)";
            }}
          >
            <IconGift size={16} />
            Claim Rewards
          </button>
        </div>

        {/* Progress bar */}
        <div
          className="progress-track"
          style={{
            height: 8,
            background: "rgba(255,255,255,0.05)",
            borderRadius: 999,
            overflow: "hidden",
            margin: "8px 0 18px",
            border: "1px solid rgba(255,255,255,0.04)",
          }}
        >
          <div
            className="progress-fill"
            style={{
              height: "100%",
              width: `${Math.min((streakCount / 30) * 100, 100)}%`,
              background: "linear-gradient(90deg, var(--ts-orange, #ff6b1a), var(--ts-yellow, #ffb800), var(--ts-orange, #ff6b1a))",
              backgroundSize: "200% 100%",
              borderRadius: 999,
              boxShadow: "0 0 12px var(--ts-orange, #ff6b1a)",
              animation: "fillShine 3s linear infinite",
            }}
          />
        </div>
        <div
          className="progress-meta"
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 11,
            letterSpacing: 2,
            color: "var(--ts-text-dim, #9b94b3)",
            textTransform: "uppercase",
            fontWeight: 600,
          }}
        >
          <span>DAY 1</span>
          <span>DAY 30+</span>
        </div>

        {/* Reward calendar */}
        <div
          style={{
            marginTop: 24,
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 11,
            letterSpacing: 2,
            color: "var(--ts-text-dim, #9b94b3)",
            textTransform: "uppercase",
            fontWeight: 700,
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="var(--ts-orange, #ff6b1a)" stroke="none">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
          Reward Calendar
        </div>

        <RewardCalendar streakCount={streakCount} />
      </div>

      <style>{`
        @media (max-width: 520px) {
          .section-streak { padding: 24px 18px; }
          .streak-card { padding: 20px; }
        }
      `}</style>
    </section>
  );
}
