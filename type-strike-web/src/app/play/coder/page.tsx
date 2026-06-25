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
} from "@/lib/coder-data";

// ── Seeded pseudo-random (deterministic across server & client) ─

function seeded(i: number, j: number): number {
  const x = Math.sin(i * 12.9898 + j * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

// ── Splash Particles (hydrate-safe via seeded random) ──

function ParticleField({ accent }: { accent: string }) {
  const particles = useMemo(() =>
    Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: seeded(i, 0) * 100,
      y: seeded(i, 1) * 100,
      size: seeded(i, 2) * 3 + 1,
      delay: seeded(i, 3) * 5,
      duration: seeded(i, 4) * 4 + 3,
    })),
  []);
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full opacity-20"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            background: accent,
            animation: `float-up ${p.duration}s ease-out ${p.delay}s infinite`,
            boxShadow: `0 0 ${p.size * 4}px ${accent}40`,
          }}
        />
      ))}
    </div>
  );
}

// ── Stateless Snippet Card ──────────────────────────────

function SnippetCard({
  snippet,
  index,
  difficultyColor,
  difficultyIcon,
  difficultyLabel,
  onClick,
}: {
  snippet: { title: string; language: string; code: string };
  index: number;
  difficultyColor: string;
  difficultyIcon: string;
  difficultyLabel: string;
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
        background: "rgba(18,18,30,0.85)",
        borderColor: "rgba(255,255,255,0.06)",
        backdropFilter: "blur(20px)",
        boxShadow: "0 2px 20px rgba(0,0,0,0.3)",
      }}
    >
      {/* Hover glow */}
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-0 blur-3xl transition-all duration-500 group-hover:opacity-20"
        style={{ background: langColor }}
      />

      {/* Top row: labels */}
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
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: langColor }} />
          {snippet.language}
        </span>
      </div>

      {/* Title + meta */}
      <h3
        className="relative mb-0.5 text-sm font-bold tracking-tight"
        style={{ color: "var(--text-white)" }}
      >
        {snippet.title}
      </h3>
      <div className="relative mb-3 flex items-center gap-3 text-[10px]" style={{ color: "var(--text-muted)" }}>
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
          {/* Line numbers */}
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
          {/* Code */}
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

      {/* CTA */}
      <div
        className="relative mt-3 flex items-center gap-1.5 text-[10px] font-bold tracking-[1px] opacity-0 transition-all duration-200 group-hover:opacity-100"
        style={{ color: langColor }}
      >
        <span>Start typing</span>
        <span className="text-xs transition-transform duration-200 group-hover:translate-x-0.5">→</span>
      </div>
    </button>
  );
}

// ── Main Page ────────────────────────────────────────────

