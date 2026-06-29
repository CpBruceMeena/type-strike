"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  DIFFICULTIES,
  ALL_LANGUAGES,
  LANGUAGE_COLORS,
  getFilteredSnippets,
  getSnippetPool,
  pickRandomSnippet,
  getCompletedSnippetKeys,
} from "@/lib/coder-data";

// ── Completion key helper ────────────────────────────────

function snippetKey(difficulty: string, language: string, title: string): string {
  return `${difficulty}:${language}:${title}`;
}

// ── Difficulty Bar Component ─────────────────────────────

function DifficultyBars({ level, color }: { level: number; color: string }) {
  return (
    <div className="flex items-center gap-[3px]">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1 rounded-full transition-all duration-300"
          style={{
            width: i < level ? 18 : 18,
            background: i < level ? color : "rgba(255,255,255,0.08)",
            boxShadow: i < level ? `0 0 6px ${color}50` : "none",
          }}
        />
      ))}
    </div>
  );
}

// ── Snippet Card ─────────────────────────────────────────

function SnippetCard({
  snippet,
  difficultyColor,
  difficultyIcon,
  difficultyLabel,
  difficultyLevel,
  isCompleted,
  onClick,
}: {
  snippet: { title: string; language: string; code: string };
  difficultyColor: string;
  difficultyIcon: string;
  difficultyLabel: string;
  difficultyLevel: number;
  isCompleted: boolean;
  onClick: () => void;
}) {
  const langColor = LANGUAGE_COLORS[snippet.language] ?? "#888888";
  const lines = snippet.code.split("\n");
  const previewLines = lines.slice(0, 4);
  const lineCount = lines.length;
  const charCount = snippet.code.length;

  return (
    <button
      onClick={onClick}
      className="group relative flex flex-col overflow-hidden rounded-2xl border p-5 text-left transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0"
      style={{
        background: isCompleted
          ? "rgba(18,18,30,0.75)"
          : "rgba(18,18,30,0.85)",
        borderColor: isCompleted
          ? `${difficultyColor}18`
          : "rgba(255,255,255,0.06)",
        backdropFilter: "blur(20px)",
        boxShadow: isCompleted
          ? "0 1px 12px rgba(0,0,0,0.2)"
          : "0 2px 20px rgba(0,0,0,0.3)",
      }}
    >
      {/* Hover glow */}
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-0 blur-3xl transition-all duration-500 group-hover:opacity-20"
        style={{ background: langColor }}
      />

      {/* Difficulty progress bars */}
      <div className="relative mb-3 flex items-center justify-between">
        <DifficultyBars level={difficultyLevel} color={difficultyColor} />
        {isCompleted && (
          <span
            className="inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[9px] font-bold tracking-[1px]"
            style={{
              background: `${difficultyColor}14`,
              color: difficultyColor,
              border: `1px solid ${difficultyColor}25`,
            }}
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M2 5L4 7L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            DONE
          </span>
        )}
      </div>

      {/* Top row: difficulty + language badges */}
      <div className="relative mb-3 flex items-center justify-between">
        <span
          className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[9px] font-bold tracking-[1.5px] uppercase"
          style={{
            background: `${difficultyColor}14`,
            color: difficultyColor,
            border: `1px solid ${difficultyColor}25`,
          }}
        >
          {difficultyIcon} {difficultyLabel}
        </span>
        <span
          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[9px] font-bold tracking-[1px]"
          style={{
            background: `${langColor}12`,
            color: langColor,
            border: `1px solid ${langColor}25`,
          }}
        >
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ background: langColor, boxShadow: `0 0 4px ${langColor}60` }}
          />
          {snippet.language}
        </span>
      </div>

      {/* Title + meta */}                    <h3
                      className="relative mb-0.5 text-sm font-bold tracking-tight"
                      style={{ color: "var(--ts-text, #f5f3ff)", fontFamily: "var(--font-orbitron, 'Orbitron', sans-serif)" }}
                    >
                      {snippet.title}
                    </h3>
      <div className="relative mb-3 flex items-center gap-3 text-[10px]" style={{ color: "var(--ts-text-dim, #9b94b3)" }}>
        <span>{lineCount} lines</span>
        <span className="h-1 w-1 rounded-full bg-current opacity-30" />
        <span>{charCount} chars</span>
      </div>

      {/* Code preview */}
      <div
        className="relative overflow-hidden rounded-xl"
        style={{ background: "rgba(0,0,0,0.4)" }}
      >
        <div className="flex">
          <div
            className="select-none border-r px-2 py-2.5 text-right text-[9px] leading-[1.7]"
            style={{
              color: "rgba(255,255,255,0.12)",
              borderColor: "rgba(255,255,255,0.05)",
              fontFamily: "'Cascadia Code', 'Fira Code', 'JetBrains Mono', monospace",
              minWidth: 28,
            }}
          >
            {previewLines.map((_, i) => (
              <div key={i}>{i + 1}</div>
            ))}
          </div>
          <pre
            className="flex-1 overflow-hidden p-2.5 text-[10px] leading-[1.7]"
            style={{
              color: "rgba(255,255,255,0.5)",
              fontFamily: "'Cascadia Code', 'Fira Code', 'JetBrains Mono', monospace",
              whiteSpace: "pre",
            }}
          >
            {previewLines.join("\n")}
          </pre>
        </div>
        {lineCount > 4 && (
          <div
            className="pointer-events-none absolute bottom-0 left-0 right-0 h-7"
            style={{ background: "linear-gradient(to bottom, transparent, rgba(0,0,0,0.45))" }}
          />
        )}
      </div>

      {/* CTA — always visible */}
      <div
        className="relative mt-3 flex items-center justify-between"
      >
        <span
          className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-[1px] transition-all duration-200 group-hover:translate-x-0.5"
          style={{
            color: langColor,
            opacity: isCompleted ? 0.6 : 1,
          }}
        >
          <span>Start typing</span>
          <span className="text-xs transition-transform duration-200 group-hover:translate-x-0.5">→</span>
        </span>
        {isCompleted && (
          <span
            className="inline-flex items-center gap-1 text-[9px] font-bold tracking-[1px] opacity-0 transition-opacity duration-200 group-hover:opacity-100"
            style={{ color: "rgba(255,255,255,0.3)" }}
          >
            Practice again →
          </span>
        )}
      </div>
    </button>
  );
}

