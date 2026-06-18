package handler

import (
	"log"
	"net/http"
	"strconv"

	"github.com/cpbrucemeena/type-strike-backend/internal/data"
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

// GetAll handles GET /api/v1/levels
func (h *LevelDataHandler) GetAll(w http.ResponseWriter, r *http.Request) {
	configs := data.LevelConfigs
	results := make([]map[string]interface{}, len(configs))
	for i, c := range configs {
		results[i] = map[string]interface{}{
			"id":              c.ID,
			"name":            c.Name,
			"tier":            c.Tier,
			"difficulty":      c.Difficulty,
			"pass_wpm":        c.PassWPM,
			"pass_accuracy":   c.PassAccuracy,
			"word_min_length": c.WordMinLength,
			"word_max_length": c.WordMaxLength,
			"word_count":      c.WordCount,
		}
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
				log.Printf("failed to fetch progress for player %d, level %d: %v", playerID, levelID, err)
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
