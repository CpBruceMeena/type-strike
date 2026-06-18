# type-strike — Android Design Evaluation
**Date:** 2026-06-17  
**Designer:** Senior Android UI/UX Designer (Material Design 3)  
**Status:** Evaluation Complete — Recommendations Ready

---

## Executive Summary

type-strike's current design (3 screens: Map, Gameplay, Victory) has a strong visual identity but is **missing critical Android navigation structure, state handling, and platform-conformant screens**. The arcade-game presentation works well, but several Android-specific patterns need to be overlaid to match user expectations.

This evaluation identifies:
- **4 missing screens** needed for MVP
- **11 improvements** to existing screen designs
- **Full user flow** with back navigation behavior
- **Material 3 adaptation strategy** for the existing arcade visual identity

---

## Part 1: Navigation Architecture

### Current Navigation (simplified wireframe)

```
Map ──tab──→ Gameplay ←──tab── Stats
  │              │
  └──settings──→ Settings (icon)
                   
Victory (overlay on Gameplay)
```

### Problems
1. **No clear app entry point** — no Splash or Home screen
2. **Tab bar is misapplied** — PLAY tab restarts the level every time
3. **No back navigation defined** — system back gesture behavior is not specified
4. **Stats screen is a placeholder** — tab exists but no design
5. **Level details have no dedicated screen** — tap on node should show a preview modal/screen
6. **Level Failed state has no screen** — described in features but not implemented

### Recommended Navigation Architecture

```
Splash (brand + loading)
  │
  ▼
Home (new screen — Play, Stats, Settings entry points)
  │
  ├──→ Map (level progression, vertical scroll)
  │       │
  │       ├──→ Level Preview (bottom sheet — new)
  │       │       │
  │       │       └──→ Gameplay Arena
  │       │               │
  │       │               ├──→ Victory Assessment (overlay)
  │       │               │       └──→ Map / Play Again / Next Level
  │       │               │
  │       │               └──→ Level Failed (overlay — new)
  │       │                       └──→ Retry / Map
  │       │
  │       └──→ Settings (full screen — new)
  │
  ├──→ Stats / Profile (new screen)
  │
  └──→ Achievements (new screen)
```

### Back Navigation Behavior

| Current Screen | Action | Destination | Notes |
|----------------|--------|-------------|-------|
| Splash | Auto-dismiss | Home | Never in back stack |
| Home | System Back | Exit app (launcher) | First meaningful screen |
| Map | System Back | Home | Or exit if Home skipped |
| Level Preview | System Back | Map | Dismiss bottom sheet first |
| Gameplay | System Back | Map | Save progress to current word |
| Victory | System Back | Map | Close overlay, go to map |
| Level Failed | System Back | Map | Close overlay, go to map |
| Settings | System Back | Previous screen | Map or Home |
| Stats | System Back | Home | |
| Achievements | System Back | Stats or Home | |

### Predictive Back Gesture (Android 14+)

- **Map → Home:** Show tile layout fading into home with player summary
- **Gameplay → Map:** Show the map with current level highlighted (not full scroll)
- **Settings → Map:** Side-swipe showing map behind translucent settings

---

## Part 2: Missing Screens (MVP Critical)

### Screen 4: Home / Dashboard (NEW — P0)

**Purpose:** First screen after splash. Gives the player a choice of what to do.

**Layout (top to bottom):**
- **Player identity:** Level badge + title + total stars (smaller than map header)
- **Quick-play button:** "JUMP IN" — large filled button that auto-selects the next uncompleted level
- **Daily Challenge card:** If implemented — "Daily word — 500 XP bonus" with a countdown
- **Stats preview row:** Today's best WPM, total levels cleared, current streak
- **Bottom nav bar:** MAP | PLAY | STATS (same as current tab bar)

**Android M3 mapping:**
- Top App Bar: `Small` (center-aligned title: "type-strike")
- Bottom: `NavigationBar` with 3 destinations
- Quick-play: `FilledButton` (tonal)
- Daily challenge: `ElevatedCard`

### Screen 5: Level Preview / Bottom Sheet (NEW — P1)

