# TypeStrike Homepage Redesign — Execution Prompt

> **Role:** Principal Frontend Engineer  
> **Mode:** Autonomous execution with loop engineering (no stopping until all changes are verified)

---

## 1. Prerequisites — Read Before Writing Code

Start by reading **all** the following files to understand the current codebase structure, styling conventions, routing, and existing components. This is non-negotiable — skip this and you will make design mistakes.

### Critical files to read (in order)

| # | File | Why |
|---|------|-----|
| 1 | `type-strike-web/src/app/app/home/page.tsx` | **Current home page** — understand what's being replaced |
| 2 | `type-strike-web/src/app/app/layout.tsx` | **App layout** — wraps home page with Navbar, BottomNav, etc. |
| 3 | `type-strike-web/src/app/page.tsx` | **Root page** — currently redirects to `/splash` |
| 4 | `type-strike-web/src/app/splash/page.tsx` | **Splash screen** — redirects to `/app/home` after 2.5s |
| 5 | `type-strike-web/src/app/globals.css` | **Design system tokens** — CSS variables, Tailwind theme, animations |
| 6 | `type-strike-web/src/styles/glass-effects.module.css` | **Glass effect classes** — reuse these patterns |
| 7 | `type-strike-web/src/components/layout/Navbar.tsx` | **Navbar** — preserve existing navigation flows |
| 8 | `type-strike-web/src/components/layout/BottomNav.tsx` | **Mobile bottom nav** — preserve existing links |
| 9 | `type-strike-web/src/hooks/usePlayer.ts` | **Player hook** — for display name, level, streak count |
| 10 | `type-strike-web/src/hooks/usePlayerStats.ts` | **Stats hook** — for WPM, XP, accuracy, rank |
| 11 | `type-strike-web/src/hooks/useProgression.ts` | **Progression hook** — for tier/rank name |
| 12 | `type-strike-web/src/lib/types.ts` | **Types** — Player, ProgressionResponse, etc. |
| 13 | `type-strike-web/src/lib/api.ts` | **API client** — understand available endpoints |
| 14 | `type-strike-web/src/components/react-bits/Particles.tsx` | **Particle effect** — already available |
| 15 | `type-strike-web/src/components/react-bits/SpotlightCard.tsx` | **Spotlight card** — already available |
| 16 | `type-strike-web/src/components/react-bits/ShinyText.tsx` | **Shiny text** — already available |
| 17 | `type-strike-web/src/lib/utils.ts` | **Utils** — formatting helpers |
| 18 | `type-strike-web/package.json` | **Dependencies** — know what's installed |
| 19 | `type-strike-web/next.config.ts` | **Next config** — minimal config |

### Design reference to study

Read `index 2.html` at the **project root** (`/Users/cpbrucemeena/Documents/Projects/type-strike/index 2.html`). This is the complete design reference.

Extract from it:
- CSS variable palette (`--bg-0`, `--orange`, `--yellow`, `--cyan`, etc.)
- Font stack: Orbitron (headings), JetBrains Mono (mono), Inter (body)
- Component structure: Navbar → Hero → Game Modes → Daily Banner → Arsenal/Stats → Streak → Leaderboard → Footer
- Animation styles: grid background drift, ember particles, keyboard 3D float, key glow, floating badges, pulse glow
- Responsive breakpoints: 960px (tablet), 520px (mobile)
- Design philosophy: bold typography, orange-primary accent system, dark glass surfaces, animated micro-interactions, gaming aesthetic with neon glow effects

---

## 2. Design Philosophy — The "TypeStrike Way"

Adhere strictly to these principles. This is not optional.

### 2.1 Visual Language
- **Primary accent:** `#ff6b1a` (warm orange) — use as the anchor color everywhere
- **Background:** Deep near-black `#07060a` with radial gradient overlays
- **Typography:** Orbitron 900 for headlines, Inter for body, JetBrains Mono for data/metrics
- **Borders:** Subtle `rgba(255,107,26,0.18)` on dark surfaces
- **Glass effect:** Use the existing `glass-effects.module.css` classes where applicable, or inline styles matching the HTML reference

