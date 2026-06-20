# ⚡ type-strike

<p align="center">
  <img src="docs/logo.png" alt="type-strike" width="400">
</p>

<p align="center">
  <strong>Type with fury. Strike with fire.</strong>
</p>

type-strike is a typing game ecosystem — **mobile** and **web** — that turns every word into an explosive arcade battle. No flat typing tests. Just visceral feedback, liquid-fueled combos, and a journey through 100+ levels of fire and fury.

---

## 🎮 The Core Loop

| Step | What Happens |
|------|-------------|
| **1. Launch** | You enter a dark, molten world — your progression map |
| **2. Pick a level** | Each node is a crystalline keycap waiting to be conquered |
| **3. Countdown** | 3… 2… 1… GO! The arena ignites. |
| **4. Type** | Words appear in a scrollable panel. Correct keystrokes glow green. Mistakes crack red. The custom keyboard fires back with haptic taps. |
| **5. Build the combo** | Streaks fill a raging plasma gauge across 6 tiers — from Igniting to Max Frenzy to Ignition Speed. |
| **6. Pass or fail** | Earn 1–3 stars based on WPM, accuracy, and error count. Advance to the next tier. |
| **7. Rise** | Earn XP, level up, unlock keyboard themes, collect achievements, and conquer all 100 levels. |

---

## 📱 Platform Overview

### Android App (`type-strike-android/`)
Native Android app built with **Kotlin + Jetpack Compose** and Material 3 dark theme.

### Website (`type-strike-web/`)
Web companion built with **Next.js (React + TypeScript)** — same theme, same game modes, plus new **timed modes** and **daily contest**.

| Feature | Mobile | Web |
|---------|--------|-----|
| 100+ level progression | ✅ | ✅ |
| Gameplay arena with custom keyboard | ✅ | ✅ |
| Combo gauge / kinetic text | ✅ | ✅ |
| Victory / Failed screens | ✅ | ✅ |
| Embark map | ✅ | ✅ |
| Daily challenges | ✅ | ✅ |
| Leaderboard (global + daily) | ✅ | ✅ |
| Achievements | ✅ | ✅ |
| Stats | ✅ | ✅ |
| Settings | ✅ | ✅ |
| **1 Min / 3 Min / 5 Min timed modes** | ❌ | 🆕 |
| **Daily contest (ranked)** | ❌ | 🆕 |
| **Coder mode (code snippets & DSA)** | ❌ | 🆕 |
| **Open Graph image generation** | ❌ | 🆕 |
| **Achievement share cards (PNG)** | ❌ | 🆕 |

---

## 🚀 Getting Started

### Prerequisites
- **Go** 1.21+ (backend)
- **Node.js** 18+ (website)
- **PostgreSQL** 14+ (database)
- **lsof** (port management)

### Quick Start (Both Servers)

```bash
./run.sh start              # Start both backend + frontend
./run.sh start --seed       # Start with level seeding
./run.sh stop               # Stop both servers
./run.sh status             # Check running status
./run.sh logs               # View all logs
./run.sh logs backend       # Follow backend logs only
./run.sh logs frontend      # Follow frontend logs only
./run.sh build              # Build frontend for production
```

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `SERVER_PORT` | `8080` | Backend Go server port |
| `FRONTEND_PORT` | `3000` | Next.js dev server port |
| `DATABASE_URL` | `postgresql://postgres:password@localhost:5432/typestrike?sslmode=disable` | PostgreSQL connection |

### Manual Start

**Backend:**
```bash
cd backend
./run.sh start --seed
```

**Website:**
```bash
cd type-strike-web
NEXT_PUBLIC_API_URL=http://localhost:8080 npm run dev
```

---

## 🏗️ Project Structure

```
type-strike/
├── run.sh                     # Unified server manager (root)
├── .gitignore                 # Root gitignore
├── backend/                   # Go backend (API server)
│   ├── cmd/server/main.go     # Entry point
│   ├── internal/              # Handlers, repositories, models
│   ├── migrations/            # SQL migrations (001–004)
│   └── run.sh                 # Backend server manager
│
├── type-strike-android/       # Android app
│   └── app/src/main/java/     # Kotlin + Jetpack Compose
│
├── type-strike-web/           # Next.js website
│   └── src/
│       ├── app/               # App Router (14 pages/routes)
│       ├── components/        # React components
│       │   ├── ui/            # Button, Card, GlassPanel, ProgressBar
│       │   ├── layout/        # TopBar, BottomNav, PageContainer
│       │   ├── game/          # GameplayUI, ParagraphDisplay, CountdownOverlay, ComboGauge, KineticText
│       │   ├── effects/       # ParticleField
│       │   └── analytics/     # LiveStats, ConsistencyGraph
│       ├── engine/            # SOLID typing engine
│       │   ├── interfaces.ts  # IInputSource, ITimerStrategy, IScoringStrategy, etc.
│       │   ├── implementations.ts  # KeyboardInputSource, CountdownTimer, StandardScoring, etc.
│       │   ├── TypingEngine.ts     # Core game loop
│       │   └── index.ts       # Barrel exports
│       ├── hooks/             # useGameplay, useMicroInteractions
│       ├── lib/               # Types, API client, constants, utils
│       └── globals.css        # Design system tokens
│
├── docs/
│   ├── logo.png               # Project logo
│   ├── website-design.md      # Website design document
│   └── platform-strategy.md   # Platform strategy
│
└── scripts/
    └── git-hooks/pre-push     # Pre-push hook (Android lint)
```

---

## 🔥 Features

