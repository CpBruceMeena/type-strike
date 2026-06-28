package repository

import (
	"context"
	"fmt"
	"time"

	"github.com/cpbrucemeena/type-strike-backend/internal/models"
	"gorm.io/gorm"
)

// StreakRewardConfig defines the static reward schedule (day range → reward).
// Order matters: ranges are checked top-to-bottom.
var StreakRewardConfig = []struct {
	DayStart    int
	DayEnd      int
	RewardType  string
	RewardValue int
	Icon        string
	Description string
}{
	{1, 3, "xp", 25, "🔥", "+25 XP"},
	{4, 7, "xp_stars", 50, "⚡", "+50 XP + 1 Star"},
	{8, 14, "xp_stars", 75, "💎", "+75 XP + 2 Stars"},
	{15, 21, "xp_stars_freeze", 100, "❄️", "+100 XP + 3 Stars + Freeze Token"},
	{22, 30, "xp_stars_freeze", 150, "🌟", "+150 XP + 5 Stars + Freeze Token"},
	{31, 999999, "xp_stars_freeze", 200, "👑", "+200 XP + 10 Stars + Freeze Token"},
}

// GetRewardForDay returns the reward config for a given streak day number.
func GetRewardForDay(dayNumber int) struct {
	DayStart    int
	DayEnd      int
	RewardType  string
	RewardValue int
	Icon        string
	Description string
} {
	for _, r := range StreakRewardConfig {
		if dayNumber >= r.DayStart && dayNumber <= r.DayEnd {
			return r
		}
	}
	// Fallback to last tier
	return StreakRewardConfig[len(StreakRewardConfig)-1]
}

// StreakRepository handles database operations for the daily streak rewards system.
type StreakRepository struct {
	db *gorm.DB
}

// NewStreakRepository creates a new StreakRepository.
func NewStreakRepository(db *gorm.DB) *StreakRepository {
	return &StreakRepository{db: db}
}

// GetStreakInfo returns the player's current streak state and the 7-day reward calendar.
func (r *StreakRepository) GetStreakInfo(ctx context.Context, playerID int) (*models.StreakInfoResponse, error) {
	player, err := r.getPlayer(ctx, playerID)
	if err != nil {
		return nil, err
	}
	if player == nil {
		return nil, fmt.Errorf("player not found")
	}

	today := time.Now().Truncate(24 * time.Hour)
	lastDateStr := ""
	if player.LastStreakDate != nil {
		lastDateStr = player.LastStreakDate.Format("2006-01-02")
	}

	// Determine if today is available to claim
	todayAvailable := false
	if player.LastStreakDate != nil {
		lastDay := player.LastStreakDate.Truncate(24 * time.Hour)
		yesterday := today.AddDate(0, 0, -1)

		if lastDay.Equal(today) && player.StreakCount > 0 {
			// Played a game today — reward claimable if not already claimed
			todayAvailable = player.LastClaimedDay < player.StreakCount
		} else if lastDay.Equal(yesterday) {
			// Played yesterday — streak is still alive, reward claimable
			todayAvailable = player.LastClaimedDay < player.StreakCount
		} else if player.StreakFreezes > 0 {
			// Streak would break, but player has freeze tokens
			todayAvailable = true
		}
	} else {
		// No streak yet — first time
		todayAvailable = true
	}

	// Build the 7-day rolling calendar
	calendar := r.buildCalendar(player, today)

	return &models.StreakInfoResponse{
		StreakCount:      player.StreakCount,
		LastStreakDate:   &lastDateStr,
		LastClaimedDay:   player.LastClaimedDay,
		StreakFreezes:    player.StreakFreezes,
		TotalDaysClaimed: player.TotalDaysClaimed,
		TodayAvailable:   todayAvailable,
		FreezeAvailable:  player.StreakFreezes > 0,
		Calendar:         calendar,
	}, nil
}

// buildCalendar creates a 7-day rolling calendar starting from the "day after last claimed" to show upcoming rewards.
func (r *StreakRepository) buildCalendar(player *models.Player, today time.Time) []models.StreakDay {
	calendar := []models.StreakDay{}

	// The "base day" for the calendar view — show days around the current streak
	streakDay := player.StreakCount
	if streakDay < 1 {
		streakDay = 0
	}

	// Show days: past 3 (if available), today, and next 3 upcoming
	for offset := -3; offset <= 3; offset++ {
		dayNumber := streakDay + offset
		if dayNumber < 1 {
			continue // don't show negative days
		}

		isToday := offset == 0
		isPast := offset < 0
		isFuture := offset > 0
		isClaimed := false
		isFreezeUsed := false

		if isPast || isToday {
			if dayNumber <= player.LastClaimedDay {
				isClaimed = true
			}
		}

		dayLabel := fmt.Sprintf("DAY %d", dayNumber)
		if isToday {
			dayLabel = "TODAY"
		} else if offset == 1 {
			dayLabel = "TOMORROW"
		}

		day := models.StreakDay{
			DayNumber:    dayNumber,
			Label:        dayLabel,
			IsPast:       isPast,
			IsToday:      isToday,
			IsFuture:     isFuture,
			IsClaimed:    isClaimed,
			IsFreezeUsed: isFreezeUsed,
		}

		// Attach reward info
		reward := GetRewardForDay(dayNumber)
		day.Reward = &struct {
			Type        string `json:"type"`
			Value       int    `json:"value"`
			Icon        string `json:"icon"`
			Description string `json:"description"`
		}{
			Type:        reward.RewardType,
			Value:       reward.RewardValue,
			Icon:        reward.Icon,
			Description: reward.Description,
		}

		calendar = append(calendar, day)
	}

	return calendar
}

