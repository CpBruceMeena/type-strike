package models

import "time"

// Contest represents a competition period with a fixed paragraph.
type Contest struct {
	ID         int       `json:"contest_id" gorm:"primaryKey;autoIncrement"`
	StartDate  time.Time `json:"start_date" gorm:"column:start_date;index"`
	EndDate    time.Time `json:"end_date" gorm:"column:end_date"`
	Paragraph  string    `json:"paragraph" gorm:"type:text"`
	Difficulty string    `json:"difficulty" gorm:"default:'expert'"`
	IsActive   bool      `json:"is_active" gorm:"column:is_active;default:true"`
	CreatedAt  time.Time `json:"created_at" gorm:"column:created_at;autoCreateTime"`
}

func (Contest) TableName() string { return "contests" }

// ContestEntry represents a single player's submission in a contest.
type ContestEntry struct {
	ID            int       `json:"id" gorm:"primaryKey;autoIncrement"`
	ContestID     int       `json:"contest_id" gorm:"column:contest_id;index"`
	PlayerID      int       `json:"player_id" gorm:"column:player_id;index"`
	GameSessionID int64     `json:"game_session_id" gorm:"column:game_session_id"`
	WPM           int       `json:"wpm"`
	Accuracy      float64   `json:"accuracy"`
	Rank          int       `json:"rank" gorm:"default:0"`
	PlayerName    string    `json:"player_name,omitempty" gorm:"-"` // populated via join
	PlayerLevel   int       `json:"player_level,omitempty" gorm:"-"` // populated via join
	CreatedAt     time.Time `json:"created_at" gorm:"column:created_at;autoCreateTime"`
}

func (ContestEntry) TableName() string { return "contest_entries" }

// ContestCurrentResponse is the response for GET /api/v1/contest/current.
type ContestCurrentResponse struct {
	ContestID  int                 `json:"contest_id"`
	StartDate  time.Time           `json:"start_date"`
	EndDate    time.Time           `json:"end_date"`
	Paragraph  string              `json:"paragraph"`
	Difficulty string              `json:"difficulty"`
	PlayerEntry *ContestPlayerEntry `json:"player_entry"`
}

// ContestPlayerEntry shows the current player's contest status.
type ContestPlayerEntry struct {
	WPM      *int     `json:"wpm"`
	Accuracy *float64 `json:"accuracy"`
	Rank     *int     `json:"rank"`
}

// ContestLeaderboardResponse wraps contest leaderboard results.
type ContestLeaderboardResponse struct {
	Entries     []ContestEntry `json:"entries"`
	TotalCount  int            `json:"total_count"`
	PlayerEntry *ContestEntry  `json:"player_entry,omitempty"`
}
