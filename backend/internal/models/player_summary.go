package models

// XPForNextLevel returns the XP required to reach the next level.
// Formula: 100 * currentLevel * 1.5
func XPForNextLevel(currentLevel int) int {
	return int(float64(100*currentLevel) * 1.5)
}

// PlayerSummary is the combined response for the home/dashboard screen.
// It aggregates player identity, today's stats, and recent activity.
type PlayerSummary struct {
	Player         Player            `json:"player"`
	TodaysBestWPM  int               `json:"todays_best_wpm"`
	LevelsTotal    int               `json:"levels_total"`
	LevelsCleared  int               `json:"levels_cleared"`
	RecentActivity []Activity        `json:"recent_activity"`
	NextLevelXP    int               `json:"next_level_xp"`
	Settings       map[string]string `json:"settings"`
}

// LevelDetail returns detailed info about a specific level for the Level Preview.
type LevelDetail struct {
	ID            int      `json:"id"`
	Name          string   `json:"name"`
	Tier          string   `json:"tier"`
	Difficulty    int      `json:"difficulty"`
	PassWPM       int      `json:"pass_wpm"`
	PassAccuracy  int      `json:"pass_accuracy"`
	WordMinLength int      `json:"word_min_length"`
	WordMaxLength int      `json:"word_max_length"`
	WordCount     int      `json:"word_count"`
	SampleWords   []string `json:"sample_words"`
	PlayerBestWPM *int     `json:"player_best_wpm,omitempty"`
	PlayerBestAcc *float64 `json:"player_best_acc,omitempty"`
	PlayerStars   *int     `json:"player_stars,omitempty"`
}
