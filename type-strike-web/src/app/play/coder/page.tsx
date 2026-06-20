"use client";

import { useRouter } from "next/navigation";
import GlassPanel from "@/components/ui/GlassPanel";

const CODER_MODES = [
  {
    key: "easy",
    label: "EASY",
    description: "Basic algorithms & syntax",
    detail: "60 seconds • Simple functions • Arrays & strings",
    icon: "🔤",
    href: "/play/coder/session?difficulty=easy",
    color: "#22FF44",
  },
  {
    key: "medium",
    label: "MEDIUM",
    description: "Data structures & patterns",
    detail: "90 seconds • Trees, graphs, DP basics • Medium complexity",
    icon: "⚙️",
    href: "/play/coder/session?difficulty=medium",
    color: "#FFCC00",
  },
  {
    key: "hard",
    label: "HARD",
    description: "Advanced DSA & optimizations",
    detail: "120 seconds • Complex algorithms • High precision required",
    icon: "🚀",
    href: "/play/coder/session?difficulty=hard",
    color: "#FF5020",
  },
];

export default function CoderHubPage() {
  const router = useRouter();

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
      <div className="flex flex-1 flex-col items-center justify-center px-4 pb-8 md:px-6">
        {/* Title */}
        <div className="mb-2 text-center">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#00E5FF]/10">
            <span className="text-3xl">👨‍💻</span>
          </div>
          <h1
            className="text-3xl font-black tracking-[6px] md:text-4xl"
            style={{ color: "var(--electric-cyan)" }}
          >
            CODER
          </h1>
          <p className="mt-1 text-xs tracking-[3px]" style={{ color: "var(--text-muted)" }}>
            Type real code. Think like a developer.
          </p>
        </div>

        {/* Mode Cards */}
        <div className="mt-6 flex w-full max-w-lg flex-col gap-4">
          {CODER_MODES.map((mode) => (
            <button
              key={mode.key}
              onClick={() => router.push(mode.href)}
              className="group relative w-full overflow-hidden rounded-2xl border border-[rgba(0,229,255,0.08)] p-5 text-left transition-all duration-300 hover:scale-[1.02]"
              style={{
                background: "rgba(15,15,25,0.7)",
                backdropFilter: "blur(16px)",
              }}
            >
              {/* Gradient accent bar on the left */}
              <div
                className="absolute left-0 top-0 h-full w-1 rounded-l-2xl"
                style={{ background: `linear-gradient(to bottom, ${mode.color}, ${mode.color}88)` }}
              />

              <div className="flex items-center gap-4">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-xl text-2xl"
                  style={{ background: `${mode.color}15` }}
                >
                  {mode.icon}
                </div>
                <div className="flex-1">
                  <p className="text-lg font-black tracking-[3px]" style={{ color: mode.color }}>
                    {mode.label}
                  </p>
                  <p className="text-xs" style={{ color: "var(--text-body)" }}>
                    {mode.description}
                  </p>
                  <p className="mt-0.5 text-[10px] tracking-[1px]" style={{ color: "var(--text-muted)" }}>
                    {mode.detail}
                  </p>
                </div>
                <span
                  className="text-lg transition-transform duration-300 group-hover:translate-x-1"
                  style={{ color: "var(--text-label)" }}
                >
                  →
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* Info panel */}
        <GlassPanel glow="cyan" blur="sm" depth={1} className="mt-6 w-full max-w-lg px-5 py-4">
          <p className="text-center text-[10px] font-bold tracking-[2px]" style={{ color: "var(--text-muted)" }}>
            Code snippets use real syntax • Semi-colons & parentheses required • Accuracy matters more than speed
          </p>
        </GlassPanel>
      </div>
    </div>
  );
}
