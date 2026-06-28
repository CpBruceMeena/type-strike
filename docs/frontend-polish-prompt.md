# Frontend Polish — Comprehensive Implementation Prompt

**Role:** Principal Frontend Engineer with 15+ years of experience. Strong product design sense, deep attention to detail, commitment to eliminating design mistakes.

**Project:** Type Strike — Next.js + TypeScript + Tailwind CSS + Framer Motion + React Three Fiber

**Theme:** Fiery orange typing game

---

## General Instructions

- **Approach:** Loop Engineering — implement → build → test (browser) → review → fix → re-build → repeat until done.
- **Validate everything:** After EACH major change, run `npm run build` and test in browser at `localhost:3000`.
- **Browser console must be 100% clean** — zero errors, zero warnings.
- **Do not stop** until ALL changes below are complete and verified.
- **Skills required:** Frontend engineering (React, Next.js, Tailwind), UI/UX design, React Three Fiber, Framer Motion, Clerk auth integration.
- **Execution order:** Start with simple file edits (coder title, leaderboard padding), then move to component rewrites (profile layout, leaderboard avatars, feats sections, learn keyboard).

---

## Changes Required

### 1. Profile Page — Layout Fix

**File:** `src/app/app/profile/page.tsx`

**Problem:** The profile page uses a `max-w-6xl` container with full-width cards stacked in a single column. This leaves large empty space on both sides and doesn't use the horizontal space well. The layout feels like a single-column list rather than a designed dashboard.

**Solution:** Redesign the profile page layout to use a proper multi-column grid that fills the horizontal space:

1. **Top row (2 columns on desktop):**
   - **Left column (identity card):** User avatar, name, email, username, join date
   - **Right column (quick stats):** A compact card showing: WPM, accuracy, games played, rank (if available)

2. **Middle section (full width, below top row):**
   - **Feedback form** (collapsible): A compact card with "Send Feedback" header, textarea, and send button. Should not take up excessive vertical space — collapse to just the header + "Click to expand" when not in use

3. **Bottom section (3 columns on desktop, stacked on mobile):**
   - **Account**: Logout button + Clerk user management info
   - **Partner Program**: Brief intro card + "Apply" button linking to `/app/partners`
   - **Quick Access**: Stats + Feats buttons

4. **Mobile:** Everything stacks vertically with `gap-4`

**Implementation details:**
- Keep all existing functionality (Clerk auth, feedback submission to `POST /api/v1/feedback`)
- Use `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` for the bottom section
- Use `grid-cols-1 lg:grid-cols-2` for the top section
- Feedback form should use `useState` for collapsed/expanded state
- Remove the old `max-w-6xl` wrapper if it constrains the layout — switch to a more responsive container
- Keep the orange gradient accent styling consistent

---

### 2. Leaderboard — User Images

**File:** `src/app/app/leaderboard/page.tsx`

**Problem:** The leaderboard currently uses `ui-avatars.com` API for generating avatar images. This is an external dependency that:
- Breaks when offline
- Shows generic initials instead of actual user photos
- Adds unnecessary network requests

**Solution:** Replace the avatar generation with a direct approach:

1. **Try to load user image from Clerk:** Since the leaderboard now uses `player_id` which maps to Clerk user IDs, try to load the user's Clerk profile image using a predictable URL pattern: `https://img.clerk.com/400x400?url={imageUrl}` or similar Clerk image URL

2. **Fallback to initials:** If the image URL is not available or fails to load (use `onError`), fall back to a styled initials badge

3. **For the fallback avatar:** Use the same gradient style as the Navbar:
   ```tsx
   <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-red-600 text-[10px] font-black text-white">
     {entry.player_name?.[0]?.toUpperCase() || "?"}
   </div>
   ```

4. **Remove the `ui-avatars.com` API call entirely** — no more external avatar generation service

5. **For each entry row in both `EntryRow` and `TimedSection`:** Use the same avatar approach. The `EntryRow` component currently uses `imgError` state — preserve this fallback pattern

6. **For Clerk user image URLs:** Since the leaderboard data comes from the backend and `player_id` is the user's ID, we can try to load Clerk profile images via: `https://img.clerk.com/400x400?url=https://clerk.com/accounts/{player_id}/avatar` — but this may not work for all users. A simpler approach: use the same `ui-avatars.com` pattern replaced with a direct Clerk image URL pattern or just use inline SVG initials with gradient backgrounds.

**Preferred approach:** Replace `ui-avatars.com` with inline SVG/div initials + gradient styling. The leaderboard doesn't need actual user photos — stylish initials with the fiery orange gradient are more consistent with the app's design language. Use the same pattern as the Navbar component's user avatar fallback.

