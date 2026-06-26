package models

import (
	"time"
)

// LessonProgress represents a player's progress on a specific lesson.
type LessonProgress struct {
	ID          int        `json:"id" gorm:"primaryKey;autoIncrement"`
	PlayerID    int        `json:"player_id" gorm:"column:player_id;uniqueIndex:idx_player_lesson"`
	LessonID    int        `json:"lesson_id" gorm:"column:lesson_id;uniqueIndex:idx_player_lesson"`
	BestWPM     int        `json:"best_wpm" gorm:"column:best_wpm;default:0"`
	BestAccuracy float64   `json:"best_accuracy" gorm:"column:best_accuracy;default:0"`
	Completed   bool       `json:"completed" gorm:"default:false"`
	Attempts    int        `json:"attempts" gorm:"default:0"`
	CompletedAt *time.Time `json:"completed_at,omitempty" gorm:"column:completed_at"`
	CreatedAt   time.Time  `json:"created_at" gorm:"column:created_at;autoCreateTime"`
	UpdatedAt   time.Time  `json:"updated_at" gorm:"column:updated_at;autoUpdateTime"`
}

func (LessonProgress) TableName() string { return "lesson_progress" }

// UpdateLessonProgressRequest is the payload to record lesson completion.
type UpdateLessonProgressRequest struct {
	WPM       int     `json:"wpm"`
	Accuracy  float64 `json:"accuracy"`
	Completed bool    `json:"completed"`
}