// ── Main Page ────────────────────────────────────────────

export default function CoderHubPage() {
  const router = useRouter();
  const [activeDifficulty, setActiveDifficulty] = useState("easy");
  const [activeLanguage, setActiveLanguage] = useState<string | null>(null);
  const [completedSet] = useState<Set<string>>(getCompletedSnippetKeys);

  const currentSnippets = useMemo(
    () => getFilteredSnippets(activeDifficulty, activeLanguage ?? undefined),
    [activeDifficulty, activeLanguage],
  );

  const difficultyInfo = DIFFICULTIES.find((d) => d.key === activeDifficulty)!;
  const diffColor = difficultyInfo.color;

  // Sorted: uncompleted first, completed last
  const sortedSnippets = useMemo(() => {
    const completed = currentSnippets.filter((s) =>
      completedSet.has(snippetKey(activeDifficulty, s.language, s.title))
    );
    const uncompleted = currentSnippets.filter((s) =>
      !completedSet.has(snippetKey(activeDifficulty, s.language, s.title))
    );
    return { all: currentSnippets, uncompleted, completed };
  }, [currentSnippets, completedSet, activeDifficulty]);

  // Difficulty level: 1 = easy, 2 = medium, 3 = hard
  const difficultyLevel = DIFFICULTIES.findIndex((d) => d.key === activeDifficulty) + 1;

  const languageCounts = useMemo(() => {
    const pool = getSnippetPool(activeDifficulty);
    const counts: Record<string, number> = {};
    for (const s of pool) counts[s.language] = (counts[s.language] || 0) + 1;
    return counts;
  }, [activeDifficulty]);

  const totalPool = getSnippetPool(activeDifficulty);
  const totalSnippets = totalPool.length;
  const completedCount = sortedSnippets.completed.length;

  function startSnippet(difficulty: string, index?: number) {
    const params = new URLSearchParams({ difficulty });
    if (activeLanguage) params.set("language", activeLanguage);
    if (index !== undefined) params.set("snippet", String(index));
    router.push(`/play/coder/session?${params.toString()}`);
  }

  function startRandom() {
    const snippet = pickRandomSnippet(activeDifficulty, activeLanguage ?? undefined);
    if (!snippet) return;
    const pool = getFilteredSnippets(activeDifficulty, activeLanguage ?? undefined);
    const idx = pool.indexOf(snippet);
    startSnippet(activeDifficulty, idx);
  }

  return (
    <div className="flex flex-1 flex-col">
      {/* ── Content ─────────────────────────────────── */}
      <div className="flex-1" style={{ padding: "32px 28px" }}>
        <div className="mx-auto w-full max-w-6xl">

          {/* ── Header bar: difficulty + language + random ── */}
          <div
            className="mb-6 rounded-2xl border p-1.5"
            style={{
              background: "rgba(12,12,22,0.8)",
              borderColor: "rgba(255,255,255,0.05)",
            }}
          >
            <div className="flex items-center justify-between mb-2 px-1.5 pt-1.5">
              <span style={{ fontFamily: "var(--font-orbitron, 'Orbitron', sans-serif)", fontSize: 14, fontWeight: 700, letterSpacing: 3, color: "var(--ts-text-dim, #9b94b3)", textTransform: "uppercase" }}>SNIPPETS</span>
              <div className="flex items-center gap-2">
                {completedCount > 0 && (
                  <span className="hidden text-xs tabular-nums sm:block" style={{ color: "var(--ts-text-dim, #9b94b3)" }}>
                    <span style={{ color: diffColor }}>{completedCount}</span>/{totalSnippets} done
                  </span>
                )}
                <button
                  onClick={startRandom}
                  className="flex h-7 items-center gap-1.5 rounded-lg px-2.5 text-[9px] font-bold tracking-[1px] transition-all hover:brightness-125 active:scale-95"
                  style={{
                    background: `${diffColor}14`,
                    color: diffColor,
                    border: `1px solid ${diffColor}20`,
                  }}
                >
                  <span>🎲</span>
                  <span className="hidden sm:inline">Random</span>
                </button>
              </div>
            </div>
            {/* Difficulty — visual progression */}
            <div className="mb-2 flex gap-1">
              {DIFFICULTIES.map((diff, i) => {
                const isActive = activeDifficulty === diff.key;
                const level = i + 1;
                return (
                  <button
                    key={diff.key}
                    onClick={() => { setActiveDifficulty(diff.key); setActiveLanguage(null); }}
                    className="relative flex flex-1 flex-col items-center gap-1.5 rounded-xl py-4 text-xs font-bold tracking-[2px] transition-all duration-200"
                    style={{
                      background: isActive ? `${diff.color}16` : "transparent",
                      color: isActive ? diff.color : "var(--ts-text-dim, #9b94b3)",
                    }}
                  >
                    {isActive && (
                      <span
                        className="absolute inset-0 rounded-xl"
                        style={{ boxShadow: `inset 0 0 0 1px ${diff.color}30` }}
                      />
                    )}
                    <div className="flex items-center gap-2">
                      <span className="text-base">{diff.icon}</span>
                      <span>{diff.label}</span>
                    </div>
                    <DifficultyBars level={level} color={diff.color} />
                  </button>
                );
              })}
            </div>

            {/* Divider */}
            <div className="mx-2 h-px" style={{ background: "rgba(255,255,255,0.05)" }} />

            {/* Language pills — redesigned */}
            <div className="mt-2 flex flex-wrap gap-1.5 px-1.5 pb-1.5">
              <button
                onClick={() => setActiveLanguage(null)}                    className="rounded-lg px-3 py-2 text-xs font-bold tracking-[1px] transition-all duration-200"
                style={{
                  background: activeLanguage === null
                    ? "rgba(255,255,255,0.1)"
                    : "transparent",
                  color: activeLanguage === null
                    ? "var(--ts-text, #f5f3ff)"
                    : "var(--ts-text-dim, #9b94b3)",
                  border: `1px solid ${
                    activeLanguage === null
                      ? "rgba(255,255,255,0.15)"
                      : "rgba(255,255,255,0.05)"
                  }`,
                }}
              >
                All
              </button>
              {ALL_LANGUAGES.map((lang) => {
                const count = languageCounts[lang];
                if (!count) return null;
                const isActive = activeLanguage === lang;
                const c = LANGUAGE_COLORS[lang];
                return (
                  <button
                    key={lang}
                    onClick={() => setActiveLanguage(isActive ? null : lang)}
                    className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold tracking-[0.5px] transition-all duration-200"
                    style={{
                      background: isActive ? `${c}18` : "transparent",
                      color: isActive ? c : "var(--ts-text-dim, #9b94b3)",
                      border: `1px solid ${
                        isActive ? `${c}40` : "rgba(255,255,255,0.06)"
                      }`,
                      boxShadow: isActive ? `0 0 12px ${c}15` : "none",
                    }}
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{
                        background: c,
                        boxShadow: isActive ? `0 0 6px ${c}80` : "none",
                      }}
                    />
                    <span>{lang}</span>
                    <span
                      className="ml-0.5 rounded-md px-1.5 py-[1px] text-[8px] font-bold"
                      style={{
                        background: isActive ? `${c}20` : "rgba(255,255,255,0.06)",
                        color: isActive ? c : "rgba(255,255,255,0.35)",
                      }}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Snippets ─────────────────────────────── */}
          {currentSnippets.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-16" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
              <p className="text-sm" style={{ color: "var(--ts-text-dim, #9b94b3)" }}>No snippets match this combination</p>
              <button
                onClick={() => setActiveLanguage(null)}
                className="mt-3 text-[11px] font-bold tracking-[1px] underline underline-offset-4 opacity-60 hover:opacity-100 transition-opacity"
                style={{ color: "var(--ts-orange, #ff6b1a)" }}
              >
                Clear filter
              </button>
            </div>
          ) : (
            <>
              {/* Section label with counts */}
              <div className="mb-3 flex items-center gap-2">
                <h2 style={{ fontFamily: "var(--font-orbitron, 'Orbitron', sans-serif)", fontSize: 12, fontWeight: 700, letterSpacing: 2, color: "var(--ts-text-dim, #9b94b3)", textTransform: "uppercase" }}>
                  {activeLanguage ?? "All"} Snippets
                </h2>
                <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.05)" }} />
                <div className="flex items-center gap-2">
                  {completedCount > 0 && (
                    <span className="text-[10px] tabular-nums" style={{ color: diffColor }}>
                      {completedCount} done
                    </span>
                  )}
                  <span className="text-xs tabular-nums" style={{ color: "var(--ts-text-dim, #9b94b3)" }}>
                    {currentSnippets.length} total
                  </span>
                </div>
              </div>

              {/* Grid — uncompleted */}
              {sortedSnippets.uncompleted.length > 0 && (
                <>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
                    {sortedSnippets.uncompleted.map((snippet) => {
                      const actualIndex = currentSnippets.indexOf(snippet);
                      return (
                        <SnippetCard
                          key={snippetKey(activeDifficulty, snippet.language, snippet.title)}
                          snippet={snippet}
                          difficultyColor={diffColor}
                          difficultyIcon={difficultyInfo.icon}
                          difficultyLabel={difficultyInfo.label}
                          difficultyLevel={difficultyLevel}
                          isCompleted={false}
                          onClick={() => startSnippet(activeDifficulty, actualIndex)}
                        />
                      );
                    })}
                  </div>

                  {/* Completed separator */}
                  {sortedSnippets.completed.length > 0 && (
                    <div className="my-8 flex items-center gap-3">
                      <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.05)" }} />
                      <div className="flex flex-col items-center gap-1">
                        <span style={{ fontFamily: "var(--font-orbitron, 'Orbitron', sans-serif)", fontSize: 10, fontWeight: 700, letterSpacing: 2, color: "var(--ts-text-dim, #9b94b3)", textTransform: "uppercase" }}>
                          {completedCount} completed
                        </span>
                        <span className="text-[8px] tracking-[1px]" style={{ color: "rgba(255,255,255,0.15)" }}>
                          Tap to practice again
                        </span>
                      </div>
                      <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.05)" }} />
                    </div>
                  )}
                </>
              )}

              {/* Grid — completed */}
              {sortedSnippets.completed.length > 0 && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
                  {sortedSnippets.completed.map((snippet) => {
                    const actualIndex = currentSnippets.indexOf(snippet);
                    return (
                      <SnippetCard
                        key={`done-${snippetKey(activeDifficulty, snippet.language, snippet.title)}`}
                        snippet={snippet}
                        difficultyColor={diffColor}
                        difficultyIcon={difficultyInfo.icon}
                        difficultyLabel={difficultyInfo.label}
                        difficultyLevel={difficultyLevel}
                        isCompleted={true}
                        onClick={() => startSnippet(activeDifficulty, actualIndex)}
                      />
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* Footer */}
          <div className="mt-10 text-center">
            <p className="text-xs tracking-[2px]" style={{ color: "rgba(255,255,255,0.12)" }}>
              Real code · Multi-line indentation · Semi-colons &amp; parentheses required · Accuracy &gt; speed
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