### 2.2 Spacing & Layout
- **Max content width:** 1400px (`max-width: 1400px; margin: 0 auto`)
- **Nav padding:** 18px 32px (`padding: 18px 32px`). On mobile ≤520px: 14px 18px
- **Section padding:** 40px 32px. On mobile: 24px 18px
- **Hero padding:** 60px 32px 40px. On mobile: 36px 18px 20px
- **Card radius:** 20px (mode cards), 18px (streak card, daily banner), 16px (stat cards)
- **Gap in grids:** 20px (mode grid), 16px (stats grid), 12px (reward calendar), 8px (nav links)
- **Do NOT deviate from these values.** Every pixel matters.

### 2.3 Component Hierarchy

```
┌─────────────────────────────────────────────┐
│                 Navbar                       │  ← Reuse existing, just restyle
├─────────────────────────────────────────────┤
│                 Hero                         │  ← NEW: animated keyboard visual, stats, CTA
├─────────────────────────────────────────────┤
│          Game Mode Cards (3)                 │  ← NEW: Strike, Learn, Coder cards
├─────────────────────────────────────────────┤
│          Daily Challenge Banner             │  ← NEW: timer, CTA, glow effects
├─────────────────────────────────────────────┤
│          Quick Stats / Arsenal (4)          │  ← NEW: Leaderboard, Feats, Ranks, Stats
├─────────────────────────────────────────────┤
│          Streak + Rewards Calendar          │  ← Adapt existing streak widget to match design
├─────────────────────────────────────────────┤
│          Leaderboard Preview (Top 5)        │  ← NEW: top strikers preview
├─────────────────────────────────────────────┤
│                 Footer                      │  ← NEW: minimalist
└─────────────────────────────────────────────┘
```

### 2.4 Animations
- Grid background: animated drift (50px grid, `mask-image` radial gradient)
- Ember particles: 25 floating embers (done via JS, use the same technique)
- Keyboard 3D: `perspective: 1200px`, `rotateX(45deg) rotateZ(-15deg)`, floating animation
- Floating badges: 4 badges bobbing at different delays
- Mode card hover: translateY(-6px), border color transition, top gradient line reveal
- Streak flame: pulse glow animation
- Progress fill: shimmer/gradient scan animation
- Daily timer: real-time countdown to midnight
- All transitions: `transition: all .2s` or `.3s` ease

---

## 3. Implementation Plan

### Phase 1: Foundation Setup

#### 1.1 Add New Fonts
Add Google Fonts for Orbitron, JetBrains Mono, and Inter. In Next.js, use the `next/font/google` approach to add them in `layout.tsx` or a dedicated font configuration file. Do NOT use a `<link>` tag in the HTML head.

Create `type-strike-web/src/lib/fonts.ts`:
```typescript
import { Orbitron, JetBrains_Mono, Inter } from "next/font/google";

export const orbitron = Orbitron({
  subsets: ["latin"],
  weight: ["500", "700", "900"],
  variable: "--font-orbitron",
  display: "swap",
});

export const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "600", "800"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});
```

Then in `layout.tsx`, apply these variables to the `<html>` tag alongside the existing Geist fonts.

#### 1.2 Add Design Token CSS Variables
In `globals.css`, add the full color palette from the HTML reference under `:root`:
- `--ts-orange`, `--ts-orange-bright`, `--ts-red`, `--ts-yellow`, `--ts-cyan`, `--ts-purple`, `--ts-green`, `--ts-pink`
- `--ts-bg-0`, `--ts-bg-1`, `--ts-bg-2`
- `--ts-text`, `--ts-text-dim`, `--ts-border`
- All animation keyframes: `gridDrift`, `emberFloat`, `pulseGlow`, `kbdFloat`, `keyPress`, `floatBob`, `flameFlicker`, `fillShine`, `popIn`, `fadeIn`, `blink`

#### 1.3 Install Font Awesome
The HTML reference uses Font Awesome for icons. Since the project currently uses `@tabler/icons-react`, you have two options:

