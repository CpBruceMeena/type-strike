package repository

import (
	"context"
	"fmt"

	"github.com/cpbrucemeena/type-strike-backend/internal/models"
	"gorm.io/gorm"
)

// SettingsRepository handles database operations for player settings.
type SettingsRepository struct {
	db *gorm.DB
}

// NewSettingsRepository creates a new SettingsRepository.
func NewSettingsRepository(db *gorm.DB) *SettingsRepository {
	return &SettingsRepository{db: db}
}

// GetAll retrieves all settings for a player as a map.
func (r *SettingsRepository) GetAll(ctx context.Context, playerID int) (map[string]string, error) {
	var settings []models.Setting
	if err := r.db.WithContext(ctx).Where("player_id = ?", playerID).Find(&settings).Error; err != nil {
		return nil, fmt.Errorf("get all settings: %w", err)
	}

	result := make(map[string]string)
	for _, s := range settings {
		result[s.Key] = s.Value
	}
	return result, nil
}

// Get retrieves a single setting value by key.
func (r *SettingsRepository) Get(ctx context.Context, playerID int, key string) (string, error) {
	var s models.Setting
	err := r.db.WithContext(ctx).Where("player_id = ? AND key = ?", playerID, key).First(&s).Error
	if err != nil {
		return "", fmt.Errorf("get setting: %w", err)
	}
	return s.Value, nil
}

// BatchUpdate updates multiple settings for a player in a single transaction.
func (r *SettingsRepository) BatchUpdate(ctx context.Context, playerID int, req models.BatchUpdateSettingsRequest) (map[string]string, error) {
	err := r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		for key, value := range req.Settings {
			rawSQL := `
				INSERT INTO settings (player_id, key, value)
				VALUES ($1, $2, $3)
				ON CONFLICT (player_id, key) DO UPDATE SET value = EXCLUDED.value
			`
			if err := tx.Exec(rawSQL, playerID, key, value).Error; err != nil {
				return fmt.Errorf("upsert setting %s: %w", key, err)
			}
		}
		return nil
	})
	if err != nil {
		return nil, err
	}

	return r.GetAll(ctx, playerID)
}
