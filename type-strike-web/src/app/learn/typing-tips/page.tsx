"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Particles from "@/components/react-bits/Particles";
import { IconArrowLeft, IconCheck, IconBulb, IconKeyboard } from "@tabler/icons-react";

// ── Steps ────────────────────────────────────────────────

interface Step {
  title: string;
  description: string;
  tip: string;
  icon: string;
  illustration: React.ReactNode;
}

const STEPS: Step[] = [
  {
    title: "Look at the Screen, Not the Keys",
    description: "This is the single most important tip for becoming a fast typist. Keep your eyes on the text you're copying or typing, not on your fingers. Your muscle memory will learn where the keys are without looking.",
    tip: "Cover your hands with a light cloth if you can't resist looking. The discomfort will train you faster.",
    icon: "👀",
    illustration: (
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="flex items-center justify-center gap-6 p-4"
      >
        <div className="flex flex-col items-center gap-2">
          <div className="flex h-16 w-16 items-center justify-center rounded-[18px] border border-orange-500/20 bg-orange-500/10 text-2xl">
            🖥️
          </div>
          <p className="text-[11px] font-bold text-green-400">Watch Here</p>
          <p className="text-[9px] text-neutral-500">The source text</p>
        </div>
        <div className="text-neutral-600 text-lg">✓</div>
        <div className="flex flex-col items-center gap-2 opacity-40">
          <div className="flex h-16 w-16 items-center justify-center rounded-[18px] border border-neutral-800/60 bg-neutral-900/40 text-2xl">
            ⌨️
          </div>
          <p className="text-[11px] font-bold text-red-400">Don&apos;t Look</p>
          <p className="text-[9px] text-neutral-500">Trust your fingers</p>
        </div>
      </motion.div>
    ),
  },
  {
    title: "Quality Over Speed",
    description: "Speed is a byproduct of accurate typing, not the goal itself. Aim for 95%+ accuracy before worrying about WPM. Each error costs you more time than going slightly slower would have.",
    tip: "If you make more than 5 errors per minute, you're typing too fast. Slow down until accuracy improves.",
    icon: "🎯",
    illustration: (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-3 max-w-sm mx-auto"
      >
        <div className="flex items-center gap-3 rounded-xl border border-green-500/20 bg-green-500/5 p-3">
          <span className="text-lg">🐢</span>
          <div>
            <p className="text-[11px] font-bold text-green-400">Slow & Accurate</p>
            <p className="text-[9px] text-neutral-500">40 WPM · 97% accuracy → 38 net WPM</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/5 p-3">
          <span className="text-lg">🐇</span>
          <div>
            <p className="text-[11px] font-bold text-red-400">Fast & Sloppy</p>
            <p className="text-[9px] text-neutral-500">70 WPM · 82% accuracy → 32 net WPM</p>
          </div>
        </div>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center text-[10px] text-green-500 font-bold mt-1"
        >
          The turtle wins at typing too!
        </motion.p>
      </motion.div>
    ),
  },
  {
    title: "The 80/20 Rule of Typing",
    description: "80% of your typing consists of just 20% of the alphabet. The most common letters in English are E, T, A, O, I, N, S, H, and R. Master these first and you'll already be proficient at most typing tasks.",
    tip: "Practice common bigrams (two-letter combinations) like 'th', 'he', 'in', 'er', 'an', 're', 'on', 'at', 'en', 'nd' to build fluency.",
    icon: "📊",
    illustration: (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap justify-center gap-2 max-w-xs mx-auto"
      >
        {[
          { letter: "E", freq: 12.7, color: "from-orange-500 to-rose-500" },
          { letter: "T", freq: 9.1, color: "from-orange-500 to-rose-500" },
          { letter: "A", freq: 8.2, color: "from-orange-400 to-rose-400" },
          { letter: "O", freq: 7.5, color: "from-orange-400 to-rose-400" },
          { letter: "I", freq: 7.0, color: "from-orange-400 to-rose-400" },
          { letter: "N", freq: 6.7, color: "from-orange-400 to-rose-400" },
          { letter: "S", freq: 6.3, color: "from-amber-400 to-orange-400" },
          { letter: "H", freq: 6.1, color: "from-amber-400 to-orange-400" },
          { letter: "R", freq: 6.0, color: "from-amber-400 to-orange-400" },
        ].map((item, i) => (
          <motion.div
            key={item.letter}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.08 }}
            className="flex flex-col items-center gap-1 rounded-xl border border-neutral-800/60 bg-neutral-900/40 p-2 min-w-[52px]"
          >
            <span className="text-lg font-black text-neutral-100">{item.letter}</span>
            <span className="text-[9px] font-bold text-neutral-500">{item.freq}%</span>
          </motion.div>
        ))}
      </motion.div>
    ),
  },
  {
    title: "Rhythm is Everything",
    description: "Good typing has a steady rhythm. Think of it like drumming — each keystroke should be evenly spaced. Avoid the 'burst and pause' pattern where you type fast then hesitate. A consistent pace is faster overall.",
    tip: "Try typing along to a metronome set at 60 BPM (one beat per key press) to develop a steady rhythm.",
    icon: "🥁",
    illustration: (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-center gap-1 py-2"
      >
        {Array.from({ length: 12 }, (_, i) => (
          <motion.div
            key={i}
            initial={{ height: 0 }}
            animate={{ height: i % 2 === 0 ? 32 : 20 }}
            transition={{ delay: i * 0.08 }}
            className={`w-3 rounded-full ${i % 2 === 0 ? "bg-gradient-to-t from-orange-500 to-rose-500" : "bg-neutral-700"}`}
            style={{ transitionProperty: "height" }}
          />
        ))}
        <div className="ml-2">
          <motion.span
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ repeat: Infinity, duration: 1 }}
            className="text-[10px] text-orange-400 font-bold"
          >
            ♪
          </motion.span>
        </div>
      </motion.div>
    ),
  },
  {
    title: "Take Breaks & Stay Healthy",
    description: "Typing for long periods can strain your hands, wrists, and neck. Follow the 20-20-20 rule: every 20 minutes, look at something 20 feet away for 20 seconds. Take a 5-minute break every hour to stretch your hands and walk around.",
    tip: "Stretch your fingers by spreading them wide for 5 seconds, then making a fist for 5 seconds. Repeat 3 times.",
    icon: "🧘",
    illustration: (
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 10 }}
        className="flex items-center justify-center gap-6 p-4"
      >
        <div className="flex flex-col items-center gap-2">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border border-green-500/20 bg-green-500/10 text-2xl">
            🙌
          </div>
          <p className="text-[9px] text-green-400 font-bold">Stretch</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border border-orange-500/20 bg-orange-500/10 text-2xl">
            👀
          </div>
          <p className="text-[9px] text-orange-400 font-bold">20-20-20</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border border-blue-500/20 bg-blue-500/10 text-2xl">
            🚶
          </div>
          <p className="text-[9px] text-blue-400 font-bold">Walk</p>
        </div>
      </motion.div>
    ),
  },
  {
    title: "You're Ready to Type!",
    description: "You now know the key principles: look at the screen, prioritize accuracy, master common letters, keep a steady rhythm, and take care of your body. Start with the beginner lessons and work your way up. Every expert was once a beginner.",
    tip: "Set a daily goal: practice for just 10 minutes every day. Consistency beats intensity every time.",
    icon: "🔥",
    illustration: (
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 10 }}
        className="text-center"
      >
        <span className="text-5xl">⌨️</span>
        <motion.p
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="mt-2 text-sm text-orange-400 font-black tracking-[3px]"
        >
          GO TYPE!
        </motion.p>
      </motion.div>
    ),
  },
];

