# 🔥 Type Strike — Web Companion

<p align="center">
  <strong>Type with fury. Strike with fire.</strong>
</p>

The web companion to **type-strike** — a typing game that turns every word into an explosive arcade battle. Built with **Next.js (React + TypeScript)**, this is the browser-based version of the Android app, featuring timed modes, daily contests, and full gameplay.

---

## 🎮 Game Modes

| Mode | Duration | Description |
|------|----------|-------------|
| **1 Min Sprint** | 60s | Quick-fire speed test |
| **3 Min Endurance** | 180s | Pace yourself |
| **5 Min Marathon** | 300s | Full stamina challenge |
| **Daily Contest** | — | One attempt, one expert paragraph, ranked globally |
| **Coder (Easy)** | 60s | Basic algorithms & syntax |
| **Coder (Medium)** | 90s | Data structures & patterns |
| **Coder (Hard)** | 120s | Advanced DSA & optimizations |

---

## 🧠 Architecture

```
src/
├── app/              # Next.js App Router — 16+ pages
│   ├── api/          # API routes
│   │   └── og/       # Dynamic Open Graph image generation (1200×630 PNG)
│   ├── play/         # Timed modes + contest + coder gameplay
│   │   └── coder/    # Coder mode (code snippets & DSA)
│   ├── (main)/       # Home, map, leaderboard, stats, etc.
│   ├── victory/      # Result screen — server component with generateMetadata for OG
│   ├── failed/       # Failure screen — server component with generateMetadata for OG
│   └── splash/       # Splash / intro
│
├── engine/           # SOLID typing engine (framework-agnostic)
│   ├── interfaces.ts       # IInputSource, ITimerStrategy, IScoringStrategy, etc.
│   ├── implementations.ts  # KeyboardInputSource, CountdownTimer, StandardScoring,
│   │                      # CoderTextProvider (50+ code snippets), etc.
│   ├── TypingEngine.ts     # Core game loop
│   └── index.ts            # Barrel exports
│
├── hooks/            # React hooks
│   ├── useGameplay.ts          # Orchestrates engine + backend API
│   └── useMicroInteractions.ts # Character-level animations
│
├── components/
│   ├── game/         # GameplayUI, ParagraphDisplay, Speedometer, CountdownOverlay,
│   │                 # ComboGauge, KineticText
│   ├── analytics/    # LiveStats, ConsistencyGraph
│   ├── ui/           # Button, Card, GlassPanel, ProgressBar
│   ├── layout/       # TopBar, BottomNav, PageContainer, Sidebar
│   └── effects/      # ParticleField
│
├── lib/
│   ├── api.ts        # Backend API client (REST)
│   ├── types.ts      # TypeScript interfaces
│   ├── constants.ts  # Combo tiers, game modes, XP tables
│   └── utils.ts      # WPM, accuracy, star calculation
│
└── globals.css       # Design system tokens (CSS custom properties)
```

### Typing Engine (SOLID)

The engine uses **strategy pattern** with dependency injection:

- **IInputSource** — keyboard input (swapable for touch/voice)
- **ITimerStrategy** — countdown timer (timed modes) or no-timer (level mode)
- **IScoringStrategy** — WPM, accuracy, star calculation
- **IComboSystem** — streak tracking, gauge, tiers
- **ITelemetryPipeline** — event batching and logging
- **ITextProvider** — paragraph source (contest, practice, levels)

**Game flow:** `idle → loading → countdown → typing → complete/failed`

---

## 🚀 Getting Started

```bash
# From project root, start both servers:
./run.sh start
# Or manually:
cd type-strike-web
NEXT_PUBLIC_API_URL=http://localhost:8080 npm run dev
```

The app runs on **port 3000** by default and connects to the Go backend on **port 8080**.

---

## 👤 Profile

The **Profile** page (`/profile`) is available to signed-in users and displays:

- Clerk profile picture (from Google/GitHub OAuth)
- Name, username, and email
- Account join date
- **Log Out** button
- Quick links to Stats and Feats

Unauthenticated users see a sign-in prompt with modal buttons.

---

## 📐 Layout

- **Desktop**: The left sidebar is pinned on all main tabs (Home, Map, Learn, Coder, Daily, Feats, Leaderboard, Stats, Profile). Only the right content area scrolls.
- **Coder Session**: The sidebar is hidden while typing (`/play/coder/session`) for a full-bleed code arena.
- **Lesson Session**: The sidebar is hidden during active lessons (`/learn/lesson`) for an immersive typing experience.
- **Mobile**: A bottom navigation bar provides quick access to Play, Learn, Coder, Daily, and Feats.

---

## 🔧 Environment Variables

| Variable | Default | Required |
|----------|---------|----------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8080` | Yes — backend endpoint |

---

## 🖼️ Open Graph Images

OG images are generated dynamically at `/api/og` using `next/og` ImageResponse:
- **Default** — Branded Type Strike card with feature pills
- **Victory** — Shows WPM, accuracy, stars per result (used by share links)
- **Feat/Achievement** — Custom title + icon for achievement shares

Server-side `generateMetadata` on victory and failed pages ensures social media crawlers (Facebook, Twitter, Discord) see the correct OG image with score data.

## 📸 Achievement Share Cards

Achievement cards can be captured as PNG images via `html-to-image`:
1. Click Share on any achievement → card preview appears
2. `toPng()` captures the card at 2× pixel ratio
3. Tries native share with image file (mobile)
4. Falls back to download PNG
5. Falls back to text copy

## 🧑‍💻 Coder Mode

Type real code snippets instead of prose:
- **Easy**: Basic functions, simple algorithms (JS/Python/TS)
- **Medium**: Data structures, trees, DP, sorting
- **Hard**: Advanced DSA, LRU Cache, Trie, Union Find, Go/Rust

Content is generated entirely client-side from 50+ curated snippets — no backend dependency.

## 🏗️ Built With

- **Next.js 16** — App Router, React Server Components
- **React 19** — Server & Client Components, Hooks
- **TypeScript** — Full type safety
- **Tailwind CSS 4** — Utility-first styling
- **CSS Custom Properties** — Design system tokens

---

## 🔐 Authentication

Type Strike uses **Clerk** for authentication. Supported sign-in methods:

- **Email + Password**
- **GitHub OAuth**
- **Google OAuth**

> Phone-based authentication has been disabled to avoid region-specific issues (e.g., Indian mobile number support).

### Clerk Setup

This project is linked to the Clerk app `typestrike` (`app_3FdBMyckMf9fVLP8TKikdaVyWhw`).

1. Install the Clerk CLI:
   ```bash
   npm install -g clerk
   ```
2. Authenticate:
   ```bash
   clerk auth login
   ```
3. Initialize in the project:
   ```bash
   clerk init --app app_3FdBMyckMf9fVLP8TKikdaVyWhw
   ```

Clerk automatically creates:
- `src/proxy.ts` — auth middleware
- `src/app/sign-in/[[...sign-in]]/page.tsx`
- `src/app/sign-up/[[...sign-up]]/page.tsx`
- `.env.local` — Clerk keys

### Protected Routes

All app routes are protected by default. Public routes:
- `/sign-in`
- `/sign-up`

The sidebar and top bar show **Sign In / Sign Up** buttons when logged out, and a **UserButton** (with profile avatar) when logged in.
