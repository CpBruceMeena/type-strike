package repository

import (
	"context"
	"fmt"
	"time"

	"github.com/cpbrucemeena/type-strike-backend/internal/models"
	"gorm.io/gorm"
)

// AchievementRepository handles database operations for the achievements system.
type AchievementRepository struct {
	db *gorm.DB
}

// NewAchievementRepository creates a new AchievementRepository.
func NewAchievementRepository(db *gorm.DB) *AchievementRepository {
	return &AchievementRepository{db: db}
}

// ── Achievement Definitions ────────────────────────────

// GetAllAchievements returns all achievement definitions ordered by sort_order.
func (r *AchievementRepository) GetAllAchievements(ctx context.Context) ([]models.Achievement, error) {
	var achievements []models.Achievement
	if err := r.db.WithContext(ctx).Order("sort_order ASC").Find(&achievements).Error; err != nil {
		return nil, fmt.Errorf("get all achievements: %w", err)
	}
	return achievements, nil
}

// GetAchievementByKey returns a single achievement definition by its key.
func (r *AchievementRepository) GetAchievementByKey(ctx context.Context, key string) (*models.Achievement, error) {
	var a models.Achievement
	if err := r.db.WithContext(ctx).Where("key = ?", key).First(&a).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, fmt.Errorf("get achievement by key: %w", err)
	}
	return &a, nil
}

// ── Player Achievement Progress ────────────────────────

// GetOrCreatePlayerAchievement fetches or creates a player_achievement row.
func (r *AchievementRepository) GetOrCreatePlayerAchievement(ctx context.Context, playerID, achievementID int) (*models.PlayerAchievement, error) {
	var pa models.PlayerAchievement
	err := r.db.WithContext(ctx).
		Where("player_id = ? AND achievement_id = ?", playerID, achievementID).
		First(&pa).Error
	if err == nil {
		return &pa, nil
	}
	if err != gorm.ErrRecordNotFound {
		return nil, fmt.Errorf("get player achievement: %w", err)
	}

	// Get achievement def for max_progress
	ach, err := r.GetAchievementByID(ctx, achievementID)
	if err != nil || ach == nil {
		return nil, fmt.Errorf("get achievement def: %w", err)
	}

	pa = models.PlayerAchievement{
		PlayerID:      playerID,
		AchievementID: achievementID,
		Progress:      0,
		MaxProgress:   ach.MaxProgress,
		Unlocked:      false,
	}
	if err := r.db.WithContext(ctx).Create(&pa).Error; err != nil {
		return nil, fmt.Errorf("create player achievement: %w", err)
	}
	return &pa, nil
}

// GetAchievementByID returns an achievement definition by ID.
func (r *AchievementRepository) GetAchievementByID(ctx context.Context, id int) (*models.Achievement, error) {
	var a models.Achievement
	if err := r.db.WithContext(ctx).First(&a, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, fmt.Errorf("get achievement by id: %w", err)
	}
	return &a, nil
}

// UpdateProgress increments progress for a specific player achievement.
// Returns whether the achievement was freshly unlocked by this update.
func (r *AchievementRepository) UpdateProgress(ctx context.Context, playerID, achievementID int, increment int) (bool, error) {
	var pa models.PlayerAchievement
	err := r.db.WithContext(ctx).
		Where("player_id = ? AND achievement_id = ?", playerID, achievementID).
		First(&pa).Error
	if err == gorm.ErrRecordNotFound {
		// Create it first
		created, err := r.GetOrCreatePlayerAchievement(ctx, playerID, achievementID)
		if err != nil {
			return false, err
		}
		pa = *created
	} else if err != nil {
		return false, fmt.Errorf("get player achievement for update: %w", err)
	}

	// Already unlocked — no need to update
	if pa.Unlocked {
		return false, nil
	}

	newProgress := pa.Progress + increment
	if newProgress > pa.MaxProgress {
		newProgress = pa.MaxProgress
	}

	justUnlocked := false
	now := time.Now()

	if newProgress >= pa.MaxProgress {
		// Achievement unlocked!
		justUnlocked = true
		if err := r.db.WithContext(ctx).Model(&models.PlayerAchievement{}).
			Where("player_id = ? AND achievement_id = ?", playerID, achievementID).
			Updates(map[string]interface{}{
				"progress":    pa.MaxProgress,
				"unlocked":    true,
				"unlocked_at": now,
				"updated_at":  now,
			}).Error; err != nil {
			return false, fmt.Errorf("unlock achievement: %w", err)
		}
	} else {
		if err := r.db.WithContext(ctx).Model(&models.PlayerAchievement{}).
			Where("player_id = ? AND achievement_id = ?", playerID, achievementID).
			Updates(map[string]interface{}{
				"progress":   newProgress,
				"updated_at": now,
			}).Error; err != nil {
			return false, fmt.Errorf("update achievement progress: %w", err)
		}
	}

	return justUnlocked, nil
}

