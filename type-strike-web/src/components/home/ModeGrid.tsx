"use client";

import { useRouter } from "next/navigation";
import { IconBolt, IconSchool, IconBraces, IconArrowRight } from "@tabler/icons-react";
import GameModeCard from "./GameModeCard";
import { showToast } from "./ToastNotification";

export default function ModeGrid() {
  const router = useRouter();

  const modes = [
    {
      title: "STRIKE",
      description: "Battle through dynamic levels, defeat AI opponents, and climb the bracket. Pure competitive typing.",
      tag: "PVP · RANKED",
      color: "var(--ts-orange, #ff6b1a)",
      icon: <IconBolt size={24} />,
      href: "/app/map",
    },
    {
      title: "LEARN",
      description: "Master fundamentals with adaptive lessons. Touch typing, finger placement, drill sessions.",
      tag: "CAMPAIGN · BEGINNER",
      color: "var(--ts-green, #22e07d)",
      icon: <IconSchool size={24} />,
      href: "/learn",
    },
    {
      title: "CODER",
      description: "Real code snippets in 15+ languages. DSA challenges. Built for developers who type for a living.",
      tag: "DEV MODE · ADVANCED",
      color: "var(--ts-cyan, #00e5ff)",
      icon: <IconBraces size={24} />,
      href: "/play/coder",
    },
  ];

  return (
    <section
      className="section section-modes"
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
            CHOOSE YOUR{" "}
            <span style={{ color: "var(--ts-orange, #ff6b1a)" }}>BATTLEGROUND</span>
          </h2>
          <p style={{ color: "var(--ts-text-dim, #9b94b3)", fontSize: 14, marginTop: 6 }}>
            Three modes. Infinite ways to dominate the keyboard.
          </p>
        </div>
      </div>

      <div
        className="mode-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 20,
        }}
      >
        {modes.map((mode) => (
          <GameModeCard
            key={mode.title}
            title={mode.title}
            description={mode.description}
            tag={mode.tag}
            color={mode.color}
            icon={mode.icon}
            onClick={() => router.push(mode.href)}
          />
        ))}
      </div>

      <style>{`
        @media (max-width: 960px) {
          .mode-grid { grid-template-columns: 1fr; }
          .section-head h2 { font-size: 24px; }
        }
        @media (max-width: 520px) {
          .section-modes { padding: 24px 18px; }
        }
        .mode-card:hover .mode-card-glow { opacity: 0.2 !important; }
        .mode-card:hover .mode-card-line { opacity: 1 !important; }
        .mode-card:hover .mode-arrow {
          background: var(--clr) !important;
          color: #fff !important;
          border-color: var(--clr) !important;
          transform: translateX(4px);
        }
      `}</style>
    </section>
  );
}
