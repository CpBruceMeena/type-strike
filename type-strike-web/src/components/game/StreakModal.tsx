"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import GlassPanel from "@/components/ui/GlassPanel";
import ProgressBar from "@/components/ui/ProgressBar";
import ConfettiAnimation from "@/components/effects/ConfettiAnimation";
import { api } from "@/lib/api";
import type { StreakInfoResponse, ClaimRewardResponse, StreakDay } from "@/lib/types";

// ── Day Cell ───────────────────────────────────────────

function DayCell({ day, onClaim }: { day: StreakDay; onClaim: () => void }) {
  const isActive = day.is_today && !day.is_claimed;

  return (
    <div
      className={`flex flex-col items-center gap-1.5 rounded-xl p-2.5 transition-all duration-200 ${
        isActive
          ? "cursor-pointer bg-accent-primary/10 ring-1 ring-accent-primary/40 hover:bg-accent-primary/20"
          : day.is_claimed
          ? "bg-accent-gold/8"
          : "bg-white/[0.03]"
      }`}
      onClick={isActive ? onClaim : undefined}
    >
      {/* Day label */}
      <span
        className={`text-[8px] font-bold tracking-[1px] ${
          day.is_today ? "text-accent-primary" : "text-text-muted"
        }`}
      >
        {day.label}
      </span>

      {/* Reward icon */}
      {day.reward && (
        <span className="text-lg">{day.reward.icon}</span>
      )}

      {/* Reward description */}
      {day.reward && (
        <span
          className={`text-[8px] font-bold text-center leading-tight ${
            day.is_claimed ? "text-success-green" : "text-text-muted"
          }`}
        >
          {day.reward.description}
        </span>
      )}

      {/* Claimed check */}
      {day.is_claimed && (
        <span className="mt-0.5 text-[10px]">✅</span>
      )}
    </div>
  );
}

// ── StreakModal ────────────────────────────────────────

interface StreakModalProps {
  playerId: number | null;
  open: boolean;
  onClose: () => void;
}

