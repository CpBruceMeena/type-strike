"use client";

import { useRouter } from "next/navigation";
import { IconTrophy } from "@tabler/icons-react";
import type { LeaderboardEntry } from "@/lib/types";

interface LeaderboardPreviewProps {
  entries: LeaderboardEntry[];
  loading?: boolean;
  /** Clerk profile image URL for the current player (shown if they appear in the list) */
  currentUserImageUrl?: string | null;
  /** The current player's ID (to match their entry and show their image) */
  currentPlayerId?: number | null;
}

function getRankColor(rank: number): string {
  if (rank === 1) return "#ffb800";
  if (rank === 2) return "#c0c8d8";
  if (rank === 3) return "#cd7f32";
  return "var(--ts-text-dim, #9b94b3)";
}

function getRankShadow(rank: number): string {
  if (rank === 1) return "0 0 12px rgba(255,184,0,0.5)";
  return "none";
}

function getInitials(name: string): string {
  return name?.charAt(0)?.toUpperCase() || "?";
}

function getAvatarColor(index: number): string {
  const colors = [
    "linear-gradient(135deg, #ff6b1a, #ff3d3d)",
    "linear-gradient(135deg, #9d4dff, #6b2fa0)",
    "linear-gradient(135deg, #00e5ff, #0099cc)",
    "linear-gradient(135deg, #22e07d, #17994f)",
    "linear-gradient(135deg, #ffb800, #cc9300)",
  ];
  return colors[index % colors.length];
}

function UserAvatar({ name, isCurrentUser, imageUrl, colorIndex }: { name: string; isCurrentUser: boolean; imageUrl?: string | null; colorIndex: number }) {
  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={name || "Player"}
        referrerPolicy="no-referrer"
        style={{
          width: 38,
          height: 38,
          borderRadius: "50%",
          objectFit: "cover",
          border: "2px solid var(--ts-orange, #ff6b1a)",
        }}
      />
    );
  }
  return (
    <div
      style={{
        width: 38,
        height: 38,
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 13,
        fontWeight: 900,
        color: "#fff",
        background: getAvatarColor(colorIndex),
      }}
    >
      {getInitials(name)}
    </div>
  );
}

export default function LeaderboardPreview({ entries, loading, currentUserImageUrl, currentPlayerId }: LeaderboardPreviewProps) {
  const router = useRouter();

  return (
    <section
      className="section-leader"
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
            TOP <span style={{ color: "var(--ts-orange, #ff6b1a)" }}>STRIKERS</span>
          </h2>
          <p style={{ color: "var(--ts-text-dim, #9b94b3)", fontSize: 14, marginTop: 6 }}>
            This week&apos;s elite. Will you join them?
          </p>
        </div>
        <button
          className="leader-ghost-btn"
          onClick={() => router.push("/app/leaderboard")}
        >
          <IconTrophy size={14} />
          Full Ranks
        </button>
      </div>

      <div
        className="leader-card"
        style={{
          padding: 24,
          borderRadius: 18,
          background: "linear-gradient(160deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div style={{ color: "var(--ts-text-dim, #9b94b3)", fontSize: 13 }}>
              Loading leaderboard...
            </div>
          </div>
        ) : entries.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <div style={{ color: "var(--ts-text-dim, #9b94b3)", fontSize: 13 }}>
              No entries yet. Play a game to appear!
            </div>
          </div>
        ) : (
          <>
          {entries.slice(0, 5).map((entry, idx) => (
            <div key={entry.player_id}>
              {idx > 0 && (
                <div style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }} />
              )}
              <div
                className="leader-row"
                style={{
                  display: "grid",
                  gridTemplateColumns: "60px 1fr auto auto",
                  gap: 16,
                  alignItems: "center",
                  padding: "14px 12px",
                  borderRadius: 12,
                  cursor: "default",
                  transition: "background 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(255,107,26,0.05)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
              >
                <div
                  style={{
                    fontFamily: "var(--font-orbitron, 'Orbitron', sans-serif)",
                    fontWeight: 900,
                    fontSize: 20,
                    textAlign: "center",
                    color: getRankColor(entry.rank),
                    textShadow: getRankShadow(entry.rank),
                  }}
                >
                  #{entry.rank}
                </div>
                <div
                  className="leader-user"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <UserAvatar
                    name={entry.player_name}
                    isCurrentUser={currentPlayerId === entry.player_id}
                    imageUrl={currentPlayerId === entry.player_id ? currentUserImageUrl : undefined}
                    colorIndex={idx}
                  />
                  <div>
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: 14,
                        color: "var(--ts-text, #f5f3ff)",
                      }}
                    >
                      {entry.player_name || `Player ${entry.player_id}`}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--ts-text-dim, #9b94b3)",
                        letterSpacing: "1px",
                        fontWeight: 600,
                      }}
                    >
                      {entry.level != null ? `LV ${entry.level}` : ""} · {entry.xp?.toLocaleString() || 0} XP
                      {currentPlayerId === entry.player_id && entry.best_wpm != null && (
                        <span style={{ fontSize: 10, color: "var(--ts-orange-bright, #ff8a3d)", marginLeft: 6 }}>
                          (1min: {entry.best_wpm} WPM)
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div
                  className="leader-wpm"
                  style={{
                    fontFamily: "var(--font-jetbrains-mono, 'JetBrains Mono', monospace)",
                    fontWeight: 700,
                    color: "var(--ts-orange, #ff6b1a)",
                  }}
                >
                  {entry.best_wpm != null && entry.best_wpm > 0 ? `${entry.best_wpm} WPM` : '— WPM'}
                </div>
                <div
                  className="leader-xp"
                  style={{
                    fontFamily: "var(--font-jetbrains-mono, 'JetBrains Mono', monospace)",
                    fontWeight: 700,
                    color: "var(--ts-text-dim, #9b94b3)",
                    fontSize: 13,
                  }}
                >
                  {entry.total_stars ? `${entry.total_stars}★` : `${entry.xp?.toLocaleString() || 0} XP`}
                </div>
              </div>
            </div>
          ))}
          {/* 1-min WPM disclaimer */}
          <div
            style={{
              marginTop: 14,
              padding: "8px 12px",
              fontSize: 11,
              color: "var(--ts-text-dim, #9b94b3)",
              borderTop: "1px solid rgba(255,255,255,0.04)",
              textAlign: "center",
              fontStyle: "italic",
            }}
          >
            Rankings reflect highest 1-minute WPM in timed sessions
          </div>
          </>
        )}
      </div>

      <style>{`
        .leader-ghost-btn {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 10px 16px;
          border-radius: 10px;
          color: var(--ts-text-dim, #9b94b3);
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          text-decoration: none;
          transition: all 0.2s;
          background: transparent;
          border: none;
        }
        .leader-ghost-btn:hover {
          color: var(--ts-text, #f5f3ff);
          background: rgba(255,107,26,0.08);
        }
        @media (max-width: 960px) {
          .section-head h2 { font-size: 24px; }
        }
        @media (max-width: 520px) {
          .section-leader { padding: 24px 18px; }
        }
      `}</style>
    </section>
  );
}
