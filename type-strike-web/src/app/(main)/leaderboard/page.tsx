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
      <div className="flex gap-2 px-4 py-3 md:px-6">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`rounded-lg px-5 py-2 text-xs font-bold tracking-[2px] transition-all ${
              activeTab === tab.key
                ? "text-text-white shadow-sm"
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
      <div className="flex-1 px-4 pb-4 md:px-6 md:pb-6">
        <div className="mx-auto w-full max-w-3xl space-y-1.5">
          {Array.from({ length: 5 }, (_, i) => (
            <Card key={i} className="flex items-center gap-4 py-3">
              <span className="w-6 text-center text-sm font-bold text-text-muted">#{i + 1}</span>
              <div className="h-10 w-10 rounded-full bg-bg-surface-dark flex items-center justify-center">
                <span className="text-xs font-bold text-text-label">—</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-text-white">Player {i + 1}</p>
                <p className="text-[10px] text-text-muted">Level 1</p>
              </div>
              <span className="text-sm font-bold text-accent-gold">— WPM</span>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
