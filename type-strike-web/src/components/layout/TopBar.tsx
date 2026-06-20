"use client";

import { useRouter } from "next/navigation";

interface TopBarProps {
  streakCount?: number;
  showBack?: boolean;
  backHref?: string;
  title?: string;
  rightAction?: React.ReactNode;
}

export default function TopBar({
  streakCount = 0,
  showBack = false,
  backHref,
  title,
  rightAction,
}: TopBarProps) {
  const router = useRouter();

  return (
    <header className="flex h-12 items-center justify-between px-4">
      <div className="flex items-center gap-2">
        {showBack && (
          <button
            onClick={() => (backHref ? router.push(backHref) : router.back())}
            className="flex h-9 w-9 items-center justify-center rounded-full text-text-body hover:text-text-white transition-colors"
            aria-label="Back"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M12 4L6 10L12 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        )}
        {title && (
          <span className="text-xs font-bold tracking-[2px] text-text-white uppercase">{title}</span>
        )}
        {!title && !showBack && (
          <div className="flex items-center gap-0">
            <span className="text-sm font-bold tracking-[3px] text-text-body">TYPE</span>
            <span className="text-sm font-black tracking-[3px] text-accent-primary">STRIKE</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        {streakCount > 0 && (
          <div className="flex items-center gap-1 rounded-md bg-accent-primary/20 px-1.5 py-0.5">
            <span className="text-xs">⚡</span>
            <span className="text-[11px] font-bold text-accent-primary">{streakCount}</span>
          </div>
        )}
        {rightAction}
      </div>
    </header>
  );
}
