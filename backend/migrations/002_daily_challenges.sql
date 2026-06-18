-- type-strike Database Schema
-- Migration 002: Daily Challenges
-- Run: psql -U postgres -d typestrike -f 002_daily_challenges.sql

-- 7. Daily Challenges (per-player, per-day standalone challenge mode)
CREATE TABLE IF NOT EXISTS daily_challenges (
  id SERIAL PRIMARY KEY,
  player_id INTEGER REFERENCES players(id) ON DELETE CASCADE,
  challenge_date DATE NOT NULL DEFAULT CURRENT_DATE,
  challenge_type TEXT NOT NULL CHECK (challenge_type IN ('speed_sprint', 'precision_mode', 'star_challenge')),
  challenge_name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  icon TEXT NOT NULL DEFAULT '🔥',
  level_id INTEGER NOT NULL,
  target_wpm INTEGER NOT NULL DEFAULT 0,
  target_accuracy REAL NOT NULL DEFAULT 0.0,
  reward_xp INTEGER NOT NULL DEFAULT 50,
  reward_stars INTEGER NOT NULL DEFAULT 1,
  current_best_wpm INTEGER DEFAULT 0,
  current_best_accuracy REAL DEFAULT 0.0,
  completed BOOLEAN DEFAULT FALSE,
  attempts INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(player_id, challenge_date, challenge_type)
);

-- Index for fast lookup of today's challenges for a player
CREATE INDEX IF NOT EXISTS idx_daily_challenges_player_date
  ON daily_challenges(player_id, challenge_date DESC);
