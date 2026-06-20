"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import ParticleField from "@/components/effects/ParticleField";
import Button from "@/components/ui/Button";
import GlassPanel from "@/components/ui/GlassPanel";

function FailedContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const wpm = searchParams.get("wpm") ?? "—";
  const accuracy = searchParams.get("accuracy") ?? "—";
  const xp = searchParams.get("xp") ?? "0";
  const mode = searchParams.get("mode") ?? "";

  return (
    <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-[480px] flex-col items-center justify-center px-5">
      {/* Failed icon */}
      <div className="mb-2 text-6xl">💥</div>

      <h1
        className="mb-1 text-3xl font-black tracking-[6px]"
        style={{ color: "var(--error-red)", textShadow: "0 0 40px rgba(255,34,0,0.3)" }}
      >
        FAILED
      </h1>
      <p className="mb-6 text-xs" style={{ color: "var(--text-label)" }}>
        Not quite there. Keep pushing!
      </p>

      {/* Stats */}
      <GlassPanel glow="magma" blur="sm" depth={2} className="mb-6 w-full p-4">
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "WPM", value: wpm, color: "var(--accent-primary)" },
            { label: "ACC", value: typeof accuracy === "string" ? `${(parseFloat(accuracy) * 100).toFixed(0)}%` : accuracy, color: "var(--text-body)" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl bg-black/20 p-3 text-center">
              <p className="text-xl font-black tabular-nums" style={{ color: stat.color }}>
                {stat.value}
              </p>
              <p className="mt-0.5 text-[8px] font-bold tracking-[1.5px]" style={{ color: "var(--text-muted)" }}>
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        {xp !== "0" && (
          <div className="mt-2 text-center">
            <p className="text-sm font-black tabular-nums" style={{ color: "var(--electric-cyan)" }}>
              +{xp} XP
            </p>
          </div>
        )}

        <div className="mt-3 rounded-lg bg-black/20 p-3 text-center">
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            💡 Tip: Focus on accuracy first, speed will follow. Try to maintain 95%+ accuracy.
          </p>
        </div>
      </GlassPanel>

      {/* Actions */}
      <Button variant="primary" size="lg" fullWidth className="mb-2" onClick={() => router.back()}>
        RETRY
      </Button>
      <Button variant="ghost" size="sm" onClick={() => router.push("/home")}>
        HOME
      </Button>
    </div>
  );
}

export default function FailedPage() {
  return (
    <>
      <ParticleField />
      <Suspense fallback={
        <div className="flex min-h-dvh items-center justify-center">
          <p style={{ color: "var(--text-muted)" }}>Loading results…</p>
        </div>
      }>
        <FailedContent />
      </Suspense>
    </>
  );
}
