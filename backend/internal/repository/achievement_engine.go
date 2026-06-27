package repository

import (
	"context"

	"github.com/cpbrucemeena/type-strike-backend/internal/models"
)

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