export default function StreakModal({ playerId, open, onClose }: StreakModalProps) {
  const [streakInfo, setStreakInfo] = useState<StreakInfoResponse | null>(null);
  const [claimResult, setClaimResult] = useState<ClaimRewardResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [freezeUsed, setFreezeUsed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasFetched = useRef(false);

  const fetchStreakInfo = useCallback(async () => {
    if (!playerId) return;
    setLoading(true);
    setError(null);
    try {
      const info = await api.getStreakInfo(playerId);
      setStreakInfo(info);
    } catch (err) {
      console.error("Failed to fetch streak info:", err);
      setError("Failed to load streak data");
    } finally {
      setLoading(false);
    }
  }, [playerId]);

  useEffect(() => {
    if (open && !hasFetched.current) {
      hasFetched.current = true;
      fetchStreakInfo();
    }
    if (!open) {
      hasFetched.current = false;
      const timer = setTimeout(() => {
        setClaimResult(null);
        setShowConfetti(false);
        setFreezeUsed(false);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [open, fetchStreakInfo]);

  const handleClaim = async () => {
    if (!playerId || claiming) return;
    setClaiming(true);
    setError(null);
    try {
      const result = await api.claimDailyReward(playerId);
      setClaimResult(result);
      if (result.claimed) {
        setShowConfetti(true);
        // Refresh streak info
        await fetchStreakInfo();
        setTimeout(() => setShowConfetti(false), 3000);
      }
    } catch (err) {
      console.error("Failed to claim reward:", err);
      setError("Failed to claim reward");
    } finally {
      setClaiming(false);
    }
  };

  const handleUseFreeze = async () => {
    if (!playerId) return;
    try {
      const result = await api.useStreakFreeze(playerId);
      if (result.used) {
        setFreezeUsed(true);
        await fetchStreakInfo();
      }
    } catch (err) {
      console.error("Failed to use freeze:", err);
    }
  };

  if (!open) return null;

  return (
    <>
      {/* Confetti on claim */}
      <ConfettiAnimation
        active={showConfetti}
        duration={3000}
        count={60}
        colors={["#FF5020", "#FFCC00", "#22DD44", "#00E5FF", "#CC44FF"]}
      />

      {/* Overlay */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{
          background: "rgba(0,0,0,0.7)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
        }}
        onClick={onClose}
      >
        <GlassPanel
          glow="gold"
          blur="lg"
          depth={3}
          className="w-full max-w-sm p-0 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ── Header ──────────────────────────────── */}
          <div className="px-5 pt-5 pb-3 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <span className="text-xl">🔥</span>
              <span className="text-sm font-black tracking-[3px] text-text-white">STREAK</span>
            </div>
            {streakInfo && (
              <p className="text-[10px] font-bold tracking-[1.5px] text-text-muted">
                {streakInfo.streak_count} day streak • {streakInfo.total_days_claimed} total claims
              </p>
            )}
          </div>

          {/* ── Content ──────────────────────────────── */}
          <div className="px-5 pb-5">
            {loading && !streakInfo && (
              <div className="flex items-center justify-center py-8">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-transparent" style={{ borderTopColor: "var(--accent-primary)", borderRightColor: "var(--accent-primary)" }} />
              </div>
            )}

            {error && (
              <div className="rounded-xl bg-error-red/10 p-3 text-center">
                <p className="text-xs font-bold text-error-red">{error}</p>
                <button
                  onClick={fetchStreakInfo}
                  className="mt-2 text-[9px] font-bold tracking-[1px] text-accent-primary hover:underline"
                >
                  RETRY
                </button>
              </div>
            )}

            {streakInfo && (
              <>
                {/* Streak counter bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[9px] font-bold tracking-[1px] text-text-muted">STREAK FREEZES</span>
                    <span className="text-[11px] font-bold" style={{ color: streakInfo.streak_freezes > 0 ? "#00E5FF" : "var(--text-muted)" }}>
                      ❄️ {streakInfo.streak_freezes}
                    </span>
                  </div>
                  <ProgressBar
                    value={Math.min(streakInfo.streak_count / 30, 1)}
                    color="var(--accent-primary)"
                    height={4}
                  />
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[8px] text-text-muted">Day {streakInfo.streak_count}</span>
                    <span className="text-[8px] text-text-muted">Day 30+</span>
                  </div>
                </div>

                {/* 7-day calendar */}
                <div className="mb-4">
                  <p className="mb-2 text-[9px] font-bold tracking-[1px] text-text-muted">REWARD CALENDAR</p>
                  <div className="grid grid-cols-7 gap-1.5">
                    {streakInfo.calendar.map((day) => (
                      <DayCell key={day.day_number} day={day} onClaim={handleClaim} />
                    ))}
                  </div>
                </div>

                {/* Claim button */}
                {streakInfo.today_available && !claimResult?.claimed && (
                  <button
                    onClick={handleClaim}
                    disabled={claiming}
                    className="w-full rounded-xl py-3 text-sm font-extrabold tracking-[2px] transition-all hover:brightness-110 active:scale-[0.97] disabled:opacity-50"
                    style={{
                      background: "linear-gradient(135deg, #FF5020, #FF6600)",
                      color: "#fff",
                      boxShadow: "0 0 24px rgba(255,80,32,0.4)",
                    }}
                  >
                    {claiming ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        CLAIMING...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <span>🔥</span>
                        <span>CLAIM TODAY&apos;S REWARD</span>
                      </span>
                    )}
                  </button>
                )}

                {/* Freeze button */}
                {streakInfo.freeze_available && !freezeUsed && !streakInfo.today_available && (
                  <button
                    onClick={handleUseFreeze}
                    className="mt-2 w-full rounded-xl border border-electric-cyan/30 py-2.5 text-xs font-bold tracking-[2px] text-electric-cyan transition-all hover:bg-electric-cyan/10 active:scale-[0.97]"
                  >
                    ❄️ USE STREAK FREEZE
                  </button>
                )}

                {/* Claim result */}
                {claimResult?.claimed && (
                  <div className="mt-3 rounded-xl bg-success-green/10 p-4 text-center animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <p className="text-sm font-black text-success-green mb-1">REWARD CLAIMED! 🎉</p>
                    <div className="flex items-center justify-center gap-3 text-xs">
                      {claimResult.xp_added > 0 && (
                        <span className="font-bold text-accent-primary">+{claimResult.xp_added} XP</span>
                      )}
                      {claimResult.stars_added > 0 && (
                        <span className="font-bold text-accent-gold">+{claimResult.stars_added} ⭐</span>
                      )}
                      {claimResult.freeze_token && (
                        <span className="font-bold text-electric-cyan">+1 ❄️ Freeze</span>
                      )}
                    </div>
                    {claimResult.next_reward && (
                      <p className="mt-2 text-[9px] text-text-muted">
                        Next: {claimResult.next_reward.description}
                      </p>
                    )}
                  </div>
                )}

                {freezeUsed && (
                  <div className="mt-3 rounded-xl bg-electric-cyan/10 p-3 text-center">
                    <p className="text-xs font-bold text-electric-cyan">❄️ Streak Frozen!</p>
                    <p className="text-[9px] text-text-muted mt-0.5">Your streak has been preserved for today.</p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* ── Close ────────────────────────────────── */}
          <div className="px-5 pb-5">
            <button
              onClick={onClose}
              className="w-full rounded-xl py-2.5 text-[10px] font-bold tracking-[2px] text-text-muted transition-colors hover:text-text-white"
            >
              CLOSE
            </button>
          </div>
        </GlassPanel>
      </div>
    </>
  );
}
