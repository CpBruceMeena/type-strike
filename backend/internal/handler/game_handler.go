package handler

import (
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"strconv"
	"time"

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
			slog.Default().Error("failed to get/create contest", "player_id", req.PlayerID, "error", err)
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
		slog.Default().Error("failed to create game session", "player_id", req.PlayerID, "mode", req.Mode, "error", err)
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
		slog.Default().Error("failed to complete game session", "game_id", gameID, "error", err)
		writeError(w, http.StatusInternalServerError, "COMPLETE_FAILED", "Failed to complete game session")
		return
	}

	// Award XP to player
	if xpEarned > 0 {
		if _, _, err := h.repo.Player.AddXP(r.Context(), req.PlayerID, xpEarned); err != nil {
			slog.Default().Error("failed to award XP", "player_id", req.PlayerID, "error", err)
		}
		// Update progression total XP counter
		if err := h.repo.Progression.UpdateTotalXPEarned(r.Context(), req.PlayerID, xpEarned); err != nil {
			slog.Default().Error("failed to update total xp earned", "player_id", req.PlayerID, "error", err)
		}
	}

	// Check for tier upgrade
	upgradeResult, err := h.repo.Progression.CheckAndProcessUpgrade(r.Context(), req.PlayerID)
	if err != nil {
		slog.Default().Error("failed to check tier upgrade", "player_id", req.PlayerID, "error", err)
	}

	// Update streak
	if _, err := h.repo.Player.UpdateStreak(r.Context(), req.PlayerID); err != nil {
		slog.Default().Error("failed to update streak", "player_id", req.PlayerID, "error", err)
	}

	// Sync leaderboard
	if err := h.repo.Leaderboard.SyncPlayer(r.Context(), req.PlayerID); err != nil {
		slog.Default().Error("failed to sync leaderboard", "player_id", req.PlayerID, "error", err)
	}

	// Update timed leaderboard if applicable
	var rank *int
	if isTimedMode(session.Mode) {
		if err := h.repo.Game.UpsertTimedLeaderboard(r.Context(), req.PlayerID, session.Mode, req.WPM, req.Accuracy, gameID); err != nil {
			slog.Default().Error("failed to upsert timed leaderboard", "player_id", req.PlayerID, "error", err)
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
					slog.Default().Error("failed to insert contest entry", "player_id", req.PlayerID, "error", err)
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


