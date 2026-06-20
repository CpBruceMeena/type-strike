"use client";

import { useRouter } from "next/navigation";
import ParticleField from "@/components/effects/ParticleField";
import Button from "@/components/ui/Button";

export default function FailedPage() {
  const router = useRouter();

  return (
    <>
      <ParticleField />
      <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-[480px] flex-col items-center justify-center px-5">
        <span className="mb-4 text-6xl">💥</span>
        <h1 className="mb-2 text-2xl font-black tracking-[4px] text-error-red">FAILED</h1>
        <p className="mb-8 text-xs text-text-label">Not quite there. Keep pushing!</p>

        <div className="mb-8 grid w-full grid-cols-2 gap-3">
          {["WPM", "ACC"].map((label) => (
            <div key={label} className="rounded-xl bg-bg-surface/50 p-3 text-center">
              <p className="text-lg font-black text-text-white">—</p>
              <p className="mt-0.5 text-[8px] font-bold tracking-[1.5px] text-text-muted">{label}</p>
            </div>
          ))}
        </div>

        <Button variant="primary" size="lg" fullWidth className="mb-2" onClick={() => router.back()}>
          RETRY
        </Button>
        <Button variant="ghost" size="sm" onClick={() => router.push("/home")}>
          HOME
        </Button>
      </div>
    </>
  );
}
