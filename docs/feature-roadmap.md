# Type Strike — Feature Roadmap

> **Vision:** Build a competitive learning and gaming platform for typing  
> **Strategy:** Complete each task end-to-end (backend + frontend, fully working) before starting the next  
> **Date:** June 26, 2026  
> **Status:** Planning → Execution

---

## Execution Strategy

Each task is a **vertical slice** — full backend implementation (models, migrations, repository, handler, routes) **+** full frontend implementation (API client, hooks, pages, components) **+** build validation. No task is considered done until it's live and verified.

Tasks are ordered by dependency — Task 2 may depend on infrastructure built in Task 1, etc.

---

## Task 1: Gamified Progression System

### Goal
Turn the existing basic level/XP system into a rich progression loop with ranks, titles, unlockable rewards, and clear next-milestone visibility.

### Backend Work

| Item | Description |
|------|-------------|
| **Migration** | Add columns to `players` table: `rank_tier` (varchar), `current_title` (varchar), `unlocked_themes` (jsonb), `unlocked_titles` (jsonb), `next_title_threshold` (int) |
| **Model** | Extend `Player` model with new fields; add `ProgressionMilestone` model for milestone definitions |
| **Repository** | `ProgressionRepository` — get milestones, unlock rewards, check threshold crossing |
| **Handler** | `GET /api/v1/players/{id}/progression` — returns current rank tier, titles owned, next unlockable, progress to next milestone |
| **Handler** | `POST /api/v1/players/{id}/xp` — enhanced to check threshold crossing and auto-unlock rewards |
| **Seed data** | Rank tier definitions (Bronze→Silver→Gold→Platinum→Diamond→Obsidian), title unlocks at each tier, theme unlocks |

### Frontend Work

| Item | Description |
|------|-------------|
| **Types** | `ProgressionResponse`, `RankTier`, `UnlockableReward` interfaces |
| **API** | `getProgression(playerId)`, `claimReward(playerId, rewardId)` |
| **Hook** | `useProgression` — fetch and cache progression data |
| **Sidebar component** | Enhanced player display showing rank tier badge, XP progress to next rank, next unlock |
| **Home page** | Progression card showing current rank, progress bar to next rank, title displayed |
| **Victory page** | Celebration when a new rank is achieved — confetti + rank unlock animation |

### Success Criteria
- [ ] Player earns XP → threshold crossing triggers rank-up
- [ ] Rank-up unlocks new title and theme
- [ ] Dashboard shows current rank, progress to next, and what's unlocked next
- [ ] All endpoints return proper data with error handling

### Dependencies
- Existing: `players` table with `xp`, `level` fields — already in place
- Existing: XP award flow in game completion — already in place

---

## Task 2: Achievements System

### Goal
Build a full achievements system with 18+ achievements tracked server-side, an achievements gallery on the frontend, and unlock celebrations.

### Backend Work

| Item | Description |
|------|-------------|
| **Migration** | `achievements` (id, key, name, description, icon, category, max_progress), `player_achievements` (id, player_id, achievement_id, progress, unlocked_at, unlocked) |
| **Model** | `Achievement`, `PlayerAchievement` |
| **Repository** | `AchievementRepository` — CRUD, check unlock conditions, batch update progress |
| **Handler** | `GET /api/v1/players/{id}/achievements` — all achievements with player progress |
| **Handler** | `POST /api/v1/events/check-achievements` — event-driven achievement check |
| **Engine integration** | Achievement checker: on level complete, game complete, streak milestone, WPM record, total games played |

### Achievement Ideas (18+)

| Category | Achievements |
|----------|-------------|
| **Speed** | Reach 50 WPM, 75 WPM, 100 WPM, 120 WPM, 150 WPM |
| **Accuracy** | 95%+ accuracy on 10 levels, 98%+ on 25 levels, 100% on any level |
| **Combo** | 10-combo streak, 25-combo, 50-combo, 100-combo |
| **Progression** | Clear 10 levels, 25 levels, 50 levels, 75 levels, 100 levels |
| **Streak** | 3-day streak, 7-day, 14-day, 30-day, 60-day |
| **Social** | Win a contest, Top 10 in contest, Top 3 in contest |

### Frontend Work

| Item | Description |
|------|-------------|
| **Types** | `Achievement`, `PlayerAchievement` interfaces |
| **API** | `getAchievements(playerId)` |
| **Achievements page** | Grid of achievement cards with progress bars, locked/unlocked states, category filters |
| **Toast notification** | Achievement unlocked toast with animation on game completion |
| **Sidebar badge** | Achievement count badge on the FEATS nav item |