**Option A (Recommended):** Map all Font Awesome icons to Tabler Icons equivalents. The HTML uses:
- `fa-fire` → `IconFlame`
- `fa-bolt` → `IconBolt`
- `fa-graduation-cap` → `IconSchool`
- `fa-code` → `IconBraces`
- `fa-trophy` → `IconTrophy`
- `fa-store` → `IconShoppingCart` or similar
- `fa-house` → `IconHome`
- `fa-medal` → `IconMedal`
- `fa-play` → `IconPlayerPlay`
- `fa-book-open` → `IconBook`
- `fa-keyboard` → `IconKeyboard`
- `fa-check` → `IconCheck`
- `fa-bullseye` → `IconTargetArrow`
- `fa-gift` → `IconGift`
- `fa-star` → `IconStar`
- `fa-ranking-star` → `IconAward`
- `fa-chart-line` → `IconChartBar`
- `fa-arrow-right` → `IconArrowRight`
- `fa-bars` → hamburger SVG (same pattern as current Navbar)
- `fa-rocket` → `IconRocket`
- `fa-user` → `IconUser`
- `fa-award` → `IconAward`
- `fa-check-circle` → `IconCircleCheck`
- `fa-fire` (streak) → `IconFlame`

**Option B:** Install `@fortawesome/fontawesome-free` as a dependency and use Font Awesome classes. Not recommended since it adds bundle size.

→ Ask the user which option they prefer before proceeding. If uncertain, go with Option A.

---

### Phase 2: Component Decomposition

Break the HTML design into these components. Each should be a separate file placed in its own directory under `type-strike-web/src/components/home/`:

| Component | File | Purpose |
|-----------|------|---------|
| `GridBackground` | `components/home/GridBackground.tsx` | Animated grid with radial gradient mask |
| `EmberParticles` | `components/home/EmberParticles.tsx` | 25 floating ember dots |
| `HomeNavbar` | `components/layout/HomeNavbar.tsx` | Restyled navbar matching the HTML design |
| `HeroSection` | `components/home/HeroSection.tsx` | Title, stats, CTA, animated keyboard, floating badges |
| `AnimatedKeyboard` | `components/home/AnimatedKeyboard.tsx` | 3D keyboard visual with glowing keys |
| `FloatingBadge` | `components/home/FloatingBadge.tsx` | Individual floating badge with icon and text |
| `GameModeCard` | `components/home/GameModeCard.tsx` | Individual mode card (Strike/Learn/Coder) |
| `ModeGrid` | `components/home/ModeGrid.tsx` | 3-column grid of GameModeCards |
| `DailyBanner` | `components/home/DailyBanner.tsx` | Daily challenge banner with countdown timer |
| `ArsenalGrid` | `components/home/ArsenalGrid.tsx` | 4-column stats grid (Leaderboard, Feats, Ranks, Stats) |
| `StreakWidget` | `components/home/StreakWidget.tsx` | Streak display with progress bar and reward calendar |
| `RewardCalendar` | `components/home/RewardCalendar.tsx` | 7-day reward calendar grid |
| `DayCard` | `components/home/DayCard.tsx` | Individual day card in calendar |
| `LeaderboardPreview` | `components/home/LeaderboardPreview.tsx` | Top 5 strikers preview |
| `LeaderRow` | `components/home/LeaderRow.tsx` | Individual leaderboard row |
| `HomeFooter` | `components/home/HomeFooter.tsx` | Minimalist footer |
| `ToastNotification` | `components/home/ToastNotification.tsx` | Toast notification component |
| `NavModal` | `components/home/NavModal.tsx` | Navigation feedback modal |

### Phase 3: Data Flow & Integration

All data flows from **existing hooks**. Do not create new API calls.

