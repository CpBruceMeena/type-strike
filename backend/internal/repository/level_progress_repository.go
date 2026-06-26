package repository

import (
	"context"
	"fmt"
	"time"

	"github.com/cpbrucemeena/type-strike-backend/internal/models"
	"gorm.io/gorm"
)

// LevelProgressRepository handles database operations for level progress.
type LevelProgressRepository struct {
	db *gorm.DB
}

// NewLevelProgressRepository creates a new LevelProgressRepository.
func NewLevelProgressRepository(db *gorm.DB) *LevelProgressRepository {
	return &LevelProgressRepository{db: db}
}

// GetByPlayerAndLevel retrieves progress for a specific player on a specific level.
func (r *LevelProgressRepository) GetByPlayerAndLevel(ctx context.Context, playerID, levelID int) (*models.LevelProgress, error) {
	var lp models.LevelProgress
	err := r.db.WithContext(ctx).Where("player_id = ? AND level_id = ?", playerID, levelID).First(&lp).Error
	if err == gorm.ErrRecordNotFound {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("get level progress: %w", err)
	}
	return &lp, nil
}

// GetAllForPlayer retrieves all level progress for a player.
func (r *LevelProgressRepository) GetAllForPlayer(ctx context.Context, playerID int) ([]models.LevelProgress, error) {
	var results []models.LevelProgress
	err := r.db.WithContext(ctx).Where("player_id = ?", playerID).Order("level_id ASC").Find(&results).Error
	if err != nil {
		return nil, fmt.Errorf("get all level progress: %w", err)
	}
	return results, nil
}

// Upsert records or updates level progress after a play attempt.
func (r *LevelProgressRepository) Upsert(ctx context.Context, playerID, levelID int, req models.UpdateLevelProgressRequest) (*models.LevelProgress, error) {
	existing, err := r.GetByPlayerAndLevel(ctx, playerID, levelID)
	if err != nil {
		return nil, err
	}

	stars := req.Stars
	bestWPM := req.WPM
	bestAccuracy := req.Accuracy
	completed := req.Completed
	attempts := 1

	if existing != nil {
		attempts = existing.Attempts + 1
		if req.WPM <= existing.BestWPM {
			bestWPM = existing.BestWPM
		}
		if req.Accuracy <= existing.BestAccuracy {
			bestAccuracy = existing.BestAccuracy
		}
		if req.Stars < existing.Stars {
			stars = existing.Stars
		}
		completed = existing.Completed || req.Completed
	}

	rawSQL := `
		INSERT INTO level_progress (player_id, level_id, stars, best_wpm, best_accuracy, completed, attempts, last_played_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		ON CONFLICT (player_id, level_id)
		DO UPDATE SET
			stars = EXCLUDED.stars,
			best_wpm = EXCLUDED.best_wpm,
			best_accuracy = EXCLUDED.best_accuracy,
			completed = EXCLUDED.completed,
			attempts = EXCLUDED.attempts,
			last_played_at = EXCLUDED.last_played_at
		RETURNING id, player_id, level_id, stars, best_wpm, best_accuracy, completed, attempts, last_played_at
	`
	var result models.LevelProgress
	err = r.db.WithContext(ctx).Raw(rawSQL,
		playerID, levelID, stars, bestWPM, bestAccuracy, completed, attempts, time.Now(),
	).Scan(&result).Error
	if err != nil {
		return nil, fmt.Errorf("upsert level progress: %w", err)
	}
	return &result, nil
}

// GetCompletedCount returns the number of levels the player has completed (1+ star).
func (r *LevelProgressRepository) GetCompletedCount(ctx context.Context, playerID int) (int, error) {
	var count int64
	err := r.db.WithContext(ctx).Model(&models.LevelProgress{}).
		Where("player_id = ? AND completed = true", playerID).
		Count(&count).Error
	if err != nil {
		return 0, fmt.Errorf("get completed count: %w", err)
	}
	return int(count), nil
}

// GetNextUncompletedLevel returns the lowest level_id the player hasn't completed.
func (r *LevelProgressRepository) GetNextUncompletedLevel(ctx context.Context, playerID int) (int, error) {
	var levelID int
	err := r.db.WithContext(ctx).Raw(`
		SELECT COALESCE(
			(SELECT MIN(level_id) + 1 FROM level_progress WHERE player_id = ? AND completed = true),
			1
		)
	`, playerID).Scan(&levelID).Error
	if err != nil {
		return 1, nil
	}
	return levelID, nil
}
