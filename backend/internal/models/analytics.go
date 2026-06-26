package models

import (
	"encoding/json"
	"time"
)

// AnalyticsEvent represents a single analytics event logged from gameplay.
type AnalyticsEvent struct {
	ID         int              `json:"id" gorm:"primaryKey;autoIncrement"`
	PlayerID   int              `json:"player_id" gorm:"column:player_id;index"`
	EventName  string           `json:"event_name" gorm:"column:event_name"`
	Timestamp  time.Time        `json:"timestamp" gorm:"column:timestamp;autoCreateTime"`
	Properties json.RawMessage  `json:"properties" gorm:"type:jsonb;default:'{}'"`
}

func (AnalyticsEvent) TableName() string { return "analytics_events" }

// RecordAnalyticsEventRequest is the payload to log an analytics event.
type RecordAnalyticsEventRequest struct {
	PlayerID   int             `json:"player_id"`
	EventName  string          `json:"event_name"`
	Properties json.RawMessage `json:"properties"`
}

// DailyStats represents aggregated daily statistics for a player.
type DailyStats struct {
	ID                   int       `json:"id" gorm:"primaryKey;autoIncrement"`
	PlayerID             int       `json:"player_id" gorm:"column:player_id;uniqueIndex:idx_player_date"`
	Date                 time.Time `json:"date" gorm:"type:date;uniqueIndex:idx_player_date"`
	SessionCount         int       `json:"session_count" gorm:"column:session_count;default:0"`
	TotalPlayTimeSeconds int       `json:"total_play_time_seconds" gorm:"column:total_play_time_seconds;default:0"`
	BestWPM              int       `json:"best_wpm" gorm:"column:best_wpm;default:0"`
	LevelsCompleted      int       `json:"levels_completed" gorm:"column:levels_completed;default:0"`
}

func (DailyStats) TableName() string { return "daily_stats" }
