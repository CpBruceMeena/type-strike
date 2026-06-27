package repository

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/cpbrucemeena/type-strike-backend/internal/models"
	"gorm.io/gorm"
)

// ProgressionRepository handles database operations for the gamified progression system.
type ProgressionRepository struct {
	db *gorm.DB
}

// NewProgressionRepository creates a new ProgressionRepository.
func NewProgressionRepository(db *gorm.DB) *ProgressionRepository {
	return &ProgressionRepository{db: db}
}

// ── Rank Tiers ────────────────────────────────────────

// GetAllTiers returns all rank tiers ordered by sort_order.
func (r *ProgressionRepository) GetAllTiers(ctx context.Context) ([]models.RankTier, error) {
	var tiers []models.RankTier
	if err := r.db.WithContext(ctx).Order("sort_order ASC").Find(&tiers).Error; err != nil {
		return nil, fmt.Errorf("get all tiers: %w", err)
	}
	return tiers, nil
}

// GetTierByXP returns the tier that the given XP falls within.
func (r *ProgressionRepository) GetTierByXP(ctx context.Context, xp int) (*models.RankTier, error) {
	var tier models.RankTier
	err := r.db.WithContext(ctx).
		Where("min_xp <= ? AND (max_xp IS NULL OR max_xp > ?)", xp, xp).
		Order("sort_order DESC").
		First(&tier).Error
	if err == gorm.ErrRecordNotFound {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("get tier by xp: %w", err)
	}
	return &tier, nil
}

// GetTierByID returns a tier by its ID.
func (r *ProgressionRepository) GetTierByID(ctx context.Context, tierID int) (*models.RankTier, error) {
	var tier models.RankTier
	if err := r.db.WithContext(ctx).First(&tier, tierID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, fmt.Errorf("get tier by id: %w", err)
	}
	return &tier, nil
}

// GetNextTier returns the next tier after the given sort_order.
func (r *ProgressionRepository) GetNextTier(ctx context.Context, currentSortOrder int) (*models.RankTier, error) {
	var tier models.RankTier
	err := r.db.WithContext(ctx).
		Where("sort_order > ?", currentSortOrder).
		Order("sort_order ASC").
		First(&tier).Error
	if err == gorm.ErrRecordNotFound {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("get next tier: %w", err)
	}
	return &tier, nil
}

// ── Player Progression ─────────────────────────────────

// GetOrCreateProgression fetches or creates a progression row for a player.
func (r *ProgressionRepository) GetOrCreateProgression(ctx context.Context, playerID int) (*models.PlayerProgression, error) {
	var prog models.PlayerProgression
	err := r.db.WithContext(ctx).Where("player_id = ?", playerID).First(&prog).Error
	if err == nil {
		return &prog, nil
	}
	if err != gorm.ErrRecordNotFound {
		return nil, fmt.Errorf("get progression: %w", err)
	}

	// Create new progression row
	prog = models.PlayerProgression{
		PlayerID:       playerID,
		UnlockedTitles: json.RawMessage(`["RECRUIT"]`),
		UnlockedThemes: json.RawMessage(`["magma"]`),
	}

	// Assign the first tier (Bronze)
	var firstTier models.RankTier
	if err := r.db.WithContext(ctx).Order("sort_order ASC").First(&firstTier).Error; err == nil {
		prog.CurrentTierID = &firstTier.ID
		prog.HighestTierID = &firstTier.ID
	}

	if err := r.db.WithContext(ctx).Create(&prog).Error; err != nil {
		return nil, fmt.Errorf("create progression: %w", err)
	}
	return &prog, nil
}

// UpdateTier updates the player's current and highest tier.
func (r *ProgressionRepository) UpdateTier(ctx context.Context, playerID, newTierID int) error {
	now := time.Now()
	updates := map[string]interface{}{
		"current_tier_id":    newTierID,
		"last_tier_change_at": now,
		"updated_at":         now,
	}

	return r.db.WithContext(ctx).Model(&models.PlayerProgression{}).
		Where("player_id = ?", playerID).
		Updates(updates).Error
}

// UpdateHighestTier updates the highest tier if the new one is higher.
func (r *ProgressionRepository) UpdateHighestTier(ctx context.Context, playerID, newTierID int) error {
	return r.db.WithContext(ctx).Exec(`
		UPDATE player_progression
		SET highest_tier_id = $1, updated_at = NOW()
		WHERE player_id = $2
		  AND (highest_tier_id IS NULL OR highest_tier_id < $1)
	`, newTierID, playerID).Error
}

// UnlockTitle adds a title to the player's unlocked_titles if not already present.
func (r *ProgressionRepository) UnlockTitle(ctx context.Context, playerID int, titleName string) error {
	var prog models.PlayerProgression
	if err := r.db.WithContext(ctx).Where("player_id = ?", playerID).First(&prog).Error; err != nil {
		return fmt.Errorf("get progression for unlock: %w", err)
	}

	var titles []string
	json.Unmarshal(prog.UnlockedTitles, &titles)

	// Check if already unlocked
	for _, t := range titles {
		if t == titleName {
			return nil // already unlocked
		}
	}

	titles = append(titles, titleName)
	data, _ := json.Marshal(titles)
	return r.db.WithContext(ctx).Model(&models.PlayerProgression{}).
		Where("player_id = ?", playerID).
		Update("unlocked_titles", data).Error
}

// UnlockTheme adds a theme to the player's unlocked_themes if not already present.
func (r *ProgressionRepository) UnlockTheme(ctx context.Context, playerID int, themeKey string) error {
	var prog models.PlayerProgression
	if err := r.db.WithContext(ctx).Where("player_id = ?", playerID).First(&prog).Error; err != nil {
		return fmt.Errorf("get progression for unlock: %w", err)
	}

	var themes []string
	json.Unmarshal(prog.UnlockedThemes, &themes)

	for _, t := range themes {
		if t == themeKey {
			return nil
		}
	}

	themes = append(themes, themeKey)
	data, _ := json.Marshal(themes)
	return r.db.WithContext(ctx).Model(&models.PlayerProgression{}).
		Where("player_id = ?", playerID).
		Update("unlocked_themes", data).Error
}


