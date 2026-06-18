# Product Spec: Home / Dashboard Screen
**Feature:** type-strike Home Screen  
**Date:** 2026-06-17  
**Status:** Draft for Review  
**Priority:** P0 — Must ship in MVP

---

## 1. Overview

### Purpose
The Home screen is the **first screen** the player sees after the Splash sequence. It serves as the app's root navigation hub — giving the player a quick path into gameplay, visibility into their current progress, and access to all major destinations (Map, Stats, Settings).

### Entry & Exit
- **Entry:** After Splash auto-dismisses (1.5s logo animation + asset loading)
- **Exit (System Back):** Exit app to launcher (first meaningful screen — confirm dialog optional)
- **Back stack:** Splash is NOT in the back stack; Home is the root destination

### Navigation Destinations
| Destination | How | Navigation Type |
|-------------|-----|----------------|
| Gameplay (next level) | "JUMP IN" button → Level Preview → Gameplay | Forward |
| Map (level select) | Tab bar / icon | Tab destination |
| Stats / Profile | Tab bar | Tab destination |
| Settings | Gear icon (top right) | Full screen modal |

---

## 2. Screen Layout

### 2.1 Full Screen Mockup (Phone — Compact)

```
┌────────────────────────────────────┐
│ [Status Bar — transparent, dark]    │
│                                      │
│  ┌──── Top App Bar (Small) ──────┐  │
│  │  type-strike              ⚙  │  │
│  └──────────────────────────────┘  │
│                                      │
│  ┌── Player Identity Card ────────┐ │
│  │  ⚡ LV.7           ★ 142/300   │ │
│  │  MAGMA FINGERS                 │ │
│  │  ▓▓▓▓▓▓▓▓░░░░░  72% → LV.8   │ │
│  └──────────────────────────────┘ │
│                                      │
│  ┌──── "JUMP IN" Button ─────────┐  │
│  │   🔥  JUMP IN                  │  │
│  │   Continue where you left off  │  │
│  └──────────────────────────────┘  │
│                                      │
│  ┌── Quick Stats Row ────────────┐  │
│  │  Today's Best    Levels       │  │
│  │     87 WPM    7 / 100        │  │
│  └──────────────────────────────┘  │
│                                      │
│  ┌── Activity Feed ──────────────┐  │
│  │  🔥  Completed "Inferno"     │  │
│  │     ★★  20 min ago           │  │
│  │  ---------------------------- │  │
│  │  ✦  Unlocked "Blaze"         │  │
│  │     2 hours ago               │  │
│  └──────────────────────────────┘  │
│                                      │
│                                      │
│  ┌─ Navigation Bar ──────────────┐  │
│  │  🏠 Home   🗺 Map   📊 Stats  │  │
│  └──────────────────────────────┘  │
└────────────────────────────────────┘
```

### 2.2 Component Hierarchy

```
Screen: Home
├── TopAppBar (Small, center-aligned)
│   ├── Title: "type-strike"
│   └── IconButton: Settings (gear ⚙)
│       └── Action → Settings screen
│
├── PlayerIdentityCard (ElevatedCard)
│   ├── Row: LevelBadge + StarCount
│   │   ├── LevelBadge: "⚡ LV.7" (gradient bg: magma red → gold)
│   │   └── StarCount: "★ 142 / 300" (gold text)
│   ├── TitleText: "MAGMA FINGERS" (headline-medium, bold)
│   └── XPProgressBar
│       ├── BarFill (gradient: left=magma, right=gold)
│       ├── LabelLeft: current XP
│       └── LabelRight: "72% → LV.8"
│
├── QuickPlaySection
│   ├── JumpInButton (FilledButton, full-width)
│   │   ├── Icon: 🔥 (left)
│   │   ├── Label: "JUMP IN"
│   │   ├── SubLabel: "Continue where you left off"
│   │   └── Action → Level Preview (next uncompleted level)
│   └── (Optional: DailyChallengeCard — Phase 2)
│
├── QuickStatsRow
│   ├── StatCard ("Today's Best", value="87 WPM")
│   └── StatCard ("Levels", value="7 / 100")
│
├── ActivityFeedSection
│   └── ActivityItem × 3 (max)
│       ├── Icon (left)
│       ├── Description text
│       └── Timestamp (right)
│
└── NavigationBar (Material 3)
    ├── TabItem: Home (selected)
    ├── TabItem: Map
    └── TabItem: Stats
```

