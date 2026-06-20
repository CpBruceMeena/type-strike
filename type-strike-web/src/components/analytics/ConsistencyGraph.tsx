"use client";

import { useEffect, useRef } from "react";

interface DataPoint {
  wpm: number;
  raw: number;
  net: number;
  accuracy: number;
}

interface ConsistencyGraphProps {
  data: DataPoint[];
  maxPoints?: number;
  className?: string;
}

export default function ConsistencyGraph({
  data,
  maxPoints = 200,
  className = "",
}: ConsistencyGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || data.length === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    const padding = { top: 8, bottom: 16, left: 0, right: 0 };
    const plotW = w - padding.left - padding.right;
    const plotH = h - padding.top - padding.bottom;

    // Truncate to maxPoints rolling window
    const points = data.slice(-maxPoints);
    const len = points.length;
    if (len < 2) return;

    // Find bounds
    const maxWpm = Math.max(...points.map((p) => p.wpm), 1);

    ctx.clearRect(0, 0, w, h);

    // Draw grid lines
    ctx.strokeStyle = "rgba(255, 255, 255, 0.04)";
    ctx.lineWidth = 1;
    for (let i = 0; i < 4; i++) {
      const y = padding.top + (plotH / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(w - padding.right, y);
      ctx.stroke();
    }

    // Draw average line
    const avgWpm = points.reduce((s, p) => s + p.wpm, 0) / len;
    const avgY =
      padding.top +
      plotH -
      (avgWpm / (maxWpm * 1.15)) * plotH;
    ctx.strokeStyle = "rgba(255, 204, 0, 0.2)";
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(padding.left, avgY);
    ctx.lineTo(w - padding.right, avgY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw peak line
    const peakWpm = Math.max(...points.map((p) => p.wpm));
    const peakY =
      padding.top +
      plotH -
      (peakWpm / (maxWpm * 1.15)) * plotH;
    ctx.strokeStyle = "rgba(0, 240, 255, 0.2)";
    ctx.beginPath();
    ctx.moveTo(padding.left, peakY);
    ctx.lineTo(w - padding.right, peakY);
    ctx.stroke();

    // Build path for filled area
    const stepX = plotW / (len - 1);
    const gradient = ctx.createLinearGradient(0, padding.top, 0, h - padding.bottom);
    gradient.addColorStop(0, "rgba(255, 80, 32, 0.25)");
    gradient.addColorStop(0.5, "rgba(255, 80, 32, 0.08)");
    gradient.addColorStop(1, "rgba(255, 80, 32, 0)");

    // Fill area
    ctx.beginPath();
    ctx.moveTo(padding.left, h - padding.bottom);
    points.forEach((p, i) => {
      const x = padding.left + i * stepX;
      const y = padding.top + plotH - (p.wpm / (maxWpm * 1.15)) * plotH;
      ctx.lineTo(x, y);
    });
    ctx.lineTo(padding.left + (len - 1) * stepX, h - padding.bottom);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // Draw WPM line
    ctx.beginPath();
    ctx.strokeStyle = "#FF5020";
    ctx.lineWidth = 2;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    points.forEach((p, i) => {
      const x = padding.left + i * stepX;
      const y = padding.top + plotH - (p.wpm / (maxWpm * 1.15)) * plotH;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Draw live dot
    const last = points[len - 1];
    const lastX = padding.left + (len - 1) * stepX;
    const lastY = padding.top + plotH - (last.wpm / (maxWpm * 1.15)) * plotH;

    ctx.beginPath();
    ctx.arc(lastX, lastY, 4, 0, Math.PI * 2);
    ctx.fillStyle = "#FF5020";
    ctx.fill();

    ctx.beginPath();
    ctx.arc(lastX, lastY, 7, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255, 80, 32, 0.3)";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Labels
    ctx.fillStyle = "rgba(136, 136, 136, 0.6)";
    ctx.font = "9px system-ui";
    ctx.textAlign = "left";
    ctx.fillText(`${Math.round(peakWpm)} peak`, w - 40, peakY - 4);
    ctx.fillText(`${Math.round(avgWpm)} avg`, w - 40, avgY - 4);
  }, [data, maxPoints]);

  return (
    <canvas
      ref={canvasRef}
      className={`w-full h-full ${className}`}
    />
  );
}
