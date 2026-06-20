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

      <div className="flex-1 overflow-y-auto px-4 py-2">
        <div className="space-y-3">
          {TIERS.filter((t) => t.key !== "beyond").map((tier) => (
            <div key={tier.key}>
              <div className="mb-2 flex items-center gap-2">
                <div className="h-3 w-1 rounded-full" style={{ backgroundColor: tier.color }} />
                <span className="text-[10px] font-bold tracking-[2px]" style={{ color: tier.color }}>
                  {tier.label}
                </span>
                <span className="text-[9px] text-text-muted">
                  ({tier.startLevel}-{tier.endLevel})
                </span>
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {Array.from({ length: 5 }, (_, i) => (
                  <Card
                    key={i}
                    hoverable
                    onClick={() => router.push(`/play/level?id=${tier.startLevel + i}`)}
                    className="flex flex-col items-center py-2"
                  >
                    <span className="text-[9px] text-text-muted">L{tier.startLevel + i}</span>
                    <span className="text-[10px] font-bold text-text-white">★</span>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
