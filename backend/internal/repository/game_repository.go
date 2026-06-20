package repository

import (
	"context"
	"fmt"
	"time"

	"github.com/cpbrucemeena/type-strike-backend/internal/models"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// GameRepository handles database operations for game sessions and timed leaderboards.
type GameRepository struct {
	pool *pgxpool.Pool
}

// NewGameRepository creates a new GameRepository.
func NewGameRepository(pool *pgxpool.Pool) *GameRepository {
	return &GameRepository{pool: pool}
}

// CreateSession inserts a new game session and returns it.
func (r *GameRepository) CreateSession(ctx context.Context, session *models.GameSession) error {
	_, err := r.pool.Exec(ctx, `
		INSERT INTO game_sessions (id, player_id, mode, level_id, paragraph, duration_sec, started_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
	`,
		session.ID, session.PlayerID, session.Mode, session.LevelID,
		session.Paragraph, session.DurationSec, session.StartedAt,
	)
	if err != nil {
		return fmt.Errorf("insert game session: %w", err)
	}
	return nil
}

// CompleteSession updates a game session with results.
func (r *GameRepository) CompleteSession(ctx context.Context, sessionID string, req models.CompleteGameRequest, xpEarned int) (*models.GameSession, error) {
	now := time.Now()

	var session models.GameSession
	err := r.pool.QueryRow(ctx, `
		UPDATE game_sessions SET
			completed_at = $1,
			wpm = $2,
			accuracy = $3,
			correct_ks = $4,
			total_ks = $5,
			max_combo = $6,
			error_count = $7,
			consistency = $8,
			xp_earned = $9,
			is_completed = $10
		WHERE id = $11
		RETURNING id, player_id, mode, level_id, paragraph, duration_sec,
			started_at, completed_at, wpm, accuracy, correct_ks, total_ks,
			max_combo, error_count, consistency, xp_earned, stars, is_completed
	`,
		now, req.WPM, req.Accuracy, req.CorrectKeystrokes, req.TotalKeystrokes,
		req.MaxCombo, req.ErrorCount, req.Consistency, xpEarned, req.Completed,
		sessionID,
	).Scan(
		&session.ID, &session.PlayerID, &session.Mode, &session.LevelID,
		&session.Paragraph, &session.DurationSec,
		&session.StartedAt, &session.CompletedAt,
		&session.WPM, &session.Accuracy, &session.CorrectKS, &session.TotalKS,
		&session.MaxCombo, &session.ErrorCount, &session.Consistency,
		&session.XPEarned, &session.Stars, &session.IsCompleted,
	)
	if err != nil {
		return nil, fmt.Errorf("complete game session: %w", err)
	}

	return &session, nil
}

// GetSession retrieves a game session by ID.
func (r *GameRepository) GetSession(ctx context.Context, sessionID string) (*models.GameSession, error) {
	var session models.GameSession
	err := r.pool.QueryRow(ctx, `
		SELECT id, player_id, mode, level_id, paragraph, duration_sec,
			started_at, completed_at, wpm, accuracy, correct_ks, total_ks,
			max_combo, error_count, consistency, xp_earned, stars, is_completed
		FROM game_sessions WHERE id = $1
	`, sessionID).Scan(
		&session.ID, &session.PlayerID, &session.Mode, &session.LevelID,
		&session.Paragraph, &session.DurationSec,
		&session.StartedAt, &session.CompletedAt,
		&session.WPM, &session.Accuracy, &session.CorrectKS, &session.TotalKS,
		&session.MaxCombo, &session.ErrorCount, &session.Consistency,
		&session.XPEarned, &session.Stars, &session.IsCompleted,
	)
	if err == pgx.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("get game session: %w", err)
	}
	return &session, nil
}

// GetHistory returns a player's game history with pagination.
func (r *GameRepository) GetHistory(ctx context.Context, playerID int, mode string, limit, offset int) ([]models.GameHistoryEntry, int, error) {
	var total int
	err := r.pool.QueryRow(ctx, `
		SELECT COUNT(*) FROM game_sessions
		WHERE player_id = $1 AND is_completed = true
		AND ($2 = '' OR mode = $2)
	`, playerID, mode).Scan(&total)
	if err != nil {
		return nil, 0, fmt.Errorf("count history: %w", err)
	}

	rows, err := r.pool.Query(ctx, `
		SELECT id::text, mode, COALESCE(wpm, 0), COALESCE(accuracy, 0),
			correct_ks, total_ks, max_combo, xp_earned, completed_at, stars
		FROM game_sessions
		WHERE player_id = $1 AND is_completed = true
		AND ($2 = '' OR mode = $2)
		ORDER BY completed_at DESC
		LIMIT $3 OFFSET $4
	`, playerID, mode, limit, offset)
	if err != nil {
		return nil, 0, fmt.Errorf("query history: %w", err)
	}
	defer rows.Close()

	var entries []models.GameHistoryEntry
	for rows.Next() {
		var e models.GameHistoryEntry
		if err := rows.Scan(
			&e.ID, &e.Mode, &e.WPM, &e.Accuracy,
			&e.CorrectKeystrokes, &e.TotalKeystrokes, &e.MaxCombo,
			&e.XPEarned, &e.PlayedAt, &e.Stars,
		); err != nil {
			return nil, 0, fmt.Errorf("scan history entry: %w", err)
		}
		entries = append(entries, e)
	}

	return entries, total, nil
}

