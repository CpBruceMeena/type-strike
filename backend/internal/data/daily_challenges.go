package data

import (
	"fmt"
	"math/rand"
	"time"
)

// ChallengeTemplate defines the static metadata for a daily challenge type.
type ChallengeTemplate struct {
	Type string
	Name string
	Icon string
}

// ChallengeTemplates defines the 3 challenge types available.
var ChallengeTemplates = []ChallengeTemplate{
	{Type: "speed_sprint", Name: "Speed Sprint", Icon: "💨"},
	{Type: "precision_mode", Name: "Precision Mode", Icon: "🎯"},
	{Type: "star_challenge", Name: "Star Challenge", Icon: "⭐"},
}

// GeneratedChallenge is the output of challenge generation (before DB insert).
type GeneratedChallenge struct {
	ChallengeType  string
	ChallengeName  string
	Description    string
	Icon           string
	LevelID        int
	TargetWPM      int
	TargetAccuracy float64
	RewardXP       int
	RewardStars    int
}

// GenerateDailyChallenges picks 3 random challenges from the level pool.
// It ensures no two challenges use the same level or type, and uses a local RNG.
func GenerateDailyChallenges(levelsCleared int) []GeneratedChallenge {
	rng := rand.New(rand.NewSource(time.Now().UnixNano()))

	// Determine which level pool to draw from based on player progress
	var candidateLevels []LevelConfig
	for _, l := range LevelConfigs {
		if l.ID <= levelsCleared+10 && l.ID > levelsCleared-2 {
			candidateLevels = append(candidateLevels, l)
		}
	}
	// Fallback: if no levels match, use the first 30 levels
	if len(candidateLevels) < 3 {
		candidateLevels = LevelConfigs
		if len(candidateLevels) > 30 {
			candidateLevels = candidateLevels[:30]
		}
	}

	// Shuffle candidate levels so we pick randomly
	rng.Shuffle(len(candidateLevels), func(i, j int) {
		candidateLevels[i], candidateLevels[j] = candidateLevels[j], candidateLevels[i]
	})

	// Shuffle challenge types order
	types := make([]ChallengeTemplate, len(ChallengeTemplates))
	copy(types, ChallengeTemplates)
	rng.Shuffle(len(types), func(i, j int) {
		types[i], types[j] = types[j], types[i]
	})

	// Pick 3 challenges, each using a different level and type
	results := make([]GeneratedChallenge, 0, 3)
	levelIndex := 0

	for _, tmpl := range types {
		if len(results) >= 3 || levelIndex >= len(candidateLevels) {
			break
		}
		level := &candidateLevels[levelIndex]
		levelIndex++

		var targetWPM int
		var targetAccuracy float64
		var xpReward int
		var starReward int
		desc := ""

		switch tmpl.Type {
		case "speed_sprint":
			// Target: level's pass WPM + 10-19
			targetWPM = level.PassWPM + 10 + rng.Intn(10)
			targetAccuracy = 0
			xpReward = 60 + level.Difficulty*15 + rng.Intn(20)
			starReward = 1 + level.Difficulty/3
			desc = fmt.Sprintf("Reach %d WPM on Level %d", targetWPM, level.ID)

		case "precision_mode":
			// Target: level's pass accuracy + 5%, capped at 100%
			targetWPM = 0
			targetAccuracy = float64(level.PassAccuracy) + 5.0
			if targetAccuracy > 100.0 {
				targetAccuracy = 100.0
			}
			xpReward = 50 + level.Difficulty*10 + rng.Intn(15)
			starReward = 1 + level.Difficulty/4
			desc = fmt.Sprintf("Complete Level %d with %.0f%% accuracy or higher", level.ID, targetAccuracy)

		case "star_challenge":
			// Target: earn 3 stars, which requires 1.3x pass WPM and 98% accuracy
			targetWPM = int(float64(level.PassWPM) * 1.3)
			targetAccuracy = 98.0
			xpReward = 80 + level.Difficulty*20 + rng.Intn(30)
			starReward = 2 + level.Difficulty/3
			desc = fmt.Sprintf("Earn 3 stars on Level %d", level.ID)
		}

		// Ensure targets are at least the level's pass requirements
		if targetWPM > 0 && targetWPM < level.PassWPM {
			targetWPM = level.PassWPM
		}
		if targetAccuracy > 0 && targetAccuracy < float64(level.PassAccuracy) {
			targetAccuracy = float64(level.PassAccuracy)
		}

		results = append(results, GeneratedChallenge{
			ChallengeType:   tmpl.Type,
			ChallengeName:   tmpl.Name,
			Description:     desc,
			Icon:            tmpl.Icon,
			LevelID:         level.ID,
			TargetWPM:       targetWPM,
			TargetAccuracy:  targetAccuracy,
			RewardXP:        xpReward,
			RewardStars:     starReward,
		})
	}

	return results
}
