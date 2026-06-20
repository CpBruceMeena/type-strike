# ⚡ type-strike

<p align="center">
  <img src="docs/logo.png" alt="type-strike" width="400">
</p>

<p align="center">
  <strong>Type with fury. Strike with fire.</strong>
</p>

type-strike is a mobile typing game that turns every word into an explosive arcade battle. No flat typing tests — just visceral feedback, liquid-fueled combos, and a journey through 100+ levels of fire and fury.

---

## The Core Loop

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

## Features

- **100+ levels** across 4 ascending tiers: Ember → Igneous → Magma Core → Obsidian
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

---

## The Visual Identity

```
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

## The Journey

| Tier | Levels | Vibe |
|------|--------|------|
| **EMBER 🔥** | 1–25 | The beginning of flame |
| **IGNEOUS 🌋** | 26–50 | Forged in volcanic fire |
| **MAGMA CORE 🔴** | 51–75 | The planet's burning heart |
| **OBSIDIAN ⚫** | 76–100 | Only the fastest survive |

---

## Keyboard Themes

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

## Roadmap

### ✅ Shipped (Latest)
- **Entrance animations removed across all screens** — all staggered fade/slide/phase-gated content animations eliminated. Content renders instantly on every screen: SplashScreen, HomeScreen, MapScreen, VictoryScreen, LevelFailedScreen, DailyChallengesScreen, AchievementsScreen, LeaderboardScreen, StatsScreen, SettingsScreen, LevelPreviewScreen. Ambient effects (button glow pulses, orbiting particles, reward overlays) preserved.
- **Home screen redesigned as game launcher** — Supercell-style, single-screen launcher: massive STRIKE button with drawn flame icon and pulsing glow, player crest badge, compact stat bubbles, daily challenge badge, bottom nav strip (PLAY/DAILY/FEATS/STATS). No scrolling, no emoji in navigation, no descriptive text.
- **Splash screen simplified** — instant logo wordmark display, removed 6-phase letter-by-letter animation. 1.2s delay before navigating to home.
- **Keyboard overhaul** — dual-mode keyboard (Letters/Symbols) with mode toggle (?123/ABC), shift key (⇧), and enter key (⏎); backspace and shift promoted to prominent special keys with accent styling
- **Mistake handling redesign** — mistyped characters now advance to the next position instead of blocking; combo resets on error, game completes if the mistake hits the paragraph end
- **Map screen polish** — added system bars padding for proper edge-to-edge rendering on modern Android devices
- Daily challenge streak multipliers — rewards scale from 1.0×–2.0× based on consecutive daily completions, with flame visual badge and reward animation
- Back navigation on all screens — every non-root page has a stack-based back button (←) for intuitive navigation
- Home page layout improvements — tier preview now shows only relevant tiers for your progress, with larger spacers and compact tier rows for a spacious feel
- Background music — looping ambient electronic track in E minor (130 BPM), starts on gameplay countdown, stops on level complete/failed
- Sound design — programmatic PCM-16 audio engine: 4 key click types (Blue/Brown/Red/Linear), correct chime, error buzz, combo arpeggio, victory fanfare, level failed tone, countdown beep + GO sweep
- Backspace key (⌫) on keyboard — undo mistakes to maintain accuracy for 3-star runs
- Keyboard completeness — all ASCII paragraph characters now have keys, unlimited beyond-level-100 support
- Countdown overlay with START button and 3-2-1-GO animation
- Haptic feedback system (key press, error, word complete, combo milestone, trophy slam, level failed)
- 6 unlockable keyboard themes with settings UI
- Per-word result tracking with character-level color coding
- All-words scrollable panel with auto-scroll
- Combo tier system (6 tiers with escalating effects)
- Native keyboard support (toggle in settings)
- Star calculation (1–3 stars based on WPM, accuracy, error count)
- Home dashboard redesign with player identity card, XP bar, quick stats, bottom nav
- Achievements navigation and settings keyboard theme selector
- Custom vector launcher icon with flame accents

### ✅ Shipped (MVP)
- Home dashboard with player identity, stats, and activity feed
- Full 100-level map with tier fracture zones and particle effects
- Gameplay arena with word panel, combo gauge, custom keyboard
- Victory assessment with trophy shards and XP arc bar
- Level failed overlay with partial XP and retry
- Configurable settings (keyboard, sound, haptics, visuals, accessibility)
- Particle system with device-aware quality tiers
- Staggered entrance animations across all screens
- Splash screen with logo reveal animation
- Stats screen with performance charts and WPM progression
- Achievements system (18 achievements, 5 categories)

### 🔥 Coming Next
- Leaderboards & competitive play

---

## Built for Mobile

Two thumbs. One goal. Every keystroke is a weapon.

type-strike is designed from the ground up for mobile — thumb-optimized keyboard zones, edge-to-edge dark UI, and haptic feedback that makes each letter feel like a strike.

---

*"A hyper-stylized competitive typing game that turns every word into an explosive arcade battle."*
