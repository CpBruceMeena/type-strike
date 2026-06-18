# type-strike — Master Task Tracker
**Date:** 2026-06-17  
**Status:** Active Development  
**Tracking:** Use this document to mark tasks as 🟢 Done / 🟡 In Progress / ⚪ Not Started / 🔴 Blocked

---

## Phase 0: Strategy & Design (COMPLETE)

### 0.1 CEO Vision
| # | Task | Description | Status | Deliverable |
|---|------|-------------|--------|-------------|
| 0.1.1 | Product Vision Document | Define problem, vision, market, phases, metrics, risks | 🟢 Done | `cabinet/ceo/doc-store/type-strike/vision-2026-06-17.md` |
| 0.1.2 | Game Features Document | Detail all game mechanics, combo system, XP, achievements, settings | 🟢 Done | `cabinet/ceo/doc-store/type-strike/features-free-2026-06-17.md` |

### 0.2 Prototype & Wireframes
| # | Task | Description | Status | Deliverable |
|---|------|-------------|--------|-------------|
| 0.2.1 | Interactive Wireframe | HTML/CSS prototype with all 3 screens (Map, Gameplay, Victory) | 🟢 Done | `type-strike-wireframe.html` |
| 0.2.2 | Android Design Evaluation | M3 audit, missing screens, navigation flow, accessibility, form factors | 🟢 Done | `cabinet/cpo/design-lead/doc-store/design-android/type-strike/android-ui-evaluation-2026-06-17.md` |

### 0.3 Product Specs
| # | Task | Description | Status | Deliverable |
|---|------|-------------|--------|-------------|
| 0.3.1 | Home/Dashboard Screen Spec | Full spec: layout, components, states, animations, data schema | 🟢 Done | `cabinet/cpo/product-review/doc-store/type-strike/feature-home-and-level-preview/home-dashboard-spec.md` |
| 0.3.2 | Level Preview Bottom Sheet Spec | Full spec: trigger, metrics, word preview, CTA, edge cases | 🟢 Done | `cabinet/cpo/product-review/doc-store/type-strike/feature-home-and-level-preview/level-preview-spec.md` |

---

## Phase 1: Project Setup & Infrastructure

### 1.1 Game Engine & Repository
| # | Task | Description | Est. | Status |
|---|------|-------------|------|--------|
| 1.1.1 | Choose final game engine | Unity vs Godot — finalize based on team expertise | 1 day | ⚪ Not Started |
| 1.1.2 | Initialize project repository | Create Unity/Godot project, push to Git, set up .gitignore | 1 day | ⚪ Not Started |
| 1.1.3 | Set up CI/CD pipeline | GitHub Actions → build for iOS (TestFlight) + Android (Play Console) | 2 days | ⚪ Not Started |
| 1.1.4 | Create scene structure | Set up all 7 MVP scenes with empty scene hierarchies | 1 day | ⚪ Not Started |

### 1.2 Local Database Setup
| # | Task | Description | Est. | Status |
|---|------|-------------|------|--------|
| 1.2.1 | Choose local DB library | Select DB approach: SQLite (via plugin) vs JSON file-based vs binary serialization | 0.5 day | ⚪ Not Started |
| 1.2.2 | Install DB library | Integrate the chosen DB library into the game engine | 0.5 day | ⚪ Not Started |
| 1.2.3 | Define DB schema | Create table/document structure for PlayerData, LevelProgress, Activity, Settings | 1 day | ⚪ Not Started |
| 1.2.4 | Implement DB initialization | Create DB file on first launch, run schema migrations | 1 day | ⚪ Not Started |
| 1.2.5 | Implement CRUD operations | Create read/write/update/delete wrappers for each data entity | 2 days | ⚪ Not Started |
| 1.2.6 | Implement save on game events | Auto-save after: level complete, level fail, settings change, milestone | 1 day | ⚪ Not Started |
| 1.2.7 | Implement data migration system | Handle schema versioning for future app updates | 1 day | ⚪ Not Started |
| 1.2.8 | Add error handling & corruption recovery | Validate DB integrity on load; recover from corrupted saves | 1 day | ⚪ Not Started |

