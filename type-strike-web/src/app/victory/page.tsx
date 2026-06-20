import { Suspense } from "react";
import type { Metadata } from "next";
import ParticleField from "@/components/effects/ParticleField";
import VictoryContent from "./victory-content";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://typestrike.app";

interface Props {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = await searchParams;
  const wpm = params.wpm ?? "0";
  const accuracy = params.accuracy ?? "0";
  const stars = params.stars ?? "0";
  const mode = (params.mode as string) ?? "";

  const ogUrl = `${BASE_URL}/api/og?victory=true&wpm=${wpm}&accuracy=${accuracy}&stars=${stars}&mode=${encodeURIComponent(mode)}`;

  return {
    title: `Victory — ${wpm} WPM | Type Strike`,
    openGraph: {
      title: `Victory — ${wpm} WPM on Type Strike`,
      description: `I scored ${wpm} WPM with ${(parseFloat(accuracy as string) * 100).toFixed(0)}% accuracy on Type Strike!`,
      images: [{ url: ogUrl, width: 1200, height: 630, type: "image/png" }],
    },
    twitter: {
      card: "summary_large_image",
      title: `Victory — ${wpm} WPM on Type Strike`,
      description: `I scored ${wpm} WPM with ${(parseFloat(accuracy as string) * 100).toFixed(0)}% accuracy on Type Strike!`,
      images: [ogUrl],
    },
  };
}

export default function VictoryPage() {
  return (
    <>
      <ParticleField />
      <Suspense fallback={
        <div className="flex min-h-dvh items-center justify-center">
          <p style={{ color: "var(--text-muted)" }}>Loading results…</p>
        </div>
      }>
        <VictoryContent />
      </Suspense>
    </>
  );
}
