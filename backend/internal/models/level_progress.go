package models

import "time"

// LevelProgress represents a player's progress on a specific level.
type LevelProgress struct {
	ID           int       `json:"id"`
	PlayerID     int       `json:"player_id"`
	LevelID      int       `json:"level_id"`
	Stars        int       `json:"stars"`
	BestWPM      int       `json:"best_wpm"`
	BestAccuracy float64   `json:"best_accuracy"`
	Completed    bool      `json:"completed"`
	Attempts     int       `json:"attempts"`
	LastPlayedAt time.Time `json:"last_played_at"`
}

// UpdateLevelProgressRequest is the payload to record level completion.
type UpdateLevelProgressRequest struct {
	Stars        int     `json:"stars"`
	WPM          int     `json:"wpm"`
	Accuracy     float64 `json:"accuracy"`
	Completed    bool    `json:"completed"`
}
