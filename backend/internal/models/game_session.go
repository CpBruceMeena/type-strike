package models

import (
	"time"

	"github.com/google/uuid"
)

// GameSession represents a single game session for timed modes or contests.
type GameSession struct {
	ID           uuid.UUID  `json:"id"`
	PlayerID     int        `json:"player_id"`
	Mode         string     `json:"mode"`
	LevelID      *int       `json:"level_id,omitempty"`
	Paragraph    string     `json:"-"`
	DurationSec  *int       `json:"duration_seconds,omitempty"`
	StartedAt    time.Time  `json:"started_at"`
	CompletedAt  *time.Time `json:"completed_at,omitempty"`
	WPM          *int       `json:"wpm,omitempty"`
	Accuracy     *float64   `json:"accuracy,omitempty"`
	CorrectKS    int        `json:"correct_keystrokes"`
	TotalKS      int        `json:"total_keystrokes"`
	MaxCombo     int        `json:"max_combo"`
	ErrorCount   int        `json:"error_count"`
	Consistency  float64    `json:"consistency"`
	XPEarned     int        `json:"xp_earned"`
	Stars        *int       `json:"stars,omitempty"`
	IsCompleted  bool       `json:"is_completed"`
}

// StartGameRequest is the payload for starting a new game session.
type StartGameRequest struct {
	PlayerID int    `json:"player_id"`
	Mode     string `json:"mode"`
	LevelID  *int   `json:"level_id,omitempty"`
}

// StartGameResponse is returned when a game session is started.
type StartGameResponse struct {
	GameID          string `json:"game_id"`
	Mode            string `json:"mode"`
	Paragraph       string `json:"paragraph"`
	DurationSeconds *int   `json:"duration_seconds"`
	LevelID         *int   `json:"level_id"`
}

// CompleteGameRequest is the payload for submitting game results.
type CompleteGameRequest struct {
	PlayerID         int     `json:"player_id"`
	WPM              int     `json:"wpm"`
	Accuracy         float64 `json:"accuracy"`
	CorrectKeystrokes int    `json:"correct_keystrokes"`
	TotalKeystrokes  int     `json:"total_keystrokes"`
	MaxCombo         int     `json:"max_combo"`
	ErrorCount       int     `json:"error_count"`
	Consistency      float64 `json:"consistency"`
	Completed        bool    `json:"completed"`
}

// CompleteGameResponse is returned when a game is completed.
type CompleteGameResponse struct {
	GameID    string `json:"game_id"`
	WPM       int     `json:"wpm"`
	Accuracy  float64 `json:"accuracy"`
	XPEarned  int     `json:"xp_earned"`
	Stars     *int    `json:"stars"`
	Rank      *int    `json:"rank"`
}

// GameHistoryEntry is a single entry in a player's game history.
type GameHistoryEntry struct {
	ID               string    `json:"id"`
	Mode             string    `json:"mode"`
	WPM              int       `json:"wpm"`
	Accuracy         float64   `json:"accuracy"`
	CorrectKeystrokes int      `json:"correct_keystrokes"`
	TotalKeystrokes  int       `json:"total_keystrokes"`
	MaxCombo         int       `json:"max_combo"`
	XPEarned         int       `json:"xp_earned"`
	PlayedAt         time.Time `json:"played_at"`
	Stars            *int      `json:"stars,omitempty"`
}

// GameHistoryResponse wraps a list of game history entries.
type GameHistoryResponse struct {
	Games []GameHistoryEntry `json:"games"`
	Total int                `json:"total"`
}

// TimedLeaderboardEntry represents a player's best score in a timed mode.
type TimedLeaderboardEntry struct {
	PlayerID     int       `json:"player_id"`
	PlayerName   string    `json:"player_name"`
	Mode         string    `json:"mode"`
	BestWPM      int       `json:"best_wpm"`
	BestAccuracy float64   `json:"best_accuracy"`
	AchievedAt   time.Time `json:"achieved_at"`
	Rank         int       `json:"rank"`
}

// TimedLeaderboardResponse wraps timed leaderboard results.
type TimedLeaderboardResponse struct {
	Entries    []TimedLeaderboardEntry `json:"entries"`
	TotalCount int                     `json:"total_count"`
}

// Mode durations in seconds
const (
	ModeTimed1Min = "timed_1min"
	ModeTimed3Min = "timed_3min"
	ModeTimed5Min = "timed_5min"
	ModeContest   = "contest"
	ModeLevel     = "level"
)

var ModeDurations = map[string]int{
	ModeTimed1Min: 60,
	ModeTimed3Min: 180,
	ModeTimed5Min: 300,
}
