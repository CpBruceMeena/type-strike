package handler

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/cpbrucemeena/type-strike-backend/internal/models"
	"github.com/cpbrucemeena/type-strike-backend/internal/repository"
	"github.com/go-chi/chi/v5"
)

// SettingsHandler handles HTTP requests for player settings.
type SettingsHandler struct {
	repo *repository.Repositories
}

// NewSettingsHandler creates a new SettingsHandler.
func NewSettingsHandler(repo *repository.Repositories) *SettingsHandler {
	return &SettingsHandler{repo: repo}
}

// GetAll handles GET /api/v1/players/{playerId}/settings
func (h *SettingsHandler) GetAll(w http.ResponseWriter, r *http.Request) {
	playerID, err := strconv.Atoi(chi.URLParam(r, "playerId"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_PLAYER_ID", "Player ID must be a number")
		return
	}

	settings, err := h.repo.Settings.GetAll(r.Context(), playerID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "FETCH_FAILED", "Failed to fetch settings")
		return
	}

	writeJSON(w, http.StatusOK, settings)
}

// BatchUpdate handles PUT /api/v1/players/{playerId}/settings
func (h *SettingsHandler) BatchUpdate(w http.ResponseWriter, r *http.Request) {
	playerID, err := strconv.Atoi(chi.URLParam(r, "playerId"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_PLAYER_ID", "Player ID must be a number")
		return
	}

	var req models.BatchUpdateSettingsRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_JSON", "Invalid request body")
		return
	}

	settings, err := h.repo.Settings.BatchUpdate(r.Context(), playerID, req)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "UPDATE_FAILED", "Failed to update settings")
		return
	}

	writeJSON(w, http.StatusOK, settings)
}