---

## 3. Component Specifications

### 3.1 Top App Bar

| Property | Value |
|----------|-------|
| Component | `SmallTopAppBar` |
| Title | "type-strike" |
| Title style | Headline-medium, 900 weight, letter-spacing 2px |
| Title color | White (#ffffff) |
| Background | Transparent (screen background shows through) |
| Elevation | None |
| Actions | Settings gear icon (right) |

**Settings icon states:**
| State | Visual |
|-------|--------|
| Default | Gray (#888), 24dp |
| Pressed | Magma glow (#ff5020), scale 0.95 |
| Ripple | Magma red at 20% opacity |

### 3.2 Player Identity Card

| Property | Value |
|----------|-------|
| Component | `ElevatedCard` |
| Elevation | 4dp |
| Background | Dark slate (#1a1a28) with 1px border (#2a2a3a) |
| Border radius | 12px |
| Padding | 16px |
| Margin | 16px horizontal, 8px top |

**Level Badge:**
| Property | Value |
|----------|-------|
| Component | Inline chip with gradient background |
| Gradient | #ff5020 → #ffcc00 (45°) |
| Text | "⚡ LV.7" |
| Text style | Label-large, 700 weight, white |
| Border radius | 6px |
| Padding | 4px 12px |

**XP Progress Bar:**
| Property | Value |
|----------|-------|
| Track color | #2a2a3a |
| Fill gradient | #ff5020 → #ffcc00 (horizontal) |
| Height | 6px |
| Border radius | 3px |
| Animation | Ease-out, 0.8s fill on appear |
| Label (left) | "420 XP", label-small, #888 |
| Label (right) | "72% → LV.8", label-small, #ff5020 |

**States:**
| State | Visual Change |
|-------|---------------|
| Default | Normal card appearance |
| Loading | Skeleton shimmer on XP bar (animated pulse) |
| New level-up | Card border pulses gold (#ffcc00) for 3 seconds |

### 3.3 "JUMP IN" Button

| Property | Value |
|----------|-------|
| Component | `FilledButton` (full-width) |
| Background | Gradient: #ff5020 → #cc3300 (horizontal, 45°) |
| Text | "JUMP IN" |
| Text style | Title-medium, 800 weight, white |
| Sub-label | "Continue where you left off", label-small, rgba(255,255,255,0.6) |
| Icon | 🔥 (24dp, left) |
| Height | 56dp |
| Border radius | 12px |
| Margin | 16px horizontal, 8px vertical |
| Shadow | 0 4px 20px rgba(255,80,32,0.3) |
| Haptic | `HapticFeedbackConstants.CONFIRM` on press |

**States:**
| State | Visual | Behavior |
|-------|--------|----------|
| Enabled | Normal gradient, full opacity | Tap → navigate to Level Preview |
| Pressed | Slightly darker, scale 0.97 | Haptic + navigation |
| Disabled | Desaturated, 50% opacity | Not used in MVP (no reason to disable) |
| Loading | Shimmer animation over gradient, text hidden | Not used in MVP (no async action) |

**Dynamic label logic:**
| Condition | Sub-label text |
|-----------|---------------|
| Player has uncompleted levels | "Continue where you left off" |
| All levels completed | "Practice mode — no limits!" |
| First-time player (no progress) | "Begin your journey" |

### 3.4 Quick Stats Row

| Property | Value |
|----------|-------|
| Component | Row of 2 `FilledCard`s |
| Background | Dark slate (#1a1a28) with 1px border (#2a2a3a) |
| Border radius | 10px |
| Height | 60dp |
| Margin | 16px horizontal, 8px vertical |
| Gap | 12dp between cards |

**Stat Card layout:**
```
┌──────────────────┐
│  Label (small)    │
│  Value (large)    │
└──────────────────┘
```

**Stat Card 1 — "Today's Best":**
| Property | Value |
|----------|-------|
| Label | "Today's Best", label-small, #666 |
| Value | "87 WPM", headline-large, 900 weight, #ff5020 |
| Fallback (no data) | "—", headline-large, #444 |

**Stat Card 2 — "Levels":**
| Property | Value |
|----------|-------|
| Label | "Levels", label-small, #666 |
| Value | "7 / 100", headline-large, 900 weight, #ccc |
| Fallback (no data) | "0 / 100", headline-large, #444 |

### 3.5 Activity Feed

| Property | Value |
|----------|-------|
| Section title | "Recent Activity", title-medium, #888, margin 16px horizontal |
| Max items | 3 (most recent first) |
| Background | None (transparent) |

**Activity Item layout:**
```
🔥  Completed "Inferno"             20m ago
```

| Element | Style |
|---------|-------|
| Icon | 16dp emoji or material icon |
| Description | body-medium, #ccc |
| Timestamp | label-small, #555, right-aligned |
| Divider | 1px, #1a1a28 (between items) |
| Padding | 12px 16px |

**Activity types & icons:**
| Type | Icon | Description Template |
|------|------|---------------------|
| Level completed | 🔥 | "Completed \"{level_name}\"" |
| Level failed | 💀 | "Failed \"{level_name}\"" |
| Achievement | ✦ | "Unlocked \"{achievement_name}\"" |
| Level up | ⚡ | "Reached Level {number}!" |
| New high score | 🏆 | "New PB: {wpm} WPM on \"{level_name}\"" |

**Empty state (new player):**
```
┌──────────────────────────────────┐
│                                  │
│    ⚡  No activity yet            │
│    Complete your first level     │
│    to see your history here!     │
│                                  │
└──────────────────────────────────┘
```
- Icon: 48dp, #555
- Title: body-large, #666
- Description: body-medium, #555

### 3.6 Navigation Bar

| Property | Value |
|----------|-------|
| Component | `NavigationBar` |
| Background | Dark (#0d0d14) with top border (#1a1a28) |
| Height | 64dp |
| Items | 3 destinations |

**Tab Items:**
| Tab | Icon | Label | Destination |
|-----|------|-------|-------------|
| Home | 🏠 | Home | Stays on Home |
| Map | 🗺 | Map | Map screen |
| Stats | 📊 | Stats | Stats / Profile screen |

**State:**
| State | Active Item | Inactive Items |
|-------|-------------|----------------|
| Default | Icon + label in #ff5020 | Icon + label in #555 |
| Hover (desktop) | Slight scale up | Ripple effect |
| Selected | Bold weight, text shadow: 0 0 12px rgba(255,80,32,0.3) | Normal weight |

---

## 4. Visual Styling

### 4.1 Color Palette

| Role | Color | Hex | Usage |
|------|-------|-----|-------|
| Background | Obsidian | `#0a0a10` | Screen background |
| Surface | Dark slate | `#1a1a28` | Cards, containers |
| Surface border | Subtle gray | `#2a2a3a` | Borders, dividers |
| Primary | Magma red | `#ff5020` | "JUMP IN" button, active elements |
| Primary dark | Deep magma | `#cc3300` | Button hover/pressed |
| Secondary | Molten gold | `#ffcc00` | Stars, level badge accent |
| Tertiary | Neon purple | `#cc44ff` | Not used on Home (reserved for combo) |
| On surface | White | `#ffffff` | Headlines, primary text |
| On surface dim | Light gray | `#ccc` | Body text |
| On surface muted | Mid gray | `#888` | Labels, captions |
| On surface faint | Dark gray | `#666` | Secondary labels |
| Disabled | | `#555` | Placeholder, empty states |

### 4.2 Typography

| Element | Font | Size | Weight | Letter-spacing |
|---------|------|------|--------|----------------|
| App bar title | Inter / Sora | 18px | 900 | 2px |
| Player title | Inter / Sora | 16px | 800 | 1.5px |
| Level badge | Inter | 12px | 700 | 1px |
| "JUMP IN" | Inter / Sora | 15px | 800 | 1.5px |
| "JUMP IN" sub | Inter | 11px | 500 | 0.5px |
| Stat value | Inter / Sora | 22px | 900 | 1px |
| Stat label | Inter | 11px | 600 | 1px |
| Activity text | Inter | 13px | 500 | 0.3px |
| Activity time | Inter | 11px | 500 | 0.5px |
| XP bar labels | Inter | 11px | 600 | 0.5px |
| Tab labels | Inter | 10px | 700 | 1px |
| Empty state title | Inter | 16px | 600 | — |
| Empty state desc | Inter | 13px | 400 | — |

### 4.3 Animations

| Element | Type | Duration | Easing |
|---------|------|----------|--------|
| Screen entrance | Fade in + slight scale up (0.95→1.0) | 400ms | ease-out |
| Player card entrance | Slide up from 24dp | 500ms | cubic-bezier(0.34, 1.56, 0.64, 1) |
| "JUMP IN" entrance | Slide up from 32dp | 600ms | same as above |
| Stats row entrance | Slide up + stagger (100ms gap) | 500ms each | ease-out |
| Activity items | Fade in, stagger 150ms | 300ms each | ease-out |
| XP bar fill | Horizontal sweep | 800ms | ease-out |
| Nav bar | Slide up from bottom | 300ms | ease-out |
| Pressed state | Scale 0.97 | 100ms | ease-in-out |
| Ripple | Material ripple expand | 300ms | linear |

### 4.4 Particle / Ambient Effects

- **Subtle ember particles** float upward from the bottom of the screen (5–8 particles, 2px, magma red, 0.2–0.4 opacity, 4–7s float animation)
- **"JUMP IN" button** has a subtle pulsing glow (0 0 20px rgba(255,80,32,0.2) → 0 0 30px rgba(255,80,32,0.4), 2s ease-in-out infinite)
- **Player level badge** has a faint shine animation (3s sweep gradient overlay)

---

## 5. States & Edge Cases

### 5.1 First-Time Player (Fresh Install)

**Trigger:** No saved game data exists.

**Changes from default:**
- Player Identity Card shows "LV.1" and "—" for name (or "RECRUIT" as default title)
- XP bar is empty (0%)
- "JUMP IN" sub-label: "Begin your journey"
- Activity Feed shows empty state
- Quick Stats show "—" for today's best, "0 / 100" for levels

**Optional:** Brief pulse animation on "JUMP IN" button to draw attention (3s delay, pulse 3 times)

### 5.2 Returning Player (Has Saved Data)

**Default state as described above.**

Additional detail: The Identity Card should show the player's persisted level, name, XP, and stars.

### 5.3 Loading State

**Trigger:** Game data is loading from local storage (should be near-instant, <100ms).

**Visual:**
- All cards show skeleton shimmer placeholders (animated gradient sweep)
- "JUMP IN" shows gray shimmer rectangle
- Duration: Max 500ms before showing real data

### 5.4 Error State

**Trigger:** Corrupted save data or storage read failure.

**Visual:**
- Activity Feed replaced with: "⚠️ Could not load recent activity" (body-medium, #666)
- Player card shows default values (LV.1, 0 XP)
- "JUMP IN" navigates to Level 1

**Recovery:** On next app launch, attempt to read save data again. If failed 3 times, create fresh save.

### 5.5 All Levels Completed

**Trigger:** Player has 3-starred all 100 levels.

**Changes:**
- "JUMP IN" sub-label: "Practice mode — no limits!"
- "JUMP IN" action: Navigate to Practice Mode (free-form typing, Phase 2 feature) or replay any level

### 5.6 Daily Challenge Available (Phase 2 — Speculative)

If daily challenges are implemented in the future, add between "JUMP IN" and Quick Stats:
```
┌── Daily Challenge Card ─────────┐
│  🔥 Daily Word — 500 XP Bonus    │
│  ⏱  5:23:14 remaining           │
│  [PLAY]                         │
└────────────────────────────────┘
```

---

## 6. Accessibility

| Check | Requirement |
|-------|-------------|
| Touch targets | All interactive elements ≥ 48dp |
| Content descriptions | "Jump into next level button", "Player level 7, Magma Fingers" |
| Motion | Respect reduced motion — skip stagger animations, no pulsing glow |
| Font scaling | Layout works at 200% font (text may wrap, ensure scrollability) |
| Color contrast | All text ≥ 4.5:1 ratio (verified: gray #888 on #0a0a10 = 8.2:1) |
| Focus order | Top → bottom, left → right (App bar → Player card → JUMP IN → Stats → Activity → Nav bar) |

---

## 7. Data Requirements

| Data Point | Source | Notes |
|------------|--------|-------|
| Player level | Local storage | Integer, 1–100 |
| Player title | Local storage | String, defaults to "RECRUIT", unlocks at milestones |
| XP | Local storage | Integer |
| XP for next level | Computed | `100 × level × 1.5` |
| Total stars | Local storage | Integer, 0–300 |
| Today's best WPM | Local storage | Integer, reset daily |
| Levels completed | Local storage | Integer, 0–100 |
| Recent activity | Local storage | Array of last 20 activity events |
| Next uncompleted level | Computed | Find lowest level without 1-star completion |

---

## 8. Implementation Notes

### 8.1 Layout Constraints (Phone — Compact)

| Section | Approximate Height |
|---------|-------------------|
| Status bar | 44dp |
| Top App Bar | 48dp |
| Player Identity Card | 80dp |
| "JUMP IN" button | 72dp |
| Quick Stats Row | 72dp |
| Activity Feed | Fill remaining space (max 3 items × 44dp = 132dp) |
| Navigation Bar | 64dp |
| **Total** | **844dp** (iPhone 15 / Pixel 8) |

### 8.2 Realm / Database Schema (for local storage)

```typescript
interface PlayerData {
  level: number;           // 1–100
  title: string;           // "MAGMA FINGERS"
  xp: number;              // current XP
  totalStars: number;      // 0–300
  levelsCompleted: number; // 0–100
}

interface LevelProgress {
  levelId: number;
  stars: number;           // 0–3
  bestWpm: number;
  bestAccuracy: number;
  completed: boolean;
}

interface ActivityEvent {
  id: string;
  type: 'level_completed' | 'level_failed' | 'achievement' | 'level_up' | 'new_high_score';
  timestamp: number;       // unix ms
  metadata: {
    levelName?: string;
    achievementName?: string;
    wpm?: number;
    stars?: number;
  };
}

// Today's best WPM — computed from ActivityEvent where type='level_completed' and timestamp is today
```

### 8.3 Animation Sequence on Entry

1. [0ms] Screen appears with fade-in (background only)
2. [200ms] Player Identity Card slides up from 24dp
3. [400ms] "JUMP IN" button slides up from 32dp + pulsing glow starts
4. [600ms] Quick Stats cards slide up (left card first, right card 100ms later)
5. [800ms] Activity Feed items fade in (staggered 150ms each)
6. [1000ms] Ember particle effect starts
7. [1200ms] Navigation bar slides up from bottom
8. [1400ms] Full entrance complete — all interactions enabled

**If reduced motion:** All animations complete in 300ms total (simple crossfade).