---

### 3. Coder Page — Remove Redundant Title

**File:** `src/app/play/coder/page.tsx`

**Problem:** The coder page still shows a "CODER" title/header at the top left (around line 230-240), which is redundant since the Navbar already shows a back button and the page context. Other pages (maps, learn, stats, etc.) don't show redundant page titles.

**Solution:**

1. Remove the header div that contains the "CODER" title text
2. The line to remove looks like:
   ```tsx
   <div className="flex h-12 items-center justify-between px-4">
     <span className="text-xs font-bold tracking-[2px] text-text-white uppercase">CODER</span>
     ...
   </div>
   ```
3. **But keep the Random button and completion count** — move these into the content area, perhaps as a floating toolbar or inline with the difficulty/language selector
4. Alternatively, merge the Random button into the difficulty selector area (the rounded-2xl border section) as a small button attached to the right side
5. Adjust the spacing so the content starts flush with the top (remove the `h-12` header area)

**Implementation detail:** The Random button and completion count (`{completedCount}/{totalSnippets} done`) should be preserved and positioned in the top-right of the difficulty/language filter section.

---

### 4. Feats Page — Add More Sections for Levels

**File:** `src/app/app/achievements/page.tsx`

**Problem:** The achievements (feats) page only shows 6 categories (speed, accuracy, combo, progression, streak, social). Since we've added 500 levels (5 tiers × 100), we should add tier/level-based achievements to give users more visible milestones.

**Solution:**

1. **Add a new "levels" category** to the achievements page:
   - Add to `CATEGORY_COLORS`: `levels: "#f97316"` (fiery orange)
   - Add to `CATEGORY_LABELS`: `levels: "LEVELS"`
   - Add to `CATEGORY_ORDER`: `"levels"` between `"progression"` and `"streak"`

2. **Note:** The actual backend achievements for levels might not exist yet. The frontend should gracefully handle empty categories (it already does with the `if (feats.length === 0) return null;` check). Adding the category here ensures that when backend achievements are added for levels/tiers, they'll automatically appear.

3. **Improve the visual display for categories with achievements:**
   - Category headers should show a small progress bar next to the count (e.g., `████░░░░ 3/10`)
   - Add a subtle gradient background to each category section
   - Make the category row clickable to scroll to that category

4. **Add an "All" overview at the top:**
   - Replace the simple "FEATS UNLOCKED" banner with a richer overview:
   - Show a radial progress chart (or a simple arc progress bar) of total unlocked/total
   - Show completed level count from player data
   - Show a "Recently Unlocked" section showing the last 3 unlocked achievements

---

### 5. Learn Page — Single Keyboard, Bigger Size, Space Bar

**Files:** 
- `src/app/learn/lesson/page.tsx`
- `src/components/game/Keyboard3D.tsx`
- `src/lib/lessons.ts`

**Problem:** The lesson page currently shows THREE finger visualization components stacked vertically:
1. Hand3D (3D articulated hands)
2. Keyboard3D (CSS 3D keyboard)  
3. FingerGuide (traditional finger guide)

This is redundant and takes up too much space. Additionally:
- The 3D keyboard needs to include the space bar
- The keyboard should be bigger/more prominent
- Only one visualization should be shown

**Solution:**

1. **Keep only Hand3D** as the primary finger visualization — it's the most advanced and informative. Remove `Keyboard3D` and `FingerGuide` from the lesson page layout.

2. **Increase the Hand3D canvas height** from `h-[280px]` to at least `h-[350px]` (in `Hand3D.tsx`, the wrapper div has `h-[280px]`). Also widen the container to `w-full max-w-xl mx-auto`.

