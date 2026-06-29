"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Particles from "@/components/react-bits/Particles";
import { IconArrowLeft, IconCheck, IconHandFinger, IconKeyboard } from "@tabler/icons-react";

// ── Steps ────────────────────────────────────────────────

const STEPS = [
  {
    title: "Find the Home Row",
    description: "Place your fingers on the home row keys: A, S, D, F (left hand) and J, K, L, ; (right hand). Your index fingers should rest on F and J — they have small bumps to help you find them without looking.",
    tip: "The bumps on F and J are your anchor points. Always return to these keys.",
    icon: "⌨️",
    illustration: (
      <div className="flex justify-center gap-1.5">
        {["A", "S", "D", "F", "J", "K", "L", ";"].map((key, i) => (
          <motion.div
            key={key}
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: i * 0.1, type: "spring", stiffness: 200 }}
            className={`flex h-12 w-12 items-center justify-center rounded-xl text-sm font-black border-2 ${
              [3, 4].includes(i)
                ? "border-orange-500/50 bg-orange-500/15 text-orange-400 shadow-[0_0_12px_rgba(249,115,22,0.15)]"
                : "border-neutral-700/60 bg-neutral-800/40 text-neutral-300"
            }`}
          >
            {key}
            {[3, 4].includes(i) && (
              <motion.div
                className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-orange-500"
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              />
            )}
          </motion.div>
        ))}
      </div>
    ),
  },
  {
    title: "Left Hand Position",
    description: "Your left hand fingers rest on A, S, D, F. The pinky handles A, ring finger handles S, middle finger handles D, and index finger handles F, R, T, G, V, B.",
    tip: "Each finger has its own territory. Practice moving each finger up and down without lifting the others.",
    icon: "👈",
    illustration: (
      <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto">
        {[
          { finger: "Pinky", key: "A", color: "#FF6666" },
          { finger: "Ring", key: "S", color: "#FFAA44" },
          { finger: "Middle", key: "D", color: "#FFDD44" },
          { finger: "Index", key: "F", color: "#44DD44" },
        ].map((f, i) => (
          <motion.div
            key={f.finger}
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: i * 0.15 }}
            className="flex items-center gap-3 rounded-[14px] border border-neutral-800/60 bg-neutral-900/40 p-3"
          >
            <div
              className="flex h-9 w-9 items-center justify-center rounded-[10px] font-black text-sm"
              style={{ background: `${f.color}20`, color: f.color, border: `1px solid ${f.color}40` }}
            >
              {f.key}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-neutral-100">{f.finger}</p>
              <p className="text-[9px] text-neutral-500">Key: {f.key}</p>
            </div>
          </motion.div>
        ))}
      </div>
    ),
  },
  {
    title: "Right Hand Position",
    description: "Your right hand fingers rest on J, K, L, ;. Index handles J, Y, U, H, N, M; middle handles I and K; ring handles O and L; pinky handles P, ;, /.",
    tip: "Keep your wrists straight, not bent up or down. Your forearms should be parallel to the floor.",
    icon: "👉",
    illustration: (
      <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto">
        {[
          { finger: "Index", key: "J", color: "#44DDAA" },
          { finger: "Middle", key: "K", color: "#4488FF" },
          { finger: "Ring", key: "L", color: "#8844FF" },
          { finger: "Pinky", key: ";", color: "#CC44FF" },
        ].map((f, i) => (
          <motion.div
            key={f.finger}
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: i * 0.15 }}
            className="flex items-center gap-3 rounded-[14px] border border-neutral-800/60 bg-neutral-900/40 p-3"
          >
            <div
              className="flex h-9 w-9 items-center justify-center rounded-[10px] font-black text-sm"
              style={{ background: `${f.color}20`, color: f.color, border: `1px solid ${f.color}40` }}
            >
              {f.key}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-neutral-100">{f.finger}</p>
              <p className="text-[9px] text-neutral-500">Key: {f.key}</p>
            </div>
          </motion.div>
        ))}
      </div>
    ),
  },
  {
    title: "Posture Matters",
    description: "Sit up straight with feet flat on the floor. Elbows at 90 degrees, wrists floating above the keyboard. Your screen should be at eye level, about an arm's length away.",
    tip: "Good posture prevents fatigue and injury. Take a 5-minute break every 25 minutes of typing.",
    icon: "🧘",
    illustration: (
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="flex items-center justify-center gap-6 p-4"
      >
        <div className="flex flex-col items-center gap-2">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border border-neutral-700/60 bg-neutral-800/40 text-2xl">🖥️</div>
          <p className="text-[10px] text-neutral-500">Eye level</p>
        </div>
        <div className="text-neutral-600 text-lg">→</div>
        <div className="flex flex-col items-center gap-2">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border border-orange-500/20 bg-orange-500/10 text-2xl">⌨️</div>
          <p className="text-[10px] text-orange-400 font-bold">90° elbows</p>
        </div>
        <div className="text-neutral-600 text-lg">→</div>
        <div className="flex flex-col items-center gap-2">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border border-neutral-700/60 bg-neutral-800/40 text-2xl">🪑</div>
          <p className="text-[10px] text-neutral-500">Feet flat</p>
        </div>
      </motion.div>
    ),
  },
  {
    title: "Ready to Type!",
    description: "Remember: never look at your keyboard. Trust your muscle memory. Start slow, focus on accuracy, and speed will follow naturally. Take the lessons in order to build skills progressively.",
    tip: "The average typing speed is 40 WPM. With practice, you can reach 60-80 WPM in a few weeks!",
    icon: "🎯",
    illustration: (
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 10 }}
        className="text-center"
      >
        <span className="text-5xl">🔥</span>
        <p className="mt-2 text-sm text-orange-400 font-bold tracking-[2px]">LET&apos;S TYPE!</p>
      </motion.div>
    ),
  },
];

