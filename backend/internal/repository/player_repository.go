package repository

import (
	"context"
	"fmt"
	"math/rand"
	"time"

	"github.com/cpbrucemeena/type-strike-backend/internal/models"
	"gorm.io/gorm"
)

// PlayerRepository handles database operations for players.
type PlayerRepository struct {
	db *gorm.DB
}

// NewPlayerRepository creates a new PlayerRepository.
func NewPlayerRepository(db *gorm.DB) *PlayerRepository {
	return &PlayerRepository{db: db}
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

	p := models.Player{
		Level:     level,
		Title:     title,
		XP:        0,
		TotalStars: 0,
		StreakCount: 0,
	}

	if err := r.db.Create(&p).Error; err != nil {
		return nil, fmt.Errorf("insert player: %w", err)
	}
	return &p, nil
}

// GetByID retrieves a player by their serial ID.
func (r *PlayerRepository) GetByID(ctx context.Context, id int) (*models.Player, error) {
	var p models.Player
	err := r.db.WithContext(ctx).First(&p, id).Error
	if err == gorm.ErrRecordNotFound {
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
	err := r.db.WithContext(ctx).Where("player_uuid = ?", uuid).First(&p).Error
	if err == gorm.ErrRecordNotFound {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("get player by uuid: %w", err)
	}
	return &p, nil
}

// Update applies partial updates to a player.
func (r *PlayerRepository) Update(ctx context.Context, id int, req models.UpdatePlayerRequest) (*models.Player, error) {
	updates := map[string]interface{}{}
	if req.Level != nil {
		updates["level"] = *req.Level
	}
	if req.Title != nil {
		updates["title"] = *req.Title
	}
	if req.XP != nil {
		updates["xp"] = *req.XP
	}
	if req.TotalStars != nil {
		updates["total_stars"] = *req.TotalStars
	}
	updates["last_played_at"] = time.Now()

	if len(updates) == 0 {
		return r.GetByID(ctx, id)
	}

	var p models.Player
	err := r.db.WithContext(ctx).Model(&p).Where("id = ?", id).Updates(updates).Error
	if err != nil {
		return nil, fmt.Errorf("update player: %w", err)
	}
	return r.GetByID(ctx, id)
}

// GetByEmail retrieves a player by their email address.
func (r *PlayerRepository) GetByEmail(ctx context.Context, email string) (*models.Player, error) {
	var p models.Player
	err := r.db.WithContext(ctx).Where("email = ?", email).First(&p).Error
	if err == gorm.ErrRecordNotFound {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("get player by email: %w", err)
	}
	return &p, nil
}

// CreatePlayerByEmail creates a new player with email, player_tag, and display_name.
func (r *PlayerRepository) CreatePlayerByEmail(ctx context.Context, email, displayName string) (*models.Player, error) {
	tag, err := r.generatePlayerTag(ctx, email)
	if err != nil {
		return nil, fmt.Errorf("generate player tag: %w", err)
	}

	p := models.Player{
		Level:       1,
		Title:       "RECRUIT",
		Email:       email,
		PlayerTag:   tag,
		DisplayName: displayName,
	}

	if err := r.db.Create(&p).Error; err != nil {
		return nil, fmt.Errorf("insert player by email: %w", err)
	}
	return &p, nil
}

// generatePlayerTag creates an 8-char tag from the email (4 random letters + 4 random digits).
func (r *PlayerRepository) generatePlayerTag(ctx context.Context, email string) (string, error) {
	// Extract only alphabetic characters from email
	var letters []byte
	for i := 0; i < len(email); i++ {
		c := email[i]
		if (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') {
			letters = append(letters, c)
		}
	}
	if len(letters) < 4 {
		letters = []byte("type")
	}

	// Generate with collision retry
	for attempts := 0; attempts < 20; attempts++ {
		tag := make([]byte, 8)
		for i := 0; i < 4; i++ {
			tag[i] = letters[rand.Intn(len(letters))]
		}
		for i := 4; i < 8; i++ {
			tag[i] = byte('0' + rand.Intn(10))
		}
		tagStr := string(tag)

		// Per-attempt collision check against DB
		var count int64
		if err := r.db.WithContext(ctx).Model(&models.Player{}).Where("player_tag = ?", tagStr).Count(&count).Error; err != nil {
			return "", fmt.Errorf("check tag collision: %w", err)
		}
		if count == 0 {
			return tagStr, nil
		}
	}

	// Final fallback
	return fmt.Sprintf("ts%d", time.Now().UnixNano()%10000), nil
}

// AddXP adds XP to a player and handles level-up logic.
func (r *PlayerRepository) AddXP(ctx context.Context, playerID, xp int) (*models.Player, bool, error) {
	var p models.Player
	leveledUp := false
	err := r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Model(&models.Player{}).Where("id = ?", playerID).First(&p).Error; err != nil {
			return err
		}

		newXP := p.XP + xp

		for {
			xpRequired := models.XPForNextLevel(p.Level)
			if newXP >= xpRequired {
				newXP -= xpRequired
				p.Level++
				leveledUp = true
			} else {
				break
			}
		}

		p.XP = newXP

		updates := map[string]interface{}{
			"xp":             newXP,
			"level":          p.Level,
			"last_played_at": time.Now(),
		}
		return tx.Model(&models.Player{}).Where("id = ?", playerID).Updates(updates).Error
	})
	if err != nil {
		return nil, false, fmt.Errorf("add xp: %w", err)
	}
	return &p, leveledUp, nil
}

// UpdateDisplayName updates only the display_name of a player.
func (r *PlayerRepository) UpdateDisplayName(ctx context.Context, playerID int, displayName string) error {
	return r.db.WithContext(ctx).Model(&models.Player{}).
		Where("id = ?", playerID).
		Update("display_name", displayName).Error
}

// UpdateStreak updates the player's daily streak after playing a level.
func (r *PlayerRepository) UpdateStreak(ctx context.Context, playerID int) (int, error) {
	today := time.Now().Truncate(24 * time.Hour)
	yesterday := today.AddDate(0, 0, -1)

	var p models.Player
	if err := r.db.WithContext(ctx).Select("last_streak_date", "streak_count").Where("id = ?", playerID).First(&p).Error; err != nil {
		return 0, fmt.Errorf("get streak data: %w", err)
	}

	newStreak := 1
	if p.LastStreakDate != nil {
		lastDay := p.LastStreakDate.Truncate(24 * time.Hour)
		if lastDay.Equal(today) {
			newStreak = p.StreakCount
		} else if lastDay.Equal(yesterday) {
			newStreak = p.StreakCount + 1
		}
	}

	if err := r.db.WithContext(ctx).Model(&models.Player{}).Where("id = ?", playerID).Updates(map[string]interface{}{
		"streak_count":    newStreak,
		"last_streak_date": today,
	}).Error; err != nil {
		return 0, fmt.Errorf("update streak: %w", err)
	}

	return newStreak, nil
}
