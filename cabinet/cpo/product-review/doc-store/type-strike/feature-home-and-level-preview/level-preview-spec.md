# Product Spec: Level Preview Bottom Sheet
**Feature:** type-strike Level Preview  
**Date:** 2026-06-17  
**Status:** Draft for Review  
**Priority:** P1 — Should ship in MVP  

---

## 1. Overview

### Purpose
The Level Preview is a **bottom sheet** that gives the player a detailed look at a level before they commit to playing it. It appears when the player taps an unlocked or completed level node on the Map screen. It provides the target metrics, best score, a preview of the words, and a clear "STRIKE" action to enter gameplay.

### Trigger
- Tap an **unlocked** level node on the Map
- Tap a **completed** level node on the Map (to replay)
- "JUMP IN" from Home screen (auto-selects next uncompleted level)

### Dismissal
- Tap "STRIKE" → Navigate to Gameplay
- Swipe down on the sheet handle → Return to Map
- System Back gesture → Return to Map
- Tap outside the sheet (scrim area) → Return to Map

### Navigation
| Direction | Action | Destination |
|-----------|--------|-------------|
| Forward | "STRIKE" button | Gameplay Arena |
| Backward | Swipe down / System Back / Tap scrim | Map (previous screen) |

---

## 2. Screen Layout

### 2.1 Full Mockup (Phone — Compact)

```
┌────────────────────────────────────────────┐
│                                            │
│           (Map screen visible              │
│            behind scrim)                   │
│                                            │
│                                            │
│                                            │
│  ┌────────── Bottom Sheet ─────────────┐   │
│  │  ─────── (drag handle) ───────       │   │
│  │                                      │   │
│  │  ┌── Header ───────────────────────┐ │   │
│  │  │  MAGMA'S EDGE        [Ember 🔥] │ │   │
│  │  └──────────────────────────────────┘ │   │
│  │                                      │   │
│  │  ┌── Difficulty Indicator ─────────┐  │   │
│  │  │  ◈◈◈◇◇   Difficulty: Medium    │  │   │
│  │  └──────────────────────────────────┘  │   │
│  │                                      │   │
│  │  ┌── Target Metrics ───────────────┐  │   │
│  │  │  PASS:  40 WPM  ·  90% ACC     │  │   │
│  │  │  BEST:  52 WPM  ·  96% ACC  ★★ │  │   │
│  │  └──────────────────────────────────┘  │   │
│  │                                      │   │
│  │  ┌── Word Preview ─────────────────┐  │   │
│  │  │  ⚡  FLAME   BLAZE   CRUSH     │  │   │
│  │  │     3–5 letter words · 10 words│  │   │
│  │  └──────────────────────────────────┘  │   │
│  │                                      │   │
│  │  ┌──── "STRIKE" Button ────────────┐  │   │
│  │  │   🔥  STRIKE                     │  │   │
│  │  └──────────────────────────────────┘  │   │
│  └──────────────────────────────────────────┘   │
│                                            │
└────────────────────────────────────────────┘
```

### 2.2 Component Hierarchy

```
BottomSheet (Standard, peek height = ~50%)
├── DragHandle (centered, short horizontal bar)
│
├── HeaderRow
│   ├── LevelName: "MAGMA'S EDGE" (headline-medium, bold)
│   └── TierBadge: "Ember 🔥" (chip, tonal)
│
├── DifficultyIndicator
│   ├── ShardsRow: ◈◈◈◇◇ (filled = harder)
│   └── Label: "Difficulty: Medium" (body-small, muted)
│
├── MetricsSection
│   ├── PassRow
│   │   ├── Label: "PASS" (label-small, gray)
│   │   ├── WPM: "40 WPM" (body-medium, bold, primary)
│   │   └── Accuracy: "90% ACC" (body-medium, bold, primary)
│   └── BestRow
│       ├── Label: "BEST" (label-small, gold)
│       ├── WPM: "52 WPM" (body-medium, bold, gold)
│       └── Accuracy: "96% ACC" (body-medium, bold, gold)
│       └── Stars: "★★" (gold)
│
├── WordPreviewSection
│   ├── WordChips: ["FLAME", "BLAZE", "CRUSH"] × 3
│   ├── Icon: ⚡ (before words)
│   └── InfoLabel: "3–5 letter words · 10 total" (label-small, gray)
│
└── StrikeButton (FilledButton, full-width)
    ├── Icon: 🔥 (left)
    ├── Label: "STRIKE"
    └── Haptic: CONFIRM on press
```