// ── Page ─────────────────────────────────────────────────

export default function HandPositioningPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const step = STEPS[currentStep];

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      router.push("/learn");
    }
  };

  return (
    <>
      <Particles particleColors={["#22DD44", "#ffffff"]} particleCount={30} speed={0.03} />

      <div className="relative z-[1] flex flex-1 flex-col min-w-0">
        {/* Header */}
        <header className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={() => router.back()}
            className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-400 hover:text-neutral-100 transition-colors"
          >
            <IconArrowLeft size={18} />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold tracking-[2px] text-neutral-500 uppercase">
              Hand Positioning
            </span>
            <div className="flex gap-1">
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`h-1 w-5 rounded-full transition-all ${
                    i <= currentStep ? "bg-green-500" : "bg-neutral-800"
                  }`}
                />
              ))}
            </div>
          </div>
        </header>

        <div className="flex-1 flex items-center justify-center px-4 pb-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-lg mx-auto"
            >
              <div className="rounded-[22px] border border-neutral-800/80 bg-neutral-900/30 backdrop-blur-md overflow-hidden">
                <div className="p-5 md:p-6 space-y-5">
                  {/* Step icon + title */}
                  <div className="text-center">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.1, type: "spring" }}
                      className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-[18px] border border-green-500/20 bg-green-500/10 text-3xl"
                    >
                      {step.icon}
                    </motion.div>
                    <h2 className="text-lg font-black tracking-[-0.02em] text-neutral-100">
                      {step.title}
                    </h2>
                  </div>

                  {/* Illustration */}
                  <div className="py-3">{step.illustration}</div>

                  {/* Description */}
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-sm text-neutral-400 leading-relaxed text-center"
                  >
                    {step.description}
                  </motion.p>

                  {/* Tip */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="rounded-[14px] border border-green-500/10 bg-green-500/5 p-3"
                  >
                    <p className="flex items-start gap-2 text-xs text-green-400">
                      <IconHandFinger size={16} className="mt-0.5 shrink-0" />
                      <span>{step.tip}</span>
                    </p>
                  </motion.div>

                  {/* Next button */}
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    onClick={handleNext}
                    className="w-full flex items-center justify-center gap-2 rounded-[14px] bg-gradient-to-r from-green-500 to-emerald-600 px-5 py-3.5 text-sm font-bold text-neutral-950 tracking-[1px] shadow-[0_0_20px_rgba(34,221,68,0.12)] transition-all hover:brightness-110 active:scale-[0.98]"
                  >
                    {currentStep < STEPS.length - 1 ? (
                      <>
                        Next Step
                        <IconCheck size={16} />
                      </>
                    ) : (
                      <>
                        Start Lessons
                        <IconKeyboard size={16} />
                      </>
                    )}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}
