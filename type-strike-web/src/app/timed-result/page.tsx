import { Suspense } from "react";
import type { Metadata } from "next";
import ParticleField from "@/components/effects/ParticleField";
import TimedResultContent from "./timed-result-content";

export const metadata: Metadata = {
  title: "Timed Result | Type Strike",
};

export default function TimedResultPage() {
  return (
    <>
      <ParticleField />
      <Suspense fallback={
        <div className="flex min-h-dvh items-center justify-center">
          <p style={{ color: "var(--text-muted)" }}>Loading results…</p>
        </div>
      }>
        <TimedResultContent />
      </Suspense>
    </>
  );
}
