package models

import "time"

// Contest represents a competition period with a fixed paragraph.
type Contest struct {
	ID         int       `json:"contest_id"`
	StartDate  time.Time `json:"start_date"`
	EndDate    time.Time `json:"end_date"`
	Paragraph  string    `json:"paragraph"`
	Difficulty string    `json:"difficulty"`
	IsActive   bool      `json:"is_active"`
	CreatedAt  time.Time `json:"created_at"`
}

// ContestEntry represents a single player's submission in a contest.
type ContestEntry struct {
	ID            int       `json:"id"`
	ContestID     int       `json:"contest_id"`
	PlayerID      int       `json:"player_id"`
	GameSessionID string    `json:"game_session_id"`
	WPM           int       `json:"wpm"`
	Accuracy      float64   `json:"accuracy"`
	Rank          int       `json:"rank"`
	PlayerName    string    `json:"player_name,omitempty"`
	PlayerLevel   int       `json:"player_level,omitempty"`
	CreatedAt     time.Time `json:"created_at"`
}

// ContestCurrentResponse is the response for GET /api/v1/contest/current.
type ContestCurrentResponse struct {
	ContestID    int                  `json:"contest_id"`
	StartDate    time.Time            `json:"start_date"`
	EndDate      time.Time            `json:"end_date"`
	Paragraph    string               `json:"paragraph"`
	Difficulty   string               `json:"difficulty"`
	PlayerEntry  *ContestPlayerEntry  `json:"player_entry"`
}

// ContestPlayerEntry shows the current player's contest status.
type ContestPlayerEntry struct {
	WPM      *int     `json:"wpm"`
	Accuracy *float64 `json:"accuracy"`
	Rank     *int     `json:"rank"`
}

// ContestLeaderboardResponse wraps contest leaderboard results.
type ContestLeaderboardResponse struct {
	Entries     []ContestEntry      `json:"entries"`
	TotalCount  int                 `json:"total_count"`
	PlayerEntry *ContestEntry       `json:"player_entry,omitempty"`
}