### 1.3 Analytics (Local & Optional)
| # | Task | Description | Est. | Status |
|---|------|-------------|------|--------|
| 1.3.1 | Define local analytics events | Log key events locally (level_start, level_complete, level_fail, combo_milestone) | 1 day | ⚪ Not Started |
| 1.3.2 | Build local session tracker | Track session count, play time, daily stats | 1 day | ⚪ Not Started |
| 1.3.3 | (Future) Add analytics service | Firebase/GA4 can be added later when ready — swap the interface | 0.5 day | ⚪ Not Started |
| 1.3.4 | Add crash log capture | Capture unhandled exceptions and log to local file | 1 day | ⚪ Not Started |

---

## Phase 2: MVP Screens — Frontend

### 2.1 Splash Screen
| # | Task | Description | Est. | Status |
|---|------|-------------|------|--------|
| 2.1.1 | Splash animation | type-strike logo reveal animation (1.5s, with loading indicator) | 1 day | ⚪ Not Started |
| 2.1.2 | Asset preloading | Load level data, word banks, config from local storage | 1 day | ⚪ Not Started |
| 2.1.3 | (Removed — no auth needed) | — | — | 🔴 Skipped |
| 2.1.4 | Splash → Home transition | Smooth transition after load complete | 0.5 day | ⚪ Not Started |

### 2.2 Home / Dashboard Screen
| # | Task | Description | Est. | Status |
|---|------|-------------|------|--------|
| 2.2.1 | Player Identity Card | Level badge, player title, star count, XP progress bar | 1 day | ⚪ Not Started |
| 2.2.2 | "JUMP IN" button | Full-width gradient button with dynamic sub-label and pulsing glow | 1 day | ⚪ Not Started |
| 2.2.3 | Quick Stats Row | Two stat cards: today's best WPM + levels completed | 1 day | ⚪ Not Started |
| 2.2.4 | Activity Feed | Recent activity list (max 3 items) + empty state for new players | 1 day | ⚪ Not Started |
| 2.2.5 | Navigation Bar | 3-tab bottom nav (Home, Map, Stats) with active state | 0.5 day | ⚪ Not Started |
| 2.2.6 | Entry animation sequence | 7-phase staggered entrance (1.4s), reduced motion variant | 1 day | ⚪ Not Started |
| 2.2.7 | Settings icon → Settings screen | Gear icon in top bar with navigation to full Settings screen | 0.5 day | ⚪ Not Started |
| 2.2.8 | First-time player state | Show default values, empty activity, subtle pulse on "JUMP IN" | 0.5 day | ⚪ Not Started |
| **Spec reference:** | `home-dashboard-spec.md` | Full detail in spec document | | |

### 2.3 Map Screen (Level Select)
| # | Task | Description | Est. | Status |
|---|------|-------------|------|--------|
| 2.3.1 | Map header | Level badge, stars total, settings gear | 0.5 day | ⚪ Not Started |
| 2.3.2 | Broken-tech path line | Vertical gradient path with digital fracture aesthetic | 1 day | ⚪ Not Started |
| 2.3.3 | Level nodes (25 for MVP) | Crystalline keycap nodes with 3 states: completed/unlocked/locked | 3 days | ⚪ Not Started |
| 2.3.4 | Tier fracture zones | Labeled zone dividers: EMBER, IGNEOUS, MAGMA CORE, OBSIDIAN | 1 day | ⚪ Not Started |
| 2.3.5 | Tap → Level Preview | Tap unlocked node → open Level Preview bottom sheet | 0.5 day | ⚪ Not Started |
| 2.3.6 | Locked node tooltip | Tap locked → "Clear Level [N-1] to unlock" tooltip | 0.5 day | ⚪ Not Started |
| 2.3.7 | Scrolling & virtualization | Smooth scroll with virtualized nodes (render visible + buffer) | 1 day | ⚪ Not Started |
| 2.3.8 | Pull to refresh | Swipe down → refresh/reload from local DB | 1 day | ⚪ Not Started |
| 2.3.9 | Particle effects | Floating ember particles, rim lights on nodes, volumetric fog | 2 days | ⚪ Not Started |
| **Wireframe reference:** | `type-strike-wireframe.html` | Screen 1 implemented in prototype | | |

