package repository

import (
	"context"
	"fmt"
	"time"

	"github.com/cpbrucemeena/type-strike-backend/internal/models"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// LevelProgressRepository handles database operations for level progress.
type LevelProgressRepository struct {
	pool *pgxpool.Pool
}

// NewLevelProgressRepository creates a new LevelProgressRepository.
func NewLevelProgressRepository(pool *pgxpool.Pool) *LevelProgressRepository {
	return &LevelProgressRepository{pool: pool}
}

// GetByPlayerAndLevel retrieves progress for a specific player on a specific level.
func (r *LevelProgressRepository) GetByPlayerAndLevel(ctx context.Context, playerID, levelID int) (*models.LevelProgress, error) {
	var lp models.LevelProgress
	err := r.pool.QueryRow(ctx,
		`SELECT id, player_id, level_id, stars, best_wpm, best_accuracy, completed, attempts, last_played_at
		 FROM level_progress WHERE player_id = $1 AND level_id = $2`,
		playerID, levelID,
	).Scan(&lp.ID, &lp.PlayerID, &lp.LevelID, &lp.Stars, &lp.BestWPM, &lp.BestAccuracy, &lp.Completed, &lp.Attempts, &lp.LastPlayedAt)
	if err == pgx.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("get level progress: %w", err)
	}
	return &lp, nil
}

// GetAllForPlayer retrieves all level progress for a player.
func (r *LevelProgressRepository) GetAllForPlayer(ctx context.Context, playerID int) ([]models.LevelProgress, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT id, player_id, level_id, stars, best_wpm, best_accuracy, completed, attempts, last_played_at
		 FROM level_progress WHERE player_id = $1 ORDER BY level_id`,
		playerID,
	)
	if err != nil {
		return nil, fmt.Errorf("get all level progress: %w", err)
	}
	defer rows.Close()

	var results []models.LevelProgress
	for rows.Next() {
		var lp models.LevelProgress
		if err := rows.Scan(&lp.ID, &lp.PlayerID, &lp.LevelID, &lp.Stars, &lp.BestWPM, &lp.BestAccuracy, &lp.Completed, &lp.Attempts, &lp.LastPlayedAt); err != nil {
			return nil, fmt.Errorf("scan level progress: %w", err)
		}
		results = append(results, lp)
	}
	return results, nil
}

// Upsert records or updates level progress after a play attempt.
// Only updates if the new score is better than the existing one.
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

	var lp models.LevelProgress
	err = r.pool.QueryRow(ctx,
		`INSERT INTO level_progress (player_id, level_id, stars, best_wpm, best_accuracy, completed, attempts, last_played_at)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		 ON CONFLICT (player_id, level_id)
		 DO UPDATE SET
		   stars = EXCLUDED.stars,
		   best_wpm = EXCLUDED.best_wpm,
		   best_accuracy = EXCLUDED.best_accuracy,
		   completed = EXCLUDED.completed,
		   attempts = EXCLUDED.attempts,
		   last_played_at = EXCLUDED.last_played_at
		 RETURNING id, player_id, level_id, stars, best_wpm, best_accuracy, completed, attempts, last_played_at`,
		playerID, levelID, stars, bestWPM, bestAccuracy, completed, attempts, time.Now(),
	).Scan(&lp.ID, &lp.PlayerID, &lp.LevelID, &lp.Stars, &lp.BestWPM, &lp.BestAccuracy, &lp.Completed, &lp.Attempts, &lp.LastPlayedAt)
	if err != nil {
		return nil, fmt.Errorf("upsert level progress: %w", err)
	}
	return &lp, nil
}

// GetCompletedCount returns the number of levels the player has completed (1+ star).
func (r *LevelProgressRepository) GetCompletedCount(ctx context.Context, playerID int) (int, error) {
	var count int
	err := r.pool.QueryRow(ctx,
		`SELECT COUNT(*) FROM level_progress WHERE player_id = $1 AND completed = true`,
		playerID,
	).Scan(&count)
	if err != nil {
		return 0, fmt.Errorf("get completed count: %w", err)
	}
	return count, nil
}

// GetNextUncompletedLevel returns the lowest level_id the player hasn't completed.
func (r *LevelProgressRepository) GetNextUncompletedLevel(ctx context.Context, playerID int) (int, error) {
	var levelID int
	err := r.pool.QueryRow(ctx,
		`SELECT COALESCE(
		   (SELECT MIN(level_id) + 1 FROM level_progress WHERE player_id = $1 AND completed = true),
		   1
		 )`,
		playerID,
	).Scan(&levelID)
	if err != nil {
		return 1, nil // default to level 1
	}
	return levelID, nil
}
