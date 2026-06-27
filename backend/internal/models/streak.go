package models

// ── Streak Reward Definition (static config) ───────────

// StreakReward defines the reward for a specific streak day range.
type StreakReward struct {
	ID          int    `json:"id" gorm:"primaryKey;autoIncrement"`
	DayStart    int    `json:"day_start" gorm:"column:day_start;index"`
	DayEnd      int    `json:"day_end" gorm:"column:day_end"`
	RewardType  string `json:"reward_type" gorm:"column:reward_type;size:30"`
	RewardValue int    `json:"reward_value" gorm:"column:reward_value"`
	Icon        string `json:"icon" gorm:"size:10;default:'🔥'"`
	Description string `json:"description" gorm:"type:text"`
}

func (StreakReward) TableName() string { return "streak_rewards" }

// ── Response Types ─────────────────────────────────────

// StreakInfoResponse is returned by GET /api/v1/players/{id}/streak.
type StreakInfoResponse struct {
	StreakCount         int            `json:"streak_count"`
	LastStreakDate      *string        `json:"last_streak_date,omitempty"`
	LastClaimedDay      int            `json:"last_claimed_day"`
	StreakFreezes       int            `json:"streak_freezes"`
	TotalDaysClaimed    int            `json:"total_days_claimed"`
	TodayAvailable      bool           `json:"today_available"`
	FreezeAvailable     bool           `json:"freeze_available"`
	Calendar            []StreakDay    `json:"calendar"`
}

// StreakDay represents a single day in the 7-day rolling streak calendar.
type StreakDay struct {
	DayNumber    int    `json:"day_number"`
	Label        string `json:"label"`        // "DAY 1", "DAY 2", ..., "TODAY", "TOMORROW"
	IsPast       bool   `json:"is_past"`
	IsToday      bool   `json:"is_today"`
	IsFuture     bool   `json:"is_future"`
	IsClaimed    bool   `json:"is_claimed"`
	IsFreezeUsed bool   `json:"is_freeze_used"`
	Reward       *struct {
		Type           string `json:"type"`
		Value          int    `json:"value"`
		Icon           string `json:"icon"`
		Description    string `json:"description"`
	} `json:"reward,omitempty"`
}

// ClaimRewardResponse is returned by POST /api/v1/players/{id}/streak/claim.
type ClaimRewardResponse struct {
	Claimed        bool   `json:"claimed"`
	DayNumber      int    `json:"day_number"`
	StreakCount    int    `json:"streak_count"`
	RewardType     string `json:"reward_type"`
	RewardValue    int    `json:"reward_value"`
	RewardIcon     string `json:"reward_icon"`
	XPAdded        int    `json:"xp_added"`
	StarsAdded     int    `json:"stars_added"`
	FreezeToken    bool   `json:"freeze_token"`
	TotalXP        int    `json:"total_xp"`
	TotalStars     int    `json:"total_stars"`
	FreezesNow     int    `json:"freezes_now"`
	NextReward     *struct {
		Type        string `json:"type"`
		Value       int    `json:"value"`
		Icon        string `json:"icon"`
		Description string `json:"description"`
	} `json:"next_reward,omitempty"`
}

// UseStreakFreezeResponse is returned by POST /api/v1/players/{id}/streak/freeze.
type UseStreakFreezeResponse struct {
	Used              bool   `json:"used"`
	RemainingFreezes  int    `json:"remaining_freezes"`
	StreakCount       int    `json:"streak_count"`
	StreakPreserved   bool   `json:"streak_preserved"`
}
