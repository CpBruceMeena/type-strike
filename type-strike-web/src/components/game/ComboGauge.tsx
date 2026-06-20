"use client";

import { COMBO_TIERS } from "@/lib/constants";

interface ComboGaugeProps {
  combo: number;
  maxCombo: number;
  gaugeProgress: number;
  activeTierIndex: number;
}

export default function ComboGauge({
  combo,
  maxCombo,
  gaugeProgress,
  activeTierIndex,
}: ComboGaugeProps) {
  const tier = COMBO_TIERS[activeTierIndex] ?? COMBO_TIERS[0];
  const gaugeColor = tier.color;
  const fillPct = Math.min(gaugeProgress * 100, 100);

  return (
    <div className="flex items-center gap-3">
      {/* Vertical gauge bar */}
      <div
        className="relative h-10 w-2 overflow-hidden rounded-full"
        style={{ background: "rgba(255,255,255,0.08)" }}
      >
        <div
          className="absolute bottom-0 w-full rounded-full transition-all duration-200 ease-out"
          style={{
            height: `${fillPct}%`,
            background: `linear-gradient(to top, var(--accent-primary), ${gaugeColor})`,
            boxShadow: fillPct > 50 ? `0 0 8px ${gaugeColor}40` : "none",
          }}
        />
      </div>

      {/* Combo counter */}
      <div className="min-w-[60px]">
        {combo > 0 && (
          <p
            className="text-lg font-black tabular-nums transition-colors duration-200"
            style={{ color: gaugeColor }}
          >
            ×{combo}
          </p>
        )}
        {maxCombo > 0 && (
          <p className="text-[9px] font-medium tracking-[1px]" style={{ color: "var(--text-muted)" }}>
            best {maxCombo}
          </p>
        )}
        {combo === 0 && maxCombo === 0 && (
          <p className="text-[9px] font-medium tracking-[1px]" style={{ color: "var(--text-muted)" }}>
            combo
          </p>
        )}
      </div>
    </div>
  );
}
