"use client";

import { useState } from "react";
import Particles from "@/components/react-bits/Particles";
import SpotlightCard from "@/components/react-bits/SpotlightCard";
import styles from "@/styles/glass-effects.module.css";
import {
  IconUsersGroup,
  IconBuildingStore,
  IconUsers,
  IconCode,
  IconMail,
  IconSend,
  IconCheck,
  IconUser,
  IconBuilding,
  IconMessage,
  IconBriefcase,
} from "@tabler/icons-react";

// ── Partner Types ───────────────────────────────────────

interface PartnerType {
  id: string;
  label: string;
  desc: string;
  icon: React.ReactNode;
  color: string;
}

const PARTNER_TYPES: PartnerType[] = [
  { id: "affiliate", label: "Affiliate", desc: "Promote Type Strike & earn commissions", icon: <IconUsers size={20} />, color: "#22DD44" },
  { id: "content", label: "Content Creator", desc: "Sponsorships & collaborations", icon: <IconCode size={20} />, color: "#00E5FF" },
  { id: "brand", label: "Brand Partnership", desc: "Co-branded campaigns & events", icon: <IconBuildingStore size={20} />, color: "#CC44FF" },
  { id: "education", label: "Education", desc: "Licensing for schools & programs", icon: <IconBriefcase size={20} />, color: "#FFCC00" },
];

// ── Page ─────────────────────────────────────────────────

