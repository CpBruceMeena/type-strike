package handler

import (
	"log/slog"
	"net/http"
	"strconv"

	"github.com/cpbrucemeena/type-strike-backend/internal/models"
	"github.com/cpbrucemeena/type-strike-backend/internal/repository"
)

// ContestHandler handles HTTP requests for contest operations.
type ContestHandler struct {
	repo *repository.Repositories
}

// NewContestHandler creates a new ContestHandler.
func NewContestHandler(repo *repository.Repositories) *ContestHandler {
	return &ContestHandler{repo: repo}
}

// GetCurrent handles GET /api/v1/contest/current
// Returns the current active contest with the player's entry status.
func (h *ContestHandler) GetCurrent(w http.ResponseWriter, r *http.Request) {
	playerIDStr := r.URL.Query().Get("player_id")
	playerID, err := strconv.Atoi(playerIDStr)
	if err != nil || playerID < 1 {
		writeError(w, http.StatusBadRequest, "INVALID_PLAYER_ID", "Valid player_id is required")
		return
	}

	contest, err := h.repo.Contest.GetActiveContest(r.Context())
	if err != nil {
		slog.Default().Error("failed to get active contest", "error", err)
		writeError(w, http.StatusInternalServerError, "FETCH_FAILED", "Failed to get active contest")
		return
	}

	if contest == nil {
		// No active contest — create one for today
		contest, _, err = h.repo.Contest.GetOrCreateDailyContest(r.Context(), generateContestParagraph())
		if err != nil {
			slog.Default().Error("failed to create daily contest", "error", err)
			writeError(w, http.StatusInternalServerError, "CREATE_FAILED", "Failed to create daily contest")
			return
		}
	}

	// Get player's entry if any
	playerEntry, err := h.repo.Contest.GetPlayerEntry(r.Context(), contest.ID, playerID)
	if err != nil {
		slog.Default().Error("failed to get player contest entry", "error", err)
		// Non-fatal — player may not have entered yet
	}

	hasEntry, _ := h.repo.Contest.HasPlayerEntered(r.Context(), contest.ID, playerID)

	// If the player hasn't entered, hide the paragraph until they start
	// (paragraph is revealed when they start a contest game session)
	resp := models.ContestCurrentResponse{
		ContestID:  contest.ID,
		StartDate:  contest.StartDate,
		EndDate:    contest.EndDate,
		Difficulty: contest.Difficulty,
	}

	if hasEntry && playerEntry != nil {
		resp.Paragraph = contest.Paragraph
		resp.PlayerEntry = playerEntry
	} else {
		// Don't reveal paragraph before they start
		resp.PlayerEntry = &models.ContestPlayerEntry{
			WPM:      nil,
			Accuracy: nil,
			Rank:     nil,
		}
	}

	writeJSON(w, http.StatusOK, resp)
}

// GetLeaderboard handles GET /api/v1/contest/leaderboard
// Returns the leaderboard for a specific contest.
func (h *ContestHandler) GetLeaderboard(w http.ResponseWriter, r *http.Request) {
	contestIDStr := r.URL.Query().Get("contest_id")
	contestID, err := strconv.Atoi(contestIDStr)
	if err != nil || contestID < 1 {
		writeError(w, http.StatusBadRequest, "INVALID_CONTEST_ID", "Valid contest_id is required")
		return
	}

	limitStr := r.URL.Query().Get("limit")
	limit := 50
	if limitStr != "" {
		if parsed, err := strconv.Atoi(limitStr); err == nil && parsed > 0 {
			limit = parsed
		}
	}
	if limit > 100 {
		limit = 100
	}

	entries, totalCount, err := h.repo.Contest.GetLeaderboard(r.Context(), contestID, limit)
	if err != nil {
		slog.Default().Error("failed to fetch contest leaderboard", "error", err)
		writeError(w, http.StatusInternalServerError, "FETCH_FAILED", "Failed to fetch contest leaderboard")
		return
	}

	if entries == nil {
		entries = []models.ContestEntry{}
	}

	// Check for player entry
	playerIDStr := r.URL.Query().Get("player_id")
	var playerEntry *models.ContestEntry
	if playerIDStr != "" {
		if pid, err := strconv.Atoi(playerIDStr); err == nil && pid > 0 {
			// Find player in entries
			for _, e := range entries {
				if e.PlayerID == pid {
					playerEntry = &e
					break
				}
			}
		}
	}

	writeJSON(w, http.StatusOK, models.ContestLeaderboardResponse{
		Entries:     entries,
		TotalCount:  totalCount,
		PlayerEntry: playerEntry,
	})
}
