package handler

import (
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"github.com/cpbrucemeena/type-strike-backend/internal/models"
	"github.com/cpbrucemeena/type-strike-backend/internal/repository"
	"github.com/go-chi/chi/v5"
)

// AnalyticsHandler handles HTTP requests for analytics events and daily stats.
type AnalyticsHandler struct {
	repo *repository.Repositories
}

// NewAnalyticsHandler creates a new AnalyticsHandler.
func NewAnalyticsHandler(repo *repository.Repositories) *AnalyticsHandler {
	return &AnalyticsHandler{repo: repo}
}

// RecordEvent handles POST /api/v1/analytics/events
func (h *AnalyticsHandler) RecordEvent(w http.ResponseWriter, r *http.Request) {
	var req models.RecordAnalyticsEventRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_JSON", "Invalid request body")
		return
	}

	event, err := h.repo.Analytics.RecordEvent(r.Context(), req)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "RECORD_FAILED", "Failed to record analytics event")
		return
	}

	writeJSON(w, http.StatusCreated, event)
}

// GetDailyStats handles GET /api/v1/analytics/players/{playerId}/daily-stats
func (h *AnalyticsHandler) GetDailyStats(w http.ResponseWriter, r *http.Request) {
	playerID, err := strconv.Atoi(chi.URLParam(r, "playerId"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_PLAYER_ID", "Player ID must be a number")
		return
	}

	dateStr := r.URL.Query().Get("date")
	date := time.Now()
	if dateStr != "" {
		parsed, err := time.Parse("2006-01-02", dateStr)
		if err == nil {
			date = parsed
		}
	}

	stats, err := h.repo.Analytics.GetDailyStats(r.Context(), playerID, date)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "FETCH_FAILED", "Failed to fetch daily stats")
		return
	}

	writeJSON(w, http.StatusOK, stats)
}

// UpdateDailyStats handles POST /api/v1/analytics/players/{playerId}/daily-stats
func (h *AnalyticsHandler) UpdateDailyStats(w http.ResponseWriter, r *http.Request) {
	playerID, err := strconv.Atoi(chi.URLParam(r, "playerId"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_PLAYER_ID", "Player ID must be a number")
		return
	}

	var req struct {
		WPM            int  `json:"wpm"`
		Completed      bool `json:"completed"`
		PlayTimeSeconds int `json:"play_time_seconds"`
		Date           string `json:"date,omitempty"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_JSON", "Invalid request body")
		return
	}

	date := time.Now()
	if req.Date != "" {
		parsed, err := time.Parse("2006-01-02", req.Date)
		if err == nil {
			date = parsed
		}
	}

	stats, err := h.repo.Analytics.UpsertDailyStats(r.Context(), playerID, date, req.WPM, req.Completed, req.PlayTimeSeconds)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "UPDATE_FAILED", "Failed to update daily stats")
		return
	}

	writeJSON(w, http.StatusOK, stats)
}
