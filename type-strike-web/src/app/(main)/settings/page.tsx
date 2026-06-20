"use client";

import TopBar from "@/components/layout/TopBar";
import Card from "@/components/ui/Card";

export default function SettingsPage() {
  return (
    <div className="flex flex-1 flex-col">
      <TopBar showBack title="SETTINGS" />

      <div className="flex-1 space-y-3 px-4 py-3">
        <Card>
          <p className="text-[9px] font-semibold tracking-[1.5px] text-text-muted">KEYBOARD</p>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-text-body">Layout</span>
            <span className="text-[11px] font-bold text-accent-primary">CUSTOM</span>
          </div>
        </Card>

        <Card>
          <p className="text-[9px] font-semibold tracking-[1.5px] text-text-muted">SOUND</p>
          <div className="mt-2 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-body">Sound Volume</span>
              <span className="text-xs text-text-body">80%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-body">Music Volume</span>
              <span className="text-xs text-text-body">50%</span>
            </div>
          </div>
        </Card>

        <Card>
          <p className="text-[9px] font-semibold tracking-[1.5px] text-text-muted">PLAYER</p>
          <div className="mt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-body">Player ID</span>
              <span className="text-[11px] font-mono text-text-muted">1</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