- **100+ levels** across 4 ascending tiers: Ember → Igneous → Magma Core → Obsidian → Beyond
- **🔥 Countdown start** — 3-2-1-GO animation before each level builds anticipation
- **Plasma combo engine** — 6 combo tiers (Igniting → Burning → Critical Combo → Max Frenzy → Ignition Speed) with escalating visual effects
- **Per-word result tracking** — every word scored with correct/error tracking and color-coded feedback
- **Scrollable all-words panel** — see every word in the level with character-by-character coloring (green for correct, red for errors, white for next)
- **Custom thumb keyboard** — mechanical-style keycaps designed for mobile typing with press animations
- **Native keyboard support** — toggle between in-app custom keyboard and device keyboard in settings
- **Haptic feedback system** — key press taps, error buzzes, word-complete triple pulses, combo milestone vibrations, trophy slams, and level-failed buzzes
- **6 unlockable keyboard themes** — Magma (default), Molten Gold, Neon Pulse, Frost Strike, Obsidian Void, Prismatic Fury — unlocked by completing levels
- **Kinetic feedback** — shattering glass, crack effects, particle storms, screen shake
- **Rich progression** — XP, levels, titles, stars, and a sprawling broken-tech map
- **Home dashboard** — player identity card with level badge, star count, XP progress bar with animated gradient fill
- **Achievements system** — 18 achievements across 5 categories, tracked via dedicated screen
- **Configurable settings** — keyboard layout (QWERTY/AZERTY/QWERTZ), key size, click type (Blue/Brown/Red/Linear), keyboard type (in-app/device), sound volume, music volume, haptics (on/off + intensity), reduced particles, high contrast mode, keyboard themes, font size, left-handed mode
- **Victory screen** — animated trophy shards with haptic slams, metrics dashboard, XP arc bar with level-up notification
- **Level failed overlay** — cracked "LEVEL BREACHED" badge, requirement breakdown, partial XP
- **Custom launcher icon** — bold geometric "T" with flame accents on obsidian background
- **Dark arcade aesthetic** — obsidian, magma red, molten gold, and neon purple
- **Web timed modes** — 1-minute sprint, 3-minute endurance, 5-minute marathon
- **Web contest mode** — daily ranked competition with expert-level paragraphs
- **Web coder mode** — type real code snippets (algorithms, DSA, system design) organized by difficulty (easy/medium/hard)
- **Open Graph image generation** — dynamic `/api/og` endpoint using `next/og` ImageResponse that generates 1200×630 PNG images for social sharing, with victory score cards and achievement cards
- **Achievement PNG share cards** — capture achievement cards as PNG images using `html-to-image`, shareable via native share or downloadable

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

## 🗺️ The Journey

| Tier | Levels | Vibe |
|------|--------|------|
| **EMBER 🔥** | 1–25 | The beginning of flame |
| **IGNEOUS 🌋** | 26–50 | Forged in volcanic fire |
| **MAGMA CORE 🔴** | 51–75 | The planet's burning heart |
| **OBSIDIAN ⚫** | 76–100 | Only the fastest survive |
| **BEYOND 🌟** | 101+ | Unlimited dynamically-generated levels |

---

## ⌨️ Keyboard Themes

Unlock new keyboard appearances by clearing levels:

| Theme | Unlock At | Description |
|-------|-----------|-------------|
| 🔥 Magma | 0 levels | Default fiery red theme |
| ★ Molten Gold | 10 levels | Premium golden keys |
| ✦ Neon Pulse | 25 levels | Electric purple glow |
| ❄ Frost Strike | 50 levels | Chilling blue keys |
| ⚫ Obsidian Void | 75 levels | Dark prestige keys |
| 🌈 Prismatic Fury | 100 levels | All colors unlocked |

---

## 🛣️ Roadmap

### ✅ Shipped
- Full 100-level progression with 4 tiers + infinite Beyond levels
- Gameplay arena with character-by-character typing
- Combo engine (6 tiers) with kinetic text feedback
- Custom keyboard (letters/symbols modes, shift, backspace, number row)
- Native keyboard support option
- Victory / Failed screens with star calculation
- Home dashboard with player identity, stats, and bottom nav
- Embark map with tier fracture zones and particle effects
- 18 achievements across 5 categories
- Daily challenges with streak multipliers
- Leaderboards (global + daily)
- Stats screen with performance data
- Settings (keyboard, sound, haptics, visuals, accessibility)
- Particle system with device-aware quality tiers
- Haptic feedback system (7 distinct patterns)
- Sound engine (programmatic PCM-16 audio)
- Background music (ambient electronic)
- Splash screen with logo reveal
- **Website foundation** — Next.js project with theme, API client, 14 page shells
- **Unified `run.sh`** — single command to run both backend and frontend
- **Web timed modes** (1min / 3min / 5min) + **daily contest** — backend game sessions, paragraph generation, CORS middleware
- **SOLID typing engine** — TypingEngine with pluggable strategies (input, timer, scoring, combo, telemetry)
- **Gameplay UI** — ParagraphDisplay, CountdownOverlay, ComboGauge, KineticText, LiveStats, ConsistencyGraph
- **Backend game sessions API** — start/complete game sessions, timed leaderboard, contest entries

### 🔥 On the Horizon
- Contest mode leaderboard UI on web
- Cross-platform account sync
- Real-time multiplayer races
- Production CORS configuration
- Share button on victory/failed pages

---

## Built for Speed

Two thumbs. One goal. Every keystroke is a weapon.

type-strike is designed from the ground up — **mobile-first** with thumb-optimized keyboard zones, edge-to-edge dark UI, and haptic feedback that makes each letter feel like a strike. The **web companion** extends the experience with timed challenges and competitive play.

---

*"Type with fury. Strike with fire."*