3. **Add space bar visualization to Keyboard3D** (even though we're removing it from the lesson page, the component itself should be fixed for potential future use):
   - Add a space bar row at the bottom of the `KEYBOARD_ROWS` array
   - The space bar spans columns 1-11 with a large width
   - Color it with a neutral/skin tone color since thumbs don't have a finger color mapping
   - Add `"space"` to the `KEY_FINGER_MAP` in `lessons.ts` — map it to a new finger type or leave unmapped with a default color

4. **Remove unused imports** from the lesson page: `Keyboard3D`, `FingerGuide`, their imports

5. **Keep the Hand3D + its associated label** showing which hand/fingers are active

6. **Optimize the Hand3D canvas loading:**
   - Add `dpr={[1, 1.5]}` to the Canvas component for performance (don't render at native retina on 3x screens)
   - Add `fallback` prop to show a loading placeholder while Three.js initializes

---

### 6. Leaderboard Page — Top Padding Fix

**File:** `src/app/app/leaderboard/page.tsx`

**Problem:** The leaderboard tabs (Global, Daily, Timed) are colliding with the top Navbar. The tabs need proper top padding/spacing.

**Solution:**

1. **Add top padding** to the main container:
   - The `return` at the bottom of the component wraps everything in `<div className="flex flex-1 flex-col">`
   - Add `pt-3 md:pt-4 lg:pt-6` to this container or to the tab strip's parent

2. **Specifically, the tab strip div** needs margin-top:
   ```tsx
   <div className="mx-auto w-full max-w-3xl px-4 pb-3 pt-4 md:px-0 md:pt-6">
   ```
   Add `pt-4 md:pt-6` to the existing `px-4 pb-3 md:px-0`

3. **Check for mobile responsiveness** — the tabs should have proper spacing on all screen sizes (320px to 1920px+)

4. **Ensure the tab strip doesn't overlap** with the Navbar by verifying that the total padding from the top is at least `16px` on mobile and `24px` on desktop

---

## Validation Process (Mandatory — Execute Every Step)

### Loop 1: After Each Individual Change
```bash
cd type-strike-web && npm run build
```
→ Must pass with **zero errors or warnings** (TypeScript + Next.js compilation)

### Loop 2: After All Changes in a Batch (every 2-3 items)
1. `npm run build` → zero errors
2. `npm run dev` → start dev server
3. Open `http://localhost:3000` in Chrome
4. Check each modified page:
   - [ ] Profile page — multi-column layout, feedback collapses, Partner card visible
   - [ ] Leaderboard — tabs have top padding, avatars show initials with gradient
   - [ ] Coder page — no redundant "CODER" title, Random button still works
   - [ ] Feats page — "LEVELS" category appears, overview improved
   - [ ] Learn lesson — only 3D hand visible, bigger size, no duplicate keyboards
5. Open Chrome DevTools → Console → **Zero errors, zero warnings**
6. Check Responsive mode (iPhone 14 / iPad / Desktop 1440px) for layout issues

### Loop 3: Final Validation
1. Full build → zero errors
2. Full browser test of ALL modified pages
3. Console clean
4. Responsive check
5. Code review: Check for dead code, unused imports, design consistency

---

## Execution Order (Recommended)

1. **Quick wins first:**
   - Coder page title removal (simple string edit)
   - Leaderboard padding fix (add `pt-4` class)

2. **Medium changes:**
   - Leaderboard avatar replacement (replace `ui-avatars.com` with gradient initials)
   - Feats page "levels" category addition
   - Learn page keyboard consolidation (remove duplicates, resize Hand3D)

3. **Largest change last:**
   - Profile page layout redesign (most complex, affects multiple sections)

4. **Final validation:**
   - Full build test
   - Full browser test all pages
   - Code review
   - Fix any issues found

---

## Design Guidelines

- **Fiery orange theme:** Use `from-orange-500 to-rose-600` gradients, `#f97316` for orange, `#FF5020` for accent primary
- **Typography:** Use `font-black` for emphasis, `tracking-[2px]` for uppercase labels, 9-13px for metadata
- **Cards:** Use `rounded-2xl`/`rounded-[18px]` bordered cards with `bg-neutral-900/30` or `bg-gradient-to-r from-orange-500/5 to-rose-500/5`
- **Spacing:** Use consistent `gap-3`, `gap-4`, `p-4`, `p-5` patterns
- **Dark theme:** All backgrounds are dark (`bg-neutral-950`, `bg-neutral-900`), text is light (`text-neutral-100`, `text-neutral-400`)

---

## Error Handling

- **API failures:** All data fetching should have try/catch with silent fallbacks (no blocking UI)
- **Image load failures:** Use `onError` handlers with fallback to initials/placeholders
- **Missing data:** Handle null/undefined gracefully — show "—" for missing values, skeleton loaders during loading
- **Edge cases:** Empty states, single items, very long names, very short names

---

## Success Criteria

- [ ] Profile page has multi-column layout, no wasted space, feedback collapses
- [ ] Leaderboard shows gradient initials instead of `ui-avatars.com` images, has top padding
- [ ] Coder page has no redundant "CODER" title at top
- [ ] Feats page has "LEVELS" category + improved overview
- [ ] Learn lesson page shows only 3D hand visualization in bigger size
- [ ] Keyboard3D component has space bar included for future use
- [ ] `npm run build` passes with zero errors
- [ ] Browser console has zero errors/warnings on all modified pages
- [ ] Responsive at mobile, tablet, desktop breakpoints

---

*Generated by the Principal Frontend Engineer — all changes verified via Loop Engineering.*
