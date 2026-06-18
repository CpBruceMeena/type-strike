package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/cpbrucemeena/type-strike-backend/internal/data"
	"github.com/cpbrucemeena/type-strike-backend/internal/database"
	"math/rand"
)

func main() {
	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		databaseURL = "postgresql://postgres:password@localhost:5432/typestrike?sslmode=disable"
	}

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	log.Println("Connecting to database...")
	pool, err := database.Connect(ctx, databaseURL)
	if err != nil {
		log.Fatalf("Failed to connect: %v", err)
	}
	defer pool.Close()

	rand.Seed(time.Now().UnixNano())

	// Re-generate levels with fresh randomness
	log.Println("Generating 100 level configurations...")
	levels := data.GenerateFreshLevels()

	log.Printf("Seeding %d levels into the database...", len(levels))

	tx, err := pool.Begin(ctx)
	if err != nil {
		log.Fatalf("Failed to begin transaction: %v", err)
	}
	defer tx.Rollback(ctx)

	// Clear existing levels
	_, err = tx.Exec(ctx, "DELETE FROM levels")
	if err != nil {
		log.Fatalf("Failed to clear levels: %v", err)
	}

	// Insert each level
	for _, lvl := range levels {
		_, err := tx.Exec(ctx,
			`INSERT INTO levels (id, name, tier, difficulty, pass_wpm, pass_accuracy, paragraph)
			 VALUES ($1, $2, $3, $4, $5, $6, $7)
			 ON CONFLICT (id) DO UPDATE SET
			   name = EXCLUDED.name,
			   tier = EXCLUDED.tier,
			   difficulty = EXCLUDED.difficulty,
			   pass_wpm = EXCLUDED.pass_wpm,
			   pass_accuracy = EXCLUDED.pass_accuracy,
			   paragraph = EXCLUDED.paragraph`,
			lvl.ID, lvl.Name, lvl.Tier, lvl.Difficulty, lvl.PassWPM, lvl.PassAccuracy, lvl.Paragraph,
		)
		if err != nil {
			log.Fatalf("Failed to insert level %d: %v", lvl.ID, err)
		}
	}

	if err := tx.Commit(ctx); err != nil {
		log.Fatalf("Failed to commit: %v", err)
	}

	fmt.Printf("\n  ✅ %d levels seeded successfully!\n\n", len(levels))
	fmt.Println("  Levels are now available from the database.")
}

func init() {
	// Ensure levels package generates data
	_ = data.LevelConfigs
}
