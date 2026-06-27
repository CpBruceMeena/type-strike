package models

import (
	"time"
)

// Achievement defines a single achievement that players can unlock.
type Achievement struct {
	ID          int    `json:"id" gorm:"primaryKey;autoIncrement"`
	Key         string `json:"key" gorm:"uniqueIndex;size:100"`
	Name        string `json:"name" gorm:"size:200"`
	Description string `json:"description" gorm:"type:text"`
	Icon        string `json:"icon" gorm:"size:10;default:'🏅'"`
	Category    string `json:"category" gorm:"size:50;default:'general'"`
	MaxProgress int    `json:"max_progress" gorm:"column:max_progress;default:1"`
	SortOrder   int    `json:"sort_order" gorm:"column:sort_order;default:0"`
}

func (Achievement) TableName() string { return "achievements" }

// PlayerAchievement tracks a player's progress toward an achievement.
type PlayerAchievement struct {
	ID            int        `json:"id" gorm:"primaryKey;autoIncrement"`
	PlayerID      int        `json:"-" gorm:"column:player_id;uniqueIndex:idx_player_achiev"`
	AchievementID int        `json:"achievement_id" gorm:"column:achievement_id;uniqueIndex:idx_player_achiev"`
	Progress      int        `json:"progress" gorm:"default:0"`
	MaxProgress   int        `json:"max_progress" gorm:"column:max_progress;default:1"`
	Unlocked      bool       `json:"unlocked" gorm:"default:false"`
	UnlockedAt    *time.Time `json:"unlocked_at,omitempty" gorm:"column:unlocked_at"`
	UpdatedAt     time.Time  `json:"updated_at" gorm:"column:updated_at;autoUpdateTime"`

	// Preloaded achievement definition
	Achievement *Achievement `json:"achievement,omitempty" gorm:"foreignKey:AchievementID"`
}

func (PlayerAchievement) TableName() string { return "player_achievements" }

// ── API Types ──────────────────────────────────────────

// PlayerAchievementResponse is what we return to the frontend for a single player achievement.
type PlayerAchievementResponse struct {
	ID            int        `json:"id"`
	AchievementID int        `json:"achievement_id"`
	Key           string     `json:"key"`
	Name          string     `json:"name"`
	Description   string     `json:"description"`
	Icon          string     `json:"icon"`
	Category      string     `json:"category"`
	Progress      int        `json:"progress"`
	MaxProgress   int        `json:"max_progress"`
	Unlocked      bool       `json:"unlocked"`
	UnlockedAt    *time.Time `json:"unlocked_at,omitempty"`
}

// AllAchievementsResponse wraps all achievements with per-player progress.
type AllAchievementsResponse struct {
	Achievements []PlayerAchievementResponse `json:"achievements"`
	UnlockedCount int                        `json:"unlocked_count"`
	TotalCount    int                        `json:"total_count"`
}

// AchievementUnlockEvent is returned when an achievement is freshly unlocked.
type AchievementUnlockEvent struct {
	AchievementKey  string `json:"achievement_key"`
	AchievementName string `json:"achievement_name"`
	Description     string `json:"description"`
	Icon            string `json:"icon"`
	Category        string `json:"category"`
}

// CheckAchievementsResult is returned after checking achievements on a game event.
type CheckAchievementsResult struct {
	NewUnlocks []AchievementUnlockEvent `json:"new_unlocks"`
}

// Achievement category constants
const (
	AchievCatSpeed       = "speed"
	AchievCatAccuracy    = "accuracy"
	AchievCatCombo       = "combo"
	AchievCatProgression = "progression"
	AchievCatStreak      = "streak"
	AchievCatSocial      = "social"
)
