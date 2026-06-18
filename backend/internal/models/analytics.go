package models

import (
	"encoding/json"
	"time"
)

// AnalyticsEvent represents a single analytics event logged from gameplay.
type AnalyticsEvent struct {
	ID         int             `json:"id"`
	PlayerID   int             `json:"player_id"`
	EventName  string          `json:"event_name"`
	Timestamp  time.Time       `json:"timestamp"`
	Properties json.RawMessage `json:"properties"`
}

// RecordAnalyticsEventRequest is the payload to log an analytics event.
type RecordAnalyticsEventRequest struct {
	PlayerID   int             `json:"player_id"`
	EventName  string          `json:"event_name"`
	Properties json.RawMessage `json:"properties"`
}

// DailyStats represents aggregated daily statistics for a player.
type DailyStats struct {
	ID                    int       `json:"id"`
	PlayerID              int       `json:"player_id"`
	Date                  time.Time `json:"date"`
	SessionCount          int       `json:"session_count"`
	TotalPlayTimeSeconds  int       `json:"total_play_time_seconds"`
	BestWPM               int       `json:"best_wpm"`
	LevelsCompleted       int       `json:"levels_completed"`
}
