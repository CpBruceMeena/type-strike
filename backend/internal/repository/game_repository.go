package repository

import (
	"context"
	"fmt"
	"time"

	"github.com/cpbrucemeena/type-strike-backend/internal/models"
	"gorm.io/gorm"
)

// GameRepository handles database operations for game sessions and timed leaderboards.
type GameRepository struct {
	db *gorm.DB
}

// NewGameRepository creates a new GameRepository.
func NewGameRepository(db *gorm.DB) *GameRepository {
	return &GameRepository{db: db}
}

// CreateSession inserts a new game session and returns it.
func (r *GameRepository) CreateSession(ctx context.Context, session *models.GameSession) error {
	if err := r.db.WithContext(ctx).Create(session).Error; err != nil {
		return fmt.Errorf("insert game session: %w", err)
	}
	return nil
}

// CompleteSession updates a game session with results.
func (r *GameRepository) CompleteSession(ctx context.Context, sessionID int64, req models.CompleteGameRequest, xpEarned int) (*models.GameSession, error) {
	now := time.Now()
	db := r.db.WithContext(ctx)

	updates := map[string]interface{}{
		"completed_at": now,
		"wpm":          req.WPM,
		"accuracy":     req.Accuracy,
		"correct_ks":   req.CorrectKeystrokes,
		"total_ks":     req.TotalKeystrokes,
		"max_combo":    req.MaxCombo,
		"error_count":  req.ErrorCount,
		"consistency":  req.Consistency,
		"xp_earned":    xpEarned,
		"is_completed": req.Completed,
	}

	if err := db.Model(&models.GameSession{}).Where("id = ?", sessionID).Updates(updates).Error; err != nil {
		return nil, fmt.Errorf("complete game session: %w", err)
	}

	var session models.GameSession
	if err := db.Where("id = ?", sessionID).First(&session).Error; err != nil {
		return nil, fmt.Errorf("re-fetch game session: %w", err)
	}
	return &session, nil
}

// GetSession retrieves a game session by ID.
func (r *GameRepository) GetSession(ctx context.Context, sessionID int64) (*models.GameSession, error) {
	var session models.GameSession
	err := r.db.WithContext(ctx).Where("id = ?", sessionID).First(&session).Error
	if err == gorm.ErrRecordNotFound {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("get game session: %w", err)
	}
	return &session, nil
}

// GetHistory returns a player's game history with pagination.
func (r *GameRepository) GetHistory(ctx context.Context, playerID int, mode string, limit, offset int) ([]models.GameHistoryEntry, int, error) {
	db := r.db.WithContext(ctx)

	var total int64
	query := db.Model(&models.GameSession{}).Where("player_id = ? AND is_completed = true", playerID)
	if mode != "" {
		query = query.Where("mode = ?", mode)
	}
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, fmt.Errorf("count history: %w", err)
	}

	var sessions []models.GameSession
	q := db.Where("player_id = ? AND is_completed = true", playerID)
	if mode != "" {
		q = q.Where("mode = ?", mode)
	}
	if err := q.Order("completed_at DESC").Limit(limit).Offset(offset).Find(&sessions).Error; err != nil {
		return nil, 0, fmt.Errorf("query history: %w", err)
	}

	entries := make([]models.GameHistoryEntry, len(sessions))
	for i, s := range sessions {
		wpm := 0
		accuracy := 0.0
		if s.WPM != nil {
			wpm = *s.WPM
		}
		if s.Accuracy != nil {
			accuracy = *s.Accuracy
		}
		playedAt := time.Time{}
		if s.CompletedAt != nil {
			playedAt = *s.CompletedAt
		}
		entries[i] = models.GameHistoryEntry{
			ID:                s.ID,
			Mode:              s.Mode,
			WPM:               wpm,
			Accuracy:          accuracy,
			CorrectKeystrokes: s.CorrectKS,
			TotalKeystrokes:   s.TotalKS,
			MaxCombo:          s.MaxCombo,
			XPEarned:          s.XPEarned,
			PlayedAt:          playedAt,
			Stars:             s.Stars,
		}
	}

	return entries, int(total), nil
}

// UpsertTimedLeaderboard inserts or updates a player's best score for a timed mode.
func (r *GameRepository) UpsertTimedLeaderboard(ctx context.Context, playerID int, mode string, wpm int, accuracy float64, gameSessionID int64) error {
	db := r.db.WithContext(ctx)

	var p models.Player
	if err := db.Select("title").Where("id = ?", playerID).First(&p).Error; err != nil {
		return fmt.Errorf("get player name: %w", err)
	}

	rawSQL := `
		INSERT INTO leaderboard_timed (mode, player_id, player_name, best_wpm, best_accuracy, game_session_id, achieved_at)
		VALUES ($1, $2, $3, $4, $5, $6, NOW())
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
	`
	if err := db.Exec(rawSQL, mode, playerID, p.Title, wpm, accuracy, gameSessionID).Error; err != nil {
		return fmt.Errorf("upsert timed leaderboard: %w", err)
	}
	return nil
}

// GetTimedLeaderboard returns the top players for a timed mode.
func (r *GameRepository) GetTimedLeaderboard(ctx context.Context, mode string, limit int) ([]models.TimedLeaderboardEntry, int, error) {
	db := r.db.WithContext(ctx)

	var totalCount int64
	if err := db.Model(&models.TimedLeaderboardEntry{}).
		Table("leaderboard_timed").
		Where("mode = ?", mode).
		Count(&totalCount).Error; err != nil {
		return nil, 0, fmt.Errorf("count timed leaderboard: %w", err)
	}

	rawSQL := `
		SELECT player_id, player_name, mode, best_wpm, best_accuracy, achieved_at,
			ROW_NUMBER() OVER (ORDER BY best_wpm DESC, best_accuracy DESC) AS rank
		FROM leaderboard_timed
		WHERE mode = $1
		ORDER BY best_wpm DESC, best_accuracy DESC
		LIMIT $2
	`
	rows, err := db.Raw(rawSQL, mode, limit).Rows()
	if err != nil {
		return nil, 0, fmt.Errorf("query timed leaderboard: %w", err)
	}
	defer rows.Close()

	var entries []models.TimedLeaderboardEntry
	for rows.Next() {
		var e models.TimedLeaderboardEntry
		if err := rows.Scan(&e.PlayerID, &e.PlayerName, &e.Mode, &e.BestWPM, &e.BestAccuracy, &e.AchievedAt, &e.Rank); err != nil {
			return nil, 0, fmt.Errorf("scan timed entry: %w", err)
		}
		entries = append(entries, e)
	}

	return entries, int(totalCount), nil
}

// GetPlayerTimedRank returns a player's personal best in a timed mode with rank.
func (r *GameRepository) GetPlayerTimedRank(ctx context.Context, playerID int, mode string) (*models.TimedLeaderboardEntry, error) {
	db := r.db.WithContext(ctx)

	rawSQL := `
		SELECT player_id, player_name, mode, best_wpm, best_accuracy, achieved_at, rank
		FROM (
			SELECT *, ROW_NUMBER() OVER (ORDER BY best_wpm DESC, best_accuracy DESC) AS rank
			FROM leaderboard_timed WHERE mode = $1
		) sub
		WHERE player_id = $2
	`
	var entry models.TimedLeaderboardEntry
	err := db.Raw(rawSQL, mode, playerID).Scan(&entry).Error
	if err != nil {
		return nil, fmt.Errorf("get player timed rank: %w", err)
	}
	if entry.PlayerID == 0 {
		return nil, nil
	}
	return &entry, nil
}
