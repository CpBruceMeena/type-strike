package handler

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"strconv"

	"github.com/cpbrucemeena/type-strike-backend/internal/models"
	"github.com/cpbrucemeena/type-strike-backend/internal/repository"
	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// LevelHandler handles HTTP requests for level progress operations.
type LevelHandler struct {
	repo *repository.Repositories
	pool *pgxpool.Pool
}

// NewLevelHandler creates a new LevelHandler.
func NewLevelHandler(repo *repository.Repositories, pool *pgxpool.Pool) *LevelHandler {
	return &LevelHandler{repo: repo, pool: pool}
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
// Wraps level progress upsert and activity recording in a single transaction.
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

	ctx := r.Context()

	// Execute level progress update and activity recording in a transaction
	progress, err := h.executeLevelComplete(ctx, playerID, levelID, req)
	if err != nil {
		log.Printf("level complete transaction failed: player=%d level=%d err=%v", playerID, levelID, err)
		writeError(w, http.StatusInternalServerError, "UPDATE_FAILED", "Failed to update level progress")
		return
	}

	writeJSON(w, http.StatusOK, progress)
}

func (h *LevelHandler) executeLevelComplete(ctx context.Context, playerID, levelID int, req models.UpdateLevelProgressRequest) (*models.LevelProgress, error) {
	tx, err := h.pool.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	// Upsert level progress within the transaction
	var progress models.LevelProgress
	err = tx.QueryRow(ctx,
		`INSERT INTO level_progress (player_id, level_id, stars, best_wpm, best_accuracy, completed, attempts, last_played_at)
		 VALUES ($1, $2, $3, $4, $5, $6, 1, NOW())
		 ON CONFLICT (player_id, level_id)
		 DO UPDATE SET
		   stars = GREATEST(level_progress.stars, EXCLUDED.stars),
		   best_wpm = GREATEST(level_progress.best_wpm, EXCLUDED.best_wpm),
		   best_accuracy = GREATEST(level_progress.best_accuracy, EXCLUDED.best_accuracy),
		   completed = level_progress.completed OR EXCLUDED.completed,
		   attempts = level_progress.attempts + 1,
		   last_played_at = NOW()
		 RETURNING id, player_id, level_id, stars, best_wpm, best_accuracy, completed, attempts, last_played_at`,
		playerID, levelID, req.Stars, req.WPM, req.Accuracy, req.Completed,
	).Scan(&progress.ID, &progress.PlayerID, &progress.LevelID, &progress.Stars, &progress.BestWPM, &progress.BestAccuracy, &progress.Completed, &progress.Attempts, &progress.LastPlayedAt)
	if err != nil {
		return nil, err
	}

	// Record activity within the same transaction
	activityType := models.ActivityLevelCompleted
	if !req.Completed {
		activityType = models.ActivityLevelFailed
	}
	meta, _ := json.Marshal(map[string]interface{}{
		"level_id": levelID,
		"wpm":      req.WPM,
		"accuracy": req.Accuracy,
		"stars":    req.Stars,
	})
	_, err = tx.Exec(ctx,
		`INSERT INTO activity (player_id, type, metadata) VALUES ($1, $2, $3)`,
		playerID, activityType, meta,
	)
	if err != nil {
		return nil, err
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}

	return &progress, nil
}

// GetAllProgress handles GET /api/v1/players/{playerId}/levels
func (h *LevelHandler) GetAllProgress(w http.ResponseWriter, r *http.Request) {
	playerID, err := strconv.Atoi(chi.URLParam(r, "playerId"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_PLAYER_ID", "Player ID must be a number")
		return
	}

	progress, err := h.repo.LevelProgress.GetAllForPlayer(r.Context(), playerID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "FETCH_FAILED", "Failed to fetch level progress")
		return
	}

	if progress == nil {
		progress = []models.LevelProgress{}
	}

	writeJSON(w, http.StatusOK, progress)
}

// GetNextLevel handles GET /api/v1/players/{playerId}/next-level
func (h *LevelHandler) GetNextLevel(w http.ResponseWriter, r *http.Request) {
	playerID, err := strconv.Atoi(chi.URLParam(r, "playerId"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_PLAYER_ID", "Player ID must be a number")
		return
	}

	nextLevel, err := h.repo.LevelProgress.GetNextUncompletedLevel(r.Context(), playerID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "FETCH_FAILED", "Failed to determine next level")
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"next_level_id": nextLevel,
	})
}
