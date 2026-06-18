package repository

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/cpbrucemeena/type-strike-backend/internal/models"
	"github.com/jackc/pgx/v5/pgxpool"
)

// ActivityRepository handles database operations for the activity feed.
type ActivityRepository struct {
	pool *pgxpool.Pool
}

// NewActivityRepository creates a new ActivityRepository.
func NewActivityRepository(pool *pgxpool.Pool) *ActivityRepository {
	return &ActivityRepository{pool: pool}
}

// Record inserts a new activity event.
func (r *ActivityRepository) Record(ctx context.Context, req models.RecordActivityRequest) (*models.Activity, error) {
	metadata := req.Metadata
	if metadata == nil {
		metadata = json.RawMessage("{}")
	}

	var a models.Activity
	err := r.pool.QueryRow(ctx,
		`INSERT INTO activity (player_id, type, metadata)
		 VALUES ($1, $2, $3)
		 RETURNING id, player_id, type, timestamp, metadata`,
		req.PlayerID, req.Type, metadata,
	).Scan(&a.ID, &a.PlayerID, &a.Type, &a.Timestamp, &a.Metadata)
	if err != nil {
		return nil, fmt.Errorf("insert activity: %w", err)
	}
	return &a, nil
}

// GetRecent retrieves the most recent activity events for a player.
func (r *ActivityRepository) GetRecent(ctx context.Context, playerID, limit int) ([]models.Activity, error) {
	if limit <= 0 || limit > 50 {
		limit = 20
	}

	rows, err := r.pool.Query(ctx,
		`SELECT id, player_id, type, timestamp, metadata
		 FROM activity WHERE player_id = $1
		 ORDER BY timestamp DESC LIMIT $2`,
		playerID, limit,
	)
	if err != nil {
		return nil, fmt.Errorf("get recent activity: %w", err)
	}
	defer rows.Close()

	var results []models.Activity
	for rows.Next() {
		var a models.Activity
		if err := rows.Scan(&a.ID, &a.PlayerID, &a.Type, &a.Timestamp, &a.Metadata); err != nil {
			return nil, fmt.Errorf("scan activity: %w", err)
		}
		results = append(results, a)
	}
	return results, nil
}
