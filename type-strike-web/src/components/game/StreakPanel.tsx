"use client";

import { useState } from "react";
import Link from "next/link";
import {
  IconFlame,
  IconCheck,
  IconGift,
  IconSnowflake,
  IconCoins,
  IconCalendar,
  IconStar,
} from "@tabler/icons-react";
import SpotlightCard from "@/components/react-bits/SpotlightCard";
import type { StreakInfoResponse, StreakDay } from "@/lib/types";

// ── Props ────────────────────────────────────────────────

interface StreakPanelProps {
  streakCount: number;
  /** Optional API-backed streak info — when provided, drives the calendar from real data */
  streakInfo?: StreakInfoResponse | null;
  /** When true, hides the bottom 'View Full Calendar' link (used on the daily challenges page itself) */
  hideFooterLink?: boolean;
}

// ── Reward Calendar Merge ──────────────────────────────
// Falls back to a hardcoded structure when no API data is available.

const FALLBACK_CALENDAR: StreakDay[] = [
  { day_number: 1, label: "Day 1", is_past: true, is_today: false, is_future: false, is_claimed: true, is_freeze_used: false, reward: { type: "xp", value: 25, icon: "flame", description: "+25 XP" } },
  { day_number: 2, label: "Today", is_past: false, is_today: true, is_future: false, is_claimed: false, is_freeze_used: false, reward: { type: "xp", value: 25, icon: "flame", description: "+25 XP" } },
  { day_number: 3, label: "Day 3", is_past: false, is_today: false, is_future: true, is_claimed: false, is_freeze_used: false, reward: { type: "xp", value: 25, icon: "flame", description: "+25 XP" } },
  { day_number: 4, label: "Day 4", is_past: false, is_today: false, is_future: true, is_claimed: false, is_freeze_used: false, reward: { type: "xp", value: 50, icon: "star", description: "+50 XP · +1 Star" } },
  { day_number: 5, label: "Day 5", is_past: false, is_today: false, is_future: true, is_claimed: false, is_freeze_used: false, reward: { type: "xp", value: 100, icon: "gift", description: "+100 XP · Mystery" } },
];

/** Picks which calendar array to display and sorts it by day_number. */
function resolveCalendar(streakInfo?: StreakInfoResponse | null): StreakDay[] {
  if (streakInfo?.calendar && streakInfo.calendar.length > 0) {
    return [...streakInfo.calendar].sort((a, b) => a.day_number - b.day_number);
  }
  return FALLBACK_CALENDAR;
}

// ── Component ───────────────────────────────────────────

