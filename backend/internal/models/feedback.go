package models

import "time"

// Feedback represents a user-submitted feedback message.
type Feedback struct {
	ID        int       `json:"id" gorm:"primaryKey;autoIncrement"`
	PlayerID  string    `json:"player_id" gorm:"column:player_id;type:varchar(255)"`
	Email     string    `json:"email" gorm:"column:email;type:varchar(255)"`
	Message   string    `json:"message" gorm:"column:message;type:text;not null"`
	CreatedAt time.Time `json:"created_at" gorm:"column:created_at;autoCreateTime"`
}

func (Feedback) TableName() string { return "feedback" }

// CreateFeedbackRequest is the payload for submitting feedback.
type CreateFeedbackRequest struct {
	PlayerID string `json:"player_id"`
	Email    string `json:"email"`
	Message  string `json:"message"`
}