### 2.4 Level Preview Bottom Sheet
| # | Task | Description | Est. | Status |
|---|------|-------------|------|--------|
| 2.4.1 | Bottom sheet container | Drag handle, scrim, slide animation (350ms), 50% peek height | 1 day | ⚪ Not Started |
| 2.4.2 | Header + Tier badge | Level name (uppercase, bold) + tier chip with icon | 0.5 day | ⚪ Not Started |
| 2.4.3 | Difficulty indicator | 5 crystal shards (filled/empty) + text label | 0.5 day | ⚪ Not Started |
| 2.4.4 | Metrics section | Pass row + Best row (WPM, accuracy, stars) | 1 day | ⚪ Not Started |
| 2.4.5 | Word preview chips | 3 sample word chips + word info label | 0.5 day | ⚪ Not Started |
| 2.4.6 | "STRIKE" button | Full-width gradient button with fire icon and glow | 0.5 day | ⚪ Not Started |
| 2.4.7 | Open/close animations | Staggered entry (6-phase, 600ms) + close animation | 1 day | ⚪ Not Started |
| 2.4.8 | Gesture handling | Swipe down dismiss, system back, scrim tap | 0.5 day | ⚪ Not Started |
| 2.4.9 | Dynamic data binding | Load level data, populate all fields, handle missing best score | 1 day | ⚪ Not Started |
| 2.4.10 | First-time vs replay state | Hide Best row on first play; show stars on replay | 0.5 day | ⚪ Not Started |
| **Spec reference:** | `level-preview-spec.md` | Full detail in spec document | | |

### 2.5 Gameplay Arena
| # | Task | Description | Est. | Status |
|---|------|-------------|------|--------|
| 2.5.1 | Arena header | Back arrow, level name, word count, target metrics | 0.5 day | ⚪ Not Started |
| 2.5.2 | Word Display Panel | Smoked glass panel, letters emerge from glowing void, typed progress colors | 2 days | ⚪ Not Started |
| 2.5.3 | Shatter particle effect | Glass break particle burst on correct keystroke (GPU-driven) | 3 days | ⚪ Not Started |
| 2.5.4 | Crack effect on error | Red electrical crack lines, glass flash red, haptic buzz | 1 day | ⚪ Not Started |
| 2.5.5 | Combo / Overdrive Gauge | Vertical liquid fuel chamber with plasma fire fill animation | 2 days | ⚪ Not Started |
| 2.5.6 | Kinetic text overlays | "IGNITING!" → "CRITICAL COMBO!" → "MAX FRENZY!" → "IGNITION SPEED!" | 1 day | ⚪ Not Started |
| 2.5.7 | Custom thumb keyboard | Mechanical-style keycaps, angular, QWERTY, split thumb zones | 3 days | ⚪ Not Started |
| 2.5.8 | Key press highlighting | Keys glow magma orange on press, haptic feedback per key | 1 day | ⚪ Not Started |
| 2.5.9 | Live stats bar | Live WPM, accuracy, streak counter, star progress | 1 day | ⚪ Not Started |
| 2.5.10 | Word bank + level loading | Load words for current level, manage word queue | 1 day | ⚪ Not Started |
| 2.5.11 | Combo system logic | Streak tracking, gauge fill/decay, kinetic text triggers, XP bonuses | 2 days | ⚪ Not Started |
| 2.5.12 | Game state machine | States: Ready, Typing, Stalled, ComboCritical, Mistake, Complete, Failed | 2 days | ⚪ Not Started |
| 2.5.13 | Back navigation save | Save progress up to current word on back press | 1 day | ⚪ Not Started |
| 2.5.14 | Hide tab bar during play | Tab bar hidden during active play, shown only after level ends | 0.5 day | ⚪ Not Started |
| 2.5.15 | Combo gauge edge conflict | Move gauge 16dp inward, consume edge touches during active play | 0.5 day | ⚪ Not Started |
| 2.5.16 | Haptic feedback patterns | Correct keystroke, error, word complete, combo milestone, trophy | 1 day | ⚪ Not Started |
| **Wireframe reference:** | `type-strike-wireframe.html` | Screen 2 implemented in prototype | | |

