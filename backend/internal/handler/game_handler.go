package handler

import (
	"encoding/json"
	"fmt"
	"log"
	"math"
	"net/http"
	"strconv"
	"time"

	"github.com/cpbrucemeena/type-strike-backend/internal/data"
	"github.com/cpbrucemeena/type-strike-backend/internal/models"
	"github.com/cpbrucemeena/type-strike-backend/internal/repository"
	"github.com/go-chi/chi/v5"
)

// GameHandler handles HTTP requests for game sessions and timed modes.
type GameHandler struct {
	repo *repository.Repositories
}

// NewGameHandler creates a new GameHandler.
func NewGameHandler(repo *repository.Repositories) *GameHandler {
	return &GameHandler{repo: repo}
}

// Start handles POST /api/v1/games/start
// Creates a new game session with a paragraph and returns it to the client.
func (h *GameHandler) Start(w http.ResponseWriter, r *http.Request) {
	var req models.StartGameRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_JSON", "Invalid request body")
		return
	}

	if req.PlayerID < 1 {
		writeError(w, http.StatusBadRequest, "INVALID_PLAYER_ID", "Invalid player ID")
		return
	}

	// Validate mode
	validModes := map[string]bool{
		models.ModeTimed1Min: true,
		models.ModeTimed3Min: true,
		models.ModeTimed5Min: true,
		models.ModeContest:   true,
	}
	if !validModes[req.Mode] {
		writeError(w, http.StatusBadRequest, "INVALID_MODE", "Invalid game mode: must be timed_1min, timed_3min, timed_5min, or contest")
		return
	}

	// Generate paragraph and determine duration
	var (
		paragraph string
		duration  int
	)

	if req.Mode == models.ModeContest {
		// Contest mode: use or create today's contest paragraph
		contest, _, err := h.repo.Contest.GetOrCreateDailyContest(r.Context(), generateContestParagraph())
		if err != nil {
			log.Printf("failed to get/create contest: %v", err)
			writeError(w, http.StatusInternalServerError, "CONTEST_FAILED", "Failed to initialize contest")
			return
		}
		paragraph = contest.Paragraph
		duration = 300 // 5 min max
	} else {
		// Timed modes: generate a hard paragraph
		paragraph = generateTimedParagraph(req.Mode)
		duration = models.ModeDurations[req.Mode]
	}
	durationSec := &duration

	// Create game session (level_id is nil for timed modes and contest)
	session := &models.GameSession{
		PlayerID:    req.PlayerID,
		Mode:        req.Mode,
		LevelID:     nil,
		Paragraph:   paragraph,
		DurationSec: durationSec,
		StartedAt:   time.Now(),
	}

	if err := h.repo.Game.CreateSession(r.Context(), session); err != nil {
		log.Printf("failed to create game session: %v", err)
		writeError(w, http.StatusInternalServerError, "CREATE_FAILED", "Failed to create game session")
		return
	}

	resp := models.StartGameResponse{
		GameID:          fmt.Sprintf("%d", session.ID),
		Mode:            session.Mode,
		Paragraph:       session.Paragraph,
		DurationSeconds: session.DurationSec,
		LevelID:         session.LevelID,
	}

	writeJSON(w, http.StatusCreated, resp)
}