export default function CoderHubPage() {
  const router = useRouter();
  const [activeDifficulty, setActiveDifficulty] = useState("easy");
  const [activeLanguage, setActiveLanguage] = useState<string | null>(null);

  const currentSnippets = useMemo(
    () => getFilteredSnippets(activeDifficulty, activeLanguage ?? undefined),
    [activeDifficulty, activeLanguage],
  );

  const difficultyInfo = DIFFICULTIES.find((d) => d.key === activeDifficulty)!;
  const diffColor = difficultyInfo.color;

  // Count per language
  const languageCounts = useMemo(() => {
    const pool = getSnippetPool(activeDifficulty);
    const counts: Record<string, number> = {};
    for (const s of pool) counts[s.language] = (counts[s.language] || 0) + 1;
    return counts;
  }, [activeDifficulty]);

  const totalPool = getSnippetPool(activeDifficulty);
  const totalSnippets = totalPool.length;

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
    <div className="relative flex min-h-dvh w-full flex-col">
      <ParticleField accent={diffColor} />

      {/* Header */}
      <header className="flex items-center justify-between border-b px-5 py-3.5" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
        <button
          onClick={() => router.push("/home")}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-sm transition-colors hover:bg-white/[0.06]"
          style={{ color: "var(--text-label)" }}
          aria-label="Back to home"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold tracking-[2.5px] uppercase" style={{ color: "var(--text-muted)" }}>
            Code Arena
          </span>
          <span
            className="rounded-full px-2 py-0.5 text-[9px] font-bold tabular-nums"
            style={{
              background: `${diffColor}15`,
              color: diffColor,
            }}
          >
            {currentSnippets.length}/{totalSnippets}
          </span>
        </div>

        <button
          onClick={startRandom}
          className="flex h-8 items-center gap-1.5 rounded-lg px-3 text-[10px] font-bold tracking-[1px] transition-all hover:brightness-125 active:scale-95"
          style={{
            background: `${diffColor}14`,
            color: diffColor,
            border: `1px solid ${diffColor}20`,
          }}
        >
          <span>🎲</span>
          <span className="hidden sm:inline">Random</span>
        </button>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-6xl px-4 py-6 md:px-8 md:py-8">

          {/* Hero */}
          <div className="mb-8 text-center">
            <h1
              className="text-3xl font-black tracking-tight md:text-4xl"
              style={{ color: "var(--text-white)" }}
            >
              Master <span style={{ color: "var(--electric-cyan)" }}>Code</span>
            </h1>
            <p className="mt-1.5 text-xs tracking-wide" style={{ color: "var(--text-muted)" }}>
              Type real-world algorithms & data structures from top company interviews
            </p>
          </div>

          {/* ── Filter Bar ───────────────────────────── */}
          <div
            className="mb-7 rounded-2xl border p-1.5"
            style={{
              background: "rgba(12,12,22,0.8)",
              borderColor: "rgba(255,255,255,0.05)",
            }}
          >
            {/* Difficulty segmented control */}
            <div className="mb-2 flex gap-1">
              {DIFFICULTIES.map((diff) => {
                const isActive = activeDifficulty === diff.key;
                return (
                  <button
                    key={diff.key}
                    onClick={() => { setActiveDifficulty(diff.key); setActiveLanguage(null); }}
                    className="relative flex-1 rounded-xl py-2.5 text-[11px] font-bold tracking-[1.5px] transition-all duration-200"
                    style={{
                      background: isActive ? `${diff.color}16` : "transparent",
                      color: isActive ? diff.color : "var(--text-muted)",
                    }}
                  >
                    {isActive && (
                      <span
                        className="absolute inset-0 rounded-xl"
                        style={{ boxShadow: `inset 0 0 0 1px ${diff.color}30` }}
                      />
                    )}
                    <span className="mr-1.5">{diff.icon}</span>
                    {diff.label}
                  </button>
                );
              })}
            </div>

            {/* Divider */}
            <div className="mx-2 h-px" style={{ background: "rgba(255,255,255,0.05)" }} />

            {/* Language pills */}
            <div className="mt-2 flex flex-wrap gap-1 px-1 pb-1">
              <button
                onClick={() => setActiveLanguage(null)}
                className="rounded-lg px-3 py-1.5 text-[10px] font-bold tracking-[1px] transition-all duration-200"
                style={{
                  background: activeLanguage === null ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.03)",
                  color: activeLanguage === null ? "var(--text-white)" : "var(--text-label)",
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
                    className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[10px] font-bold tracking-[0.5px] transition-all duration-200"
                    style={{
                      background: isActive ? `${c}18` : "rgba(255,255,255,0.03)",
                      color: isActive ? c : "var(--text-label)",
                      border: `1px solid ${isActive ? `${c}35` : "rgba(255,255,255,0.05)"}`,
                    }}
                  >
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: c }} />
                    {lang}
                    <span className="ml-px opacity-50">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Snippets ─────────────────────────────── */}
          {currentSnippets.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-16" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>No snippets match this combination</p>
              <button
                onClick={() => setActiveLanguage(null)}
                className="mt-3 text-[11px] font-bold tracking-[1px] underline underline-offset-4 opacity-60 hover:opacity-100 transition-opacity"
                style={{ color: "var(--electric-cyan)" }}
              >
                Clear filter
              </button>
            </div>
          ) : (
            <>
              {/* Section label */}
              <div className="mb-3 flex items-center gap-2">
                <h2 className="text-[11px] font-bold tracking-[2px] uppercase" style={{ color: "var(--text-label)" }}>
                  {activeLanguage ?? "All"} Snippets
                </h2>
                <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.05)" }} />
                <span className="text-[10px] tabular-nums" style={{ color: "var(--text-muted)" }}>
                  {currentSnippets.length} available
                </span>
              </div>

              {/* Grid */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {currentSnippets.map((snippet, index) => (
                  <SnippetCard
                    key={`${snippet.language}-${index}`}
                    snippet={snippet}
                    index={index}
                    difficultyColor={diffColor}
                    difficultyIcon={difficultyInfo.icon}
                    difficultyLabel={difficultyInfo.label}
                    onClick={() => startSnippet(activeDifficulty, index)}
                  />
                ))}
              </div>
            </>
          )}

          {/* Footer */}
          <div className="mt-10 text-center">
            <p className="text-[9px] tracking-[2px]" style={{ color: "rgba(255,255,255,0.12)" }}>
              Real code · Multi-line indentation · Semi-colons &amp; parentheses required · Accuracy &gt; speed
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
