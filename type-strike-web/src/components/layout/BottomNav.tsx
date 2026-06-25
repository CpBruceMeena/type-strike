"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_TABS = [
  { label: "PLAY", href: "/home", accent: "#FF5020" },
  { label: "LEARN", href: "/learn", accent: "#22DD44" },
  { label: "CODER", href: "/play/coder", accent: "#00E5FF" },
  { label: "DAILY", href: "/daily-challenges", accent: "#FFCC00" },
  { label: "FEATS", href: "/achievements", accent: "#CC44FF" },
  { label: "PROFILE", href: "/profile", accent: "#FF44CC" },
];

export default function BottomNav() {
  const pathname = usePathname();

  const getActive = (href: string): boolean => {
    if (href === "/home") return pathname === "/home" || pathname === "/map";
    if (href === "/learn") return pathname.startsWith("/learn");
    if (href === "/play/coder") return pathname.startsWith("/play/coder");
    if (href === "/daily-challenges") return pathname.startsWith("/daily-challenges");
    if (href === "/achievements") return pathname.startsWith("/achievements");
    if (href === "/profile") return pathname === "/profile";
    return false;
  };

  return (
    <nav className="mx-3 mb-2 rounded-xl bg-bg-surface/85 shadow-lg shadow-black/30">
      <div className="flex h-13 items-center justify-evenly">
        {NAV_TABS.map((tab) => {
          const isActive = getActive(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`rounded-lg px-4 py-2 text-[10px] font-bold tracking-[2px] transition-colors ${
                isActive
                  ? "bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]"
                  : "text-text-disabled hover:text-text-label"
              }`}
              style={isActive ? { color: tab.accent, backgroundColor: `${tab.accent}1a` } : {}}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
