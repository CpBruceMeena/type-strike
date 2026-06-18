package models

import (
	"encoding/json"
	"time"
)

// Activity represents a single player activity event.
type Activity struct {
	ID        int             `json:"id"`
	PlayerID  int             `json:"player_id"`
	Type      string          `json:"type"`
	Timestamp time.Time       `json:"timestamp"`
	Metadata json.RawMessage `json:"metadata"`
}

// ActivityType constants
const (
	ActivityLevelCompleted = "level_completed"
	ActivityLevelFailed    = "level_failed"
	ActivityAchievement   = "achievement"
	ActivityLevelUp      = "level_up"
	ActivityNewHighScore = "new_high_score"
)

// RecordActivityRequest is the payload to log a new activity event.
type RecordActivityRequest struct {
	Type      string          `json:"type"`
	PlayerID  int             `json:"player_id"`
	Metadata json.RawMessage `json:"metadata"`
}
