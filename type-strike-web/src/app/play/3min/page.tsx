"use client";

import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";

export default function Timed3MinPage() {
  const router = useRouter();

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-5">
      <span className="mb-4 text-5xl">⏳</span>
      <h1 className="mb-2 text-lg font-black tracking-[3px] text-text-white">3 MINUTES</h1>
      <p className="mb-1 text-center text-xs text-text-label">
        Endurance run — pace yourself for 3 minutes.
      </p>
      <p className="mb-8 text-[10px] text-text-muted">
        Hard difficulty • Numbers, symbols, capitals
      </p>

      <Button variant="primary" size="lg" className="mb-3" onClick={() => {}}>
        START ENDURANCE
      </Button>

      <Button variant="ghost" size="sm" onClick={() => router.push("/home")}>
        Back to home
      </Button>
    </div>
  );
}
