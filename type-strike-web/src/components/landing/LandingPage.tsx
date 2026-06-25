"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Award, Crown, X } from "lucide-react";
import { SignInButton, SignUpButton } from "@clerk/nextjs";

const VIDEO_URL = "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260606_154941_df1a96e1-a06f-450c-bd02-d863414cc1a0.mp4";

const NAV_LINKS = [
  { label: "Projects", href: "#projects" },
  { label: "Studio", href: "#studio" },
  { label: "Offerings", href: "#offerings" },
  { label: "Inquire", href: "#inquire" },
];

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();

  return (
    <div className="relative min-h-dvh w-full overflow-hidden bg-black text-white">
      {/* Background Video */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 h-full w-full object-cover"
        src={VIDEO_URL}
      />

      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Navbar */}
      <header className="relative z-40 flex items-center justify-between px-6 py-5 sm:px-10 lg:px-16 lg:py-7">
        <span className="font-podium text-2xl font-bold uppercase tracking-wider sm:text-3xl">
          VANGUARD
        </span>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="font-inter text-sm text-white/80 tracking-widest uppercase transition-colors hover:text-white"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden md:block">
          <SignInButton mode="modal">
            <button className="flex items-center gap-2 border border-white/30 px-6 py-3 text-xs tracking-widest uppercase transition-all hover:border-white/60 hover:bg-white/10">
              GET IN TOUCH
              <ArrowUpRight className="h-4 w-4" />
            </button>
          </SignInButton>
        </div>

        {/* Mobile hamburger */}
        <button
          className="flex flex-col items-end gap-1.5 md:hidden"
          onClick={() => setMenuOpen(true)}
          aria-label="Open menu"
        >
          <span className="block h-0.5 w-6 bg-white" />
          <span className="block h-0.5 w-6 bg-white" />
          <span className="block h-0.5 w-4 bg-white" />
        </button>
      </header>

      {/* Mobile Menu Overlay */}
      <div
        className={`fixed inset-0 z-50 bg-black/95 backdrop-blur-sm transition-all duration-500 ${
          menuOpen ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
      >
        <div className="flex h-full flex-col px-6 py-5 sm:px-10 lg:px-16">
          <div className="flex items-center justify-between">
            <span className="font-podium text-2xl font-bold uppercase tracking-wider sm:text-3xl">
              VANGUARD
            </span>
            <button
              onClick={() => setMenuOpen(false)}
              className="flex h-10 w-10 items-center justify-center"
              aria-label="Close menu"
            >
              <X className="h-6 w-6 text-white" />
            </button>
          </div>

          <nav className="mt-20 flex flex-1 flex-col items-center justify-center gap-8">
            {NAV_LINKS.map((link, i) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="font-podium text-4xl font-bold uppercase text-white transition-all duration-300 sm:text-5xl"
                style={{
                  transitionDelay: `${i * 80 + 100}ms`,
                  opacity: menuOpen ? 1 : 0,
                  transform: menuOpen ? "translateY(0)" : "translateY(20px)",
                }}
              >
                {link.label}
              </a>
            ))}
            <SignInButton mode="modal">
              <button
                onClick={() => setMenuOpen(false)}
                className="mt-4 flex items-center gap-2 border border-white/30 px-8 py-4 text-sm tracking-widest uppercase transition-all hover:border-white/60 hover:bg-white/10"
                style={{
                  transitionDelay: "420ms",
                  opacity: menuOpen ? 1 : 0,
                  transform: menuOpen ? "translateY(0)" : "translateY(20px)",
                }}
              >
                GET IN TOUCH
                <ArrowUpRight className="h-5 w-5" />
              </button>
            </SignInButton>
          </nav>
        </div>
      </div>

      {/* Hero Content */}
      <main className="relative z-30 flex min-h-dvh flex-col justify-center px-6 sm:px-10 lg:px-16">
        <div className="max-w-3xl">
          {/* Tagline */}
          <div className="animate-fade-up mb-6 flex items-center gap-3 lg:mb-8">
            <Crown className="h-4 w-4 text-white/70" />
            <span className="font-inter text-xs tracking-[0.3em] uppercase text-white/70 sm:text-sm">
              World-Class Digital Collective
            </span>
          </div>

          {/* Main Heading */}
          <h1 className="animate-fade-up-delay-1 font-podium leading-[0.92] tracking-tight">
            <span className="block text-[clamp(2.8rem,8vw,7rem)] uppercase text-white">
              Design.
            </span>
            <span className="block text-[clamp(2.8rem,8vw,7rem)] uppercase text-white">
              Disrupt.
            </span>
            <span className="block text-[clamp(2.8rem,8vw,7rem)] uppercase text-white">
              Conquer.
            </span>
          </h1>

          {/* Subtext */}
          <p className="animate-fade-up-delay-2 mt-6 max-w-md font-inter text-sm leading-relaxed text-white/70 sm:text-base lg:mt-8">
            We build fierce brand identities{" "}
            <br className="hidden sm:block" />
            that don&apos;t just turn heads --{" "}
            <span className="font-semibold text-white">they lead.</span>
          </p>

          {/* CTA Row */}
          <div className="animate-fade-up-delay-3 mt-8 flex flex-wrap items-center gap-4 sm:gap-6 lg:mt-10">
            <SignInButton mode="modal">
              <button className="group flex items-center gap-3 bg-black px-5 py-3 text-[11px] tracking-widest uppercase transition-colors hover:bg-neutral-900 sm:px-7 sm:py-4 sm:text-xs">
                SEE OUR WORK
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </button>
            </SignInButton>

            {/* Award badge */}
            <div className="hidden items-center gap-3 sm:flex">
              <Award className="h-8 w-8 text-white/50" />
              <div className="leading-tight">
                <p className="text-xs tracking-wider uppercase text-white/60">Top-Rated</p>
                <p className="text-xs tracking-wider uppercase text-white/60">Brand Studio</p>
              </div>
            </div>
          </div>

          {/* Stats Row */}
          <div className="animate-fade-up-delay-4 mt-8 flex flex-wrap gap-6 sm:mt-10 sm:gap-12 lg:mt-14 lg:gap-16">
            <div>
              <p className="font-inter text-2xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
                250+
              </p>
              <p className="mt-1 text-[9px] tracking-widest uppercase text-white/50 sm:text-xs">
                Brands Transformed
              </p>
            </div>
            <div>
              <p className="font-inter text-2xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
                95%
              </p>
              <p className="mt-1 text-[9px] tracking-widest uppercase text-white/50 sm:text-xs">
                Client Retention
              </p>
            </div>
            <div>
              <p className="font-inter text-2xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
                10+
              </p>
              <p className="mt-1 text-[9px] tracking-widest uppercase text-white/50 sm:text-xs">
                Years in the Game
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
