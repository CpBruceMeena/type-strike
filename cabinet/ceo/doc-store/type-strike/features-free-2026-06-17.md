# type-strike — Game Features (Free-to-Play)
**Date:** 2026-06-17  
**Pricing Model:** Free for everyone — all features unlocked, no IAP, no ads

---

## Core Gameplay Loop

```
[Enter Level] → [Words Appear] → [Type to Shatter] → [Build Combo] → [Victory Screen] → [XP + Unlock Next Level]
```

- **Typing input:** Thumb-optimized custom keyboard zone with mechanical feel
- **Word display:** Words emerge from a volumetric glowing void in the upper panel
- **Feedback:** Correct = violent glass shatter particles; Incorrect = glass crack with red electrical effect
- **Combo gauge:** Liquid plasma fuel chamber that fills as streaks grow
- **Levels:** Clear target WPM/accuracy to pass; stars for exceeding thresholds

---

## Screen 1: The High-Octane Progression Journey (Map Screen)

### Header
- Player level badge (e.g., "Lv. 7 — Magma Fingers")
- Total stars collected (e.g., "★ 142 / 300")
- Settings icon (sound, haptics, keycap layout, reset progress)

### The Map — "Broken-Tech Path"
- Vertical scrolling, dark obsidian backdrop with metallic slate textures
- Broken, fractured path structure (jagged digital cracks, not a soft curve)
- Floating keycap nodes at each level position
- Periodic "fracture zones" — sections where the path splits dramatically

### Level Nodes
- **Unlocked levels:** Hyper-glossy 3D crystalline keycap with internal plasma fire core; bold sharp level number
- **Completed levels:** Same + golden crystal shard trophy is stuck into the keycap (collected)
- **Locked levels:** Heavy metallic charcoal shield casing with pulsing security overlay
- **Current level:** Subtle pulsing glow ring, "PLAY" indicator

### Node Details on Tap
- Tap any unlocked node → shows level preview: target WPM, word count, best score
- "PLAY" button at bottom

### Visual Effects
- Rim lights casting colored glow onto adjacent nodes
- Deep volumetric fog at the edges of the scroll
- Particle embers rising from the fractured path edges

### Level Structure (100 Levels)

| Tier | Levels | Theme | Difficulty |
|------|--------|-------|------------|
| **Ember** | 1–25 | Basic vocabulary, short words | Easy |
| **Igneous** | 26–50 | Medium words, compound terms | Medium |
| **Magma Core** | 51–75 | Long words, technical terms | Hard |
| **Obsidian** | 76–100 | Mixed speed gauntlets, punctuation | Expert |

---

## Screen 2: The Core Gameplay Arena

### Layout (Top to Bottom)

#### 1. Arena Header
- **Back arrow** → returns to map (progress saved up to current word)
- **Level indicator** — "LEVEL 14 · IGNEOUS"
- **Word count** — "3 / 15" (current word / total words in level)
- **Passing target** — small indicator: "PASS: 35 WPM / 90% ACC"

#### 2. Word Display Panel
- **Container:** Thick smoked translucent glass panel with chiseled beveled edges
- **Active word:** Large, bold, centered — letters emerge from a subtle volumetric glowing void at the panel's center
- **Typed progress:** Letters change color as typed — magma red when correct, electrical blue as next target
- **Correct hit:** The typed letter violently fractures and shatters with a glass break particle burst, leaving neon particle trails
- **Incorrect hit:** Red electrical crack lines spider across the glass panel; the incorrect letter flashes red; slight haptic buzz
- **Word completion:** The last letter shatters with an explosive burst; 0.3s pause; next word emerges from the void

#### 3. Combo / Overdrive Gauge
- **Position:** Right edge of screen (vertical)
- **Visual:** Liquid fuel chamber — transparent tube with glowing plasma fire fluid inside
- **Empty:** Dim charcoal fluid at bottom
- **Filling:** Aggressively bubbles and rises as combo streak grows
- **Full:** Raging plasma fire fills the chamber; UI edges pulse with motion blur
- **Kinetic text overlays:**
  - 5-streak: "IGNITING!" (small, orange)
  - 10-streak: "CRITICAL COMBO!" (medium, red-orange)
  - 20-streak: "MAX FRENZY!" (large, purple-orange)
  - 30-streak: "IGNITION SPEED!" (huge, white-hot with screen shake)
