package models

import "time"

// GameSession represents a single game session for timed modes or contests.
type GameSession struct {
	ID          int64      `json:"id" gorm:"primaryKey;autoIncrement"`
	PlayerID    int        `json:"player_id" gorm:"column:player_id;index"`
	Mode        string     `json:"mode"`
	LevelID     *int       `json:"level_id,omitempty" gorm:"column:level_id"`
	Paragraph   string     `json:"-" gorm:"type:text"`
	DurationSec *int       `json:"duration_seconds,omitempty" gorm:"column:duration_sec"`
	StartedAt   time.Time  `json:"started_at" gorm:"column:started_at;autoCreateTime"`
	CompletedAt *time.Time `json:"completed_at,omitempty" gorm:"column:completed_at"`
	WPM         *int       `json:"wpm,omitempty" gorm:"column:wpm"`
	Accuracy    *float64   `json:"accuracy,omitempty" gorm:"column:accuracy"`
	CorrectKS   int        `json:"correct_keystrokes" gorm:"column:correct_ks;default:0"`
	TotalKS     int        `json:"total_keystrokes" gorm:"column:total_ks;default:0"`
	MaxCombo    int        `json:"max_combo" gorm:"column:max_combo;default:0"`
	ErrorCount  int        `json:"error_count" gorm:"column:error_count;default:0"`
	Consistency float64    `json:"consistency" gorm:"default:0"`
	XPEarned    int        `json:"xp_earned" gorm:"column:xp_earned;default:0"`
	Stars       *int       `json:"stars,omitempty"`
	IsCompleted bool       `json:"is_completed" gorm:"column:is_completed;default:false"`
}

func (GameSession) TableName() string { return "game_sessions" }

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
	PlayerID          int     `json:"player_id"`
	WPM               int     `json:"wpm"`
	Accuracy          float64 `json:"accuracy"`
	CorrectKeystrokes int     `json:"correct_keystrokes"`
	TotalKeystrokes   int     `json:"total_keystrokes"`
	MaxCombo          int     `json:"max_combo"`
	ErrorCount        int     `json:"error_count"`
	Consistency       float64 `json:"consistency"`
	Completed         bool    `json:"completed"`
}

// CompleteGameResponse is returned when a game is completed.
type CompleteGameResponse struct {
	GameID             string                    `json:"game_id"`
	WPM                int                       `json:"wpm"`
	Accuracy           float64                   `json:"accuracy"`
	XPEarned           int                       `json:"xp_earned"`
	Stars              *int                      `json:"stars"`
	Rank               *int                      `json:"rank"`
	Upgrade            *TierUpgradeResponse      `json:"upgrade,omitempty"`
	AchievementUnlocks []AchievementUnlockEvent  `json:"achievement_unlocks,omitempty"`
}

// GameHistoryEntry is a single entry in a player's game history.
type GameHistoryEntry struct {
	ID                int64     `json:"id"`
	Mode              string    `json:"mode"`
	WPM               int       `json:"wpm"`
	Accuracy          float64   `json:"accuracy"`
	CorrectKeystrokes int       `json:"correct_keystrokes"`
	TotalKeystrokes   int       `json:"total_keystrokes"`
	MaxCombo          int       `json:"max_combo"`
	XPEarned          int       `json:"xp_earned"`
	PlayedAt          time.Time `json:"played_at"`
	Stars             *int      `json:"stars,omitempty"`
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
