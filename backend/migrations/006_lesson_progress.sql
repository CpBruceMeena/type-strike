-- type-strike Database Schema
-- Migration 006: Lesson Progress tracking
-- Run: psql -U postgres -d typestrike -f 006_lesson_progress.sql

CREATE TABLE IF NOT EXISTS lesson_progress (
  id SERIAL PRIMARY KEY,
  player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  lesson_id INTEGER NOT NULL,
  best_wpm INTEGER DEFAULT 0,
  best_accuracy REAL DEFAULT 0.0,
  completed BOOLEAN DEFAULT FALSE,
  attempts INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(player_id, lesson_id)
);

CREATE INDEX IF NOT EXISTS idx_lesson_progress_player ON lesson_progress(player_id, lesson_id);
