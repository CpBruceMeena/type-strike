"use client";

/**
 * Type Strike — Lessons Hub Page
 *
 * Shows all learning lessons grouped by category.
 * Users can see their progress and select a lesson to play.
 */

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { LESSONS, LESSON_CATEGORIES, getLessonsByCategory, FINGER_COLORS, KEY_FINGER_MAP } from "@/lib/lessons";
import { api } from "@/lib/api";
import { DEFAULT_PLAYER_ID } from "@/lib/constants";
import type { LessonProgress } from "@/lib/types";

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
        <div className="mb-6 text-center">
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

        {/* Progress summary */}
        <div
          className="mb-6 rounded-xl p-4"
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