### 2.6 Victory Assessment
| # | Task | Description | Est. | Status |
|---|------|-------------|------|--------|
| 2.6.1 | Victory overlay container | Full-screen dark overlay, metal brackets, smoke effect | 1 day | ⚪ Not Started |
| 2.6.2 | "LEVEL BURNT" header badge | Razor-sharp geometric text with gradient + smoke particles | 0.5 day | ⚪ Not Started |
| 2.6.3 | Trophy shard animations | 3 golden crystal shards that slam down staggered (with screen shake) | 1 day | ⚪ Not Started |
| 2.6.4 | Metrics dashboard | WPM + accuracy in giant glowing typography, side-by-side | 1 day | ⚪ Not Started |
| 2.6.5 | XP arc bar | Curved energy bar that fills, with before/after XP labels | 1 day | ⚪ Not Started |
| 2.6.6 | Action buttons | "PLAY AGAIN" (primary), "NEXT LEVEL" (secondary), "BACK TO MAP" (tertiary) | 0.5 day | ⚪ Not Started |
| 2.6.7 | 3-second animation sequence | 7-phase staggered animation (brackets → badge → trophies → metrics → XP → buttons) | 2 days | ⚪ Not Started |
| 2.6.8 | Tap to skip animation | Tap anywhere during animation → jump to end state | 0.5 day | ⚪ Not Started |
| 2.6.9 | Share score option | Generate social card image with score (Phase 2 priority) | 1 day | ⚪ Not Started |
| 2.6.10 | Haptic feedback on trophy slam | Vibration on each trophy slam (3 pulses: 300ms heavy) | 0.5 day | ⚪ Not Started |
| **Wireframe reference:** | `type-strike-wireframe.html` | Screen 3 implemented in prototype | | |

### 2.7 Level Failed Overlay
| # | Task | Description | Est. | Status |
|---|------|-------------|------|--------|
| 2.7.1 | Failed overlay container | Full-screen dark overlay, metal brackets, red-tinted | 0.5 day | ⚪ Not Started |
| 2.7.2 | "LEVEL BREACHED" badge | Red gradient text, broken/shattered text effect | 0.5 day | ⚪ Not Started |
| 2.7.3 | Metrics (red tint) | WPM + accuracy in red, lower opacity, smaller scale than victory | 0.5 day | ⚪ Not Started |
| 2.7.4 | "Requirements not met" label | Clear explanation of what was missed | 0.25 day | ⚪ Not Started |
| 2.7.5 | Partial XP earned | Show XP for words typed (even on failure) | 0.5 day | ⚪ Not Started |
| 2.7.6 | Action buttons | "RETRY" (red primary), "BACK TO MAP" (tertiary) | 0.5 day | ⚪ Not Started |

### 2.8 Settings Screen
| # | Task | Description | Est. | Status |
|---|------|-------------|------|--------|
| 2.8.1 | Settings screen spec | Write product spec for full Settings screen | 1 day | ⚪ Not Started |
| 2.8.2 | Keyboard section | Layout selector (QWERTY/AZERTY/QWERTZ), key size slider (S/M/L) | 1 day | ⚪ Not Started |
| 2.8.3 | Sound section | Key click type (4 switch variants), volume sliders for key/shatter/music | 1 day | ⚪ Not Started |
| 2.8.4 | Haptics section | On/off toggle, intensity slider (Light/Medium/Strong) | 0.5 day | ⚪ Not Started |
| 2.8.5 | Visual section | Reduced particles toggle, keycap glow intensity, dark mode | 0.5 day | ⚪ Not Started |
| 2.8.6 | Accessibility section | Font size slider, high-contrast mode toggle, left-handed mode toggle | 0.5 day | ⚪ Not Started |
| 2.8.7 | Persist settings to local DB | Save settings to local database | 0.5 day | ⚪ Not Started |

---

## Phase 3: Data Layer (Local-Only)

### 3.1 Data Models & Schema
| # | Task | Description | Est. | Status |
|---|------|-------------|------|--------|
| 3.1.1 | Player data schema | Define table/document structure for PlayerData (level, title, xp, stars) | 0.5 day | ⚪ Not Started |
| 3.1.2 | Level progress schema | Define table for per-level progress (stars, bestWpm, bestAccuracy) | 0.5 day | ⚪ Not Started |
| 3.1.3 | Activity event schema | Define table for recent activity (type, timestamp, metadata) | 0.5 day | ⚪ Not Started |
| 3.1.4 | Settings schema | Define table for persisted settings (keyboard, sound, haptics, visual) | 0.5 day | ⚪ Not Started |
| 3.1.5 | Stats/analytics schema | Define table for local analytics (session count, play time, daily stats) | 0.5 day | ⚪ Not Started |

