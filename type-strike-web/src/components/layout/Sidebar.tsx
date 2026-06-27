"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignInButton, SignUpButton, UserButton, useUser } from "@clerk/nextjs";
import { usePlayer } from "@/hooks/usePlayer";
import ProgressionSummary from "@/components/game/ProgressionSummary";
import { useAchievements } from "@/hooks/useAchievements";

const SEEN_COUNT_KEY = "typestrike_seen_achievement_count";

function getSeenCount(): number {
  if (typeof window === "undefined") return 0;
  try {
    const val = localStorage.getItem(SEEN_COUNT_KEY);
    return val ? parseInt(val, 10) : 0;
  } catch {
    return 0;
  }
}

const NAV_ITEMS = [
  { label: "STRIKE", href: "/app/home", icon: "⚡", accent: "#FF5020" },
  { label: "MAP", href: "/app/map", icon: "🗺️", accent: "#FF6600" },
  { label: "LEARN", href: "/learn", icon: "🎓", accent: "#22DD44" },
  { label: "CODER", href: "/play/coder", icon: "👨‍💻", accent: "#00E5FF" },
  { label: "DAILY", href: "/app/daily-challenges", icon: "🎯", accent: "#FFCC00" },
  { label: "FEATS", href: "/app/achievements", icon: "🏅", accent: "#CC44FF" },
  { label: "RANKS", href: "/app/ranks", icon: "👑", accent: "#FFCC00" },
  { label: "LEADERBOARD", href: "/app/leaderboard", icon: "🏆", accent: "#8844FF" },
  { label: "STATS", href: "/app/stats", icon: "📊", accent: "#00F0FF" },
  { label: "PROFILE", href: "/app/profile", icon: "👤", accent: "#FF44CC" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { isSignedIn, user } = useUser();
  const { playerId } = usePlayer();
  const { unlockedCount } = useAchievements(playerId);

  // Only show badge for unseen achievements (new since last visit to the feats page)
  // Reads from localStorage on each render — Sidebar stays mounted in layout,
  // so useState would freeze the count. The re-render on navigation picks up updates.
  const unseenCount = Math.max(0, unlockedCount - getSeenCount());

  return (
    <aside
      className="hidden md:flex md:flex-col md:w-[200px] lg:w-[220px] xl:w-[240px] h-dvh border-r shrink-0"
      style={{
        background: "var(--bg-primary)",
        borderColor: "var(--border)",
      }}
    >
      {/* Brand */}
      <div className="flex items-center gap-1.5 px-5 pt-5 pb-4">
        <span className="text-lg">🔥</span>
        <span className="text-sm font-bold tracking-[3px] text-text-body">TYPE</span>
        <span className="text-sm font-black tracking-[3px] text-accent-primary">STRIKE</span>
      </div>

      {/* Divider */}
      <div className="mx-4 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />

      {/* Nav items */}
      <nav className="flex-1 flex flex-col gap-1 px-3 py-3">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className="group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[11px] font-bold tracking-[2px] transition-all duration-200"
              style={{
                color: isActive ? item.accent : "var(--text-muted)",
                background: isActive ? `${item.accent}12` : "transparent",
              }}
            >
              {/* Active indicator bar */}
              {isActive && (
                <span
                  className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-0.5 rounded-full"
                  style={{ background: item.accent, boxShadow: `0 0 8px ${item.accent}60` }}
                />
              )}
              <span className="text-base">{item.icon}</span>
              <span>{item.label}</span>
              {item.label === "FEATS" && unseenCount > 0 && (
                <span
                  className="ml-auto flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[8px] font-bold leading-none"
                  style={{
                    background: "#CC44FF",
                    color: "#fff",
                    boxShadow: "0 0 8px rgba(204,68,255,0.5)",
                  }}
                >
                  {unseenCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Rank progression */}
      <ProgressionSummary playerId={playerId} />

      {/* Profile / auth */}
      <div className="mx-4 mb-2 mt-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
      {isSignedIn ? (
        <div className="flex items-center gap-3 px-3 py-2">
          {user.imageUrl ? (
            <img
              src={user.imageUrl}
              alt={user.fullName || "Profile"}
              className="h-8 w-8 rounded-full border border-white/10 object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-accent-primary to-accent-secondary text-xs font-black text-white">
              {user.firstName?.[0] || user.username?.[0] || "?"}
            </div>
          )}
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-[11px] font-bold tracking-[1px] text-text-white">
              {user.firstName || user.username}
            </span>
            <span className="truncate text-[9px] tracking-[1px] text-text-muted">
              {user.primaryEmailAddress?.emailAddress}
            </span>
          </div>
          <div className="ml-auto">
            <UserButton />
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2 px-3 py-2">
          <SignInButton mode="modal">
            <button className="w-full rounded-xl bg-accent-primary/90 px-3 py-2 text-[11px] font-bold tracking-[2px] text-white hover:bg-accent-primary transition-colors">
              SIGN IN
            </button>
          </SignInButton>
          <SignUpButton mode="modal">
            <button className="w-full rounded-xl border border-white/10 px-3 py-2 text-[11px] font-bold tracking-[2px] text-text-body hover:border-accent-primary/60 hover:text-accent-primary transition-colors">
              SIGN UP
            </button>
          </SignUpButton>
        </div>
      )}

      {/* Bottom section spacer */}
      <div className="pb-4" />
    </aside>
  );
}