### Success Criteria
- [ ] 18+ achievements tracked and persisted in DB
- [ ] Achievements page shows all achievements with per-player progress
- [ ] Unlock notification appears when criteria met
- [ ] Backend checks achievements on game events

---

## Task 3: Daily Streak Rewards

### Goal
Transform the basic streak counter into an engaging daily reward system with escalating rewards, streak freezing, and visual progression.

### Backend Work

| Item | Description |
|------|-------------|
| **Migration** | `streak_rewards` (day_number, reward_type, reward_value, icon), player_streak enhancements: `last_claimed_day`, `streak_freezes_available`, `total_days_claimed` |
| **Model** | `StreakReward`, enhanced `Player` streak fields |
| **Repository** | `StreakRepository` — claim daily reward, get streak calendar, use freeze |
| **Handler** | `GET /api/v1/players/{id}/streak` — streak info + reward calendar (next 7 days visible) |
| **Handler** | `POST /api/v1/players/{id}/streak/claim` — claim today's reward |
| **Handler** | `POST /api/v1/players/{id}/streak/freeze` — use a streak freeze |

### Reward Scale (Day 1 → 30+)

| Day | Reward |
|-----|--------|
| 1-3 | +25 XP each |
| 4-7 | +50 XP + 1 star |
| 8-14 | +75 XP + 2 stars |
| 15-21 | +100 XP + 3 stars + streak freeze token |
| 22-30 | +150 XP + 5 stars + rare theme fragment |
| 30+ | +200 XP + 10 stars + premium currency |

### Frontend Work

| Item | Description |
|------|-------------|
| **Types** | `StreakInfo`, `StreakReward` interfaces |
| **API** | `getStreak(playerId)`, `claimDailyReward(playerId)`, `useStreakFreeze(playerId)` |
| **TopBar enhancement** | Streak badge shows current day + click to open streak panel |
| **Streak modal/panel** | 7-day rolling calendar showing past claimed days, today, upcoming rewards |
| **Claim animation** | Reward claim with particle burst + XP counter |

### Success Criteria
- [ ] Streak counter persists and correctly tracks consecutive days
- [ ] Daily reward claim flow works end-to-end
- [ ] Streak freeze mechanic works
- [ ] Upcoming rewards visible and motivating

---

## Task 4: Competitive Leaderboard Tiers

### Goal
Replace the flat leaderboard with ranked tiers (Bronze → Obsidian) with seasonal resets, promotion/relegation, and tier-specific rewards.

### Backend Work

| Item | Description |
|------|-------------|
| **Migration** | `leaderboard_tiers` (id, name, min_rank, max_rank, icon, color, rewards), add `tier` to `leaderboard_entries` |
| **Model** | `LeaderboardTier`, enhanced `LeaderboardEntry` |
| **Repository** | Tier assignment logic based on XP percentile, seasonal reset logic |
| **Handler** | `GET /api/v1/leaderboard/tiers` — tier definitions |
| **Handler** | `GET /api/v1/leaderboard/{playerId}/tier` — player's current tier + progress to next |
| **Handler** | `POST /api/v1/leaderboard/season/end` — trigger season reset |

### Tier Structure

| Tier | Rank Range | Icon | Color | Reward |
|------|-----------|------|-------|--------|
| Bronze | Top 100% | 🥉 | #CD7F32 | — |
| Silver | Top 50% | 🥈 | #C0C0C0 | Bronze theme |
| Gold | Top 25% | 🥇 | #FFCC00 | Silver theme + title |
| Platinum | Top 10% | 💎 | #00E5FF | Gold theme + avatar border |
| Diamond | Top 5% | 💠 | #8844FF | Platinum frame + animated badge |
| Obsidian | Top 1% | ⚫ | #FF5020 | Exclusive "OBSIDIAN" title + animated avatar |

### Frontend Work

| Item | Description |
|------|-------------|
| **Types** | `LeaderboardTier`, `TierProgress` |
| **API** | `getTiers()`, `getPlayerTier(playerId)` |
| **Leaderboard page** | Show player's current tier badge + progress to next tier |
| **Profile/Sidebar** | Tier badge shown next to player name |
| **Season timer** | Countdown to next season reset |

