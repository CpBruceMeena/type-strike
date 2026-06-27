package handler

import (
	"encoding/json"
	"log/slog"
	"net/http"
	"strconv"

	"github.com/cpbrucemeena/type-strike-backend/internal/models"
	"github.com/cpbrucemeena/type-strike-backend/internal/repository"
	"github.com/go-chi/chi/v5"
)

// LeaderboardHandler handles HTTP requests for leaderboard operations.
type LeaderboardHandler struct {
	repo *repository.Repositories
}

// NewLeaderboardHandler creates a new LeaderboardHandler.
func NewLeaderboardHandler(repo *repository.Repositories) *LeaderboardHandler {
	return &LeaderboardHandler{repo: repo}
}

// GetTop handles GET /api/v1/leaderboard
// Returns the top N players ordered by XP (default 50, max 100).
func (h *LeaderboardHandler) GetTop(w http.ResponseWriter, r *http.Request) {
	limitStr := r.URL.Query().Get("limit")
	limit := 50
	if limitStr != "" {
		if parsed, err := strconv.Atoi(limitStr); err == nil && parsed > 0 {
			limit = parsed
		}
	}
	if limit > 100 {
		limit = 100
	}

	entries, totalCount, err := h.repo.Leaderboard.GetTop(r.Context(), limit)
	if err != nil {
		slog.Default().Error("failed to fetch leaderboard", "error", err)
		writeError(w, http.StatusInternalServerError, "FETCH_FAILED", "Failed to fetch leaderboard")
		return
	}

	writeJSON(w, http.StatusOK, &models.LeaderboardResponse{
		Entries:    entries,
		TotalCount: totalCount,
	})
}

// GetPlayerRank handles GET /api/v1/leaderboard/{playerId}
// Returns a specific player's rank with nearby competitors.
func (h *LeaderboardHandler) GetPlayerRank(w http.ResponseWriter, r *http.Request) {
	playerID, err := strconv.Atoi(chi.URLParam(r, "playerId"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_PLAYER_ID", "Player ID must be a number")
		return
	}

	playerRank, err := h.repo.Leaderboard.GetPlayerRank(r.Context(), playerID)
	if err != nil {
		slog.Default().Error("failed to fetch player rank", "error", err)
		writeError(w, http.StatusInternalServerError, "FETCH_FAILED", "Failed to fetch player rank")
		return
	}
	if playerRank == nil {
		writeError(w, http.StatusNotFound, "NOT_FOUND", "Player not found on leaderboard. Sync their stats first.")
		return
	}

	writeJSON(w, http.StatusOK, playerRank)
}

// GetDailyTop handles GET /api/v1/leaderboard/daily
// Returns today's aggregated daily challenge rankings.
func (h *LeaderboardHandler) GetDailyTop(w http.ResponseWriter, r *http.Request) {
	limitStr := r.URL.Query().Get("limit")
	limit := 50
	if limitStr != "" {
		if parsed, err := strconv.Atoi(limitStr); err == nil && parsed > 0 {
			limit = parsed
		}
	}
	if limit > 100 {
		limit = 100
	}

	entries, totalCount, err := h.repo.Leaderboard.GetDailyRankings(r.Context(), limit)
	if err != nil {
		slog.Default().Error("failed to fetch daily leaderboard", "error", err)
		writeError(w, http.StatusInternalServerError, "FETCH_FAILED", "Failed to fetch daily leaderboard")
		return
	}

	writeJSON(w, http.StatusOK, &models.LeaderboardResponse{
		Entries:    entries,
		TotalCount: totalCount,
	})
}

// Sync handles POST /api/v1/leaderboard/sync
// Refreshes the leaderboard entry for a specific player.
// Accepts: { "player_id": 1 }
func (h *LeaderboardHandler) Sync(w http.ResponseWriter, r *http.Request) {
	var req struct {
		PlayerID int `json:"player_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_JSON", "Invalid request body")
		return
	}

	if err := h.repo.Leaderboard.SyncPlayer(r.Context(), req.PlayerID); err != nil {
		slog.Default().Error("failed to sync leaderboard", "player_id", req.PlayerID, "error", err)
		writeError(w, http.StatusInternalServerError, "SYNC_FAILED", "Failed to sync leaderboard entry")
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"status":    "synced",
		"player_id": req.PlayerID,
	})
}
