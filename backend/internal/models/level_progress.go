package models

import "time"

// LevelProgress represents a player's progress on a specific level.
type LevelProgress struct {
	ID           int       `json:"id" gorm:"primaryKey;autoIncrement"`
	PlayerID     int       `json:"player_id" gorm:"column:player_id;uniqueIndex:idx_player_level"`
	LevelID      int       `json:"level_id" gorm:"column:level_id;uniqueIndex:idx_player_level"`
	Stars        int       `json:"stars" gorm:"default:0"`
	BestWPM      int       `json:"best_wpm" gorm:"column:best_wpm;default:0"`
	BestAccuracy float64   `json:"best_accuracy" gorm:"column:best_accuracy;default:0"`
	Completed    bool      `json:"completed" gorm:"default:false"`
	Attempts     int       `json:"attempts" gorm:"default:0"`
	LastPlayedAt time.Time `json:"last_played_at" gorm:"column:last_played_at;autoUpdateTime"`
}

func (LevelProgress) TableName() string { return "level_progress" }

// UpdateLevelProgressRequest is the payload to record level completion.
type UpdateLevelProgressRequest struct {
	Stars        int     `json:"stars"`
	WPM          int     `json:"wpm"`
	Accuracy     float64 `json:"accuracy"`
	Completed    bool    `json:"completed"`
}

// LevelCompleteResponse wraps level progress with optional tier upgrade info.
type LevelCompleteResponse struct {
	*LevelProgress
	Upgrade *TierUpgradeResponse `json:"upgrade,omitempty"`
}