// ClaimDailyReward claims today's reward for the player.
// It awards XP, Stars, and/or Freeze Tokens based on the current streak day.
func (r *StreakRepository) ClaimDailyReward(ctx context.Context, playerID int) (*models.ClaimRewardResponse, error) {
	player, err := r.getPlayer(ctx, playerID)
	if err != nil {
		return nil, err
	}
	if player == nil {
		return nil, fmt.Errorf("player not found")
	}

	// Can't claim if already claimed today
	if player.LastClaimedDay >= player.StreakCount {
		return &models.ClaimRewardResponse{
			Claimed:   false,
			DayNumber: player.StreakCount,
		}, nil
	}

	// Determine the reward for the current streak day
	claimDay := player.StreakCount
	reward := GetRewardForDay(claimDay)

	xpAdded := 0
	starsAdded := 0
	freezeToken := false

	switch reward.RewardType {
	case "xp":
		xpAdded = reward.RewardValue
	case "xp_stars":
		xpAdded = reward.RewardValue
		starsAdded = 1
	case "xp_stars_freeze":
		xpAdded = reward.RewardValue
		// Explicit stars by day range to match configured descriptions
		switch {
		case claimDay >= 8 && claimDay <= 14:
			starsAdded = 2
		case claimDay >= 15 && claimDay <= 21:
			starsAdded = 3
		case claimDay >= 22 && claimDay <= 30:
			starsAdded = 5
		default: // 31+
			starsAdded = 10
		}
		freezeToken = true
	}

	today := time.Now().Truncate(24 * time.Hour)

	// Update player in transaction
	err = r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		updates := map[string]interface{}{
			"last_claimed_day":   claimDay,
			"total_days_claimed": player.TotalDaysClaimed + 1,
			"xp":                 player.XP + xpAdded,
			"total_stars":        player.TotalStars + starsAdded,
			"last_streak_date":   today,
		}

		if freezeToken {
			updates["streak_freezes"] = player.StreakFreezes + 1
		}

		return tx.Model(&models.Player{}).Where("id = ?", playerID).Updates(updates).Error
	})
	if err != nil {
		return nil, fmt.Errorf("claim daily reward: %w", err)
	}

	// Fetch updated player
	player, _ = r.getPlayer(ctx, playerID)

	// Determine next reward
	nextDay := claimDay + 1
	nextReward := GetRewardForDay(nextDay)
	nextRewardInfo := &struct {
		Type        string `json:"type"`
		Value       int    `json:"value"`
		Icon        string `json:"icon"`
		Description string `json:"description"`
	}{
		Type:        nextReward.RewardType,
		Value:       nextReward.RewardValue,
		Icon:        nextReward.Icon,
		Description: nextReward.Description,
	}

	return &models.ClaimRewardResponse{
		Claimed:      true,
		DayNumber:    claimDay,
		StreakCount:  player.StreakCount,
		RewardType:   reward.RewardType,
		RewardValue:  reward.RewardValue,
		RewardIcon:   reward.Icon,
		XPAdded:      xpAdded,
		StarsAdded:   starsAdded,
		FreezeToken:  freezeToken,
		TotalXP:      player.XP,
		TotalStars:   player.TotalStars,
		FreezesNow:   player.StreakFreezes,
		NextReward:   nextRewardInfo,
	}, nil
}

// UseStreakFreeze consumes a streak freeze to preserve the streak for today.
func (r *StreakRepository) UseStreakFreeze(ctx context.Context, playerID int) (*models.UseStreakFreezeResponse, error) {
	player, err := r.getPlayer(ctx, playerID)
	if err != nil {
		return nil, err
	}
	if player == nil {
		return nil, fmt.Errorf("player not found")
	}

	if player.StreakFreezes <= 0 {
		return &models.UseStreakFreezeResponse{
			Used:             false,
			RemainingFreezes: 0,
			StreakCount:      player.StreakCount,
			StreakPreserved:  false,
		}, nil
	}

	today := time.Now().Truncate(24 * time.Hour)

	err = r.db.WithContext(ctx).Model(&models.Player{}).Where("id = ?", playerID).Updates(map[string]interface{}{
		"streak_freezes":    player.StreakFreezes - 1,
		"last_streak_date": today,
		// Don't increment streak count — freeze just preserves it
	}).Error
	if err != nil {
		return nil, fmt.Errorf("use streak freeze: %w", err)
	}

	return &models.UseStreakFreezeResponse{
		Used:             true,
		RemainingFreezes: player.StreakFreezes - 1,
		StreakCount:      player.StreakCount,
		StreakPreserved:  true,
	}, nil
}

// getPlayer is a helper to fetch a player by ID.
func (r *StreakRepository) getPlayer(ctx context.Context, id int) (*models.Player, error) {
	var p models.Player
	err := r.db.WithContext(ctx).First(&p, id).Error
	if err == gorm.ErrRecordNotFound {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("get player: %w", err)
	}
	return &p, nil
}
