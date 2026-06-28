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

// LevelDataHandler serves level configuration data from the database.
type LevelDataHandler struct {
	repo *repository.Repositories
}

// NewLevelDataHandler creates a new LevelDataHandler.
func NewLevelDataHandler(repo *repository.Repositories) *LevelDataHandler {
	return &LevelDataHandler{repo: repo}
}

// GetAll handles GET /api/v1/levels (optional ?player_id=N to include progress)
func (h *LevelDataHandler) GetAll(w http.ResponseWriter, r *http.Request) {
	// Try to fetch levels from the database first
	dbLevels, err := h.repo.LevelConfig.GetAll(r.Context())
	if err != nil || len(dbLevels) == 0 {
		// Fallback to in-memory configs
		slog.Default().Warn("falling back to in-memory level configs", "error", err)
		configs := data.LevelConfigs
		playerIDStr := r.URL.Query().Get("player_id")

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
			if progressMap != nil {
				if p, ok := progressMap[c.ID]; ok {
					if p.BestWPM > 0 {
						result["player_best_wpm"] = p.BestWPM
					}
					if p.BestAccuracy > 0 {
						result["player_best_acc"] = p.BestAccuracy
					}
					result["player_stars"] = p.Stars
				}
			}
			results[i] = result
		}
		writeJSON(w, http.StatusOK, results)
		return
	}

	// Load player progress if requested
	playerIDStr := r.URL.Query().Get("player_id")
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

	results := make([]map[string]interface{}, len(dbLevels))
	for i, l := range dbLevels {
		result := map[string]interface{}{
			"id":            l.ID,
			"name":          l.Name,
			"tier":          l.Tier,
			"difficulty":    l.Difficulty,
			"pass_wpm":      l.PassWPM,
			"pass_accuracy": l.PassAccuracy,
			"paragraph":     l.Paragraph,
		}
		if progressMap != nil {
			if p, ok := progressMap[l.ID]; ok {
				if p.BestWPM > 0 {
					result["player_best_wpm"] = p.BestWPM
				}
				if p.BestAccuracy > 0 {
					result["player_best_acc"] = p.BestAccuracy
				}
				result["player_stars"] = p.Stars
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

	// Try to fetch from database first
	dbLevel, err := h.repo.LevelConfig.GetByID(r.Context(), levelID)
	if err == nil && dbLevel != nil {
		// Found in DB — include player progress if requested
		playerIDStr := r.URL.Query().Get("player_id")
		var progress *models.LevelProgress
		if playerIDStr != "" {
			if playerID, err := strconv.Atoi(playerIDStr); err == nil {
				progress, _ = h.repo.LevelProgress.GetByPlayerAndLevel(r.Context(), playerID, levelID)
			}
		}

		detail := models.LevelDetail{
			ID:           dbLevel.ID,
			Name:         dbLevel.Name,
			Tier:         dbLevel.Tier,
			Difficulty:   dbLevel.Difficulty,
			PassWPM:      dbLevel.PassWPM,
			PassAccuracy: dbLevel.PassAccuracy,
			Paragraph:    dbLevel.Paragraph,
		}
		if progress != nil {
			detail.PlayerBestWPM = &progress.BestWPM
			detail.PlayerBestAcc = &progress.BestAccuracy
			detail.PlayerStars = &progress.Stars
		}
		writeJSON(w, http.StatusOK, detail)
		return
	}

	// Fallback to in-memory config
	slog.Default().Warn("level not found in DB, falling back to in-memory config", "level_id", levelID)
	config := data.GetLevel(levelID)
	if config == nil {
		writeError(w, http.StatusNotFound, "LEVEL_NOT_FOUND", "Level not found")
		return
	}

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

	// Try DB first
	dbLevel, dbErr := h.repo.LevelConfig.GetByID(r.Context(), nextLevelID)
	if dbErr == nil && dbLevel != nil {
		progress, _ := h.repo.LevelProgress.GetByPlayerAndLevel(r.Context(), playerID, nextLevelID)
		detail := models.LevelDetail{
			ID:           dbLevel.ID,
			Name:         dbLevel.Name,
			Tier:         dbLevel.Tier,
			Difficulty:   dbLevel.Difficulty,
			PassWPM:      dbLevel.PassWPM,
			PassAccuracy: dbLevel.PassAccuracy,
			Paragraph:    dbLevel.Paragraph,
		}
		if progress != nil {
			detail.PlayerBestWPM = &progress.BestWPM
			detail.PlayerBestAcc = &progress.BestAccuracy
			detail.PlayerStars = &progress.Stars
		}
		writeJSON(w, http.StatusOK, detail)
		return
	}

	// Fallback to in-memory
	config := data.GetLevel(nextLevelID)
	if config == nil {
		config = data.GetLevel(1)
	}
	progress, _ := h.repo.LevelProgress.GetByPlayerAndLevel(r.Context(), playerID, config.ID)
	detail := config.ToLevelDetail(progress)
	writeJSON(w, http.StatusOK, detail)
}
