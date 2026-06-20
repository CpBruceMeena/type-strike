package repository

import (
	"context"
	"fmt"
	"time"

	"github.com/cpbrucemeena/type-strike-backend/internal/models"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// ContestRepository handles database operations for contests and contest entries.
type ContestRepository struct {
	pool *pgxpool.Pool
}

// NewContestRepository creates a new ContestRepository.
func NewContestRepository(pool *pgxpool.Pool) *ContestRepository {
	return &ContestRepository{pool: pool}
}

// GetActiveContest returns the currently active contest, or nil if none.
func (r *ContestRepository) GetActiveContest(ctx context.Context) (*models.Contest, error) {
	var c models.Contest
	err := r.pool.QueryRow(ctx, `
		SELECT id, start_date, end_date, paragraph, difficulty, is_active, created_at
		FROM contests
		WHERE is_active = true AND start_date <= NOW() AND end_date > NOW()
		ORDER BY start_date DESC
		LIMIT 1
	`).Scan(&c.ID, &c.StartDate, &c.EndDate, &c.Paragraph, &c.Difficulty, &c.IsActive, &c.CreatedAt)
	if err == pgx.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("get active contest: %w", err)
	}
	return &c, nil
}

// GetOrCreateDailyContest finds today's contest or creates one.
func (r *ContestRepository) GetOrCreateDailyContest(ctx context.Context, paragraph string) (*models.Contest, bool, error) {
	now := time.Now()
	dayStart := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	dayEnd := dayStart.AddDate(0, 0, 1)

	// Try to find existing contest for today
	var c models.Contest
	err := r.pool.QueryRow(ctx, `
		SELECT id, start_date, end_date, paragraph, difficulty, is_active, created_at
		FROM contests
		WHERE start_date >= $1 AND start_date < $2
		LIMIT 1
	`, dayStart, dayEnd).Scan(&c.ID, &c.StartDate, &c.EndDate, &c.Paragraph, &c.Difficulty, &c.IsActive, &c.CreatedAt)
	if err == nil {
		return &c, false, nil
	}
	if err != pgx.ErrNoRows {
		return nil, false, fmt.Errorf("find daily contest: %w", err)
	}

	// Create new contest for today
	err = r.pool.QueryRow(ctx, `
		INSERT INTO contests (start_date, end_date, paragraph, difficulty, is_active)
		VALUES ($1, $2, $3, 'expert', true)
		RETURNING id, start_date, end_date, paragraph, difficulty, is_active, created_at
	`, dayStart, dayEnd, paragraph).Scan(
		&c.ID, &c.StartDate, &c.EndDate, &c.Paragraph, &c.Difficulty, &c.IsActive, &c.CreatedAt,
	)
	if err != nil {
		return nil, false, fmt.Errorf("create daily contest: %w", err)
	}

	return &c, true, nil
}

// GetPlayerEntry returns a player's contest entry for a specific contest.
func (r *ContestRepository) GetPlayerEntry(ctx context.Context, contestID, playerID int) (*models.ContestPlayerEntry, error) {
	var entry models.ContestPlayerEntry
	err := r.pool.QueryRow(ctx, `
		SELECT wpm, accuracy, rank FROM contest_entries
		WHERE contest_id = $1 AND player_id = $2
	`, contestID, playerID).Scan(&entry.WPM, &entry.Accuracy, &entry.Rank)
	if err == pgx.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("get player contest entry: %w", err)
	}
	return &entry, nil
}

// InsertEntry inserts a player's contest entry and computes their rank.
func (r *ContestRepository) InsertEntry(ctx context.Context, contestID, playerID int, gameSessionID string, wpm int, accuracy float64) (*models.ContestEntry, error) {
	var entry models.ContestEntry
	err := r.pool.QueryRow(ctx, `
		INSERT INTO contest_entries (contest_id, player_id, game_session_id, wpm, accuracy)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, contest_id, player_id, game_session_id::text, wpm, accuracy, rank, created_at
	`, contestID, playerID, gameSessionID, wpm, accuracy).Scan(
		&entry.ID, &entry.ContestID, &entry.PlayerID, &entry.GameSessionID,
		&entry.WPM, &entry.Accuracy, &entry.Rank, &entry.CreatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("insert contest entry: %w", err)
	}

	// Update all ranks for this contest
	_, err = r.pool.Exec(ctx, `
		UPDATE contest_entries SET rank = sub.new_rank
		FROM (
			SELECT id, ROW_NUMBER() OVER (ORDER BY wpm DESC, accuracy DESC) AS new_rank
			FROM contest_entries
			WHERE contest_id = $1
		) sub
		WHERE contest_entries.id = sub.id AND contest_entries.contest_id = $1
	`, contestID)
	if err != nil {
		return nil, fmt.Errorf("update contest ranks: %w", err)
	}

	// Re-fetch to get the updated rank
	err = r.pool.QueryRow(ctx, `
		SELECT id, contest_id, player_id, game_session_id::text, wpm, accuracy, rank, created_at
		FROM contest_entries WHERE id = $1
	`, entry.ID).Scan(
		&entry.ID, &entry.ContestID, &entry.PlayerID, &entry.GameSessionID,
		&entry.WPM, &entry.Accuracy, &entry.Rank, &entry.CreatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("re-fetch contest entry: %w", err)
	}

	return &entry, nil
}

// GetLeaderboard returns the leaderboard for a contest.
func (r *ContestRepository) GetLeaderboard(ctx context.Context, contestID int, limit int) ([]models.ContestEntry, int, error) {
	var totalCount int
	err := r.pool.QueryRow(ctx, `
		SELECT COUNT(*) FROM contest_entries WHERE contest_id = $1
	`, contestID).Scan(&totalCount)
	if err != nil {
		return nil, 0, fmt.Errorf("count contest entries: %w", err)
	}

	rows, err := r.pool.Query(ctx, `
		SELECT
			ce.id, ce.contest_id, ce.player_id, ce.game_session_id::text,
			ce.wpm, ce.accuracy, ce.rank, COALESCE(p.title, ''), p.level, ce.created_at
		FROM contest_entries ce
		JOIN players p ON p.id = ce.player_id
		WHERE ce.contest_id = $1
		ORDER BY ce.rank ASC
		LIMIT $2
	`, contestID, limit)
	if err != nil {
		return nil, 0, fmt.Errorf("query contest leaderboard: %w", err)
	}
	defer rows.Close()

	var entries []models.ContestEntry
	for rows.Next() {
		var e models.ContestEntry
		if err := rows.Scan(
			&e.ID, &e.ContestID, &e.PlayerID, &e.GameSessionID,
			&e.WPM, &e.Accuracy, &e.Rank, &e.PlayerName, &e.PlayerLevel, &e.CreatedAt,
		); err != nil {
			return nil, 0, fmt.Errorf("scan contest entry: %w", err)
		}
		entries = append(entries, e)
	}

	return entries, totalCount, nil
}

// HasPlayerEntered checks if a player has already submitted for a contest.
func (r *ContestRepository) HasPlayerEntered(ctx context.Context, contestID, playerID int) (bool, error) {
	var count int
	err := r.pool.QueryRow(ctx, `
		SELECT COUNT(*) FROM contest_entries WHERE contest_id = $1 AND player_id = $2
	`, contestID, playerID).Scan(&count)
	if err != nil {
		return false, fmt.Errorf("check player entry: %w", err)
	}
	return count > 0, nil
}
