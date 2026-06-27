package handler

import (
	"log/slog"
	"net/http"
	"strconv"

	"github.com/cpbrucemeena/type-strike-backend/internal/repository"
	"github.com/go-chi/chi/v5"
)

// AchievementHandler handles HTTP requests for the achievements system.
type AchievementHandler struct {
	repo *repository.Repositories
}

// NewAchievementHandler creates a new AchievementHandler.
func NewAchievementHandler(repo *repository.Repositories) *AchievementHandler {
	return &AchievementHandler{repo: repo}
}

// GetAllAchievements handles GET /api/v1/players/{playerId}/achievements
// Returns all achievements with the player's progress for each.
func (h *AchievementHandler) GetAllAchievements(w http.ResponseWriter, r *http.Request) {
	playerID, err := strconv.Atoi(chi.URLParam(r, "playerId"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_PLAYER_ID", "Player ID must be a number")
		return
	}

	response, err := h.repo.Achievement.GetAllPlayerAchievements(r.Context(), playerID)
	if err != nil {
		slog.Default().Error("failed to fetch achievements", "player_id", playerID, "error", err)
		writeError(w, http.StatusInternalServerError, "FETCH_FAILED", "Failed to fetch achievements")
		return
	}

	writeJSON(w, http.StatusOK, response)
}

// CheckAchievements handles POST /api/v1/players/{playerId}/achievements/check
// Runs achievement checks based on the provided game/level completion data.
// Request body: { "wpm": 65, "accuracy": 95.5, "max_combo": 30, "levels_cleared": 10, "streak_count": 3 }
// This endpoint is called after completing a game or level to detect new unlocks.
func (h *AchievementHandler) CheckAchievements(w http.ResponseWriter, r *http.Request) {
	playerID, err := strconv.Atoi(chi.URLParam(r, "playerId"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_PLAYER_ID", "Player ID must be a number")
		return
	}

	var params struct {
		WPM           int     `json:"wpm"`
		Accuracy      float64 `json:"accuracy"`
		MaxCombo      int     `json:"max_combo"`
		LevelsCleared int     `json:"levels_cleared"`
		StreakCount   int     `json:"streak_count"`
		ContestRank   int     `json:"contest_rank"`
	}

	// Body is optional — if empty we just run checks on current player state
	if err := decodeJSON(r, &params); err != nil && err.Error() != "EOF" {
		// Only error if it's not an empty body
		writeError(w, http.StatusBadRequest, "INVALID_JSON", "Invalid request body")
		return
	}

	// If levels_cleared is not provided, fetch from DB
	if params.LevelsCleared == 0 {
		count, err := h.repo.LevelProgress.GetCompletedCount(r.Context(), playerID)
		if err == nil {
			params.LevelsCleared = count
		}
	}

	achParams := repository.AchievementCheckParams{
		WPM:           params.WPM,
		Accuracy:      params.Accuracy,
		MaxCombo:      params.MaxCombo,
		LevelsCleared: params.LevelsCleared,
		StreakCount:   params.StreakCount,
		ContestRank:   params.ContestRank,
	}

	result := h.repo.Achievement.CheckAllAchievements(r.Context(), playerID, achParams)

	writeJSON(w, http.StatusOK, result)
}

// GetUnlockedCount handles GET /api/v1/players/{playerId}/achievements/count
// Returns just the count of unlocked achievements (for sidebar badge).
func (h *AchievementHandler) GetUnlockedCount(w http.ResponseWriter, r *http.Request) {
	playerID, err := strconv.Atoi(chi.URLParam(r, "playerId"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_PLAYER_ID", "Player ID must be a number")
		return
	}

	unlockedCount, err := h.repo.Achievement.GetUnlockedCount(r.Context(), playerID)
	if err != nil {
		slog.Default().Error("failed to get unlocked count", "player_id", playerID, "error", err)
		writeError(w, http.StatusInternalServerError, "FETCH_FAILED", "Failed to fetch unlock count")
		return
	}

	totalCount, err := h.repo.Achievement.GetTotalAchievementCount(r.Context())
	if err != nil {
		slog.Default().Error("failed to get achievement total count", "error", err)
		writeError(w, http.StatusInternalServerError, "FETCH_FAILED", "Failed to fetch achievement count")
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"unlocked_count": unlockedCount,
		"total_count":    totalCount,
	})
}
