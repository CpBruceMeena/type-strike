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

      <div className="flex-1 px-4 py-4 md:px-6 md:py-6">
        <div className="mx-auto w-full max-w-2xl">

        {/* Title */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#22DD44]/10">
            <span className="text-2xl">🎓</span>
          </div>
          <h1
            className="text-2xl font-black tracking-[6px]"
            style={{ color: "#22DD44" }}
          >
            LEARN
          </h1>
          <p className="mt-1 text-xs tracking-[3px]" style={{ color: "var(--text-muted)" }}>
            Master touch typing from the ground up
          </p>
        </div>

        {/* ═══ Beginner Guides ═══ */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm">🧭</span>
            <h2 className="text-xs font-bold uppercase tracking-[2px] text-neutral-400">Getting Started</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {BEGINNER_GUIDES.map((guide, i) => (
              <motion.button
                key={guide.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                onClick={() => router.push(guide.href)}
                className="flex flex-col items-center gap-3 rounded-[18px] border border-neutral-800/60 bg-neutral-900/30 p-4 transition-all hover:border-neutral-700/60 hover:bg-neutral-900/50 active:scale-[0.97] text-center"
              >
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-[14px] text-xl"
                  style={{ background: `${guide.color}15`, border: `1px solid ${guide.color}30` }}
                >
                  {guide.icon}
                </div>
                <div>
                  <p className="text-[13px] font-bold text-neutral-100" style={{ color: guide.color }}>{guide.title}</p>
                  <p className="mt-0.5 text-[10px] text-neutral-500 leading-tight">{guide.desc}</p>
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
          className="mb-8 rounded-xl p-4"
          style={{
            background: "rgba(34,221,68,0.04)",
            border: "1px solid rgba(34,221,68,0.1)",
          }}
        >
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold tracking-[1px]" style={{ color: "var(--text-body)" }}>
              {completedCount}/{LESSONS.length} COMPLETED
            </span>
            <span className="tracking-[1px]" style={{ color: "var(--text-muted)" }}>
              Keep going!
            </span>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <div
              className="h-1.5 flex-1 overflow-hidden rounded-full"
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
            <span className="text-[10px] font-bold tabular-nums" style={{ color: "var(--text-muted)" }}>
              {progressPercent}%
            </span>
          </div>
        </div>

        {/* Lessons Grid */}
          {(Object.entries(grouped) as [keyof typeof grouped, typeof grouped[keyof typeof grouped]][]).map(
            ([category, lessons]) => {
              const catInfo = LESSON_CATEGORIES[category];
              return (
                <section key={category}>
                  {/* Category header */}
                  <div className="mb-3 flex items-center gap-3">
                    <div
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-sm"
                      style={{ background: `${catInfo.color}15` }}
                    >
                      {catInfo.icon}
                    </div>
                    <div>
                      <h2
                        className="text-sm font-black tracking-[2px]"
                        style={{ color: catInfo.color }}
                      >
                        {catInfo.label}
                      </h2>
                      <p className="text-[10px] tracking-[1px]" style={{ color: "var(--text-muted)" }}>
                        {lessons.length} lesson{lessons.length > 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>

                  {/* Lesson cards */}
                  <div className="grid gap-2">
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
                          className="group relative w-full overflow-hidden rounded-xl border p-4 text-left transition-all duration-200 hover:scale-[1.01]"
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
                          <div className="flex items-center gap-4">
                            {/* Lesson number */}
                            <div
                              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-black"
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
                              <div className="flex items-center gap-2">
                                <p
                                  className="text-sm font-bold tracking-[1px]"
                                  style={{ color: isLocked ? "var(--text-disabled)" : "var(--text-white)" }}
                                >
                                  {lesson.name}
                                </p>
                                {isCompleted && (
                                  <span className="rounded bg-[#22DD44]/15 px-1.5 py-0.5 text-[9px] font-bold tracking-[1px] text-[#22DD44]">
                                    DONE
                                  </span>
                                )}
                              </div>
                              <p
                                className="mt-0.5 truncate text-[10px] tracking-[0.5px]"
                                style={{ color: "var(--text-muted)" }}
                              >
                                {lesson.description}
                              </p>
                            </div>

                            {/* Difficulty & focus keys */}
                            <div className="flex shrink-0 items-center gap-2">
                              {/* Finger color dots */}
                              {fingerColors.length > 0 && (
                                <div className="flex -space-x-0.5">
                                  {fingerColors.slice(0, 3).map((c, i) => (
                                    <div
                                      key={i}
                                      className="h-2 w-2 rounded-full border border-[rgba(0,0,0,0.3)]"
                                      style={{ background: c }}
                                    />
                                  ))}
                                </div>
                              )}

                              {/* Difficulty dots */}
                              <div className="flex gap-0.5">
                                {Array.from({ length: 10 }, (_, i) => (
                                  <div
                                    key={i}
                                    className="h-1 w-1 rounded-full"
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
                                className="text-sm transition-transform duration-200 group-hover:translate-x-0.5"
                                style={{ color: "var(--text-muted)" }}
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
