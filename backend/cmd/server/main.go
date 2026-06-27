package main

import (
	"context"
	"fmt"
	"log"
	"log/slog"
	"math/rand"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/cpbrucemeena/type-strike-backend/internal/config"
	"github.com/cpbrucemeena/type-strike-backend/internal/database"
	"github.com/cpbrucemeena/type-strike-backend/internal/handler"
	"github.com/cpbrucemeena/type-strike-backend/internal/middleware"
	"github.com/cpbrucemeena/type-strike-backend/internal/repository"
	"github.com/go-chi/chi/v5"
	chimiddleware "github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
)

func main() {
	cfg := config.Load()

	// ── Structured Logger ──────────────────────────────
	slog.SetDefault(slog.New(slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{
		Level: slog.LevelInfo,
	})))
	logger := slog.Default()

	rand.Seed(time.Now().UnixNano())
	// Connect to PostgreSQL
	logger.Info("connecting to database", "url", cfg.DatabaseURL)
	db, err := database.Connect(cfg.DatabaseURL)
	if err != nil {
		logger.Error("failed to connect to database", "error", err)
		log.Fatalf("Failed to connect to database: %v", err)
	}
	logger.Info("connected to PostgreSQL successfully")

	// Initialize repositories
	repos := repository.NewRepositories(db)

	// Initialize handlers
	playerHandler := handler.NewPlayerHandler(repos)
	levelHandler := handler.NewLevelHandler(repos, db)
	activityHandler := handler.NewActivityHandler(repos)
	settingsHandler := handler.NewSettingsHandler(repos)
	analyticsHandler := handler.NewAnalyticsHandler(repos)
	levelDataHandler := handler.NewLevelDataHandler(repos)
	dailyChallengeHandler := handler.NewDailyChallengeHandler(repos)
	leaderboardHandler := handler.NewLeaderboardHandler(repos)
	gameHandler := handler.NewGameHandler(repos)
	contestHandler := handler.NewContestHandler(repos)
	lessonHandler := handler.NewLessonHandler(repos)
	progressionHandler := handler.NewProgressionHandler(repos)
	achievementHandler := handler.NewAchievementHandler(repos)

	// Setup router
	r := chi.NewRouter()

	// CORS — allow all origins for local dev
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"*"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: false,
		MaxAge:           300,
	}))

	// Middleware (order matters: RequestID → RealIP → ExtractPlayerID → Logger → Recoverer → Timeout)
	r.Use(chimiddleware.RequestID)
	r.Use(chimiddleware.RealIP)
	r.Use(middleware.ExtractPlayerID)
	r.Use(middleware.Logger(logger))
	r.Use(chimiddleware.Recoverer)
	r.Use(chimiddleware.Timeout(30 * time.Second))

	// Health check
	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"status":"ok","service":"type-strike-backend"}`))
	})

	// API v1
	r.Route("/api/v1", func(r chi.Router) {
		// Players
		r.Route("/players", func(r chi.Router) {
			r.Post("/", playerHandler.Create)
			r.Post("/register", playerHandler.Register)
			r.Get("/{id}", playerHandler.GetByID)
			r.Patch("/{id}", playerHandler.Update)
			r.Post("/{id}/xp", playerHandler.AddXP)
			r.Get("/{id}/summary", playerHandler.GetSummary)
			r.Get("/{id}/next-level", levelHandler.GetNextLevel)

			// Player activity
			r.Get("/{playerId}/activity", activityHandler.GetRecent)
			r.Post("/{playerId}/activity", activityHandler.Record)

			// Player level progress
			r.Get("/{playerId}/levels", levelHandler.GetAllProgress)
			r.Get("/{playerId}/levels/{levelId}", levelHandler.GetProgress)
			r.Post("/{playerId}/levels/{levelId}/complete", levelHandler.UpdateProgress)

			// Player settings
			r.Get("/{playerId}/settings", settingsHandler.GetAll)
			r.Put("/{playerId}/settings", settingsHandler.BatchUpdate)
		})

		// Level catalog (static configuration for all 100 levels)
		r.Route("/levels", func(r chi.Router) {
			r.Get("/", levelDataHandler.GetAll)
			r.Get("/next", levelDataHandler.GetNext)
			r.Get("/{levelId}", levelDataHandler.GetByID)
		})

		// Daily Challenges (standalone challenge mode)
		r.Route("/players/{playerId}/daily-challenges", func(r chi.Router) {
			r.Get("/", dailyChallengeHandler.GetOrGenerate)
			r.Post("/{challengeId}/complete", dailyChallengeHandler.SubmitResult)
		})

		// Analytics (global, not player-specific)
		r.Route("/analytics", func(r chi.Router) {
			r.Post("/events", analyticsHandler.RecordEvent)
			r.Get("/players/{playerId}/daily-stats", analyticsHandler.GetDailyStats)
			r.Post("/players/{playerId}/daily-stats", analyticsHandler.UpdateDailyStats)
		})

		// Leaderboard (global + daily rankings)
		r.Route("/leaderboard", func(r chi.Router) {
			r.Get("/", leaderboardHandler.GetTop)
			r.Get("/daily", leaderboardHandler.GetDailyTop)
			r.Get("/timed", gameHandler.GetTimedLeaderboard)
			r.Get("/{playerId}", leaderboardHandler.GetPlayerRank)
			r.Post("/sync", leaderboardHandler.Sync)
		})

		// Game Sessions (timed modes, contest, level games from web)
		r.Route("/games", func(r chi.Router) {
			r.Post("/start", gameHandler.Start)
			r.Post("/{gameId}/complete", gameHandler.Complete)
			r.Get("/history", gameHandler.GetHistory)
		})

		// Contest (daily competition)
		r.Route("/contest", func(r chi.Router) {
			r.Get("/current", contestHandler.GetCurrent)
			r.Get("/leaderboard", contestHandler.GetLeaderboard)
		})		// Lesson Progress
			r.Route("/players/{playerId}/lessons", func(r chi.Router) {
				r.Get("/", lessonHandler.GetAllProgress)
				r.Get("/{lessonId}", lessonHandler.GetProgress)
				r.Post("/{lessonId}/complete", lessonHandler.UpdateProgress)
			})

		// Progression (ranks, titles, themes)
		r.Route("/players/{playerId}/progression", func(r chi.Router) {
			r.Get("/", progressionHandler.GetProgression)
			r.Post("/check", progressionHandler.CheckUpgrade)
		})

		// All rank tiers
		r.Route("/tiers", func(r chi.Router) {
			r.Get("/", progressionHandler.GetAllTiers)
			r.Get("/detail", progressionHandler.GetTierDetails)
		})

		// Achievements
		r.Route("/players/{playerId}/achievements", func(r chi.Router) {
			r.Get("/", achievementHandler.GetAllAchievements)
			r.Get("/count", achievementHandler.GetUnlockedCount)
			r.Post("/check", achievementHandler.CheckAchievements)
		})
	})

	// Start server
	server := &http.Server{
		Addr:         cfg.Addr(),
		Handler:      r,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Graceful shutdown
	go func() {
		sigCh := make(chan os.Signal, 1)
		signal.Notify(sigCh, syscall.SIGINT, syscall.SIGTERM)
		<-sigCh
		logger.Info("shutting down server...")

		shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer shutdownCancel()

		if err := server.Shutdown(shutdownCtx); err != nil {
			logger.Error("server shutdown error", "error", err)
			log.Fatalf("Server shutdown error: %v", err)
		}
	}()

	logger.Info("server starting", "addr", cfg.Addr())
	fmt.Printf(`
  ╔═══════════════════════════════════════╗
  ║      type-strike backend server       ║
  ║      Listening on %s        ║
  ╚═══════════════════════════════════════╝
`, cfg.Addr())

	if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		logger.Error("server error", "error", err)
		log.Fatalf("Server error: %v", err)
	}

	logger.Info("server stopped gracefully")
}
