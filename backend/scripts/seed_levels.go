package main

import (
	"log"
	"os"
	"time"

	"github.com/cpbrucemeena/type-strike-backend/internal/data"
	"github.com/cpbrucemeena/type-strike-backend/internal/database"
	"math/rand"
)

type Level struct {
	ID           int    `gorm:"primaryKey"`
	Name         string `gorm:"type:varchar(100)"`
	Tier         string `gorm:"type:varchar(20)"`
	Difficulty   int    `gorm:"default:1"`
	PassWPM      int    `gorm:"column:pass_wpm"`
	PassAccuracy int    `gorm:"column:pass_accuracy"`
	Paragraph    string `gorm:"type:text"`
}

func (Level) TableName() string { return "levels" }

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

	// Re-generate levels with fresh randomness
	log.Println("Generating 100 level configurations...")
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
		level := Level{
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

	log.Printf("✅ %d levels seeded successfully!", len(levels))
}

func init() {
	// Ensure levels package generates data
	_ = data.LevelConfigs
}
