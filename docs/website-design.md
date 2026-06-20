# Type Strike — Website Design Document

> **Status:** Design Phase (Pre-Implementation)  
> **Tech Stack:** Next.js (React + TypeScript) · Go Backend · PostgreSQL  
> **Theme:** Dark fire/volcanic (matches mobile app)  
> **Date:** June 20, 2026

---

## Table of Contents
1. [Architecture Overview](#1-architecture-overview)
2. [Theme & Design System](#2-theme--design-system)
3. [Page Inventory & User Flows](#3-page-inventory--user-flows)
4. [Game Modes](#4-game-modes)
5. [New API Endpoints](#5-new-api-endpoints)
6. [Data Model Changes](#6-data-model-changes)
7. [Component Tree](#7-component-tree)
8. [Implementation Phases](#8-implementation-phases)

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Next.js App (type-strike-web)                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────────────┐  │
│  │  Pages/   │  │Components│  │   Hooks  │  │  API Client        │  │
│  │  Router   │  │   (UI)   │  │  (Logic) │  │  (fetch + axios)   │  │
│  └──────────┘  └──────────┘  └──────────┘  └────────┬───────────┘  │
│                                                      │               │
└──────────────────────────────────────────────────────┼───────────────┘
                                                       │ HTTP (REST)
                                                       ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   Go Backend (type-strike-backend)                    │
│  ┌──────────┐  ┌────────────┐  ┌────────────┐  ┌───────────────┐   │
│  │ Handlers │  │ Repository │  │   Models   │  │  Data/Levels  │   │
│  └──────────┘  └────────────┘  └────────────┘  └───────────────┘   │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           ▼
                  ┌────────────────┐
                  │   PostgreSQL   │
                  └────────────────┘
```

### Key Design Decisions
- **Next.js App Router** — modern React with server components where beneficial
- **Shared API client** — typed fetch layer matching the mobile app's `TypeStrikeApi`
- **Reuse Go backend** — add new endpoints rather than creating a new backend
- **CSS Modules / Tailwind** — use CSS custom properties matching mobile theme tokens
- **No separate auth** — simple player ID-based system (same as mobile)

---

## 2. Theme & Design System

### 2.1 Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `--bg-primary` | `#0A0A10` | Main page background |
| `--bg-surface` | `#1A1A28` | Cards, panels |
| `--bg-surface-dark` | `#141420` | Darker surfaces |
| `--bg-card` | `#12121E` | Card backgrounds |
| `--border` | `#2A2A3A` | Borders, dividers |
| `--accent-primary` | `#FF5020` | MagmaRed — CTAs, active states |
| `--accent-primary-dark` | `#CC3300` | Pressed/disabled primary |
| `--accent-gold` | `#FFCC00` | MoltenGold — stars, highlights |
| `--accent-purple` | `#CC44FF` | NeonPurple — achievements, combos |
| `--text-white` | `#FFFFFF` | Primary text |
| `--text-body` | `#CCCCCC` | Body text |
| `--text-label` | `#888888` | Labels, secondary |
| `--text-muted` | `#666666` | Muted/disabled |
| `--error-red` | `#FF2200` | Mistake characters, failure |
| `--success-green` | `#22FF44` | Correct characters |

### 2.2 Typography

| Style | Weight | Size | Letter-Spacing | Usage |
|-------|--------|------|----------------|-------|
| Display | Black (900) | 48px | 2px | Hero text, GO! |
| Headline Large | Black (900) | 22px | 1px | Section titles |
| Headline Medium | Black (900) | 18px | 2px | App bar title |
| Title Large | ExtraBold (800) | 16px | 1.5px | Stats, level names |
| Title Medium | ExtraBold (800) | 15px | 1.5px | Buttons |
| Body Medium | Medium (500) | 14px | 0.3px | Paragraph text |
| Label Small | SemiBold (600) | 11px | 1px | Labels, badges |
| Label Medium | Bold (700) | 10px | 1px | Tab labels, keys |

### 2.3 Effects & Motion
- **Background**: Particle field (flame-like floating embers) — Canvas or CSS
- **Buttons**: Glow pulse animation (opacity 0.6 → 1.0, 1.2s cycle)
- **Key presses**: Scale 1.0 → 0.92 (80ms)
- **Combo gauge**: Vertical bar fills with gradient, tier colors
- **Kinetic text**: Scale-in + fade-out for combo milestone messages
- **Stars on victory**: Scale-in staggered animation
- **Countdown**: Number scales in with spring animation
- **Page transitions**: Fade (200ms)

### 2.4 Spacing & Sizing
- Base unit: 4px
- Content max-width: 480px (mobile-first), 768px (tablet), 1200px (desktop with max-width on content)
- Border radius: 6px (keys), 10px (cards), 14px (nav strip), 16px (hero button)
- Consistent with mobile app padding/margins

---

## 3. Page Inventory & User Flows

### 3.1 Complete Site Map

```
/splash              → Splash (loading / branding)
/home                → Home Dashboard (main hub)
/map                 → Level Map (level progression)
/play/[mode]         → Gameplay Arena (core game loop)
  /play/contest      → Contest mode (daily)
  /play/1min         → Timed: 1 minute
  /play/3min         → Timed: 3 minutes
  /play/5min         → Timed: 5 minutes
/victory             → Victory Results (after successful game)
/failed              → Level Failed (retry/prompt)
/stats               → Player Statistics
/achievements        → Achievements Gallery
/leaderboard         → Leaderboards (Global / Daily / Contest)
/daily-challenges    → Daily Challenges (3 challenges)
/settings            → Player Settings
```

### 3.2 User Flow Diagram

```
                    ┌──────────┐
                    │  Splash  │
                    └────┬─────┘
                         │ 2s auto-transition
                         ▼
                    ┌──────────┐
              ┌────→│   Home   │←────┐
              │     └────┬─────┘     │
              │          │           │
     ┌────────┼──────────┼───────────┼──────────┐
     │        │          │           │          │
     ▼        ▼          ▼           ▼          ▼
 ┌──────┐ ┌──────┐ ┌──────────┐ ┌────────┐ ┌────────┐
 │ Map  │ │Daily │ │ Leaderbrd│ │ Stats  │ │Achieve │
 └──┬───┘ └──────┘ └──────────┘ └────────┘ └────────┘
    │
    ▼ (select level)      ┌─────────┐
    ┌─────────────────────→│Gameplay │←─────────────────┐
    │                     └────┬────┘                   │
    │                          │                        │
    │              ┌───────────┼────────────┐           │
    │              │           │            │           │
    ▼              ▼           ▼            ▼           │
┌───────┐    ┌──────────┐ ┌────────┐ ┌──────────┐      │
│Contest│    │  1 Min   │ │ 3 Min  │ │  5 Min   │      │
└───┬───┘    └────┬─────┘ └───┬────┘ └────┬─────┘      │
    │             │            │           │            │
    └─────────────┼────────────┼───────────┘            │
                  │            │                        │
          ┌───────┴────────────┴───────────┐            │
          │           Results               │            │
          │  ┌──────────┐  ┌────────────┐   │            │
          │  │ Victory  │  │   Failed   │   │            │
          │  └────┬─────┘  └─────┬──────┘   │            │
          └───────┼──────────────┼──────────┘            │
                  │              │                       │
                  └──────┐ ┌────┘                       │
                     Retry││Next                        │
                         ─┘                             │
                         └──────────────────────────────┘
                           (back to gameplay or home)
```

### 3.3 Page Descriptions

#### Splash Page (`/splash`)
- Full-screen dark background with particle field
- "TYPE" (white, Black weight) + "STRIKE" (MagmaRed, Black weight) wordmark
- Subtitle: "TYPE WITH FURY • STRIKE WITH FIRE"
- Auto-navigates to Home after 2s
- If player exists → show brief loading, then navigate
- Mobile equivalent: `SplashScreen`

#### Home Page (`/home`)
- **Top bar**: "TYPE STRIKE" logo (left) | Streak badge + Settings gear (right)
- **Player Crest**: Level circle badge (radial gradient MagmaRed → dark) with level number, title below
- **Hero "STRIKE" button**: Full-width glowing red button with flame icon, infinite pulse animation
- **Quick Stats Row**: WPM | STARS | STREAK | DONE (4 compact cards)
- **Daily Challenge Badge**: Shows progress dots (3), streak info, clickable → Daily Challenges
- **Mode Selector**: 4 cards/buttons for game modes — Levels | Contest | 1 Min | 3 Min | 5 Min
- **Bottom Nav Strip**: PLAY | DAILY | FEATS | STATS (same as mobile)
- Particle background, bottom glow gradient
- Mobile equivalent: `HomeScreen`

#### Map Page (`/map`)
- Tier sections: EMBER (1-25), IGNEOUS (26-50), MAGMA CORE (51-75), OBSIDIAN (76-100), BEYOND (101+)
- Each level as a node showing: level number, name, stars earned (0-3)
- Connected nodes showing progression flow
- Locked levels shown dimmed
- Scrollable vertical layout or grid
- Back button, Settings button
- Mobile equivalent: `MapScreen`

#### Gameplay Arena (`/play/[mode]`)
- **Pre-game**: Mode title + 3-2-1 countdown overlay with "🔥 START 🔥" button
- **Arena Header**: Mode name + progress bar (chars typed / total)
- **Paragraph Panel**: Character-by-character coloring
  - Untyped: dim (#6A6A7A)
  - Correct: green (#22DD44)
  - Error: red (#FF3300)
  - Current cursor: white with bold
- **Combo Gauge**: Vertical bar filling from 0-100%, tier color changes
- **Stats Bar**: Current WPM | Accuracy %
- **Combo Display**: ×N combo count + best combo
- **Custom Keyboard**: 
  - Number row (1-0)
  - QWERTY row (q-p)
  - ASDF row (a-l)
  - ZXCV row with Shift (⇧) + Backspace (⌫)
  - Bottom: mode switch (?123/ABC) + comma + SPACE + period + enter
  - Native keyboard option via settings
- **Kinetic Text Overlay**: Combo milestone messages (IGNITING!, BURNING!, etc.)
- **Timer** (timed modes only): Countdown MM:SS display, auto-end when reaches 0
- **Stall detection**: 3s inactivity → "Keep typing…" overlay
- Mobile equivalent: `GameplayScreen`

#### Victory Page (`/victory`)
- Stars animation (1-3 stars scale in)
- WPM | Accuracy | Combo results display
- XP earned notification
- Buttons: Play Again | Next Level | Back to Map
- Particle effects (celebration)
- Mobile equivalent: `VictoryScreen`

#### Level Failed Page (`/failed`)
- Results: WPM, Accuracy (below thresholds)
- Encouraging message
- Buttons: Retry | Back to Map
- Mobile equivalent: `LevelFailedScreen`

#### Stats Page (`/stats`)
- Overview cards: Total Games, Best WPM, Average Accuracy, Total XP
- Level progress: X / Y levels cleared
- Activity feed: Recent games with mode, WPM, accuracy, date
- Daily activity chart (last 30 days — heatmap or bars)
- Mobile equivalent: `StatsScreen`

#### Achievements Page (`/achievements`)
- Grid of achievement cards
- Each card: Icon, Name, Description, Progress bar
- Completed: highlighted with accent color
- Locked: dimmed
- Mobile equivalent: `AchievementsScreen`

#### Leaderboard Page (`/leaderboard`)
- Tabs: Global (all-time XP) | Daily (today) | Contest
- Each entry: Rank #, Player name, Level, XP/WPM, Stars
- Current player highlighted with MagmaRed
- Infinite scroll or pagination
- Mobile equivalent: `LeaderboardScreen`

#### Daily Challenges Page (`/daily-challenges`)
- 3 challenge cards with: Icon, Name, Description, Target WPM/ACC, Reward XP/Stars
- Progress indicator per challenge (current best vs target)
- Completed state with checkmark
- Streak counter at top with multiplier info
- Mobile equivalent: `DailyChallengesScreen`

#### Settings Page (`/settings`)
- Keyboard: CUSTOM | NATIVE
- Sound Volume slider
- Music Volume slider
- Key Click Type: BLUE | MECHANICAL | etc.
- Haptic: ON | OFF
- Player ID display
- Mobile equivalent: `SettingsScreen`

---

## 4. Game Modes

### 4.1 Level Mode (from mobile)
- **Paragraph**: Scaled by tier (Ember → basic lowercase; Obsidian → complex with capitals, numbers, symbols)
- **Goal**: Type entire paragraph with enough WPM/accuracy to earn stars
- **Scoring**: 1-3 stars based on WPM and accuracy thresholds
- **End condition**: Paragraph completed (content exhausted)

### 4.2 Timed Modes (1 Min / 3 Min / 5 Min)
- **Paragraph**: Harder difficulty (numbers, special characters `@#$%^&*()`, capitals, mixed case, code-like text)
- **Goal**: Type as much as possible before time runs out
- **Scoring**: 
  - WPM = (correct chars / 5) / (elapsed minutes)
  - Accuracy = correct / total keystrokes
  - No "stars" — score is WPM with accuracy threshold
- **End condition**: Timer reaches 00:00 → auto-submit
- **Harder text**: Full keyboard including `!@#$%^&*()_-+=[]{}|;:',.<>?/~` and digits
- **Leaderboard**: High score (WPM) per time category

### 4.3 Contest Mode
- **Paragraph**: One fixed paragraph per contest period (daily)
- **Difficulty**: Expert-level (code, symbols, numbers, mixed case, punctuation heavy)
- **Attempts**: One attempt per contest period
- **Ranking**: Leaderboard sorted by WPM (with accuracy tiebreaker)
- **Duration**: 24-hour contest cycle
- **Rewards**: XP bonus for top rankings, participation XP for all

### Paragraph Difficulty Scaling

| Mode | Character Set | Capitalization | Numbers | Special Chars | 
|------|---------------|----------------|---------|---------------|
| Levels 1-25 | a-z, spaces, `.` | No | No | `.` only |
| Levels 26-50 | a-z, spaces, `.`, `,` | Sentence-start | Occasional | `.`, `,`, `%` |
| Levels 51-75 | a-z, spaces, `.`, `,`, `!` | Mixed | Yes (in text) | `%`, `!`, `()`, `@` |
| Levels 76-100 | Full alphanumeric | Full mixed | Yes | `$%@!&`, quotes, brackets |
| Timed 1min | Full keyboard | Full mixed | Yes | `!@#$%^&*()_+-=[]{}|;':\",./<>?` |
| Timed 3min | Full keyboard | Full mixed | Yes | Same as above |
| Timed 5min | Full keyboard | Full mixed | Yes | Same as above |
| Contest | Full keyboard + code snippets | Heavy mixed | Yes | Full special + code syntax |

---

## 5. New API Endpoints

### 5.1 Game Session Management

```
POST /api/v1/games/start
  Request:  { "player_id": 1, "mode": "timed_1min" }
            modes: "timed_1min" | "timed_3min" | "timed_5min" | "contest" | "level"
  Response: {
    "game_id": "uuid-string",
    "mode": "timed_1min",
    "paragraph": "...",
    "duration_seconds": 60,
    "level_id": null // if level mode, the level ID
  }

POST /api/v1/games/{gameId}/complete
  Request: {
    "player_id": 1,
    "wpm": 65,
    "accuracy": 94.5,
    "correct_keystrokes": 320,
    "total_keystrokes": 340,
    "max_combo": 12,
    "completed": true
  }
  Response: {
    "game_id": "...",
    "wpm": 65,
    "accuracy": 94.5,
    "xp_earned": 50,
    "stars": null, // only for level mode
    "rank": null,  // only for contest
    "leaderboard_update": { ... }
  }

GET /api/v1/games/history
  Query: player_id, mode (optional), limit, offset
  Response: {
    "games": [{
      "id": "...", "mode": "timed_1min", "wpm": 65, "accuracy": 94.5,
      "correct_keystrokes": 320, "total_keystrokes": 340,
      "max_combo": 12, "xp_earned": 50, "played_at": "2026-06-20T..."
    }],
    "total": 42
  }
```

### 5.2 Contest Management

```
GET /api/v1/contest/current
  Query: player_id
  Response: {
    "contest_id": 1,
    "start_date": "2026-06-20T00:00:00Z",
    "end_date": "2026-06-21T00:00:00Z",
    "paragraph": "...",
    "difficulty": "expert",
    "player_entry": { "wpm": null, "accuracy": null, "rank": null } // null if not played
  }

GET /api/v1/contest/leaderboard
  Query: contest_id, limit
  Response: {
    "entries": [{
      "rank": 1, "player_id": 5, "player_name": "FLAME",
      "wpm": 89, "accuracy": 97.2, "level": 42
    }],
    "player_entry": { ... } // if player_id provided
  }
```

### 5.3 Leaderboard Enhancements

```
GET /api/v1/leaderboard/timed
  Query: mode ("1min" | "3min" | "5min"), limit
  Response: { "entries": [...], "total_count": N }
```

### 5.4 Player Stats

```
GET /api/v1/players/{id}/extended-stats
  Response: {
    "total_games": 150,
    "total_levels_cleared": 42,
    "best_wpm_by_mode": {
      "level": 85,
      "timed_1min": 72,
      "timed_3min": 68,
      "timed_5min": 65,
      "contest": 78
    },
    "average_accuracy": 93.5,
    "total_xp": 12500,
    "recent_activity": [...],
    "daily_stats_30_days": [{ "date": "2026-06-20", "games": 5, "best_wpm": 72 }]
  }
```

---

## 6. Data Model Changes

### New Database Tables

```sql
-- Game sessions (timed modes + contest)
CREATE TABLE game_sessions (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id     INT NOT NULL REFERENCES players(id),
    mode          VARCHAR(20) NOT NULL, -- 'timed_1min', 'timed_3min', 'timed_5min', 'contest'
    paragraph     TEXT NOT NULL,
    duration_sec  INT NOT NULL,
    started_at    TIMESTAMP NOT NULL DEFAULT NOW(),
    completed_at  TIMESTAMP,
    wpm           INT,
    accuracy      REAL,
    correct_ks    INT,
    total_ks      INT,
    max_combo     INT DEFAULT 0,
    xp_earned     INT DEFAULT 0,
    is_completed  BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_game_sessions_player ON game_sessions(player_id);
CREATE INDEX idx_game_sessions_mode ON game_sessions(mode);
CREATE INDEX idx_game_sessions_completed ON game_sessions(player_id, completed_at);

-- Contest periods
CREATE TABLE contests (
    id            SERIAL PRIMARY KEY,
    start_date    TIMESTAMP NOT NULL,
    end_date      TIMESTAMP NOT NULL,
    paragraph     TEXT NOT NULL,
    difficulty    VARCHAR(20) DEFAULT 'expert',
    is_active     BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_contests_active ON contests(is_active, start_date);

-- Contest entries (one per player per contest)
CREATE TABLE contest_entries (
    id              SERIAL PRIMARY KEY,
    contest_id      INT NOT NULL REFERENCES contests(id),
    player_id       INT NOT NULL REFERENCES players(id),
    game_session_id UUID NOT NULL REFERENCES game_sessions(id),
    wpm             INT NOT NULL,
    accuracy        REAL NOT NULL,
    rank            INT,
    created_at      TIMESTAMP DEFAULT NOW(),
    UNIQUE(contest_id, player_id)
);

CREATE INDEX idx_contest_entries_rank ON contest_entries(contest_id, wpm DESC);

-- Player extended stats (materialized/cached)
CREATE TABLE player_extended_stats (
    player_id           INT PRIMARY KEY REFERENCES players(id),
    total_games         INT DEFAULT 0,
    best_wpm_level      INT DEFAULT 0,
    best_wpm_timed_1min INT DEFAULT 0,
    best_wpm_timed_3min INT DEFAULT 0,
    best_wpm_timed_5min INT DEFAULT 0,
    best_wpm_contest    INT DEFAULT 0,
    avg_accuracy        REAL DEFAULT 0,
    updated_at          TIMESTAMP DEFAULT NOW()
);
```

---

## 7. Component Tree

```
app/
├── layout.tsx                    # Root layout: metadata, font, body class
├── page.tsx                      # Redirect → /splash or /home
├── globals.css                   # CSS custom properties, base styles
│
├── (main)/                       # Main layout group (particle bg, nav)
│   ├── layout.tsx                # Shared layout with BottomNav
│   ├── home/page.tsx             # Home dashboard
│   ├── map/page.tsx              # Level progression map
│   ├── stats/page.tsx            # Player statistics
│   ├── achievements/page.tsx     # Achievements gallery
│   ├── leaderboard/page.tsx      # Leaderboards (tabs)
│   ├── daily-challenges/page.tsx # Daily challenges
│   └── settings/page.tsx         # Settings
│
├── play/
│   ├── layout.tsx                # Gameplay layout (fullscreen, no nav)
│   ├── contest/page.tsx          # Contest mode
│   ├── 1min/page.tsx             # 1-minute timed mode
│   ├── 3min/page.tsx             # 3-minute timed mode
│   └── 5min/page.tsx             # 5-minute timed mode
│
├── splash/page.tsx               # Splash/intro screen
├── victory/page.tsx              # Victory results
└── failed/page.tsx               # Level failed

components/
├── ui/                           # Primitive UI components
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── Slider.tsx
│   ├── Tabs.tsx
│   └── ProgressBar.tsx
│
├── layout/                       # Layout components
│   ├── BottomNav.tsx
│   ├── TopBar.tsx
│   └── PageContainer.tsx
│
├── effects/                      # Visual effects
│   ├── ParticleField.tsx
│   ├── KineticText.tsx
│   └── StarBurst.tsx
│
├── gameplay/                     # Game-specific components
│   ├── ParagraphDisplay.tsx
│   ├── ComboGauge.tsx
│   ├── StatsBar.tsx
│   ├── ArenaHeader.tsx
│   ├── CountdownOverlay.tsx
│   ├── CountdownTimer.tsx
│   ├── CustomKeyboard.tsx
│   ├── KeyboardKey.tsx
│   └── NativeKeyboardInput.tsx
│
├── home/                         # Home page components
│   ├── PlayerCrest.tsx
│   ├── HeroPlayButton.tsx
│   ├── StatsRow.tsx
│   ├── DailyBadge.tsx
│   └── ModeSelector.tsx
│
├── map/                          # Map page components
│   ├── LevelNode.tsx
│   ├── TierSection.tsx
│   └── MapConnector.tsx
│
├── leaderboard/                  # Leaderboard components
│   ├── LeaderboardTable.tsx
│   ├── LeaderboardRow.tsx
│   └── PlayerRank.tsx
│
├── daily/                        # Daily challenge components
│   ├── ChallengeCard.tsx
│   └── StreakBadge.tsx
│
├── stats/                        # Stats components
│   ├── StatCard.tsx
│   ├── ActivityFeed.tsx
│   └── ActivityChart.tsx
│
└── achievements/                 # Achievement components
    └── AchievementCard.tsx

lib/
├── api.ts                        # API client (fetch wrapper)
├── types.ts                      # TypeScript interfaces
├── constants.ts                  # Game constants, tier config
├── utils.ts                      # Utility functions (WPM calc, etc.)
└── hooks/
    ├── useGame.ts                # Game loop hook
    ├── useTimer.ts               # Countdown timer hook
    ├── useKeyboard.ts            # Keyboard input hook
    ├── usePlayer.ts              # Player data hook
    └── useParticles.ts           # Particle canvas hook
```

---

## 8. Implementation Phases

### Phase 1: Foundation (Days 1-2)
- [ ] Initialize Next.js project with TypeScript and Tailwind
- [ ] Set up CSS custom properties (theme tokens)
- [ ] Create API client layer (matching existing endpoints)
- [ ] Create shared type definitions
- [ ] Implement layout components (BottomNav, TopBar, PageContainer)
- [ ] Implement ParticleField effect
- [ ] Set up project structure

### Phase 2: Backend Enhancements (Days 2-3)
- [ ] Create game_sessions table migration
- [ ] Create contests + contest_entries table migrations
- [ ] Create player_extended_stats table migration
- [ ] Implement game session endpoints (start, complete, history)
- [ ] Implement contest endpoints (current, leaderboard)
- [ ] Implement timed leaderboard endpoint
- [ ] Implement extended stats endpoint

### Phase 3: Core Pages (Days 3-5)
- [ ] Splash page
- [ ] Home page (PlayerCrest, HeroPlayButton, StatsRow, ModeSelector, DailyBadge)
- [ ] Map page (TierSection, LevelNode)
- [ ] Settings page
- [ ] Stats page (StatCard, ActivityFeed)

### Phase 4: Gameplay (Days 5-7)
- [ ] Gameplay layout (fullscreen)
- [ ] Countdown overlay
- [ ] Paragraph display with character coloring
- [ ] Custom keyboard component
- [ ] Combo gauge + stats bar
- [ ] Kinetic text overlay
- [ ] Timed mode timer
- [ ] Stall detection
- [ ] Game loop hook (useGame)

### Phase 5: Results & Social (Days 7-8)
- [ ] Victory page with star animation
- [ ] Level failed page
- [ ] Leaderboard page (tabs: Global/Daily/Contest)
- [ ] Daily challenges page
- [ ] Achievements page

### Phase 6: Polish (Days 8-9)
- [ ] Animations and transitions
- [ ] Responsive design
- [ ] Performance optimization
- [ ] Testing
- [ ] Deployment setup

---

## Appendix: Mobile ↔ Web Feature Parity

| Feature | Mobile | Web | Notes |
|---------|--------|-----|-------|
| Splash screen | ✅ | ✅ | Same branding |
| Home dashboard | ✅ | ✅ | Same layout + mode selector |
| Level progression | ✅ | ✅ | Same 100+ levels |
| Gameplay (levels) | ✅ | ✅ | Same mechanics |
| Custom keyboard | ✅ | ✅ | Same layout |
| Native keyboard | ✅ | ✅ | Optional |
| Combo system | ✅ | ✅ | Same tiers |
| Victory / Failed | ✅ | ✅ | Same flow |
| Stats page | ✅ | ✅ | Enhanced with web charts |
| Achievements | ✅ | ✅ | Full parity |
| Daily challenges | ✅ | ✅ | Full parity |
| Leaderboard | ✅ | ✅ | Enhanced with contest tab |
| Settings | ✅ | ✅ | Full parity |
| Timed 1min | ❌ | 🆕 | New |
| Timed 3min | ❌ | 🆕 | New |
| Timed 5min | ❌ | 🆕 | New |
| Contest mode | ❌ | 🆕 | New |
| Harder paragraphs | ❌ | 🆕 | For timed/contest |
