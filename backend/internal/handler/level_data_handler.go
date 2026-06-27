package handler

import (
	"log/slog"
	"net/http"
	"strconv"

	"github.com/cpbrucemeena/type-strike-backend/internal/data"
	"github.com/cpbrucemeena/type-strike-backend/internal/models"
	"github.com/cpbrucemeena/type-strike-backend/internal/repository"
	"github.com/go-chi/chi/v5"
)

// LevelDataHandler serves static level configuration data.
type LevelDataHandler struct {
	repo *repository.Repositories
}

// NewLevelDataHandler creates a new LevelDataHandler.
func NewLevelDataHandler(repo *repository.Repositories) *LevelDataHandler {
	return &LevelDataHandler{repo: repo}
}

// GetAll handles GET /api/v1/levels (optional ?player_id=N to include progress)
func (h *LevelDataHandler) GetAll(w http.ResponseWriter, r *http.Request) {
	configs := data.LevelConfigs
	playerIDStr := r.URL.Query().Get("player_id")

	// If player_id provided, pre-load all progress for this player
	var progressMap map[int]*models.LevelProgress
	if playerIDStr != "" {
		if playerID, err := strconv.Atoi(playerIDStr); err == nil {
			allProgress, err := h.repo.LevelProgress.GetAllForPlayer(r.Context(), playerID)
			if err == nil {
				progressMap = make(map[int]*models.LevelProgress, len(allProgress))
				for i, p := range allProgress {
					progressMap[p.LevelID] = &allProgress[i]
				}
			}
		}
	}

	results := make([]map[string]interface{}, len(configs))
	for i, c := range configs {
		result := map[string]interface{}{
			"id":            c.ID,
			"name":          c.Name,
			"tier":          c.Tier,
			"difficulty":    c.Difficulty,
			"pass_wpm":      c.PassWPM,
			"pass_accuracy": c.PassAccuracy,
			"paragraph":     c.Paragraph,
		}
		// Include player progress if available
		if progressMap != nil {
			if p, ok := progressMap[c.ID]; ok {
				bestWPM := p.BestWPM
				bestAcc := p.BestAccuracy
				stars := p.Stars
				if bestWPM > 0 {
					result["player_best_wpm"] = bestWPM
				}
				if bestAcc > 0 {
					result["player_best_acc"] = bestAcc
				}
				result["player_stars"] = stars
			}
		}
		results[i] = result
	}
	writeJSON(w, http.StatusOK, results)
}

// GetByID handles GET /api/v1/levels/{levelId}
func (h *LevelDataHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	levelID, err := strconv.Atoi(chi.URLParam(r, "levelId"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_LEVEL_ID", "Level ID must be a number")
		return
	}

	config := data.GetLevel(levelID)
	if config == nil {
		writeError(w, http.StatusNotFound, "LEVEL_NOT_FOUND", "Level not found")
		return
	}

	// Try to get player progress if playerId query param is provided
	playerIDStr := r.URL.Query().Get("player_id")
	detail := config.ToLevelDetail(nil)
	if playerIDStr != "" {
		if playerID, err := strconv.Atoi(playerIDStr); err == nil {
			progress, err := h.repo.LevelProgress.GetByPlayerAndLevel(r.Context(), playerID, levelID)
			if err != nil {
				slog.Default().Error("failed to fetch progress", "player_id", playerID, "level_id", levelID, "error", err)
			}
			if progress != nil {
				detail = config.ToLevelDetail(progress)
			}
		}
	}

	writeJSON(w, http.StatusOK, detail)
}

// GetNext handles GET /api/v1/levels/next?player_id={id}
// Returns the next uncompleted level's full detail.
func (h *LevelDataHandler) GetNext(w http.ResponseWriter, r *http.Request) {
	playerIDStr := r.URL.Query().Get("player_id")
	if playerIDStr == "" {
		writeJSON(w, http.StatusOK, data.GetLevel(1).ToLevelDetail(nil))
		return
	}

	playerID, err := strconv.Atoi(playerIDStr)
	if err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_PLAYER_ID", "Player ID must be a number")
		return
	}

	nextLevelID, err := h.repo.LevelProgress.GetNextUncompletedLevel(r.Context(), playerID)
	if err != nil {
		nextLevelID = 1
	}

	config := data.GetLevel(nextLevelID)
	if config == nil {
		config = data.GetLevel(1)
	}

	progress, _ := h.repo.LevelProgress.GetByPlayerAndLevel(r.Context(), playerID, config.ID)
	detail := config.ToLevelDetail(progress)

	writeJSON(w, http.StatusOK, detail)
}
