"use client";

import { useUser } from "@clerk/nextjs";
import { SignInButton, SignUpButton, useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  IconSend,
  IconMessage,
  IconBuildingStore,
  IconChevronDown,
  IconLogout,
  IconKeyboard,
  IconFlame,
} from "@tabler/icons-react";
import { motion, AnimatePresence } from "framer-motion";

// ── Profile Page ──────────────────────────────────────────

export default function ProfilePage() {
  const { isSignedIn, user, isLoaded } = useUser();
  const clerk = useClerk();
  const router = useRouter();
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  if (!isLoaded) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
      </div>
    );
  }

  const handleLogout = async () => {
    await clerk.signOut();
    router.push("/");
  };

  if (!isSignedIn) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-neutral-900/50 p-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500/20 to-rose-500/20">
            <IconKeyboard size={28} className="text-orange-400" />
          </div>
          <h2 className="mb-1 text-lg font-black text-neutral-100">Welcome to Type Strike</h2>
          <p className="mb-6 text-sm text-neutral-500">Sign in to view and manage your profile.</p>
          <div className="flex flex-col gap-3">
            <SignInButton mode="modal">
              <button className="w-full rounded-xl bg-gradient-to-r from-orange-500 to-rose-500 px-4 py-3 text-xs font-bold tracking-[2px] text-neutral-950 transition-all hover:brightness-110 active:scale-[0.98]">
                SIGN IN
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="w-full rounded-xl border border-neutral-800/60 px-4 py-3 text-xs font-bold tracking-[2px] text-neutral-400 transition-all hover:border-orange-500/30 hover:text-orange-400 active:scale-[0.98]">
                SIGN UP
              </button>
            </SignUpButton>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex-1 px-4 py-5 md:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-3xl">
          <div className="flex flex-col gap-5">

            {/* ── Identity Card ────────────────────────── */}
            <div className="rounded-2xl border border-neutral-800/60 bg-gradient-to-br from-neutral-900/60 to-neutral-950/60 p-5">
              <div className="flex items-center gap-4">
                {user.imageUrl ? (
                  <img
                    src={user.imageUrl}
                    alt={user.fullName || "Profile"}
                    className="h-16 w-16 shrink-0 rounded-full border-2 border-orange-500/20 object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-rose-600 text-xl font-black text-white">
                    {user.firstName?.[0] || user.username?.[0] || "?"}
                  </div>
                )}
                <div className="min-w-0">
                  <h2 className="truncate text-lg font-bold text-neutral-100">
                    {user.firstName} {user.lastName}
                  </h2>
                  <p className="truncate text-sm text-neutral-500">{user.primaryEmailAddress?.emailAddress}</p>
                  {user.username && (
                    <p className="text-xs text-neutral-600">@{user.username}</p>
                  )}
                  <p className="mt-1.5 flex items-center gap-1.5 text-[10px] text-neutral-600">
                    <IconFlame size={12} className="text-orange-500/60" />
                    Joined {user.createdAt ? new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "recently"}
                  </p>
                </div>
              </div>
            </div>

            {/* ── Collapsible Feedback Form ────────────── */}
            <div className="rounded-2xl border border-orange-500/10 bg-gradient-to-r from-orange-500/[0.04] to-rose-500/[0.04] overflow-hidden">
              <button
                onClick={() => setFeedbackOpen(!feedbackOpen)}
                className="flex w-full items-center justify-between px-5 py-3.5 transition-colors hover:bg-white/[0.02]"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/10">
                    <IconMessage size={16} className="text-orange-400" />
                  </div>
                  <div className="text-left">
                    <p className="text-[13px] font-bold text-neutral-100">Send Feedback</p>
                    <p className="text-[10px] text-neutral-500">Help us improve Type Strike</p>
                  </div>
                </div>
                <motion.div
                  animate={{ rotate: feedbackOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="text-neutral-500"
                >
                  <IconChevronDown size={18} />
                </motion.div>
              </button>

              <AnimatePresence>
                {feedbackOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-neutral-800/40 px-5 pb-5 pt-4">
                      {feedbackSent ? (
                        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-center">
                          <p className="text-sm font-bold text-emerald-400">Thank you! 🎉</p>
                          <p className="mt-1 text-xs text-neutral-500">Your feedback helps us improve.</p>
                          <button
                            onClick={() => { setFeedbackSent(false); setFeedbackText(""); }}
                            className="mt-2 text-[10px] text-neutral-500 underline underline-offset-2 hover:text-neutral-300 transition-colors"
                          >
                            Send more feedback
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <textarea
                            rows={3}
                            value={feedbackText}
                            onChange={(e) => setFeedbackText(e.target.value)}
                            placeholder="Report bugs, suggest features, share your thoughts..."
                            className="w-full resize-none rounded-xl border border-neutral-800/60 bg-neutral-950/60 px-4 py-3 text-sm text-neutral-100 placeholder-neutral-600 outline-none transition-all focus:border-orange-500/40 focus:ring-1 focus:ring-orange-500/20"
                          />
                          <div className="flex items-center justify-end">
                            <button
                              onClick={async () => {
                                if (!feedbackText.trim()) return;
                                try {
                                  const response = await fetch("http://localhost:8080/api/v1/feedback", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({
                                      player_id: user?.id,
                                      email: user?.primaryEmailAddress?.emailAddress,
                                      message: feedbackText.trim(),
                                    }),
                                  });
                                  if (response.ok) {
                                    setFeedbackSent(true);
                                  }
                                } catch {
                                  setFeedbackSent(true);
                                }
                              }}
                              disabled={!feedbackText.trim()}
                              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-rose-500 px-4 py-2.5 text-xs font-bold tracking-[1px] text-neutral-950 transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              <IconSend size={14} />
                              Send
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ── Bottom: 2-column grid ────────────────── */}
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {/* Account */}
              <div className="rounded-2xl border border-neutral-800/60 bg-gradient-to-br from-neutral-900/40 to-neutral-950/40 p-5">
                <p className="mb-3 text-[10px] font-bold tracking-[2px] uppercase text-neutral-500">Account</p>
                <p className="mb-4 text-xs text-neutral-500 leading-relaxed">
                  Manage your personal info, connected accounts, and security settings.
                </p>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-neutral-800/60 px-4 py-2.5 text-xs font-bold tracking-[1px] text-neutral-400 transition-all hover:border-red-500/30 hover:text-red-400 active:scale-[0.98]"
                >
                  <IconLogout size={14} />
                  LOG OUT
                </button>
              </div>

              {/* Partner Program */}
              <div className="rounded-2xl border border-orange-500/10 bg-gradient-to-r from-orange-500/[0.04] to-rose-500/[0.04] p-5">
                <p className="mb-3 text-[10px] font-bold tracking-[2px] uppercase text-orange-400">Partner Program</p>
                <p className="mb-4 text-xs text-neutral-500 leading-relaxed">
                  Collaborate as an affiliate, content creator, brand, or educator. Drive awareness and earn rewards.
                </p>
                <button
                  onClick={() => router.push("/app/partners")}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-rose-500 px-4 py-2.5 text-xs font-bold tracking-[1px] text-neutral-950 transition-all hover:brightness-110 active:scale-[0.98]"
                >
                  <IconBuildingStore size={14} />
                  Apply for Partnership
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
