"use client";

import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";

export default function ContestPage() {
  const router = useRouter();

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-5">
      <span className="mb-4 text-5xl">🏆</span>
      <h1 className="mb-2 text-lg font-black tracking-[3px] text-text-white">CONTEST</h1>
      <p className="mb-1 text-center text-xs text-text-label">
        Daily competition — one attempt, one paragraph.
      </p>
      <p className="mb-8 text-[10px] text-text-muted">
        Expert difficulty • Numbers, symbols, mixed case
      </p>

      <Button variant="primary" size="lg" className="mb-3" onClick={() => {}}>
        ENTER CONTEST
      </Button>

      <Button variant="ghost" size="sm" onClick={() => router.push("/home")}>
        Back to home
      </Button>
    </div>
  );
}
