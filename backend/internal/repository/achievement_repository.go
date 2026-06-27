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

// ── Achievements Engine ────────────────────────────────

// CheckAndUnlockSpeedAchievements checks if the player qualifies for speed-based achievements.
func (r *AchievementRepository) CheckAndUnlockSpeedAchievements(ctx context.Context, playerID int, wpm int) []models.AchievementUnlockEvent {
	thresholds := []struct {
		Key string
		WPM int
	}{
		{"speed_50", 50},
		{"speed_75", 75},
		{"speed_100", 100},
		{"speed_120", 120},
		{"speed_150", 150},
	}

	var newUnlocks []models.AchievementUnlockEvent
	for _, t := range thresholds {
		if wpm >= t.WPM {
			ach, err := r.GetAchievementByKey(ctx, t.Key)
			if err != nil || ach == nil {
				continue
			}
			justUnlocked, _ := r.SetProgress(ctx, playerID, ach.ID, 1)
			if justUnlocked {
				newUnlocks = append(newUnlocks, models.AchievementUnlockEvent{
					AchievementKey:  ach.Key,
					AchievementName: ach.Name,
					Description:     ach.Description,
					Icon:            ach.Icon,
					Category:        ach.Category,
				})
			}
		}
	}
	return newUnlocks
}

// CheckAndUnlockAccuracyAchievements checks accuracy-based progressive achievements.
func (r *AchievementRepository) CheckAndUnlockAccuracyAchievements(ctx context.Context, playerID int, accuracy float64) []models.AchievementUnlockEvent {
	var newUnlocks []models.AchievementUnlockEvent

	// Perfect run: 100% accuracy means zero errors
	if accuracy >= 100.0 {
		ach, _ := r.GetAchievementByKey(ctx, "acc_perfect")
		if ach != nil {
			justUnlocked, _ := r.SetProgress(ctx, playerID, ach.ID, 1)
			if justUnlocked {
				newUnlocks = append(newUnlocks, models.AchievementUnlockEvent{
					AchievementKey:  ach.Key,
					AchievementName: ach.Name,
					Description:     ach.Description,
					Icon:            ach.Icon,
					Category:        ach.Category,
				})
			}
		}
	}

	// 95%+ accuracy games
	if accuracy >= 95.0 {
		ach, _ := r.GetAchievementByKey(ctx, "acc_95_x10")
		if ach != nil {
			justUnlocked, _ := r.UpdateProgress(ctx, playerID, ach.ID, 1)
			if justUnlocked {
				newUnlocks = append(newUnlocks, models.AchievementUnlockEvent{
					AchievementKey:  ach.Key,
					AchievementName: ach.Name,
					Description:     ach.Description,
					Icon:            ach.Icon,
					Category:        ach.Category,
				})
			}
		}
	}

	// 98%+ accuracy games
	if accuracy >= 98.0 {
		ach, _ := r.GetAchievementByKey(ctx, "acc_98_x25")
		if ach != nil {
			justUnlocked, _ := r.UpdateProgress(ctx, playerID, ach.ID, 1)
			if justUnlocked {
				newUnlocks = append(newUnlocks, models.AchievementUnlockEvent{
					AchievementKey:  ach.Key,
					AchievementName: ach.Name,
					Description:     ach.Description,
					Icon:            ach.Icon,
					Category:        ach.Category,
				})
			}
		}
	}

	return newUnlocks
}

// CheckAndUnlockComboAchievements checks combo streak achievements.
func (r *AchievementRepository) CheckAndUnlockComboAchievements(ctx context.Context, playerID int, maxCombo int) []models.AchievementUnlockEvent {
	thresholds := []struct {
		Key   string
		Combo int
	}{
		{"combo_10", 10},
		{"combo_25", 25},
		{"combo_50", 50},
		{"combo_100", 100},
	}

	var newUnlocks []models.AchievementUnlockEvent
	for _, t := range thresholds {
		if maxCombo >= t.Combo {
			ach, err := r.GetAchievementByKey(ctx, t.Key)
			if err != nil || ach == nil {
				continue
			}
			justUnlocked, _ := r.SetProgress(ctx, playerID, ach.ID, 1)
			if justUnlocked {
				newUnlocks = append(newUnlocks, models.AchievementUnlockEvent{
					AchievementKey:  ach.Key,
					AchievementName: ach.Name,
					Description:     ach.Description,
					Icon:            ach.Icon,
					Category:        ach.Category,
				})
			}
		}
	}
	return newUnlocks
}

// CheckAndUnlockLevelAchievements checks level progression achievements.
func (r *AchievementRepository) CheckAndUnlockLevelAchievements(ctx context.Context, playerID int, levelsCleared int) []models.AchievementUnlockEvent {
	thresholds := []struct {
		Key    string
		Levels int
	}{
		{"levels_10", 10},
		{"levels_25", 25},
		{"levels_50", 50},
		{"levels_75", 75},
		{"levels_100", 100},
	}

	var newUnlocks []models.AchievementUnlockEvent
	for _, t := range thresholds {
		if levelsCleared >= t.Levels {
			ach, err := r.GetAchievementByKey(ctx, t.Key)
			if err != nil || ach == nil {
				continue
			}
			justUnlocked, _ := r.SetProgress(ctx, playerID, ach.ID, 1)
			if justUnlocked {
				newUnlocks = append(newUnlocks, models.AchievementUnlockEvent{
					AchievementKey:  ach.Key,
					AchievementName: ach.Name,
					Description:     ach.Description,
					Icon:            ach.Icon,
					Category:        ach.Category,
				})
			}
		}
	}
	return newUnlocks
}

