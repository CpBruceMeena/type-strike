# ⚡ type-strike

<p align="center">
  <img src="docs/logo.png" alt="type-strike" width="400">
</p>

<p align="center">
  <strong>Type with fury. Strike with fire.</strong>
</p>

type-strike is a typing game that turns every word into an explosive arcade battle. No flat typing tests. Just visceral feedback, liquid-fueled combos, and a journey through 100+ levels of fire and fury.

---

## 🎮 The Core Loop

| Step | What Happens |
|------|-------------|
| **1. Launch** | You enter a dark, molten world — your progression map |
| **2. Pick a level** | Each node is a crystalline keycap waiting to be conquered |
| **3. Countdown** | 3… 2… 1… GO! The arena ignites. |
| **4. Type** | Words appear in a scrollable panel. Correct keystrokes glow green. Mistakes crack red. |
| **5. Build the combo** | Streaks fill a raging plasma gauge across 6 tiers — from Igniting to Max Frenzy to Ignition Speed. |
| **6. Pass or fail** | Earn 1–3 stars based on WPM, accuracy, and error count. Advance to the next tier. |
| **7. Rise** | Earn XP, level up, unlock themes, collect achievements, and conquer all 100 levels. |

---

## 🚀 Quick Start

```bash
./run.sh start              # Start both backend + frontend
./run.sh start --seed       # Start with level seeding
./run.sh stop               # Stop both servers
```

### Manual Start

```bash
# Terminal 1 — Backend (Go)
cd backend
./run.sh start --seed

# Terminal 2 — Frontend (Next.js)
cd type-strike-web
NEXT_PUBLIC_API_URL=http://localhost:8080 npm run dev
```

---

## 🔥 Features

- **100+ levels** across 4 ascending tiers: Ember → Igneous → Magma Core → Obsidian → Beyond
- **5 game modes** — Levels, Timed (1/3/5 min), Contest, and Coder (code & DSA)
- **Plasma combo engine** — 6 combo tiers with escalating visual effects
- **Per-character typing** — color-coded feedback (green for correct, red for errors)
- **Dynamic OG images** — `/api/og` generates shareable score cards for social media
- **Achievement PNG share cards** — capture and share achievements as images
- **Coder mode** — type real code snippets (algorithms, DSA, system design)
- **Leaderboards** — global and contest rankings
- **Daily challenges** — with streak multipliers
- **18 achievements** — across speed, accuracy, combo, progression, and streak categories

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

## 🎨 The Visual Identity

```css
SURFACE      OBSIDIAN       #0A0A10
ACCENT       MAGMA RED      #FF5020
GOLD         MOLTEN GOLD    #FFCC00
NEON         NEON PURPLE    #CC44FF
TEXT         ASH WHITE      #CCCCCC
ERROR        BLOOD RED      #FF2200
CORRECT      STRIKE GREEN   #22DD44
```

Glass panels, metallic brackets, crystalline shards, and liquid fire — every screen is designed to make you feel the heat.

---

## Built for Speed

Two thumbs. One goal. Every keystroke is a weapon.

*"Type with fury. Strike with fire."*
