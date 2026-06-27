package handler

import (
	"encoding/json"
	"log/slog"
	"net/http"
	"strconv"

	"github.com/cpbrucemeena/type-strike-backend/internal/data"
	"github.com/cpbrucemeena/type-strike-backend/internal/models"
	"github.com/cpbrucemeena/type-strike-backend/internal/repository"
	"github.com/go-chi/chi/v5"
)

// PlayerHandler handles HTTP requests for player operations.
type PlayerHandler struct {
	repo *repository.Repositories
}

// NewPlayerHandler creates a new PlayerHandler.
func NewPlayerHandler(repo *repository.Repositories) *PlayerHandler {
	return &PlayerHandler{repo: repo}
}

// Create handles POST /api/v1/players
func (h *PlayerHandler) Create(w http.ResponseWriter, r *http.Request) {
	var req models.CreatePlayerRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_JSON", "Invalid request body")
		return
	}

	player, err := h.repo.Player.Create(r.Context(), req)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "CREATE_FAILED", "Failed to create player")
		return
	}

	writeJSON(w, http.StatusCreated, player)
}

// GetByID handles GET /api/v1/players/{id}
func (h *PlayerHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_ID", "Player ID must be a number")
		return
	}

	player, err := h.repo.Player.GetByID(r.Context(), id)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "FETCH_FAILED", "Failed to fetch player")
		return
	}
	if player == nil {
		writeError(w, http.StatusNotFound, "NOT_FOUND", "Player not found")
		return
	}

	writeJSON(w, http.StatusOK, player)
}

// Update handles PATCH /api/v1/players/{id}
func (h *PlayerHandler) Update(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_ID", "Player ID must be a number")
		return
	}

	var req models.UpdatePlayerRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_JSON", "Invalid request body")
		return
	}

	player, err := h.repo.Player.Update(r.Context(), id, req)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "UPDATE_FAILED", "Failed to update player")
		return
	}

	writeJSON(w, http.StatusOK, player)
}

// AddXP handles POST /api/v1/players/{id}/xp
func (h *PlayerHandler) AddXP(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_ID", "Player ID must be a number")
		return
	}

	var req struct {
		XP int `json:"xp"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_JSON", "Invalid request body")
		return
	}

	player, leveledUp, err := h.repo.Player.AddXP(r.Context(), id, req.XP)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "XP_FAILED", "Failed to add XP")
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"player":     player,
		"leveled_up": leveledUp,
	})
}

// Register handles POST /api/v1/players/register
// Get-or-create a player by email (Clerk auth integration).
// Generates an internal player_tag from the email with collision checking.
func (h *PlayerHandler) Register(w http.ResponseWriter, r *http.Request) {
	var req models.RegisterPlayerRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_JSON", "Invalid request body")
		return
	}

	if req.Email == "" {
		writeError(w, http.StatusBadRequest, "MISSING_EMAIL", "Email is required")
		return
	}

	// Check if player already exists by email
	existing, err := h.repo.Player.GetByEmail(r.Context(), req.Email)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "LOOKUP_FAILED", "Failed to lookup player")
		return
	}
	if existing != nil {
		// Update display_name if provided and different
		if req.DisplayName != "" && existing.DisplayName != req.DisplayName {
			if err := h.repo.Player.UpdateDisplayName(r.Context(), existing.ID, req.DisplayName); err != nil {
				slog.Default().Error("failed to update display name", "error", err)
			}
			existing.DisplayName = req.DisplayName
		}
		writeJSON(w, http.StatusOK, models.RegisterPlayerResponse{
			Player: *existing,
			IsNew:  false,
		})
		return
	}

	// Create new player
	player, err := h.repo.Player.CreatePlayerByEmail(r.Context(), req.Email, req.DisplayName)
	if err != nil {
		slog.Default().Error("failed to create player by email", "email", req.Email, "error", err)
		writeError(w, http.StatusInternalServerError, "CREATE_FAILED", "Failed to create player")
		return
	}

	writeJSON(w, http.StatusCreated, models.RegisterPlayerResponse{
		Player: *player,
		IsNew:  true,
	})
}

// GetSummary handles GET /api/v1/players/{id}/summary
// Returns combined data for the home/dashboard screen.
func (h *PlayerHandler) GetSummary(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_ID", "Player ID must be a number")
		return
	}

	player, err := h.repo.Player.GetByID(r.Context(), id)
	if err != nil || player == nil {
		writeError(w, http.StatusNotFound, "NOT_FOUND", "Player not found")
		return
	}

	activity, err := h.repo.Activity.GetRecent(r.Context(), id, 3)
	if err != nil {
		slog.Default().Error("failed to fetch recent activity", "player_id", id, "error", err)
	}

	settings, err := h.repo.Settings.GetAll(r.Context(), id)
	if err != nil {
		slog.Default().Error("failed to fetch settings", "player_id", id, "error", err)
	}

	clearedCount, err := h.repo.LevelProgress.GetCompletedCount(r.Context(), id)
	if err != nil {
		slog.Default().Error("failed to fetch completed count", "player_id", id, "error", err)
	}

	nextLevelXP := models.XPForNextLevel(player.Level)

	summary := models.PlayerSummary{
		Player:         *player,
		LevelsTotal:    data.GetLevelTotalCount(), // named levels: 100 pre-generated + all beyond names
		LevelsCleared:  clearedCount,
		RecentActivity: activity,
		NextLevelXP:    nextLevelXP,
		Settings:       settings,
		StreakCount:    player.StreakCount,
	}

	writeJSON(w, http.StatusOK, summary)
}
