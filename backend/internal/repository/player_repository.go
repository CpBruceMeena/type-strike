package repository

import (
	"context"
	"fmt"
	"time"

	"github.com/cpbrucemeena/type-strike-backend/internal/models"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// PlayerRepository handles database operations for players.
type PlayerRepository struct {
	pool *pgxpool.Pool
}

// NewPlayerRepository creates a new PlayerRepository.
func NewPlayerRepository(pool *pgxpool.Pool) *PlayerRepository {
	return &PlayerRepository{pool: pool}
}

// Create inserts a new player and returns the created player with defaults.
func (r *PlayerRepository) Create(ctx context.Context, req models.CreatePlayerRequest) (*models.Player, error) {
	title := req.Title
	if title == "" {
		title = "RECRUIT"
	}
	level := req.Level
	if level < 1 {
		level = 1
	}

	var p models.Player
	err := r.pool.QueryRow(ctx,
		`INSERT INTO players (level, title, xp, total_stars, streak_count)
		 VALUES ($1, $2, 0, 0, 0)
		 RETURNING id, player_uuid, level, title, xp, total_stars, created_at, last_played_at, streak_count, last_streak_date`,
		level, title,
	).Scan(&p.ID, &p.PlayerUUID, &p.Level, &p.Title, &p.XP, &p.TotalStars, &p.CreatedAt, &p.LastPlayedAt, &p.StreakCount, &p.LastStreakDate)
	if err != nil {
		return nil, fmt.Errorf("insert player: %w", err)
	}
	return &p, nil
}

// GetByID retrieves a player by their serial ID.
func (r *PlayerRepository) GetByID(ctx context.Context, id int) (*models.Player, error) {
	var p models.Player
	err := r.pool.QueryRow(ctx,
		`SELECT id, player_uuid, level, title, xp, total_stars, created_at, last_played_at, streak_count, last_streak_date
		 FROM players WHERE id = $1`, id,
	).Scan(&p.ID, &p.PlayerUUID, &p.Level, &p.Title, &p.XP, &p.TotalStars, &p.CreatedAt, &p.LastPlayedAt, &p.StreakCount, &p.LastStreakDate)
	if err == pgx.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("get player by id: %w", err)
	}
	return &p, nil
}

// GetByUUID retrieves a player by their UUID.
func (r *PlayerRepository) GetByUUID(ctx context.Context, uuid string) (*models.Player, error) {
	var p models.Player
	err := r.pool.QueryRow(ctx,
		`SELECT id, player_uuid, level, title, xp, total_stars, created_at, last_played_at, streak_count, last_streak_date
		 FROM players WHERE player_uuid = $1`, uuid,
	).Scan(&p.ID, &p.PlayerUUID, &p.Level, &p.Title, &p.XP, &p.TotalStars, &p.CreatedAt, &p.LastPlayedAt, &p.StreakCount, &p.LastStreakDate)
	if err == pgx.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("get player by uuid: %w", err)
	}
	return &p, nil
}

// Update applies partial updates to a player.
func (r *PlayerRepository) Update(ctx context.Context, id int, req models.UpdatePlayerRequest) (*models.Player, error) {
	// Build dynamic update
	setClauses := []string{}
	args := []interface{}{}
	argIdx := 1

	if req.Level != nil {
		setClauses = append(setClauses, fmt.Sprintf("level = $%d", argIdx))
		args = append(args, *req.Level)
		argIdx++
	}
	if req.Title != nil {
		setClauses = append(setClauses, fmt.Sprintf("title = $%d", argIdx))
		args = append(args, *req.Title)
		argIdx++
	}
	if req.XP != nil {
		setClauses = append(setClauses, fmt.Sprintf("xp = $%d", argIdx))
		args = append(args, *req.XP)
		argIdx++
	}
	if req.TotalStars != nil {
		setClauses = append(setClauses, fmt.Sprintf("total_stars = $%d", argIdx))
		args = append(args, *req.TotalStars)
		argIdx++
	}

	if len(setClauses) == 0 {
		return r.GetByID(ctx, id)
	}

	setClauses = append(setClauses, fmt.Sprintf("last_played_at = $%d", argIdx))
	args = append(args, time.Now())
	argIdx++

	args = append(args, id)

	query := fmt.Sprintf(
		`UPDATE players SET %s WHERE id = $%d
		 RETURNING id, player_uuid, level, title, xp, total_stars, created_at, last_played_at, streak_count, last_streak_date`,
		joinClauses(setClauses), argIdx,
	)

	var p models.Player
	err := r.pool.QueryRow(ctx, query, args...).Scan(
		&p.ID, &p.PlayerUUID, &p.Level, &p.Title, &p.XP, &p.TotalStars, &p.CreatedAt, &p.LastPlayedAt, &p.StreakCount, &p.LastStreakDate,
	)
	if err != nil {
		return nil, fmt.Errorf("update player: %w", err)
	}
	return &p, nil
}

