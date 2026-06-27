"use client";

import { useCallback, useEffect, useState } from "react";
import type { AchievementUnlockEvent } from "@/lib/types";

// ── Tier Colors (same as feats page) ───────────────────

const CATEGORY_COLORS: Record<string, string> = {
  speed: "#FF5020",
  accuracy: "#00E5FF",
  combo: "#FFCC00",
  progression: "#22DD44",
  streak: "#8844FF",
  social: "#FF44CC",
};

const CATEGORY_LABELS: Record<string, string> = {
  speed: "SPEED",
  accuracy: "ACCURACY",
  combo: "COMBO",
  progression: "PROGRESSION",
  streak: "STREAK",
  social: "SOCIAL",
};

// ── Toast Manager ──────────────────────────────────────

interface Toast {
  id: string;
  event: AchievementUnlockEvent;
  createdAt: number;
}

let toastListeners: Array<(toast: Toast) => void> = [];
let toastIdCounter = 0;

export function showAchievementToast(event: AchievementUnlockEvent) {
  const toast: Toast = {
    id: `ach-${++toastIdCounter}`,
    event,
    createdAt: Date.now(),
  };
  toastListeners.forEach((listener) => listener(toast));
}

// ── Toast Component ────────────────────────────────────

export default function AchievementToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const listener = (toast: Toast) => {
      setToasts((prev) => [...prev, toast]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toast.id));
      }, 5000);
    };
    toastListeners.push(listener);
    return () => {
      toastListeners = toastListeners.filter((l) => l !== listener);
    };
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
      {toasts.map((toast) => (
        <AchievementToastCard key={toast.id} toast={toast} onDismiss={dismissToast} />
      ))}
    </div>
  );
}

// ── Individual Toast Card ──────────────────────────────

function AchievementToastCard({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const [visible, setVisible] = useState(false);
  const color = CATEGORY_COLORS[toast.event.category] || "#CC44FF";
  const label = CATEGORY_LABELS[toast.event.category] || "ACHIEVEMENT";

  useEffect(() => {
    const frame = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div
      className="pointer-events-auto flex items-center gap-4 rounded-2xl border px-5 py-4 shadow-2xl backdrop-blur-xl transition-all duration-500"
      style={{
        background: "linear-gradient(135deg, #1A0A28 0%, #0A0A14 100%)",
        borderColor: `${color}30`,
        boxShadow: `0 0 30px ${color}20, 0 4px 20px rgba(0,0,0,0.4)`,
        transform: visible ? "translateX(0) scale(1)" : "translateX(120%) scale(0.8)",
        opacity: visible ? 1 : 0,
        minWidth: "280px",
        maxWidth: "380px",
      }}
    >
      <div
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-2xl"
        style={{
          background: `${color}18`,
          boxShadow: `0 0 15px ${color}30`,
        }}
      >
        {toast.event.icon}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-[9px] font-bold tracking-[2px]" style={{ color: `${color}aa` }}>
          {label} UNLOCKED
        </p>
        <p className="mt-0.5 text-sm font-bold text-white truncate">
          {toast.event.achievement_name}
        </p>
        <p className="mt-0.5 text-[10px] leading-tight truncate" style={{ color: "var(--text-muted)" }}>
          {toast.event.description}
        </p>
      </div>

      <button
        onClick={() => onDismiss(toast.id)}
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[10px] transition-colors hover:bg-white/5"
        style={{ color: "var(--text-muted)" }}
      >
        ✕
      </button>
    </div>
  );
}
