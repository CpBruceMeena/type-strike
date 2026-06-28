"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Particles from "@/components/react-bits/Particles";
import { IconArrowLeft, IconCheck, IconHandFinger, IconKeyboard } from "@tabler/icons-react";

// ── Steps ────────────────────────────────────────────────

interface FingerMapping {
  finger: string;
  fingerColor: string;
  homeKey: string;
  reachKeys: string[];
}

const LEFT_HAND: FingerMapping[] = [
  { finger: "Left Pinky", fingerColor: "#FF6666", homeKey: "A", reachKeys: ["Q", "A", "Z", "1", "`"] },
  { finger: "Left Ring", fingerColor: "#FFAA44", homeKey: "S", reachKeys: ["W", "S", "X", "2"] },
  { finger: "Left Middle", fingerColor: "#FFDD44", homeKey: "D", reachKeys: ["E", "D", "C", "3"] },
  { finger: "Left Index", fingerColor: "#44DD44", homeKey: "F", reachKeys: ["R", "F", "V", "4", "T", "G", "B", "5"] },
];

const RIGHT_HAND: FingerMapping[] = [
  { finger: "Right Index", fingerColor: "#44DDAA", homeKey: "J", reachKeys: ["Y", "H", "N", "6", "U", "J", "M", "7"] },
  { finger: "Right Middle", fingerColor: "#4488FF", homeKey: "K", reachKeys: ["I", "K", ",", "8"] },
  { finger: "Right Ring", fingerColor: "#8844FF", homeKey: "L", reachKeys: ["O", "L", ".", "9"] },
  { finger: "Right Pinky", fingerColor: "#CC44FF", homeKey: ";", reachKeys: ["P", ";", "/", "0", "-", "="] },
];

const STEPS = [
  {
    title: "Left Hand Territory",
    description: "Each finger controls a specific set of keys. Your left pinky handles A and Q, ring handles S and W, middle handles D and E, and index handles F, R, T, G, V, B, plus 4 and 5.",
    tip: "The index finger is your most versatile digit — it handles 8 keys! Practice reaching up and down without moving your other fingers.",
    icon: "👈",
    illustration: (
      <div className="grid grid-cols-2 gap-2 max-w-xs mx-auto">
        {LEFT_HAND.map((f, i) => (
          <motion.div
            key={f.finger}
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: i * 0.12 }}
            className="rounded-[14px] border border-neutral-800/60 bg-neutral-900/40 p-3"
            style={{ borderLeft: `3px solid ${f.fingerColor}` }}
          >
            <p className="text-[11px] font-bold text-neutral-100">{f.finger}</p>
            <div className="flex gap-1 mt-1 flex-wrap">
              {f.reachKeys.slice(0, 3).map((k) => (
                <span key={k} className="text-[9px] px-1.5 py-0.5 rounded bg-neutral-800/60 text-neutral-400 font-mono">{k}</span>
              ))}
              <span className="text-[9px] text-neutral-600">...</span>
            </div>
          </motion.div>
        ))}
      </div>
    ),
  },
  {
    title: "Right Hand Territory",
    description: "Your right pinky handles P and ;, ring handles O and L, middle handles I and K, and index handles the most keys: Y, H, N, U, J, M, 6, and 7.",
    tip: "The right pinky has the biggest stretch — reaching from ; up to P and 0. Take extra time to build strength in this finger.",
    icon: "👉",
    illustration: (
      <div className="grid grid-cols-2 gap-2 max-w-xs mx-auto">
        {RIGHT_HAND.map((f, i) => (
          <motion.div
            key={f.finger}
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: i * 0.12 }}
            className="rounded-[14px] border border-neutral-800/60 bg-neutral-900/40 p-3"
            style={{ borderRight: `3px solid ${f.fingerColor}` }}
          >
            <p className="text-[11px] font-bold text-neutral-100">{f.finger}</p>
            <div className="flex gap-1 mt-1 flex-wrap">
              {f.reachKeys.slice(0, 3).map((k) => (
                <span key={k} className="text-[9px] px-1.5 py-0.5 rounded bg-neutral-800/60 text-neutral-400 font-mono">{k}</span>
              ))}
              <span className="text-[9px] text-neutral-600">...</span>
            </div>
          </motion.div>
        ))}
      </div>
    ),
  },
  {
    title: "The Home Row Anchor",
    description: "Your fingers should ALWAYS return to the home row: A S D F J K L ;. From there, each finger reaches up or down to hit its assigned keys, then returns home.",
    tip: "Think of the home row as your base camp. Every keystroke is a round trip: home → target key → home.",
    icon: "🎯",
    illustration: (
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="flex flex-wrap justify-center gap-2"
      >
        {[
          { key: "A", color: "#FF6666", hand: "L" },
          { key: "S", color: "#FFAA44", hand: "L" },
          { key: "D", color: "#FFDD44", hand: "L" },
          { key: "F", color: "#44DD44", hand: "L" },
          { key: "J", color: "#44DDAA", hand: "R" },
          { key: "K", color: "#4488FF", hand: "R" },
          { key: "L", color: "#8844FF", hand: "R" },
          { key: ";", color: "#CC44FF", hand: "R" },
        ].map((k) => (
          <motion.div
            key={k.key}
            whileHover={{ scale: 1.1 }}
            className="flex h-12 w-12 items-center justify-center rounded-xl font-black text-sm border-2"
            style={{
              borderColor: `${k.color}40`,
              background: `${k.color}15`,
              color: k.color,
            }}
          >
            {k.key}
          </motion.div>
        ))}
      </motion.div>
    ),
  },
  {
    title: "Reach Without Stretching",
    description: "Move your whole hand slightly when reaching for far keys. Don't stretch just one finger — shift your hand position to keep all fingers in a natural curve above the keys.",
    tip: "Your fingers should always be curved, never fully straight. Curved fingers are faster and more accurate.",
    icon: "🤲",
    illustration: (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 gap-3 max-w-sm mx-auto"
      >
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-center">
          <span className="text-2xl">❌</span>
          <p className="text-[10px] text-red-400 mt-1 font-bold">Stretching</p>
          <p className="text-[9px] text-neutral-500">Causes strain and slows you down</p>
        </div>
        <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-3 text-center">
          <span className="text-2xl">✅</span>
          <p className="text-[10px] text-green-400 mt-1 font-bold">Shifting</p>
          <p className="text-[9px] text-neutral-500">Move whole hand, keep curve</p>
        </div>
      </motion.div>
    ),
  },
  {
    title: "Practice Makes Permanent",
    description: "It takes about 2-4 weeks of daily practice to build muscle memory for proper finger placement. Don't rush — quality over speed. Your fingers will learn where each key is located.",
    tip: "When you make a mistake, it's usually because your finger reached with the wrong digit. Slow down and use the correct finger.",
    icon: "💪",
    illustration: (
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 10 }}
        className="text-center"
      >
        <span className="text-5xl">⌨️</span>
        <p className="mt-2 text-sm text-green-400 font-bold tracking-[2px]">CORRECT FINGER, EVERY KEY</p>
      </motion.div>
    ),
  },
];

