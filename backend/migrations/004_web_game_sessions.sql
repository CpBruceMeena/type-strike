-- type-strike Database Schema
-- Migration 004: Web game sessions, contests, and timed leaderboard
-- Run: psql -U postgres -d typestrike -f 004_web_game_sessions.sql

-- 1. Game Sessions (timed modes + contest games from web/any client)
CREATE TABLE IF NOT EXISTS game_sessions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id     INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  mode          VARCHAR(20) NOT NULL,  -- 'timed_1min', 'timed_3min', 'timed_5min', 'contest'
  level_id      INTEGER,              -- NULL for timed modes, set for level mode
  paragraph     TEXT NOT NULL,
  duration_sec  INTEGER,              -- NULL for level mode (unlimited)
  started_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at  TIMESTAMPTZ,
  wpm           INTEGER,
  accuracy      REAL,
  correct_ks    INTEGER DEFAULT 0,
  total_ks      INTEGER DEFAULT 0,
  max_combo     INTEGER DEFAULT 0,
  error_count   INTEGER DEFAULT 0,
  consistency   REAL DEFAULT 0,
  xp_earned     INTEGER DEFAULT 0,
  stars         INTEGER,              -- NULL for timed modes, 0-3 for level mode
  is_completed  BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_game_sessions_player ON game_sessions(player_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_mode ON game_sessions(mode);
CREATE INDEX IF NOT EXISTS idx_game_sessions_player_time ON game_sessions(player_id, completed_at DESC NULLS LAST);

-- 2. Contests (daily/weekly competition periods)
CREATE TABLE IF NOT EXISTS contests (
  id            SERIAL PRIMARY KEY,
  start_date    TIMESTAMPTZ NOT NULL,
  end_date      TIMESTAMPTZ NOT NULL,
  paragraph     TEXT NOT NULL,
  difficulty    VARCHAR(20) DEFAULT 'expert',
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contests_active ON contests(is_active, start_date DESC);

-- 3. Contest Entries (one per player per contest)
CREATE TABLE IF NOT EXISTS contest_entries (
  id              SERIAL PRIMARY KEY,
  contest_id      INTEGER NOT NULL REFERENCES contests(id) ON DELETE CASCADE,
  player_id       INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  game_session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  wpm             INTEGER NOT NULL,
  accuracy        REAL NOT NULL,
  rank            INTEGER,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(contest_id, player_id)
);

CREATE INDEX IF NOT EXISTS idx_contest_entries_rank ON contest_entries(contest_id, wpm DESC, accuracy DESC);

-- 4. Timed Leaderboard (best WPM per player per timed mode)
CREATE TABLE IF NOT EXISTS leaderboard_timed (
  id            SERIAL PRIMARY KEY,
  mode          VARCHAR(20) NOT NULL,  -- 'timed_1min', 'timed_3min', 'timed_5min'
  player_id     INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  player_name   TEXT NOT NULL DEFAULT '',
  best_wpm      INTEGER NOT NULL,
  best_accuracy REAL NOT NULL DEFAULT 0,
  game_session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  achieved_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(mode, player_id)
);

CREATE INDEX IF NOT EXISTS idx_leaderboard_timed_mode ON leaderboard_timed(mode, best_wpm DESC, best_accuracy DESC);
