"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  IconBolt,
  IconFlame,
  IconBraces,
  IconAward,
  IconChartBar,
  IconSchool,
  IconTargetArrow,
  IconCrown,
  IconStar,
  IconClock,
  IconPlayerPlay,
  IconGift,
  IconSpeedboat,
  IconMedal2,
  IconTrophy,
} from "@tabler/icons-react";
import { usePlayer } from "@/hooks/usePlayer";
import { usePlayerStats } from "@/hooks/usePlayerStats";
import { useProgression } from "@/hooks/useProgression";
import Particles from "@/components/react-bits/Particles";
import SpotlightCard from "@/components/react-bits/SpotlightCard";
import ShinyText from "@/components/react-bits/ShinyText";
import styles from "@/styles/glass-effects.module.css";

// ── Primary Actions (Hero) ──────────────────────────────

interface PrimaryAction {
  id: string;
  label: string;
  desc: string;
  icon: React.ReactNode;
  href: string;
  color: string;
}

const PRIMARY_ACTIONS: PrimaryAction[] = [
  { id: "strike", label: "Strike", desc: "Battle through levels", icon: <IconBolt size={20} />, href: "/app/map", color: "#f97316" },
  { id: "learn", label: "Learn", desc: "Master the basics", icon: <IconSchool size={20} />, href: "/learn", color: "#22DD44" },
  { id: "coder", label: "Coder", desc: "Code snippets & DSA", icon: <IconBraces size={20} />, href: "/play/coder", color: "#00E5FF" },
];

// ── Quick Link items ────────────────────────────────────

interface QuickLink {
  id: string;
  label: string;
  desc: string;
  icon: React.ReactNode;
  href: string;
  color: string;
}

const QUICK_LINKS: QuickLink[] = [
  { id: "leaderboard", label: "Leaderboard", desc: "Climb the ranks", icon: <IconAward size={18} />, href: "/app/leaderboard", color: "#FFCC00" },
  { id: "feats", label: "Feats", desc: "Achievements & badges", icon: <IconMedal2 size={18} />, href: "/app/achievements", color: "#CC44FF" },
  { id: "ranks", label: "Ranks", desc: "Bronze → Silver → Gold", icon: <IconTrophy size={18} />, href: "/app/ranks", color: "#8844FF" },
  { id: "stats", label: "Stats", desc: "Your performance", icon: <IconChartBar size={18} />, href: "/app/stats", color: "#00F0FF" },
];

// ── Streak Calendar data ────────────────────────────────

interface StreakDayData {
  label: string;
  isToday: boolean;
  isPast: boolean;
  isFuture: boolean;
  isClaimed: boolean;
  reward: { xp: number; bonus?: boolean } | null;
}

function buildStreakCalendar(streakCount: number): StreakDayData[] {
  const days: StreakDayData[] = [];
  const bonusDays = new Set([5, 10, 15, 20, 25, 30]);
  const startDay = Math.max(1, streakCount - 1);
  for (let offset = 0; offset < 6; offset++) {
    const dayNum = startDay + offset;
    const isToday = dayNum === streakCount && streakCount > 0;
    const isPast = streakCount > 0 && dayNum < streakCount;
    const isFuture = dayNum > streakCount;
    const isClaimed = isPast;
    const xp = bonusDays.has(dayNum) ? dayNum * 10 : Math.max(10, dayNum * 2);
    const reward = { xp, bonus: bonusDays.has(dayNum) };
    let label = `Day ${dayNum}`;
    if (dayNum === streakCount && streakCount > 0) label = "Today";
    else if (dayNum === streakCount + 1 && streakCount > 0) label = "Tomorrow";
    days.push({ label, isToday, isPast, isFuture, isClaimed, reward });
  }
  return days;
}

// ── Contest Modes ────────────────────────────────────────

interface ContestMode {
  label: string;
  time: string;
  desc: string;
  icon: React.ReactNode;
  href: string;
  accent: string;
}

