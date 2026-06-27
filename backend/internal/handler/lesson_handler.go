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

// LessonHandler handles HTTP requests for lesson progress operations.
type LessonHandler struct {
	repo *repository.Repositories
}

// NewLessonHandler creates a new LessonHandler.
func NewLessonHandler(repo *repository.Repositories) *LessonHandler {
	return &LessonHandler{repo: repo}
}

// GetAllProgress handles GET /api/v1/players/{playerId}/lessons
func (h *LessonHandler) GetAllProgress(w http.ResponseWriter, r *http.Request) {
	playerID, err := strconv.Atoi(chi.URLParam(r, "playerId"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_PLAYER_ID", "Player ID must be a number")
		return
	}

	progress, err := h.repo.LessonProgress.GetAllForPlayer(r.Context(), playerID)
	if err != nil {
		slog.Default().Error("failed to fetch lesson progress", "error", err)
		writeError(w, http.StatusInternalServerError, "FETCH_FAILED", "Failed to fetch lesson progress")
		return
	}

	if progress == nil {
		progress = []models.LessonProgress{}
	}

	writeJSON(w, http.StatusOK, progress)
}

// GetProgress handles GET /api/v1/players/{playerId}/lessons/{lessonId}
func (h *LessonHandler) GetProgress(w http.ResponseWriter, r *http.Request) {
	playerID, err := strconv.Atoi(chi.URLParam(r, "playerId"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_PLAYER_ID", "Player ID must be a number")
		return
	}
	lessonID, err := strconv.Atoi(chi.URLParam(r, "lessonId"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_LESSON_ID", "Lesson ID must be a number")
		return
	}

	progress, err := h.repo.LessonProgress.GetByPlayerAndLesson(r.Context(), playerID, lessonID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "FETCH_FAILED", "Failed to fetch lesson progress")
		return
	}

	if progress == nil {
		writeJSON(w, http.StatusOK, map[string]interface{}{
			"player_id": playerID,
			"lesson_id": lessonID,
			"completed": false,
		})
		return
	}

	writeJSON(w, http.StatusOK, progress)
}

// UpdateProgress handles POST /api/v1/players/{playerId}/lessons/{lessonId}/complete
func (h *LessonHandler) UpdateProgress(w http.ResponseWriter, r *http.Request) {
	playerID, err := strconv.Atoi(chi.URLParam(r, "playerId"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_PLAYER_ID", "Player ID must be a number")
		return
	}
	lessonID, err := strconv.Atoi(chi.URLParam(r, "lessonId"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_LESSON_ID", "Lesson ID must be a number")
		return
	}

	var req models.UpdateLessonProgressRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_JSON", "Invalid request body")
		return
	}

	progress, err := h.repo.LessonProgress.Upsert(r.Context(), playerID, lessonID, req)
	if err != nil {
		slog.Default().Error("lesson progress upsert failed", "player_id", playerID, "lesson_id", lessonID, "error", err)
		writeError(w, http.StatusInternalServerError, "UPDATE_FAILED", "Failed to update lesson progress")
		return
	}

	writeJSON(w, http.StatusOK, progress)
}
