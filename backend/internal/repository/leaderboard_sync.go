package repository

import (
	"context"
	"fmt"
)

// SyncPlayer refreshes or inserts a leaderboard entry for a specific player.
func (r *LeaderboardRepository) SyncPlayer(ctx context.Context, playerID int) error {
	rawSQL := `
		INSERT INTO leaderboard_entries (player_id, player_name, level, xp, total_stars, levels_cleared, best_wpm, updated_at)
		SELECT
			p.id,
			COALESCE(p.title, ''),
			p.level, p.xp, p.total_stars,
			(SELECT COUNT(*) FROM level_progress WHERE player_id = p.id AND completed = true),
			(SELECT COALESCE(MAX(best_wpm), 0) FROM level_progress WHERE player_id = p.id)
		FROM players p
		WHERE p.id = $1
		ON CONFLICT (player_id) DO UPDATE SET
			player_name    = EXCLUDED.player_name,
			level          = EXCLUDED.level,
			xp             = EXCLUDED.xp,
			total_stars    = EXCLUDED.total_stars,
			levels_cleared = EXCLUDED.levels_cleared,
			best_wpm       = EXCLUDED.best_wpm,
			updated_at     = NOW()
	`
	if err := r.db.WithContext(ctx).Exec(rawSQL, playerID).Error; err != nil {
		return fmt.Errorf("sync leaderboard entry: %w", err)
	}
	return nil
}
