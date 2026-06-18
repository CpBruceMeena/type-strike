package handler

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/cpbrucemeena/type-strike-backend/internal/models"
	"github.com/cpbrucemeena/type-strike-backend/internal/repository"
	"github.com/go-chi/chi/v5"
)

// ActivityHandler handles HTTP requests for the activity feed.
type ActivityHandler struct {
	repo *repository.Repositories
}

// NewActivityHandler creates a new ActivityHandler.
func NewActivityHandler(repo *repository.Repositories) *ActivityHandler {
	return &ActivityHandler{repo: repo}
}

// Record handles POST /api/v1/players/{playerId}/activity
func (h *ActivityHandler) Record(w http.ResponseWriter, r *http.Request) {
	playerID, err := strconv.Atoi(chi.URLParam(r, "playerId"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_PLAYER_ID", "Player ID must be a number")
		return
	}

	var req models.RecordActivityRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_JSON", "Invalid request body")
		return
	}
	req.PlayerID = playerID

	activity, err := h.repo.Activity.Record(r.Context(), req)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "RECORD_FAILED", "Failed to record activity")
		return
	}

	writeJSON(w, http.StatusCreated, activity)
}

// GetRecent handles GET /api/v1/players/{playerId}/activity
func (h *ActivityHandler) GetRecent(w http.ResponseWriter, r *http.Request) {
	playerID, err := strconv.Atoi(chi.URLParam(r, "playerId"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_PLAYER_ID", "Player ID must be a number")
		return
	}

	activity, err := h.repo.Activity.GetRecent(r.Context(), playerID, 20)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "FETCH_FAILED", "Failed to fetch activity")
		return
	}

	if activity == nil {
		activity = []models.Activity{}
	}

	writeJSON(w, http.StatusOK, activity)
}
