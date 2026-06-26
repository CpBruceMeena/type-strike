package repository

import (
	"context"
	"fmt"
	"time"

	"github.com/cpbrucemeena/type-strike-backend/internal/models"
	"gorm.io/gorm"
)

// AnalyticsRepository handles database operations for analytics events and daily stats.
type AnalyticsRepository struct {
	db *gorm.DB
}

// NewAnalyticsRepository creates a new AnalyticsRepository.
func NewAnalyticsRepository(db *gorm.DB) *AnalyticsRepository {
	return &AnalyticsRepository{db: db}
}

// RecordEvent logs a new analytics event.
func (r *AnalyticsRepository) RecordEvent(ctx context.Context, req models.RecordAnalyticsEventRequest) (*models.AnalyticsEvent, error) {
	if req.Properties == nil {
		req.Properties = []byte("{}")
	}

	e := models.AnalyticsEvent{
		PlayerID:   req.PlayerID,
		EventName:  req.EventName,
		Properties: req.Properties,
	}

	if err := r.db.WithContext(ctx).Create(&e).Error; err != nil {
		return nil, fmt.Errorf("record analytics event: %w", err)
	}
	return &e, nil
}

// GetDailyStats retrieves or creates daily stats for a player on a given date.
func (r *AnalyticsRepository) GetDailyStats(ctx context.Context, playerID int, date time.Time) (*models.DailyStats, error) {
	var ds models.DailyStats
	err := r.db.WithContext(ctx).Where("player_id = ? AND date = ?", playerID, date.Format("2006-01-02")).First(&ds).Error
	if err == gorm.ErrRecordNotFound {
		return &models.DailyStats{
			PlayerID: playerID,
			Date:     date,
		}, nil
	}
	if err != nil {
		return nil, fmt.Errorf("get daily stats: %w", err)
	}
	return &ds, nil
}

// UpsertDailyStats updates daily stats, only keeping best values.
func (r *AnalyticsRepository) UpsertDailyStats(ctx context.Context, playerID int, date time.Time, wpm int, completed bool, playTimeSeconds int) (*models.DailyStats, error) {
	rawSQL := `
		INSERT INTO daily_stats (player_id, date, session_count, total_play_time_seconds, best_wpm, levels_completed)
		VALUES ($1, $2, 1, $3, $4, CASE WHEN $5 THEN 1 ELSE 0 END)
		ON CONFLICT (player_id, date) DO UPDATE SET
			session_count = daily_stats.session_count + 1,
			total_play_time_seconds = daily_stats.total_play_time_seconds + EXCLUDED.total_play_time_seconds,
			best_wpm = GREATEST(daily_stats.best_wpm, EXCLUDED.best_wpm),
			levels_completed = daily_stats.levels_completed + CASE WHEN $5 THEN 1 ELSE 0 END
		RETURNING id, player_id, date, session_count, total_play_time_seconds, best_wpm, levels_completed
	`
	var ds models.DailyStats
	err := r.db.WithContext(ctx).Raw(rawSQL, playerID, date.Format("2006-01-02"), playTimeSeconds, wpm, completed).Scan(&ds).Error
	if err != nil {
		return nil, fmt.Errorf("upsert daily stats: %w", err)
	}
	return &ds, nil
}