// ── Page ─────────────────────────────────────────────────

export default function FingerPlacementPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const step = STEPS[currentStep];

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) setCurrentStep((s) => s + 1);
    else router.push("/learn");
  };

  return (
    <>
      <Particles particleColors={["#4488FF", "#ffffff"]} particleCount={30} speed={0.03} />
      <div className="relative z-[1] flex flex-1 flex-col min-w-0">
        <header className="flex items-center gap-3 px-4 py-3">
          <button onClick={() => router.back()} className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-400 hover:text-neutral-100 transition-colors">
            <IconArrowLeft size={18} />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold tracking-[2px] text-neutral-500 uppercase">Finger Placement</span>
            <div className="flex gap-1">
              {STEPS.map((_, i) => (
                <div key={i} className={`h-1 w-5 rounded-full transition-all ${i <= currentStep ? "bg-blue-500" : "bg-neutral-800"}`} />
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
                  <div className="text-center">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.1, type: "spring" }}
                      className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-[18px] border border-blue-500/20 bg-blue-500/10 text-3xl"
                    >{step.icon}</motion.div>
                    <h2 className="text-lg font-black tracking-[-0.02em] text-neutral-100">{step.title}</h2>
                  </div>

                  <div className="py-3">{step.illustration}</div>

                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
                    className="text-sm text-neutral-400 leading-relaxed text-center"
                  >{step.description}</motion.p>

                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                    className="rounded-[14px] border border-blue-500/10 bg-blue-500/5 p-3"
                  >
                    <p className="flex items-start gap-2 text-xs text-blue-400">
                      <IconHandFinger size={16} className="mt-0.5 shrink-0" />
                      <span>{step.tip}</span>
                    </p>
                  </motion.div>

                  <motion.button
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                    onClick={handleNext}
                    className="w-full flex items-center justify-center gap-2 rounded-[14px] bg-gradient-to-r from-blue-500 to-indigo-600 px-5 py-3.5 text-sm font-bold text-neutral-950 tracking-[1px] shadow-[0_0_20px_rgba(68,136,255,0.12)] transition-all hover:brightness-110 active:scale-[0.98]"
                  >
                    {currentStep < STEPS.length - 1 ? <>Next Step <IconCheck size={16} /></> : <>Start Lessons <IconKeyboard size={16} /></>}
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
