package models

import (
	"database/sql/driver"
	"fmt"
	"strings"
	"time"
)

// DateOnly is a date-only (YYYY-MM-DD) type that wraps time.Time for proper
// GORM/JSON serialization in the expected format.
type DateOnly struct {
	time.Time
}

// UnmarshalJSON parses a "2006-01-02" date string from JSON.
func (d *DateOnly) UnmarshalJSON(data []byte) error {
	s := strings.Trim(string(data), "\"")
	t, err := time.Parse("2006-01-02", s)
	if err != nil {
		return fmt.Errorf("parse DateOnly: %w", err)
	}
	d.Time = t
	return nil
}

// MarshalJSON serializes the date as "2006-01-02".
func (d DateOnly) MarshalJSON() ([]byte, error) {
	return []byte(fmt.Sprintf("%q", d.Format("2006-01-02"))), nil
}

// Scan implements the sql.Scanner interface for database drivers.
func (d *DateOnly) Scan(value interface{}) error {
	if value == nil {
		d.Time = time.Time{}
		return nil
	}
	switch v := value.(type) {
	case time.Time:
		d.Time = v
		return nil
	default:
		return fmt.Errorf("cannot scan %T into DateOnly", value)
	}
}

// Value implements the driver.Valuer interface.
func (d DateOnly) Value() (driver.Value, error) {
	return d.Format("2006-01-02"), nil
}

// DailyChallenge represents a single daily challenge for a player.
type DailyChallenge struct {
	ID                  int       `json:"id" gorm:"primaryKey;autoIncrement"`
	PlayerID            int       `json:"player_id" gorm:"column:player_id;uniqueIndex:idx_player_date_type"`
	ChallengeDate       DateOnly  `json:"challenge_date" gorm:"column:challenge_date;type:date;uniqueIndex:idx_player_date_type"`
	ChallengeType       string    `json:"challenge_type" gorm:"column:challenge_type;uniqueIndex:idx_player_date_type"`
	ChallengeName       string    `json:"challenge_name" gorm:"column:challenge_name"`
	Description         string    `json:"description"`
	Icon                string    `json:"icon"`
	LevelID             int       `json:"level_id" gorm:"column:level_id"`
	TargetWPM           int       `json:"target_wpm" gorm:"column:target_wpm"`
	TargetAccuracy      float64   `json:"target_accuracy" gorm:"column:target_accuracy"`
	RewardXP            int       `json:"reward_xp" gorm:"column:reward_xp"`
	RewardStars         int       `json:"reward_stars" gorm:"column:reward_stars"`
	CurrentBestWPM      int       `json:"current_best_wpm" gorm:"column:current_best_wpm;default:0"`
	CurrentBestAccuracy float64   `json:"current_best_accuracy" gorm:"column:current_best_accuracy;default:0"`
	Completed           bool      `json:"completed" gorm:"default:false"`
	Attempts            int       `json:"attempts" gorm:"default:0"`
	CreatedAt           time.Time `json:"created_at" gorm:"column:created_at;autoCreateTime"`
}

func (DailyChallenge) TableName() string { return "daily_challenges" }

// GenerateChallengesRequest is sent when the backend generates (or retrieves)
// the 3 daily challenges for a player.
type GenerateChallengesRequest struct {
	PlayerID int `json:"player_id"`
}
