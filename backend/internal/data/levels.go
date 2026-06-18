package data

import (
	"fmt"
	"math/rand"
	"strings"
	"time"

	"github.com/cpbrucemeena/type-strike-backend/internal/models"
)

// LevelConfig holds the static configuration for a single level.
type LevelConfig struct {
	ID           int    `json:"id"`
	Name         string `json:"name"`
	Tier         string `json:"tier"`
	Difficulty   int    `json:"difficulty"`
	PassWPM      int    `json:"pass_wpm"`
	PassAccuracy int    `json:"pass_accuracy"`
	Paragraph    string `json:"paragraph"`
}

// LevelConfigs is the full catalog of all 100 levels.
var LevelConfigs []LevelConfig

func init() {
	LevelConfigs = generateLevels()
}

// GetLevel returns the config for a specific level ID (1-indexed).
// Levels beyond the pre-generated 100 are generated dynamically on-the-fly,
// so new levels can be added indefinitely without a code change.
func GetLevel(id int) *LevelConfig {
	if id < 1 {
		return nil
	}
	if id <= len(LevelConfigs) {
		return &LevelConfigs[id-1]
	}
	// Dynamically generate level for IDs beyond the existing catalog.
	return generateDynamicLevel(id)
}

// generateDynamicLevel creates a level config on-the-fly for IDs > 100.
// Uses the "beyond" tier with difficulty and WPM/accuracy scaling.
func generateDynamicLevel(id int) *LevelConfig {
	parts := advancedParts
	seed := int64(id)*1000 + 42
	paragraph := genParagraph(id, parts, seed)

	// Scale difficulty gradually beyond level 100:
	// WPM: starts at 85 (end of Obsidian) and increases by ~3 per 10 levels
	// Accuracy: stays at 95%
	baseWPM := 85 + (id-100)/10*3
	if baseWPM > 200 {
		baseWPM = 200
	}
	baseAcc := 95
	if id > 150 {
		baseAcc = 96
	}

	// Generate a name
	name := genBeyondName(id)

	// Use the first few beyond names for the "beyond" pool, then auto-generate
	poolIdx := id - 101
	if poolIdx >= 0 && poolIdx < len(beyondNames) {
		name = beyondNames[poolIdx]
	}

	return &LevelConfig{
		ID:           id,
		Name:         name,
		Tier:         TierBeyond,
		Difficulty:   5,
		PassWPM:      baseWPM,
		PassAccuracy: baseAcc,
		Paragraph:    paragraph,
	}
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
		ID:           c.ID,
		Name:         c.Name,
		Tier:         c.Tier,
		Difficulty:   c.Difficulty,
		PassWPM:      c.PassWPM,
		PassAccuracy: c.PassAccuracy,
		Paragraph:    c.Paragraph,
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
	TierBeyond    = "beyond"
)

