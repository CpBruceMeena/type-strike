-- type-strike Database Schema
-- Migration 007: Gamified Progression System
-- Rank tiers, player progression tracking, titles, and theme unlocks
-- Run: psql -U postgres -d typestrike -f 007_gamified_progression.sql

-- 1. Rank Tiers (Bronze → Obsidian)
CREATE TABLE IF NOT EXISTS rank_tiers (
    id           SERIAL PRIMARY KEY,
    name         VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    icon         VARCHAR(10) NOT NULL DEFAULT '🏅',
    color        VARCHAR(20) NOT NULL DEFAULT '#888888',
    min_xp       INTEGER NOT NULL DEFAULT 0,
    max_xp       INTEGER,            -- NULL = no upper bound (highest tier)
    description  TEXT NOT NULL DEFAULT '',
    sort_order   INTEGER NOT NULL DEFAULT 0
);

-- 2. Player Progression (one row per player)
CREATE TABLE IF NOT EXISTS player_progression (
    id                 SERIAL PRIMARY KEY,
    player_id          INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE UNIQUE,
    current_tier_id    INTEGER REFERENCES rank_tiers(id),
    highest_tier_id    INTEGER REFERENCES rank_tiers(id),
    unlocked_titles    JSONB NOT NULL DEFAULT '[]',
    unlocked_themes    JSONB NOT NULL DEFAULT '[]',
    total_xp_earned    INTEGER NOT NULL DEFAULT 0,
    last_tier_change_at TIMESTAMPTZ,
    created_at         TIMESTAMPTZ DEFAULT NOW(),
    updated_at         TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_player_progression_tier ON player_progression(current_tier_id);

-- 3. Titles (unlockable titles per tier)
CREATE TABLE IF NOT EXISTS titles (
    id           SERIAL PRIMARY KEY,
    name         VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    description  TEXT NOT NULL DEFAULT '',
    tier_id      INTEGER REFERENCES rank_tiers(id),
    icon         VARCHAR(10) NOT NULL DEFAULT '🏅',
    sort_order   INTEGER NOT NULL DEFAULT 0
);

-- 4. Theme Unlocks (keyboard themes per tier)
CREATE TABLE IF NOT EXISTS theme_unlocks (
    id            SERIAL PRIMARY KEY,
    theme_key     VARCHAR(50) NOT NULL UNIQUE,
    display_name  VARCHAR(100) NOT NULL,
    description   TEXT NOT NULL DEFAULT '',
    tier_id       INTEGER REFERENCES rank_tiers(id),
    icon          VARCHAR(10) NOT NULL DEFAULT '🎨',
    preview_color VARCHAR(20) NOT NULL DEFAULT '#FF5020',
    sort_order    INTEGER NOT NULL DEFAULT 0
);

-- ── Seed Data ───────────────────────────────────────────

-- Rank Tiers
INSERT INTO rank_tiers (name, display_name, icon, color, min_xp, max_xp, description, sort_order) VALUES
    ('bronze',    'Bronze',    '🥉', '#CD7F32',   0,    499,   'The beginning of your journey', 1),
    ('silver',    'Silver',    '🥈', '#C0C0C0',   500,  1499,  'Rising through the ranks', 2),
    ('gold',      'Gold',      '🥇', '#FFCC00',   1500, 3999,  'A formidable typist', 3),
    ('platinum',  'Platinum',  '💎', '#00E5FF',   4000, 7999,  'Elite precision and speed', 4),
    ('diamond',   'Diamond',   '💠', '#8844FF',   8000, 14999, 'Master of the keyboard', 5),
    ('obsidian',  'Obsidian',  '⚫', '#FF5020',   15000, NULL,  'The pinnacle of typing' , 6)
ON CONFLICT (name) DO NOTHING;

-- Titles
INSERT INTO titles (name, display_name, description, tier_id, icon, sort_order)
SELECT 'RECRUIT', 'Recruit', 'The first step on your journey', id, '🪖', 1 FROM rank_tiers WHERE name = 'bronze'
ON CONFLICT (name) DO NOTHING;

INSERT INTO titles (name, display_name, description, tier_id, icon, sort_order)
SELECT 'STRIDER', 'Strider', 'Moving with purpose and pace', id, '⚔️', 2 FROM rank_tiers WHERE name = 'bronze'
ON CONFLICT (name) DO NOTHING;

INSERT INTO titles (name, display_name, description, tier_id, icon, sort_order)
SELECT 'FORGER', 'Forger', 'Shaping words from raw keystrokes', id, '🔨', 3 FROM rank_tiers WHERE name = 'silver'
ON CONFLICT (name) DO NOTHING;

INSERT INTO titles (name, display_name, description, tier_id, icon, sort_order)
SELECT 'BLAZER', 'Blazer', 'Leaving a trail of fire with every word', id, '🔥', 4 FROM rank_tiers WHERE name = 'silver'
ON CONFLICT (name) DO NOTHING;

INSERT INTO titles (name, display_name, description, tier_id, icon, sort_order)
SELECT 'GUARDIAN', 'Guardian', 'Protector of the flame', id, '🛡️', 5 FROM rank_tiers WHERE name = 'gold'
ON CONFLICT (name) DO NOTHING;

INSERT INTO titles (name, display_name, description, tier_id, icon, sort_order)
SELECT 'SENTINEL', 'Sentinel', 'Ever watchful, ever typing', id, '👁️', 6 FROM rank_tiers WHERE name = 'gold'
ON CONFLICT (name) DO NOTHING;

INSERT INTO titles (name, display_name, description, tier_id, icon, sort_order)
SELECT 'PHANTOM', 'Phantom', 'Invisible keystrokes, thunderous impact', id, '👻', 7 FROM rank_tiers WHERE name = 'platinum'
ON CONFLICT (name) DO NOTHING;

INSERT INTO titles (name, display_name, description, tier_id, icon, sort_order)
SELECT 'WRAITH', 'Wraith', 'A force of nature on the keyboard', id, '💀', 8 FROM rank_tiers WHERE name = 'platinum'
ON CONFLICT (name) DO NOTHING;

INSERT INTO titles (name, display_name, description, tier_id, icon, sort_order)
SELECT 'ARCHON', 'Archon', 'One who commands the keys', id, '👑', 9 FROM rank_tiers WHERE name = 'diamond'
ON CONFLICT (name) DO NOTHING;

INSERT INTO titles (name, display_name, description, tier_id, icon, sort_order)
SELECT 'LEGEND', 'Legend', 'Your name echoes through the leaderboard', id, '🌟', 10 FROM rank_tiers WHERE name = 'diamond'
ON CONFLICT (name) DO NOTHING;

INSERT INTO titles (name, display_name, description, tier_id, icon, sort_order)
SELECT 'OBSIDIAN', 'Obsidian', 'The final form. Unmatched. Unbroken.', id, '⚫', 11 FROM rank_tiers WHERE name = 'obsidian'
ON CONFLICT (name) DO NOTHING;

INSERT INTO titles (name, display_name, description, tier_id, icon, sort_order)
SELECT 'IMMORTAL', 'Immortal', 'Transcended the limits of typing itself', id, '♾️', 12 FROM rank_tiers WHERE name = 'obsidian'
ON CONFLICT (name) DO NOTHING;

-- Theme Unlocks
INSERT INTO theme_unlocks (theme_key, display_name, description, tier_id, icon, preview_color, sort_order)
SELECT 'magma', 'Magma', 'Fiery red theme — the default', id, '🔥', '#FF5020', 1 FROM rank_tiers WHERE name = 'bronze'
ON CONFLICT (theme_key) DO NOTHING;

INSERT INTO theme_unlocks (theme_key, display_name, description, tier_id, icon, preview_color, sort_order)
SELECT 'molten_gold', 'Molten Gold', 'Premium golden keys', id, '⭐', '#FFCC00', 2 FROM rank_tiers WHERE name = 'silver'
ON CONFLICT (theme_key) DO NOTHING;

INSERT INTO theme_unlocks (theme_key, display_name, description, tier_id, icon, preview_color, sort_order)
SELECT 'neon_pulse', 'Neon Pulse', 'Electric purple glow', id, '✨', '#CC44FF', 3 FROM rank_tiers WHERE name = 'gold'
ON CONFLICT (theme_key) DO NOTHING;

INSERT INTO theme_unlocks (theme_key, display_name, description, tier_id, icon, preview_color, sort_order)
SELECT 'frost_strike', 'Frost Strike', 'Chilling blue keys', id, '❄️', '#00E5FF', 4 FROM rank_tiers WHERE name = 'platinum'
ON CONFLICT (theme_key) DO NOTHING;

INSERT INTO theme_unlocks (theme_key, display_name, description, tier_id, icon, preview_color, sort_order)
SELECT 'obsidian_void', 'Obsidian Void', 'Dark prestige keys', id, '🖤', '#8844FF', 5 FROM rank_tiers WHERE name = 'diamond'
ON CONFLICT (theme_key) DO NOTHING;

INSERT INTO theme_unlocks (theme_key, display_name, description, tier_id, icon, preview_color, sort_order)
SELECT 'prismatic_fury', 'Prismatic Fury', 'All colors unlocked — the ultimate flex', id, '🌈', '#FF5020', 6 FROM rank_tiers WHERE name = 'obsidian'
ON CONFLICT (theme_key) DO NOTHING;