// UpsertTimedLeaderboard inserts or updates a player's best score for a timed mode.
func (r *GameRepository) UpsertTimedLeaderboard(ctx context.Context, playerID int, mode string, wpm int, accuracy float64, gameSessionID string) error {
	_, err := r.pool.Exec(ctx, `
		INSERT INTO leaderboard_timed (mode, player_id, player_name, best_wpm, best_accuracy, game_session_id, achieved_at)
		SELECT $1, $2, COALESCE(p.title, ''), $3, $4, $5, NOW()
		FROM players p WHERE p.id = $2
		ON CONFLICT (mode, player_id) DO UPDATE SET
			best_wpm = GREATEST(leaderboard_timed.best_wpm, EXCLUDED.best_wpm),
			best_accuracy = CASE
				WHEN leaderboard_timed.best_wpm < EXCLUDED.best_wpm THEN EXCLUDED.best_accuracy
				ELSE leaderboard_timed.best_accuracy
			END,
			game_session_id = CASE
				WHEN leaderboard_timed.best_wpm < EXCLUDED.best_wpm THEN EXCLUDED.game_session_id
				ELSE leaderboard_timed.game_session_id
			END,
			achieved_at = CASE
				WHEN leaderboard_timed.best_wpm < EXCLUDED.best_wpm THEN NOW()
				ELSE leaderboard_timed.achieved_at
			END
	`, mode, playerID, wpm, accuracy, gameSessionID)
	if err != nil {
		return fmt.Errorf("upsert timed leaderboard: %w", err)
	}
	return nil
}

// GetTimedLeaderboard returns the top players for a timed mode.
func (r *GameRepository) GetTimedLeaderboard(ctx context.Context, mode string, limit int) ([]models.TimedLeaderboardEntry, int, error) {
	var totalCount int
	err := r.pool.QueryRow(ctx, `
		SELECT COUNT(*) FROM leaderboard_timed WHERE mode = $1
	`, mode).Scan(&totalCount)
	if err != nil {
		return nil, 0, fmt.Errorf("count timed leaderboard: %w", err)
	}

	rows, err := r.pool.Query(ctx, `
		SELECT
			player_id, player_name, mode, best_wpm, best_accuracy, achieved_at,
			ROW_NUMBER() OVER (ORDER BY best_wpm DESC, best_accuracy DESC) AS rank
		FROM leaderboard_timed
		WHERE mode = $1
		ORDER BY best_wpm DESC, best_accuracy DESC
		LIMIT $2
	`, mode, limit)
	if err != nil {
		return nil, 0, fmt.Errorf("query timed leaderboard: %w", err)
	}
	defer rows.Close()

	var entries []models.TimedLeaderboardEntry
	for rows.Next() {
		var e models.TimedLeaderboardEntry
		if err := rows.Scan(
			&e.PlayerID, &e.PlayerName, &e.Mode, &e.BestWPM, &e.BestAccuracy, &e.AchievedAt, &e.Rank,
		); err != nil {
			return nil, 0, fmt.Errorf("scan timed entry: %w", err)
		}
		entries = append(entries, e)
	}

	return entries, totalCount, nil
}

// GetPlayerTimedRank returns a player's personal best in a timed mode with rank.
func (r *GameRepository) GetPlayerTimedRank(ctx context.Context, playerID int, mode string) (*models.TimedLeaderboardEntry, error) {
	var entry models.TimedLeaderboardEntry
	err := r.pool.QueryRow(ctx, `
		SELECT player_id, player_name, mode, best_wpm, best_accuracy, achieved_at,
			rank
		FROM (
			SELECT *, ROW_NUMBER() OVER (ORDER BY best_wpm DESC, best_accuracy DESC) AS rank
			FROM leaderboard_timed WHERE mode = $1
		) sub
		WHERE player_id = $2
	`, mode, playerID).Scan(
		&entry.PlayerID, &entry.PlayerName, &entry.Mode, &entry.BestWPM,
		&entry.BestAccuracy, &entry.AchievedAt, &entry.Rank,
	)
	if err == pgx.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("get player timed rank: %w", err)
	}
	return &entry, nil
}
