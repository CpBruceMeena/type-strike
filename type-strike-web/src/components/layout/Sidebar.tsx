"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { label: "STRIKE", href: "/home", icon: "⚡", accent: "#FF5020" },
  { label: "MAP", href: "/map", icon: "🗺️", accent: "#FF6600" },
  { label: "DAILY", href: "/daily-challenges", icon: "🎯", accent: "#FFCC00" },
  { label: "FEATS", href: "/achievements", icon: "🏅", accent: "#CC44FF" },
  { label: "LEADERBOARD", href: "/leaderboard", icon: "🏆", accent: "#8844FF" },
  { label: "STATS", href: "/stats", icon: "📊", accent: "#00F0FF" },
];

export default function Sidebar() {
  const pathname = usePathname();

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
      <nav className="flex-1 flex flex-col gap-1 px-3 py-4">
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
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="px-3 pb-4">
        <div className="mx-3 mb-3 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
        <Link
          href="/settings"
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[11px] font-bold tracking-[2px] text-text-muted transition-colors hover:text-text-body"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3"/>
            <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
          </svg>
          <span>SETTINGS</span>
        </Link>
      </div>
    </aside>
  );
}
