package main

import (
	"log"
	"os"
	"time"

	"github.com/cpbrucemeena/type-strike-backend/internal/data"
	"github.com/cpbrucemeena/type-strike-backend/internal/database"
	"github.com/cpbrucemeena/type-strike-backend/internal/models"
	"math/rand"
)

func main() {
	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		databaseURL = "postgresql://postgres:password@localhost:5432/typestrike?sslmode=disable"
	}

	log.Println("Connecting to database...")
	db, err := database.Connect(databaseURL)
	if err != nil {
		log.Fatalf("Failed to connect: %v", err)
	}
	defer func() {
		sqlDB, _ := db.DB()
		if sqlDB != nil {
			sqlDB.Close()
		}
	}()

	rand.Seed(time.Now().UnixNano())

	// Auto-migrate the levels table (creates table if not exists)
	log.Println("Auto-migrating levels table...")
	if err := db.AutoMigrate(&models.Level{}); err != nil {
		log.Fatalf("Failed to migrate: %v", err)
	}

	// Fix outdated check constraints that don't account for Beyond tier
	log.Println("Updating table constraints for all 5 tiers (1-500)...")
	db.Exec("ALTER TABLE levels DROP CONSTRAINT IF EXISTS levels_difficulty_check")
	db.Exec("ALTER TABLE levels DROP CONSTRAINT IF EXISTS levels_tier_check")
	db.Exec("ALTER TABLE levels ADD CONSTRAINT levels_difficulty_check CHECK (difficulty >= 1 AND difficulty <= 5)")
	db.Exec("ALTER TABLE levels ADD CONSTRAINT levels_tier_check CHECK (tier::text = ANY (ARRAY['ember'::text, 'igneious'::text, 'magma_core'::text, 'obsidian'::text, 'beyond'::text]))")
	log.Println("Constraints updated.")

	// Re-generate all 500 level configurations (5 tiers × 100 levels each)
	log.Println("Generating 500 level configurations...")
	levels := data.GenerateFreshLevels()
	log.Printf("Seeding %d levels into the database...", len(levels))

	// Use a transaction for the bulk operation
	tx := db.Begin()
	if tx.Error != nil {
		log.Fatalf("Failed to begin transaction: %v", tx.Error)
	}

	// Clear existing levels
	if err := tx.Exec("DELETE FROM levels").Error; err != nil {
		tx.Rollback()
		log.Fatalf("Failed to clear levels: %v", err)
	}

	// Insert each level
	for _, lvl := range levels {
		level := models.Level{
			ID:           lvl.ID,
			Name:         lvl.Name,
			Tier:         lvl.Tier,
			Difficulty:   lvl.Difficulty,
			PassWPM:      lvl.PassWPM,
			PassAccuracy: lvl.PassAccuracy,
			Paragraph:    lvl.Paragraph,
		}
		if err := tx.Where("id = ?", lvl.ID).Assign(level).FirstOrCreate(&level).Error; err != nil {
			tx.Rollback()
			log.Fatalf("Failed to insert level %d: %v", lvl.ID, err)
		}
	}

	if err := tx.Commit().Error; err != nil {
		log.Fatalf("Failed to commit: %v", err)
	}

	log.Printf("✅ %d levels seeded successfully! All 5 tiers (Ember, Igneous, Magma Core, Obsidian, Beyond) × 100 levels each.", len(levels))
}

func init() {
	// Ensure levels package generates data
	_ = data.LevelConfigs
}