### Success Criteria
- [ ] Players are assigned to tiers based on XP percentile
- [ ] Tier badge visible on profile and leaderboard
- [ ] Seasonal reset archives current rankings and starts new season
- [ ] Tier-specific rewards unlock on promotion

---

## Task 5: Personal Goals & Challenges

### Goal
Allow players to set personal typing goals (WPM targets, accuracy milestones, weekly challenges) with progress tracking and celebrations.

### Backend Work

| Item | Description |
|------|-------------|
| **Migration** | `player_goals` (id, player_id, goal_type, target_value, current_value, start_date, end_date, completed, reward_claimed) |
| **Model** | `PlayerGoal` |
| **Repository** | CRUD, progress update on game events, completion checking |
| **Handler** | `GET /api/v1/players/{id}/goals` — active + completed goals |
| **Handler** | `POST /api/v1/players/{id}/goals` — create a new goal |
| **Handler** | `PATCH /api/v1/players/{id}/goals/{goalId}/progress` — update progress |

### Goal Types

| Type | Example | Duration |
|------|---------|----------|
| `speed_target` | "Reach 80 WPM" | Open-ended |
| `accuracy_target` | "Maintain 95% accuracy for 10 games" | Open-ended |
| `weekly_games` | "Play 20 games this week" | 7 days |
| `weekly_wpm` | "Average 75+ WPM this week" | 7 days |
| `level_clear` | "Clear 5 levels this week" | 7 days |
| `combo_master` | "Achieve 50-combo streak" | Open-ended |
| `daily_streak` | "Maintain a 7-day streak" | Rolling |

### Frontend Work

| Item | Description |
|------|-------------|
| **Types** | `PlayerGoal`, `GoalType` interfaces |
| **API** | `getGoals(playerId)`, `createGoal(playerId, data)`, `updateGoalProgress(playerId, goalId)` |
| **Home page** | "Weekly Goals" card showing active goals with progress bars |
| **Goals page or modal** | Create new goal flow, view all goals, goal history |
| **Goal completion** | Celebration animation when a goal is completed |
| **Notification** | "Goal nearly complete — only 3 more games this week!" |

### Success Criteria
- [ ] Players can create goals from predefined types
- [ ] Progress updates automatically on game completion
- [ ] Goal completion triggers celebration
- [ ] Weekly goals reset automatically

---

## Task 6: Performance Insights Dashboard

### Goal
Build a rich analytics dashboard showing trend analysis, WPM forecasting, accuracy heatmaps by key/finger, and comparison vs similarly-skilled players.

### Backend Work

| Item | Description |
|------|-------------|
| **Migration** | `performance_snapshots` (id, player_id, snapshot_date, avg_wpm, avg_accuracy, games_played, weak_keys jsonb) |
| **Model** | `PerformanceSnapshot` |
| **Repository** | Aggregate queries: weekly averages, trend computation, percentile ranking |
| **Handler** | `GET /api/v1/players/{id}/performance` — overview stats + trends |
| **Handler** | `GET /api/v1/players/{id}/performance/history?range=7d|30d|90d` — time series |
| **Handler** | `GET /api/v1/players/{id}/performance/weak-keys` — key-level accuracy breakdown |
| **Handler** | `GET /api/v1/players/{id}/performance/percentile` — player's percentile by WPM |

### Dashboard Sections

| Section | Content |
|---------|---------|
| **Overview** | Current WPM, accuracy, trend (↑↓), games this week, peak WPM |
| **Trend graph** | 7/30/90 day WPM and accuracy trend with moving average |
| **Key heatmap** | Visual keyboard showing accuracy per key — red/amber/green |
| **Finger analysis** | Accuracy and speed by finger (pinky, ring, middle, index, thumb) |
| **Comparison** | Player's stats vs average at their level/percentile |
| **Milestones** | Timeline of personal bests and achievements |

### Frontend Work

| Item | Description |
|------|-------------|
| **Types** | `PerformanceData`, `TrendPoint`, `KeyHeatmap`, `FingerStats` |
| **API** | `getPerformance(playerId)`, `getPerformanceHistory(playerId, range)`, `getWeakKeys(playerId)` |
| **Stats page** | Enhanced with full performance dashboard |
| **Chart components** | Trend line chart (Canvas/Recharts), Key heatmap (SVG keyboard overlay), Finger bar chart |
| **Performance card** | Quick stats on home page with sparkline |