| HTML Mock Data | Hook/Data Source |
|----------------|------------------|
| Player name "Sandeep" | `usePlayer()` → `player.display_name` |
| Level number | `usePlayer()` → `player.level` |
| Streak count (3 days) | `usePlayer()` → `player.streak_count` |
| Rank tier (Bronze) | `useProgression()` → `progression.current_tier.display_name` |
| Best WPM (67) | `usePlayerStats()` → `stats.best_wpm_by_mode` (take max) |
| Total XP (61) | `usePlayerStats()` → `stats.total_xp` |
| Global rank (#2,847) | API call from Navbar: `api.getPlayerRank(playerId)` |
| Accuracy (98%) | `usePlayerStats()` → `stats.average_accuracy` |
| Achievements (12 / 84) | API wrapper: use the existing `api.getAchievementUnlockCount` |
| Online players (12,847) | Static mock or remove this badge if no API exists |
| Leaderboard data | `api.getLeaderboardTop(5)` |
| Timer countdown | Client-side countdown to midnight (same as HTML) |

---

### Phase 4: Routing Map (Preserve Existing Navigation)

**Critical:** The existing navigation flows must be preserved. Map the HTML nav links to existing routes:

| HTML Route Label | HTML Icon | Target Route | Existing Route |
|-----------------|-----------|-------------|----------------|
| Home | `fa-house` | Already on home | `/app/home` |
| Strike | `fa-bolt` | Strike mode | `/app/map` |
| Learn | `fa-graduation-cap` | Learn mode | `/learn` |
| Coder | `fa-code` | Coder mode | `/play/coder` |
| Ranks | `fa-trophy` | Leaderboard | `/app/leaderboard` |
| Shop | `fa-store` | Shop | `/app/shop` (create if doesn't exist, else map to `/app/ranks`) |
| — | — | Feats/Achievements | `/app/achievements` |
| — | — | Stats | `/app/stats` |
| — | — | Profile | `/app/profile` |
| — | — | Daily Challenges | `/app/daily-challenges` |
| — | — | How to Play | `/learn` (or create `/learn/guide`) |

**→ Ask the user about the Shop route** — the HTML has a "Shop" nav item. If there's no shop page, ask if they want to:
a) Remove the Shop nav item
b) Map it to an existing page like `/app/ranks`
c) Create a placeholder shop page

---

### Phase 5: Implementation Order (DO NOT DEVIATE)

Execute in this exact order. Each subsection must be completed and reviewed before moving to the next.

```
Step 1:  Add new fonts (fonts.ts + update layout.tsx)
Step 2:  Add CSS variables and animations to globals.css
Step 3:  Create GridBackground component
Step 4:  Create EmberParticles component
Step 5:  Create AnimatedKeyboard component
Step 6:  Create FloatingBadge component
Step 7:  Create HeroSection (integrates AnimatedKeyboard + FloatingBadges)
Step 8:  Create GameModeCard component
Step 9:  Create ModeGrid (3 cards)
Step 10: Create DailyBanner with countdown timer
Step 11: Create arsenal/stat card components
Step 12: Create ArsenalGrid (4 stats)
Step 13: Create DayCard component
Step 14: Create RewardCalendar (7 days)
Step 15: Create StreakWidget (integrates RewardCalendar)
Step 16: Create LeaderRow component
Step 17: Create LeaderboardPreview (top 5)
Step 18: Create HomeFooter
Step 19: Create ToastNotification component
Step 20: Create NavModal component
Step 21: Create the main HomePage component (assembles all sub-components)
Step 22: Wire up all navigation: NavLinks, game mode cards, stat cards, CTAs
Step 23: Implement all animations: grid, embers, keyboard glow cycle, floating badges, keydown shortcuts
Step 24: Build and verify no errors
Step 25: Open in browser and verify visual fidelity against the HTML reference
```

---

## 4. Testing & Validation (Loop Engineering)

After each phase and after completion, run these validation steps. If any step fails, **stop, fix, and restart from the failed step**.

### 4.1 Build Validation
```bash
cd type-strike-web && npm run build
```
- Must complete with **zero errors**
- Must complete with **zero warnings** (if warnings appear, fix them)
- If there are pre-existing warnings from the old code, note them but don't treat them as failures

### 4.2 TypeScript Validation
```bash
cd type-strike-web && npx tsc --noEmit
```
- Must produce **zero type errors**

