package handler

import (
	"encoding/json"
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

	// Read player streak for the response
	player, _ := h.repo.Player.GetByID(ctx, playerID)
	streakCount := 0
	if player != nil {
		streakCount = player.StreakCount
	}

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
			"challenges":         challenges,
			"date":               today.Format("2006-01-02"),
			"streak_count":       streakCount,
			"streak_multiplier":  computeStreakMultiplier(streakCount),
		})
		return
	}

	// Generate new challenges for today
	// Get player's levels cleared count for appropriate challenge difficulty
	levelsCleared := 0
	if player != nil {
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
		"challenges":         challenges,
		"date":               today.Format("2006-01-02"),
		"streak_count":       streakCount,
		"streak_multiplier":  computeStreakMultiplier(streakCount),
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
	Challenge        models.DailyChallenge `json:"challenge"`
	RewardAwarded    bool                  `json:"reward_awarded"`
	RewardXP         int                   `json:"reward_xp"`
	RewardStars      int                   `json:"reward_stars"`
	JustCompleted    bool                  `json:"just_completed"`
	Message          string                `json:"message,omitempty"`
	StreakCount      int                   `json:"streak_count"`
	StreakMultiplier float64               `json:"streak_multiplier"`
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

	// Read player's current streak for multiplier
	player, _ := h.repo.Player.GetByID(ctx, playerID)
	streakCount := 0
	if player != nil {
		streakCount = player.StreakCount
	}
	multiplier := computeStreakMultiplier(streakCount)

	resp := submitResultResponse{
		Challenge:        *updated,
		RewardAwarded:    false,
		JustCompleted:    false,
		StreakCount:      streakCount,
		StreakMultiplier: multiplier,
	}

	// If the challenge was just completed (wasn't completed before, but is now)
	if !wasAlreadyCompleted && updated.Completed {
		resp.JustCompleted = true
		resp.RewardAwarded = true

		// Apply streak multiplier to base rewards
		baseXP := updated.RewardXP
		baseStars := updated.RewardStars
		rewardedXP := int(float64(baseXP) * multiplier)
		rewardedStars := int(math.Ceil(float64(baseStars) * multiplier))
		resp.RewardXP = rewardedXP
		resp.RewardStars = rewardedStars
		resp.Message = "Challenge completed! Rewards awarded."

		// Award XP and stars (with streak bonus applied)
		if err := h.repo.DailyChallenge.AwardChallengeReward(ctx, playerID, rewardedXP, rewardedStars); err != nil {
			log.Printf("failed to award challenge reward: %v", err)
			resp.Message = "Challenge completed but reward delivery failed. Please try again."
		}

		// Update streak after completing a challenge
		if _, err := h.repo.Player.UpdateStreak(ctx, playerID); err != nil {
			log.Printf("failed to update streak on challenge complete: %v", err)
		}
	} else if updated.Completed {
		resp.Message = "Already completed! Better luck next time."
	} else {
		resp.Message = "Keep trying — you can do it!"
	}

	writeJSON(w, http.StatusOK, resp)
}

// computeStreakMultiplier calculates the reward multiplier based on streak count.
// Formula: 1.0 + (streak - 1) * 0.1, clamped to [1.0, 2.0]
// First day (streak=0 or 1): no bonus (1.0x)
// 2-day streak: 1.1x
// 5-day streak: 1.4x
// 10-day streak: 1.9x
// 11+ day streak: 2.0x (max)
func computeStreakMultiplier(streakCount int) float64 {
	switch {
	case streakCount <= 1:
		return 1.0
	case streakCount >= 11:
		return 2.0
	default:
		return 1.0 + float64(streakCount-1)*0.1
	}
}
