package repository

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/cpbrucemeena/type-strike-backend/internal/models"
	"github.com/jackc/pgx/v5/pgxpool"
)

// AnalyticsRepository handles database operations for analytics events and daily stats.
type AnalyticsRepository struct {
	pool *pgxpool.Pool
}

// NewAnalyticsRepository creates a new AnalyticsRepository.
func NewAnalyticsRepository(pool *pgxpool.Pool) *AnalyticsRepository {
	return &AnalyticsRepository{pool: pool}
}

// RecordEvent logs a new analytics event.
func (r *AnalyticsRepository) RecordEvent(ctx context.Context, req models.RecordAnalyticsEventRequest) (*models.AnalyticsEvent, error) {
	props := req.Properties
	if props == nil {
		props = json.RawMessage("{}")
	}

	var e models.AnalyticsEvent
	err := r.pool.QueryRow(ctx,
		`INSERT INTO analytics_events (player_id, event_name, properties)
		 VALUES ($1, $2, $3)
		 RETURNING id, player_id, event_name, timestamp, properties`,
		req.PlayerID, req.EventName, props,
	).Scan(&e.ID, &e.PlayerID, &e.EventName, &e.Timestamp, &e.Properties)
	if err != nil {
		return nil, fmt.Errorf("record analytics event: %w", err)
	}
	return &e, nil
}

// GetDailyStats retrieves or creates daily stats for a player on a given date.
func (r *AnalyticsRepository) GetDailyStats(ctx context.Context, playerID int, date time.Time) (*models.DailyStats, error) {
	var ds models.DailyStats
	err := r.pool.QueryRow(ctx,
		`SELECT id, player_id, date, session_count, total_play_time_seconds, best_wpm, levels_completed
		 FROM daily_stats WHERE player_id = $1 AND date = $2`,
		playerID, date.Format("2006-01-02"),
	).Scan(&ds.ID, &ds.PlayerID, &ds.Date, &ds.SessionCount, &ds.TotalPlayTimeSeconds, &ds.BestWPM, &ds.LevelsCompleted)
	if err != nil {
		// Return empty stats if not found
		return &models.DailyStats{
			PlayerID: playerID,
			Date:     date,
		}, nil
	}
	return &ds, nil
}

// UpsertDailyStats updates daily stats, only keeping best values.
func (r *AnalyticsRepository) UpsertDailyStats(ctx context.Context, playerID int, date time.Time, wpm int, completed bool, playTimeSeconds int) (*models.DailyStats, error) {
	var ds models.DailyStats
	err := r.pool.QueryRow(ctx,
		`INSERT INTO daily_stats (player_id, date, session_count, total_play_time_seconds, best_wpm, levels_completed)
		 VALUES ($1, $2, 1, $3, $4, CASE WHEN $5 THEN 1 ELSE 0 END)
		 ON CONFLICT (player_id, date) DO UPDATE SET
		   session_count = daily_stats.session_count + 1,
		   total_play_time_seconds = daily_stats.total_play_time_seconds + EXCLUDED.total_play_time_seconds,
		   best_wpm = GREATEST(daily_stats.best_wpm, EXCLUDED.best_wpm),
		   levels_completed = daily_stats.levels_completed + CASE WHEN $5 THEN 1 ELSE 0 END
		 RETURNING id, player_id, date, session_count, total_play_time_seconds, best_wpm, levels_completed`,
		playerID, date.Format("2006-01-02"), playTimeSeconds, wpm, completed,
	).Scan(&ds.ID, &ds.PlayerID, &ds.Date, &ds.SessionCount, &ds.TotalPlayTimeSeconds, &ds.BestWPM, &ds.LevelsCompleted)
	if err != nil {
		return nil, fmt.Errorf("upsert daily stats: %w", err)
	}
	return &ds, nil
}
