package handler

import (
	"encoding/json"
	"log/slog"
	"net/http"
	"strconv"

	"github.com/cpbrucemeena/type-strike-backend/internal/models"
	"github.com/cpbrucemeena/type-strike-backend/internal/repository"
	"github.com/go-chi/chi/v5"
	"gorm.io/gorm"
)

// LevelHandler handles HTTP requests for level progress operations.
type LevelHandler struct {
	repo *repository.Repositories
	db   *gorm.DB
}

// NewLevelHandler creates a new LevelHandler.
func NewLevelHandler(repo *repository.Repositories, db *gorm.DB) *LevelHandler {
	return &LevelHandler{repo: repo, db: db}
}

// GetProgress handles GET /api/v1/players/{playerId}/levels/{levelId}
func (h *LevelHandler) GetProgress(w http.ResponseWriter, r *http.Request) {
	playerID, err := strconv.Atoi(chi.URLParam(r, "playerId"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_PLAYER_ID", "Player ID must be a number")
		return
	}
	levelID, err := strconv.Atoi(chi.URLParam(r, "levelId"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_LEVEL_ID", "Level ID must be a number")
		return
	}

	progress, err := h.repo.LevelProgress.GetByPlayerAndLevel(r.Context(), playerID, levelID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "FETCH_FAILED", "Failed to fetch level progress")
		return
	}

	if progress == nil {
		writeJSON(w, http.StatusOK, map[string]interface{}{
			"player_id": playerID,
			"level_id":  levelID,
			"stars":     0,
			"completed": false,
		})
		return
	}

	writeJSON(w, http.StatusOK, progress)
}

// UpdateProgress handles POST /api/v1/players/{playerId}/levels/{levelId}/complete
func (h *LevelHandler) UpdateProgress(w http.ResponseWriter, r *http.Request) {
	playerID, err := strconv.Atoi(chi.URLParam(r, "playerId"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_PLAYER_ID", "Player ID must be a number")
		return
	}
	levelID, err := strconv.Atoi(chi.URLParam(r, "levelId"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_LEVEL_ID", "Level ID must be a number")
		return
	}

	var req models.UpdateLevelProgressRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_JSON", "Invalid request body")
		return
	}

	slog.Default().Info("level complete",
		"player_id", playerID,
		"level_id", levelID,
		"wpm", req.WPM,
		"accuracy", req.Accuracy,
		"stars", req.Stars,
		"completed", req.Completed,
	)

	progress, upgradeResult, err := h.executeLevelComplete(r.Context(), playerID, levelID, req)
	if err != nil {
		slog.Default().Error("level complete error", "player_id", playerID, "level_id", levelID, "error", err)
		writeError(w, http.StatusInternalServerError, "UPDATE_FAILED", "Failed to update level progress")
		return
	}

	slog.Default().Info("level complete success",
		"player_id", playerID,
		"level_id", levelID,
		"stars", progress.Stars,
		"best_wpm", progress.BestWPM,
		"best_accuracy", progress.BestAccuracy,
		"attempts", progress.Attempts,
		"upgraded", upgradeResult != nil && upgradeResult.Upgraded,
	)

	if upgradeResult != nil && upgradeResult.Upgraded {
		slog.Default().Info("tier upgrade",
		"player_id", playerID,
		"from", upgradeResult.PreviousTier.DisplayName,
		"to", upgradeResult.NewTier.DisplayName,
		"unlocks", upgradeResult.NewUnlocks,
	)
	}

	// ── Check Achievements ─────────────────────────
	achParams := repository.AchievementCheckParams{
		WPM:      req.WPM,
		Accuracy: req.Accuracy,
	}

	// Fetch combo and streak data from game session history if available
	if player, err := h.repo.Player.GetByID(r.Context(), playerID); err == nil && player != nil {
		achParams.StreakCount = player.StreakCount
	}

	// Count total levels cleared
	levelsCleared, _ := h.repo.LevelProgress.GetCompletedCount(r.Context(), playerID)
	achParams.LevelsCleared = levelsCleared

	achievementResult := h.repo.Achievement.CheckAllAchievements(r.Context(), playerID, achParams)

	resp := models.LevelCompleteResponse{
		LevelProgress: progress,
	}
	if upgradeResult != nil && upgradeResult.Upgraded {
		resp.Upgrade = upgradeResult
	}
	if achievementResult != nil && len(achievementResult.NewUnlocks) > 0 {
		resp.AchievementUnlocks = achievementResult.NewUnlocks
	}

	writeJSON(w, http.StatusOK, resp)
}


