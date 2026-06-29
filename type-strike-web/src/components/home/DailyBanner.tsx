"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { IconTargetArrow } from "@tabler/icons-react";

function getTimeToMidnight() {
  const now = new Date();
  const end = new Date();
  end.setHours(24, 0, 0, 0);
  return Math.max(0, Math.floor((end.getTime() - now.getTime()) / 1000));
}

export default function DailyBanner() {
  const router = useRouter();
  const [timeLeft, setTimeLeft] = useState(getTimeToMidnight);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(getTimeToMidnight());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const h = String(Math.floor(timeLeft / 3600)).padStart(2, "0");
  const m = String(Math.floor((timeLeft % 3600) / 60)).padStart(2, "0");
  const s = String(Math.floor(timeLeft % 60)).padStart(2, "0");

  return (
    <div
      className="daily-banner"
      style={{
        marginTop: 24,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "24px 28px",
        borderRadius: 18,
        gap: 24,
        background: "linear-gradient(120deg, rgba(255,107,26,0.12), rgba(157,77,255,0.08))",
        border: "1px solid var(--ts-border, rgba(255,107,26,0.18))",
        position: "relative",
        overflow: "hidden",
        flexWrap: "wrap",
      }}
    >
      {/* Rotating glow */}
      <div
        style={{
          position: "absolute",
          top: "-50%",
          right: "-10%",
          width: 300,
          height: 300,
          background: "radial-gradient(circle, var(--ts-orange, #ff6b1a), transparent 70%)",
          opacity: 0.2,
          animation: "rotateGlow 12s linear infinite",
          pointerEvents: "none",
        }}
      />

      <div
        className="daily-left"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 18,
          position: "relative",
          zIndex: 1,
        }}
      >
        <div
          style={{
            width: 54,
            height: 54,
            borderRadius: 14,
            background: "linear-gradient(135deg, var(--ts-orange, #ff6b1a), var(--ts-red, #ff3d3d))",
            display: "grid",
            placeItems: "center",
            fontSize: 22,
            color: "#fff",
            boxShadow: "0 8px 20px rgba(255,107,26,0.4)",
          }}
        >
          <IconTargetArrow size={22} />
        </div>
        <div>
          <h4
            style={{
              fontFamily: "var(--font-orbitron, 'Orbitron', sans-serif)",
              fontWeight: 700,
              fontSize: 18,
              marginBottom: 4,
              color: "var(--ts-text, #f5f3ff)",
            }}
          >
            Daily Challenges Live
          </h4>
          <span style={{ color: "var(--ts-text-dim, #9b94b3)", fontSize: 13 }}>
            Complete 3 quick tasks · Earn bonus XP & loot drops
          </span>
        </div>
      </div>

      <div
        className="daily-timer"
        style={{
          display: "flex",
          gap: 6,
          fontFamily: "var(--font-jetbrains-mono, 'JetBrains Mono', monospace)",
          fontWeight: 700,
          alignItems: "center",
          color: "var(--ts-orange, #ff6b1a)",
          position: "relative",
          zIndex: 1,
        }}
      >
        <span
          style={{
            fontSize: 11,
            letterSpacing: 2,
            color: "var(--ts-text-dim, #9b94b3)",
            marginRight: 8,
            fontFamily: "Inter, sans-serif",
          }}
        >
          RESETS IN
        </span>
        <TimerBox value={h} />
        <span style={{ color: "var(--ts-text-dim, #9b94b3)" }}>:</span>
        <TimerBox value={m} />
        <span style={{ color: "var(--ts-text-dim, #9b94b3)" }}>:</span>
        <TimerBox value={s} />
        <button
          onClick={() => router.push("/app/daily-challenges")}
          className="daily-view-btn"
        >
          View
        </button>
      </div>

      <style>{`
        .daily-view-btn {
          margin-left: 14px;
          padding: 12px 20px;
          border-radius: 12px;
          border: none;
          background: linear-gradient(135deg, var(--ts-orange, #ff6b1a), var(--ts-red, #ff3d3d));
          color: #fff;
          font-family: var(--font-orbitron, "Orbitron", sans-serif);
          font-weight: 700;
          font-size: 13px;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          cursor: pointer;
          box-shadow: 0 8px 24px rgba(255,107,26,0.45), inset 0 1px 0 rgba(255,255,255,0.25);
          transition: transform 0.15s ease, box-shadow 0.2s;
        }
        .daily-view-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 32px rgba(255,107,26,0.6);
        }
      `}</style>
    </div>
  );
}

function TimerBox({ value }: { value: string }) {
  return (
    <div
      style={{
        padding: "8px 12px",
        background: "rgba(0,0,0,0.4)",
        borderRadius: 8,
        border: "1px solid var(--ts-border, rgba(255,107,26,0.18))",
        minWidth: 44,
        textAlign: "center",
        color: "var(--ts-orange, #ff6b1a)",
      }}
    >
      {value}
    </div>
  );
}
