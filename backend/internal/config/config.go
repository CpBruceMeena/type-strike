package config

import (
	"fmt"
	"os"
)

// Config holds all configuration for the type-strike backend server.
type Config struct {
	ServerPort  string
	DatabaseURL string
}

// Load reads configuration from environment variables with sensible defaults.
func Load() *Config {
	return &Config{
		ServerPort:  getEnv("SERVER_PORT", "8080"),
		DatabaseURL: getEnv("DATABASE_URL", "postgresql://postgres:password@localhost:5432/typestrike?sslmode=disable"),
	}
}

// Addr returns the address string the server should listen on.
func (c *Config) Addr() string {
	return fmt.Sprintf(":%s", c.ServerPort)
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
