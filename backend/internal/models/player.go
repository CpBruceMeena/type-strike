package models

import "time"

// Player represents a player's identity and progression data.
type Player struct {
	ID             int        `json:"id" gorm:"primaryKey;autoIncrement"`
	PlayerUUID     string     `json:"player_uuid" gorm:"column:player_uuid;type:uuid;default:gen_random_uuid()"`
	Level          int        `json:"level" gorm:"default:1"`
	Title          string     `json:"title" gorm:"default:'RECRUIT'"`
	XP             int        `json:"xp" gorm:"default:0"`
	TotalStars     int        `json:"total_stars" gorm:"column:total_stars;default:0"`
	CreatedAt      time.Time  `json:"created_at" gorm:"column:created_at;autoCreateTime"`
	LastPlayedAt   time.Time  `json:"last_played_at" gorm:"column:last_played_at;autoUpdateTime"`
	StreakCount    int        `json:"streak_count" gorm:"column:streak_count;default:0"`
	LastStreakDate *time.Time `json:"last_streak_date,omitempty" gorm:"column:last_streak_date;type:date"`
	Email          string     `json:"email" gorm:"uniqueIndex:idx_players_email"`
	PlayerTag      string     `json:"player_tag" gorm:"column:player_tag;type:varchar(8);uniqueIndex:idx_players_tag"`
	DisplayName    string     `json:"display_name" gorm:"column:display_name"`
}

func (Player) TableName() string { return "players" }

// CreatePlayerRequest is the payload for creating a new player.
type CreatePlayerRequest struct {
	Level int    `json:"level"`
	Title string `json:"title"`
}

// RegisterPlayerRequest is the payload for Clerk-based player registration.
type RegisterPlayerRequest struct {
	Email       string `json:"email"`
	DisplayName string `json:"display_name"`
}

// RegisterPlayerResponse is the response for player registration.
type RegisterPlayerResponse struct {
	Player Player `json:"player"`
	IsNew  bool   `json:"is_new"`
}

// UpdatePlayerRequest is the payload for partial player updates.
type UpdatePlayerRequest struct {
	Level      *int    `json:"level,omitempty"`
	Title      *string `json:"title,omitempty"`
	XP         *int    `json:"xp,omitempty"`
	TotalStars *int    `json:"total_stars,omitempty"`
}
