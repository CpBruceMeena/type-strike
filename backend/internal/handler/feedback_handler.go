package handler

import (
	"log/slog"
	"net/http"

	"github.com/cpbrucemeena/type-strike-backend/internal/models"
	"github.com/cpbrucemeena/type-strike-backend/internal/repository"
)

// FeedbackHandler handles HTTP requests for feedback submissions.
type FeedbackHandler struct {
	repo *repository.Repositories
}

// NewFeedbackHandler creates a new FeedbackHandler.
func NewFeedbackHandler(repo *repository.Repositories) *FeedbackHandler {
	return &FeedbackHandler{repo: repo}
}

// Submit handles POST /api/v1/feedback
func (h *FeedbackHandler) Submit(w http.ResponseWriter, r *http.Request) {
	var req models.CreateFeedbackRequest
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_JSON", "Invalid request body")
		return
	}

	if req.Message == "" {
		writeError(w, http.StatusBadRequest, "MISSING_MESSAGE", "Feedback message is required")
		return
	}

	feedback, err := h.repo.Feedback.Create(r.Context(), req)
	if err != nil {
		slog.Default().Error("failed to save feedback", "error", err)
		writeError(w, http.StatusInternalServerError, "SAVE_FAILED", "Failed to save feedback")
		return
	}

	writeJSON(w, http.StatusCreated, map[string]interface{}{
		"id":         feedback.ID,
		"message":    "Feedback submitted successfully. Thank you!",
		"created_at": feedback.CreatedAt,
	})
}
