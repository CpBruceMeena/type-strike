package repository

import (
	"context"
	"fmt"
	"time"

	"github.com/cpbrucemeena/type-strike-backend/internal/models"
	"gorm.io/gorm"
)

// LessonProgressRepository handles database operations for lesson progress.
type LessonProgressRepository struct {
	db *gorm.DB
}

// NewLessonProgressRepository creates a new LessonProgressRepository.
func NewLessonProgressRepository(db *gorm.DB) *LessonProgressRepository {
	return &LessonProgressRepository{db: db}
}

// GetByPlayerAndLesson retrieves progress for a specific player on a specific lesson.
func (r *LessonProgressRepository) GetByPlayerAndLesson(ctx context.Context, playerID, lessonID int) (*models.LessonProgress, error) {
	var lp models.LessonProgress
	err := r.db.WithContext(ctx).Where("player_id = ? AND lesson_id = ?", playerID, lessonID).First(&lp).Error
	if err == gorm.ErrRecordNotFound {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("get lesson progress: %w", err)
	}
	return &lp, nil
}

// GetAllForPlayer retrieves all lesson progress for a player.
func (r *LessonProgressRepository) GetAllForPlayer(ctx context.Context, playerID int) ([]models.LessonProgress, error) {
	var results []models.LessonProgress
	err := r.db.WithContext(ctx).Where("player_id = ?", playerID).Order("lesson_id ASC").Find(&results).Error
	if err != nil {
		return nil, fmt.Errorf("get all lesson progress: %w", err)
	}
	return results, nil
}

// Upsert records or updates lesson progress after a play attempt.
func (r *LessonProgressRepository) Upsert(ctx context.Context, playerID, lessonID int, req models.UpdateLessonProgressRequest) (*models.LessonProgress, error) {
	existing, err := r.GetByPlayerAndLesson(ctx, playerID, lessonID)
	if err != nil {
		return nil, err
	}

	bestWPM := req.WPM
	bestAccuracy := req.Accuracy
	completed := req.Completed
	attempts := 1
	var completedAt *time.Time

	if existing != nil {
		attempts = existing.Attempts + 1
		if req.WPM <= existing.BestWPM {
			bestWPM = existing.BestWPM
		}
		if req.Accuracy <= existing.BestAccuracy {
			bestAccuracy = existing.BestAccuracy
		}
		completed = existing.Completed || req.Completed
	}

	if completed {
		now := time.Now()
		completedAt = &now
	}

	rawSQL := `
		INSERT INTO lesson_progress (player_id, lesson_id, best_wpm, best_accuracy, completed, attempts, completed_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
		ON CONFLICT (player_id, lesson_id)
		DO UPDATE SET
			best_wpm = GREATEST(lesson_progress.best_wpm, EXCLUDED.best_wpm),
			best_accuracy = GREATEST(lesson_progress.best_accuracy, EXCLUDED.best_accuracy),
			completed = lesson_progress.completed OR EXCLUDED.completed,
			attempts = lesson_progress.attempts + 1,
			completed_at = CASE WHEN EXCLUDED.completed AND lesson_progress.completed_at IS NULL THEN NOW() ELSE lesson_progress.completed_at END,
			updated_at = NOW()
		RETURNING id, player_id, lesson_id, best_wpm, best_accuracy, completed, attempts, completed_at, created_at, updated_at
	`
	var result models.LessonProgress
	err = r.db.WithContext(ctx).Raw(rawSQL,
		playerID, lessonID, bestWPM, bestAccuracy, completed, attempts, completedAt,
	).Scan(&result).Error
	if err != nil {
		return nil, fmt.Errorf("upsert lesson progress: %w", err)
	}
	return &result, nil
}

// GetCompletedCount returns the number of lessons the player has completed.
func (r *LessonProgressRepository) GetCompletedCount(ctx context.Context, playerID int) (int, error) {
	var count int64
	err := r.db.WithContext(ctx).Model(&models.LessonProgress{}).
		Where("player_id = ? AND completed = true", playerID).
		Count(&count).Error
	if err != nil {
		return 0, fmt.Errorf("get completed lesson count: %w", err)
	}
	return int(count), nil
}
