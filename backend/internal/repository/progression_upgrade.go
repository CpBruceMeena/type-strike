package repository

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/cpbrucemeena/type-strike-backend/internal/models"
)

// ── Check & Process Tier Upgrade ───────────────────────

// CheckAndProcessUpgrade checks if a player's XP qualifies them for a new tier,
// and if so, upgrades them, unlocking associated titles and themes.
// Returns whether an upgrade occurred and any new unlocks.
func (r *ProgressionRepository) CheckAndProcessUpgrade(ctx context.Context, playerID int) (*models.TierUpgradeResponse, error) {
	player, err := r.GetPlayerXP(ctx, playerID)
	if err != nil || player == nil {
		return &models.TierUpgradeResponse{Upgraded: false}, fmt.Errorf("get player xp: %w", err)
	}

	prog, err := r.GetOrCreateProgression(ctx, playerID)
	if err != nil {
		return &models.TierUpgradeResponse{Upgraded: false}, err
	}

	// Determine what tier the player's XP qualifies for
	newTier, err := r.GetTierByXP(ctx, player.XP)
	if err != nil || newTier == nil {
		return &models.TierUpgradeResponse{Upgraded: false}, err
	}

	// If current tier is the same or higher, no upgrade needed
	if prog.CurrentTierID != nil && *prog.CurrentTierID >= newTier.ID {
		return &models.TierUpgradeResponse{Upgraded: false}, nil
	}

	// Get previous tier info
	var previousTier *models.RankTier
	if prog.CurrentTierID != nil {
		prev, err := r.GetTierByID(ctx, *prog.CurrentTierID)
		if err == nil {
			previousTier = prev
		}
	}

	// Update current tier
	if err := r.UpdateTier(ctx, playerID, newTier.ID); err != nil {
		return &models.TierUpgradeResponse{Upgraded: false}, err
	}

	// Update highest tier
	if err := r.UpdateHighestTier(ctx, playerID, newTier.ID); err != nil {
		return &models.TierUpgradeResponse{Upgraded: false}, err
	}

	// Unlock titles and themes for the new tier
	var newUnlocks []string

	var titles []models.Title
	r.db.WithContext(ctx).Where("tier_id = ?", newTier.ID).Find(&titles)
	for _, t := range titles {
		if err := r.UnlockTitle(ctx, playerID, t.Name); err == nil {
			newUnlocks = append(newUnlocks, t.Name)
		}
	}

	var themes []models.ThemeUnlock
	r.db.WithContext(ctx).Where("tier_id = ?", newTier.ID).Find(&themes)
	for _, th := range themes {
		if err := r.UnlockTheme(ctx, playerID, th.ThemeKey); err == nil {
			newUnlocks = append(newUnlocks, th.ThemeKey)
		}
	}

	return &models.TierUpgradeResponse{
		Upgraded:     true,
		PreviousTier: previousTier,
		NewTier:      newTier,
		NewUnlocks:   newUnlocks,
	}, nil
}

// GetProgression returns the full progression state for a player.
func (r *ProgressionRepository) GetProgression(ctx context.Context, playerID int) (*models.ProgressionResponse, error) {
	prog, err := r.GetOrCreateProgression(ctx, playerID)
	if err != nil {
		return nil, err
	}

	allTiers, err := r.GetAllTiers(ctx)
	if err != nil {
		return nil, err
	}

	var currentTier, highestTier *models.RankTier
	if prog.CurrentTierID != nil {
		currentTier, _ = r.GetTierByID(ctx, *prog.CurrentTierID)
	}
	if prog.HighestTierID != nil {
		highestTier, _ = r.GetTierByID(ctx, *prog.HighestTierID)
	}

	player, err := r.GetPlayerXP(ctx, playerID)
	if err != nil {
		return nil, err
	}

	// Parse unlocked arrays
	var unlockedTitles, unlockedThemes []string
	json.Unmarshal(prog.UnlockedTitles, &unlockedTitles)
	json.Unmarshal(prog.UnlockedThemes, &unlockedThemes)

	// Get current title and theme
	currentTitle := "RECRUIT"
	if len(unlockedTitles) > 0 {
		currentTitle = unlockedTitles[len(unlockedTitles)-1]
	}
	currentTheme := "magma"
	if len(unlockedThemes) > 0 {
		currentTheme = unlockedThemes[len(unlockedThemes)-1]
	}

	// Get next tier
	var nextTier *models.RankTier
	var xpToNext int
	if currentTier != nil {
		next, err := r.GetNextTier(ctx, currentTier.SortOrder)
		if err == nil && next != nil {
			nextTier = next
			xpToNext = next.MinXP - player.XP
			if xpToNext < 0 {
				xpToNext = 0
			}
		}
	}

	return &models.ProgressionResponse{
		CurrentTier:    currentTier,
		HighestTier:    highestTier,
		AllTiers:       allTiers,
		UnlockedTitles: unlockedTitles,
		UnlockedThemes: unlockedThemes,
		TotalXPEarned:  prog.TotalXPEarned,
		XP:             player.XP,
		NextTier:       nextTier,
		XpToNextTier:   xpToNext,
		CurrentTitle:   currentTitle,
		CurrentTheme:   currentTheme,
	}, nil
}

// GetPlayerXP is a helper to get a player's current XP.
func (r *ProgressionRepository) GetPlayerXP(ctx context.Context, playerID int) (*models.Player, error) {
	var p models.Player
	if err := r.db.WithContext(ctx).Select("id", "xp", "level").First(&p, playerID).Error; err != nil {
		return nil, fmt.Errorf("get player xp: %w", err)
	}
	return &p, nil
}

// UpdateTotalXPEarned updates the total_xp_earned counter for a player.
func (r *ProgressionRepository) UpdateTotalXPEarned(ctx context.Context, playerID, xpAmount int) error {
	return r.db.WithContext(ctx).Exec(`
		UPDATE player_progression
		SET total_xp_earned = total_xp_earned + $1, updated_at = NOW()
		WHERE player_id = $2
	`, xpAmount, playerID).Error
}

// GetAllTiersWithDetails returns all tiers with their associated titles and themes.
func (r *ProgressionRepository) GetAllTiersWithDetails(ctx context.Context) (*models.AllTiersDetailResponse, error) {
	tiers, err := r.GetAllTiers(ctx)
	if err != nil {
		return nil, err
	}

	var allTitles []models.Title
	r.db.WithContext(ctx).Order("sort_order ASC").Find(&allTitles)

	var allThemes []models.ThemeUnlock
	r.db.WithContext(ctx).Order("sort_order ASC").Find(&allThemes)

	tierDetails := make([]models.TierDetailResponse, 0, len(tiers))
	for _, tier := range tiers {
		// Filter titles for this tier
		var tierTitles []models.Title
		for _, t := range allTitles {
			if t.TierID != nil && *t.TierID == tier.ID {
				tierTitles = append(tierTitles, t)
			}
		}

		// Filter themes for this tier
		var tierThemes []models.ThemeUnlock
		for _, th := range allThemes {
			if th.TierID != nil && *th.TierID == tier.ID {
				tierThemes = append(tierThemes, th)
			}
		}

		if tierTitles == nil {
			tierTitles = []models.Title{}
		}
		if tierThemes == nil {
			tierThemes = []models.ThemeUnlock{}
		}

		tierDetails = append(tierDetails, models.TierDetailResponse{
			Tier:   tier,
			Titles: tierTitles,
			Themes: tierThemes,
		})
	}

	return &models.AllTiersDetailResponse{Tiers: tierDetails}, nil
}