**Purpose:** Show level details before the player commits to playing.

**Trigger:** Tap an unlocked/completed level node on the map.

**Layout (bottom sheet, 50% height):**
- Handle bar at top
- Level name + tier badge (e.g., "MAGMA'S EDGE · Tier 2")
- Difficulty indicator: 3 crystal shards (filled = harder)
- Target metrics: "PASS: 35 WPM · 90% ACC"
- Best score: "BEST: 52 WPM · 96% ACC ★★"
- Word preview: 3 sample words from the level
- CTA: "STRIKE" — large filled button

**Android M3 mapping:**
- Component: `BottomSheet` (standard, peek height = 50%)
- CTA: `FilledButton` with icon
- Metrics: Chips or small cards

**Back navigation:** System back → dismiss sheet

### Screen 6: Stats / Profile (NEW — P2)

**Purpose:** Player's lifetime stats, achievements, and word milestones.

**Layout:**
- **Header:** Player level + XP bar + title
- **Stat cards (2-column grid):**
  - Total WPM best
  - Average accuracy
  - Levels completed (X/100)
  - Total words typed
  - Best streak
  - Play time (hours)
- **Achievement preview:** Last 3 unlocked achievements with "VIEW ALL" link
- **Word milestones:** 1K, 10K, 100K typed — with progress bar
- **Bottom nav bar:** MAP | PLAY | STATS (STATS highlighted)

**Android M3 mapping:**
- Top App Bar: `Medium` (title collapses to small)
- Stat cards: `FilledCard` in a 2-column `LazyVerticalGrid`
- Achievement: `ListTile` with leading icon + trailing chip

### Screen 7: Level Failed Overlay (NEW — P1)

**Purpose:** Handles the failure state distinctly from victory.

**Layout:**
- Metal brackets (same as victory)
- Badge: "LEVEL BREACHED" in red gradient
- Metrics shown (WPM, Accuracy) in red tint — lower opacity, smaller scale
- "Requirements not met" label
- XP earned shown (partial — for words typed)
- Two buttons:
  - **RETRY** — primary (filled, red variant)
  - **BACK TO MAP** — tertiary (text button)

**Android M3 mapping:**
- Component: `AlertDialog` with custom content layout
- No trophies or celebration animations
- Color role: `error` palette

---

## Part 3: Existing Screen Improvements

### Screen 1: Map Screen — Improvements

| Issue | Fix | Priority |
|-------|-----|----------|
| **No level preview on tap** | Add tap → bottom sheet (see Screen 5 above) | P0 |
| **No "first-time" state** | Add pulsing arrow on current level; brief tutorial card | P1 |
| **Back navigation undefined** | System back → Home screen (if Home exists) or exit | P0 |
| **Settings gear icon** | Make this a full-screen Settings, not a modal | P1 |
| **No pull-to-refresh** | Add swipe-down on map to refresh/resync progress | P2 |
| **Scrolling performance** | Virtualize level nodes (only render visible + buffer) | P0 |
| **No "tier" dividers** | Add labeled fracture zones: "EMBER", "IGNEOUS", "MAGMA CORE", "OBSIDIAN" | P1 |

### Screen 2: Gameplay Arena — Improvements

| Issue | Fix | Priority |
|-------|-----|----------|
| **Back navigation resets game** | Save word progress; back → map with "resume" prompt | P0 |
| **Tab bar visible during gameplay** | Hide tab bar during active play; show only after level ends | P0 |
| **Combo gauge on right edge** | Possible conflict with system back gesture (edge swipe) | P1 |
| **No keyboard haptics on Android** | Use `HapticFeedbackConstants` (Vibrator) for keypress | P0 |
| **No landscape orientation** | Add landscape support (wider keyboard, side panels) | P2 |
| **Keyboard overlaps with navigation gestures** | Use `WindowInsets` to account for gesture navigation bar | P0 |
| **Word panel too tall on compact screens** | Make panel height responsive (40% of available space below header) | P1 |

### Screen 3: Victory Assessment — Improvements