---

## 3. Component Specifications

### 3.1 Bottom Sheet Container

| Property | Value |
|----------|-------|
| Component | `BottomSheet` (standard modal) |
| Peek height | ~50% of screen height (varies by content) |
| Max height | 65% of screen height |
| Corner radius | 20px (top corners only) |
| Background | Dark slate (#1a1a28) |
| Border | 1px top border (#2a2a3a) |
| Shadow | 0 -4px 30px rgba(0,0,0,0.5) |
| Scrim color | rgba(0,0,0,0.5) |
| Scrim fade duration | 200ms |
| Sheet slide duration | 350ms (ease-out) |

**Drag Handle:**
| Property | Value |
|----------|-------|
| Width | 32dp |
| Height | 4dp |
| Border radius | 2dp |
| Color | #555 |
| Margin | 8dp auto |

### 3.2 Header Row

| Property | Value |
|----------|-------|
| Padding | 12dp 20dp 4dp 20dp |

**Level Name:**
| Property | Value |
|----------|-------|
| Text | Level name from game data (e.g., "Magma's Edge") |
| Style | headline-medium (20px), 800 weight |
| Color | White (#ffffff) |
| Letter-spacing | 1px |

**Tier Badge:**
| Property | Value |
|----------|-------|
| Component | Chip (tonal) |
| Text | Tier name + icon (e.g., "Ember 🔥", "Igneous 🌋", "Magma Core 🔴", "Obsidian ⚫") |
| Style | label-small (11px), 700 weight, uppercase |
| Background | Tier: Ember=#ff5020 at 15%, Igneous=#ff6600 at 15%, Magma Core=#cc44ff at 15%, Obsidian=#fff at 8% |
| Text color | Matching tier accent |
| Padding | 4px 10px |
| Border radius | 6px |

### 3.3 Difficulty Indicator

| Property | Value |
|----------|-------|
| Padding | 4dp 20dp |

**Shards Row:**
| Property | Value |
|----------|-------|
| Component | 5 crystal shard icons in a row |
| Shard style | Clip-path diamond (4dp × 4dp) |
| Filled shard | Magma red (#ff5020) with 0 0 6px glow |
| Empty shard | #333 with no glow |
| Gap | 6dp between shards |

**Difficulty mapping:**
| Difficulty | Filled Shards | Label |
|------------|---------------|-------|
| Easy (Tier 1) | 1 of 5 | "Difficulty: Beginner" |
| Medium (Tier 2) | 3 of 5 | "Difficulty: Medium" |
| Hard (Tier 3) | 4 of 5 | "Difficulty: Hard" |
| Expert (Tier 4) | 5 of 5 | "Difficulty: Expert" |

### 3.4 Metrics Section

| Property | Value |
|----------|-------|
| Padding | 8dp 20dp |
| Background | #141420 at 50% opacity |
| Border radius | 8px |
| Margin | 0 20dp |

**Layout:**
```
┌──────────────────────────────────┐
│  PASS     40 WPM   ·   90% ACC   │
│  BEST     52 WPM   ·   96% ACC ★★│
└──────────────────────────────────┘
```

**Pass Row:**
| Element | Style |
|---------|-------|
| Label "PASS" | label-small, #666, width 40dp |
| WPM value | body-medium (14px), 700 weight, #ff5020 |
| Separator "·" | #444 |
| Accuracy value | body-medium (14px), 700 weight, #ff5020 |

**Best Row:**
| Element | Style |
|---------|-------|
| Label "BEST" | label-small, #ffcc00, width 40dp |
| WPM value | body-medium (14px), 700 weight, #ffcc00 |
| Separator "·" | #444 |
| Accuracy value | body-medium (14px), 700 weight, #ffcc00 |
| Stars | Color: #ffcc00, text-shadow: 0 0 6px rgba(255,204,0,0.3) |

**States:**
| State | Best Row Behavior |
|-------|-------------------|
| Never played | Hide Best Row entirely |
| Played once | Normal — show best score |
| No stars (failed) | Show best score, no stars |

### 3.5 Word Preview Section

| Property | Value |
|----------|-------|
| Padding | 4dp 20dp |

**Word Chips:**
| Property | Value |
|----------|-------|
| Component | Row of 3 `Chip`s (outlined) |
| Text | 3 sample words from the level's word bank |
| Style | body-small (12px), 600 weight |
| Color | #888 |
| Border | 1px solid #2a2a3a |
| Padding | 4px 10px |
| Border radius | 6px |
| Gap | 8dp |
| Icon | ⚡ before words, 12px, #555 |

**Info Label:**
| Text | Style |
|------|-------|
| "{min}-{max} letter words · {count} total" | label-small (11px), #555 |
| Margin | 4dp top |

### 3.6 "STRIKE" Button

| Property | Value |
|----------|-------|
| Component | `FilledButton` (full-width) |
| Background | Gradient: #ff5020 → #cc3300 (45°) |
| Text | "STRIKE" |
| Text style | title-medium (14px), 800 weight, white, letter-spacing 2px |
| Icon | 🔥 (18dp, left) |
| Height | 52dp |
| Border radius | 12px |
| Margin | 16dp 20dp 24dp 20dp |
| Shadow | 0 4px 20px rgba(255,80,32,0.3) |
| Haptic | `HapticFeedbackConstants.CONFIRM` on press |
| Animation | Scale 0.97 on press, glow intensifies on hold |

**States:**
| State | Visual |
|-------|--------|
| Enabled | Normal gradient, full opacity |
| Pressed | Slightly darker, scale 0.97 |
| Disabled | Not used (button is always enabled) |
| Loading | Not used (no async action) |

---

## 4. Dynamic Content

### 4.1 Level Data Mapping

The bottom sheet is populated with data specific to the tapped level. The data structure:

```typescript
interface LevelData {
  id: number;                    // 1–100
  name: string;                  // "Magma's Edge"
  tier: 'ember' | 'igneious' | 'magma_core' | 'obsidian';
  difficulty: 1 | 2 | 3 | 4;    // 1=easy, 4=expert
  passWpm: number;               // 30–80 (scales with difficulty)
  passAccuracy: number;          // 85–95 (scales with difficulty)
  wordMinLength: number;         // 3–6
  wordMaxLength: number;         // 5–12
  wordCount: number;             // 10–18
  sampleWords: string[];        // 3 words from the level's word bank
  playerBest?: {
    wpm: number;
    accuracy: number;
    stars: number;               // 0–3
  };
}
```

### 4.2 Tier-Specific Variables

| Tier | Badge | Difficulty Shards | Pass WPM Range | Word Length |
|------|-------|-------------------|----------------|-------------|
| Ember 🔥 | Ember | 1–2 filled | 30–40 | 3–5 |
| Igneous 🌋 | Igneous | 3 filled | 40–55 | 4–7 |
| Magma Core 🔴 | Magma Core | 4 filled | 55–70 | 5–9 |
| Obsidian ⚫ | Obsidian | 5 filled | 70–80+ | 6–12 |

### 4.3 Star Context

| Stars | Achievement | Best Row Color |
|-------|-------------|----------------|
| Never played | (hidden) | N/A |
| 0 stars (failed) | Show best score only | #888 (gray) |
| ★ | Minimum pass | #ffcc00 (gold) |
| ★★ | Exceeded by 15% | #ffcc00 (gold, brighter) |
| ★★★ | Near-perfect | #ffcc00 (gold + glow) |

---

## 5. Visual Styling

### 5.1 Animation Sequence on Open

1. [0ms] Scrim fades in (200ms, ease-out)
2. [100ms] Sheet slides up from bottom (350ms, cubic-bezier(0.34, 1.56, 0.64, 1))
3. [200ms] Header text fades in (200ms, ease-out)
4. [300ms] Difficulty shards fill in sequence (left to right, 100ms each)
5. [400ms] Metrics section fades + slides up from 8dp (300ms, ease-out)
6. [500ms] Word chips fade in with stagger (100ms each)
7. [600ms] "STRIKE" button slides up from 16dp + begins pulsing glow (400ms, overshoot)

### 5.2 Animation Sequence on Close (Swipe Down or Back)

1. [0ms] "STRIKE" button fades out (100ms)
2. [50ms] Content fades out (150ms)
3. [200ms] Sheet slides down (250ms, ease-in)
4. [450ms] Scrim fades out (150ms)
5. [600ms] Full close complete — Map fully interactive

### 5.3 Colors

| Role | Color | Hex |
|------|-------|-----|
| Sheet background | Dark slate | `#1a1a28` |
| Sheet border (top) | Subtle gray | `#2a2a3a` |
| Scrim | Black at 50% | `rgba(0,0,0,0.5)` |
| Handle | Muted gray | `#555` |
| Header text | White | `#ffffff` |
| Tier badge bg (Ember) | Red at 15% | `rgba(255,80,32,0.15)` |
| Tier badge text (Ember) | Magma red | `#ff5020` |
| Difficulty filled shard | Magma red | `#ff5020` |
| Difficulty empty shard | Dark | `#333` |
| Metric pass color | Magma red | `#ff5020` |
| Metric best color | Gold | `#ffcc00` |
| Metric separator | Muted | `#444` |
| Word chip text | Gray | `#888` |
| Word chip border | Subtle | `#2a2a3a` |
| "STRIKE" button bg | Gradient | `#ff5020→#cc3300` |
| "STRIKE" button shadow | Red glow | `rgba(255,80,32,0.3)` |

### 5.4 Typography

| Element | Font | Size | Weight | Letter-spacing |
|---------|------|------|--------|----------------|
| Level name (header) | Inter / Sora | 20px | 800 | 1px |
| Tier badge | Inter | 11px | 700 | 1px (uppercase) |
| Difficulty label | Inter | 12px | 500 | — |
| Metric value (pass) | Inter | 14px | 700 | 0.5px |
| Metric value (best) | Inter | 14px | 700 | 0.5px |
| Metric label | Inter | 11px | 600 | 1px (uppercase) |
| Word chip | Inter | 12px | 600 | — |
| Word info label | Inter | 11px | 500 | — |
| "STRIKE" button | Inter / Sora | 14px | 800 | 2px (uppercase) |

---

## 6. States & Edge Cases

### 6.1 Locked Level Tap

**Trigger:** Player taps a locked level node on the map.

**Behavior:** Do NOT open the Level Preview sheet. Instead:
- Show a brief tooltip/popup: "Clear Level [N-1] to unlock"
- Tooltip appears near the node, auto-dismisses after 2s
- Slight red flash on the lock icon

**Visual (tooltip):**
```
┌──────────────────────┐
│ 🔒  Clear Level 6    │
│     to unlock        │
└──────────────────────┘
```
- Background: #1a1a28
- Border: #ff5020 at 20%
- Text: body-small, #ccc
- Arrow pointing to the node
- Entrance: fade in + slide up (150ms)
- Exit: fade out (300ms delay, then 150ms)

### 6.2 First-Time Level (No Best Score)

- Metrics section shows only the **Pass Row**
- Best Row is hidden entirely
- "STRIKE" button is especially prominent (matches normal state)

### 6.3 Returning to a Completed Level

- Metrics section shows both Pass and Best rows
- Best Row shows best score + stars
- "STRIKE" button sub-label: "Play again to beat your score" (optional future enhancement)

### 6.4 Level Preview from "JUMP IN" (Home Screen)

- Sheet opens directly with the next uncompleted level's data
- Animation is the same as from Map
- Back navigation → Map (not Home)

---

## 7. Accessibility

| Check | Requirement |
|-------|-------------|
| Touch targets | "STRIKE" button ≥ 48dp ✅; word chips ≥ 32dp (outlined, not primary action) |
| Content descriptions | "Level 7, Magma's Edge. Tier: Ember. Difficulty: Medium. Pass at 40 WPM and 90 percent accuracy. Best: 52 WPM, 96 percent accuracy, 2 stars." |
| Sheet dismiss | System back + swipe down — both work ✅ |
| Motion sensitivity | Respect reduced motion — skip stagger fill animations, simple crossfade |
| Focus order | Header → Difficulty → Metrics → Words → "STRIKE" — left to right, top to bottom |
| Color contrast | Gold (#ffcc00) on dark (#141420): ~12.5:1 ✅ Pass AAA |
| Reduce transparency | Scrim opacity can be reduced to 30% if "reduce transparency" setting is on |

---

## 8. Data Requirements

| Data Point | Source | Notes |
|------------|--------|-------|
| Level name | Game config | Stored in level data (string) |
| Tier | Game config | `'ember' | 'igneious' | 'magma_core' | 'obsidian'` |
| Difficulty | Game config | 1–4 integer |
| Pass WPM | Game config | Scaled by difficulty |
| Pass accuracy | Game config | Scaled by difficulty |
| Word length range | Game config | Min/max letter length |
| Word count | Game config | Words per level |
| Sample words | Game config | Pick 3 from word bank |
| Player best WPM | Local storage | From LevelProgress |
| Player best accuracy | Local storage | From LevelProgress |
| Player stars | Local storage | 0–3 |
| Level unlocked | Computed | Previous level completed |

---

## 9. Performance Considerations

| Area | Requirement |
|------|-------------|
| Sheet open animation | 60fps, < 16ms frame budget |
| Content loading | Sheet content is data-driven (no images) — should be instant |
| Memory | Sheet allocates ~4KB for text content — negligible |
| Recomposition | Avoid unnecessary recomposition — only level ID changes between opens |
| Scrim rendering | Single semi-transparent overlay — GPU-efficient |

---

## 10. Implementation Notes

### 10.1 Layout Constraints

| Section | Height |
|---------|--------|
| Drag handle | 16dp |
| Header row | 36dp |
| Difficulty indicator | 28dp |
| Metrics section | 56dp |
| Word preview | 36dp |
| Spacing + padding | 32dp |
| "STRIKE" button | 60dp |
| Bottom safe area | 16dp |
| **Total** | ~280dp |

### 10.2 Gesture Handling

- **Swipe down:** Sheet follows finger with rubber-banding; snap below 50% threshold → dismiss
- **System Back:** Dismiss immediately with close animation
- **Tap scrim:** Dismiss with close animation
- **Drag handle:** Primary touch target for swipe gesture

### 10.3 Predictive Back Gesture (Android 14+)

During system back gesture from Level Preview:
- Show the Map screen **behind** the sheet (already visible through scrim)
- Sheet slides down following finger position
- On full gesture: sheet dismisses, Map is fully revealed
- On cancel: sheet snaps back to open position

### 10.4 Code Structure (Unity/C# Example)

```csharp
public class LevelPreviewController : MonoBehaviour
{
    [SerializeField] private GameObject sheetRoot;
    [SerializeField] private TextMeshProUGUI levelNameText;
    [SerializeField] private TextMeshProUGUI tierBadgeText;
    [SerializeField] private Image[] difficultyShards;       // 5 images
    [SerializeField] private GameObject metricsSection;
    [SerializeField] private TextMeshProUGUI passWpmText;
    [SerializeField] private TextMeshProUGUI passAccText;
    [SerializeField] private GameObject bestRow;
    [SerializeField] private TextMeshProUGUI bestWpmText;
    [SerializeField] private TextMeshProUGUI bestAccText;
    [SerializeField] private TextMeshProUGUI bestStarsText;
    [SerializeField] private TextMeshProUGUI[] wordChips;    // 3 chips
    [SerializeField] private TextMeshProUGUI wordInfoText;
    [SerializeField] private Button strikeButton;
    [SerializeField] private Image scrim;

    private int currentLevelId;
    private LevelData currentLevel;

    public void Show(LevelData level, PlayerProgress progress)
    {
        currentLevel = level;
        currentLevelId = level.id;

        // Populate UI
        levelNameText.text = level.name.ToUpper();
        tierBadgeText.text = GetTierLabel(level.tier);

        // Difficulty shards
        for (int i = 0; i < 5; i++)
        {
            difficultyShards[i].color = i < level.difficulty ? shardFilledColor : shardEmptyColor;
            difficultyShards[i].gameObject.SetActive(true);
        }

        // Metrics
        passWpmText.text = $"{level.passWpm} WPM";
        passAccText.text = $"{level.passAccuracy}% ACC";

        if (progress != null)
        {
            bestRow.SetActive(true);
            bestWpmText.text = $"{progress.bestWpm} WPM";
            bestAccText.text = $"{progress.bestAccuracy}% ACC";
            bestStarsText.text = GetStarsString(progress.stars);
        }
        else
        {
            bestRow.SetActive(false);
        }

        // Word preview
        for (int i = 0; i < 3; i++)
        {
            wordChips[i].text = level.sampleWords[i];
        }
        wordInfoText.text = $"{level.wordMinLength}–{level.wordMaxLength} letter words · {level.wordCount} total";

        // Button
        strikeButton.onClick.RemoveAllListeners();
        strikeButton.onClick.AddListener(() => OnStrikePressed());

        // Animate in
        PlayOpenAnimation();
    }

    private void OnStrikePressed()
    {
        // Navigate to Gameplay with this level
        NavigationController.Instance.NavigateToGameplay(currentLevelId);
    }
}
```
