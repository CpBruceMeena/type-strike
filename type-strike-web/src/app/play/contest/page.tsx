"use client";

import { useRouter } from "next/navigation";
import GlassPanel from "@/components/ui/GlassPanel";

const TIMED_MODES = [
  {
    key: "1min",
    label: "1 MIN",
    description: "Quick-fire speed sprint",
    detail: "60 seconds • Full keyboard • High intensity",
    icon: "⏱️",
    href: "/play/1min",
    color: "#FF6600",
    gradient: "from-[#FF6600] to-[#FF5020]",
  },
  {
    key: "3min",
    label: "3 MIN",
    description: "Endurance pace test",
    detail: "180 seconds • Mixed difficulty • Stay consistent",
    icon: "⏳",
    href: "/play/3min",
    color: "#CC44FF",
    gradient: "from-[#CC44FF] to-[#8844FF]",
  },
  {
    key: "5min",
    label: "5 MIN",
    description: "Full marathon challenge",
    detail: "300 seconds • Expert paragraphs • Maximum stamina",
    icon: "🔥",
    href: "/play/5min",
    color: "#FF00AA",
    gradient: "from-[#FF00AA] to-[#CC44FF]",
  },
];

export default function ContestHubPage() {
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
            TIMED MODES
          </span>
          <div className="w-9" />
        </header>

        {/* Content */}
        <div className="flex flex-1 flex-col items-center justify-center px-4 pb-8 md:px-6">
          {/* Title */}
          <div className="mb-2 text-center">
            <h1
              className="text-3xl font-black tracking-[6px] md:text-4xl"
              style={{ color: "var(--text-white)" }}
            >
              TIMED
            </h1>
            <p className="mt-1 text-xs tracking-[3px]" style={{ color: "var(--text-muted)" }}>
              Choose your duration
            </p>
          </div>

          {/* Mode Cards */}
          <div className="mt-6 flex w-full max-w-lg flex-col gap-4">
            {TIMED_MODES.map((mode) => (
              <button
                key={mode.key}
                onClick={() => router.push(mode.href)}
                className="group relative w-full overflow-hidden rounded-2xl border border-[rgba(255,255,255,0.06)] p-5 text-left transition-all duration-300 hover:scale-[1.02]"
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
          <GlassPanel glow="magma" blur="sm" depth={1} className="mt-6 w-full max-w-lg px-5 py-4">
            <p className="text-center text-[10px] font-bold tracking-[2px]" style={{ color: "var(--text-muted)" }}>
              Full keyboard required • Numbers & special characters included • High score tracked per mode
            </p>
          </GlassPanel>
        </div>
    </div>
  );
}