// ── Page ─────────────────────────────────────────────────

export default function TypingTipsPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const step = STEPS[currentStep];

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) setCurrentStep((s) => s + 1);
    else router.push("/learn");
  };

  return (
    <>
      <Particles particleColors={["#f97316", "#ffffff"]} particleCount={30} speed={0.03} />
      <div className="relative z-[1] flex flex-1 flex-col min-w-0">
        <header className="flex items-center gap-3 px-4 py-3">
          <button onClick={() => router.back()} className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-400 hover:text-neutral-100 transition-colors">
            <IconArrowLeft size={18} />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold tracking-[2px] text-neutral-500 uppercase">Typing Tips</span>
            <div className="flex gap-1">
              {STEPS.map((_, i) => (
                <div key={i} className={`h-1 w-5 rounded-full transition-all ${i <= currentStep ? "bg-orange-500" : "bg-neutral-800"}`} />
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
                      className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-[18px] border border-orange-500/20 bg-orange-500/10 text-3xl"
                    >{step.icon}</motion.div>
                    <h2 className="text-lg font-black tracking-[-0.02em] text-neutral-100">{step.title}</h2>
                  </div>

                  <div className="py-3">{step.illustration}</div>

                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
                    className="text-sm text-neutral-400 leading-relaxed text-center"
                  >{step.description}</motion.p>

                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                    className="rounded-[14px] border border-orange-500/10 bg-orange-500/5 p-3"
                  >
                    <p className="flex items-start gap-2 text-xs text-orange-400">
                      <IconBulb size={16} className="mt-0.5 shrink-0" />
                      <span>{step.tip}</span>
                    </p>
                  </motion.div>

                  <motion.button
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                    onClick={handleNext}
                    className="w-full flex items-center justify-center gap-2 rounded-[14px] bg-gradient-to-r from-orange-500 to-rose-500 px-5 py-3.5 text-sm font-bold text-neutral-950 tracking-[1px] shadow-[0_0_20px_rgba(249,115,22,0.12)] transition-all hover:brightness-110 active:scale-[0.98]"
                  >
                    {currentStep < STEPS.length - 1 ? <>Next Tip <IconCheck size={16} /></> : <>Start Lessons <IconKeyboard size={16} /></>}
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
