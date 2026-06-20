"use client";

import { useState } from "react";
import TopBar from "@/components/layout/TopBar";
import Card from "@/components/ui/Card";

const TABS = [
  { key: "global", label: "GLOBAL", accent: "#FF5020" },
  { key: "daily", label: "DAILY", accent: "#FFCC00" },
  { key: "contest", label: "CONTEST", accent: "#CC44FF" },
];

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState("global");

  return (
    <div className="flex flex-1 flex-col">
      <TopBar showBack title="LEADERBOARD" />

      {/* Tabs */}
      <div className="flex gap-1 px-4 py-2">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`rounded-lg px-4 py-1.5 text-[10px] font-bold tracking-[2px] transition-colors ${
              activeTab === tab.key
                ? "text-text-white"
                : "text-text-muted hover:text-text-label"
            }`}
            style={
              activeTab === tab.key
                ? { backgroundColor: `${tab.accent}1a`, color: tab.accent }
                : {}
            }
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="flex-1 space-y-1 px-4 pb-3">
        {Array.from({ length: 5 }, (_, i) => (
          <Card key={i} className="flex items-center gap-3 py-2">
            <span className="w-5 text-center text-xs font-bold text-text-muted">#{i + 1}</span>
            <div className="h-8 w-8 rounded-full bg-bg-surface-dark flex items-center justify-center">
              <span className="text-[10px] font-bold text-text-label">—</span>
            </div>
            <div className="flex-1">
              <p className="text-[11px] font-bold text-text-white">Player {i + 1}</p>
              <p className="text-[9px] text-text-muted">Level 1</p>
            </div>
            <span className="text-xs font-bold text-accent-gold">— WPM</span>
          </Card>
        ))}
      </div>
    </div>
  );
}
