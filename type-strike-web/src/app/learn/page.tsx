"use client";

/**
 * Type Strike — Lessons Hub Page
 *
 * Shows all learning lessons grouped by category.
 * Users can see their progress and select a lesson to play.
 */

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { LESSONS, LESSON_CATEGORIES, getLessonsByCategory, FINGER_COLORS, KEY_FINGER_MAP } from "@/lib/lessons";
import { api } from "@/lib/api";
import { DEFAULT_PLAYER_ID } from "@/lib/constants";
import type { LessonProgress } from "@/lib/types";

// ── Beginner Guides ──────────────────────────────────────

interface BeginnerGuide {
  id: string;
  title: string;
  desc: string;
  icon: string;
  color: string;
  href: string;
}

const BEGINNER_GUIDES: BeginnerGuide[] = [
  { id: "hand-positioning", title: "Hand Positioning", desc: "Learn proper hand placement on the home row", icon: "⌨️", color: "#22DD44", href: "/learn/hand-positioning" },
  { id: "finger-placement", title: "Finger Placement", desc: "Which finger presses which key", icon: "👆", color: "#4488FF", href: "/learn/finger-placement" },
  { id: "typing-tips", title: "Typing Tips & Tricks", desc: "Essential tips to improve your speed", icon: "💡", color: "#f97316", href: "/learn/typing-tips" },
];