var tierRange = map[string][2]int{
	TierEmber:     {1, 25},
	TierIgneous:   {26, 50},
	TierMagmaCore: {51, 75},
	TierObsidian:  {76, 100},
	TierBeyond:    {101, -1}, // -1 means unlimited — levels are generated dynamically
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

// beyondNames is an extensible pool for levels 101+.
// Add new names here to create more levels!
var beyondNames = []string{
	"New Dawn", "Solar Ignition", "Plasma Surge", "Infinite Loop", "Recursion",
	"Deep Core", "Mantle Shift", "Crust Break", "Lava Rise", "Volcanic Winter",
	"Phoenix", "Rebirth", "Second Wind", "Afterglow", "Supernova Remnant",
	"Neutron Star", "Pulsar Wave", "Gamma Burst", "Cosmic Dust", "Stellar Wind",
	"Nebula", "Protostar", "Red Giant", "White Dwarf", "Black Hole",
	"Event Horizon", "Singularity", "Wormhole", "Dark Energy", "Antimatter",
	"Quantum Entanglement", "String Theory", "Dark Flow", "Cosmic Ray", "Solar Wind II",
	"The Final Spark", "Ember's Return", "Infinite Forge", "The Last Keycap", "God Mode",
}

// genBeyondName generates a name for levels beyond the beyondNames pool.
func genBeyondName(levelID int) string {
	adjectives := []string{"Ultimate", "Infinite", "Luminous", "Radiant", "Eternal", "Arcane", "Mythic", "Astral", "Void", "Omega"}
	nouns := []string{"Strike", "Forge", "Flame", "Core", "Storm", "Fury", "Blade", "Spark", "Star", "Gate"}
	seed := rand.New(rand.NewSource(int64(levelID)))
	a := adjectives[seed.Intn(len(adjectives))]
	n := nouns[seed.Intn(len(nouns))]
	return fmt.Sprintf("%s %s — %d", a, n, levelID)
}

// ── Paragraph Generation ─────────────────────────────────

// sentenceParts groups words for building paragraphs at different complexity levels.
type sentenceParts struct {
	subjects  []string
	verbs     []string
	objects   []string
	adjectives []string
	adverbs   []string
}

var basicParts = sentenceParts{
	subjects:   []string{"the fire", "a spark", "the flame", "magma", "the forge", "heat", "the core", "steel", "the blade", "fury"},
	verbs:      []string{"burns", "glows", "rises", "flows", "forges", "strikes", "cracks", "shines", "blazes", "surges"},
	objects:    []string{"the stone", "the anvil", "the mountain", "the sky", "the ground", "the dark", "the light", "the path", "the wall", "the gate"},
	adjectives: []string{"hot", "bright", "strong", "deep", "hard", "fast", "cold", "dark", "warm", "pure"},
	adverbs:    []string{"slowly", "quickly", "deeply", "brightly", "boldly", "silently", "fiercely", "steadily", "swiftly", "calmly"},
}

var advancedParts = sentenceParts{
	subjects:   []string{"the obsidian throne", "every warrior", "the ancient forge", "crystal caverns", "the molten core", "neural storms", "digital abyss", "quantum flux", "void walkers", "solar flares"},
	verbs:      []string{"shatters", "transforms", "illuminates", "crystallizes", "accelerates", "overloads", "synchronizes", "detonates", "penetrates", "calibrates"},
	objects:    []string{"the event horizon", "every particle", "the singularity", "dark matter", "the plasma field", "neural networks", "cyber cores", "fusion reactors", "quantum states", "star systems"},
	adjectives: []string{"unrelenting", "magnificent", "primordial", "incandescent", "unstoppable", "immortal", "transcendent", "infinite", "absolute", "radiant"},
	adverbs:    []string{"relentlessly", "magnificently", "inevitably", "instantaneously", "unconditionally", "exponentially", "systematically", "cataclysmically", "permanently", "definitively"},
}

// paragraphTemplates are sentence structures for each complexity level.
// Placeholders: {S}=subject, {V}=verb, {O}=object, {Adj}=adjective, {Adv}=adverb
type paragraphTemplate struct {
	structures [][]string // each inner slice is one sentence's structure
}

func genParagraph(levelID int, parts sentenceParts, seed int64) string {
	rng := rand.New(rand.NewSource(seed))
	_ = rng // used below when selecting from parts

	pick := func(list []string) string {
		if len(list) == 0 {
			return "fire"
		}
		return list[rng.Intn(len(list))]
	}

	// Paragraph length scales smoothly with level number.
	// Level 1 → 2 sentences, Level 50 → 4 sentences, Level 100 → 6 sentences.
	// Formula: 2 + (levelID * 4 / 100), clamped to 2..6.
	sentenceCount := 2 + (levelID * 4 / 100)
	if sentenceCount < 2 {
		sentenceCount = 2
	}
	if sentenceCount > 6 {
		sentenceCount = 6
	}

	var sentences []string

	// Build sentences using different structures
	structures := []func() string{
		// "The fire burns brightly."
		func() string {
			return fmt.Sprintf("%s %s %s.", pick(parts.subjects), pick(parts.verbs), pick(parts.adverbs))
		},
		// "A hot flame forges the stone."
		func() string {
			return fmt.Sprintf("the %s %s %s %s.", pick(parts.adjectives), pick(parts.subjects), pick(parts.verbs), pick(parts.objects))
		},
		// "Deep in the core, the forge glows."
		func() string {
			return fmt.Sprintf("%s in %s, %s %s.", pick(parts.adjectives), pick(parts.objects), pick(parts.subjects), pick(parts.verbs))
		},
		// "Steel strikes the anvil swiftly."
		func() string {
			return fmt.Sprintf("%s %s %s %s.", pick(parts.subjects), pick(parts.verbs), pick(parts.objects), pick(parts.adverbs))
		},
		// "The bright flame burns and the steel forges."
		func() string {
			return fmt.Sprintf("%s %s %s and %s %s.", "the "+pick(parts.adjectives), parts.subjects[rng.Intn(len(parts.subjects))], pick(parts.verbs), parts.subjects[rng.Intn(len(parts.subjects))], pick(parts.verbs))
		},
	}

	// Advanced structures for high levels
	advancedStructures := []func() string{
		// With commas and clauses
		func() string {
			return fmt.Sprintf("when %s %s, %s %s.", pick(parts.subjects), pick(parts.verbs), pick(parts.subjects), pick(parts.verbs))
		},
		// With "the more… the more" pattern
		func() string {
			return fmt.Sprintf("the more %s %s, the more %s %s.", pick(parts.subjects), pick(parts.verbs), pick(parts.subjects), pick(parts.verbs))
		},
		// Complex with multiple modifiers
		func() string {
			return fmt.Sprintf("%s and %s, %s %s %s.", pick(parts.adjectives), pick(parts.adjectives), pick(parts.subjects), pick(parts.verbs), pick(parts.adverbs))
		},
	}

	// Add level-specific thematic variation
	switch {
	case levelID <= 25:
		// Simple: mostly basic sentences, all lowercase
		for i := 0; i < sentenceCount; i++ {
			s := structures[rng.Intn(len(structures))]()
			// Lowercase everything
			sentences = append(sentences, s)
		}
	case levelID <= 50:
		// Medium: mix basic + some advanced, capitalize first word
		for i := 0; i < sentenceCount; i++ {
			var s string
			if rng.Float32() < 0.4 {
				s = advancedStructures[rng.Intn(len(advancedStructures))]()
			} else {
				s = structures[rng.Intn(len(structures))]()
			}
			// Capitalize first letter
			if len(s) > 0 {
				s = strings.ToUpper(s[:1]) + s[1:]
			}
			// Sprinkle some numbers
			if rng.Float32() < 0.2 {
				s = strings.TrimRight(s, ".") + fmt.Sprintf(" %d.", rng.Intn(100))
			}
			sentences = append(sentences, s)
		}
	case levelID <= 75:
		// Complex: advanced structures, numbers, mixed case
		for i := 0; i < sentenceCount; i++ {
			s := advancedStructures[rng.Intn(len(advancedStructures))]()
			// Capitalize first letter
			if len(s) > 0 {
				s = strings.ToUpper(s[:1]) + s[1:]
			}
			// Add numbers and percentages
			switch rng.Intn(3) {
			case 0:
				s = strings.TrimRight(s, ".") + fmt.Sprintf(" (%d%%)", rng.Intn(100)+1)
			case 1:
				s = strings.TrimRight(s, ".") + fmt.Sprintf(" at %dx speed!", rng.Intn(10)+1)
			}
			// Sometimes add an exclamation
			if rng.Float32() < 0.3 {
				s = strings.TrimRight(s, ".") + "!"
			}
			sentences = append(sentences, s)
		}
	default:
		// Expert: full complexity, special chars, mixed case, quotes
		for i := 0; i < sentenceCount; i++ {
			base := advancedStructures[rng.Intn(len(advancedStructures))]()
			if len(base) > 0 {
				base = strings.ToUpper(base[:1]) + base[1:]
			}
			// Add various special characters and formatting
			switch rng.Intn(5) {
			case 0:
				base = fmt.Sprintf("\"%s\" - level %d requires %dwpm at %d%% acc.", strings.TrimRight(base, "."), levelID+1, 60+rng.Intn(40), 90+rng.Intn(10))
			case 1:
				base = fmt.Sprintf("%s $%d.%02d value @%d%% threshold.", strings.TrimRight(base, "."), rng.Intn(1000), rng.Intn(100), 50+rng.Intn(50))
			case 2:
				base = fmt.Sprintf("type_strike_%s => result: %s (err#%d).", pick(parts.adjectives), strings.TrimRight(base, "."), rng.Intn(5))
			case 3:
				base = fmt.Sprintf("%s [REQ: %d WPM | ACC: %d%%]", strings.TrimRight(base, "."), 70+rng.Intn(30), 93+rng.Intn(7))
			case 4:
				base = fmt.Sprintf("%s - precision++ && speed++ @ 100%%!", strings.TrimRight(base, "."))
			}
			sentences = append(sentences, base)
		}
	}

	return strings.Join(sentences, " ")
}

// GetLevelTotalCount returns the total number of levels that have unique names
// (pre-generated 100 + all named beyond levels). Levels beyond this count are
// dynamically generated with auto-generated names.
func GetLevelTotalCount() int {
	return len(LevelConfigs) + len(beyondNames)
}

// GenerateFreshLevels generates all 100 levels with fresh paragraphs (exported for seeding tools).
func GenerateFreshLevels() []LevelConfig {
	return generateLevels()
}

func generateLevels() []LevelConfig {
	var levels []LevelConfig

	tierKeys := []string{TierEmber, TierIgneous, TierMagmaCore, TierObsidian}
	tierNames := [][]string{emberNames, igneousNames, magmaCoreNames, obsidianNames}
	tierDiffs := []int{1, 2, 3, 4}
	tierWPM := [][2]int{{30, 40}, {40, 55}, {55, 70}, {70, 85}}
	tierAcc := [][2]int{{85, 88}, {88, 92}, {90, 93}, {92, 95}}

	rand.Seed(time.Now().UnixNano())

	for ti, name := range tierKeys {
		start, end := tierRange[name][0], tierRange[name][1]
		for i := start; i <= end; i++ {
			idx := i - start
			tierSize := end - start
			progress := 0.0
			if tierSize > 0 {
				progress = float64(idx) / float64(tierSize)
			}
			wpm := tierWPM[ti][0] + int(progress*float64(tierWPM[ti][1]-tierWPM[ti][0]))
			acc := tierAcc[ti][0] + int(progress*float64(tierAcc[ti][1]-tierAcc[ti][0]))

			// Determine which parts to use based on tier
			parts := basicParts
			if ti >= 1 { // Igneous and above use advanced too
				if ti >= 2 { // Magma Core and above use advanced primarily
					parts = advancedParts
				}
			}

			// Generate a deterministic-ish paragraph based on level ID + name
			seed := int64(i*1000 + len(tierNames[ti][idx]))
			paragraph := genParagraph(i, parts, seed)

			levels = append(levels, LevelConfig{
				ID:           i,
				Name:         tierNames[ti][idx],
				Tier:         name,
				Difficulty:   tierDiffs[ti],
				PassWPM:      wpm,
				PassAccuracy: acc,
				Paragraph:    paragraph,
			})
		}
	}

	return levels
}