| Issue | Fix | Priority |
|-------|-----|----------|
| **No sound toggle / skip** | Add tap-to-skip on animation sequence | P1 |
| **Buttons too close together** | Minimum 48dp touch targets; 16dp between buttons | P0 |
| **No "share score" option** | Add share button that generates a social card image | P2 |
| **XP arc bar precision** | Show exact XP numbers | P1 |
| **No haptic on trophy slam** | Add vibration on each trophy slam (3 pulses) | P1 |

---

## Part 4: Material Design 3 Adaptation Strategy

### Dynamic Color vs. Fixed Arcade Palette

type-strike's arcade identity is built on a **fixed palette** (obsidian, magma red, gold, neon purple). This conflicts with Material 3's dynamic color system (colors extracted from wallpaper).

**Strategy: Hybrid Approach**
1. **Game surfaces** (word panel, keycaps, combo gauge, particle effects) use the fixed arcade palette — these are the "game world"
2. **System surfaces** (top app bar, navigation bar, settings panels, bottom sheets) use Material 3 surface colors — these are the "shell"
3. **Accents on system surfaces** can optionally map to dynamic color for personalization

```
┌─────────────────────────────────┐
│  System Shell (M3 Dynamic)      │  ← Top App Bar, Nav Bar, Status Bar
│  ┌───────────────────────────┐  │
│  │  Game World (Arcade       │  │  ← The core gameplay experience
│  │  Fixed Palette)           │  │
│  │  ┌─────────────────────┐  │  │
│  │  │  Word Panel         │  │  │
│  │  │  Keycaps            │  │  │
│  │  │  Combo Gauge        │  │  │
│  │  │  Particles          │  │  │
│  │  └─────────────────────┘  │  │
│  └───────────────────────────┘  │
│                                   │
│  Settings / Stats (M3 Dynamic)    │  ← System panels
└─────────────────────────────────┘
```

### Color Role Mapping