### 3.2 Data Access Layer
| # | Task | Description | Est. | Status |
|---|------|-------------|------|--------|
| 3.2.1 | Database service interface | Create abstract interface (IRepository/IDatabase) for all DB operations | 2 days | ⚪ Not Started |
| 3.2.2 | PlayerData repository | CRUD operations for player profile (level, XP, stars, title) | 1 day | ⚪ Not Started |
| 3.2.3 | LevelProgress repository | CRUD for per-level progress, best scores, star queries | 1 day | ⚪ Not Started |
| 3.2.4 | Activity repository | Write activity events, read recent (last 20) with pagination | 1 day | ⚪ Not Started |
| 3.2.5 | Settings repository | Read/write settings, apply on load | 0.5 day | ⚪ Not Started |
| 3.2.6 | Analytics repository | Write analytics events, compute daily stats, session tracking | 1 day | ⚪ Not Started |
| 3.2.7 | Data migration service | Run schema version checks on DB init, apply migrations | 1 day | ⚪ Not Started |

### 3.3 Leaderboard System (Local-Only)
| # | Task | Description | Est. | Status |
|---|------|-------------|------|--------|
| 3.3.1 | Per-level leaderboard | Query top scores for each level (sorted by WPM, local-only) | 1 day | ⚪ Not Started |
| 3.3.2 | Global best query | Get overall best WPM across all completed levels | 0.5 day | ⚪ Not Started |
| 3.3.3 | Best score tracking | Auto-track and persist personal best for each level | 0.5 day | ⚪ Not Started |
| 3.3.4 | Leaderboard display | UI to show per-level and global best scores | 1 day | ⚪ Not Started |

---

## Phase 4: Sound & Visual Polish

### 4.1 Sound Design
| # | Task | Description | Est. | Status |
|---|------|-------------|------|--------|
| 4.1.1 | Key click SFX | 4 mechanical switch variants (Blue, Brown, Red, Linear) | 2 days | ⚪ Not Started |
| 4.1.2 | Shatter SFX | Glass break sound for correct keystrokes | 1 day | ⚪ Not Started |
| 4.1.3 | Error SFX | Electrical crack / buzz for incorrect input | 0.5 day | ⚪ Not Started |
| 4.1.4 | Combo milestone SFX | Escalating sound for each combo tier | 1 day | ⚪ Not Started |
| 4.1.5 | Victory fanfare | Triumphant sound for level completion | 1 day | ⚪ Not Started |
| 4.1.6 | Failure sound | Defeat sound for level failure | 0.5 day | ⚪ Not Started |
| 4.1.7 | UI sound effects | Button press, sheet open/close, navigation | 1 day | ⚪ Not Started |
| 4.1.8 | Background music | High-energy arcade track with dynamic intensity (calm → intense as combo grows) | 3 days | ⚪ Not Started |
| 4.1.9 | Audio settings integration | Volume sliders, mute toggle, persistence | 0.5 day | ⚪ Not Started |

### 4.2 Visual Polish
| # | Task | Description | Est. | Status |
|---|------|-------------|------|--------|
| 4.2.1 | Particle system optimization | GPU-driven particles, LOD system, performance mode | 2 days | ⚪ Not Started |
| 4.2.2 | Screen shake system | Per-event screen shake intensity + reduced motion respect | 1 day | ⚪ Not Started |
| 4.2.3 | Transition effects | Screen-to-screen transitions (fade, slide, scale) | 1 day | ⚪ Not Started |
| 4.2.4 | Ambient effects | Floating embers, gauge plasma bubbles, rim lights | 2 days | ⚪ Not Started |
| 4.2.5 | Dynamic lighting | Real-time light sources from magma elements | 2 days | ⚪ Not Started |
| 4.2.6 | Reduced particles mode | Alternate simplified particle system for low-end devices | 1 day | ⚪ Not Started |

---

## Phase 5: Form Factor & Platform Support

### 5.1 Android-Specific
| # | Task | Description | Est. | Status |
|---|------|-------------|------|--------|
| 5.1.1 | System back gesture handling | Implement per-screen back navigation behavior | 2 days | ⚪ Not Started |
| 5.1.2 | Predictive back gesture (Android 14+) | Show preview of destination during back swipe | 2 days | ⚪ Not Started |
| 5.1.3 | Edge swipe conflict resolution | Combo gauge edge consumption during gameplay | 1 day | ⚪ Not Started |
| 5.1.4 | Android haptic feedback | Map to HapticFeedbackConstants | 1 day | ⚪ Not Started |
| 5.1.5 | Window insets handling | Account for gesture nav bar, status bar, notch | 1 day | ⚪ Not Started |
| 5.1.6 | Material 3 dynamic color | Apply M3 surface colors to system panels | 2 days | ⚪ Not Started |

