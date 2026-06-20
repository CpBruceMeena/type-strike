"use client";

import { useRouter } from "next/navigation";
import TopBar from "@/components/layout/TopBar";
import Card from "@/components/ui/Card";
import { TIERS } from "@/lib/constants";

export default function MapPage() {
  const router = useRouter();

  return (
    <div className="flex flex-1 flex-col">
      <TopBar showBack title="LEVELS" />

      <div className="flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-6">
        <div className="mx-auto w-full max-w-4xl space-y-6">
          {TIERS.filter((t) => t.key !== "beyond").map((tier) => (
            <div key={tier.key}>
              <div className="mb-3 flex items-center gap-3">
                <div className="h-4 w-1 rounded-full" style={{ backgroundColor: tier.color }} />
                <span className="text-sm font-bold tracking-[3px]" style={{ color: tier.color }}>
                  {tier.label}
                </span>
                <span className="text-xs text-text-muted">
                  ({tier.startLevel}-{tier.endLevel})
                </span>
              </div>
              <div className="grid grid-cols-5 gap-2 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12">
                {Array.from({ length: 25 }, (_, i) => {
                  const levelId = tier.startLevel + i;
                  if (levelId > tier.endLevel) return null;
                  return (
                    <Card
                      key={levelId}
                      hoverable
                      onClick={() => router.push(`/play/level?id=${levelId}`)}
                      className="flex flex-col items-center py-3"
                    >
                      <span className="text-[9px] text-text-muted">L{levelId}</span>
                      <span className="text-xs font-bold text-text-white">★</span>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
