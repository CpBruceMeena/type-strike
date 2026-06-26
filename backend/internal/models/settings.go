package models

// Setting represents a single player preference key-value pair.
type Setting struct {
	ID       int    `json:"id" gorm:"primaryKey;autoIncrement"`
	PlayerID int    `json:"player_id" gorm:"column:player_id;uniqueIndex:idx_player_key"`
	Key      string `json:"key" gorm:"uniqueIndex:idx_player_key"`
	Value    string `json:"value"`
}

func (Setting) TableName() string { return "settings" }

// BatchUpdateSettingsRequest is the payload to update multiple settings at once.
type BatchUpdateSettingsRequest struct {
	Settings map[string]string `json:"settings"`
}

// DefaultSettings returns the default settings for a new player.
func DefaultSettings() map[string]string {
	return map[string]string{
		"keyboard_layout":    "QWERTY",
		"key_size":           "M",
		"key_click_type":     "BLUE",
		"sound_volume":       "0.8",
		"music_volume":       "0.5",
		"haptics_on":         "true",
		"haptics_intensity":  "MEDIUM",
		"reduced_particles":  "false",
		"font_size":          "1.0",
		"high_contrast":      "false",
		"left_handed":        "false",
	}
}
