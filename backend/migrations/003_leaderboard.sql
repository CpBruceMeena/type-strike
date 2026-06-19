-- type-strike Database Schema
-- Migration 003: Leaderboard entries
-- Run: psql -U postgres -d typestrike -f 003_leaderboard.sql

-- 1. Leaderboard entries table
-- Stores each player's current ranking stats, updated on level completion.
CREATE TABLE IF NOT EXISTS leaderboard_entries (
    player_id      INTEGER PRIMARY KEY REFERENCES players(id) ON DELETE CASCADE,
    player_name    TEXT NOT NULL DEFAULT '',
    level          INTEGER NOT NULL DEFAULT 1,
    xp             INTEGER NOT NULL DEFAULT 0,
    total_stars    INTEGER NOT NULL DEFAULT 0,
    levels_cleared INTEGER NOT NULL DEFAULT 0,
    best_wpm       INTEGER NOT NULL DEFAULT 0,
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Indexes for fast leaderboard queries
CREATE INDEX IF NOT EXISTS idx_leaderboard_xp         ON leaderboard_entries(xp DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_stars      ON leaderboard_entries(total_stars DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_wpm        ON leaderboard_entries(best_wpm DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_cleared    ON leaderboard_entries(levels_cleared DESC);

-- 3. Function to auto-refresh leaderboard entry when a player's data changes
CREATE OR REPLACE FUNCTION refresh_leaderboard_entry()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO leaderboard_entries (player_id, player_name, level, xp, total_stars, levels_cleared, updated_at)
    VALUES (
        NEW.id,
        COALESCE(NEW.title, ''),
        NEW.level,
        NEW.xp,
        NEW.total_stars,
        (SELECT COUNT(*) FROM level_progress WHERE player_id = NEW.id AND completed = true),
        NOW()
    )
    ON CONFLICT (player_id) DO UPDATE SET
        player_name    = EXCLUDED.player_name,
        level          = EXCLUDED.level,
        xp             = EXCLUDED.xp,
        total_stars    = EXCLUDED.total_stars,
        levels_cleared = EXCLUDED.levels_cleared,
        updated_at     = EXCLUDED.updated_at;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Trigger to auto-refresh on player update
DROP TRIGGER IF EXISTS trg_refresh_leaderboard ON players;
CREATE TRIGGER trg_refresh_leaderboard
    AFTER UPDATE OF xp, level, total_stars, title ON players
    FOR EACH ROW
    EXECUTE FUNCTION refresh_leaderboard_entry();
