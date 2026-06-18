package repository

import (
	"strings"

	"github.com/jackc/pgx/v5/pgxpool"
)

// Repositories bundles all repository instances for easy dependency injection.
type Repositories struct {
	Player          *PlayerRepository
	LevelProgress   *LevelProgressRepository
	Activity        *ActivityRepository
	Settings        *SettingsRepository
	Analytics       *AnalyticsRepository
	DailyChallenge  *DailyChallengeRepository
}

// NewRepositories creates all repository instances from a single connection pool.
func NewRepositories(pool *pgxpool.Pool) *Repositories {
	return &Repositories{
		Player:          NewPlayerRepository(pool),
		LevelProgress:   NewLevelProgressRepository(pool),
		Activity:        NewActivityRepository(pool),
		Settings:        NewSettingsRepository(pool),
		Analytics:       NewAnalyticsRepository(pool),
		DailyChallenge:  NewDailyChallengeRepository(pool),
	}
}

// joinClauses joins SQL SET clause strings with comma separators.
func joinClauses(clauses []string) string {
	return strings.Join(clauses, ", ")
}