- **Decay:** Missing a word drops combo by 5 levels; streak resets to 0 on level fail

#### 4. Custom Thumb-Typing Zone
- **Position:** Bottom third of screen
- **Style:** Aggressively angled mechanical-style keycaps with physical depth
- **Metallic side moldings** on each keycap
- **Keyboard layout:** QWERTY default, but size/position adjusted for thumbs
- **Active key highlighting:** Keycaps glow magma orange when pressed
- **Haptic feedback:** Mechanical click sensation on each keypress
- **Two thumb zones** (split keyboard) for ergonomic portrait typing

#### 5. Floating Stats Bar (during gameplay)
- **Live WPM** — top-left, small, dims during play
- **Current Streak** — below combo gauge, "×12"
- **Star progress** — "★ ⚡⚡⚡" (shows if on track for 3-star)

### Game States

| State | Visual | Behavior |
|-------|--------|----------|
| **Ready** | Word displayed, keycaps dim-lit | Waiting for first keystroke |
| **Typing** | Word shattering, keycaps glowing, gauge filling | Active play |
| **Stalled** | Words dim slightly after 3s idle | Gentle haptic pulse every 2s |
| **Combo Critical** | Screen edge glow, gauge full, kinetic text | Above 15-streak |
| **Mistake** | Glass crack, red flash | Haptic buzz, word resets from incorrect point |
| **Level Complete** | Explosive shatter of last word, slow-mo 0.5s | Transitions to Victory Assessment |
| **Level Failed** | Glass panel shatters entirely, fade to black | "RETRY?" / "BACK TO MAP" |

---

## Screen 3: Post-Level Victory Assessment Modal

### Trigger
Level completed successfully (met minimum WPM and accuracy thresholds)

### Overlay Structure
- **Backdrop:** Full-screen dark overlay with digital smoke particle effect
- **Frame:** Raw metallic brackets framing the modal content (top-left, top-right, bottom-left, bottom-right)

### Header Zone
- **Badge:** "VICTORY ATTAINED" or "LEVEL BURNT" — razor-sharp geometric text breaking through localized smoke particles
- **Star rating:** 1–3 golden crystal shard trophies that slam down onto the canvas (with screen shake on slam)
  - 1 star: Passed minimum threshold
  - 2 stars: Exceeded target significantly
  - 3 stars: Near-perfect run

### Core Metrics Dashboard
- **WPM:** Gigantic hyper-stylized geometric typography, glowing from behind, e.g., "87"
  - Sub-label: "WORDS PER MINUTE" in smaller sharp font
- **Accuracy:** Same style, e.g., "96%"
  - Sub-label: "ACCURACY"
- Both metrics positioned side-by-side, each in a smoked glass container

### XP & Progression
- **Curved arc bar** at bottom — aggressively fills with glowing energy from left to right
- **XP labels:** "BEFORE" → glowing arc → "AFTER" with number values
- **Level-up pop:** If enough XP, a secondary burst effect with "+5 LEVEL UP!" appears

### Action Buttons
- **"PLAY AGAIN"** — primary action (large, aggressive metallic button)
- **"NEXT LEVEL"** — secondary, only shown if level is completed (pulsing to draw attention)
- **"BACK TO MAP"** — tertiary, text-only

### Animation Sequence (3 seconds)
1. [0.0s] Screen dims, smoke particles fade in
2. [0.5s] Metal brackets slam into corners (screen shake)
3. [1.0s] Header badge breaks through smoke
4. [1.5s] Trophy shards slam down (staggered, slight shake each)
5. [2.0s] WPM & Accuracy numbers glow-pop into place
6. [2.5s] XP arc bar fills with energy
7. [3.0s] Buttons fade in with metallic gleam

---

## Progression & XP System

### XP Sources

| Action | XP |
|--------|----|
| Complete a level (1-star) | 50 XP |
| Complete a level (2-star) | 100 XP |
| Complete a level (3-star) | 200 XP |
| Per word typed correctly | 2 XP |
| Combo milestone (10+) | 25 XP bonus |
| Combo milestone (20+) | 50 XP bonus |
| First daily login | 30 XP |
| Total words milestone (1K, 5K, 10K) | 100–500 XP |

### Level-Up Formula
- XP required = `100 × currentLevel × 1.5`
- Level 1→2: 150 XP
- Level 10→11: 1,650 XP
- Level 50→51: 7,650 XP

### Star Thresholds (per level)