const CONTEST_MODES: ContestMode[] = [
  { label: "Sprint", time: "1 min", desc: "All-out speed burst", icon: <IconBolt size={18} />, href: "/play/1min", accent: "#00E5FF" },
  { label: "Endurance", time: "3 min", desc: "Find your rhythm", icon: <IconClock size={18} />, href: "/play/3min", accent: "#f97316" },
  { label: "Marathon", time: "5 min", desc: "Test your stamina", icon: <IconSpeedboat size={18} />, href: "/play/5min", accent: "#FFCC00" },
];

// ── HomePage ─────────────────────────────────────────────

export default function HomePage() {
  const router = useRouter();
  const { player, playerId, isLoading: playerLoading } = usePlayer();
  const { stats, isLoading: statsLoading } = usePlayerStats(playerId);
  const { progression } = useProgression(playerId);

  const displayName = player?.display_name || player?.player_tag || "Player";
  const level = player?.level ?? 1;
  const currentTier = progression?.current_tier;
  const rankName = currentTier?.display_name ?? "RECRUIT";
  const streakCount = player?.streak_count ?? 0;

  const bestWpmOverall = Math.max(
    stats.best_wpm_by_mode.level, stats.best_wpm_by_mode.timed_1min,
    stats.best_wpm_by_mode.timed_3min, stats.best_wpm_by_mode.timed_5min,
    stats.best_wpm_by_mode.contest,
  );
  const totalXp = stats.total_xp;
  const totalGames = stats.total_games;
  const avgAccuracy = stats.average_accuracy;

  const loading = playerLoading || statsLoading;
  const streakCalendar = buildStreakCalendar(streakCount);

  return (
    <>
      <Particles particleColors={["#f97316", "#ffffff"]} particleCount={50} speed={0.05} />

      <div className="relative z-[1] flex flex-1 flex-col min-w-0">
        <div className="flex-1 px-4 pb-8 md:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl pt-4 md:pt-6 space-y-5">

            {/* ═══════════════════════════════════════════
               HERO — compact greeting + 3 primary actions
               ═══════════════════════════════════════════ */}
            <SpotlightCard
              spotlightColor="rgba(249, 115, 22, 0.10)"
              className={styles.heroGlass}
              as="section"
              aria-label="Welcome"
            >
              <div className="relative p-4 md:p-5 space-y-4">
                {/* Greeting row */}
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-10 h-10 rounded-[14px] border border-neutral-800/60 grid place-items-center font-black shrink-0"
                      style={{ background: "linear-gradient(135deg, rgba(249,115,22,0.18), rgba(234,88,12,0.10))" }}
                    >
                      {loading ? (
                        <div className="h-5 w-5 animate-pulse rounded-full bg-neutral-800" />
                      ) : (
                        <span className="text-sm text-neutral-100">{level}</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      {loading ? (
                        <>
                          <div className="h-4 w-28 animate-pulse rounded bg-neutral-800 mb-1" />
                          <div className="h-3 w-36 animate-pulse rounded bg-neutral-800/60" />
                        </>
                      ) : (
                        <>
                          <p className="text-[15px] font-black tracking-[-0.02em] text-neutral-100 m-0 truncate">
                            Strike hard, {displayName}.
                          </p>
                          <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[12px] text-neutral-500">
                            <span className="flex items-center gap-1">
                              <IconCrown size={12} className="text-orange-400" />
                              <strong className="text-orange-400">{rankName}</strong>
                            </span>
                            <span>·</span>
                            <span>Lv{level}</span>
                            {bestWpmOverall > 0 && (
                              <><span>·</span>
                                <span className="flex items-center gap-1">
                                  <IconStar size={12} className="text-orange-400" />
                                  Best <strong className="text-neutral-300">{bestWpmOverall}</strong> WPM
                                </span>
                              </>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-[14px] border border-neutral-800/60 bg-neutral-900/30 shrink-0">
                    <span className="text-[11px] text-neutral-400">
                      <strong className="text-neutral-200">{totalGames}</strong> games
                    </span>
                    <span className="text-[11px] text-neutral-600">·</span>
                    <span className="text-[11px] text-orange-400 font-bold">{totalXp.toLocaleString()} XP</span>
                  </div>
                </div>

                {/* Primary actions — 3 wide buttons */}
                <div className="grid grid-cols-3 gap-3">
                  {PRIMARY_ACTIONS.map((action) => (
                    <button
                      key={action.id}
                      onClick={() => router.push(action.href)}
                      className={`flex flex-col items-center justify-center gap-2 rounded-[18px] border py-4 transition-all hover:brightness-110 active:scale-[0.97] ${
                        action.id === "strike"
                          ? "border-orange-500/40 bg-gradient-to-br from-orange-500/15 to-rose-600/10 shadow-[0_0_20px_rgba(249,115,22,0.08)]"
                          : "border-neutral-800/60 bg-neutral-900/40 hover:border-neutral-700/60"
                      }`}
                    >
                      <span style={{ color: action.color }}>{action.icon}</span>
                      <span
                        className="text-[13px] font-black tracking-[1px]"
                        style={{ color: action.id === "strike" ? "#f97316" : "#e4e4e7" }}
                      >
                        {action.label}
                      </span>
                      <span className="text-[9px] text-neutral-500 text-center leading-tight">{action.desc}</span>
                    </button>
                  ))}
                </div>

                {/* Daily Challenge callout — integrated into hero */}
                <div className="flex items-center justify-between gap-3 rounded-[16px] border border-orange-500/20 bg-gradient-to-r from-orange-500/5 to-rose-500/5 px-3.5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border border-orange-500/20 bg-orange-500/10">
                      <IconTargetArrow size={16} className="text-orange-400" />
                    </div>
                    <div>
                      <p className="text-[12px] font-bold text-neutral-100">Daily Challenges</p>
                      <p className="text-[10px] text-neutral-500">Bonus XP and rewards — new every day</p>
                    </div>
                  </div>
                  <button
                    onClick={() => router.push("/app/daily-challenges")}
                    className="shrink-0 rounded-[10px] bg-gradient-to-r from-orange-500 to-rose-500 px-3.5 py-1.5 text-[10px] font-bold text-neutral-950 tracking-[0.5px] shadow-[0_0_16px_rgba(249,115,22,0.15)] transition-all hover:brightness-110 active:scale-95"
                  >
                    View
                  </button>
                </div>
              </div>
            </SpotlightCard>

            {/* ═══════════════════════════════════════════
               QUICK LINKS — Leaderboard, Feats, Ranks, Stats
               ═══════════════════════════════════════════ */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {QUICK_LINKS.map((link) => (
                <button
                  key={link.id}
                  onClick={() => router.push(link.href)}
                  className="flex flex-col items-center gap-2 rounded-[18px] border border-neutral-800/60 bg-neutral-900/30 p-4 transition-all hover:border-neutral-700/60 hover:bg-neutral-900/50 active:scale-[0.98]"
                >
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-[12px] border"
                    style={{ borderColor: `${link.color}30`, background: `${link.color}10` }}
                  >
                    <span style={{ color: link.color }}>{link.icon}</span>
                  </div>
                  <span className="text-[12px] font-bold text-neutral-100">{link.label}</span>
                  <span className="text-[9px] text-neutral-500 text-center leading-tight">{link.desc}</span>
                </button>
              ))}
            </div>

            {/* ═══════════════════════════════════════════
               STREAK WIDGET
               ═══════════════════════════════════════════ */}
            <SpotlightCard
              spotlightColor="rgba(249, 115, 22, 0.12)"
              className="rounded-[22px] border border-neutral-800/80 bg-neutral-900/30 backdrop-blur-md p-0 overflow-hidden"
              as="section"
              aria-label="Streak rewards"
            >
              <div className="p-4 md:p-5">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] border border-orange-500/20 bg-gradient-to-br from-orange-500/10 to-rose-500/10">
                      <IconFlame size={24} className="text-orange-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.4)]" fill="currentColor" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[2px] text-neutral-500">Active Streak</p>
                      <p className="text-2xl font-black text-neutral-100">
                        {streakCount} <span className="text-sm font-bold text-neutral-500">days</span>
                      </p>
                    </div>
                  </div>
                  <Link
                    href="/app/daily-challenges"
                    className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-orange-500 to-rose-500 px-3.5 py-2 text-[10px] font-bold text-neutral-950 tracking-[1px] shadow-[0_0_16px_rgba(249,115,22,0.15)] transition-all hover:brightness-110 active:scale-95"
                  >
                    <IconGift size={13} />
                    Claim Rewards
                  </Link>
                </div>

                {/* Progress bar */}
                <div className="mt-4">
                  <div className="flex justify-between px-0.5 text-[9px] font-bold uppercase tracking-[1px] text-neutral-500 mb-1">
                    <span>Day 1</span>
                    <span>Day 30+</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full border border-neutral-800/60 bg-neutral-950 p-0.5">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-orange-500 to-rose-500 transition-all duration-1000 shadow-[0_0_10px_rgba(249,115,22,0.3)]"
                      style={{ width: `${Math.min((streakCount / 30) * 100, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Reward Calendar */}
                <div className="mt-5">
                  <p className="mb-3 text-[10px] font-bold uppercase tracking-[1.5px] text-neutral-400 flex items-center gap-1.5">
                    <IconStar size={12} className="text-orange-400" />
                    Reward Calendar
                  </p>
                  <div className="grid grid-cols-6 gap-2">
                    {streakCalendar.map((day, idx) => (
                      <div
                        key={idx}
                        className={`relative flex flex-col items-center rounded-2xl border p-2.5 text-center transition-all ${
                          day.isToday
                            ? "border-orange-500/40 bg-neutral-900 shadow-[0_0_15px_rgba(249,115,22,0.12)]"
                            : day.isPast && day.isClaimed
                            ? "border-emerald-500/15 bg-neutral-950/40 opacity-70"
                            : "border-neutral-800/50 bg-neutral-950/30 opacity-80 hover:border-orange-500/30"
                        }`}
                      >
                        <span className={`text-[7px] font-bold uppercase tracking-[1px] ${day.isToday ? "text-orange-400 animate-pulse" : "text-neutral-500"}`}>
                          {day.label}
                        </span>
                        <span className={`text-lg mt-1 ${day.isToday ? "text-orange-500" : "text-neutral-600"}`}>
                          {day.reward?.bonus ? "🎁" : "🔥"}
                        </span>
                        <span className={`text-[9px] font-extrabold mt-0.5 ${day.isToday ? "text-orange-400" : "text-neutral-500"}`}>
                          +{day.reward?.xp ?? 0}
                        </span>
                        {day.reward?.bonus && (
                          <span className="text-[6px] font-bold uppercase tracking-[0.5px] text-amber-400 bg-amber-500/10 rounded-full px-1 py-0.5 mt-0.5">Bonus</span>
                        )}
                        {day.isPast && day.isClaimed && (
                          <div className="absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/15">
                            <svg width="7" height="7" viewBox="0 0 7 7" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M1.5 3.5L3 5L5.5 2" />
                            </svg>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 text-[10px] text-neutral-500 text-center">
                    {streakCount >= 30
                      ? "Max streak achieved! 🎉 Keep it going for bragging rights."
                      : `Reach day ${Math.ceil((streakCount + 5) / 5) * 5} for a bonus reward.`}
                  </p>
                </div>
              </div>
            </SpotlightCard>

            {/* ═══════════════════════════════════════════
               STATS ROW
               ═══════════════════════════════════════════ */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <SpotlightCard spotlightColor="rgba(249, 115, 22, 0.06)" className="rounded-[18px] border border-neutral-800/60 bg-neutral-900/30 p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] tracking-[1.5px] uppercase text-neutral-500 font-semibold">Accuracy</p>
                  <IconTargetArrow size={16} className="text-neutral-600" />
                </div>
                <p className="text-2xl font-black text-neutral-100">
                  {avgAccuracy > 0 ? (avgAccuracy * 100).toFixed(0) : "—"}
                  {avgAccuracy > 0 && <span className="text-sm font-bold text-neutral-500">%</span>}
                </p>
              </SpotlightCard>

              <SpotlightCard spotlightColor="rgba(249, 115, 22, 0.06)" className="rounded-[18px] border border-neutral-800/60 bg-neutral-900/30 p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] tracking-[1.5px] uppercase text-neutral-500 font-semibold">Best WPM</p>
                  <IconSpeedboat size={16} className="text-neutral-600" />
                </div>
                <p className="text-2xl font-black text-orange-400">
                  {bestWpmOverall > 0 ? bestWpmOverall : "—"}
                  {bestWpmOverall > 0 && <span className="text-sm font-bold text-neutral-500"> wpm</span>}
                </p>
              </SpotlightCard>

              <SpotlightCard spotlightColor="rgba(249, 115, 22, 0.06)" className="rounded-[18px] border border-neutral-800/60 bg-neutral-900/30 p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] tracking-[1.5px] uppercase text-neutral-500 font-semibold">Total XP</p>
                  <IconStar size={16} className="text-neutral-600" />
                </div>
                <p className="text-2xl font-black text-orange-400">{totalXp > 0 ? totalXp.toLocaleString() : "—"}</p>
              </SpotlightCard>

              <SpotlightCard spotlightColor="rgba(249, 115, 22, 0.06)" className="rounded-[18px] border border-neutral-800/60 bg-neutral-900/30 p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] tracking-[1.5px] uppercase text-neutral-500 font-semibold">Rank</p>
                  <IconCrown size={16} className="text-neutral-600" />
                </div>
                <p className="text-2xl font-black text-orange-400 truncate">
                  <ShinyText text={rankName} color="#f97316" glowColor="rgba(249, 115, 22, 0.3)" />
                </p>
              </SpotlightCard>
            </div>

            {/* ═══════════════════════════════════════════
               CONTEST MODES
               ═══════════════════════════════════════════ */}
            <SpotlightCard
              spotlightColor="rgba(249, 115, 22, 0.10)"
              className="rounded-[22px] border border-neutral-800/80 bg-neutral-900/30 backdrop-blur-md p-0 overflow-hidden"
              as="section"
              aria-label="Timed contests"
            >
              <div className="p-4 md:p-5">
                <h3 className="flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[3px] text-neutral-300 m-0 mb-4">
                  <IconClock size={16} className="text-orange-400" />
                  Timed Contests
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {CONTEST_MODES.map((mode) => (
                    <button
                      key={mode.href}
                      onClick={() => router.push(mode.href)}
                      className="flex items-center gap-3 rounded-[16px] border border-neutral-800/60 bg-neutral-900/40 p-3.5 transition-all hover:border-neutral-700/60 hover:bg-neutral-900/60 active:scale-[0.98] text-left"
                    >
                      <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] border"
                        style={{ borderColor: `${mode.accent}30`, background: `${mode.accent}10` }}
                      >
                        <span style={{ color: mode.accent }}>{mode.icon}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-bold text-neutral-100">{mode.label}</p>
                        <p className="text-[10px] text-neutral-500">{mode.desc}</p>
                      </div>
                      <div
                        className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[10px] font-bold"
                        style={{ background: `${mode.accent}15`, color: mode.accent }}
                      >
                        <IconPlayerPlay size={11} />
                        {mode.time}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </SpotlightCard>

          </div>
        </div>
      </div>
    </>
  );
}
