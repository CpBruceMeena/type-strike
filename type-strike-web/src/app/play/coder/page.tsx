"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import GlassPanel from "@/components/ui/GlassPanel";
import {
  DIFFICULTIES,
  ALL_LANGUAGES,
  LANGUAGE_COLORS,
  getFilteredSnippets,
  getSnippetPool,
  pickRandomSnippet,
} from "@/lib/coder-data";

export default function CoderHubPage() {
  const router = useRouter();
  const [activeDifficulty, setActiveDifficulty] = useState("easy");
  const [activeLanguage, setActiveLanguage] = useState<string | null>(null);

  const currentSnippets = useMemo(
    () => getFilteredSnippets(activeDifficulty, activeLanguage ?? undefined),
    [activeDifficulty, activeLanguage]
  );

  const difficultyInfo = DIFFICULTIES.find((d) => d.key === activeDifficulty)!;

  // Count snippets per language for the current difficulty
  const languageCounts = useMemo(() => {
    const pool = getSnippetPool(activeDifficulty);
    const counts: Record<string, number> = {};
    for (const s of pool) {
      counts[s.language] = (counts[s.language] || 0) + 1;
    }
    return counts;
  }, [activeDifficulty]);

  function startSnippet(difficulty: string, index?: number) {
    let params = `difficulty=${difficulty}`;
    if (activeLanguage) params += `&language=${activeLanguage}`;
    if (index !== undefined) params += `&snippet=${index}`;
    router.push(`/play/coder/session?${params}`);
  }

  function startRandom() {
    const snippet = pickRandomSnippet(activeDifficulty, activeLanguage ?? undefined);
    if (!snippet) return;
    // Find the index of this snippet in the filtered pool
    const pool = getFilteredSnippets(activeDifficulty, activeLanguage ?? undefined);
    const idx = pool.indexOf(snippet);
    startSnippet(activeDifficulty, idx);
  }

  return (
    <div className="flex min-h-dvh w-full flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 md:px-6">
        <button
          onClick={() => router.push("/home")}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-sm transition-colors hover:bg-white/5"
          style={{ color: "var(--text-body)" }}
        >
          ✕
        </button>
        <span
          className="text-xs font-bold tracking-[3px]"
          style={{ color: "var(--text-muted)" }}
        >
          CODER MODE
        </span>
        <div className="w-9" />
      </header>

      {/* Content */}
      <div className="flex flex-1 flex-col px-4 pb-8 md:px-6 overflow-y-auto">
        {/* Title */}
        <div className="mb-4 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#00E5FF]/10">
            <span className="text-2xl">👨‍💻</span>
          </div>
          <h1
            className="text-2xl font-black tracking-[5px] md:text-3xl"
            style={{ color: "var(--electric-cyan)" }}
          >
            CODE ARENA
          </h1>
          <p className="mt-1 text-[10px] tracking-[2px]" style={{ color: "var(--text-muted)" }}>
            Pick a snippet. Type it fast. Master every language.
          </p>
        </div>

        {/* Difficulty Tabs */}
        <div className="flex items-center justify-center gap-2 mb-4">
          {DIFFICULTIES.map((diff) => (
            <button
              key={diff.key}
              onClick={() => { setActiveDifficulty(diff.key); setActiveLanguage(null); }}
              className="relative rounded-xl px-5 py-2.5 text-xs font-bold tracking-[2px] transition-all duration-200"
              style={{
                background:
                  activeDifficulty === diff.key
                    ? `${diff.color}18`
                    : "rgba(255,255,255,0.04)",
                color: activeDifficulty === diff.key ? diff.color : "var(--text-muted)",
                border: `1px solid ${
                  activeDifficulty === diff.key
                    ? `${diff.color}40`
                    : "rgba(255,255,255,0.06)"
                }`,
              }}
            >
              <span className="mr-1.5">{diff.icon}</span>
              {diff.label}
            </button>
          ))}
        </div>

        {/* Language Tags */}
        <div className="mb-5">
          <div className="flex flex-wrap items-center justify-center gap-1.5">
            <button
              onClick={() => setActiveLanguage(null)}
              className="rounded-lg px-3 py-1.5 text-[9px] font-bold tracking-[1.5px] transition-all duration-200"
              style={{
                background: activeLanguage === null ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.04)",
                color: activeLanguage === null ? "var(--text-white)" : "var(--text-muted)",
                border: `1px solid ${activeLanguage === null ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.06)"}`,
              }}
            >
              ALL ({getSnippetPool(activeDifficulty).length})
            </button>
            {ALL_LANGUAGES.map((lang) => {
              const count = languageCounts[lang] || 0;
              if (count === 0) return null;
              const isActive = activeLanguage === lang;
              const langColor = LANGUAGE_COLORS[lang];
              return (
                <button
                  key={lang}
                  onClick={() => setActiveLanguage(isActive ? null : lang)}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[9px] font-bold tracking-[1px] transition-all duration-200"
                  style={{
                    background: isActive ? `${langColor}20` : "rgba(255,255,255,0.04)",
                    color: isActive ? langColor : "var(--text-label)",
                    border: `1px solid ${isActive ? `${langColor}50` : "rgba(255,255,255,0.06)"}`,
                  }}
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: langColor }}
                  />
                  {lang}
                  <span style={{ opacity: 0.5, marginLeft: 1 }}>{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Random Start Button */}
        {currentSnippets.length > 0 && (
          <button
            onClick={startRandom}
            className="group relative mb-4 w-full overflow-hidden rounded-xl py-3 text-center text-xs font-bold tracking-[2px] transition-all duration-200 hover:scale-[1.01]"
            style={{
              background: `linear-gradient(135deg, ${difficultyInfo.color}20, ${difficultyInfo.color}08)`,
              border: `1px solid ${difficultyInfo.color}30`,
              color: difficultyInfo.color,
            }}
          >
            <span className="relative z-10">
              🎲 RANDOM{' '}
              {activeLanguage ? `${activeLanguage.toUpperCase()} ` : ''}
              {difficultyInfo.label}
            </span>
            <div
              className="absolute inset-0 -z-0 rounded-xl opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-40"
              style={{ background: difficultyInfo.color }}
            />
          </button>
        )}

        {/* Snippet Grid */}
        {currentSnippets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              No snippets match this combination
            </p>
            <button
              onClick={() => setActiveLanguage(null)}
              className="mt-3 text-xs font-bold tracking-[1.5px] underline underline-offset-2"
              style={{ color: "var(--electric-cyan)" }}
            >
              CLEAR FILTER
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {currentSnippets.map((snippet, index) => {
              const langColor = LANGUAGE_COLORS[snippet.language] ?? "#888888";
              const lines = snippet.code.split("\n");
              const previewLines = lines.slice(0, 4);
              const preview = previewLines.join("\n");
              const totalChars = snippet.code.length;

              return (
                <button
                  key={`${snippet.language}-${index}`}
                  onClick={() => startSnippet(activeDifficulty, index)}
                  className="group relative flex flex-col overflow-hidden rounded-2xl border p-4 text-left transition-all duration-200 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]"
                  style={{
                    background: "rgba(15,15,25,0.7)",
                    borderColor: "rgba(255,255,255,0.06)",
                    backdropFilter: "blur(16px)",
                  }}
                >
                  {/* Glow accent on hover */}
                  <div
                    className="absolute right-0 top-0 h-20 w-20 rounded-full opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-20"
                    style={{ background: langColor }}
                  />

                  {/* Top row: difficulty + language badges */}
                  <div className="relative mb-2 flex items-center justify-between">
                    <span
                      className="rounded px-2 py-0.5 text-[8px] font-bold tracking-[1.5px]"
                      style={{
                        background: `${difficultyInfo.color}18`,
                        color: difficultyInfo.color,
                        border: `1px solid ${difficultyInfo.color}30`,
                      }}
                    >
                      {difficultyInfo.icon} {difficultyInfo.label}
                    </span>
                    <span
                      className="flex items-center gap-1 rounded px-2 py-0.5 text-[8px] font-bold tracking-[1px]"
                      style={{
                        background: `${langColor}15`,
                        color: langColor,
                        border: `1px solid ${langColor}30`,
                      }}
                    >
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ background: langColor }}
                      />
                      {snippet.language}
                    </span>
                  </div>

                  {/* Title */}
                  <h3
                    className="relative mb-1 text-sm font-bold tracking-[0.5px]"
                    style={{ color: "var(--text-white)" }}
                  >
                    {snippet.title}
                    <span
                      className="ml-2 text-[9px] font-normal tracking-[0.5px]"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {lines.length} lines
                    </span>
                  </h3>

                  {/* Code preview */}
                  <div
                    className="relative overflow-hidden rounded-lg"
                    style={{ background: "rgba(0,0,0,0.35)" }}
                  >
                    {/* Line number gutter */}
                    <div className="flex">
                      <div className="select-none border-r px-1.5 py-2 text-right text-[9px] leading-[1.6]"
                        style={{
                          color: "rgba(255,255,255,0.15)",
                          borderColor: "rgba(255,255,255,0.06)",
                          fontFamily: "'Cascadia Code', 'Fira Code', 'JetBrains Mono', monospace",
                          minWidth: "24px",
                        }}
                      >
                        {previewLines.map((_, i) => (
                          <div key={i}>{i + 1}</div>
                        ))}
                      </div>
                      <pre
                        className="flex-1 p-2 text-[10px] leading-[1.6]"
                        style={{
                          color: "rgba(255,255,255,0.5)",
                          fontFamily: "'Cascadia Code', 'Fira Code', 'JetBrains Mono', monospace",
                          whiteSpace: "pre",
                          overflow: "hidden",
                        }}
                      >
                        {preview}
                      </pre>
                    </div>
                    {/* Fade gradient for overflow */}
                    {lines.length > 4 && (
                      <div
                        className="pointer-events-none absolute bottom-0 left-0 right-0 h-6"
                        style={{
                          background: "linear-gradient(to bottom, transparent, rgba(0,0,0,0.35))",
                        }}
                      />
                    )}
                  </div>

                  {/* Bottom metadata */}
                  <div className="relative mt-2 flex items-center justify-between">
                    <span className="text-[9px]" style={{ color: "var(--text-muted)" }}>
                      {totalChars} chars
                    </span>
                    <span
                      className="text-sm opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                      style={{ color: langColor }}
                    >
                      Type →
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Info panel */}
        <GlassPanel glow="cyan" blur="sm" depth={1} className="mt-5 w-full px-5 py-4">
          <p className="text-center text-[10px] font-bold tracking-[2px]" style={{ color: "var(--text-muted)" }}>
            Real code snippets • Multi-line indentation • Semi-colons &amp; parentheses required • Accuracy matters more than speed
          </p>
        </GlassPanel>
      </div>
    </div>
  );
}
