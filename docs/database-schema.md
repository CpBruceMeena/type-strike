# Type Strike — Database Schema & Data Flow

> **Database:** PostgreSQL  
> **ORM:** GORM (Go)  
> **Last Updated:** June 28, 2026

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Table Reference](#2-table-reference)
   - [2.1 `players` — Player Identity & Progression](#21-players--player-identity--progression)
   - [2.2 `levels` — Level Catalog](#22-levels--level-catalog)
   - [2.3 `level_progress` — Per-Player Level Stats](#23-level_progress--per-player-level-stats)
   - [2.4 `game_sessions` — Game Session Records](#24-game_sessions--game-session-records)
   - [2.5 `activity` — Activity Feed](#25-activity--activity-feed)
   - [2.6 `analytics_events` — Telemetry Events](#26-analytics_events--telemetry-events)
   - [2.7 `daily_stats` — Daily Aggregated Statistics](#27-daily_stats--daily-aggregated-statistics)
   - [2.8 `settings` — Player Preferences](#28-settings--player-preferences)
   - [2.9 `leaderboard_entries` — Global Leaderboard](#29-leaderboard_entries--global-leaderboard)
   - [2.10 `leaderboard_timed` — Timed Mode Leaderboard](#210-leaderboard_timed--timed-mode-leaderboard)
   - [2.11 `contests` — Competition Periods](#211-contests--competition-periods)
   - [2.12 `contest_entries` — Contest Submissions](#212-contest_entries--contest-submissions)
   - [2.13 `daily_challenges` — Daily Challenge Instances](#213-daily_challenges--daily-challenge-instances)
   - [2.14 `lesson_progress` — Lesson Progress Tracking](#214-lesson_progress--lesson-progress-tracking)
3. [Data Flow Diagrams](#3-data-flow-diagrams)
   - [3.1 Level Completion Flow](#31-level-completion-flow)
   - [3.2 Timed Game Session Flow](#32-timed-game-session-flow)
   - [3.3 Leaderboard Sync Flow](#33-leaderboard-sync-flow)
   - [3.4 Daily Challenge Flow](#34-daily-challenge-flow)
   - [3.5 Contest Flow](#35-contest-flow)
4. [Key Relationships & Foreign Keys](#4-key-relationships--foreign-keys)
5. [Triggers & Auto-Migrations](#5-triggers--auto-migrations)
6. [Frequently Queried Patterns](#6-frequently-queried-patterns)

---

## 1. Architecture Overview

The database for Type Strike is a **PostgreSQL** database that powers the Go backend. It contains **14 tables** organized into the following functional groups:

| Group | Tables | Purpose |
|-------|--------|---------|
| **Identity & Progression** | `players`, `settings` | Core player data, preferences |
| **Level System** | `levels`, `level_progress`, `lesson_progress` | Level catalog, player level tracking, lesson tracking |
| **Game Sessions** | `game_sessions` | Timed mode and contest game records |
| **Competition** | `contests`, `contest_entries`, `leaderboard_entries`, `leaderboard_timed` | Daily contests, global and timed leaderboards |
| **Daily Challenges** | `daily_challenges` | Per-player daily challenge system |
| **Feedback** | `feedback` | User-submitted feedback and feature requests |
| **Activity & Analytics** | `activity`, `analytics_events`, `daily_stats` | Event logging, telemetry, aggregated statistics |

**ORM Layer:** All tables are accessed via GORM. Each table has a corresponding Go model in `backend/internal/models/` with GORM tags (`gorm:`) defining table names, column names, indexes, and constraints. All repositories reside in `backend/internal/repository/`.

---

### 2.15 `feedback` — User Feedback Submissions

**Stores user-submitted feedback messages** from the profile page.

| Column | Type | Default | Constraints | Description |
|--------|------|---------|-------------|-------------|
| `id` | `SERIAL` | — | `PRIMARY KEY` | Auto-incrementing ID |
| `player_id` | `VARCHAR(255)` | — | — | Clerk user ID of the submitter |
| `email` | `VARCHAR(255)` | — | — | Email from Clerk profile |
| `message` | `TEXT` | — | `NOT NULL` | The feedback content |
| `created_at` | `TIMESTAMPTZ` | `NOW()` | — | Submission timestamp |

**Go Model:** `backend/internal/models/feedback.go` → `Feedback`

**API:**
- `POST /api/v1/feedback` — Submit feedback (body: `{player_id, email, message}`)

**How it's used:**
- Submitted from the profile page feedback form
- Currently a simple append-only log for product improvement

---

## 2. Table Reference

---

### 2.1 `players` — Player Identity & Progression

**The central entity.** Every table references `players(id)` directly or indirectly.

| Column | Type | Default | Constraints | Description |
|--------|------|---------|-------------|-------------|
| `id` | `SERIAL` | — | `PRIMARY KEY` | Auto-incrementing player ID |
| `player_uuid` | `UUID` | `gen_random_uuid()` | `UNIQUE` | Public-facing UUID for the player |
| `level` | `INTEGER` | `1` | — | Current player level (not level_id, this is their global XP level) |
| `title` | `TEXT` | `'RECRUIT'` | — | Rank title (e.g. "RECRUIT", "FLAME", "OBSIDIAN") |
| `xp` | `INTEGER` | `0` | — | Total XP accumulated |
| `total_stars` | `INTEGER` | `0` | — | Sum of all stars earned across all levels |
| `created_at` | `TIMESTAMPTZ` | `NOW()` | — | Account creation timestamp |
| `last_played_at` | `TIMESTAMPTZ` | `NOW()` | — | Last game activity |
| `streak_count` | `INTEGER` | `0` | — | Consecutive daily play streak |
| `last_streak_date` | `DATE` | `NULL` | — | Last date that counted toward the streak |
| `email` | `TEXT` | — | `UNIQUE` | Clerk auth email (added in migration 005) |
| `player_tag` | `VARCHAR(8)` | — | `UNIQUE` | Short auto-generated tag from email (e.g. "SAND") |
| `display_name` | `TEXT` | `''` | — | Display name from Clerk profile |

**Indexes:**
- `idx_players_email` on `email` — fast Clerk auth lookup
- `idx_players_tag` on `player_tag` — player tag collision checking
- `idx_players_streak` on `streak_count DESC` — streak leaderboard queries

**Go Model:** `backend/internal/models/player.go` → `Player`

**How it's used:**
- Created via `POST /api/v1/players` (legacy) or `POST /api/v1/players/register` (Clerk auth)
- XP awarded on game completion (`POST /api/v1/players/{id}/xp`)
- Level-ups happen within `AddXP` (every `100 * level * 1.5` XP)
- Streak updated daily on game completion via `UpdateStreak`
- The auto-trigger `trg_refresh_leaderboard` updates `leaderboard_entries` when `xp`, `level`, `total_stars`, or `title` change

**Key Handlers:**
- `player_handler.go` — Create, Register, GetByID, Update, AddXP, GetSummary

---

### 2.2 `levels` — Level Catalog

**Static configuration** for the 100 pre-generated levels. Levels beyond 100 are generated dynamically in code and have no DB row.

| Column | Type | Default | Constraints | Description |
|--------|------|---------|-------------|-------------|
| `id` | `SERIAL` | — | `PRIMARY KEY` | Level ID (1-100) |
| `name` | `TEXT` | — | — | Level name (e.g. "First Light", "Basalt") |
| `tier` | `TEXT` | — | `CHECK(IN 'ember','igneious','magma_core','obsidian')` | The tier this level belongs to |
| `difficulty` | `INTEGER` | — | `CHECK(1-4)` | Difficulty rating (1=easiest, 4=hardest) |
| `pass_wpm` | `INTEGER` | — | — | WPM required to pass this level |
| `pass_accuracy` | `INTEGER` | — | — | Accuracy % required to pass |
| `paragraph` | `TEXT` | — | — | The text content to type |
| `created_at` | `TIMESTAMPTZ` | `NOW()` | — | When this level was created |

**Indexes:**
- `idx_levels_tier` on `tier` — filter levels by tier
- `idx_levels_difficulty` on `difficulty` — sort by difficulty

**Go Model:** No direct GORM model. The `data/levels.go` file provides `LevelConfig` struct with hardcoded content pools. The `levels` table is seeded by `scripts/seed_levels.go` but the actual paragraph data for level configurations is generated from in-memory content pools (fun facts, tech facts, short stories, science facts, code snippets).

**How it's used:**
- Fetched via `GET /api/v1/levels` (all) or `GET /api/v1/levels/{id}` (single)
- Level details include optional player progress when `?player_id=N` is provided
- The `data.GetLevel(id)` function generates fresh paragraphs each time from content pools

**Entity-Relationship:**
- ⬆ **One** level has **many** `level_progress` records (one per player who attempted it)

---

### 2.3 `level_progress` — Per-Player Level Stats

**Tracks each player's performance** on each level they've attempted.

| Column | Type | Default | Constraints | Description |
|--------|------|---------|-------------|-------------|
| `id` | `SERIAL` | — | `PRIMARY KEY` | — |
| `player_id` | `INTEGER` | — | `FK → players(id) ON DELETE CASCADE` | The player |
| `level_id` | `INTEGER` | — | — | The level (no FK to levels table since levels are generated dynamically) |
| `stars` | `INTEGER` | `0` | `CHECK(0-3)` | Best stars earned (0=fail, 1-3=pass) |
| `best_wpm` | `INTEGER` | `0` | — | Best WPM achieved |
| `best_accuracy` | `REAL` | `0.0` | — | Best accuracy achieved |
| `completed` | `BOOLEAN` | `FALSE` | — | Whether the level has been passed |
| `attempts` | `INTEGER` | `0` | — | Number of attempts |
| `last_played_at` | `TIMESTAMPTZ` | `NOW()` | — | When the player last attempted this level |

**Uniques:** `UNIQUE(player_id, level_id)` — one record per player per level.

**Go Model:** `backend/internal/models/level_progress.go` → `LevelProgress`

**How it's used:**
- Created/updated when a player completes a level (`POST /api/v1/players/{id}/levels/{levelId}/complete`)
- Uses an upsert pattern: `INSERT ... ON CONFLICT (player_id, level_id) DO UPDATE SET stars = GREATEST(...), best_wpm = GREATEST(...)` — only keeps the best values
- Read to display progress on the map page (`GET /api/v1/players/{id}/levels`)
- Read to check if a level has been completed for next-level determination
- The `levels_cleared` count in `leaderboard_entries` is `SELECT COUNT(*) FROM level_progress WHERE player_id = N AND completed = true`

**Entity-Relationship:**
- ⬆ **Many** `level_progress` → **one** `players`

---

### 2.4 `game_sessions` — Game Session Records

**Records every timed mode and contest game.** This table was originally created for web gameplay (timed 1min/3min/5min and contest modes).

| Column | Type | Default | Constraints | Description |
|--------|------|---------|-------------|-------------|
| `id` | `INTEGER` | `nextval(...)` | `PRIMARY KEY` | Auto-increment (was UUID, migrated to SERIAL) |
| `player_id` | `INTEGER` | — | `FK → players(id) ON DELETE CASCADE` | The player who played |
| `mode` | `VARCHAR(20)` | — | — | Game mode: `timed_1min`, `timed_3min`, `timed_5min`, `contest` |
| `level_id` | `INTEGER` | — | — | For level mode games (NULL for timed/contest) |
| `paragraph` | `TEXT` | — | — | The full text shown during the game |
| `duration_sec` | `INTEGER` | — | — | Time limit in seconds (NULL for level mode) |
| `started_at` | `TIMESTAMPTZ` | `NOW()` | — | When the game started |
| `completed_at` | `TIMESTAMPTZ` | `NULL` | — | When the game was completed |
| `wpm` | `INTEGER` | `NULL` | — | Final WPM score |
| `accuracy` | `REAL` | `NULL` | — | Final accuracy |
| `correct_ks` | `INTEGER` | `0` | — | Correct keystrokes count |
| `total_ks` | `INTEGER` | `0` | — | Total keystrokes count |
| `max_combo` | `INTEGER` | `0` | — | Highest combo achieved |
| `error_count` | `INTEGER` | `0` | — | Number of errors |
| `consistency` | `REAL` | `0` | — | WPM consistency score (coefficient of variation) |
| `xp_earned` | `INTEGER` | `0` | — | XP awarded for this session |
| `stars` | `INTEGER` | `NULL` | — | Stars earned (only for level mode, NULL for timed/contest) |
| `is_completed` | `BOOLEAN` | `FALSE` | — | Whether the game was finished |

**Indexes:**
- `idx_game_sessions_player` on `player_id` — find all games for a player
- `idx_game_sessions_mode` on `mode` — filter by mode
- `idx_game_sessions_player_time` on `(player_id, completed_at DESC)` — recent games list

**Go Model:** `backend/internal/models/game_session.go` → `GameSession`

**How it's used:**
- Created via `POST /api/v1/games/start` — inserts a new row with `is_completed = false`
- Updated via `POST /api/v1/games/{gameId}/complete` — sets results (WPM, accuracy, XP, etc.)
- History fetched via `GET /api/v1/games/history?player_id=N`
- Each completed session triggers: XP award, streak update, leaderboard sync, and (for timed modes) timed leaderboard upsert

**Entity-Relationship:**
- ⬆ **Many** `game_sessions` → **one** `players`
- ⬆ **One** `game_sessions` → **one** `contest_entries` (if contest mode)
- ⬆ **One** `game_sessions` → **one** `leaderboard_timed` (if timed mode)

---

### 2.5 `activity` — Activity Feed

**Event log** recording player actions in a feed-style format.

| Column | Type | Default | Constraints | Description |
|--------|------|---------|-------------|-------------|
| `id` | `SERIAL` | — | `PRIMARY KEY` | — |
| `player_id` | `INTEGER` | — | `FK → players(id) ON DELETE CASCADE` | — |
| `type` | `TEXT` | — | — | Event type (see constants below) |
| `timestamp` | `TIMESTAMPTZ` | `NOW()` | — | When the event occurred |
| `metadata` | `JSONB` | `'{}'` | — | Arbitrary JSON data with event details |

**Indexes:** `idx_activity_player_time` on `(player_id, timestamp DESC)` — fast recent activity queries.

**Activity Types (constants in `models/activity.go`):**
- `level_completed` — Level passed successfully
- `level_failed` — Level attempt failed
- `achievement` — Achievement unlocked
- `level_up` — Player leveled up globally
- `new_high_score` — New personal best WPM

**Go Model:** `backend/internal/models/activity.go` → `Activity`

**How it's used:**
- Inserted within the same transaction as level completion (`level_handler.go.executeLevelComplete`)
- Read for the home dashboard's recent activity feed (`GET /api/v1/players/{id}/activity`)
- Used to show recent events on the stats page

**Entity-Relationship:**
- ⬆ **Many** `activity` → **one** `players`

---

### 2.6 `analytics_events` — Telemetry Events

**Raw telemetry pipeline** for granular event tracking.

| Column | Type | Default | Constraints | Description |
|--------|------|---------|-------------|-------------|
| `id` | `SERIAL` | — | `PRIMARY KEY` | — |
| `player_id` | `INTEGER` | — | `FK → players(id) ON DELETE CASCADE` | — |
| `event_name` | `TEXT` | — | — | Event identifier (e.g. "game_start", "keystroke") |
| `timestamp` | `TIMESTAMPTZ` | `NOW()` | — | When the event fired |
| `properties` | `JSONB` | `'{}'` | — | Event-specific properties |

**Indexes:** `idx_analytics_event_time` on `(event_name, timestamp)` — analytics queries by event type.

**Go Model:** `backend/internal/models/analytics.go` → `AnalyticsEvent`

**How it's used:**
- Fired from the frontend typing engine's `TelemetryPipeline` (batched and flushed every 5 seconds)
- Currently an instrumentation point for future analytics dashboards
- `POST /api/v1/analytics/events` to record an event

---

### 2.7 `daily_stats` — Daily Aggregated Statistics

**Rolling daily aggregation** of player activity.

| Column | Type | Default | Constraints | Description |
|--------|------|---------|-------------|-------------|
| `id` | `SERIAL` | — | `PRIMARY KEY` | — |
| `player_id` | `INTEGER` | — | `FK → players(id) ON DELETE CASCADE` | — |
| `date` | `DATE` | — | — | The calendar date |
| `session_count` | `INTEGER` | `0` | — | Number of game sessions that day |
| `total_play_time_seconds` | `INTEGER` | `0` | — | Total play time in seconds |
| `best_wpm` | `INTEGER` | `0` | — | Best WPM achieved that day |
| `levels_completed` | `INTEGER` | `0` | — | Levels completed that day |

**Uniques:** `UNIQUE(player_id, date)` — one stats record per player per day.

**Go Model:** `backend/internal/models/analytics.go` → `DailyStats`

**How it's used:**
- Upserted via `POST /api/v1/analytics/players/{playerId}/daily-stats`
- Read via `GET /api/v1/analytics/players/{playerId}/daily-stats`
- Can be used for 30-day trend charts on the stats page

---

### 2.8 `settings` — Player Preferences

**Key-value store** for player configuration.

| Column | Type | Default | Constraints | Description |
|--------|------|---------|-------------|-------------|
| `id` | `SERIAL` | — | `PRIMARY KEY` | — |
| `player_id` | `INTEGER` | — | `FK → players(id) ON DELETE CASCADE` | — |
| `key` | `TEXT` | — | — | Setting name |
| `value` | `TEXT` | — | — | Setting value |

**Uniques:** `UNIQUE(player_id, key)` — one value per setting key per player.

**Default settings** (auto-inserted by trigger `trg_insert_default_settings` on player creation):

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

**Go Model:** `backend/internal/models/settings.go` → `Setting`

**How it's used:**
- Read all settings: `GET /api/v1/players/{playerId}/settings`
- Batch update: `PUT /api/v1/players/{playerId}/settings`

---

### 2.9 `leaderboard_entries` — Global Leaderboard

**Materialized view** of player rankings, updated via trigger or explicit sync.

| Column | Type | Default | Constraints | Description |
|--------|------|---------|-------------|-------------|
| `player_id` | `INTEGER` | — | `PRIMARY KEY, FK → players(id) ON DELETE CASCADE` | Player ID (one row per player) |
| `player_name` | `TEXT` | `''` | — | Display name (from `players.title`) |
| `level` | `INTEGER` | `1` | — | Player's global level |
| `xp` | `INTEGER` | `0` | — | Total XP |
| `total_stars` | `INTEGER` | `0` | — | Total stars earned |
| `levels_cleared` | `INTEGER` | `0` | — | Count of completed levels |
| `best_wpm` | `INTEGER` | `0` | — | Highest WPM across all levels |
| `updated_at` | `TIMESTAMPTZ` | `NOW()` | — | Last sync timestamp |

**Indexes:** `idx_leaderboard_xp`, `idx_leaderboard_stars`, `idx_leaderboard_wpm`, `idx_leaderboard_cleared` — all on `DESC` for fast ranking queries.

**Go Model:** `backend/internal/models/leaderboard.go` → `LeaderboardEntry`

**How it's used:**
- **Auto-update:** Trigger `trg_refresh_leaderboard` fires on `AFTER UPDATE OF xp, level, total_stars, title ON players`
- **Manual sync:** `POST /api/v1/leaderboard/sync` calls `SyncPlayer` which does an upsert with subqueries to count levels_cleared and find best_wpm from `level_progress`
- **Read:** `GET /api/v1/leaderboard?limit=50` returns top players sorted by `xp DESC, total_stars DESC, best_wpm DESC`
- **Player rank:** `GET /api/v1/leaderboard/{playerId}` returns the player's entry plus nearby competitors (2 above, 2 below)

**Entity-Relationship:**
- ⬆ **One** `leaderboard_entries` → **one** `players` (1:1 mapping)

---

### 2.10 `leaderboard_timed` — Timed Mode Leaderboard

**Best scores per player per timed mode** (1min, 3min, 5min).

| Column | Type | Default | Constraints | Description |
|--------|------|---------|-------------|-------------|
| `id` | `SERIAL` | — | `PRIMARY KEY` | — |
| `mode` | `VARCHAR(20)` | — | — | `timed_1min`, `timed_3min`, `timed_5min` |
| `player_id` | `INTEGER` | — | `FK → players(id) ON DELETE CASCADE` | — |
| `player_name` | `TEXT` | `''` | — | Cached player name |
| `best_wpm` | `INTEGER` | — | — | Personal best WPM for this mode |
| `best_accuracy` | `REAL` | `0` | — | Accuracy at the time of best WPM |
| `game_session_id` | `INTEGER` | — | `FK → game_sessions(id) ON DELETE CASCADE` | The game session where this best was achieved |
| `achieved_at` | `TIMESTAMPTZ` | `NOW()` | — | When this record was set |

**Uniques:** `UNIQUE(mode, player_id)` — one best entry per player per mode.

**Indexes:** `idx_leaderboard_timed_mode` on `(mode, best_wpm DESC, best_accuracy DESC)` — fast leaderboard ranking.

**Go Model:** `backend/internal/models/game_session.go` → `TimedLeaderboardEntry`

**How it's used:**
- Upserted on game completion when mode is `timed_1min`, `timed_3min`, or `timed_5min`
- Only updates if the new WPM is higher (`GREATEST(best_wpm, EXCLUDED.best_wpm)`)
- Read via `GET /api/v1/leaderboard/timed?mode=timed_1min&limit=50`
- Sorted by `best_wpm DESC, best_accuracy DESC`

---

### 2.11 `contests` — Competition Periods

**Daily contest periods** with a fixed paragraph for all participants.

| Column | Type | Default | Constraints | Description |
|--------|------|---------|-------------|-------------|
| `id` | `SERIAL` | — | `PRIMARY KEY` | Contest ID |
| `start_date` | `TIMESTAMPTZ` | — | — | Contest start timestamp |
| `end_date` | `TIMESTAMPTZ` | — | — | Contest end timestamp |
| `paragraph` | `TEXT` | — | — | The shared text all players type |
| `difficulty` | `VARCHAR(20)` | `'expert'` | — | Difficulty rating |
| `is_active` | `BOOLEAN` | `TRUE` | — | Whether this contest is currently active |
| `created_at` | `TIMESTAMPTZ` | `NOW()` | — | Creation time |

**Indexes:** `idx_contests_active` on `(is_active, start_date DESC)` — find the current active contest.

**Go Model:** `backend/internal/models/contest.go` → `Contest`

**How it's used:**
- Created automatically on the first request of the day via `GetOrCreateDailyContest`
- End date is set to 24 hours after start
- Deactivated when a new contest replaces it
- Paragraph cycles through different content types based on the week of the year

---

### 2.12 `contest_entries` — Contest Submissions

**One entry per player per contest.**

| Column | Type | Default | Constraints | Description |
|--------|------|---------|-------------|-------------|
| `id` | `SERIAL` | — | `PRIMARY KEY` | — |
| `contest_id` | `INTEGER` | — | `FK → contests(id) ON DELETE CASCADE` | The contest |
| `player_id` | `INTEGER` | — | `FK → players(id) ON DELETE CASCADE` | The player |
| `game_session_id` | `INTEGER` | — | `FK → game_sessions(id) ON DELETE CASCADE` | The linked game session |
| `wpm` | `INTEGER` | — | — | WPM achieved |
| `accuracy` | `REAL` | — | — | Accuracy achieved |
| `rank` | `INTEGER` | — | — | Position on the contest leaderboard |
| `created_at` | `TIMESTAMPTZ` | `NOW()` | — | Submission time |

**Uniques:** `UNIQUE(contest_id, player_id)` — one entry per player per contest.

**Indexes:** `idx_contest_entries_rank` on `(contest_id, wpm DESC, accuracy DESC)` — contest ranking order.

**Go Model:** `backend/internal/models/contest.go` → `ContestEntry`

**How it's used:**
- Created when a contest mode game is completed (if the player hasn't already entered)
- Rank is computed by counting how many entries have higher WPM (and accuracy as tiebreaker)
- Read via `GET /api/v1/contest/leaderboard?contest_id=N`

---

### 2.13 `daily_challenges` — Daily Challenge Instances

**Per-player challenge instances** generated fresh each day.

| Column | Type | Default | Constraints | Description |
|--------|------|---------|-------------|-------------|
| `id` | `SERIAL` | — | `PRIMARY KEY` | — |
| `player_id` | `INTEGER` | — | `FK → players(id) ON DELETE CASCADE` | — |
| `challenge_date` | `DATE` | `CURRENT_DATE` | — | The day this challenge is for |
| `challenge_type` | `TEXT` | — | `CHECK(IN 'speed_sprint','precision_mode','star_challenge')` | Challenge category |
| `challenge_name` | `TEXT` | — | — | Display name |
| `description` | `TEXT` | `''` | — | Challenge description |
| `icon` | `TEXT` | `'🔥'` | — | Emoji icon |
| `level_id` | `INTEGER` | — | — | The level used for this challenge |
| `target_wpm` | `INTEGER` | `0` | — | WPM target to beat |
| `target_accuracy` | `REAL` | `0.0` | — | Accuracy target |
| `reward_xp` | `INTEGER` | `50` | — | XP reward |
| `reward_stars` | `INTEGER` | `1` | — | Stars reward |
| `current_best_wpm` | `INTEGER` | `0` | — | Player's current best WPM for this challenge |
| `current_best_accuracy` | `REAL` | `0.0` | — | Player's current best accuracy |
| `completed` | `BOOLEAN` | `FALSE` | — | Whether the target has been met |
| `attempts` | `INTEGER` | `0` | — | Number of attempts today |
| `created_at` | `TIMESTAMPTZ` | `NOW()` | — | — |

**Uniques:** `UNIQUE(player_id, challenge_date, challenge_type)` — one challenge of each type per day.

**Indexes:** `idx_daily_challenges_player_date` on `(player_id, challenge_date DESC)` — fetch today's challenges for a player.

**Go Model:** `backend/internal/models/daily_challenge.go` → `DailyChallenge`

**How it's used:**
- Generated on first access of the day: 3 challenges (one of each type) are created with difficulty scaled to player's level
- Results submitted via `POST /api/v1/players/{id}/daily-challenges/{challengeId}/complete`
- When all 3 are completed, streak is updated and rewards are awarded
- Streak multiplier increases rewards (e.g. 2x at 3-day streak, 3x at 7-day streak)

---

### 2.14 `lesson_progress` — Lesson Progress Tracking

**Tracks player progress** on the Learn mode lessons (48 typing lessons).

| Column | Type | Default | Constraints | Description |
|--------|------|---------|-------------|-------------|
| `id` | `SERIAL` | — | `PRIMARY KEY` | — |
| `player_id` | `INTEGER` | — | `FK → players(id) ON DELETE CASCADE` | — |
| `lesson_id` | `INTEGER` | — | — | Lesson identifier (1-48) |
| `best_wpm` | `INTEGER` | `0` | — | Best WPM achieved |
| `best_accuracy` | `REAL` | `0.0` | — | Best accuracy |
| `completed` | `BOOLEAN` | `FALSE` | — | Whether the lesson has been passed |
| `attempts` | `INTEGER` | `0` | — | Number of attempts |
| `completed_at` | `TIMESTAMPTZ` | `NULL` | — | When the lesson was first passed |
| `created_at` | `TIMESTAMPTZ` | `NOW()` | — | First attempt timestamp |
| `updated_at` | `TIMESTAMPTZ` | `NOW()` | — | Last update timestamp |

**Uniques:** `UNIQUE(player_id, lesson_id)` — one progress record per lesson per player.

**Indexes:** `idx_lesson_progress_player` on `(player_id, lesson_id)` — fetch all progress for a player.

**Go Model:** `backend/internal/models/lesson_progress.go` → `LessonProgress`

**How it's used:**
- Created/updated via `POST /api/v1/players/{playerId}/lessons/{lessonId}/complete`
- Uses the same upsert pattern as level_progress (`GREATEST` for best values)
- Read via `GET /api/v1/players/{playerId}/lessons` for the learn hub page

**Entity-Relationship:**
- ⬆ **Many** `lesson_progress` → **one** `players`

---

## 3. Data Flow Diagrams

### 3.1 Level Completion Flow

```
Frontend                          Go Backend                        PostgreSQL
────────                          ──────────                        ──────────
[Player finishes level]                                                
       │                                                               
       ▼                                                               
POST /api/v1/players/{id}/levels/{levelId}/complete                    
  Body: {wpm, accuracy, stars, completed}                              
       │                                                               
       ▼                                                               
  level_handler.go                                                     
  executeLevelComplete()                                                
       │                                                               
       ├──▶ BEGIN TRANSACTION ─────────────────────────────────────▶  
       │                                                               
       ├──▶ UPSERT level_progress ◀────────────────────────────────   
       │    (player_id, level_id, stars, best_wpm, best_accuracy,      
       │     completed, attempts + 1, last_played_at = NOW())          
       │                                                               
       ├──▶ INSERT activity ◀──────────────────────────────────────   
       │    (player_id, type='level_completed',                        
       │     metadata={level_id, wpm, accuracy, stars})                
       │                                                               
       ├──▶ UPDATE players.streak_count ◀─────────────────────────   
       │    (increment if last_streak_date != today)                   
       │                                                               
       ├──▶ COMMIT ──────────────────────────────────────────────▶   
       │                                                               
       ▼                                                               
  [Response: updated LevelProgress]                                    
       │                                                               
       ▼  (In handler, after transaction)                              
  POST /api/v1/players/{id}/xp       ──────────▶  UPDATE players       
  POST /api/v1/leaderboard/sync      ──────────▶  UPSERT leaderboard_entries
```

### 3.2 Timed Game Session Flow

```
Frontend                          Go Backend                        PostgreSQL
────────                          ──────────                        ──────────
[Player clicks "Play 1min"]                                            
       │                                                               
       ▼                                                               
POST /api/v1/games/start                                                  
  Body: {player_id: 1, mode: "timed_1min"}                             
       │                                                               
       ▼                                                               
  game_handler.go                                                      
  Start()                                                               
       │                                                               
       ├──▶ Generate paragraph from data.GetLevel(90)                  
       ├──▶ INSERT game_sessions ────────────────────────────────▶   
       │    (player_id, mode, paragraph, duration_sec,                  
       │     started_at = NOW(), is_completed = false)                 
       │                                                               
       ▼                                                               
  [Response: game_id, paragraph, duration_seconds]                     
       │                                                               
       ▼  (After game finishes on client)                              
POST /api/v1/games/{gameId}/complete                                   
  Body: {wpm, accuracy, correct_keystrokes, total_keystrokes, ...}    
       │                                                               
       ▼                                                               
  Complete()                                                            
       │                                                               
       ├──▶ Verify session exists & belongs to player                  
       ├──▶ Verify not already completed                               
       ├──▶ computeGameXP(wpm, accuracy, mode)                        
       ├──▶ UPDATE game_sessions ────────────────────────────────▶   
       │    (set wpm, accuracy, xp_earned, completed_at,               
       │     is_completed = true)                                      
       │                                                               
       ├──▶ UPDATE players ADD XP ───────────────────────────────▶   
       │                                                               
       ├──▶ UPDATE players.streak_count ─────────────────────────▶   
       │                                                               
       ├──▶ SyncPlayer to leaderboard_entries ───────────────────▶   
       │                                                               
       ├──▶ UPSERT leaderboard_timed ────────────────────────────▶   
       │    (only if best_wpm improved, per mode)                      
       │                                                               
       ▼                                                               
  [Response: wpm, accuracy, xp_earned, rank]                          
```

### 3.3 Leaderboard Sync Flow

```
Trigger: AFTER UPDATE OF xp, level, total_stars, title ON players
         │
         ▼
  refresh_leaderboard_entry() FUNCTION
         │
         ├──▶ INSERT INTO leaderboard_entries
         │    SELECT player_id, player_name=title, level, xp, total_stars,
         │           levels_cleared = (SELECT COUNT(*) FROM level_progress WHERE completed=true),
         │           best_wpm = ... (from level_progress max),
         │           updated_at = NOW()
         │
         └──▶ ON CONFLICT (player_id) DO UPDATE
              (keeps latest values)

Manual sync: POST /api/v1/leaderboard/sync {player_id: N}
         │
         ▼
  SyncPlayer() REPOSITORY
         │
         └──▶ INSERT ... ON CONFLICT (player_id) DO UPDATE ...
              (same logic as trigger, but also queries best_wpm from level_progress)

API reads:
  GET /api/v1/leaderboard?limit=50
    → SELECT *, ROW_NUMBER() OVER (ORDER BY xp DESC, total_stars DESC, best_wpm DESC) AS rank
      FROM leaderboard_entries
      ORDER BY xp DESC ... LIMIT 50

  GET /api/v1/leaderboard/{playerId}
    → Same query but WITH filtered + 2 above, 2 below

  GET /api/v1/leaderboard/timed?mode=timed_1min
    → SELECT *, ROW_NUMBER() OVER (ORDER BY best_wpm DESC, best_accuracy DESC) AS rank
      FROM leaderboard_timed
      WHERE mode = 'timed_1min'
```

### 3.4 Daily Challenge Flow

```
[Player opens daily challenges]                                        
       │                                                               
       ▼                                                               
GET /api/v1/players/{id}/daily-challenges                              
       │                                                               
       ▼                                                               
  GetOrGenerate()                                                       
       │                                                               
       ├──▶ Check if challenges exist for today                        
       │                                                               
       ├──▶ If YES → return existing challenges                        
       │                                                               
       └──▶ If NO → generate 3 challenges:                            
             │                                                         
             ├──▶ speed_sprint:    high WPM target                     
             ├──▶ precision_mode:  high accuracy target                 
             └──▶ star_challenge:  moderate WPM + accuracy target      
             │                                                         
             └──▶ INSERT all 3 into daily_challenges ───────────▶    
                                                                       
[Player completes a challenge]                                         
       │                                                               
       ▼                                                               
POST /api/v1/players/{id}/daily-challenges/{challengeId}/complete      
  Body: {wpm, accuracy}                                                
       │                                                               
       ▼                                                               
  SubmitResult()                                                        
       │                                                               
       ├──▶ UPDATE daily_challenges                                    
       │    SET current_best_wpm = GREATEST(...),                      
       │        completed = (wpm >= target_wpm AND accuracy >= ...),   
       │        attempts = attempts + 1                                
       │                                                               
       ├──▶ If just completed: award XP + stars                        
       ├──▶ If all 3 completed today: update streak                   
       │                                                               
       ▼                                                               
  [Response: challenge result, rewards, streak info]                   
```

### 3.5 Contest Flow

```
[First request of the day]                                             
       │                                                               
       ▼                                                               
GET /api/v1/contest/current?player_id=N                                
       │                                                               
       ├──▶ Check for active contest                                   
       │   (SELECT FROM contests WHERE is_active = true)               
       │                                                               
       ├──▶ If none → create one:                                     
       │   INSERT INTO contests (start_date, end_date, paragraph, ...) 
       │   Paragraph cycles: fun facts → tech → stories → science → code
       │                                                               
       └──▶ Return contest info + player's entry status               
                                                                       
[Player plays contest game]                                            
       │                                                               
       ▼                                                               
POST /api/v1/games/start {mode: "contest"}  ─────▶ Creates game_session
POST /api/v1/games/{id}/complete              ─────▶ Saves results     
       │                                                               
       ├──▶ If mode == contest AND has not entered:                   
       │    INSERT INTO contest_entries                                
       │    (contest_id, player_id, game_session_id, wpm, accuracy)    
       │    Rank computed after insert:                                
       │    UPDATE contest_entries SET rank =                          
       │      (SELECT COUNT(*)+1 FROM contest_entries                  
       │       WHERE contest_id = N AND wpm > NEW.wpm)                 
       │                                                               
       ▼                                                               
GET /api/v1/contest/leaderboard?contest_id=N                           
       │                                                               
       ├──▶ SELECT entries sorted by wpm DESC, accuracy DESC          
       └──▶ Include rank numbers                                      
```

---

## 4. Key Relationships & Foreign Keys

```
players ──────────────────────────────────────────────────┐
  │                                                        │
  ├──〈1:N〉── level_progress(player_id)                    │
  ├──〈1:N〉── activity(player_id)                          │
  ├──〈1:N〉── analytics_events(player_id)                  │
  ├──〈1:N〉── daily_stats(player_id)                      │
  ├──〈1:N〉── settings(player_id)                          │
  ├──〈1:N〉── game_sessions(player_id)                     │
  ├──〈1:N〉── daily_challenges(player_id)                  │
  ├──〈1:N〉── lesson_progress(player_id)                   │
  ├──〈1:1〉── leaderboard_entries(player_id)               │
  ├──〈1:N〉── leaderboard_timed(player_id)                 │
  └──〈1:N〉── contest_entries(player_id)                   │
                                                            │
contests                                                    │
  └──〈1:N〉── contest_entries(contest_id)                   │
                                                            │
game_sessions                                               │
  ├──〈1:N〉── contest_entries(game_session_id)              │
  └──〈1:N〉── leaderboard_timed(game_session_id)            │
```

---

## 5. Triggers & Auto-Migrations

### `trg_insert_default_settings` (AFTER INSERT ON players)

Automatically creates 11 default settings rows whenever a new player is created.

### `trg_refresh_leaderboard` (AFTER UPDATE OF xp, level, total_stars, title ON players)

Automatically upserts a `leaderboard_entries` row whenever a player's XP, level, stars, or title changes. This keeps the global leaderboard near-real-time without manual sync.

**Note:** The trigger is a fallback — the primary sync path is via `SyncPlayer()` called explicitly after game/level completion, which also computes `levels_cleared` and `best_wpm` from `level_progress`.

---

## 6. Frequently Queried Patterns

### Top 50 global leaderboard
```sql
SELECT player_id, player_name, level, xp, total_stars, levels_cleared, best_wpm,
       ROW_NUMBER() OVER (ORDER BY xp DESC, total_stars DESC, best_wpm DESC) AS rank
FROM leaderboard_entries
ORDER BY xp DESC, total_stars DESC, best_wpm DESC
LIMIT 50;
```

### Player's rank with neighbors
```sql
-- Find player's row with rank
SELECT *, ROW_NUMBER() OVER (ORDER BY xp DESC, total_stars DESC, best_wpm DESC) AS rank
FROM leaderboard_entries
WHERE player_id = $1;

-- 2 players above
SELECT *, ROW_NUMBER() OVER (...) AS rank
FROM leaderboard_entries
WHERE player_id != $2
ORDER BY xp DESC, total_stars DESC, best_wpm DESC
OFFSET GREATEST(0, $rank - 3) LIMIT 2;

-- 2 players below
SELECT *, ROW_NUMBER() OVER (...) AS rank
FROM leaderboard_entries
ORDER BY xp DESC, total_stars DESC, best_wpm DESC
OFFSET $rank LIMIT 2;
```

### Upsert level progress (keep best)
```sql
INSERT INTO level_progress (player_id, level_id, stars, best_wpm, best_accuracy, completed, attempts, last_played_at)
VALUES ($1, $2, $3, $4, $5, $6, 1, NOW())
ON CONFLICT (player_id, level_id) DO UPDATE SET
  stars       = GREATEST(level_progress.stars, EXCLUDED.stars),
  best_wpm    = GREATEST(level_progress.best_wpm, EXCLUDED.best_wpm),
  best_accuracy = GREATEST(level_progress.best_accuracy, EXCLUDED.best_accuracy),
  completed   = level_progress.completed OR EXCLUDED.completed,
  attempts    = level_progress.attempts + 1,
  last_played_at = NOW();
```

### Player summary (home dashboard)
```sql
-- This is assembled in Go by PlayerHandler.GetSummary():
-- 1. SELECT * FROM players WHERE id = $1
-- 2. SELECT * FROM activity WHERE player_id = $1 ORDER BY timestamp DESC LIMIT 3
-- 3. SELECT * FROM settings WHERE player_id = $1
-- 4. SELECT COUNT(*) FROM level_progress WHERE player_id = $1 AND completed = true
```

### Today's challenges for a player
```sql
SELECT * FROM daily_challenges
WHERE player_id = $1 AND challenge_date = CURRENT_DATE
ORDER BY challenge_type;
```

### Game history with pagination
```sql
SELECT * FROM game_sessions
WHERE player_id = $1 AND is_completed = true
  AND ($2 = '' OR mode = $2)  -- optional mode filter
ORDER BY completed_at DESC
LIMIT $3 OFFSET $4;
```

### Top timed leaderboard for a mode
```sql
SELECT player_id, player_name, mode, best_wpm, best_accuracy, achieved_at,
       ROW_NUMBER() OVER (ORDER BY best_wpm DESC, best_accuracy DESC) AS rank
FROM leaderboard_timed
WHERE mode = $1
ORDER BY best_wpm DESC, best_accuracy DESC
LIMIT $2;
```