### 5.2 iOS-Specific
| # | Task | Description | Est. | Status |
|---|------|-------------|------|--------|
| 5.2.1 | iOS design evaluation | Run iOS-specific design audit (HIG compliance) | 2 days | ⚪ Not Started |
| 5.2.2 | iOS haptic feedback | Map to Core Haptics (UIImpactFeedbackGenerator) | 1 day | ⚪ Not Started |
| 5.2.3 | Safe area handling | Notch, Dynamic Island, home indicator | 1 day | ⚪ Not Started |
| 5.2.4 | Edge gesture conflicts | Swipe-back gesture during gameplay | 1 day | ⚪ Not Started |

### 5.3 Tablet & Foldable Support
| # | Task | Description | Est. | Status |
|---|------|-------------|------|--------|
| 5.3.1 | Window size class detection | Compact / Medium / Expanded breakpoints | 1 day | ⚪ Not Started |
| 5.3.2 | Tablet navigation rail | Switch from bottom bar to side rail on expanded screens | 2 days | ⚪ Not Started |
| 5.3.3 | Two-panel map layout | Level list (left) + Level Preview (right) on tablet | 2 days | ⚪ Not Started |
| 5.3.4 | Side-by-side gameplay | Word panel (left) + keyboard (right) on tablet landscape | 3 days | ⚪ Not Started |
| 5.3.5 | Foldable hinge awareness | Avoid placing interactive elements near hinge | 1 day | ⚪ Not Started |

---

## Phase 6: Testing & QA

### 6.1 Unit & Integration Tests
| # | Task | Description | Est. | Status |
|---|------|-------------|------|--------|
| 6.1.1 | Combo system tests | Streak calculation, gauge fill/decay, milestone triggers | 1 day | ⚪ Not Started |
| 6.1.2 | XP & progression tests | XP calculation, level-up thresholds, star conditions | 1 day | ⚪ Not Started |
| 6.1.3 | Word bank tests | Word selection, filtering, difficulty distribution | 0.5 day | ⚪ Not Started |
| 6.1.4 | Data sync tests | Local → remote merge, conflict resolution, offline queue | 2 days | ⚪ Not Started |
| 6.1.5 | Leaderboard tests | Score submission, ranking, pagination | 1 day | ⚪ Not Started |
| 6.1.6 | Navigation tests | Back stack, tab switching, sheet dismiss, state preservation | 1 day | ⚪ Not Started |

### 6.2 Platform Testing
| # | Task | Description | Est. | Status |
|---|------|-------------|------|--------|
| 6.2.1 | Android device matrix | Test on: Pixel 7, Galaxy S23, Galaxy Fold 5, Pixel Tablet, OnePlus 12 | 3 days | ⚪ Not Started |
| 6.2.2 | iOS device matrix | Test on: iPhone 15, iPhone 15 Pro Max, iPad Air, iPad Pro | 3 days | ⚪ Not Started |
| 6.2.3 | Performance profiling | 60fps on mid-range devices; profile CPU, GPU, memory | 3 days | ⚪ Not Started |
| 6.2.4 | Battery impact test | Measure battery drain per 30min session | 1 day | ⚪ Not Started |
| 6.2.5 | Network conditions test | Test on: WiFi, 5G, 4G, 3G, offline, flaky connection | 2 days | ⚪ Not Started |

### 6.3 Accessibility Testing
| # | Task | Description | Est. | Status |
|---|------|-------------|------|--------|
| 6.3.1 | TalkBack screen reader test | Verify all elements have content descriptions | 1 day | ⚪ Not Started |
| 6.3.2 | Touch target audit | Verify all interactive elements ≥ 48dp | 0.5 day | ⚪ Not Started |
| 6.3.3 | Color contrast verification | Verify all text/background pairs ≥ 4.5:1 | 0.5 day | ⚪ Not Started |
| 6.3.4 | Reduced motion test | Verify animations respect system setting | 0.5 day | ⚪ Not Started |
| 6.3.5 | Font scaling test | Verify layout at 200% font size | 0.5 day | ⚪ Not Started |

---

## Phase 7: Pre-Launch

### 7.1 Store Listings & Marketing
| # | Task | Description | Est. | Status |
|---|------|-------------|------|--------|
| 7.1.1 | App Store screenshots | Generate 6 screenshots per device size | 2 days | ⚪ Not Started |
| 7.1.2 | App icon | type-strike logo as app icon (multiple sizes) | 1 day | ⚪ Not Started |
| 7.1.3 | App description | Store description, keywords, category selection | 1 day | ⚪ Not Started |
| 7.1.4 | Privacy policy | Draft privacy policy (no external data collection — all data stored locally on device) | 1 day | ⚪ Not Started |
| 7.1.5 | Beta test invite | Set up TestFlight (iOS) + Internal Testing (Android) | 1 day | ⚪ Not Started |

