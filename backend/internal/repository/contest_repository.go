package repository

import (
	"context"
	"fmt"
	"time"

	"github.com/cpbrucemeena/type-strike-backend/internal/models"
	"gorm.io/gorm"
)

// ContestRepository handles database operations for contests and contest entries.
type ContestRepository struct {
	db *gorm.DB
}

// NewContestRepository creates a new ContestRepository.
func NewContestRepository(db *gorm.DB) *ContestRepository {
	return &ContestRepository{db: db}
}

// GetActiveContest returns the currently active contest, or nil if none.
func (r *ContestRepository) GetActiveContest(ctx context.Context) (*models.Contest, error) {
	var c models.Contest
	err := r.db.WithContext(ctx).Where("is_active = true AND start_date <= NOW() AND end_date > NOW()").
		Order("start_date DESC").
		First(&c).Error
	if err == gorm.ErrRecordNotFound {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("get active contest: %w", err)
	}
	return &c, nil
}

// GetOrCreateDailyContest finds today's contest or creates one.
func (r *ContestRepository) GetOrCreateDailyContest(ctx context.Context, paragraph string) (*models.Contest, bool, error) {
	db := r.db.WithContext(ctx)
	now := time.Now()
	dayStart := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	dayEnd := dayStart.AddDate(0, 0, 1)

	var c models.Contest
	err := db.Where("start_date >= ? AND start_date < ?", dayStart, dayEnd).First(&c).Error
	if err == nil {
		return &c, false, nil
	}
	if err != gorm.ErrRecordNotFound {
		return nil, false, fmt.Errorf("find daily contest: %w", err)
	}

	c = models.Contest{
		StartDate:  dayStart,
		EndDate:    dayEnd,
		Paragraph:  paragraph,
		Difficulty: "expert",
		IsActive:   true,
	}
	if err := db.Create(&c).Error; err != nil {
		return nil, false, fmt.Errorf("create daily contest: %w", err)
	}

	return &c, true, nil
}

// GetPlayerEntry returns a player's contest entry for a specific contest.
func (r *ContestRepository) GetPlayerEntry(ctx context.Context, contestID, playerID int) (*models.ContestPlayerEntry, error) {
	var entry models.ContestEntry
	err := r.db.WithContext(ctx).Where("contest_id = ? AND player_id = ?", contestID, playerID).First(&entry).Error
	if err == gorm.ErrRecordNotFound {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("get player contest entry: %w", err)
	}
	return &models.ContestPlayerEntry{
		WPM:      &entry.WPM,
		Accuracy: &entry.Accuracy,
		Rank:     &entry.Rank,
	}, nil
}

// InsertEntry inserts a player's contest entry and computes their rank.
func (r *ContestRepository) InsertEntry(ctx context.Context, contestID, playerID int, gameSessionID int64, wpm int, accuracy float64) (*models.ContestEntry, error) {
	db := r.db.WithContext(ctx)

	entry := models.ContestEntry{
		ContestID:     contestID,
		PlayerID:      playerID,
		GameSessionID: gameSessionID,
		WPM:           wpm,
		Accuracy:      accuracy,
	}
	if err := db.Create(&entry).Error; err != nil {
		return nil, fmt.Errorf("insert contest entry: %w", err)
	}

	if err := db.Exec(`
		UPDATE contest_entries SET rank = sub.new_rank
		FROM (
			SELECT id, ROW_NUMBER() OVER (ORDER BY wpm DESC, accuracy DESC) AS new_rank
			FROM contest_entries
			WHERE contest_id = $1
		) sub
		WHERE contest_entries.id = sub.id AND contest_entries.contest_id = $1
	`, contestID).Error; err != nil {
		return nil, fmt.Errorf("update contest ranks: %w", err)
	}

	if err := db.Where("id = ?", entry.ID).First(&entry).Error; err != nil {
		return nil, fmt.Errorf("re-fetch contest entry: %w", err)
	}

	return &entry, nil
}

// GetLeaderboard returns the leaderboard for a contest.
func (r *ContestRepository) GetLeaderboard(ctx context.Context, contestID int, limit int) ([]models.ContestEntry, int, error) {
	db := r.db.WithContext(ctx)

	var totalCount int64
	if err := db.Model(&models.ContestEntry{}).
		Where("contest_id = ?", contestID).
		Count(&totalCount).Error; err != nil {
		return nil, 0, fmt.Errorf("count contest entries: %w", err)
	}

	rawSQL := `
		SELECT ce.id, ce.contest_id, ce.player_id, ce.game_session_id,
			ce.wpm, ce.accuracy, ce.rank, COALESCE(p.title, ''), p.level, ce.created_at
		FROM contest_entries ce
		JOIN players p ON p.id = ce.player_id
		WHERE ce.contest_id = $1
		ORDER BY ce.rank ASC
		LIMIT $2
	`
	rows, err := db.Raw(rawSQL, contestID, limit).Rows()
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

	return entries, int(totalCount), nil
}

// HasPlayerEntered checks if a player has already submitted for a contest.
func (r *ContestRepository) HasPlayerEntered(ctx context.Context, contestID, playerID int) (bool, error) {
	var count int64
	err := r.db.WithContext(ctx).Model(&models.ContestEntry{}).
		Where("contest_id = ? AND player_id = ?", contestID, playerID).
		Count(&count).Error
	if err != nil {
		return false, fmt.Errorf("check player entry: %w", err)
	}
	return count > 0, nil
}
