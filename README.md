# ⚡ type-strike

<p align="center">
  <img src="docs/logo.png" alt="type-strike" width="400">
</p>

<p align="center">
  <strong>Type with fury. Strike with fire.</strong>
</p>

type-strike is a typing game that turns every word into an explosive arcade battle. No flat typing tests — just visceral feedback, liquid-fueled combos, and a journey through 100+ levels of fire and fury.

---

## 🎮 The Core Loop

You enter a dark, molten world — your progression map. Each node is a crystalline keycap waiting to be conquered. The countdown hits 3… 2… 1… GO! The arena ignites. Words appear in a scrollable panel. Correct keystrokes glow green; mistakes crack red. Build streaks across 6 combo tiers — from *Igniting* to *Max Frenzy* to *Ignition Speed*. Earn 1–3 stars based on WPM, accuracy, and error count. Advance through the tiers. Rise through 100+ levels.

---

## 🔥 Features

- **100+ levels** across 5 ascending tiers: Ember → Igneous → Magma Core → Obsidian → Beyond
- **5 game modes** — Levels, Timed (1/3/5 min), Contest, and Coder (code & DSA)
- **Plasma combo engine** — 6 escalating tiers with visual effects
- **Coder mode** — type real multi-line code snippets across 7 languages (JS, TS, Python, Go, Java, C++, Rust)
- **Learn mode** — 48 progressive typing lessons with **backend-tracked progress** (persisted across sessions)
- **Daily challenges** — with streak multipliers
- **Leaderboards** — Global (XP), Daily (today's best), and Timed (1min/3min/5min) rankings with stacked collapsible sections
- **Stats dashboard** — real player data: game history, level progress, activity feed, XP tracking, streak counter
- **18 achievements** — across speed, accuracy, combo, progression, and streaks
- **Dynamic share cards** — Open Graph images for social media
- **Custom keyboard themes** — unlock visual styles as you progress
- **Retry on failure** — automatic retry button when a game fails to load

---

## 🗺️ The Journey

| Tier | Levels | Vibe |
|------|--------|------|
| **EMBER 🔥** | 1–25 | The beginning of flame |
| **IGNEOUS 🌋** | 26–50 | Forged in volcanic fire |
| **MAGMA CORE 🔴** | 51–75 | The planet's burning heart |
| **OBSIDIAN ⚫** | 76–100 | Only the fastest survive |
| **BEYOND 🌟** | 101+ | Unlimited dynamically-generated levels |

---

## 🚀 Quick Start

```bash
./run.sh start              # Start both backend + frontend
./run.sh start --seed       # Start with level seeding
./run.sh stop               # Stop both servers
```

Or start each service manually:

```bash
cd backend && ./run.sh start --seed    # Go backend on :8080
cd type-strike-web && npm run dev      # Next.js frontend on :3000
```

---

## 📱 Platform

- **Web** — Next.js, React, TypeScript, Tailwind CSS
- **Android** — Kotlin, Jetpack Compose
- **Backend** — Go, PostgreSQL

---

## Keyboard Themes

| Theme | Unlock At | Description |
|-------|-----------|-------------|
| 🔥 Magma | Default | Fiery red theme |
| ★ Molten Gold | 10 levels | Premium golden keys |
| ✦ Neon Pulse | 25 levels | Electric purple glow |
| ❄ Frost Strike | 50 levels | Chilling blue keys |
| ⚫ Obsidian Void | 75 levels | Dark prestige keys |
| 🌈 Prismatic Fury | 100 levels | All colors unlocked |

---

*Two thumbs. One goal. Every keystroke is a weapon.*