### 7.2 Final Checks
| # | Task | Description | Est. | Status |
|---|------|-------------|------|--------|
| 7.2.1 | Performance benchmark | Verify 60fps on target devices | 1 day | ⚪ Not Started |
| 7.2.2 | Memory leak check | Run profiler for 30min session, verify no leaks | 1 day | ⚪ Not Started |
| 7.2.3 | App size optimization | Minimize build size (textures, audio compression) | 1 day | ⚪ Not Started |
| 7.2.4 | First-launch flow test | Fresh install → Splash → Home → Level Preview → Gameplay → Victory | 1 day | ⚪ Not Started |
| 7.2.5 | Analytics verification | Confirm local analytics events write correctly to DB | 1 day | ⚪ Not Started |

---

## Summary: Progress Overview

| Phase | Total Tasks | 🟢 Done | 🟡 In Progress | ⚪ Not Started |
|-------|-------------|---------|----------------|----------------|
| **0: Strategy & Design** | 6 | 6 | 0 | 0 |
| **1: Project Setup & Infra** | 20 | 0 | 0 | 20 |
| **2: MVP Screens** | 64 | 0 | 0 | 64 |
| **3: Backend Data Layer** | 12 | 0 | 0 | 12 |
| **4: Sound & Polish** | 15 | 0 | 0 | 15 |
| **5: Form Factor Support** | 14 | 0 | 0 | 14 |
| **6: Testing & QA** | 17 | 0 | 0 | 17 |
| **7: Pre-Launch** | 11 | 0 | 0 | 11 |
| **TOTAL** | **159** | **6** | **0** | **153** |

---

## Quick Reference: Cabinet Document Index

| Document | Location |
|----------|----------|
| CEO Vision | `cabinet/ceo/doc-store/type-strike/vision-2026-06-17.md` |
| Game Features | `cabinet/ceo/doc-store/type-strike/features-free-2026-06-17.md` |
| Interactive Wireframe | `type-strike-wireframe.html` |
| Android Design Evaluation | `cabinet/cpo/design-lead/doc-store/design-android/type-strike/android-ui-evaluation-2026-06-17.md` |
| Home Dashboard Spec | `cabinet/cpo/product-review/doc-store/type-strike/feature-home-and-level-preview/home-dashboard-spec.md` |
| Level Preview Spec | `cabinet/cpo/product-review/doc-store/type-strike/feature-home-and-level-preview/level-preview-spec.md` |
| **Master Task Tracker** | **`cabinet/cpo/feature-manager/doc-store/type-strike/master-task-tracker-2026-06-17.md`** ↩️ you are here |

---

## PostgreSQL Connection & Data Model

### Connection Details
| Property | Value |
|----------|-------|
| **Host** | `localhost` |
| **Port** | `5432` |
| **Database** | `typestrike` |
| **User** | `postgres` |
| **Password** | `password` |
| **SSL** | Disabled (local) |

### Connection String (libpq)
```
postgresql://postgres:password@localhost:5432/typestrike
```

### Schema (6 Tables — Created ✅)

