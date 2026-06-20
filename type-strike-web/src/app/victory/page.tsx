"use client";

import { useRouter } from "next/navigation";
import ParticleField from "@/components/effects/ParticleField";
import Button from "@/components/ui/Button";

export default function VictoryPage() {
  const router = useRouter();

  return (
    <>
      <ParticleField />
      <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-[480px] flex-col items-center justify-center px-5">
        <span className="mb-4 text-6xl">🏆</span>
        <h1 className="mb-6 text-2xl font-black tracking-[4px] text-accent-gold">VICTORY</h1>

        <div className="mb-8 grid w-full grid-cols-3 gap-3">
          {["WPM", "ACC", "STARS"].map((label) => (
            <div key={label} className="rounded-xl bg-bg-surface/50 p-3 text-center">
              <p className="text-lg font-black text-text-white">—</p>
              <p className="mt-0.5 text-[8px] font-bold tracking-[1.5px] text-text-muted">{label}</p>
            </div>
          ))}
        </div>

        <Button variant="primary" size="lg" fullWidth className="mb-2" onClick={() => {}}>
          PLAY AGAIN
        </Button>
        <Button variant="secondary" size="md" fullWidth className="mb-2" onClick={() => router.push("/map")}>
          BACK TO MAP
        </Button>
        <Button variant="ghost" size="sm" onClick={() => router.push("/home")}>
          HOME
        </Button>
      </div>
    </>
  );
}