// Complete handles POST /api/v1/games/{gameId}/complete
// Submits game results, updates leaderboards, and awards XP.
func (h *GameHandler) Complete(w http.ResponseWriter, r *http.Request) {
	gameIDStr := chi.URLParam(r, "gameId")
	if gameIDStr == "" {
		writeError(w, http.StatusBadRequest, "MISSING_ID", "Game ID is required")
		return
	}
	gameID, err := strconv.ParseInt(gameIDStr, 10, 64)
	if err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_ID", "Game ID must be a number")
		return
	}

	var req models.CompleteGameRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_JSON", "Invalid request body")
		return
	}

	// Verify the session exists and belongs to this player
	session, err := h.repo.Game.GetSession(r.Context(), gameID)
	if err != nil || session == nil {
		writeError(w, http.StatusNotFound, "SESSION_NOT_FOUND", "Game session not found")
		return
	}
	if session.PlayerID != req.PlayerID {
		writeError(w, http.StatusForbidden, "FORBIDDEN", "This game session does not belong to this player")
		return
	}
	if session.IsCompleted {
		writeError(w, http.StatusConflict, "ALREADY_COMPLETED", "This game session has already been completed")
		return
	}

	// Calculate XP
	xpEarned := computeGameXP(req.WPM, req.Accuracy, session.Mode)

	// Update the session
	updated, err := h.repo.Game.CompleteSession(r.Context(), gameID, req, xpEarned)
	if err != nil {
		log.Printf("failed to complete game session: %v", err)
		writeError(w, http.StatusInternalServerError, "COMPLETE_FAILED", "Failed to complete game session")
		return
	}

	// Award XP to player
	if xpEarned > 0 {
		if _, _, err := h.repo.Player.AddXP(r.Context(), req.PlayerID, xpEarned); err != nil {
			log.Printf("failed to award XP: %v", err)
		}
		// Update progression total XP counter
		if err := h.repo.Progression.UpdateTotalXPEarned(r.Context(), req.PlayerID, xpEarned); err != nil {
			log.Printf("failed to update total xp earned: %v", err)
		}
	}

	// Check for tier upgrade
	upgradeResult, err := h.repo.Progression.CheckAndProcessUpgrade(r.Context(), req.PlayerID)
	if err != nil {
		log.Printf("failed to check tier upgrade: %v", err)
	}

	// Update streak
	if _, err := h.repo.Player.UpdateStreak(r.Context(), req.PlayerID); err != nil {
		log.Printf("failed to update streak: %v", err)
	}

	// Sync leaderboard
	if err := h.repo.Leaderboard.SyncPlayer(r.Context(), req.PlayerID); err != nil {
		log.Printf("failed to sync leaderboard: %v", err)
	}

	// Update timed leaderboard if applicable
	var rank *int
	if isTimedMode(session.Mode) {
		if err := h.repo.Game.UpsertTimedLeaderboard(r.Context(), req.PlayerID, session.Mode, req.WPM, req.Accuracy, gameID); err != nil {
			log.Printf("failed to upsert timed leaderboard: %v", err)
		}
		// Get player's rank in this mode
		if entry, err := h.repo.Game.GetPlayerTimedRank(r.Context(), req.PlayerID, session.Mode); err == nil && entry != nil {
			rank = &entry.Rank
		}
	}

	// Handle contest entry
	var contestRank *int
	if session.Mode == models.ModeContest {			contest, err := h.repo.Contest.GetActiveContest(r.Context())
		if err == nil && contest != nil {				hasEntered, _ := h.repo.Contest.HasPlayerEntered(r.Context(), contest.ID, req.PlayerID)
			if !hasEntered {					entry, err := h.repo.Contest.InsertEntry(r.Context(), contest.ID, req.PlayerID, gameID, req.WPM, req.Accuracy)
				if err != nil {
					log.Printf("failed to insert contest entry: %v", err)
				} else {
					contestRank = &entry.Rank
				}
			}
		}
	}

	resp := models.CompleteGameResponse{
		GameID:   fmt.Sprintf("%d", gameID),
		WPM:      req.WPM,
		Accuracy: req.Accuracy,
		XPEarned: xpEarned,
		Stars:    updated.Stars,
		Rank:     rank,
	}

	// ── Check Achievements ─────────────────────────
	// Build achievement check params from game results
	achParams := repository.AchievementCheckParams{
		WPM:      req.WPM,
		Accuracy: req.Accuracy,
		MaxCombo: req.MaxCombo,
	}

	// Fetch levels cleared count and streak for achievement checks
	levelsCleared, _ := h.repo.LevelProgress.GetCompletedCount(r.Context(), req.PlayerID)
	achParams.LevelsCleared = levelsCleared

	if player, err := h.repo.Player.GetByID(r.Context(), req.PlayerID); err == nil && player != nil {
		achParams.StreakCount = player.StreakCount
	}

	if contestRank != nil {
		achParams.ContestRank = *contestRank
	}

	achievementResult := h.repo.Achievement.CheckAllAchievements(r.Context(), req.PlayerID, achParams)

	// Include tier upgrade info if an upgrade occurred
	if upgradeResult != nil && upgradeResult.Upgraded {
		resp.Upgrade = upgradeResult
	}

	// Include achievement unlocks in response
	if achievementResult != nil && len(achievementResult.NewUnlocks) > 0 {
		resp.AchievementUnlocks = achievementResult.NewUnlocks
	}

	// Override rank with contest rank if applicable
	if contestRank != nil {
		resp.Rank = contestRank
	}

	writeJSON(w, http.StatusOK, resp)
}

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
		log.Printf("failed to fetch game history: %v", err)
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
		log.Printf("failed to fetch timed leaderboard: %v", err)
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