export default function PartnersPage() {
  const [selectedType, setSelectedType] = useState<string>("");
  const [formState, setFormState] = useState({
    name: "",
    email: "",
    company: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    await new Promise((r) => setTimeout(r, 1000));
    setSending(false);
    setSubmitted(true);
  };

  return (
    <>
      <Particles particleColors={["#f97316", "#ffffff"]} particleCount={40} speed={0.05} />

      <div className="relative z-[1] flex flex-1 flex-col min-w-0">
        <div className="flex-1 px-4 pb-8 md:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl pt-4 md:pt-6 space-y-6">

            <SpotlightCard
              spotlightColor="rgba(249, 115, 22, 0.10)"
              className={styles.heroGlass}
              as="section"
            >
              <div className="relative p-5 md:p-6 text-center">
                <div
                  className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-[20px]"
                  style={{
                    background: "linear-gradient(135deg, rgba(249,115,22,0.20), rgba(234,88,12,0.12))",
                  }}
                >
                  <IconUsersGroup size={32} className="text-orange-400" />
                </div>
                <h1 className="text-2xl font-black tracking-[4px] text-neutral-100 m-0">
                  Partner Programs
                </h1>
                <p className="mt-2 text-sm text-neutral-500 max-w-lg mx-auto">
                  Collaborate with Type Strike. Whether you&apos;re an affiliate, content creator,
                  brand, or educational institution — let&apos;s build something legendary together.
                </p>
              </div>
            </SpotlightCard>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PARTNER_TYPES.map((pt) => (
                <button
                  key={pt.id}
                  onClick={() => setSelectedType(pt.id)}
                  className={`flex items-start gap-4 rounded-[18px] border p-4 text-left transition-all active:scale-[0.98] ${
                    selectedType === pt.id
                      ? "border-orange-500/40 bg-orange-500/5"
                      : "border-neutral-800/60 bg-neutral-900/30 hover:border-neutral-700/60 hover:bg-neutral-900/50"
                  }`}
                >
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] border"
                    style={{ borderColor: `${pt.color}30`, background: `${pt.color}10` }}
                  >
                    <span style={{ color: pt.color }}>{pt.icon}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[14px] font-bold text-neutral-100">{pt.label}</p>
                    <p className="text-[11px] text-neutral-500 mt-0.5">{pt.desc}</p>
                  </div>
                  {selectedType === pt.id && (
                    <div className="mt-1 h-5 w-5 shrink-0 rounded-full bg-orange-500/20 border border-orange-500/40 grid place-items-center">
                      <IconCheck size={12} className="text-orange-400" />
                    </div>
                  )}
                </button>
              ))}
            </div>

            {!submitted ? (
              <SpotlightCard
                spotlightColor="rgba(249, 115, 22, 0.08)"
                className="rounded-[22px] border border-neutral-800/80 bg-neutral-900/30 backdrop-blur-md overflow-hidden"
                as="section"
              >
                <div className="p-5 md:p-6">
                  <h2 className="flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[3px] text-neutral-300 m-0 mb-5">
                    <IconMail size={16} className="text-orange-400" />
                    Get in Touch
                  </h2>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="flex items-center gap-1.5 text-[11px] font-bold tracking-[1px] text-neutral-400 mb-1.5">
                        <IconUser size={13} />
                        Full Name
                      </label>
                      <input
                        type="text" required
                        value={formState.name}
                        onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                        placeholder="Your name"
                        className="w-full rounded-[14px] border border-neutral-800/60 bg-neutral-950/50 px-4 py-3 text-sm text-neutral-100 placeholder-neutral-600 outline-none transition-all focus:border-orange-500/40 focus:bg-neutral-950/80"
                      />
                    </div>
                    <div>
                      <label className="flex items-center gap-1.5 text-[11px] font-bold tracking-[1px] text-neutral-400 mb-1.5">
                        <IconMail size={13} />
                        Email Address
                      </label>
                      <input
                        type="email" required
                        value={formState.email}
                        onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                        placeholder="you@example.com"
                        className="w-full rounded-[14px] border border-neutral-800/60 bg-neutral-950/50 px-4 py-3 text-sm text-neutral-100 placeholder-neutral-600 outline-none transition-all focus:border-orange-500/40 focus:bg-neutral-950/80"
                      />
                    </div>
                    <div>
                      <label className="flex items-center gap-1.5 text-[11px] font-bold tracking-[1px] text-neutral-400 mb-1.5">
                        <IconBuilding size={13} />
                        Company / Organization
                      </label>
                      <input
                        type="text"
                        value={formState.company}
                        onChange={(e) => setFormState({ ...formState, company: e.target.value })}
                        placeholder="Your company (optional)"
                        className="w-full rounded-[14px] border border-neutral-800/60 bg-neutral-950/50 px-4 py-3 text-sm text-neutral-100 placeholder-neutral-600 outline-none transition-all focus:border-orange-500/40 focus:bg-neutral-950/80"
                      />
                    </div>
                    <div>
                      <label className="flex items-center gap-1.5 text-[11px] font-bold tracking-[1px] text-neutral-400 mb-1.5">
                        <IconMessage size={13} />
                        Message
                      </label>
                      <textarea
                        required rows={4}
                        value={formState.message}
                        onChange={(e) => setFormState({ ...formState, message: e.target.value })}
                        placeholder="Tell us about your partnership idea..."
                        className="w-full resize-none rounded-[14px] border border-neutral-800/60 bg-neutral-950/50 px-4 py-3 text-sm text-neutral-100 placeholder-neutral-600 outline-none transition-all focus:border-orange-500/40 focus:bg-neutral-950/80"
                      />
                    </div>
                    <button
                      type="submit" disabled={sending}
                      className="w-full flex items-center justify-center gap-2 rounded-[14px] bg-gradient-to-r from-orange-500 to-rose-500 px-5 py-3.5 text-sm font-bold text-neutral-950 tracking-[1px] shadow-[0_0_20px_rgba(249,115,22,0.12)] transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
                    >
                      {sending ? (
                        <span className="flex items-center gap-2">
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-950 border-t-transparent" />
                          Sending...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <IconSend size={16} />
                          Send Message
                        </span>
                      )}
                    </button>
                  </form>
                </div>
              </SpotlightCard>
            ) : (
              <SpotlightCard
                spotlightColor="rgba(34, 221, 68, 0.10)"
                className="rounded-[22px] border border-emerald-500/20 bg-neutral-900/30 backdrop-blur-md overflow-hidden"
                as="section"
              >
                <div className="p-8 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20">
                    <IconCheck size={32} className="text-emerald-400" />
                  </div>
                  <h2 className="text-lg font-black text-neutral-100 tracking-[2px]">Message Sent!</h2>
                  <p className="mt-2 text-sm text-neutral-500 max-w-sm mx-auto">
                    Thank you for reaching out! Our partnership team will review your message
                    and get back to you within 2-3 business days.
                  </p>
                  <button
                    onClick={() => { setSubmitted(false); setFormState({ name: "", email: "", company: "", message: "" }); setSelectedType(""); }}
                    className="mt-5 rounded-[12px] border border-neutral-800/60 bg-neutral-900/50 px-5 py-2.5 text-xs font-bold text-neutral-300 tracking-[1px] transition-all hover:border-neutral-700/60 hover:text-neutral-100"
                  >
                    Send Another Message
                  </button>
                </div>
              </SpotlightCard>
            )}

          </div>
        </div>
      </div>
    </>
  );
}
