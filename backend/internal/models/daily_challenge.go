package models

import "time"

// DailyChallenge represents a single daily challenge for a player.
type DailyChallenge struct {
	ID                 int       `json:"id"`
	PlayerID           int       `json:"player_id"`
	ChallengeDate      string    `json:"challenge_date"`
	ChallengeType      string    `json:"challenge_type"`
	ChallengeName      string    `json:"challenge_name"`
	Description        string    `json:"description"`
	Icon               string    `json:"icon"`
	LevelID            int       `json:"level_id"`
	TargetWPM          int       `json:"target_wpm"`
	TargetAccuracy     float64   `json:"target_accuracy"`
	RewardXP           int       `json:"reward_xp"`
	RewardStars        int       `json:"reward_stars"`
	CurrentBestWPM     int       `json:"current_best_wpm"`
	CurrentBestAccuracy float64  `json:"current_best_accuracy"`
	Completed          bool      `json:"completed"`
	Attempts           int       `json:"attempts"`
	CreatedAt          time.Time `json:"created_at"`
}

// GenerateChallengesRequest is sent when the backend generates (or retrieves)
// the 3 daily challenges for a player.
type GenerateChallengesRequest struct {
	PlayerID int `json:"player_id"`
}
