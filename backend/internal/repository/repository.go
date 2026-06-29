package repository

import (
	"gorm.io/gorm"
)

// Repositories bundles all repository instances for easy dependency injection.
type Repositories struct {
	Player          *PlayerRepository
	LevelProgress   *LevelProgressRepository
	LevelConfig     *LevelRepository
	Activity        *ActivityRepository
	Settings        *SettingsRepository
	Analytics       *AnalyticsRepository
	DailyChallenge  *DailyChallengeRepository
	Leaderboard     *LeaderboardRepository
	Game            *GameRepository
	Contest         *ContestRepository
	LessonProgress  *LessonProgressRepository
	Progression     *ProgressionRepository
	Achievement     *AchievementRepository
	Streak          *StreakRepository
	Feedback        *FeedbackRepository
}

// NewRepositories creates all repository instances from a single GORM DB connection.
func NewRepositories(db *gorm.DB) *Repositories {
	return &Repositories{
		Player:          NewPlayerRepository(db),
		LevelProgress:   NewLevelProgressRepository(db),
		LevelConfig:     NewLevelRepository(db),
		Activity:        NewActivityRepository(db),
		Settings:        NewSettingsRepository(db),
		Analytics:       NewAnalyticsRepository(db),
		DailyChallenge:  NewDailyChallengeRepository(db),
		Leaderboard:     NewLeaderboardRepository(db),
		Game:            NewGameRepository(db),
		Contest:         NewContestRepository(db),
		LessonProgress:  NewLessonProgressRepository(db),
		Progression:     NewProgressionRepository(db),
		Achievement:     NewAchievementRepository(db),
		Streak:          NewStreakRepository(db),
		Feedback:        NewFeedbackRepository(db),
	}
}
