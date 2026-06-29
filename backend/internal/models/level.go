package models

// Level represents a single level configuration stored in the database.
// All level data (paragraph, pass thresholds, name, tier) comes from here.
type Level struct {
	ID           int    `json:"id" gorm:"primaryKey"`
	Name         string `json:"name" gorm:"type:varchar(100);not null"`
	Tier         string `json:"tier" gorm:"type:varchar(20);not null;index"`
	Difficulty   int    `json:"difficulty" gorm:"default:1"`
	PassWPM      int    `json:"pass_wpm" gorm:"column:pass_wpm;not null"`
	PassAccuracy int    `json:"pass_accuracy" gorm:"column:pass_accuracy;not null"`
	Paragraph    string `json:"paragraph" gorm:"type:text;not null"`
}

func (Level) TableName() string { return "levels" }
