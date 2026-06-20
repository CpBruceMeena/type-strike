"use client";

import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";

export default function Timed1MinPage() {
  const router = useRouter();

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-5">
      <span className="mb-4 text-5xl">⏱️</span>
      <h1 className="mb-2 text-lg font-black tracking-[3px] text-text-white">1 MINUTE</h1>
      <p className="mb-1 text-center text-xs text-text-label">
        Type as fast as you can in 60 seconds.
      </p>
      <p className="mb-8 text-[10px] text-text-muted">
        Hard difficulty • Numbers, symbols, capitals
      </p>

      <Button variant="primary" size="lg" className="mb-3" onClick={() => {}}>
        START SPRINT
      </Button>

      <Button variant="ghost" size="sm" onClick={() => router.push("/home")}>
        Back to home
      </Button>
    </div>
  );
}