### Success Criteria
- [ ] Performance dashboard shows real data from all game sessions
- [ ] Trend graphs render correctly for 7/30/90 day ranges
- [ ] Key heatmap accurately reflects per-key accuracy
- [ ] Comparison data shows player standing vs peers

---

## Task 7: AI Paragraph Generation

### Goal
Replace the static content pools with AI-generated paragraphs on any topic at any difficulty level — on demand.

### Backend Work

| Item | Description |
|------|-------------|
| **Migration** | No migration needed — AI-generated content is ephemeral |
| **AI Service** | `ai/generator.go` — calls OpenAI/Claude API to generate paragraphs; fallback to static pools |
| **Prompt engineering** | Prompt templates: topic, difficulty, length, style parameters |
| **Caching** | Cache generated paragraphs by hash (topic + difficulty) for dedup |
| **Handler** | `GET /api/v1/levels/ai?topic=tech&difficulty=3&length=medium` — generate AI paragraph |
| **Handler** | `POST /api/v1/games/start-ai` — start game with AI-generated content |

### Prompt Templates

| Parameter | Values |
|-----------|--------|
| `topic` | tech, science, history, literature, coding, custom |
| `difficulty` | 1 (simple words) → 5 (complex vocabulary + symbols) |
| `length` | short (~50 words), medium (~150), long (~300) |
| `style` | factual, narrative, instructional, code |

### Frontend Work

| Item | Description |
|------|-------------|
| **Types** | `AIGenerationRequest`, `AIGenerationResponse` |
| **API** | `generateAIParagraph(topic, difficulty, length)` |
| **Play page enhancement** | "AI Mode" option with topic selector + difficulty slider |
| **Topic input** | Text input or dropdown for topic selection |
| **Generate button** | "Generate New Text" button during game setup |

### Success Criteria
- [ ] AI generates paragraphs on requested topics
- [ ] Difficulty scaling works correctly
- [ ] Cached paragraphs prevent duplicate API calls
- [ ] Graceful fallback to static pools on API failure

---

## Task 8: Adaptive Difficulty

### Goal
AI analyzes your typing patterns — weak keys, common errors, speed by finger — and dynamically adjusts paragraph content to target your weak areas.

### Backend Work

| Item | Description |
|------|-------------|
| **Migration** | `player_weak_areas` (id, player_id, key_name, error_rate, avg_speed, last_updated) |
| **AI Service** | `ai/adaptive.go` — analyzes session data + generates targeted paragraphs |
| **Analysis engine** | Runs after each game: aggregates keystroke data, identifies weak keys and patterns |
| **Difficulty engine** | Computes optimal difficulty based on recent performance trend |
| **Handler** | `GET /api/v1/players/{id}/adaptive/next` — get next recommended session |
| **Handler** | `POST /api/v1/players/{id}/adaptive/analyze` — trigger analysis of recent games |

### Adaptive Features

| Feature | Description |
|---------|-------------|
| **Weak key targeting** | If 'z' has 40% error rate, next paragraph includes 3x the usual 'z' occurrences |
| **Speed ramping** | Gradually increase target WPM as player improves |
| **Accuracy focus** | If accuracy drops below 90%, shift to easier paragraphs with accuracy emphasis |
| **Finger balance** | If ring finger is significantly slower, include exercises targeting those keys |

### Frontend Work

| Item | Description |
|------|-------------|
| **Types** | `WeakArea`, `AdaptiveSession`, `Analysis` |
| **API** | `getAdaptiveRecommendation(playerId)`, `triggerAnalysis(playerId)` |
| **Post-game screen** | "Your weak spot: left pinky keys (Q, A, Z) — try this focused exercise" |
| **Adaptive mode toggle** | "Adaptive Practice" mode in play selector |

### Success Criteria
- [ ] Weak key analysis runs after each game
- [ ] Adaptive paragraphs correctly emphasize weak keys
- [ ] Difficulty adjusts based on recent performance trend
- [ ] Fingering recommendations shown post-game

---

## Task 9: Personalized Coaching

### Goal
Post-game AI analysis that gives actionable feedback: "Your ring finger is 23% slower than average — try this exercise." Track improvement over time with personalized coaching plans.

### Backend Work

| Item | Description |
|------|-------------|
| **AI Service** | `ai/coach.go` — generates natural language coaching feedback |
| **Migration** | `coaching_notes` (id, player_id, game_session_id, feedback, focus_area, created_at) |
| **Repository** | `CoachingRepository` — save/retrieve coaching notes |
| **Handler** | `POST /api/v1/games/{gameId}/coach` — generate coaching feedback |
| **Handler** | `GET /api/v1/players/{id}/coaching/history` — past coaching notes |

