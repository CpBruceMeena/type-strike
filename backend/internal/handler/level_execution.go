package handler

import (
	"context"
	"encoding/json"
	"log/slog"
	"math"
	"net/http"
	"strconv"

	"github.com/cpbrucemeena/type-strike-backend/internal/models"
	"github.com/go-chi/chi/v5"
	"gorm.io/gorm"
)

// executeLevelComplete handles the full level completion flow within a transaction.
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
			slog.Default().Warn("streak update failed", "player_id", playerID, "error", err)
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
				slog.Default().Error("failed to award level XP", "player_id", playerID, "error", err)
			}
			// Update progression total XP counter
			if err := h.repo.Progression.UpdateTotalXPEarned(ctx, playerID, xpEarned); err != nil {
				slog.Default().Error("failed to update total xp earned", "player_id", playerID, "error", err)
			}
		}

		// Check for tier upgrade
		result, err := h.repo.Progression.CheckAndProcessUpgrade(ctx, playerID)
		if err != nil {
			slog.Default().Error("failed to check tier upgrade", "player_id", playerID, "error", err)
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
