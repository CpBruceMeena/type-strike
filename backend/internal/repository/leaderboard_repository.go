package repository

import (
	"context"
	"fmt"

	"github.com/cpbrucemeena/type-strike-backend/internal/models"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// LeaderboardRepository handles database operations for the leaderboard.
type LeaderboardRepository struct {
	pool *pgxpool.Pool
}

// NewLeaderboardRepository creates a new LeaderboardRepository.
func NewLeaderboardRepository(pool *pgxpool.Pool) *LeaderboardRepository {
	return &LeaderboardRepository{pool: pool}
}

// GetTop returns the top N leaderboard entries ordered by XP descending.
func (r *LeaderboardRepository) GetTop(ctx context.Context, limit int) ([]models.LeaderboardEntry, int, error) {
	// Get total count
	var totalCount int
	err := r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM leaderboard_entries`).Scan(&totalCount)
	if err != nil {
		return nil, 0, fmt.Errorf("count leaderboard: %w", err)
	}

	// Get top entries with computed rank
	rows, err := r.pool.Query(ctx, `
		SELECT
			player_id, player_name, level, xp, total_stars,
			levels_cleared, best_wpm, updated_at,
			ROW_NUMBER() OVER (ORDER BY xp DESC, total_stars DESC, best_wpm DESC) AS rank
		FROM leaderboard_entries
		ORDER BY xp DESC, total_stars DESC, best_wpm DESC
		LIMIT $1
	`, limit)
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

	return entries, totalCount, nil
}

// GetPlayerRank returns a player's leaderboard entry with nearby competitors.
func (r *LeaderboardRepository) GetPlayerRank(ctx context.Context, playerID int) (*models.PlayerRank, error) {
	// Get the player's own entry with rank
	var entry models.LeaderboardEntry
	err := r.pool.QueryRow(ctx, `
		SELECT
			player_id, player_name, level, xp, total_stars,
			levels_cleared, best_wpm, updated_at,
			rank
		FROM (
			SELECT *, ROW_NUMBER() OVER (ORDER BY xp DESC, total_stars DESC, best_wpm DESC) AS rank
			FROM leaderboard_entries
		) sub
		WHERE player_id = $1
	`, playerID).Scan(
		&entry.PlayerID, &entry.PlayerName, &entry.Level, &entry.XP, &entry.TotalStars,
		&entry.LevelsCleared, &entry.BestWPM, &entry.UpdatedAt, &entry.Rank,
	)
	if err == pgx.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("get player rank: %w", err)
	}

	// Get 2 players above (exclude self at low ranks)
	rowsAbove, err := r.pool.Query(ctx, `
		SELECT
			player_id, player_name, level, xp, total_stars,
			levels_cleared, best_wpm, updated_at,
			ROW_NUMBER() OVER (ORDER BY xp DESC, total_stars DESC, best_wpm DESC) AS rank
		FROM leaderboard_entries
		WHERE player_id != $2
		ORDER BY xp DESC, total_stars DESC, best_wpm DESC
		OFFSET GREATEST(0, $1 - 3) LIMIT 2
	`, entry.Rank, playerID)
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

	// Get 2 players below
	rowsBelow, err := r.pool.Query(ctx, `
		SELECT
			player_id, player_name, level, xp, total_stars,
			levels_cleared, best_wpm, updated_at,
			ROW_NUMBER() OVER (ORDER BY xp DESC, total_stars DESC, best_wpm DESC) AS rank
		FROM leaderboard_entries
		ORDER BY xp DESC, total_stars DESC, best_wpm DESC
		OFFSET $1 LIMIT 2
	`, entry.Rank)
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
// Players are ranked by: completed challenges (desc), total WPM (desc), then accuracy (desc).
func (r *LeaderboardRepository) GetDailyRankings(ctx context.Context, limit int) ([]models.LeaderboardEntry, int, error) {
	// Get total count of unique players with daily challenges today
	var totalCount int
	err := r.pool.QueryRow(ctx, `
		SELECT COUNT(DISTINCT player_id)
		FROM daily_challenges
		WHERE challenge_date = CURRENT_DATE
	`).Scan(&totalCount)
	if err != nil {
		return nil, 0, fmt.Errorf("count daily leaderboard: %w", err)
	}

	// Aggregate daily challenge stats per player for today
	rows, err := r.pool.Query(ctx, `
		SELECT
			dc.player_id,
			COALESCE(p.title, '') AS player_name,
			p.level,
			p.xp,
			p.total_stars,
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
	`, limit)
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

	return entries, totalCount, nil
}

// SyncPlayer refreshes or inserts a leaderboard entry for a specific player.
func (r *LeaderboardRepository) SyncPlayer(ctx context.Context, playerID int) error {
	_, err := r.pool.Exec(ctx, `
		INSERT INTO leaderboard_entries (player_id, player_name, level, xp, total_stars, levels_cleared, best_wpm, updated_at)
		SELECT
			p.id,
			COALESCE(p.title, ''),
			p.level,
			p.xp,
			p.total_stars,
			(SELECT COUNT(*) FROM level_progress WHERE player_id = p.id AND completed = true),
			(SELECT COALESCE(MAX(current_best_wpm), 0) FROM level_progress WHERE player_id = p.id)
		FROM players p
		WHERE p.id = $1
		ON CONFLICT (player_id) DO UPDATE SET
			player_name    = EXCLUDED.player_name,
			level          = EXCLUDED.level,
			xp             = EXCLUDED.xp,
			total_stars    = EXCLUDED.total_stars,
			levels_cleared = EXCLUDED.levels_cleared,
			best_wpm       = EXCLUDED.best_wpm,
			updated_at     = NOW()
	`, playerID)
	if err != nil {
		return fmt.Errorf("sync leaderboard entry: %w", err)
	}
	return nil
}
