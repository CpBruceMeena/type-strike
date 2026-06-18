-- type-strike Database Schema
-- Migration 002: Levels catalog table
-- Stores all 100 level configurations (paragraph, pass requirements, complexity).
-- Run after 001_init.sql:
--   psql -U postgres -d typestrike -f 002_levels.sql

-- 1. Levels Catalog (static configuration for each of the 100 levels)
CREATE TABLE IF NOT EXISTS levels (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  tier TEXT NOT NULL CHECK(tier IN ('ember', 'igneious', 'magma_core', 'obsidian')),
  difficulty INTEGER NOT NULL CHECK(difficulty >= 1 AND difficulty <= 4),
  pass_wpm INTEGER NOT NULL,
  pass_accuracy INTEGER NOT NULL,
  paragraph TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(name, tier)
);

CREATE INDEX IF NOT EXISTS idx_levels_tier ON levels(tier);
CREATE INDEX IF NOT EXISTS idx_levels_difficulty ON levels(difficulty);
