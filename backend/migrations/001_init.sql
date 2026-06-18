-- type-strike Database Schema
-- Migration 001: Initial schema
-- Run: psql -U postgres -d typestrike -f 001_init.sql

-- Create database if it doesn't exist (run separately as superuser)
-- CREATE DATABASE typestrike;

-- 1. Players (player identity & progress)
CREATE TABLE IF NOT EXISTS players (
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
CREATE TABLE IF NOT EXISTS level_progress (
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
CREATE TABLE IF NOT EXISTS activity (
  id SERIAL PRIMARY KEY,
  player_id INTEGER REFERENCES players(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);
CREATE INDEX IF NOT EXISTS idx_activity_player_time ON activity(player_id, timestamp DESC);

-- 4. Settings (player preferences, keyed by 'key')
CREATE TABLE IF NOT EXISTS settings (
  id SERIAL PRIMARY KEY,
  player_id INTEGER REFERENCES players(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  UNIQUE(player_id, key)
);

-- 5. Analytics Events (local event log)
CREATE TABLE IF NOT EXISTS analytics_events (
  id SERIAL PRIMARY KEY,
  player_id INTEGER REFERENCES players(id) ON DELETE CASCADE,
  event_name TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  properties JSONB DEFAULT '{}'
);
CREATE INDEX IF NOT EXISTS idx_analytics_event_time ON analytics_events(event_name, timestamp);

-- 6. Daily Stats (aggregated per day per player)
CREATE TABLE IF NOT EXISTS daily_stats (
  id SERIAL PRIMARY KEY,
  player_id INTEGER REFERENCES players(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  session_count INTEGER DEFAULT 0,
  total_play_time_seconds INTEGER DEFAULT 0,
  best_wpm INTEGER DEFAULT 0,
  levels_completed INTEGER DEFAULT 0,
  UNIQUE(player_id, date)
);

-- Default Settings Insert
INSERT INTO settings (player_id, key, value)
SELECT id, 'keyboard_layout', 'QWERTY' FROM players WHERE NOT EXISTS (SELECT 1 FROM settings WHERE key = 'keyboard_layout')
ON CONFLICT DO NOTHING;

-- Function to insert default settings for a new player
CREATE OR REPLACE FUNCTION insert_default_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO settings (player_id, key, value) VALUES
    (NEW.id, 'keyboard_layout', 'QWERTY'),
    (NEW.id, 'key_size', 'M'),
    (NEW.id, 'key_click_type', 'BLUE'),
    (NEW.id, 'sound_volume', '0.8'),
    (NEW.id, 'music_volume', '0.5'),
    (NEW.id, 'haptics_on', 'true'),
    (NEW.id, 'haptics_intensity', 'MEDIUM'),
    (NEW.id, 'reduced_particles', 'false'),
    (NEW.id, 'font_size', '1.0'),
    (NEW.id, 'high_contrast', 'false'),
    (NEW.id, 'left_handed', 'false');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-insert default settings when a player is created
DROP TRIGGER IF EXISTS trg_insert_default_settings ON players;
CREATE TRIGGER trg_insert_default_settings
  AFTER INSERT ON players
  FOR EACH ROW
  EXECUTE FUNCTION insert_default_settings();