// CheckAndUnlockStreakAchievements checks streak-based achievements.
func (r *AchievementRepository) CheckAndUnlockStreakAchievements(ctx context.Context, playerID int, streakCount int) []models.AchievementUnlockEvent {
	thresholds := []struct {
		Key    string
		Streak int
	}{
		{"streak_3", 3},
		{"streak_7", 7},
		{"streak_14", 14},
		{"streak_30", 30},
	}

	var newUnlocks []models.AchievementUnlockEvent
	for _, t := range thresholds {
		if streakCount >= t.Streak {
			ach, err := r.GetAchievementByKey(ctx, t.Key)
			if err != nil || ach == nil {
				continue
			}
			justUnlocked, _ := r.SetProgress(ctx, playerID, ach.ID, 1)
			if justUnlocked {
				newUnlocks = append(newUnlocks, models.AchievementUnlockEvent{
					AchievementKey:  ach.Key,
					AchievementName: ach.Name,
					Description:     ach.Description,
					Icon:            ach.Icon,
					Category:        ach.Category,
				})
			}
		}
	}
	return newUnlocks
}

// CheckAndUnlockSocialAchievements checks contest-related achievements.
func (r *AchievementRepository) CheckAndUnlockSocialAchievements(ctx context.Context, playerID int, contestRank int) []models.AchievementUnlockEvent {
	var newUnlocks []models.AchievementUnlockEvent

	// Contest entry (any rank)
	ach, _ := r.GetAchievementByKey(ctx, "contest_entry")
	if ach != nil {
		justUnlocked, _ := r.SetProgress(ctx, playerID, ach.ID, 1)
		if justUnlocked {
			newUnlocks = append(newUnlocks, models.AchievementUnlockEvent{
				AchievementKey:  ach.Key,
				AchievementName: ach.Name,
				Description:     ach.Description,
				Icon:            ach.Icon,
				Category:        ach.Category,
			})
		}
	}

	// Top 10
	if contestRank <= 10 {
		ach, _ := r.GetAchievementByKey(ctx, "contest_top10")
		if ach != nil {
			justUnlocked, _ := r.SetProgress(ctx, playerID, ach.ID, 1)
			if justUnlocked {
				newUnlocks = append(newUnlocks, models.AchievementUnlockEvent{
					AchievementKey:  ach.Key,
					AchievementName: ach.Name,
					Description:     ach.Description,
					Icon:            ach.Icon,
					Category:        ach.Category,
				})
			}
		}
	}

	// Top 3
	if contestRank <= 3 {
		ach, _ := r.GetAchievementByKey(ctx, "contest_top3")
		if ach != nil {
			justUnlocked, _ := r.SetProgress(ctx, playerID, ach.ID, 1)
			if justUnlocked {
				newUnlocks = append(newUnlocks, models.AchievementUnlockEvent{
					AchievementKey:  ach.Key,
					AchievementName: ach.Name,
					Description:     ach.Description,
					Icon:            ach.Icon,
					Category:        ach.Category,
				})
			}
		}
	}

	return newUnlocks
}

// CheckAllAchievements runs all achievement checks for a given game event context.
// This is the main entry point called after game/level completion.
func (r *AchievementRepository) CheckAllAchievements(ctx context.Context, playerID int, params AchievementCheckParams) *models.CheckAchievementsResult {
	var allNewUnlocks []models.AchievementUnlockEvent

	// Speed achievements
	if params.WPM > 0 {
		unlocks := r.CheckAndUnlockSpeedAchievements(ctx, playerID, params.WPM)
		allNewUnlocks = append(allNewUnlocks, unlocks...)
	}

	// Accuracy achievements
	if params.Accuracy > 0 {
		unlocks := r.CheckAndUnlockAccuracyAchievements(ctx, playerID, params.Accuracy)
		allNewUnlocks = append(allNewUnlocks, unlocks...)
	}

	// Combo achievements
	if params.MaxCombo > 0 {
		unlocks := r.CheckAndUnlockComboAchievements(ctx, playerID, params.MaxCombo)
		allNewUnlocks = append(allNewUnlocks, unlocks...)
	}

	// Level progression achievements
	if params.LevelsCleared > 0 {
		unlocks := r.CheckAndUnlockLevelAchievements(ctx, playerID, params.LevelsCleared)
		allNewUnlocks = append(allNewUnlocks, unlocks...)
	}

	// Streak achievements
	if params.StreakCount > 0 {
		unlocks := r.CheckAndUnlockStreakAchievements(ctx, playerID, params.StreakCount)
		allNewUnlocks = append(allNewUnlocks, unlocks...)
	}

	// Social achievements (contest rank)
	if params.ContestRank > 0 {
		unlocks := r.CheckAndUnlockSocialAchievements(ctx, playerID, params.ContestRank)
		allNewUnlocks = append(allNewUnlocks, unlocks...)
	}

	return &models.CheckAchievementsResult{
		NewUnlocks: allNewUnlocks,
	}
}

// AchievementCheckParams bundles all relevant data for a single achievement check run.
type AchievementCheckParams struct {
	WPM           int
	Accuracy      float64
	MaxCombo      int
	LevelsCleared int
	StreakCount   int
	ContestRank   int
}
