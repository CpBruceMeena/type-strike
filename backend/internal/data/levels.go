package data

import "github.com/cpbrucemeena/type-strike-backend/internal/models"

// LevelConfig holds the static configuration for a single level.
type LevelConfig struct {
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
}

// LevelConfigs is the full catalog of all 100 levels.
var LevelConfigs []LevelConfig

func init() {
	LevelConfigs = generateLevels()
}

// GetLevel returns the config for a specific level ID (1-indexed).
func GetLevel(id int) *LevelConfig {
	if id < 1 || id > len(LevelConfigs) {
		return nil
	}
	return &LevelConfigs[id-1]
}

// GetLevelsForTier returns all level configs for a given tier.
func GetLevelsForTier(tier string) []LevelConfig {
	var result []LevelConfig
	for _, l := range LevelConfigs {
		if l.Tier == tier {
			result = append(result, l)
		}
	}
	return result
}

// ToLevelDetail converts a config + optional player progress into a LevelDetail response.
func (c *LevelConfig) ToLevelDetail(progress *models.LevelProgress) models.LevelDetail {
	detail := models.LevelDetail{
		ID:            c.ID,
		Name:          c.Name,
		Tier:          c.Tier,
		Difficulty:    c.Difficulty,
		PassWPM:       c.PassWPM,
		PassAccuracy:  c.PassAccuracy,
		WordMinLength: c.WordMinLength,
		WordMaxLength: c.WordMaxLength,
		WordCount:     c.WordCount,
		SampleWords:   c.SampleWords,
	}
	if progress != nil {
		detail.PlayerBestWPM = &progress.BestWPM
		detail.PlayerBestAcc = &progress.BestAccuracy
		detail.PlayerStars = &progress.Stars
	}
	return detail
}

// Tier names, icons, and level ranges
const (
	TierEmber     = "ember"
	TierIgneous   = "igneious"
	TierMagmaCore = "magma_core"
	TierObsidian  = "obsidian"
)

var tierRange = map[string][2]int{
	TierEmber:     {1, 25},
	TierIgneous:   {26, 50},
	TierMagmaCore: {51, 75},
	TierObsidian:  {76, 100},
}

var emberNames = []string{
	"First Light", "Kindle", "Spark", "Flame", "Blaze",
	"Inferno", "Magma's Edge", "Lava Tunnel", "Core Access", "The Crucible",
	"Firestorm", "Wildfire", "Cinder", "Torch", "Pyre",
	"Bonfire", "Ember Glow", "Heat Wave", "Scald", "Burnout",
	"Flashover", "Firelight", "Warmth", "Flicker", "Combustion",
}

var igneousNames = []string{
	"Basalt", "Granite", "Pumice", "Obsidian Shard", "Rhyolite",
	"Andesite", "Diorite", "Gabbro", "Pegmatite", "Scoria",
	"Tuff", "Volcanic Ash", "Lava Flow", "Magma Chamber", "Plume",
	"Geode", "Crystal Cavern", "Molten Core", "Sinter", "Fumarole",
	"Hot Spring", "Geyser", "Caldera", "Vent", "Eruption",
}

var magmaCoreNames = []string{
	"Subterranean", "Abyssal", "Infernal Depths", "Plasma Field", "Solar Flare",
	"Thermal Vent", "Nucleus", "Fusion Core", "Reactor", "Meltdown",
	"Overload", "Surge", "Singularity", "Nova", "Supernova",
	"Quasar", "Pulsar", "Heliopause", "Event Horizon", "Solar Wind",
	"Corona", "Prominence", "Chromosphere", "Photosphere", "Radiant",
}

var obsidianNames = []string{
	"Void Walker", "Dark Matter", "Black Ice", "Obsidian Throne", "Shadow Strike",
	"Neon Night", "Digital Abyss", "Cyber Core", "Neural Storm", "Quantum Leap",
	"Zenith", "Apex", "Pinnacle", "Omega", "Absolute Zero",
	"Speed of Light", "Last Stand", "Final Forge", "Unstoppable", "Godspeed",
	"Perfection", "Immortal", "Transcendence", "Eternal Flame", "Type-Strike",
}

func pickSamples(wordMin, wordMax int) []string {
	samples := []string{"STRIKE", "FLAME", "BLAZE", "MAGMA", "EMBER", "FURY", "FORGE", "CRUSH",
		"SHATTER", "PLASMA", "INFERNO", "IGNITE", "BURST", "THRUST", "CRYSTAL",
		"OBSIDIAN", "VOLCANO", "THUNDER", "RAPID", "SPEED", "PRECISE", "ACCURATE",
		"POWER", "RAGING", "BURNING", "GLASS", "SHARD", "TEMPER", "FORGE", "ANVIL"}
	// Pick 3, filtering by length
	var picked []string
	for _, w := range samples {
		if len(w) >= wordMin && len(w) <= wordMax {
			picked = append(picked, w)
			if len(picked) >= 3 {
				break
			}
		}
	}
	// Fallback
	for len(picked) < 3 {
		picked = append(picked, "STRIKE")
	}
	return picked
}

func generateLevels() []LevelConfig {
	var levels []LevelConfig

	tiers := []struct {
		name      string
		names     []string
		rng       [2]int
		diff      int
		passWPM   [2]int
		passAcc   [2]int
		wordLen   [2]int
		wordCount [2]int
	}{
		{TierEmber, emberNames, tierRange[TierEmber], 1, [2]int{30, 40}, [2]int{85, 88}, [2]int{3, 5}, [2]int{10, 10}},
		{TierIgneous, igneousNames, tierRange[TierIgneous], 2, [2]int{40, 55}, [2]int{88, 92}, [2]int{4, 7}, [2]int{12, 12}},
		{TierMagmaCore, magmaCoreNames, tierRange[TierMagmaCore], 3, [2]int{55, 70}, [2]int{90, 93}, [2]int{5, 9}, [2]int{15, 15}},
		{TierObsidian, obsidianNames, tierRange[TierObsidian], 4, [2]int{70, 85}, [2]int{92, 95}, [2]int{6, 12}, [2]int{18, 18}},
	}

	for _, t := range tiers {
		start, end := t.rng[0], t.rng[1]
		for i := start; i <= end; i++ {
			idx := i - start
			progress := float64(idx) / float64(end-start)
			wpm := t.passWPM[0] + int(progress*float64(t.passWPM[1]-t.passWPM[0]))
			acc := t.passAcc[0] + int(progress*float64(t.passAcc[1]-t.passAcc[0]))
			wMin := t.wordLen[0]
			wMax := t.wordLen[1]
			wCount := t.wordCount[0] + int(progress*float64(t.wordCount[1]-t.wordCount[0]))

			levels = append(levels, LevelConfig{
				ID:            i,
				Name:          t.names[idx],
				Tier:          t.name,
				Difficulty:    t.diff,
				PassWPM:       wpm,
				PassAccuracy:  acc,
				WordMinLength: wMin,
				WordMaxLength: wMax,
				WordCount:     wCount,
				SampleWords:   pickSamples(wMin, wMax),
			})
		}
	}

	return levels
}