export default function StreakPanel({ streakCount, streakInfo, hideFooterLink = false }: StreakPanelProps) {
  const [claimed, setClaimed] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const handleClaim = () => {
    if (claimed) return;
    setClaimed(true);
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 2000);
  };

  const progressPct = Math.min((streakCount / 30) * 100, 100);
  const calendar = resolveCalendar(streakInfo);
  const freezes = streakInfo?.streak_freezes ?? 0;
  const totalClaims = streakInfo?.total_days_claimed ?? 0;

  return (
    <SpotlightCard
      spotlightColor="rgba(249, 115, 22, 0.12)"
      className="relative overflow-hidden rounded-[22px] border border-neutral-800/80 bg-neutral-900/30 backdrop-blur-md p-0 h-full"
      as="section"
      aria-label="Streak rewards"
    >
      {showConfetti && (
        <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
          {Array.from({ length: 20 }).map((_, i) => (
            <span
              key={i}
              className="absolute h-1.5 w-1.5 rounded-full animate-ping"
              style={{
                top: `${10 + Math.random() * 80}%`,
                left: `${10 + Math.random() * 80}%`,
                backgroundColor: ["#f97316", "#ec4899", "#fbbf24", "#10b981"][i % 4],
                animationDelay: `${i * 0.08}s`,
                animationDuration: "0.6s",
              }}
            />
          ))}
        </div>
      )}

      <div className="relative flex h-full flex-col p-4 md:p-5">
        {/* ── Streak Header ──────────────────────────── */}
        <div className="flex flex-col items-center text-center">
          <div className="relative mb-3 flex h-[60px] w-[60px] items-center justify-center rounded-full border border-orange-500/20 bg-gradient-to-tr from-orange-500/10 to-rose-500/10 shadow-[0_0_30px_rgba(249,115,22,0.10)]">
            <span className="absolute inset-0 animate-pulse rounded-full bg-orange-500/5 blur-md" />
            <IconFlame
              size={28}
              className="text-orange-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.5)]"
              strokeWidth={2}
              fill="currentColor"
            />
          </div>

          <span className="bg-gradient-to-r from-orange-400 to-rose-400 bg-clip-text text-[10px] font-black uppercase tracking-[0.2em] text-transparent">
            STREAK ACTIVE
          </span>

          <h3 className="mt-1 text-xl font-black text-neutral-100">
            {streakCount} Day Streak
          </h3>
          <p className="mt-0.5 flex items-center gap-1.5 text-[11px] font-medium text-neutral-500">
            <span className="text-orange-400">{totalClaims}</span> total claim{totalClaims !== 1 ? "s" : ""}
            <span className="inline-block h-1 w-1 rounded-full bg-neutral-700" />
            {claimed ? (
              <span className="font-bold text-emerald-400">Today claimed!</span>
            ) : streakInfo?.today_available ? (
              <span className="font-bold text-orange-400">Claim now!</span>
            ) : (
              <span>Next claim tomorrow</span>
            )}
          </p>
        </div>

        {/* ── Streak Freezes Section ────────────────── */}
        <div className="mt-4 flex items-center justify-between rounded-2xl border border-neutral-800/60 bg-neutral-950/40 p-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-orange-500/20 bg-orange-500/10">
              <IconSnowflake size={16} className="text-orange-400" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Streak Freezes</span>
                <span className="rounded-full border border-orange-500/20 bg-orange-500/10 px-1.5 py-0.5 text-[10px] font-extrabold text-orange-400">{freezes}</span>
              </div>
              <p className="mt-0.5 text-[10px] text-neutral-500">Prevents losing streak if you miss a day.</p>
            </div>
          </div>
          <button className="flex items-center gap-1 rounded-xl border border-neutral-800/50 bg-neutral-900 px-2.5 py-1.5 text-[10px] font-bold text-neutral-300 transition-all hover:bg-neutral-800 active:scale-95">
            <span>Get</span>
            <IconCoins size={12} className="text-amber-400" />
            <span className="text-amber-400">100</span>
          </button>
        </div>

        {/* ── Progress Bar ──────────────────────────── */}
        <div className="mt-5">
          <div className="mb-2 flex justify-between px-0.5 text-[10px] font-bold uppercase tracking-wider text-neutral-500">
            <span>Day {streakCount}</span>
            <span>Day 30+</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full border border-neutral-800/60 bg-neutral-950 p-0.5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-orange-500 to-rose-500 transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(249,115,22,0.4)]"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* ── Reward Calendar ────────────────────────── */}
        <div className="mt-6 flex-1">
          <h4 className="mb-3 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-neutral-400">
            <IconCalendar size={13} className="text-orange-400" />
            Reward Calendar
          </h4>

          <div className="grid grid-cols-5 gap-2">
            {calendar.slice(0, 5).map((day) => {
              const isClaimed = day.is_claimed;
              const isToday = day.is_today && !claimed;
              const isClaimedToday = day.is_today && claimed;
              const rewardValue = day.reward?.value ?? 0;

              return (
                <div
                  key={day.day_number}
                  className={`relative flex flex-col items-center rounded-2xl border p-2 text-center transition-all duration-300 ${
                    isToday
                      ? "border-orange-500/40 bg-neutral-900 shadow-[0_0_15px_rgba(249,115,22,0.15)]"
                      : isClaimed || isClaimedToday
                      ? "border-emerald-500/20 bg-neutral-950/40 opacity-70"
                      : day.is_future && rewardValue >= 100
                      ? "border-neutral-800/60 bg-neutral-950/30 opacity-80 hover:border-orange-500/30"
                      : "border-neutral-800/60 bg-neutral-950/30 opacity-70"
                  }`}
                >
                  <span
                    className={`text-[8px] font-bold uppercase tracking-wider ${
                      isToday
                        ? "animate-pulse text-orange-400"
                        : isClaimed || isClaimedToday
                        ? "text-emerald-400"
                        : "text-neutral-500"
                    }`}
                  >
                    {isToday ? "Today" : day.label}
                  </span>

                  <div className="my-1.5 flex h-7 w-7 items-center justify-center">
                    {(!day.reward || day.reward.icon === "flame") && (
                      <IconFlame
                        size={16}
                        className={
                          isToday
                            ? "text-orange-500 drop-shadow-[0_0_4px_rgba(249,115,22,0.5)]"
                            : isClaimed || isClaimedToday
                            ? "text-neutral-500"
                            : "text-neutral-600"
                        }
                      />
                    )}
                    {day.reward?.icon === "star" && (
                      <IconStar size={16} className="text-neutral-600" />
                    )}
                    {day.reward?.icon === "gift" && (
                      <IconGift size={16} className="text-neutral-600 group-hover:text-orange-400" />
                    )}
                  </div>

                  <span
                    className={`text-[9px] font-extrabold leading-tight ${
                      isToday
                        ? "text-orange-400"
                        : isClaimed || isClaimedToday
                        ? "text-emerald-400"
                        : "text-neutral-500"
                    }`}
                  >
                    +{rewardValue} XP
                    {day.reward?.description?.includes("Star") && (
                      <span className="block text-[7px] text-neutral-500">+1 ★</span>
                    )}
                  </span>

                  {(isClaimed || isClaimedToday) && (
                    <div className="absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/15">
                      <IconCheck size={7} className="text-emerald-400" />
                    </div>
                  )}

                  {isToday && (
                    <button
                      onClick={handleClaim}
                      className="mt-1.5 w-full rounded-lg bg-gradient-to-r from-orange-500 to-rose-500 px-1 py-1 text-[8px] font-black uppercase tracking-wider text-white shadow-md shadow-orange-500/20 transition-all active:scale-95 hover:brightness-110"
                    >
                      Claim
                    </button>
                  )}

                  {isClaimedToday && (
                    <span className="mt-1.5 flex items-center gap-0.5 text-[8px] font-extrabold text-emerald-400">
                      <IconCheck size={8} />
                      Claimed
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {!hideFooterLink && (
          <div className="mt-5">
            <Link
              href="/app/daily-challenges"
              className="block w-full rounded-2xl border border-neutral-800/50 bg-neutral-800/60 py-2.5 text-center text-[11px] font-bold text-neutral-300 transition-all hover:border-neutral-700/50 hover:bg-neutral-800 hover:text-white active:scale-[0.99]"
            >
              View Full Calendar
            </Link>
          </div>
        )}
      </div>
    </SpotlightCard>
  );
}
