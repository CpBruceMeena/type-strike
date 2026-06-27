package repository

import (
	"context"
	"fmt"

	"github.com/cpbrucemeena/type-strike-backend/internal/models"
	"gorm.io/gorm"
)

// LeaderboardRepository handles database operations for the leaderboard.
type LeaderboardRepository struct {
	db *gorm.DB
}

// NewLeaderboardRepository creates a new LeaderboardRepository.
func NewLeaderboardRepository(db *gorm.DB) *LeaderboardRepository {
	return &LeaderboardRepository{db: db}
}

// GetTop returns the top N leaderboard entries ordered by XP descending.
func (r *LeaderboardRepository) GetTop(ctx context.Context, limit int) ([]models.LeaderboardEntry, int, error) {
	db := r.db.WithContext(ctx)

	var totalCount int64
	if err := db.Table("leaderboard_entries").Count(&totalCount).Error; err != nil {
		return nil, 0, fmt.Errorf("count leaderboard: %w", err)
	}

	rawSQL := `
		SELECT player_id, player_name, level, xp, total_stars,
			levels_cleared, best_wpm, updated_at,
			ROW_NUMBER() OVER (ORDER BY xp DESC, total_stars DESC, best_wpm DESC) AS rank
		FROM leaderboard_entries
		ORDER BY xp DESC, total_stars DESC, best_wpm DESC
		LIMIT $1
	`
	rows, err := db.Raw(rawSQL, limit).Rows()
	if err != nil {
		return nil, 0, fmt.Errorf("query leaderboard top: %w", err)
	}
	defer rows.Close()

	var entries []models.LeaderboardEntry
	for rows.Next() {
		var e models.LeaderboardEntry
		if err := rows.Scan(
			&e.PlayerID, &e.PlayerName, &e.Level, &e.XP, &e.TotalStars,
			&e.LevelsCleared, &e.BestWPM, &e.UpdatedAt, &e.Rank,
		); err != nil {
			return nil, 0, fmt.Errorf("scan leaderboard entry: %w", err)
		}
		entries = append(entries, e)
	}

	return entries, int(totalCount), nil
}

// GetPlayerRank returns a player's leaderboard entry with nearby competitors.
func (r *LeaderboardRepository) GetPlayerRank(ctx context.Context, playerID int) (*models.PlayerRank, error) {
	db := r.db.WithContext(ctx)

	rawSQL := `
		SELECT player_id, player_name, level, xp, total_stars,
			levels_cleared, best_wpm, updated_at, rank
		FROM (
			SELECT *, ROW_NUMBER() OVER (ORDER BY xp DESC, total_stars DESC, best_wpm DESC) AS rank
			FROM leaderboard_entries
		) sub
		WHERE player_id = $1
	`
	var entry models.LeaderboardEntry
	err := db.Raw(rawSQL, playerID).Scan(&entry).Error
	if err != nil {
		return nil, fmt.Errorf("get player rank: %w", err)
	}
	if entry.PlayerID == 0 {
		return nil, nil
	}

	aboveSQL := `
		SELECT player_id, player_name, level, xp, total_stars,
			levels_cleared, best_wpm, updated_at,
			ROW_NUMBER() OVER (ORDER BY xp DESC, total_stars DESC, best_wpm DESC) AS rank
		FROM leaderboard_entries
		WHERE player_id != $2
		ORDER BY xp DESC, total_stars DESC, best_wpm DESC
		OFFSET GREATEST(0, $1 - 3) LIMIT 2
	`
	rowsAbove, err := db.Raw(aboveSQL, entry.Rank, playerID).Rows()
	if err != nil {
		return nil, fmt.Errorf("get players above: %w", err)
	}
	defer rowsAbove.Close()

	var above []models.LeaderboardEntry
	for rowsAbove.Next() {
		var e models.LeaderboardEntry
		if err := rowsAbove.Scan(
			&e.PlayerID, &e.PlayerName, &e.Level, &e.XP, &e.TotalStars,
			&e.LevelsCleared, &e.BestWPM, &e.UpdatedAt, &e.Rank,
		); err != nil {
			return nil, fmt.Errorf("scan above entry: %w", err)
		}
		above = append(above, e)
	}

	belowSQL := `
		SELECT player_id, player_name, level, xp, total_stars,
			levels_cleared, best_wpm, updated_at,
			ROW_NUMBER() OVER (ORDER BY xp DESC, total_stars DESC, best_wpm DESC) AS rank
		FROM leaderboard_entries
		ORDER BY xp DESC, total_stars DESC, best_wpm DESC
		OFFSET $1 LIMIT 2
	`
	rowsBelow, err := db.Raw(belowSQL, entry.Rank).Rows()
	if err != nil {
		return nil, fmt.Errorf("get players below: %w", err)
	}
	defer rowsBelow.Close()

	var below []models.LeaderboardEntry
	for rowsBelow.Next() {
		var e models.LeaderboardEntry
		if err := rowsBelow.Scan(
			&e.PlayerID, &e.PlayerName, &e.Level, &e.XP, &e.TotalStars,
			&e.LevelsCleared, &e.BestWPM, &e.UpdatedAt, &e.Rank,
		); err != nil {
			return nil, fmt.Errorf("scan below entry: %w", err)
		}
		below = append(below, e)
	}

	return &models.PlayerRank{
		Entry: entry,
		Above: above,
		Below: below,
	}, nil
}

// GetDailyRankings returns aggregated daily challenge rankings for today.
func (r *LeaderboardRepository) GetDailyRankings(ctx context.Context, limit int) ([]models.LeaderboardEntry, int, error) {
	db := r.db.WithContext(ctx)

	var totalCount int64
	if err := db.Raw(`
		SELECT COUNT(DISTINCT player_id)
		FROM daily_challenges
		WHERE challenge_date = CURRENT_DATE
	`).Scan(&totalCount).Error; err != nil {
		return nil, 0, fmt.Errorf("count daily leaderboard: %w", err)
	}

	rawSQL := `
		SELECT
			dc.player_id,
			COALESCE(p.title, '') AS player_name,
			p.level, p.xp, p.total_stars,
			COUNT(*) FILTER (WHERE dc.completed = true)::int AS levels_cleared,
			COALESCE(MAX(dc.current_best_wpm), 0) AS best_wpm,
			NOW() AS updated_at,
			ROW_NUMBER() OVER (ORDER BY
				COUNT(*) FILTER (WHERE dc.completed = true) DESC,
				COALESCE(MAX(dc.current_best_wpm), 0) DESC,
				COALESCE(MAX(dc.current_best_accuracy), 0) DESC
			) AS rank
		FROM daily_challenges dc
		JOIN players p ON p.id = dc.player_id
		WHERE dc.challenge_date = CURRENT_DATE
		GROUP BY dc.player_id, p.title, p.level, p.xp, p.total_stars
		ORDER BY rank
		LIMIT $1
	`
	rows, err := db.Raw(rawSQL, limit).Rows()
	if err != nil {
		return nil, 0, fmt.Errorf("query daily leaderboard: %w", err)
	}
	defer rows.Close()

	var entries []models.LeaderboardEntry
	for rows.Next() {
		var e models.LeaderboardEntry
		if err := rows.Scan(
			&e.PlayerID, &e.PlayerName, &e.Level, &e.XP, &e.TotalStars,
			&e.LevelsCleared, &e.BestWPM, &e.UpdatedAt, &e.Rank,
		); err != nil {
			return nil, 0, fmt.Errorf("scan daily entry: %w", err)
		}
		entries = append(entries, e)
	}

	return entries, int(totalCount), nil
}


