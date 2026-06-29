"use client";

import { useRouter } from "next/navigation";
import {
  IconBolt,
  IconBook,
  IconFlame,
  IconCheck,
  IconPlayerPlay,
  IconKeyboard,
  IconMap,
} from "@tabler/icons-react";
import AnimatedKeyboard from "./AnimatedKeyboard";
import FloatingBadge from "./FloatingBadge";

interface HeroSectionProps {
  displayName: string;
  rankName: string;
  level: number;
  bestWpm: number;
  totalXp: number;
  playerRank: number | null;
  avgAccuracy: number;
  streakCount: number;
}

export default function HeroSection({
  displayName,
  rankName,
  level,
  bestWpm,
  totalXp,
  playerRank,
  avgAccuracy,
  streakCount,
}: HeroSectionProps) {
  const router = useRouter();

  return (
    <section className="hero-section" style={{ position: "relative", zIndex: 1, maxWidth: 1400, margin: "0 auto", padding: "60px 32px 40px" }}>
      <style>{`
        .hero-grid {
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          gap: 48px;
          align-items: center;
        }
        .hero-tag {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 8px 14px;
          border-radius: 999px;
          background: rgba(255,107,26,0.1);
          border: 1px solid var(--ts-border, rgba(255,107,26,0.18));
          font-family: var(--font-jetbrains-mono, "JetBrains Mono", monospace);
          font-size: 12px;
          letter-spacing: 1px;
          color: var(--ts-orange, #ff6b1a);
          margin-bottom: 24px;
          text-transform: uppercase;
        }
        .hero-tag .dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--ts-green, #22e07d);
          box-shadow: 0 0 8px var(--ts-green, #22e07d);
          animation: blink 1.5s infinite;
        }
        .hero-title {
          font-family: var(--font-orbitron, "Orbitron", sans-serif);
          font-weight: 900;
          font-size: clamp(40px, 6vw, 82px);
          line-height: 0.95;
          letter-spacing: -1px;
          margin-bottom: 20px;
        }
        .hero-title .stroke {
          -webkit-text-stroke: 2px var(--ts-orange, #ff6b1a);
          color: transparent;
          display: inline-block;
        }
        .hero-title .grad {
          background: linear-gradient(135deg, var(--ts-orange, #ff6b1a) 0%, var(--ts-yellow, #ffb800) 50%, var(--ts-red, #ff3d3d) 100%);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          display: inline-block;
          text-shadow: 0 0 60px rgba(255,107,26,0.3);
        }
        .hero-sub {
          font-size: 18px;
          color: var(--ts-text-dim, #9b94b3);
          max-width: 540px;
          line-height: 1.6;
          margin-bottom: 32px;
        }
        .hero-stats {
          display: flex;
          gap: 32px;
          margin-bottom: 36px;
          flex-wrap: wrap;
        }
        .stat-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .stat-val {
          font-family: var(--font-orbitron, "Orbitron", sans-serif);
          font-weight: 800;
          font-size: 26px;
          color: var(--ts-text, #f5f3ff);
        }
        .stat-val .accent {
          color: var(--ts-orange, #ff6b1a);
        }
        .stat-lbl {
          font-size: 11px;
          letter-spacing: 2px;
          color: var(--ts-text-dim, #9b94b3);
          text-transform: uppercase;
          font-weight: 600;
        }
        .cta-row {
          display: flex;
          gap: 14px;
          flex-wrap: wrap;
          align-items: center;
        }
        .btn-primary {
          position: relative;
          overflow: hidden;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 16px 28px;
          border-radius: 12px;
          font-family: var(--font-orbitron, "Orbitron", sans-serif);
          font-weight: 700;
          font-size: 14px;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          cursor: pointer;
          border: none;
          background: linear-gradient(135deg, var(--ts-orange, #ff6b1a), var(--ts-red, #ff3d3d));
          color: #fff;
          box-shadow: 0 8px 24px rgba(255,107,26,0.45), inset 0 1px 0 rgba(255,255,255,0.25);
          transition: transform 0.15s ease, box-shadow 0.2s;
          text-decoration: none;
        }
        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 32px rgba(255,107,26,0.6);
        }
        .btn-ghost {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 16px 28px;
          border-radius: 12px;
          font-family: var(--font-orbitron, "Orbitron", sans-serif);
          font-weight: 700;
          font-size: 14px;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          cursor: pointer;
          background: rgba(255,255,255,0.04);
          color: var(--ts-text, #f5f3ff);
          border: 1px solid rgba(255,255,255,0.1);
          transition: transform 0.15s ease, box-shadow 0.2s;
          text-decoration: none;
        }
        .btn-ghost:hover {
          background: rgba(255,255,255,0.08);
          border-color: var(--ts-orange, #ff6b1a);
        }
        .hero-visual {
          position: relative;
          height: 480px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        @media (max-width: 960px) {
          .hero-grid { grid-template-columns: 1fr; }
          .hero-visual { height: 380px; order: -1; }
          .hero-stats { gap: 18px; }
          .stat-val { font-size: 22px; }
        }
        @media (max-width: 520px) {
          .hero-section { padding: 36px 18px 20px; }
          .hero-visual { height: 300px; }
        }
      `}</style>

      <div className="hero-grid">
        <div>
          {/* Online tag removed as per user decision */}

          <h1 className="hero-title">
            <span className="stroke">MASTER</span>
            <br />
            <span className="grad">THE KEYS.</span>
            <br />
            <span style={{ color: "var(--ts-text, #f5f3ff)" }}>DOMINATE.</span>
          </h1>
          <p className="hero-sub">
            Welcome back,{" "}
            <strong style={{ color: "var(--ts-orange, #ff6b1a)" }}>{displayName}</strong>.
            Sharpen your fingers, climb the global ranks, and outpace coders
            worldwide in real-time typing battles.
          </p>

          <div className="hero-stats">
            <div className="stat-item">
              <div className="stat-val">
                {bestWpm > 0 ? (
                  <><span className="accent">{bestWpm}</span> WPM</>
                ) : (
                  <><span className="accent">—</span> WPM</>
                )}
              </div>
              <div className="stat-lbl">Personal Best</div>
            </div>
            <div className="stat-item">
              <div className="stat-val">
                {totalXp > 0 ? totalXp : "—"}
                {totalXp > 0 && <span className="accent"> XP</span>}
              </div>
              <div className="stat-lbl">Total Earned</div>
            </div>
            <div className="stat-item">
              <div className="stat-val">
                #<span className="accent">{playerRank ? playerRank.toLocaleString() : "—"}</span>
              </div>
              <div className="stat-lbl">Global Rank</div>
            </div>
          </div>

          <div className="cta-row">
            <button
              className="btn-primary"
              onClick={() => router.push("/play/contest")}
            >
              <IconPlayerPlay size={16} />
              Play Now
            </button>
            <button
              className="btn-ghost"
              onClick={() => router.push("/app/map")}
            >
              <IconMap size={16} />
              Strike
            </button>
            <button
              className="btn-ghost"
              onClick={() => router.push("/learn")}
            >
              <IconBook size={16} />
              How to Play
            </button>
          </div>
        </div>

        <div className="hero-visual">
          <FloatingBadge
            icon={<IconBolt size={18} />}
            label={"+25 XP"}
            color="var(--ts-orange, #ff6b1a)"
            style={{ top: "8%", left: "-10px", animationDelay: "0s" }}
          />
          <FloatingBadge
            icon={<IconKeyboard size={18} />}
            label={`${bestWpm > 0 ? bestWpm : "—"} WPM`}
            color="var(--ts-cyan, #00e5ff)"
            style={{ top: "20%", right: "-10px", animationDelay: "1s" }}
          />
          <FloatingBadge
            icon={<IconCheck size={18} />}
            label={`${avgAccuracy > 0 ? (avgAccuracy * 100).toFixed(0) : "—"}% Accuracy`}
            color="var(--ts-green, #22e07d)"
            style={{ bottom: "18%", left: "0", animationDelay: "2s" }}
          />
          <FloatingBadge
            icon={<IconFlame size={18} />}
            label={`${streakCount} Day Streak`}
            color="var(--ts-yellow, #ffb800)"
            style={{ bottom: "6%", right: "10%", animationDelay: "1.5s" }}
          />

          <AnimatedKeyboard />
        </div>
      </div>
    </section>
  );
}
