package repository

import (
	"context"
	"fmt"
	"time"

	"github.com/cpbrucemeena/type-strike-backend/internal/models"
	"gorm.io/gorm"
)

// DailyChallengeRepository handles database operations for daily challenges.
type DailyChallengeRepository struct {
	db *gorm.DB
}

// NewDailyChallengeRepository creates a new DailyChallengeRepository.
func NewDailyChallengeRepository(db *gorm.DB) *DailyChallengeRepository {
	return &DailyChallengeRepository{db: db}
}

// GetChallengesForDate retrieves all challenges for a player on a given date.
func (r *DailyChallengeRepository) GetChallengesForDate(ctx context.Context, playerID int, date time.Time) ([]models.DailyChallenge, error) {
	var challenges []models.DailyChallenge
	err := r.db.WithContext(ctx).Where("player_id = ? AND challenge_date = ?", playerID, date.Format("2006-01-02")).
		Order("id ASC").
		Find(&challenges).Error
	if err != nil {
		return nil, fmt.Errorf("query daily challenges: %w", err)
	}
	return challenges, nil
}

// InsertChallenges bulk-inserts generated challenges for a player on a date.
func (r *DailyChallengeRepository) InsertChallenges(ctx context.Context, playerID int, date time.Time, challenges []models.DailyChallenge) error {
	for _, c := range challenges {
		c.PlayerID = playerID
		c.ChallengeDate = models.DateOnly{Time: date}
		if err := r.db.WithContext(ctx).Create(&c).Error; err != nil {
			return fmt.Errorf("insert challenge: %w", err)
		}
	}
	return nil
}

// UpdateChallengeProgress updates a challenge after a player attempts it.
func (r *DailyChallengeRepository) UpdateChallengeProgress(ctx context.Context, challengeID, playerID int, wpm int, accuracy float64) (*models.DailyChallenge, error) {
	rawSQL := `
		UPDATE daily_challenges
		SET attempts = attempts + 1,
			current_best_wpm = GREATEST(current_best_wpm, $3),
			current_best_accuracy = GREATEST(current_best_accuracy, $4),
			completed = CASE
				WHEN $3 >= target_wpm AND $4 >= target_accuracy THEN true
				ELSE completed
			END
		WHERE id = $1 AND player_id = $2
		RETURNING id, player_id, challenge_date, challenge_type, challenge_name, description, icon,
			level_id, target_wpm, target_accuracy, reward_xp, reward_stars,
			current_best_wpm, current_best_accuracy, completed, attempts, created_at
	`
	var c models.DailyChallenge
	err := r.db.WithContext(ctx).Raw(rawSQL, challengeID, playerID, wpm, accuracy).Scan(&c).Error
	if err != nil {
		return nil, fmt.Errorf("update challenge progress: %w", err)
	}
	return &c, nil
}

// AwardChallengeReward grants XP and stars to a player for completing a challenge.
func (r *DailyChallengeRepository) AwardChallengeReward(ctx context.Context, playerID int, xp int, stars int) error {
	if err := r.db.WithContext(ctx).Model(&models.Player{}).Where("id = ?", playerID).
		Updates(map[string]interface{}{
			"xp":          gorm.Expr("xp + ?", xp),
			"total_stars": gorm.Expr("total_stars + ?", stars),
		}).Error; err != nil {
		return fmt.Errorf("award challenge reward: %w", err)
	}
	return nil
}
