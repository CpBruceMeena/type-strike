package models

import (
	"encoding/json"
	"time"
)

// ── Rank Tier ──────────────────────────────────────────

// RankTier represents a ranking tier (Bronze → Obsidian).
type RankTier struct {
	ID          int    `json:"id" gorm:"primaryKey;autoIncrement"`
	Name        string `json:"name" gorm:"uniqueIndex;size:50"`
	DisplayName string `json:"display_name" gorm:"column:display_name;size:100"`
	Icon        string `json:"icon" gorm:"size:10;default:'🏅'"`
	Color       string `json:"color" gorm:"size:20;default:'#888888'"`
	MinXP       int    `json:"min_xp" gorm:"column:min_xp;default:0"`
	MaxXP       *int   `json:"max_xp,omitempty" gorm:"column:max_xp"`
	Description string `json:"description" gorm:"type:text"`
	SortOrder   int    `json:"sort_order" gorm:"column:sort_order;default:0"`
}

func (RankTier) TableName() string { return "rank_tiers" }

// ── Player Progression ─────────────────────────────────

// PlayerProgression tracks a player's rank, titles, and unlocks.
type PlayerProgression struct {
	ID               int             `json:"id" gorm:"primaryKey;autoIncrement"`
	PlayerID         int             `json:"player_id" gorm:"column:player_id;uniqueIndex"`
	CurrentTierID    *int            `json:"current_tier_id,omitempty" gorm:"column:current_tier_id"`
	HighestTierID    *int            `json:"highest_tier_id,omitempty" gorm:"column:highest_tier_id"`
	UnlockedTitles   json.RawMessage `json:"unlocked_titles" gorm:"column:unlocked_titles;type:jsonb;default:'[]'"`
	UnlockedThemes   json.RawMessage `json:"unlocked_themes" gorm:"column:unlocked_themes;type:jsonb;default:'[]'"`
	TotalXPEarned    int             `json:"total_xp_earned" gorm:"column:total_xp_earned;default:0"`
	LastTierChangeAt *time.Time      `json:"last_tier_change_at,omitempty" gorm:"column:last_tier_change_at"`
	CreatedAt        time.Time       `json:"created_at" gorm:"column:created_at;autoCreateTime"`
	UpdatedAt        time.Time       `json:"updated_at" gorm:"column:updated_at;autoUpdateTime"`
}

func (PlayerProgression) TableName() string { return "player_progression" }

// ── Title ──────────────────────────────────────────────

// Title represents an unlockable title tied to a tier.
type Title struct {
	ID          int    `json:"id" gorm:"primaryKey;autoIncrement"`
	Name        string `json:"name" gorm:"uniqueIndex;size:100"`
	DisplayName string `json:"display_name" gorm:"column:display_name;size:100"`
	Description string `json:"description" gorm:"type:text"`
	TierID      *int   `json:"tier_id,omitempty" gorm:"column:tier_id"`
	Icon        string `json:"icon" gorm:"size:10;default:'🏅'"`
	SortOrder   int    `json:"sort_order" gorm:"column:sort_order;default:0"`
}

func (Title) TableName() string { return "titles" }

// ── Theme Unlock ───────────────────────────────────────

// ThemeUnlock represents a keyboard theme unlockable at a tier.
type ThemeUnlock struct {
	ID           int    `json:"id" gorm:"primaryKey;autoIncrement"`
	ThemeKey     string `json:"theme_key" gorm:"column:theme_key;uniqueIndex;size:50"`
	DisplayName  string `json:"display_name" gorm:"column:display_name;size:100"`
	Description  string `json:"description" gorm:"type:text"`
	TierID       *int   `json:"tier_id,omitempty" gorm:"column:tier_id"`
	Icon         string `json:"icon" gorm:"size:10;default:'🎨'"`
	PreviewColor string `json:"preview_color" gorm:"column:preview_color;size:20;default:'#FF5020'"`
	SortOrder    int    `json:"sort_order" gorm:"column:sort_order;default:0"`
}

func (ThemeUnlock) TableName() string { return "theme_unlocks" }

// ── Response Types ─────────────────────────────────────

// ProgressionResponse is the full progression payload returned to the frontend.
type ProgressionResponse struct {
	CurrentTier  *RankTier          `json:"current_tier"`
	HighestTier  *RankTier          `json:"highest_tier"`
	AllTiers     []RankTier         `json:"all_tiers"`
	UnlockedTitles []string         `json:"unlocked_titles"`
	UnlockedThemes []string         `json:"unlocked_themes"`
	TotalXPEarned int               `json:"total_xp_earned"`
	XP            int               `json:"xp"`
	NextTier      *RankTier         `json:"next_tier,omitempty"`
	XpToNextTier  int               `json:"xp_to_next_tier"`
	CurrentTitle  string            `json:"current_title"`
	CurrentTheme  string            `json:"current_theme"`
}

// CheckTierUpgradeRequest is sent to check/process a tier upgrade.
type CheckTierUpgradeRequest struct {
	PlayerID int `json:"player_id"`
}

// TierUpgradeResponse is returned when a tier upgrade is checked.
type TierUpgradeResponse struct {
	Upgraded       bool     `json:"upgraded"`
	PreviousTier   *RankTier `json:"previous_tier,omitempty"`
	NewTier        *RankTier `json:"new_tier,omitempty"`
	NewUnlocks     []string  `json:"new_unlocks,omitempty"`
}

// TierDetailResponse is the full detail for a rank tier including its titles and theme unlocks.
type TierDetailResponse struct {
	Tier    RankTier      `json:"tier"`
	Titles  []Title       `json:"titles"`
	Themes  []ThemeUnlock `json:"themes"`
}

// AllTiersDetailResponse wraps all tiers with their titles and themes.
type AllTiersDetailResponse struct {
	Tiers []TierDetailResponse `json:"tiers"`
}
