package models

import (
	"database/sql/driver"
	"fmt"
	"strings"
	"time"
)

// DateOnly is a date-only (YYYY-MM-DD) type that wraps time.Time for proper
// pgx binary scanning and JSON serialization in the expected format.
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

// Scan implements the sql.Scanner interface for pgx binary protocol.
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
	ID                 int      `json:"id"`
	PlayerID           int      `json:"player_id"`
	ChallengeDate      DateOnly `json:"challenge_date"`
	ChallengeType      string   `json:"challenge_type"`
	ChallengeName      string   `json:"challenge_name"`
	Description        string   `json:"description"`
	Icon               string   `json:"icon"`
	LevelID            int      `json:"level_id"`
	TargetWPM          int      `json:"target_wpm"`
	TargetAccuracy     float64  `json:"target_accuracy"`
	RewardXP           int      `json:"reward_xp"`
	RewardStars        int      `json:"reward_stars"`
	CurrentBestWPM     int      `json:"current_best_wpm"`
	CurrentBestAccuracy float64 `json:"current_best_accuracy"`
	Completed          bool     `json:"completed"`
	Attempts           int      `json:"attempts"`
	CreatedAt          time.Time `json:"created_at"`
}

// GenerateChallengesRequest is sent when the backend generates (or retrieves)
// the 3 daily challenges for a player.
type GenerateChallengesRequest struct {
	PlayerID int `json:"player_id"`
}
