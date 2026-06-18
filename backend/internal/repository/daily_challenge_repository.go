package repository

import (
	"context"
	"fmt"
	"time"

	"github.com/cpbrucemeena/type-strike-backend/internal/models"
	"github.com/jackc/pgx/v5/pgxpool"
)

// DailyChallengeRepository handles database operations for daily challenges.
type DailyChallengeRepository struct {
	pool *pgxpool.Pool
}

// NewDailyChallengeRepository creates a new DailyChallengeRepository.
func NewDailyChallengeRepository(pool *pgxpool.Pool) *DailyChallengeRepository {
	return &DailyChallengeRepository{pool: pool}
}

// GetChallengesForDate retrieves all challenges for a player on a given date.
// Returns empty slice if none exist.
func (r *DailyChallengeRepository) GetChallengesForDate(ctx context.Context, playerID int, date time.Time) ([]models.DailyChallenge, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT id, player_id, challenge_date, challenge_type, challenge_name, description, icon,
		        level_id, target_wpm, target_accuracy, reward_xp, reward_stars,
		        current_best_wpm, current_best_accuracy, completed, attempts, created_at
		 FROM daily_challenges
		 WHERE player_id = $1 AND challenge_date = $2
		 ORDER BY id`,
		playerID, date.Format("2006-01-02"),
	)
	if err != nil {
		return nil, fmt.Errorf("query daily challenges: %w", err)
	}
	defer rows.Close()

	var challenges []models.DailyChallenge
	for rows.Next() {
		var c models.DailyChallenge
		if err := rows.Scan(
			&c.ID, &c.PlayerID, &c.ChallengeDate, &c.ChallengeType, &c.ChallengeName,
			&c.Description, &c.Icon, &c.LevelID, &c.TargetWPM, &c.TargetAccuracy,
			&c.RewardXP, &c.RewardStars, &c.CurrentBestWPM, &c.CurrentBestAccuracy,
			&c.Completed, &c.Attempts, &c.CreatedAt,
		); err != nil {
			return nil, fmt.Errorf("scan daily challenge: %w", err)
		}
		challenges = append(challenges, c)
	}

	return challenges, nil
}

// InsertChallenges bulk-inserts generated challenges for a player on a date.
func (r *DailyChallengeRepository) InsertChallenges(ctx context.Context, playerID int, date time.Time, challenges []models.DailyChallenge) error {
	for _, c := range challenges {
		_, err := r.pool.Exec(ctx,
			`INSERT INTO daily_challenges
			 (player_id, challenge_date, challenge_type, challenge_name, description, icon,
			  level_id, target_wpm, target_accuracy, reward_xp, reward_stars)
			 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
			 ON CONFLICT (player_id, challenge_date, challenge_type) DO NOTHING`,
			playerID, date.Format("2006-01-02"),
			c.ChallengeType, c.ChallengeName, c.Description, c.Icon,
			c.LevelID, c.TargetWPM, c.TargetAccuracy, c.RewardXP, c.RewardStars,
		)
		if err != nil {
			return fmt.Errorf("insert challenge: %w", err)
		}
	}
	return nil
}

// UpdateChallengeProgress updates a challenge after a player attempts it.
func (r *DailyChallengeRepository) UpdateChallengeProgress(
	ctx context.Context, challengeID, playerID int, wpm int, accuracy float64,
) (*models.DailyChallenge, error) {
	var c models.DailyChallenge
	err := r.pool.QueryRow(ctx,
		`UPDATE daily_challenges
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
		           current_best_wpm, current_best_accuracy, completed, attempts, created_at`,
		challengeID, playerID, wpm, accuracy,
	).Scan(
		&c.ID, &c.PlayerID, &c.ChallengeDate, &c.ChallengeType, &c.ChallengeName,
		&c.Description, &c.Icon, &c.LevelID, &c.TargetWPM, &c.TargetAccuracy,
		&c.RewardXP, &c.RewardStars, &c.CurrentBestWPM, &c.CurrentBestAccuracy,
		&c.Completed, &c.Attempts, &c.CreatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("update challenge progress: %w", err)
	}
	return &c, nil
}

// AwardChallengeReward grants XP and stars to a player for completing a challenge.
func (r *DailyChallengeRepository) AwardChallengeReward(
	ctx context.Context, playerID int, xp int, stars int,
) error {
	_, err := r.pool.Exec(ctx,
		`UPDATE players
		 SET xp = xp + $2,
		     total_stars = total_stars + $3
		 WHERE id = $1`,
		playerID, xp, stars,
	)
	if err != nil {
		return fmt.Errorf("award challenge reward: %w", err)
	}
	return nil
}
