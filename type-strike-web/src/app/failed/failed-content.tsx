"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import Button from "@/components/ui/Button";
import GlassPanel from "@/components/ui/GlassPanel";

export default function FailedContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const wpm = searchParams.get("wpm") ?? "—";
  const accuracy = searchParams.get("accuracy") ?? "—";
  const xp = searchParams.get("xp") ?? "0";
  const mode = searchParams.get("mode") ?? "";

  const handleRetry = useCallback(() => {
    if (mode.startsWith("level-")) {
      const levelId = mode.replace("level-", "");
      router.push(`/play/level?id=${levelId}`);
    } else if (mode === "timed_1min") {
      router.push("/play/1min");
    } else if (mode === "timed_3min") {
      router.push("/play/3min");
    } else if (mode === "timed_5min") {
      router.push("/play/5min");
    } else if (mode === "contest") {
      router.push("/play/contest");
    } else {
      router.back();
    }
  }, [mode, router]);

  return (
    <div className="relative z-10 flex min-h-dvh w-full flex-col items-center justify-center px-6">
      {/* Failed icon */}
      <div className="mb-3 text-7xl">💥</div>

      <h1
        className="mb-1 text-4xl font-black tracking-[8px] md:text-5xl"
        style={{ color: "var(--error-red)", textShadow: "0 0 40px rgba(255,34,0,0.3)" }}
      >
        FAILED
      </h1>
      <p className="mb-8 text-sm" style={{ color: "var(--text-label)" }}>
        Not quite there. Keep pushing!
      </p>

      {/* Stats */}
      <GlassPanel glow="magma" blur="md" depth={2} className="mb-8 w-full max-w-md p-6">
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: "WPM", value: wpm, color: "var(--accent-primary)" },
            { label: "ACC", value: typeof accuracy === "string" ? `${(parseFloat(accuracy) * 100).toFixed(0)}%` : accuracy, color: "var(--text-body)" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl bg-black/20 p-4 text-center">
              <p className="text-2xl font-black tabular-nums md:text-3xl" style={{ color: stat.color }}>
                {stat.value}
              </p>
              <p className="mt-1 text-[9px] font-bold tracking-[1.5px]" style={{ color: "var(--text-muted)" }}>
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        {xp !== "0" && (
          <div className="mt-3 text-center">
            <p className="text-base font-black tabular-nums" style={{ color: "var(--electric-cyan)" }}>
              +{xp} XP
            </p>
          </div>
        )}

        <div className="mt-4 rounded-lg bg-black/20 p-4 text-center">
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            💡 Tip: Focus on accuracy first, speed will follow. Try to maintain 95%+ accuracy.
          </p>
        </div>
      </GlassPanel>

      {/* Actions */}
      <div className="flex gap-3">
        <Button variant="primary" size="lg" onClick={handleRetry}>
          RETRY
        </Button>
        <Button variant="secondary" size="lg" onClick={() => router.push("/home")}>
          HOME
        </Button>
        <Button variant="ghost" size="lg" onClick={() => router.back()}>
          ← BACK
        </Button>
      </div>
    </div>
  );
}