| Star | Condition |
|------|-----------|
| ★ | Meet minimum WPM and accuracy |
| ★★ | Exceed target WPM by 15% AND accuracy ≥ 95% |
| ★★★ | Exceed target WPM by 30% AND accuracy ≥ 98% AND no combo break |

---

## Word Bank

### Source
- 5,000+ English words curated for typing flow
- Sorted by length (3–12 characters)
- Filtered for offensive content

### Per-Level Distribution
- **Easy (1–25):** 3–5 letter words, 10 words per level
- **Medium (26–50):** 4–7 letter words, 12 words per level
- **Hard (51–75):** 5–9 letter words, 15 words per level
- **Expert (76–100):** 6–12 letter words + punctuation, 18 words per level

### Special Words (random spawn, 10% chance)
- **Dual words:** "high-speed", "all-in" (hyphenated)
- **Capitalized:** "iPhone", "Type-Strike" (must match case)
- **Numbers:** "7even", "l33t" (mixed alpha-numeric)

---

## Combo System Deep Dive

| Streak | Title | Effect |
|--------|-------|--------|
| 0–4 | — | Normal typing, gauge slowly filling |
| 5–9 | "Igniting!" | Gauge hits 25%, slight orange edge glow |
| 10–14 | "Burning!" | Gauge hits 50%, moderate glow, particles intensify |
| 15–19 | "Critical Combo!" | Gauge hits 75%, strong glow, faster word transitions |
| 20–29 | "Max Frenzy!" | Gauge at 100%, full plasma fire, motion blur edges, 1.2x WPM bonus |
| 30+ | "Ignition Speed!" | OVERDRIVE — screen shake, massive particles, combos count for 2x XP |

### Combo Penalties
- **Mistype a letter:** Combo holds but extra 0.2s penalty on word reset
- **Skip a word (timeout):** Lose 5 streak levels
- **Fail level:** Completely reset

---

## Settings & Customization (Free)

| Category | Options |
|----------|---------|
| **Keyboard** | QWERTY / AZERTY / QWERTZ; key size (S/M/L); left/right thumb zone offset |
| **Sound** | Mechanical clicks (4 variants: Blue, Brown, Red, Linear switches); shatter volume; music volume |
| **Haptics** | On / Off; intensity (Light / Medium / Strong) |
| **Visual** | Reduced particles (performance mode); dark mode toggle; keycap glow intensity |
| **Accessibility** | Font size; word display duration; high-contrast mode; left-handed mode |

---

## Achievement System (100 total)

| Category | Examples |
|----------|----------|
| **Progression** | "First 10 levels cleared", "All 100 levels cleared", "All 3-star" |
| **Speed** | "100 WPM on any level", "150 WPM on any level", "200 WPM" |
| **Streaks** | "10-streak", "25-streak", "50-streak", "100-streak" |
| **Accuracy** | "100% accuracy on a level", "100% on 5 levels", "100% on 25 levels" |
| **Words** | "1,000 words typed", "10,000 words typed", "100,000 words typed" |
| **Combo** | "Critical Combo 10 times", "Max Frenzy 5 times", "Ignition Speed once" |
| **Hidden** | "Type 'type-strike' backwards", "Perfect score on Level 1" |

---

## Visual Design Summary

| Element | Material / Style |
|---------|------------------|
| Background | Raw obsidian, metallic slate textures |
| Panels | Smoked translucent glass, chiseled bevels |
| Accents | Magma red, molten gold, toxic neon purple |
| Keycaps | Mechanical-style, metallic side moldings, angled |
| Feedback | Glass shatter particles, neon trails, red electrical cracks |
| Combo Gauge | Liquid plasma fire in fuel chamber |
| Typography | Bold, sharp, geometric, hyper-stylized, glow-backed |
| Map | Broken-tech digital fractures, floating crystalline nodes |
| Trophies | Oversized golden crystal shards |
| Nodes | 3D keycaps with plasma fire core (unlocked) / charcoal shield (locked) |

---

## Tech Requirements

| Area | Notes |
|------|-------|
| **Platform** | iOS (iPhone 11+) and Android (equivalent), portrait orientation |
| **Performance** | 60fps target on mid-range devices; LOD system for particles |
| **Input** | Touch events with haptic feedback (Core Haptics / Vibrator) |
| **Storage** | Local SQLite or equivalent for progress, stats, settings |
| **Rendering** | GPU-driven particle system for shatter effects |
