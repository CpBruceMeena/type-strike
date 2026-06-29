package repository

import (
	"context"
	"fmt"

	"github.com/cpbrucemeena/type-strike-backend/internal/models"
	"gorm.io/gorm"
)

// LevelRepository handles database operations for level configurations.
type LevelRepository struct {
	db *gorm.DB
}

// NewLevelRepository creates a new LevelRepository.
func NewLevelRepository(db *gorm.DB) *LevelRepository {
	return &LevelRepository{db: db}
}

// GetAll retrieves all level configs ordered by ID.
func (r *LevelRepository) GetAll(ctx context.Context) ([]models.Level, error) {
	var levels []models.Level
	if err := r.db.WithContext(ctx).Order("id ASC").Find(&levels).Error; err != nil {
		return nil, fmt.Errorf("get all levels: %w", err)
	}
	return levels, nil
}

// GetByID retrieves a single level by its ID.
func (r *LevelRepository) GetByID(ctx context.Context, levelID int) (*models.Level, error) {
	var level models.Level
	err := r.db.WithContext(ctx).First(&level, levelID).Error
	if err == gorm.ErrRecordNotFound {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("get level by id: %w", err)
	}
	return &level, nil
}

// GetByTier retrieves all levels for a given tier ordered by ID.
func (r *LevelRepository) GetByTier(ctx context.Context, tier string) ([]models.Level, error) {
	var levels []models.Level
	if err := r.db.WithContext(ctx).Where("tier = ?", tier).Order("id ASC").Find(&levels).Error; err != nil {
		return nil, fmt.Errorf("get levels by tier: %w", err)
	}
	return levels, nil
}

// BulkInsert inserts or updates level configs in a single transaction.
// Uses ON CONFLICT to upsert so existing rows are updated.
func (r *LevelRepository) BulkInsert(ctx context.Context, levels []models.Level) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		for _, l := range levels {
			err := tx.Where("id = ?", l.ID).Assign(models.Level{
				Name:         l.Name,
				Tier:         l.Tier,
				Difficulty:   l.Difficulty,
				PassWPM:      l.PassWPM,
				PassAccuracy: l.PassAccuracy,
				Paragraph:    l.Paragraph,
			}).FirstOrCreate(&l).Error
			if err != nil {
				return fmt.Errorf("upsert level %d: %w", l.ID, err)
			}
		}
		return nil
	})
}

// Count returns the total number of levels in the database.
func (r *LevelRepository) Count(ctx context.Context) (int, error) {
	var count int64
	if err := r.db.WithContext(ctx).Model(&models.Level{}).Count(&count).Error; err != nil {
		return 0, fmt.Errorf("count levels: %w", err)
	}
	return int(count), nil
}