// AddXP adds XP to a player and handles level-up logic.
// Returns the updated player and whether they levelled up.
func (r *PlayerRepository) AddXP(ctx context.Context, playerID, xp int) (*models.Player, bool, error) {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return nil, false, fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback(ctx)

	var p models.Player
	err = tx.QueryRow(ctx,
		`SELECT id, player_uuid, level, title, xp, total_stars, created_at, last_played_at
		 FROM players WHERE id = $1 FOR UPDATE`, playerID,
	).Scan(&p.ID, &p.PlayerUUID, &p.Level, &p.Title, &p.XP, &p.TotalStars, &p.CreatedAt, &p.LastPlayedAt)
	if err != nil {
		return nil, false, fmt.Errorf("get player for update: %w", err)
	}

	newXP := p.XP + xp
	leveledUp := false

	for {
		xpRequired := models.XPForNextLevel(p.Level)
		// No hard cap — player level can rise indefinitely as more levels are added.
		if newXP >= xpRequired {
			newXP -= xpRequired
			p.Level++
			leveledUp = true
		} else {
			break
		}
	}

	p.XP = newXP
	_, err = tx.Exec(ctx,
		`UPDATE players SET xp = $1, level = $2, last_played_at = $3 WHERE id = $4`,
		p.XP, p.Level, time.Now(), playerID,
	)
	if err != nil {
		return nil, false, fmt.Errorf("update player xp: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, false, fmt.Errorf("commit tx: %w", err)
	}

	return &p, leveledUp, nil
}

// UpdateStreak updates the player's daily streak after playing a level.
// Rules:
//   - If last_streak_date is yesterday: increment streak
//   - If last_streak_date is today: keep streak (already played today)
//   - If last_streak_date is older (or null/new player): reset streak to 1
//   - Returns the current streak count.
func (r *PlayerRepository) UpdateStreak(ctx context.Context, playerID int) (int, error) {
	today := time.Now().Truncate(24 * time.Hour)
	yesterday := today.AddDate(0, 0, -1)

	var lastDate *time.Time
	var currentStreak int
	err := r.pool.QueryRow(ctx,
		`SELECT last_streak_date, streak_count FROM players WHERE id = $1`, playerID,
	).Scan(&lastDate, &currentStreak)
	if err != nil {
		return 0, fmt.Errorf("get streak data: %w", err)
	}

	newStreak := 1
	if lastDate != nil {
		lastDay := lastDate.Truncate(24 * time.Hour)
		if lastDay.Equal(today) {
			// Already played today — keep streak
			newStreak = currentStreak
		} else if lastDay.Equal(yesterday) {
			// Played yesterday — increment streak
			newStreak = currentStreak + 1
		}
		// else: played before yesterday — reset streak to 1
	}

	_, err = r.pool.Exec(ctx,
		`UPDATE players SET streak_count = $1, last_streak_date = $2 WHERE id = $3`,
		newStreak, today, playerID,
	)
	if err != nil {
		return 0, fmt.Errorf("update streak: %w", err)
	}

	return newStreak, nil
}
