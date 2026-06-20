"use client";

import TopBar from "@/components/layout/TopBar";
import Card from "@/components/ui/Card";

export default function AchievementsPage() {
  return (
    <div className="flex flex-1 flex-col">
      <TopBar showBack title="FEATS" />

      <div className="flex-1 px-4 py-4 md:px-6 md:py-6">
        <div className="mx-auto w-full max-w-3xl">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 18 }, (_, i) => (
              <Card key={i} className="text-center p-4 opacity-30 hover:opacity-40 transition-opacity">
                <span className="text-3xl">🔒</span>
                <p className="mt-2 text-[10px] font-semibold text-text-muted">LOCKED</p>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