export default function LessonsHubPage() {
  const router = useRouter();
  const grouped = useMemo(() => getLessonsByCategory(), []);
  const [lessonProgress, setLessonProgress] = useState<Map<number, LessonProgress>>(new Map());
  const [progressLoaded, setProgressLoaded] = useState(false);

  useEffect(() => {
    async function fetchProgress() {
      try {
        const allProgress = await api.getAllLessonProgress(DEFAULT_PLAYER_ID);
        const progressMap = new Map<number, LessonProgress>();
        for (const p of allProgress) {
          progressMap.set(p.lesson_id, p);
        }
        setLessonProgress(progressMap);
      } catch {
        // Silently fail — progress is optional
      } finally {
        setProgressLoaded(true);
      }
    }
    fetchProgress();
  }, []);

  const completedCount = Array.from(lessonProgress.values()).filter((p) => p.completed).length;
  const progressPercent = LESSONS.length > 0 ? Math.round((completedCount / LESSONS.length) * 100) : 0;

  return (
    <div className="flex flex-1 flex-col">

      <div className="flex-1" style={{ padding: "32px 28px" }}>
        <div className="mx-auto w-full" style={{ maxWidth: 1200 }}>

        {/* Title */}
        <div className="mb-10 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#22DD44]/10">
            <span className="text-3xl">🎓</span>
          </div>            <h1
              className="text-3xl font-black tracking-[8px]"
              style={{
                color: "#22DD44",
                fontFamily: "var(--font-orbitron, 'Orbitron', sans-serif)",
              }}
            >
              LEARN
            </h1>
            <p
              className="mt-2 text-sm tracking-[4px]"
              style={{
                color: "var(--ts-text-dim, #9b94b3)",
                fontFamily: "var(--font-orbitron, 'Orbitron', sans-serif)",
              }}
            >
              Master touch typing from the ground up
            </p>
        </div>

        {/* ═══ Beginner Guides ═══ */}
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-base">🧭</span>
            <h2 style={{ fontFamily: "var(--font-orbitron, 'Orbitron', sans-serif)", fontSize: 14, fontWeight: 700, letterSpacing: 3, color: "var(--ts-text-dim, #9b94b3)", textTransform: "uppercase" }}>Getting Started</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {BEGINNER_GUIDES.map((guide, i) => (
              <motion.button
                key={guide.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                onClick={() => router.push(guide.href)}
                className="flex flex-col items-center gap-3 rounded-[18px] border border-neutral-800/60 bg-neutral-900/30 p-5 transition-all hover:border-neutral-700/60 hover:bg-neutral-900/50 active:scale-[0.97] text-center"
              >
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-[14px] text-xl"
                  style={{ background: `${guide.color}15`, border: `1px solid ${guide.color}30` }}
                >
                  {guide.icon}
                </div>
                <div>
                  <p style={{ fontFamily: "var(--font-orbitron, 'Orbitron', sans-serif)", fontSize: 14, fontWeight: 700, color: guide.color }}>{guide.title}</p>
                  <p className="mt-0.5 text-xs text-neutral-500 leading-tight">{guide.desc}</p>
                </div>
                <div className="flex items-center gap-1 text-[10px] font-bold text-neutral-500">
                  <span>Start</span>
                  <span>→</span>
                </div>
              </motion.button>
            ))}
          </div>
        </section>

        {/* Progress summary */}
        <div
          className="mb-10 rounded-xl p-5"
          style={{
            background: "rgba(34,221,68,0.04)",
            border: "1px solid rgba(34,221,68,0.1)",
          }}
        >
          <div className="flex items-center justify-between text-sm">
            <span style={{ fontFamily: "var(--font-orbitron, 'Orbitron', sans-serif)", fontSize: 14, fontWeight: 700, letterSpacing: "1.5px", color: "var(--ts-text, #f5f3ff)" }}>
              {completedCount}/{LESSONS.length} COMPLETED
            </span>
            <span className="tracking-[1.5px] text-xs" style={{ color: "var(--ts-text-dim, #9b94b3)" }}>
              Keep going!
            </span>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <div
              className="h-2 flex-1 overflow-hidden rounded-full"
              style={{ background: "rgba(255,255,255,0.06)" }}
            >
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${progressPercent}%`,
                  background: "linear-gradient(90deg, #22DD44, #44DDAA)",
                }}
              />
            </div>
            <span className="text-xs font-bold tabular-nums" style={{ color: "var(--ts-text-dim, #9b94b3)" }}>
              {progressPercent}%
            </span>
          </div>
        </div>

        {/* Lessons Grid */}
          {(Object.entries(grouped) as [keyof typeof grouped, typeof grouped[keyof typeof grouped]][]).map(
            ([category, lessons]) => {
              const catInfo = LESSON_CATEGORIES[category];
              return (
                <section key={category} className="mb-10">
                  {/* Category header */}
                  <div                    className="mb-5 flex items-center gap-3">
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-xl text-lg"
                      style={{ background: `${catInfo.color}15` }}
                    >
                      {catInfo.icon}
                    </div>
                    <div>
                      <h2
                        style={{ fontFamily: "var(--font-orbitron, 'Orbitron', sans-serif)", fontSize: 16, fontWeight: 900, letterSpacing: 3, color: catInfo.color }}
                      >
                        {catInfo.label}
                      </h2>
                      <p className="text-xs tracking-[1.5px]" style={{ color: "var(--ts-text-dim, #9b94b3)" }}>
                        {lessons.length} lesson{lessons.length > 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>

                  {/* Lesson cards */}
                  <div className="grid gap-4 md:grid-cols-2">
                    {lessons.map((lesson) => {
                      const lp = lessonProgress.get(lesson.id);
                      const isCompleted = lp?.completed ?? false;
                      const isLocked = false;
                      const fingerColors = lesson.focusKeys
                        .map((k) => KEY_FINGER_MAP[k])
                        .filter(Boolean)
                        .map((f) => FINGER_COLORS[f])
                        .filter((v, i, a) => a.indexOf(v) === i);

                      return (
                        <button
                          key={lesson.id}
                          onClick={() => router.push(`/learn/lesson?id=${lesson.id}`)}
                          disabled={isLocked}
                          className="group relative w-full overflow-hidden rounded-xl border p-5 text-left transition-all duration-200 hover:scale-[1.005] hover:border-opacity-50"
                          style={{
                            borderColor: isLocked
                              ? "rgba(255,255,255,0.04)"
                              : isCompleted
                                ? "rgba(34,221,68,0.2)"
                                : "rgba(255,255,255,0.06)",
                            background: isLocked
                              ? "rgba(255,255,255,0.02)"
                              : isCompleted
                                ? "rgba(34,221,68,0.04)"
                                : "rgba(255,255,255,0.03)",
                            opacity: isLocked ? 0.4 : 1,
                          }}
                        >
                          <div                        className="flex items-center gap-6">
                            {/* Lesson number */}
                            <div
                              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-base font-black"
                              style={{
                                background: isCompleted
                                  ? "rgba(34,221,68,0.15)"
                                  : `${catInfo.color}12`,
                                color: isCompleted ? "#22DD44" : catInfo.color,
                              }}
                            >
                              {isCompleted ? "✓" : lesson.id}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">                                  <p
                                  style={{ fontFamily: "var(--font-orbitron, 'Orbitron', sans-serif)", fontSize: 14, fontWeight: 700, letterSpacing: "1.5px", color: isLocked ? "var(--ts-text-dim, #9b94b3)" : "var(--ts-text, #f5f3ff)" }}
                                >
                                  {lesson.name}
                                </p>
                                {isCompleted && (
                                  <span className="rounded bg-[#22DD44]/15 px-2 py-0.5 text-[10px] font-bold tracking-[1.5px] text-[#22DD44]">
                                    DONE
                                  </span>
                                )}
                              </div>
                              <p
                                className="mt-1.5 text-sm tracking-[0.5px] leading-relaxed"
                                style={{ color: "var(--ts-text-dim, #9b94b3)" }}
                              >
                                {lesson.description}
                              </p>
                            </div>

                            {/* Difficulty & focus keys */}
                            <div className="flex shrink-0 items-center gap-3">
                              {/* Finger color dots */}
                              {fingerColors.length > 0 && (
                                <div className="flex -space-x-0.5">
                                  {fingerColors.slice(0, 3).map((c, i) => (
                                    <div
                                      key={i}
                                      className="h-2.5 w-2.5 rounded-full border border-[rgba(0,0,0,0.3)]"
                                      style={{ background: c }}
                                    />
                                  ))}
                                </div>
                              )}

                              {/* Difficulty dots */}
                              <div className="flex gap-1">
                                {Array.from({ length: 10 }, (_, i) => (
                                  <div
                                    key={i}
                                    className="h-1.5 w-1.5 rounded-full"
                                    style={{
                                      background:
                                        i < lesson.difficulty
                                          ? catInfo.color
                                          : "rgba(255,255,255,0.06)",
                                    }}
                                  />
                                ))}
                              </div>

                              {/* Arrow */}
                              <span
                                className="text-base transition-transform duration-200 group-hover:translate-x-0.5"
                                style={{ color: "var(--ts-text-dim, #9b94b3)" }}
                              >
                                {isLocked ? "🔒" : "→"}
                              </span>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </section>
              );
            }
          )}
        </div>
      </div>
    </div>
  );
}
