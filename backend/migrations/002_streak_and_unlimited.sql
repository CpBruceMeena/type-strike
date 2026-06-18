-- type-strike Database Schema
-- Migration 002: Streak tracking + unlimited level support
-- Run: psql -U postgres -d typestrike -f 002_streak_and_unlimited.sql

-- 1. Add streak tracking to players table
ALTER TABLE IF EXISTS players
  ADD COLUMN IF NOT EXISTS streak_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_streak_date DATE DEFAULT NULL;

-- 2. Drop the CHECK constraint on stars if it exists (older schemas)
--    (keep it, it's fine)

-- 3. Index for fast streak lookup
CREATE INDEX IF NOT EXISTS idx_players_streak ON players(streak_count DESC);