```sql
-- 1. Players (player identity & progress)
CREATE TABLE players (
  id SERIAL PRIMARY KEY,
  player_uuid UUID DEFAULT gen_random_uuid() UNIQUE,
  level INTEGER DEFAULT 1,
  title TEXT DEFAULT 'RECRUIT',
  xp INTEGER DEFAULT 0,
  total_stars INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_played_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Level Progress (per-level player stats)
CREATE TABLE level_progress (
  id SERIAL PRIMARY KEY,
  player_id INTEGER REFERENCES players(id) ON DELETE CASCADE,
  level_id INTEGER NOT NULL,
  stars INTEGER DEFAULT 0 CHECK(stars >= 0 AND stars <= 3),
  best_wpm INTEGER DEFAULT 0,
  best_accuracy REAL DEFAULT 0.0,
  completed BOOLEAN DEFAULT FALSE,
  attempts INTEGER DEFAULT 0,
  last_played_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(player_id, level_id)
);

-- 3. Activity Feed (recent events for the player)
CREATE TABLE activity (
  id SERIAL PRIMARY KEY,
  player_id INTEGER REFERENCES players(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);
CREATE INDEX idx_activity_player_time ON activity(player_id, timestamp DESC);

-- 4. Settings (player preferences, keyed by 'key')
CREATE TABLE settings (
  id SERIAL PRIMARY KEY,
  player_id INTEGER REFERENCES players(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  UNIQUE(player_id, key)
);

-- 5. Analytics Events (local event log)
CREATE TABLE analytics_events (
  id SERIAL PRIMARY KEY,
  player_id INTEGER REFERENCES players(id) ON DELETE CASCADE,
  event_name TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  properties JSONB DEFAULT '{}'
);
CREATE INDEX idx_analytics_event_time ON analytics_events(event_name, timestamp);

-- 6. Daily Stats (aggregated per day per player)
CREATE TABLE daily_stats (
  id SERIAL PRIMARY KEY,
  player_id INTEGER REFERENCES players(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  session_count INTEGER DEFAULT 0,
  total_play_time_seconds INTEGER DEFAULT 0,
  best_wpm INTEGER DEFAULT 0,
  levels_completed INTEGER DEFAULT 0,
  UNIQUE(player_id, date)
);
```

### Default Settings (Inserted on Player Creation)
| Key | Default Value |
|-----|---------------|
| `keyboard_layout` | `QWERTY` |
| `key_size` | `M` |
| `key_click_type` | `BLUE` |
| `sound_volume` | `0.8` |
| `music_volume` | `0.5` |
| `haptics_on` | `true` |
| `haptics_intensity` | `MEDIUM` |
| `reduced_particles` | `false` |
| `font_size` | `1.0` |
| `high_contrast` | `false` |
| `left_handed` | `false` |

---

## Architecture: Storage Flow

```
Game Logic (scores, progress, events)
       │
       ▼
Repository Layer (CRUD interfaces)
       │
       ├── PlayerRepository
       ├── LevelProgressRepository
       ├── ActivityRepository
       ├── SettingsRepository
       └── AnalyticsRepository
       │
       ▼
PostgreSQL Client (libpq / pgx driver)
       │
       ▼
PostgreSQL Server (localhost:5432)
       │
       ▼
typestrike Database (on disk)
```

Key principles:
- **Local PostgreSQL server** — no external network calls, runs on the same machine
- **Repository pattern** — each data entity has its own repository with focused CRUD
- **JSONB for flexible metadata** — activity and analytics use JSONB for extensibility
- **Cascade deletes** — deleting a player cascades to all related tables
- **Player UUID** — `player_uuid` is the stable identifier shared across sessions (not the serial ID)

---

## ✅ Completed (Pre-Cleanup)

### Infrastructure
- ✅ Go backend fully built with all 14 REST API endpoints (players, levels, activity, settings, analytics)
- ✅ PostgreSQL database with 6 tables (players, level_progress, activity, settings, analytics_events, daily_stats) — schema applied
- ✅ 100 level configs with tiered difficulty (Ember, Igneous, Magma Core, Obsidian)
- ✅ GitHub Actions CI for backend

### Android App (Kotlin + Jetpack Compose)
- ✅ Project scaffolded with Gradle 8.5, AGP 8.2.2, Kotlin 1.9.22
- ✅ Compose BOM 2024.02, Material3, Hilt, Retrofit, Navigation
- ✅ Full data layer: Retrofit API (14 endpoints), Gson models, repositories with error handling
- ✅ Navigation system: 9 screen route definitions with NavHost
- ✅ Dark arcade theme: Magma red/gold/neon purple color scheme matching spec
- ✅ Home/Dashboard screen: Player identity card, JUMP IN button with glow, stats cards, activity feed, nav bar
- ✅ Staggered entrance animations (7-phase)

---

## Next Steps (Immediate Actions)

### Phase 2: MVP Screens — Kotlin Android App

1. **Deploy backend + seed data** — Start Go server, create test player with progress
2. **Create AVD + Build** — Set up Pixel 8 emulator, generate Gradle wrapper, build & run
3. **Implement Map screen** — Vertical scrolling broken-tech path with level nodes
4. **Implement Level Preview** — Bottom sheet with metrics, word preview, STRIKE button
5. **Implement Gameplay Arena** — Word panel, combo gauge, custom keyboard
6. **Implement Victory/Failed screens** — Post-level overlays
7. **Implement Settings screen** — Full settings with all preferences
