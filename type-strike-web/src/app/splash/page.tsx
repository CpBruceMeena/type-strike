"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ParticleField from "@/components/effects/ParticleField";

export default function SplashPage() {
  const router = useRouter();
  const [show, setShow] = useState(false);

  useEffect(() => {
    setShow(true);
    const timer = setTimeout(() => {
      router.replace("/app/home");
    }, 2500);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <>
      <ParticleField />
      <div className="relative z-10 flex min-h-dvh flex-col items-center justify-center">
        <div
          className={`transition-all duration-1000 ${
            show ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
          }`}
        >
          <div className="text-center">
            <h1 className="text-5xl font-black tracking-[6px]">
              <span className="text-text-white">TYPE</span>{" "}
              <span className="text-accent-primary">STRIKE</span>
            </h1>
            <p className="mt-4 text-[11px] font-bold tracking-[4px] text-text-label">
              TYPE WITH FURY • STRIKE WITH FIRE
            </p>
          </div>
        </div>

        <div className="absolute bottom-16">
          <div className="h-1 w-16 overflow-hidden rounded-full bg-bg-surface-dark">
            <div className="h-full w-full animate-pulse rounded-full bg-accent-primary" />
          </div>
        </div>
      </div>
    </>
  );
}
