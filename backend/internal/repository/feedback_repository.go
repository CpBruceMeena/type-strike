package repository

import (
	"context"
	"fmt"

	"github.com/cpbrucemeena/type-strike-backend/internal/models"
	"gorm.io/gorm"
)

// FeedbackRepository handles database operations for feedback submissions.
type FeedbackRepository struct {
	db *gorm.DB
}

// NewFeedbackRepository creates a new FeedbackRepository.
func NewFeedbackRepository(db *gorm.DB) *FeedbackRepository {
	return &FeedbackRepository{db: db}
}

// Create inserts a new feedback submission into the database.
func (r *FeedbackRepository) Create(ctx context.Context, req models.CreateFeedbackRequest) (*models.Feedback, error) {
	feedback := models.Feedback{
		PlayerID: req.PlayerID,
		Email:    req.Email,
		Message:  req.Message,
	}

	if err := r.db.WithContext(ctx).Create(&feedback).Error; err != nil {
		return nil, fmt.Errorf("create feedback: %w", err)
	}

	return &feedback, nil
}

// GetAll returns all feedback submissions, ordered by most recent first.
func (r *FeedbackRepository) GetAll(ctx context.Context) ([]models.Feedback, error) {
	var feedbacks []models.Feedback
	if err := r.db.WithContext(ctx).Order("created_at DESC").Find(&feedbacks).Error; err != nil {
		return nil, fmt.Errorf("get all feedback: %w", err)
	}
	return feedbacks, nil
}
