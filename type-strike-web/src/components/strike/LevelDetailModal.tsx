"use client";

import { IconX, IconStar, IconPlayerPlayFilled } from "@tabler/icons-react";
import type { LevelDetail } from "@/lib/types";

interface LevelDetailModalProps {
  level: LevelDetail;
  onClose: () => void;
  onStart: () => void;
  zoneColor: string;
  zoneName: string;
}

export default function LevelDetailModal({
  level,
  onClose,
  onStart,
  zoneColor,
  zoneName,
}: LevelDetailModalProps) {
  const hasStars = (level.player_stars ?? 0) > 0;

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.7)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        animation: "fadeIn 0.2s ease",
      }}
    >
      <div
        className="level-modal"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--ts-bg-3, #13101c)",
          border: "1px solid var(--ts-border, rgba(255,107,26,0.18))",
          borderRadius: 14,
          width: "90%",
          maxWidth: 480,
          maxHeight: "90vh",
          overflowY: "auto",
          animation: "modalSlide 0.3s ease",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "20px 24px",
            borderBottom: "1px solid var(--ts-border, rgba(255,107,26,0.18))",
          }}
        >
          <h3
            style={{
              fontFamily: "var(--font-orbitron, 'Orbitron', sans-serif)",
              fontSize: 16,
              fontWeight: 700,
              color: "var(--ts-text, #f5f3ff)",
            }}
          >
            Level {level.id}
          </h3>
          <button
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              border: "1px solid var(--ts-border, rgba(255,107,26,0.18))",
              background: "var(--ts-bg-4, #1e1e35)",
              color: "var(--ts-text-dim, #9b94b3)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 14,
              transition: "all 0.2s",
            }}
          >
            <IconX size={16} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: 24 }}>
          {/* Level visual */}
          <div style={{ textAlign: "center", padding: "20px 0", marginBottom: 16 }}>
            <div
              style={{
                fontFamily: "var(--font-orbitron, 'Orbitron', sans-serif)",
                fontSize: 48,
                fontWeight: 900,
                background: `linear-gradient(135deg, ${zoneColor}, var(--ts-yellow, #ffb800))`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              L{level.id}
            </div>
            <div style={{ fontSize: 12, color: "var(--ts-text-dim, #9b94b3)", marginTop: 4 }}>
              {zoneName} Zone
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: 8,
                marginTop: 12,
              }}
            >
              {[1, 2, 3].map((s) => {
                const filled = level.player_stars != null && s <= level.player_stars;
                return (
                  <IconStar
                    key={s}
                    size={24}
                    color={filled ? "var(--ts-yellow, #ffb800)" : "var(--ts-bg-5, #2a2a45)"}
                    fill={filled ? "var(--ts-yellow, #ffb800)" : "transparent"}
                  />
                );
              })}
            </div>
          </div>

          {/* Requirements */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 10,
              marginBottom: 20,
            }}
          >
            <div
              className="level-info-row"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "8px 12px",
                background: "var(--ts-bg-1, #0d0a14)",
                borderRadius: 6,
                fontSize: 13,
              }}
            >
              <span style={{ color: "var(--ts-text-dim, #9b94b3)" }}>Target WPM</span>
              <span style={{ fontWeight: 600, color: "var(--ts-orange, #ff6b1a)" }}>
                {level.pass_wpm} WPM
              </span>
            </div>
            <div
              className="level-info-row"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "8px 12px",
                background: "var(--ts-bg-1, #0d0a14)",
                borderRadius: 6,
                fontSize: 13,
              }}
            >
              <span style={{ color: "var(--ts-text-dim, #9b94b3)" }}>Accuracy</span>
              <span style={{ fontWeight: 600, color: "var(--ts-yellow, #ffb800)" }}>
                {level.pass_accuracy}% minimum
              </span>
            </div>
            <div
              className="level-info-row"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "8px 12px",
                background: "var(--ts-bg-1, #0d0a14)",
                borderRadius: 6,
                fontSize: 13,
              }}
            >
              <span style={{ color: "var(--ts-text-dim, #9b94b3)" }}>Difficulty</span>
              <span style={{ fontWeight: 600, color: "var(--ts-text, #f5f3ff)" }}>
                {level.difficulty}/5
              </span>
            </div>

            {/* Star thresholds */}
            <div
              style={{
                padding: "10px 12px",
                background: "var(--ts-bg-1, #0d0a14)",
                borderRadius: 6,
                fontSize: 11,
                lineHeight: 1.8,
              }}
            >
              <div style={{ color: "var(--ts-text-dim, #9b94b3)" }}>
                ⭐ {level.pass_wpm} WPM · {level.pass_accuracy}% ACC to pass
              </div>
              <div style={{ color: "var(--ts-text-dim, #9b94b3)" }}>
                ⭐⭐ {Math.round(level.pass_wpm * 1.15)} WPM · 95% ACC
              </div>
              <div style={{ color: "var(--ts-text-dim, #9b94b3)" }}>
                ⭐⭐⭐ {Math.round(level.pass_wpm * 1.3)} WPM · 98% ACC · 0 errors
              </div>
            </div>
          </div>

          {/* Player best */}
          {level.player_best_wpm != null && level.player_best_wpm > 0 && (
            <div
              style={{
                background: "rgba(255,184,0,0.06)",
                border: "1px solid rgba(255,184,0,0.15)",
                borderRadius: 10,
                padding: "12px 16px",
                textAlign: "center",
                marginBottom: 20,
              }}
            >
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: "1.5px",
                  color: "var(--ts-text-dim, #9b94b3)",
                  marginBottom: 4,
                  textTransform: "uppercase",
                }}
              >
                Your Best
              </div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: "var(--ts-yellow, #ffb800)",
                }}
              >
                {level.player_best_wpm} WPM ·{" "}
                {level.player_best_acc != null
                  ? `${(level.player_best_acc * 100).toFixed(0)}%`
                  : "—"}
                {level.player_stars != null && level.player_stars > 0 && (
                  <span> · {level.player_stars}⭐</span>
                )}
              </div>
            </div>
          )}

          {/* Paragraph preview */}
          <div
            style={{
              maxHeight: 80,
              overflow: "hidden",
              background: "var(--ts-bg-1, #0d0a14)",
              borderRadius: 8,
              padding: 12,
              marginBottom: 16,
            }}
          >
            <div
              style={{
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: "1.5px",
                color: "var(--ts-text-dim, #9b94b3)",
                marginBottom: 6,
                textTransform: "uppercase",
              }}
            >
              Preview
            </div>
            <p
              style={{
                fontSize: 12,
                lineHeight: 1.6,
                color: "var(--ts-text, #f5f3ff)",
                display: "-webkit-box",
                WebkitLineClamp: 3,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {level.paragraph}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            gap: 12,
            justifyContent: "flex-end",
            padding: "16px 24px",
            borderTop: "1px solid var(--ts-border, rgba(255,107,26,0.18))",
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "10px 24px",
              border: "1px solid var(--ts-border, rgba(255,107,26,0.18))",
              borderRadius: 8,
              cursor: "pointer",
              background: "var(--ts-bg-4, #1e1e35)",
              color: "var(--ts-text-dim, #9b94b3)",
              fontWeight: 600,
              fontSize: 14,
              fontFamily: "var(--font-orbitron, 'Orbitron', sans-serif)",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--ts-bg-5, #2a2a45)";
              e.currentTarget.style.color = "var(--ts-text, #f5f3ff)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "var(--ts-bg-4, #1e1e35)";
              e.currentTarget.style.color = "var(--ts-text-dim, #9b94b3)";
            }}
          >
            Close
          </button>
          <button
            onClick={onStart}
            style={{
              padding: "10px 24px",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              background: `linear-gradient(135deg, ${zoneColor}, #ff3d00)`,
              color: "#fff",
              fontWeight: 700,
              fontSize: 14,
              fontFamily: "var(--font-orbitron, 'Orbitron', sans-serif)",
              display: "flex",
              alignItems: "center",
              gap: 8,
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = `0 4px 15px ${zoneColor}66`;
              e.currentTarget.style.transform = "scale(1.02)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = "none";
              e.currentTarget.style.transform = "scale(1)";
            }}
          >
            <IconPlayerPlayFilled size={14} />
            {hasStars ? "Replay Level" : "Start Level"}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes modalSlide {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
