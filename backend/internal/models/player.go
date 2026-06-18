package models

import "time"

// Player represents a player's identity and progression data.
type Player struct {
	ID           int       `json:"id"`
	PlayerUUID   string    `json:"player_uuid"`
	Level        int       `json:"level"`
	Title        string    `json:"title"`
	XP           int       `json:"xp"`
	TotalStars   int       `json:"total_stars"`
	CreatedAt    time.Time `json:"created_at"`
	LastPlayedAt time.Time `json:"last_played_at"`
	StreakCount  int       `json:"streak_count"`
	LastStreakDate *time.Time `json:"last_streak_date,omitempty"`
}

// CreatePlayerRequest is the payload for creating a new player.
type CreatePlayerRequest struct {
	Level int    `json:"level"`
	Title string `json:"title"`
}

// UpdatePlayerRequest is the payload for partial player updates.
type UpdatePlayerRequest struct {
	Level      *int    `json:"level,omitempty"`
	Title      *string `json:"title,omitempty"`
	XP         *int    `json:"xp,omitempty"`
	TotalStars *int    `json:"total_stars,omitempty"`
}