### 4.3 Lint Validation
```bash
cd type-strike-web && npm run lint
```
- Must produce **zero errors** (warnings are acceptable if pre-existing)

### 4.4 Browser Validation (use the browser-use skill)

Start the dev server:
```bash
cd type-strike-web && npm run dev
```

Then use the **browser-use** agent to:

1. **Navigate to `http://localhost:3000`** (or whatever port Next.js starts on)
   - Verify redirect to splash works (or directly go to `/app/home`)
   
2. **Check the home page at `/app/home`**
   - Verify all sections render: hero, mode cards, daily banner, arsenal, streak, leaderboard, footer
   - Check for console errors (`window.__NEXT_DATA__` errors, hydration mismatches, etc.)
   - Verify the page is visually complete (no blank regions, no layout shift)

3. **Test navigation**
   - Click "Strike" → should navigate to `/app/map`
   - Click "Learn" → should navigate to `/learn`
   - Click "Coder" → should navigate to `/play/coder`
   - Click "Ranks/Leaderboard" → should navigate to `/app/leaderboard`
   - Click "Feats" → should navigate to `/app/achievements`
   - Click "Stats" → should navigate to `/app/stats`
   - Verify the Navbar profile/rank section still works
   - Verify mobile toggle opens the mobile menu

4. **Check responsive design**
   - Test at 1400px+ (desktop): 3-column mode grid, 4-column stats
   - Test at 960px (tablet): single column mode grid, 2-column stats
   - Test at 520px (mobile): compact padding, stacked layout

5. **Verify animations**
   - Grid background is drifting
   - Ember particles are floating up
   - Keyboard has a glowing key cycling
   - Floating badges are bobbing
   - Hover effects on cards work
   - Streak flame pulses
   - Daily timer counts down

6. **Test the claim button**
   - Click "Claim Rewards" → toast should appear

7. **Check keyboard shortcut**
   - Press Enter → should trigger modal for strike mode

### 4.5 Visual Fidelity Check

Open the HTML reference file (`index 2.html`) side by side with the new implementation. Check:
- Same spacing proportions
- Same color values
- Same typography scale
- Same hover effects
- Same animation quality
- Same responsive behavior

### 4.6 Error Recovery Loop

If any validation step fails:

1. **Read the error message carefully**
2. **Identify the root cause** (type error, missing import, wrong prop, CSS issue, etc.)
3. **Fix the issue**
4. **Re-run the failed validation step**
5. **Re-run all previous validation steps** (to ensure no regressions)
6. **Continue to the next step** only if all validations pass

---

## 5. Key Design Rules (Principal Engineer Mandates)

### 5.1 Do NOT
- ❌ Change any existing routes or layouts outside `/app/home/page.tsx`
- ❌ Remove or modify the Navbar component structure (restyle it in a new file if needed, but preserve the original)
- ❌ Create new API endpoints or modify backend code
- ❌ Remove any existing hooks or data fetching patterns
- ❌ Use `<style jsx>` — use CSS modules or Tailwind classes
- ❌ Import Font Awesome as a package — use Tabler Icons exclusively
- ❌ Use inline `<style>` tags (CSS variables in `globals.css` are acceptable)
- ❌ Use `img` tags without proper Next.js Image component, unless using external URLs (avatars)
- ❌ Override or delete the existing `globals.css` — add to it

