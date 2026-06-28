package handler

import (
	"log/slog"
	"net/http"
	"strconv"

	"github.com/cpbrucemeena/type-strike-backend/internal/repository"
	"github.com/go-chi/chi/v5"
)

// StreakHandler handles HTTP requests for daily streak rewards.
type StreakHandler struct {
	repo *repository.Repositories
}

// NewStreakHandler creates a new StreakHandler.
func NewStreakHandler(repo *repository.Repositories) *StreakHandler {
	return &StreakHandler{repo: repo}
}

// GetStreakInfo handles GET /api/v1/players/{id}/streak
// Returns the player's streak state and 7-day reward calendar.
func (h *StreakHandler) GetStreakInfo(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(chi.URLParam(r, "playerId"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_ID", "Player ID must be a number")
		return
	}

	info, err := h.repo.Streak.GetStreakInfo(r.Context(), id)
	if err != nil {
		slog.Default().Error("failed to get streak info", "player_id", id, "error", err)
		writeError(w, http.StatusInternalServerError, "FETCH_FAILED", "Failed to fetch streak info")
		return
	}

	writeJSON(w, http.StatusOK, info)
}

// ClaimDailyReward handles POST /api/v1/players/{id}/streak/claim
// Claims today's streak reward for the player.
func (h *StreakHandler) ClaimDailyReward(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(chi.URLParam(r, "playerId"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_ID", "Player ID must be a number")
		return
	}

	result, err := h.repo.Streak.ClaimDailyReward(r.Context(), id)
	if err != nil {
		slog.Default().Error("failed to claim daily reward", "player_id", id, "error", err)
		writeError(w, http.StatusInternalServerError, "CLAIM_FAILED", "Failed to claim daily reward")
		return
	}

	writeJSON(w, http.StatusOK, result)
}

// UseStreakFreeze handles POST /api/v1/players/{id}/streak/freeze
// Uses a streak freeze to preserve today's streak.
func (h *StreakHandler) UseStreakFreeze(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(chi.URLParam(r, "playerId"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_ID", "Player ID must be a number")
		return
	}

	result, err := h.repo.Streak.UseStreakFreeze(r.Context(), id)
	if err != nil {
		slog.Default().Error("failed to use streak freeze", "player_id", id, "error", err)
		writeError(w, http.StatusInternalServerError, "FREEZE_FAILED", "Failed to use streak freeze")
		return
	}

	writeJSON(w, http.StatusOK, result)
}