| M3 Color Role | type-strike Mapping | When |
|---------------|---------------------|------|
| `primary` | Magma red (#ff5020) | Game buttons, active elements |
| `on-primary` | White | Text on primary |
| `primary-container` | Magma red at 12% opacity | Selected state backgrounds |
| `secondary` | Molten gold (#ffcc00) | Stars, trophies, streak highlights |
| `tertiary` | Neon purple (#cc44ff) | Special effects, "Critical Combo!" text |
| `surface` | Obsidian (#0d0d14) | Main backgrounds |
| `surface-variant` | Dark slate (#1a1a28) | Card backgrounds, containers |
| `background` | Very dark (#0a0a10) | Screen backgrounds |
| `error` | Red (#ff2200) | Incorrect input, failure states |
| `outline` | Subtle gray (#2a2a3a) | Dividers, borders |

### Typography

| M3 Role | type-strike | Size/Weight |
|---------|-------------|-------------|
| `display-large` | "LEVEL BURNT" | 32px, 900 weight |
| `display-medium` | WPM/Accuracy numbers | 28px, 900 weight |
| `headline-large` | Level name | 24px, 800 weight |
| `headline-medium` | Section headers | 20px, 700 weight |
| `title-large` | Badge text | 18px, 700 weight |
| `title-medium` | Button text | 14px, 700 weight |
| `body-large` | Labels, stats | 16px, 600 weight |
| `body-medium` | Body text | 14px, 500 weight |
| `label-small` | Tab labels, captions | 11px, 600 weight, uppercase |

**Font recommendation for Android:** Use a variable font that supports the sharp geometric style. Options:
- **Inter** (free, excellent geometric, variable weight)
- **Sora** (more display-oriented, sharp angles)
- **Montserrat** (geometric, wide availability)

---

## Part 5: Android-Specific Gesture Handling

### System Back Gesture

| Location | Current Behavior | Required Behavior |
|----------|-----------------|-------------------|
| Map → Home | N/A (no Home screen) | Show predictive back preview of home/dashboard |
| Gameplay → Map | Immediately switches to map | Save current word progress; show "GAME PAUSED" overlay briefly |
| Victory (overlay) | N/A (overlay not handled) | Dismiss overlay → Map |
| Level Failed (overlay) | N/A | Dismiss overlay → Map |
| Settings | N/A | Save settings → previous screen |

### Edge Swipe Conflicts

The **combo gauge** sits on the right edge of the gameplay screen. Android's system back gesture is a right-edge swipe.

**Mitigation:**
- During active gameplay, consume the right-edge touch in the combo gauge area
- After 1 second of inactivity, release edge consumption to allow system back
- Alternative: Move combo gauge slightly inward (16dp from edge) with a dead zone

### Pull to Refresh

- **Map screen:** Swipe down → gentle plasma pulse animation → refresh level data
- **Stats screen:** Swipe down → recalculate stats from local storage

### Long Press

- **Level node on map:** Long press → show a tooltip with level name and best score (accessibility)
- **Keycap in settings preview:** Long press → show keycap name and sound type

### Haptic Feedback Patterns

| Event | Android API | Pattern |
|-------|-------------|---------|
| Correct keystroke | `HapticFeedbackConstants.KEYBOARD_TAP` | Single short tick |
| Incorrect keystroke | `HapticFeedbackConstants.REJECTION` | Double buzz |
| Word complete (shatter) | `performHapticFeedback(CLOCK_TICK)` × 3 | Rapid triple tick |
| Combo milestone reached | Custom vibration: 100ms, pause 50ms, 200ms | Two-stage pulse |
| Trophy slam (victory) | Custom: 300ms heavy | Long heavy thud |
| Level failed | Custom: 200ms heavy | Single buzz |

---

## Part 6: Form Factor Support

### Phone (Compact < 600dp) — PRIMARY TARGET

| Aspect | Implementation |
|--------|---------------|
| Orientation | Portrait primary, landscape optional |
| Navigation | Bottom Navigation Bar (3 items) |
| Keyboard | Split thumb keyboard, chiseled keycaps |
| Victory | Full-screen overlay |
| Level Preview | Bottom sheet (50% height) |

### Foldable — Folded (Compact)

- Same as phone for outer display (cover screen)
- Inner display (unfolded): see tablet layout

### Foldable — Unfolded (Medium 600–840dp)

- Navigation: Switch from bottom bar to **Navigation Rail** (left side)
- Map: Two-column — level list on left, level preview on right
- Gameplay: Wider keyboard zone; word panel can sit on the side
- Victory: Toast notification + auto-return to map (less intrusive)

### Tablet (Expanded > 840dp)

- Navigation: **Navigation Rail** (left) + content area
- Map: Full two-panel layout — level list (left) + detailed preview (right)
- Gameplay: Side-by-side — word panel (left), keyboard (right center), combo gauge (far right)
- Stats: Multi-column grid (3 columns of stat cards)
- Landscape: Preferred orientation for tablet

### Window Size Class Breakpoints

```
Width < 600dp  → Compact  → Phone layout
Width 600–840dp → Medium → Foldable / Tablet portrait
Width > 840dp  → Expanded → Tablet landscape / Desktop
```

---

## Part 7: Accessibility (TalkBack + Switch Access)

### Touch Targets

| Element | Current Size | Required (48dp min) | Fix |
|---------|-------------|---------------------|-----|
| Level nodes | 36dp | 48dp | Increase dot + add padding |
| Keyboard keys | 30dp × 40dp | 48dp × 48dp | Increase key size; reduce gap compensation |
| Tab buttons | ~40dp | 48dp | Add padding |
| Trophy shards | 48dp | 48dp | OK (barely) |
| Victory buttons | OK (56dp+) | 48dp | OK |
| Settings icon | ~24dp | 48dp | Add 12dp padding each side |

### Content Descriptions (TalkBack)

| Element | Description |
|---------|-------------|
| Level node (unlocked) | "Level [number]: [name]. Unlocked. [N] stars." |
| Level node (locked) | "Level [number]: [name]. Locked." |
| Combo gauge | "Combo streak: [N]. [Title] level." |
| Trophy shard | "[N] of 3 stars achieved." |
| Keyboard key | "[Letter] key" |
| Shatter particle | Visual only — no description needed |

### Motion Sensitivity

| Area | Implementation |
|------|---------------|
| Kinetic text animations | Use `animate*()` with `durationScale` from system settings |
| Trophy slam animations | Respect `animator_duration_scale` |
| Combo gauge plasma effect | Respect reduced motion setting — static gradient instead |
| Particle effects | Offer "Reduced particles" in accessibility settings |
| Screen shake | Disable entirely when reduced motion is on |

### Color Contrast

| Pair | Ratio | Pass? |
|------|-------|-------|
| Magma red (#ff5020) on obsidian (#0d0d14) | ~10.5:1 | ✅ Pass (AAA) |
| Gold (#ffcc00) on obsidian | ~12.5:1 | ✅ Pass (AAA) |
| White text on magma red (#ff5020) | ~3.7:1 | ❌ Fail (AA requires 4.5:1) |
| Gray (#888) on obsidian (#0d0d14) | ~8.2:1 | ✅ Pass (AA) |
| Purple (#cc44ff) on obsidian (#0d0d14) | ~9.8:1 | ✅ Pass (AA) |

**Fix for white-on-magma-red:** Use darker red (#cc3300) as button background when white text is used, OR use very light orange (#ffaa55) for text on #ff5020.

---

## Part 8: Edge Cases & Configuration Changes

### Rotation
- **Map:** Portrait-only (content is vertical-scrolling)
- **Gameplay:** Portrait-primary; landscape supported as adaptive layout
- **Stats:** Portrait + landscape (reflows grid)
- **Settings:** Any orientation

### Multi-Window Mode
- **Map:** Shrink to compact mode; hide non-essential decorative elements
- **Gameplay:** Pause the game; show "TAB SWITCHED — RESUME" overlay
- **Stats:** OK in any size

### Dark Mode
- **Default:** Always dark (game is dark-themed by design)
- **System dark mode:** Match system (still dark, but may adjust for OLED)
- **No light mode:** The arcade aesthetic requires a dark canvas

### Font Scale (200%)
- **Map:** Level node names may truncate — use ellipsis
- **Gameplay:** Word panel font should scale but max at 48dp (use ellipsis for very long words)
- **Victory:** Metrics scale to 200% maximum; stack vertically if side-by-side breaks
- **Keyboard:** Key labels scale but key hitboxes remain the same (purely visual scaling)

### Keyboard Open State
- **Gameplay:** Keyboard is always visible (custom keyboard) — no IME interference
- **Settings:** Text fields for username/search may open system keyboard — ensure form scrolls into view

---

## Part 9: Complete User Flow with All Screens

```
[Splash]
  Auto-dismiss (1.5s) | Logo animation | Loading indicator
  │
  ▼
[Home / Dashboard]  ← entry point
  ├── "JUMP IN" → auto-select next uncompleted level
  │              └──→ [Level Preview (bottom sheet)]
  │                      └──→ "STRIKE" → [Gameplay]
  ├── Map icon → [Map]
  ├── Stats tab (bottom nav) → [Stats]
  └── Settings gear (top right) → [Settings]
  
[Map]
  ├── Tap level node (unlocked/completed) → [Level Preview (bottom sheet)]
  │                                          └──→ "STRIKE" → [Gameplay]
  ├── Tap locked node → Tooltip: "Clear level [N-1] to unlock"
  ├── Settings gear (top right) → [Settings]
  └── System back → [Home] or exit
  
[Level Preview (bottom sheet)]
  ├── "STRIKE" → [Gameplay]
  ├── Swipe down / System back → [Map]
  └── Tap outside sheet → [Map]
  
[Gameplay]
  ├── Complete level → [Victory (overlay)]
  │                     ├── "PLAY AGAIN" → [Gameplay] (same level)
  │                     ├── "NEXT LEVEL" → [Gameplay] (next level)
  │                     └── "BACK TO MAP" → [Map]
  ├── Fail level → [Level Failed (overlay)]
  │                 ├── "RETRY" → [Gameplay] (same level)
  │                 └── "BACK TO MAP" → [Map]
  ├── System back → Save progress, show brief pause overlay, → [Map]
  └── Combo gauge right-edge → Consumed during gameplay (back gesture re-enabled after idle)
  
[Victory (overlay)]
  ├── Auto-dismiss animation (3s) → Manual interaction after
  ├── "PLAY AGAIN" → [Gameplay] (same level)
  ├── "NEXT LEVEL" → [Gameplay] (next level)
  ├── "BACK TO MAP" → [Map]
  └── System back → [Map]
  
[Level Failed (overlay)]
  ├── "RETRY" → [Gameplay] (same level)
  ├── "BACK TO MAP" → [Map]
  └── System back → [Map]
  
[Stats]
  ├── Achievement row → "VIEW ALL" → [Achievements]
  ├── Word milestone → Tap → [Word History]
  └── System back → [Home]
  
[Achievements]
  ├── Grid of achievements (locked/unlocked)
  └── System back → [Stats]
  
[Settings]  ← Full screen
  ├── Keyboard: Layout (QWERTY/AZERTY/QWERTZ), Key size (S/M/L)
  ├── Sound: Key click type (Blue/Brown/Red/Linear), Volume sliders
  ├── Haptics: On/Off, Intensity slider
  ├── Visual: Reduced particles, Keycap glow intensity
  ├── Accessibility: Font size, High contrast, Left-handed mode
  └── System back → Previous screen (Map or Home)
```

---

## Part 10: Priority Recommendations for MVP

### P0: Must Fix Before Launch

1. **Add Home/Dashboard screen** — current flow lacks an app entry point
2. **Fix back navigation behavior** on all screens (especially Gameplay)
3. **Hide tab bar during gameplay** — prevents accidental tab switches mid-level
4. **Add haptic feedback** for Android keypresses and events
5. **Fix minimum touch targets** — keyboard keys need to be 48dp
6. **Handle combo gauge edge-swipe conflict** with system back gesture
7. **Add Level Failed screen** — currently not shown in wireframe

### P1: Should Fix for Launch

1. **Add Level Preview bottom sheet** — needed for level selection UX
2. **Make Settings a full screen** (M3 pattern) — currently just a gear icon
3. **Save gameplay progress on back navigation** — so players don't lose progress
4. **Implement pull-to-refresh on Map screen**
5. **Add tier labels to fracture zones** (EMBER, IGNEOUS, etc.)
6. **Add share score to Victory screen**

### P2: Nice to Have for Launch

1. **Stats screen** — tab exists but is empty
2. **Achievement screen** — deep link from Stats
3. **Landscape orientation support** for gameplay
4. **Tablet adaptive layout** (Navigation Rail, two-panel map)
5. **Sound design** — key clicks, shatter SFX, plasma roar
6. **Onboarding tutorial** for first-time players

---

## Part 11: Screen Inventory for MVP

| # | Screen | Status | Android Component | Navigation Type |
|---|--------|--------|-------------------|-----------------|
| 1 | Splash | ⚠️ Planned but not designed | Full-screen with branding | Auto-dismiss |
| 2 | Home / Dashboard | ❌ Missing | NavigationBar + FilledButton | Root destination |
| 3 | Map (Level Select) | ✅ Wireframed | Custom scrolling list | Tab destination |
| 4 | Level Preview | ❌ Missing | BottomSheet (standard) | Modal |
| 5 | Gameplay Arena | ✅ Wireframed | Custom game view | Tab destination |
| 6 | Victory Assessment | ✅ Wireframed | Custom overlay | Overlay |
| 7 | Level Failed | ❌ Missing | AlertDialog (custom) | Overlay |
| 8 | Stats / Profile | ❌ Missing | Scrollable + grid | Tab destination |
| 9 | Settings | ⚠️ Planned but not designed | Full-screen with lists | Modal (full screen) |

---

## Part 12: Next Steps

1. → **Design Lead** — Cross-platform design consistency review
2. → **Engineering Android** — Implementation of Android-specific patterns
3. → **Update wireframe** — Add missing screens (Home, Level Preview, Level Failed)
4. → **QA Android** — Test back navigation, gestures, form factors, accessibility