### 5.2 Always
- ✅ Use TypeScript with proper types from `@/lib/types`
- ✅ Use existing hooks (`usePlayer`, `usePlayerStats`, `useProgression`) for data
- ✅ Follow the existing import alias pattern (`@/` for `src/`)
- ✅ Use `"use client"` for interactive components
- ✅ Add `aria-label` attributes to interactive elements
- ✅ Use semantic HTML (`<section>`, `<nav>`, `<footer>`, `<header>`)
- ✅ Make the page work without JavaScript (progressively)
- ✅ Keep the `SpotlightCard` wrapper style for consistency with the rest of the app
- ✅ Match the existing glass/glow aesthetic colors (orange primary)
- ✅ Build number values from the hooks (don't hardcode "67 WPM" — use `bestWpmOverall`)

### 5.3 Component File Structure

```
type-strike-web/src/components/home/
├── GridBackground.tsx
├── EmberParticles.tsx
├── HeroSection.tsx
├── AnimatedKeyboard.tsx
├── FloatingBadge.tsx
├── GameModeCard.tsx
├── ModeGrid.tsx
├── DailyBanner.tsx
├── ArsenalGrid.tsx
├── StreakWidget.tsx
├── RewardCalendar.tsx
├── DayCard.tsx
├── LeaderboardPreview.tsx
├── LeaderRow.tsx
├── HomeFooter.tsx
├── ToastNotification.tsx
├── NavModal.tsx
└── index.ts          ← barrel exports
```

### 5.4 Questions to ask the user before implementing

1. **Font Awesome vs Tabler Icons:** The HTML uses Font Awesome icons. The project uses Tabler Icons. Should I map all icons to their Tabler equivalents, or install Font Awesome?

2. **Shop route:** The HTML has a "Shop" nav item. There is no shop page currently. Do you want to remove it, map it to an existing page, or create a placeholder?

3. **"12,847 PLAYERS ONLINE" badge in hero:** There is no API for this. Should I remove it, mock it, or connect it to the player count backend endpoint if one exists?

4. **Navbar restyle:** The HTML navbar has a different visual style (gradient background, orbitron logo, different link styles, medal badge, streak pill, avatar). Should I create a `HomeNavbar` component that matches the HTML design while preserving the existing routes/functionality, or should I modify the existing `Navbar.tsx`?

5. **Modal navigation system:** The HTML shows a fancy modal when nav links are clicked. The current app just navigates directly. Do you want the modal-based navigation (show modal with route info + continue/cancel), or should the links navigate directly?

6. **Splash page:** The root `/` redirects to `/splash` which shows a splash animation and then redirects to `/app/home`. After the redesign, do you want to keep the splash page, or should `/` go directly to the new home page?

---

## 6. Verification Checklist (Final Sign-off)

Before declaring completion, verify ALL of the following:

- [ ] `npm run build` passes with 0 errors
- [ ] `npx tsc --noEmit` passes with 0 errors
- [ ] No console errors when loading the home page in the browser
- [ ] All sections render: hero, modes, daily banner, arsenal stats, streak, leaderboard, footer
- [ ] All navigation links work correctly (Strike, Learn, Coder, Ranks, etc.)
- [ ] Animations work: grid drift, embers, keyboard glow, floating badges
- [ ] Responsive: looks good at 1400px, 960px, and 520px
- [ ] Data from hooks displays correctly (player name, level, WPM, XP, streak, rank)
- [ ] Streak calendar shows dynamic data (not hardcoded)
- [ ] Daily timer counts down to midnight
- [ ] Toast notification appears on claim
- [ ] Hover effects work on all cards and buttons
- [ ] Mobile menu opens/closes correctly
- [ ] The page does not break if the user is signed out (shows fallback state)
- [ ] Keyboard shortcut (Enter) triggers navigation
- [ ] The existing splash → home redirect flow still works
- [ ] All existing routes outside `/app/home` are untouched

---

## 7. Rollback Plan

If at any point the build fails critically or the page breaks:

```bash
# Stash all changes
cd type-strike-web
git stash push -m "wip: homepage redesign rollback"

# If type-strike is the root project:
cd /Users/cpbrucemeena/Documents/Projects/type-strike
git checkout main
git pull origin main
git checkout -b feature/homepage-redesign-rollback
```

After rollback, assess what went wrong, fix the approach, and retry.

---

> **Final note to the AI:** You are a Principal Frontend Engineer. Every line you write should reflect deep understanding of React, Next.js, Tailwind, and production-grade UI engineering. If something is unclear — ask. If something seems wrong — flag it. If a better approach exists — suggest it. Do not blindly copy the HTML — adapt it to the project's existing patterns. Quality over speed. Precision over volume.
