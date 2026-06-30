package handler

import (
	"math"
	"net/http"
	"strconv"
	"time"

	"github.com/cpbrucemeena/type-strike-backend/internal/data"
	"github.com/cpbrucemeena/type-strike-backend/internal/models"
	"log/slog"
)

// GetHistory handles GET /api/v1/games/history
// Returns a player's game history with optional mode filter.
func (h *GameHandler) GetHistory(w http.ResponseWriter, r *http.Request) {
	playerIDStr := r.URL.Query().Get("player_id")
	playerID, err := strconv.Atoi(playerIDStr)
	if err != nil || playerID < 1 {
		writeError(w, http.StatusBadRequest, "INVALID_PLAYER_ID", "Valid player_id is required")
		return
	}

	mode := r.URL.Query().Get("mode")
	limitStr := r.URL.Query().Get("limit")
	offsetStr := r.URL.Query().Get("offset")

	limit := 20
	if limitStr != "" {
		if parsed, err := strconv.Atoi(limitStr); err == nil && parsed > 0 {
			limit = parsed
		}
	}
	if limit > 100 {
		limit = 100
	}

	offset := 0
	if offsetStr != "" {
		if parsed, err := strconv.Atoi(offsetStr); err == nil && parsed >= 0 {
			offset = parsed
		}
	}

	entries, total, err := h.repo.Game.GetHistory(r.Context(), playerID, mode, limit, offset)
	if err != nil {
		slog.Default().Error("failed to fetch game history", "player_id", r.URL.Query().Get("player_id"), "error", err)
		writeError(w, http.StatusInternalServerError, "FETCH_FAILED", "Failed to fetch game history")
		return
	}

	if entries == nil {
		entries = []models.GameHistoryEntry{}
	}

	writeJSON(w, http.StatusOK, models.GameHistoryResponse{
		Games: entries,
		Total: total,
	})
}

// GetTimedLeaderboard handles GET /api/v1/leaderboard/timed
func (h *GameHandler) GetTimedLeaderboard(w http.ResponseWriter, r *http.Request) {
	mode := r.URL.Query().Get("mode")
	if mode == "" || !isTimedMode(mode) {
		writeError(w, http.StatusBadRequest, "INVALID_MODE", "Valid timed mode is required (timed_1min, timed_3min, timed_5min)")
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

	entries, totalCount, err := h.repo.Game.GetTimedLeaderboard(r.Context(), mode, limit)
	if err != nil {
		slog.Default().Error("failed to fetch timed leaderboard", "error", err)
		writeError(w, http.StatusInternalServerError, "FETCH_FAILED", "Failed to fetch timed leaderboard")
		return
	}

	if entries == nil {
		entries = []models.TimedLeaderboardEntry{}
	}

	writeJSON(w, http.StatusOK, models.TimedLeaderboardResponse{
		Entries:    entries,
		TotalCount: totalCount,
	})
}

// GetPlayerTimedRanks handles GET /api/v1/leaderboard/timed/player
// Returns the player's best timed entry across all timed modes with rank.
// Query params: player_id (required)
func (h *GameHandler) GetPlayerTimedRanks(w http.ResponseWriter, r *http.Request) {
	playerIDStr := r.URL.Query().Get("player_id")
	if playerIDStr == "" {
		writeError(w, http.StatusBadRequest, "MISSING_PLAYER_ID", "player_id query parameter is required")
		return
	}
	playerID, err := strconv.Atoi(playerIDStr)
	if err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_PLAYER_ID", "Player ID must be a number")
		return
	}

	modes := []string{"timed_1min", "timed_3min", "timed_5min"}
	results := make([]*models.TimedLeaderboardEntry, 0, 3)

	for _, mode := range modes {
		entry, err := h.repo.Game.GetPlayerTimedRank(r.Context(), playerID, mode)
		if err != nil {
			slog.Default().Error("failed to fetch player timed rank", "player_id", playerID, "mode", mode, "error", err)
			continue
		}
		results = append(results, entry)
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"player_id": playerID,
		"entries":   results,
	})
}

// ── Helpers ──────────────────────────────────────────

func isTimedMode(mode string) bool {
	switch mode {
	case models.ModeTimed1Min, models.ModeTimed3Min, models.ModeTimed5Min:
		return true
	}
	return false
}

func computeGameXP(wpm int, accuracy float64, mode string) int {
	base := int(math.Max(10, float64(wpm)*0.5))
	accBonus := int(math.Floor(accuracy*100-80)) * 2
	modeMultiplier := 1.0
	switch mode {
	case models.ModeTimed3Min:
		modeMultiplier = 1.5
	case models.ModeTimed5Min:
		modeMultiplier = 2.0
	case models.ModeContest:
		modeMultiplier = 2.5
	}
	return int(float64(base+int(math.Max(0, float64(accBonus)))) * modeMultiplier)
}

func generateTimedParagraph(mode string) string {
	// Generate a harder paragraph with numbers, special chars, capitals
	// For timed modes, we use the level generator at a high difficulty
	levelID := 90 // Obsidian-level difficulty
	if mode == models.ModeTimed3Min {
		levelID = 95
	} else if mode == models.ModeTimed5Min {
		levelID = 100
	}
	config := data.GetLevel(levelID)
	if config != nil {
		return config.Paragraph
	}
	return "The molten core accelerates beyond known limits. Type with fury and strike with fire at maximum velocity. Precision and speed define the ultimate warrior in this arena of flame and obsidian."
}

func generateContestParagraph() string {
	// Use different content each day based on day of year, cycling through different types
	dayOfYear := time.Now().YearDay()
	weekOfYear := dayOfYear / 7

	// Cycle through content types based on the week:
	// Week 0: Fun facts, Week 1: Tech facts, Week 2: Short stories, Week 3: Science facts, Week 4: Coding
	// This ensures contest content varies week to week
	contentType := weekOfYear % 5

	levelID := 76 + (dayOfYear % 25)
	config := data.GetLevel(levelID)
	if config != nil {
		// Use the primary paragraph but add a header based on content type
		contentLabels := []string{"Did you know? ", "In the world of technology, ", "", "Scientific fact: ", "Algorithm challenge: "}
		label := contentLabels[contentType]
		if label != "" {
			return label + config.Paragraph
		}
		return config.Paragraph
	}
	// Fallback with a fun fact
	return "The human brain processes images in as little as thirteen milliseconds, much faster than the one hundred milliseconds it takes to process text. This is why visual information is often easier to remember than written words."
}
