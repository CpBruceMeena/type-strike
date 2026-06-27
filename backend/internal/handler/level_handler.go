package handler

import (
	"context"
	"encoding/json"
	"log"
	"math"
	"net/http"
	"strconv"

	"github.com/cpbrucemeena/type-strike-backend/internal/models"
	"github.com/cpbrucemeena/type-strike-backend/internal/repository"
	"github.com/go-chi/chi/v5"
	"gorm.io/gorm"
)

// LevelHandler handles HTTP requests for level progress operations.
type LevelHandler struct {
	repo *repository.Repositories
	db   *gorm.DB
}

// NewLevelHandler creates a new LevelHandler.
func NewLevelHandler(repo *repository.Repositories, db *gorm.DB) *LevelHandler {
	return &LevelHandler{repo: repo, db: db}
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

	log.Printf("[LEVEL_COMPLETE] player=%d level=%d wpm=%d acc=%.2f stars=%d completed=%v",
		playerID, levelID, req.WPM, req.Accuracy, req.Stars, req.Completed)

	progress, upgradeResult, err := h.executeLevelComplete(r.Context(), playerID, levelID, req)
	if err != nil {
		log.Printf("[LEVEL_COMPLETE_ERROR] player=%d level=%d err=%v", playerID, levelID, err)
		writeError(w, http.StatusInternalServerError, "UPDATE_FAILED", "Failed to update level progress")
		return
	}

	log.Printf("[LEVEL_COMPLETE_OK] player=%d level=%d stars=%d best_wpm=%d best_acc=%.2f attempts=%d upgrades=%v",
		playerID, levelID, progress.Stars, progress.BestWPM, progress.BestAccuracy, progress.Attempts,
		upgradeResult != nil && upgradeResult.Upgraded)

	if upgradeResult != nil && upgradeResult.Upgraded {
		log.Printf("[TIER_UPGRADE] player=%d from=%q to=%q unlocks=%v",
			playerID,
			upgradeResult.PreviousTier.DisplayName,
			upgradeResult.NewTier.DisplayName,
			upgradeResult.NewUnlocks)
	}

	// ── Check Achievements ─────────────────────────
	achParams := repository.AchievementCheckParams{
		WPM:      req.WPM,
		Accuracy: req.Accuracy,
	}

	// Fetch combo and streak data from game session history if available
	if player, err := h.repo.Player.GetByID(r.Context(), playerID); err == nil && player != nil {
		achParams.StreakCount = player.StreakCount
	}

	// Count total levels cleared
	levelsCleared, _ := h.repo.LevelProgress.GetCompletedCount(r.Context(), playerID)
	achParams.LevelsCleared = levelsCleared

	achievementResult := h.repo.Achievement.CheckAllAchievements(r.Context(), playerID, achParams)

	resp := models.LevelCompleteResponse{
		LevelProgress: progress,
	}
	if upgradeResult != nil && upgradeResult.Upgraded {
		resp.Upgrade = upgradeResult
	}
	if achievementResult != nil && len(achievementResult.NewUnlocks) > 0 {
		resp.AchievementUnlocks = achievementResult.NewUnlocks
	}

	writeJSON(w, http.StatusOK, resp)
}

func (h *LevelHandler) executeLevelComplete(ctx context.Context, playerID, levelID int, req models.UpdateLevelProgressRequest) (*models.LevelProgress, *models.TierUpgradeResponse, error) {
	var progress models.LevelProgress

	err := h.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		// Upsert level progress within the transaction
		rawSQL := `
			INSERT INTO level_progress (player_id, level_id, stars, best_wpm, best_accuracy, completed, attempts, last_played_at)
			VALUES ($1, $2, $3, $4, $5, $6, 1, NOW())
			ON CONFLICT (player_id, level_id)
			DO UPDATE SET
				stars = GREATEST(level_progress.stars, EXCLUDED.stars),
				best_wpm = GREATEST(level_progress.best_wpm, EXCLUDED.best_wpm),
				best_accuracy = GREATEST(level_progress.best_accuracy, EXCLUDED.best_accuracy),
				completed = level_progress.completed OR EXCLUDED.completed,
				attempts = level_progress.attempts + 1,
				last_played_at = NOW()
			RETURNING id, player_id, level_id, stars, best_wpm, best_accuracy, completed, attempts, last_played_at
		`
		if err := tx.Raw(rawSQL, playerID, levelID, req.Stars, req.WPM, req.Accuracy, req.Completed).Scan(&progress).Error; err != nil {
			return err
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

		activity := models.Activity{
			PlayerID: playerID,
			Type:     activityType,
			Metadata: meta,
		}
		if err := tx.Create(&activity).Error; err != nil {
			return err
		}

		// Update streak after level completion (non-fatal if it fails)
		if _, err := h.repo.Player.UpdateStreak(ctx, playerID); err != nil {
			log.Printf("streak update failed (non-fatal): player=%d err=%v", playerID, err)
		}

		return nil
	})
	if err != nil {
		return nil, nil, err
	}

	// Award XP for level completion, outside the transaction
	var upgradeResult *models.TierUpgradeResponse
	if req.Completed {
		xpEarned := computeLevelXP(req.WPM, req.Accuracy)
		if xpEarned > 0 {
			if _, _, err := h.repo.Player.AddXP(ctx, playerID, xpEarned); err != nil {
				log.Printf("failed to award level XP: %v", err)
			}
			// Update progression total XP counter
			if err := h.repo.Progression.UpdateTotalXPEarned(ctx, playerID, xpEarned); err != nil {
				log.Printf("failed to update total xp earned: %v", err)
			}
		}

		// Check for tier upgrade
		result, err := h.repo.Progression.CheckAndProcessUpgrade(ctx, playerID)
		if err != nil {
			log.Printf("failed to check tier upgrade: %v", err)
		} else {
			upgradeResult = result
		}
	}

	return &progress, upgradeResult, nil
}

// computeLevelXP calculates XP rewards for level completion.
func computeLevelXP(wpm int, accuracy float64) int {
	base := int(math.Max(5, float64(wpm)*0.3))
	accBonus := int(math.Floor(accuracy*100-80)) * 1
	return int(math.Max(0, float64(base+accBonus)))
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
