package repository

import (
	"context"
	"fmt"

	"github.com/cpbrucemeena/type-strike-backend/internal/models"
	"github.com/jackc/pgx/v5/pgxpool"
)

// SettingsRepository handles database operations for player settings.
type SettingsRepository struct {
	pool *pgxpool.Pool
}

// NewSettingsRepository creates a new SettingsRepository.
func NewSettingsRepository(pool *pgxpool.Pool) *SettingsRepository {
	return &SettingsRepository{pool: pool}
}

// GetAll retrieves all settings for a player as a map.
func (r *SettingsRepository) GetAll(ctx context.Context, playerID int) (map[string]string, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT key, value FROM settings WHERE player_id = $1`, playerID,
	)
	if err != nil {
		return nil, fmt.Errorf("get all settings: %w", err)
	}
	defer rows.Close()

	settings := make(map[string]string)
	for rows.Next() {
		var key, value string
		if err := rows.Scan(&key, &value); err != nil {
			return nil, fmt.Errorf("scan setting: %w", err)
		}
		settings[key] = value
	}
	return settings, nil
}

// Get retrieves a single setting value by key.
func (r *SettingsRepository) Get(ctx context.Context, playerID int, key string) (string, error) {
	var value string
	err := r.pool.QueryRow(ctx,
		`SELECT value FROM settings WHERE player_id = $1 AND key = $2`,
		playerID, key,
	).Scan(&value)
	if err != nil {
		return "", fmt.Errorf("get setting: %w", err)
	}
	return value, nil
}

// BatchUpdate updates multiple settings for a player in a single transaction.
func (r *SettingsRepository) BatchUpdate(ctx context.Context, playerID int, req models.BatchUpdateSettingsRequest) (map[string]string, error) {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback(ctx)

	for key, value := range req.Settings {
		_, err := tx.Exec(ctx,
			`INSERT INTO settings (player_id, key, value)
			 VALUES ($1, $2, $3)
			 ON CONFLICT (player_id, key) DO UPDATE SET value = EXCLUDED.value`,
			playerID, key, value,
		)
		if err != nil {
			return nil, fmt.Errorf("upsert setting %s: %w", key, err)
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("commit tx: %w", err)
	}

	return r.GetAll(ctx, playerID)
}
