import { Suspense } from "react";
import type { Metadata } from "next";
import ParticleField from "@/components/effects/ParticleField";
import FailedContent from "./failed-content";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://typestrike.app";

interface Props {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = await searchParams;
  const wpm = params.wpm ?? "—";
  const accuracy = params.accuracy ?? "0";
  const mode = (params.mode as string) ?? "";

  const ogUrl = `${BASE_URL}/api/og?wpm=${wpm}&accuracy=${accuracy}&mode=${encodeURIComponent(mode)}`;

  return {
    title: `Failed — ${wpm} WPM | Type Strike`,
    openGraph: {
      title: `Failed — ${wpm} WPM on Type Strike`,
      description: `I scored ${wpm} WPM on Type Strike. Can you do better?`,
      images: [{ url: ogUrl, width: 1200, height: 630, type: "image/png" }],
    },
    twitter: {
      card: "summary_large_image",
      title: `Failed — ${wpm} WPM on Type Strike`,
      description: `I scored ${wpm} WPM on Type Strike. Can you do better?`,
      images: [ogUrl],
    },
  };
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
