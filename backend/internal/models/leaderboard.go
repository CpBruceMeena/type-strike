package models

import "time"

// LeaderboardEntry represents a player's current standing on the leaderboard.
// This is a query result from leaderboard_entries view/table — no GORM model tag needed.
type LeaderboardEntry struct {
	PlayerID      int       `json:"player_id"`
	PlayerName    string    `json:"player_name"`
	Level         int       `json:"level"`
	XP            int       `json:"xp"`
	TotalStars    int       `json:"total_stars"`
	LevelsCleared int       `json:"levels_cleared"`
	BestWPM       int       `json:"best_wpm"`
	UpdatedAt     time.Time `json:"updated_at"`
	Rank          int       `json:"rank"`
}

// LeaderboardResponse wraps a list of leaderboard entries with metadata.
type LeaderboardResponse struct {
	Entries    []LeaderboardEntry `json:"entries"`
	TotalCount int                `json:"total_count"`
	PlayerRank *PlayerRank        `json:"player_rank,omitempty"`
}

// PlayerRank shows a specific player's rank with nearby competitors.
type PlayerRank struct {
	Entry LeaderboardEntry   `json:"entry"`
	Above []LeaderboardEntry `json:"above"`
	Below []LeaderboardEntry `json:"below"`
}