// SetProgress sets absolute progress for an achievement (used for single-shot achievements like speed milestones).
// Returns whether the achievement was freshly unlocked.
func (r *AchievementRepository) SetProgress(ctx context.Context, playerID, achievementID int, value int) (bool, error) {
	var pa models.PlayerAchievement
	err := r.db.WithContext(ctx).
		Where("player_id = ? AND achievement_id = ?", playerID, achievementID).
		First(&pa).Error
	if err == gorm.ErrRecordNotFound {
		created, err := r.GetOrCreatePlayerAchievement(ctx, playerID, achievementID)
		if err != nil {
			return false, err
		}
		pa = *created
	} else if err != nil {
		return false, fmt.Errorf("get player achievement for set: %w", err)
	}

	if pa.Unlocked {
		return false, nil
	}

	justUnlocked := false
	now := time.Now()

	if value >= pa.MaxProgress {
		justUnlocked = true
		if err := r.db.WithContext(ctx).Model(&models.PlayerAchievement{}).
			Where("player_id = ? AND achievement_id = ?", playerID, achievementID).
			Updates(map[string]interface{}{
				"progress":    pa.MaxProgress,
				"unlocked":    true,
				"unlocked_at": now,
				"updated_at":  now,
			}).Error; err != nil {
			return false, fmt.Errorf("unlock achievement (set): %w", err)
		}
	} else if value > pa.Progress {
		if err := r.db.WithContext(ctx).Model(&models.PlayerAchievement{}).
			Where("player_id = ? AND achievement_id = ?", playerID, achievementID).
			Updates(map[string]interface{}{
				"progress":   value,
				"updated_at": now,
			}).Error; err != nil {
			return false, fmt.Errorf("set achievement progress: %w", err)
		}
	}

	return justUnlocked, nil
}

// ── Query ──────────────────────────────────────────────

// GetAllPlayerAchievements returns all achievements with the player's progress.
func (r *AchievementRepository) GetAllPlayerAchievements(ctx context.Context, playerID int) (*models.AllAchievementsResponse, error) {
	// Get all achievement definitions
	allAchievements, err := r.GetAllAchievements(ctx)
	if err != nil {
		return nil, err
	}

	// Get all player achievement progress rows
	var playerAchievements []models.PlayerAchievement
	r.db.WithContext(ctx).Where("player_id = ?", playerID).Find(&playerAchievements)

	// Build a lookup map
	paMap := make(map[int]*models.PlayerAchievement)
	for i, pa := range playerAchievements {
		paMap[pa.AchievementID] = &playerAchievements[i]
	}

	// Build response
	responses := make([]models.PlayerAchievementResponse, 0, len(allAchievements))
	unlockedCount := 0

	for _, ach := range allAchievements {
		resp := models.PlayerAchievementResponse{
			AchievementID: ach.ID,
			Key:           ach.Key,
			Name:          ach.Name,
			Description:   ach.Description,
			Icon:          ach.Icon,
			Category:      ach.Category,
			MaxProgress:   ach.MaxProgress,
			Progress:      0,
			Unlocked:      false,
		}

		if pa, ok := paMap[ach.ID]; ok {
			resp.Progress = pa.Progress
			resp.Unlocked = pa.Unlocked
			resp.UnlockedAt = pa.UnlockedAt
			if pa.Unlocked {
				unlockedCount++
			}
		}

		responses = append(responses, resp)
	}

	if responses == nil {
		responses = []models.PlayerAchievementResponse{}
	}

	return &models.AllAchievementsResponse{
		Achievements:   responses,
		UnlockedCount:  unlockedCount,
		TotalCount:     len(allAchievements),
	}, nil
}

// GetTotalAchievementCount returns the total number of achievement definitions.
func (r *AchievementRepository) GetTotalAchievementCount(ctx context.Context) (int, error) {
	var count int64
	if err := r.db.WithContext(ctx).Model(&models.Achievement{}).Count(&count).Error; err != nil {
		return 0, fmt.Errorf("get total achievement count: %w", err)
	}
	return int(count), nil
}

// GetUnlockedCount returns the number of achievements a player has unlocked.
func (r *AchievementRepository) GetUnlockedCount(ctx context.Context, playerID int) (int, error) {
	var count int64
	if err := r.db.WithContext(ctx).Model(&models.PlayerAchievement{}).
		Where("player_id = ? AND unlocked = true", playerID).
		Count(&count).Error; err != nil {
		return 0, fmt.Errorf("get unlocked count: %w", err)
	}
	return int(count), nil
}

// GetFreshlyUnlocked returns achievements that were unlocked in a given time window.
// Used to detect what was just unlocked after a game event.
func (r *AchievementRepository) GetFreshlyUnlocked(ctx context.Context, playerID int, since time.Time) ([]models.AchievementUnlockEvent, error) {
	var results []models.PlayerAchievement
	err := r.db.WithContext(ctx).
		Preload("Achievement").
		Where("player_id = ? AND unlocked = true AND unlocked_at >= ?", playerID, since).
		Find(&results).Error
	if err != nil {
		return nil, fmt.Errorf("get freshly unlocked: %w", err)
	}

	events := make([]models.AchievementUnlockEvent, 0, len(results))
	for _, pa := range results {
		if pa.Achievement != nil {
			events = append(events, models.AchievementUnlockEvent{
				AchievementKey:  pa.Achievement.Key,
				AchievementName: pa.Achievement.Name,
				Description:     pa.Achievement.Description,
				Icon:            pa.Achievement.Icon,
				Category:        pa.Achievement.Category,
			})
		}
	}
	return events, nil
}

