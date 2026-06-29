"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { IconFlame } from "@tabler/icons-react";
import { SignInButton, SignUpButton, useUser } from "@clerk/nextjs";
import { usePlayer } from "@/hooks/usePlayer";
import { useProgression } from "@/hooks/useProgression";
import { api } from "@/lib/api";

// Module-level cache for leaderboard rank (avoids re-fetch across layout re-mounts)
let cachedRank: number | null = null;
let cachedRankPlayerId: number | null = null;

// ── Component ───────────────────────────────────────────

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isSignedIn, user } = useUser();
  const { player, playerId } = usePlayer();
  const { progression } = useProgression(playerId);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [playerRank, setPlayerRank] = useState<number | null>(
    playerId === cachedRankPlayerId ? cachedRank : null
  );
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // Fetch numeric leaderboard rank
  const fetchRank = useCallback(async () => {
    if (!playerId) return;

    if (cachedRankPlayerId === playerId && cachedRank != null) {
      if (mountedRef.current) setPlayerRank(cachedRank);
      return;
    }

    try {
      const resp = await api.getPlayerRank(playerId);
      const rank = resp?.entry?.rank;
      if (rank != null && mountedRef.current) {
        cachedRank = rank;
        cachedRankPlayerId = playerId;
        setPlayerRank(rank);
      }
    } catch {
      // Non-critical
    }
  }, [playerId]);

  useEffect(() => {
    fetchRank();
  }, [fetchRank]);

  const isActive = (route: string) => {
    if (route === "/app/home") return pathname === "/app/home";
    if (route === "/app/map") return pathname.startsWith("/app/map");
    if (route === "/learn") return pathname.startsWith("/learn");
    if (route === "/play/coder") return pathname.startsWith("/play/coder");
    if (route === "/app/leaderboard") return pathname.startsWith("/app/leaderboard");
    if (route === "/app/shop") return pathname.startsWith("/app/shop");
    return false;
  };

  const currentTier = progression?.current_tier;
  const rankName = currentTier?.display_name ?? "RECRUIT";

  return (
    <>
      {/* ── Navbar Styles ─────────────────────────── */}
      <style>{`
        .ts-navbar {
          position: sticky;
          top: 0;
          z-index: 50;
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          background: linear-gradient(180deg, rgba(7,6,10,0.85), rgba(7,6,10,0.5));
          border-bottom: 1px solid var(--ts-border, rgba(255,107,26,0.18));
        }
        .ts-nav-inner {
          max-width: 1400px;
          margin: 0 auto;
          padding: 18px 32px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
        }
        .ts-logo {
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          text-decoration: none;
          color: var(--ts-text, #f5f3ff);
        }
        .ts-logo-mark {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          background: linear-gradient(135deg, #ff6b1a 0%, #ff3d3d 100%);
          display: grid;
          place-items: center;
          font-size: 20px;
          box-shadow: 0 0 24px rgba(255,107,26,0.5), inset 0 0 12px rgba(255,255,255,0.2);
          animation: pulseGlow 2s ease-in-out infinite;
        }
        .ts-logo-text {
          font-family: var(--font-orbitron, "Orbitron", sans-serif);
          font-weight: 900;
          font-size: 22px;
          letter-spacing: 1px;
        }
        .ts-logo-text span {
          background: linear-gradient(90deg, #ff6b1a, #ffb800);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        .ts-nav-links {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .ts-nav-link {
          padding: 10px 16px;
          border-radius: 10px;
          color: var(--ts-text-dim, #9b94b3);
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          text-decoration: none;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 8px;
          background: transparent;
          border: none;
        }
        .ts-nav-link:hover {
          color: var(--ts-text, #f5f3ff);
          background: rgba(255,107,26,0.08);
        }
        .ts-nav-link.active {
          color: #ff6b1a;
          background: rgba(255,107,26,0.12);
        }
        .ts-nav-right {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .ts-pill {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 14px;
          border-radius: 999px;
          background: rgba(255,107,26,0.08);
          border: 1px solid var(--ts-border, rgba(255,107,26,0.18));
          font-size: 13px;
          font-weight: 600;
          color: var(--ts-text, #f5f3ff);
        }
        .ts-pill-streak {
          color: #ff6b1a;
          background: linear-gradient(90deg, rgba(255,107,26,0.15), rgba(255,61,61,0.15));
        }
        .ts-avatar {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 6px 14px 6px 6px;
          border-radius: 999px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.06);
          cursor: pointer;
          transition: all 0.2s;
        }
        .ts-avatar:hover {
          border-color: var(--ts-border, rgba(255,107,26,0.18));
        }
        .ts-avatar img {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          border: 2px solid #ff6b1a;
          object-fit: cover;
        }
        .ts-avatar-name {
          font-size: 13px;
          font-weight: 600;
          color: var(--ts-text, #f5f3ff);
        }
        .ts-mobile-toggle {
          display: none;
          background: none;
          border: none;
          color: var(--ts-text, #f5f3ff);
          font-size: 22px;
          cursor: pointer;
          padding: 4px;
        }
        .ts-mobile-menu {
          display: none;
          flex-direction: column;
          gap: 6px;
          padding: 16px;
          border-top: 1px solid var(--ts-border, rgba(255,107,26,0.18));
          background: var(--ts-bg-1, #0d0a14);
        }
        .ts-mobile-menu.open {
          display: flex;
        }
        @media (max-width: 960px) {
          .ts-nav-links { display: none; }
          .ts-mobile-toggle { display: block; }
          .ts-nav-right .ts-pill { display: none; }
        }
        @media (max-width: 520px) {
          .ts-nav-inner { padding: 14px 18px; }
        }
        .ts-pill-auth {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 14px;
          border-radius: 999px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,107,26,0.18);
          font-size: 13px;
          font-weight: 600;
        }
      `}</style>

      <nav className="ts-navbar">
        <div className="ts-nav-inner">
          {/* Logo */}
          <Link href="/app/home" className="ts-logo">
            <div className="ts-logo-mark">
              <IconFlame size={20} />
            </div>
            <div className="ts-logo-text">
              TYPE<span>STRIKE</span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <div className="ts-nav-links">
            <button className={`ts-nav-link ${isActive("/app/home") ? "active" : ""}`} onClick={() => router.push("/app/home")}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
              Home
            </button>
            <button className={`ts-nav-link ${isActive("/app/map") ? "active" : ""}`} onClick={() => router.push("/app/map")}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
              Strike
            </button>
            <button className={`ts-nav-link ${isActive("/learn") ? "active" : ""}`} onClick={() => router.push("/learn")}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
              Learn
            </button>
            <button className={`ts-nav-link ${isActive("/play/coder") ? "active" : ""}`} onClick={() => router.push("/play/coder")}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
              Coder
            </button>
            <button className={`ts-nav-link ${isActive("/app/leaderboard") ? "active" : ""}`} onClick={() => router.push("/app/leaderboard")}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5C7 4 6 9 6 9z"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5C17 4 18 9 18 9z"/><path d="M4 22h16"/><path d="M10 22V2h4v20"/></svg>
              Ranks
            </button>
            <button className={`ts-nav-link ${isActive("/app/shop") ? "active" : ""}`} onClick={() => router.push("/app/shop")}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
              Shop
            </button>
          </div>

          <div className="ts-nav-right">
            {/* Rank pill */}
            {player && (
              <div className="ts-pill">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ff6b1a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>
                {rankName} · Lv{player.level}
              </div>
            )}

            {/* Streak pill */}
            {player && (player.streak_count ?? 0) > 0 && (
              <div className="ts-pill ts-pill-streak">
                <IconFlame size={14} />
                {player.streak_count}
              </div>
            )}

            {/* Profile / Auth */}
            {isSignedIn ? (
              <div className="ts-avatar" onClick={() => router.push("/app/profile")}>
                {user?.imageUrl ? (
                  <img src={user.imageUrl} alt={user.fullName || "Profile"} referrerPolicy="no-referrer" />
                ) : (
                  <div style={{
                    width: 30,
                    height: 30,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #ff6b1a, #ff3d3d)",
                    display: "grid",
                    placeItems: "center",
                    fontSize: 11,
                    fontWeight: 900,
                    color: "#fff",
                    border: "2px solid #ff6b1a",
                  }}>
                    {user?.firstName?.[0] || user?.username?.[0] || "?"}
                  </div>
                )}
                <span className="ts-avatar-name">{user?.firstName || user?.username || "Profile"}</span>
              </div>
            ) : (
              <div className="ts-pill-auth" style={{ gap: 4 }}>
                <SignInButton mode="modal">
                  <span style={{ cursor: "pointer", color: "var(--ts-text-dim, #9b94b3)", fontSize: 12, fontWeight: 600, padding: "4px 8px" }}>SIGN IN</span>
                </SignInButton>
                <SignUpButton mode="modal">
                  <span style={{
                    cursor: "pointer",
                    background: "linear-gradient(135deg, #ff6b1a, #ff3d3d)",
                    color: "#fff",
                    padding: "4px 12px",
                    borderRadius: 999,
                    fontSize: 12,
                    fontWeight: 700,
                  }}>SIGN UP</span>
                </SignUpButton>
              </div>
            )}

            {/* Mobile hamburger */}
            <button
              className="ts-mobile-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                {mobileMenuOpen ? (
                  <path d="M6 6l12 12M18 6L6 18" />
                ) : (
                  <path d="M3 6h18M3 12h18M3 18h18" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div className={`ts-mobile-menu ${mobileMenuOpen ? "open" : ""}`}>
          <button className="ts-nav-link" onClick={() => { router.push("/app/home"); setMobileMenuOpen(false); }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            Home
          </button>
          <button className="ts-nav-link" onClick={() => { router.push("/app/map"); setMobileMenuOpen(false); }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
            Strike
          </button>
          <button className="ts-nav-link" onClick={() => { router.push("/learn"); setMobileMenuOpen(false); }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
            Learn
          </button>
          <button className="ts-nav-link" onClick={() => { router.push("/play/coder"); setMobileMenuOpen(false); }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
            Coder
          </button>
          <button className="ts-nav-link" onClick={() => { router.push("/app/leaderboard"); setMobileMenuOpen(false); }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5C7 4 6 9 6 9z"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5C17 4 18 9 18 9z"/><path d="M4 22h16"/><path d="M10 22V2h4v20"/></svg>
            Ranks
          </button>
          <button className="ts-nav-link" onClick={() => { router.push("/app/shop"); setMobileMenuOpen(false); }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
            Shop
          </button>
        </div>
      </nav>
    </>
  );
}
