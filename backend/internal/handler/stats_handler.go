package handler

import (
	"net/http"
	"strconv"

	"github.com/cpbrucemeena/type-strike-backend/internal/repository"
	"github.com/go-chi/chi/v5"
)

// StatsHandler handles HTTP requests for aggregated player statistics.
type StatsHandler struct {
	repo *repository.Repositories
}

// NewStatsHandler creates a new StatsHandler.
func NewStatsHandler(repo *repository.Repositories) *StatsHandler {
	return &StatsHandler{repo: repo}
}

// GetExtendedStats handles GET /api/v1/players/{playerId}/extended-stats
// Returns aggregated statistics for the home page dashboard.
func (h *StatsHandler) GetExtendedStats(w http.ResponseWriter, r *http.Request) {
	playerID, err := strconv.Atoi(chi.URLParam(r, "playerId"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_PLAYER_ID", "Player ID must be a number")
		return
	}

	// Fetch all data in parallel using goroutines and channels
	type statsResult struct {
		totalGames   int
		totalXp      int
		avgAccuracy  float64
		bestByMode   map[string]int
		levelsDone   int
		activity     []map[string]interface{}
		dailyStats30 []map[string]interface{}
		err          error
	}

	result := statsResult{
		bestByMode: map[string]int{
			"level":      0,
			"timed_1min": 0,
			"timed_3min": 0,
			"timed_5min": 0,
			"contest":    0,
		},
	}

	// 1. Gather game history to compute total_games, best_wpm_by_mode, average_accuracy, total_xp
	history, _, err := h.repo.Game.GetHistory(r.Context(), playerID, "", 10000, 0)
	if err == nil {
		var accSum float64
		var accCount int

		for _, g := range history {
			result.totalGames++

			// Track best WPM per mode
			if g.WPM > result.bestByMode[g.Mode] {
				result.bestByMode[g.Mode] = g.WPM
			}

			// Sum accuracy for average
			if g.Accuracy > 0 {
				accSum += g.Accuracy
				accCount++
			}

			// Sum XP
			result.totalXp += g.XPEarned
		}

		if accCount > 0 {
			result.avgAccuracy = accSum / float64(accCount)
		}
	}

	// 2. Levels cleared count
	clearedCount, err := h.repo.LevelProgress.GetCompletedCount(r.Context(), playerID)
	if err == nil {
		result.levelsDone = clearedCount
	}

	// 3. Recent activity (last 10 events)
	activityEvents, err := h.repo.Activity.GetRecent(r.Context(), playerID, 10)
	if err == nil {
		for _, a := range activityEvents {
			entry := map[string]interface{}{
				"id":        a.ID,
				"player_id": a.PlayerID,
				"type":      a.Type,
				"timestamp": a.Timestamp,
			}
			if a.Metadata != nil {
				entry["metadata"] = a.Metadata
			}
			result.activity = append(result.activity, entry)
		}
	}

	// Build response
	resp := map[string]interface{}{
		"total_games":           result.totalGames,
		"total_levels_cleared":  result.levelsDone,
		"best_wpm_by_mode":      result.bestByMode,
		"average_accuracy":      result.avgAccuracy,
		"total_xp":              result.totalXp,
		"recent_activity":       result.activity,
		"daily_stats_30_days":   result.dailyStats30,
	}

	writeJSON(w, http.StatusOK, resp)
}
