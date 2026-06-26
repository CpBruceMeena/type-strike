package repository

import (
	"context"
	"fmt"

	"github.com/cpbrucemeena/type-strike-backend/internal/models"
	"gorm.io/gorm"
)

// ActivityRepository handles database operations for the activity feed.
type ActivityRepository struct {
	db *gorm.DB
}

// NewActivityRepository creates a new ActivityRepository.
func NewActivityRepository(db *gorm.DB) *ActivityRepository {
	return &ActivityRepository{db: db}
}

// Record inserts a new activity event.
func (r *ActivityRepository) Record(ctx context.Context, req models.RecordActivityRequest) (*models.Activity, error) {
	if req.Metadata == nil {
		req.Metadata = []byte("{}")
	}

	a := models.Activity{
		PlayerID: req.PlayerID,
		Type:     req.Type,
		Metadata: req.Metadata,
	}

	if err := r.db.WithContext(ctx).Create(&a).Error; err != nil {
		return nil, fmt.Errorf("insert activity: %w", err)
	}
	return &a, nil
}

// GetRecent retrieves the most recent activity events for a player.
func (r *ActivityRepository) GetRecent(ctx context.Context, playerID, limit int) ([]models.Activity, error) {
	if limit <= 0 || limit > 50 {
		limit = 20
	}

	var results []models.Activity
	err := r.db.WithContext(ctx).Where("player_id = ?", playerID).
		Order("timestamp DESC").
		Limit(limit).
		Find(&results).Error
	if err != nil {
		return nil, fmt.Errorf("get recent activity: %w", err)
	}
	return results, nil
}
