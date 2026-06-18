package handler

import (
	"encoding/json"
	"log"
	"net/http"
	"strconv"
	"time"

	"github.com/cpbrucemeena/type-strike-backend/internal/data"
	"github.com/cpbrucemeena/type-strike-backend/internal/models"
	"github.com/cpbrucemeena/type-strike-backend/internal/repository"
	"github.com/go-chi/chi/v5"
)

// DailyChallengeHandler handles HTTP requests for daily challenges.
type DailyChallengeHandler struct {
	repo *repository.Repositories
}

// NewDailyChallengeHandler creates a new DailyChallengeHandler.
func NewDailyChallengeHandler(repo *repository.Repositories) *DailyChallengeHandler {
	return &DailyChallengeHandler{repo: repo}
}

// GetOrGenerate handles GET /api/v1/players/{playerId}/daily-challenges
// Returns today's challenges for the player, generating them if they don't exist yet.
func (h *DailyChallengeHandler) GetOrGenerate(w http.ResponseWriter, r *http.Request) {
	playerID, err := strconv.Atoi(chi.URLParam(r, "playerId"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_PLAYER_ID", "Player ID must be a number")
		return
	}

	ctx := r.Context()
	today := time.Now()

	// Try to fetch existing challenges for today
	challenges, err := h.repo.DailyChallenge.GetChallengesForDate(ctx, playerID, today)
	if err != nil {
		log.Printf("failed to fetch daily challenges: %v", err)
		writeError(w, http.StatusInternalServerError, "FETCH_FAILED", "Failed to fetch daily challenges")
		return
	}

	// If challenges exist for today, return them
	if len(challenges) > 0 {
		writeJSON(w, http.StatusOK, map[string]interface{}{
			"challenges": challenges,
			"date":       today.Format("2006-01-02"),
		})
		return
	}

	// Generate new challenges for today
	// Get player's levels cleared count for appropriate challenge difficulty
	player, err := h.repo.Player.GetByID(ctx, playerID)
	levelsCleared := 0
	if err == nil && player != nil {
		progress, err := h.repo.LevelProgress.GetAllForPlayer(ctx, playerID)
		if err == nil {
			for _, p := range progress {
				if p.Completed {
					levelsCleared++
				}
			}
		}
	}

	generated := data.GenerateDailyChallenges(levelsCleared)

	// Convert to models for insertion
	var challengeModels []models.DailyChallenge
	for _, g := range generated {
		challengeModels = append(challengeModels, models.DailyChallenge{
			PlayerID:       playerID,
			ChallengeType:  g.ChallengeType,
			ChallengeName:  g.ChallengeName,
			Description:    g.Description,
			Icon:           g.Icon,
			LevelID:        g.LevelID,
			TargetWPM:      g.TargetWPM,
			TargetAccuracy: g.TargetAccuracy,
			RewardXP:       g.RewardXP,
			RewardStars:    g.RewardStars,
		})
	}

	// Insert into DB
	if err := h.repo.DailyChallenge.InsertChallenges(ctx, playerID, today, challengeModels); err != nil {
		log.Printf("failed to insert daily challenges: %v", err)
		writeError(w, http.StatusInternalServerError, "GENERATE_FAILED", "Failed to generate daily challenges")
		return
	}

	// Re-fetch to get the persisted records with IDs
	challenges, err = h.repo.DailyChallenge.GetChallengesForDate(ctx, playerID, today)
	if err != nil {
		log.Printf("failed to re-fetch daily challenges: %v", err)
		writeError(w, http.StatusInternalServerError, "FETCH_FAILED", "Failed to fetch generated challenges")
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"challenges": challenges,
		"date":       today.Format("2006-01-02"),
	})
}

// SubmitResult handles POST /api/v1/players/{playerId}/daily-challenges/{challengeId}/complete
// Updates challenge progress and awards rewards if the target was met.
//
// Request body: { "wpm": 65, "accuracy": 95.5 }
type submitResultRequest struct {
	WPM      int     `json:"wpm"`
	Accuracy float64 `json:"accuracy"`
}
type submitResultResponse struct {
	Challenge      models.DailyChallenge `json:"challenge"`
	RewardAwarded  bool                  `json:"reward_awarded"`
	RewardXP       int                   `json:"reward_xp"`
	RewardStars    int                   `json:"reward_stars"`
	JustCompleted  bool                  `json:"just_completed"`
	Message        string                `json:"message,omitempty"`
}

func (h *DailyChallengeHandler) SubmitResult(w http.ResponseWriter, r *http.Request) {
	playerID, err := strconv.Atoi(chi.URLParam(r, "playerId"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_PLAYER_ID", "Player ID must be a number")
		return
	}
	challengeID, err := strconv.Atoi(chi.URLParam(r, "challengeId"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_CHALLENGE_ID", "Challenge ID must be a number")
		return
	}

	var req submitResultRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_JSON", "Invalid request body")
		return
	}

	ctx := r.Context()

	// Check if challenge was already completed (before this attempt)
	challenges, err := h.repo.DailyChallenge.GetChallengesForDate(ctx, playerID, time.Now())
	if err != nil {
		writeError(w, http.StatusInternalServerError, "FETCH_FAILED", "Failed to fetch challenges")
		return
	}

	var wasAlreadyCompleted bool
	for _, c := range challenges {
		if c.ID == challengeID {
			wasAlreadyCompleted = c.Completed
			break
		}
	}

	// Update progress
	updated, err := h.repo.DailyChallenge.UpdateChallengeProgress(ctx, challengeID, playerID, req.WPM, req.Accuracy)
	if err != nil {
		log.Printf("failed to update challenge progress: %v", err)
		writeError(w, http.StatusInternalServerError, "UPDATE_FAILED", "Failed to update challenge progress")
		return
	}

	resp := submitResultResponse{
		Challenge:     *updated,
		RewardAwarded: false,
		JustCompleted: false,
	}

	// If the challenge was just completed (wasn't completed before, but is now)
	if !wasAlreadyCompleted && updated.Completed {
		resp.JustCompleted = true
		resp.RewardAwarded = true
		resp.RewardXP = updated.RewardXP
		resp.RewardStars = updated.RewardStars
		resp.Message = "Challenge completed! Rewards awarded."

		// Award XP and stars
		if err := h.repo.DailyChallenge.AwardChallengeReward(ctx, playerID, updated.RewardXP, updated.RewardStars); err != nil {
			log.Printf("failed to award challenge reward: %v", err)
			// Don't fail the request — the progress was already saved
			resp.Message = "Challenge completed but reward delivery failed. Please try again."
		}
	} else if updated.Completed {
		resp.Message = "Already completed! Better luck next time."
	} else {
		resp.Message = "Keep trying — you can do it!"
	}

	writeJSON(w, http.StatusOK, resp)
}
