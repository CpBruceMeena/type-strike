package handler

import (
	"log"
	"net/http"
	"strconv"

	"github.com/cpbrucemeena/type-strike-backend/internal/models"
	"github.com/cpbrucemeena/type-strike-backend/internal/repository"
	"github.com/go-chi/chi/v5"
)

// ProgressionHandler handles HTTP requests for the gamified progression system.
type ProgressionHandler struct {
	repo *repository.Repositories
}

// NewProgressionHandler creates a new ProgressionHandler.
func NewProgressionHandler(repo *repository.Repositories) *ProgressionHandler {
	return &ProgressionHandler{repo: repo}
}

// GetProgression handles GET /api/v1/players/{playerId}/progression
// Returns the player's full progression state: current tier, all tiers, unlocked titles/themes, next tier info.
func (h *ProgressionHandler) GetProgression(w http.ResponseWriter, r *http.Request) {
	playerID, err := strconv.Atoi(chi.URLParam(r, "playerId"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_PLAYER_ID", "Player ID must be a number")
		return
	}

	progression, err := h.repo.Progression.GetProgression(r.Context(), playerID)
	if err != nil {
		log.Printf("failed to get progression for player %d: %v", playerID, err)
		writeError(w, http.StatusInternalServerError, "FETCH_FAILED", "Failed to fetch progression data")
		return
	}

	writeJSON(w, http.StatusOK, progression)
}

// CheckUpgrade handles POST /api/v1/players/{playerId}/progression/check
// Checks if the player's current XP qualifies for a tier upgrade and processes it if so.
func (h *ProgressionHandler) CheckUpgrade(w http.ResponseWriter, r *http.Request) {
	playerID, err := strconv.Atoi(chi.URLParam(r, "playerId"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_PLAYER_ID", "Player ID must be a number")
		return
	}

	result, err := h.repo.Progression.CheckAndProcessUpgrade(r.Context(), playerID)
	if err != nil {
		log.Printf("failed to check tier upgrade for player %d: %v", playerID, err)
		writeError(w, http.StatusInternalServerError, "UPGRADE_FAILED", "Failed to check tier upgrade")
		return
	}

	writeJSON(w, http.StatusOK, result)
}

// GetAllTiers handles GET /api/v1/tiers
// Returns all rank tiers.
func (h *ProgressionHandler) GetAllTiers(w http.ResponseWriter, r *http.Request) {
	tiers, err := h.repo.Progression.GetAllTiers(r.Context())
	if err != nil {
		log.Printf("failed to fetch all tiers: %v", err)
		writeError(w, http.StatusInternalServerError, "FETCH_FAILED", "Failed to fetch tiers")
		return
	}

	if tiers == nil {
		tiers = []models.RankTier{}
	}

	writeJSON(w, http.StatusOK, tiers)
}

// GetTierDetails handles GET /api/v1/tiers/detail
// Returns all tiers with their associated titles and theme unlocks.
func (h *ProgressionHandler) GetTierDetails(w http.ResponseWriter, r *http.Request) {
	response, err := h.repo.Progression.GetAllTiersWithDetails(r.Context())
	if err != nil {
		log.Printf("failed to fetch tier details: %v", err)
		writeError(w, http.StatusInternalServerError, "FETCH_FAILED", "Failed to fetch tier details")
		return
	}

	writeJSON(w, http.StatusOK, response)
}