### Coaching Feedback Examples

| Scenario | Feedback |
|----------|----------|
| Low accuracy on right hand | "Your right hand accuracy (88%) is significantly lower than left (96%). Focus on Y, H, N, M keys — they account for 60% of your errors." |
| Stagnant WPM | "Your WPM has been flat at 55±3 for the last 15 games. Try the speed drill: type each word in under 0.5 seconds." |
| Combo breaking | "You lose your streak most often after comma and period characters. Practice typing punctuation without pausing." |
| Improvement detected | "Your left pinky accuracy improved from 82% → 91% this week! Keep it up." |

### Frontend Work

| Item | Description |
|------|-------------|
| **Types** | `CoachingNote`, `CoachingFeedback` |
| **API** | `getCoaching(gameId)`, `getCoachingHistory(playerId)` |
| **Post-game panel** | Coaching card appears on victory/failed screen with personalized tip |
| **Coaching history** | Scrollable history of past coaching notes on stats page |

### Success Criteria
- [ ] Coaching feedback generated after each game
- [ ] Feedback is personalized and actionable
- [ ] Coaching history shows improvement over time
- [ ] Frontend shows feedback in a clear, attractive format

---

## Task 10: Smart Practice Plans

### Goal
AI creates personalized 7-day or 30-day practice plans based on your goals (improve accuracy, increase speed, learn a new layout). Auto-adjusts based on performance.

### Backend Work

| Item | Description |
|------|-------------|
| **Migration** | `practice_plans` (id, player_id, plan_type, duration_days, current_day, completed, created_at), `plan_days` (id, plan_id, day_number, focus_area, exercise_type, level_id, completed) |
| **AI Service** | `ai/planner.go` — generates practice plans based on player profile |
| **Repository** | `PracticePlanRepository` — CRUD, progress update |
| **Handler** | `POST /api/v1/players/{id}/practice-plan/generate` — create new plan |
| **Handler** | `GET /api/v1/players/{id}/practice-plan` — current plan |
| **Handler** | `POST /api/v1/players/{id}/practice-plan/advance` — mark day complete, advance to next |

### Plan Types

| Type | Focus | Example Structure |
|------|-------|-------------------|
| `speed_focus` | Increase WPM | Day 1-3: Speed drills, Day 4-5: Timed modes, Day 6-7: Challenge levels |
| `accuracy_focus` | Improve accuracy | Day 1-3: Slow precision typing, Day 4-5: Accuracy challenges, Day 6-7: Mixed |
| `balanced` | Overall improvement | Alternating speed/accuracy/combo days |
| `weak_key` | Target weak areas | Each day focuses on different weak key groups |
| `layout_switch` | Learn new keyboard layout | Progressive introduction to DVORAK/COLEMAK/QWERTY |

### Frontend Work

| Item | Description |
|------|-------------|
| **Types** | `PracticePlan`, `PlanDay` |
| **API** | `generatePlan(playerId, type, duration)`, `getPlan(playerId)`, `advancePlan(playerId)` |
| **Plan page** | Shows current plan with day-by-day view, progress, exercises |
| **Today's focus** | Home page shows "Today's Practice: Accuracy Focus" with quick-start button |
| **Plan completion** | Celebration when a full plan is completed |

### Success Criteria
- [ ] AI generates structured practice plans
- [ ] Each day's exercises are relevant to the player's goals
- [ ] Progress tracks correctly across days
- [ ] Plan auto-adjusts based on performance

---

## Task Order Summary

```
Task 1:  Gamified Progression System    ← START HERE (Backend + Frontend)
Task 2:  Achievements System            ← Depends on Task 1 patterns
Task 3:  Daily Streak Rewards           ← Depends on Task 1 patterns
Task 4:  Competitive Leaderboard Tiers  ← Depends on existing leaderboard
Task 5:  Personal Goals & Challenges    ← Independent
Task 6:  Performance Insights Dashboard ← Depends on game session data
Task 7:  AI Paragraph Generation        ← Independent
Task 8:  Adaptive Difficulty            ← Depends on Task 6 + 7
Task 9:  Personalized Coaching          ← Depends on Task 6 + 8
Task 10: Smart Practice Plans           ← Depends on Task 1-9
```
