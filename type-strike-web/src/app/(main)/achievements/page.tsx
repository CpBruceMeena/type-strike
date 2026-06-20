"use client";

import TopBar from "@/components/layout/TopBar";
import Card from "@/components/ui/Card";

export default function AchievementsPage() {
  return (
    <div className="flex flex-1 flex-col">
      <TopBar showBack title="FEATS" />

      <div className="flex-1 px-4 py-3">
        <div className="grid grid-cols-2 gap-2">
          {Array.from({ length: 6 }, (_, i) => (
            <Card key={i} className="text-center opacity-40">
              <span className="text-2xl">🔒</span>
              <p className="mt-1 text-[9px] font-semibold text-text-muted">LOCKED</p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
