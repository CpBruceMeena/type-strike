package middleware

import (
	"context"
	"log/slog"
	"net/http"
	"strconv"
	"time"

	"github.com/go-chi/chi/v5"
	chimiddleware "github.com/go-chi/chi/v5/middleware"
)

// ── Context Keys ───────────────────────────────────────

type contextKey string

const (
	PlayerIDKey contextKey = "player_id"
)

// ── Logger ──────────────────────────────────────────────

// Logger is a chi-compatible middleware that logs every request using slog.
// It extracts the playerId URL parameter when present and includes it in the log.
// Log output includes: method, path, status, duration, request ID, player ID, and remote IP.
func Logger(logger *slog.Logger) func(next http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			start := time.Now()

			// Wrap response writer to capture status code
			ww := chimiddleware.NewWrapResponseWriter(w, r.ProtoMajor)

			// Process the request
			next.ServeHTTP(ww, r)

			// Build log attributes
			attrs := []slog.Attr{
				slog.String("method", r.Method),
				slog.String("path", r.URL.Path),
				slog.Int("status", ww.Status()),
				slog.Duration("dur", time.Since(start)),
				slog.String("ip", r.RemoteAddr),
			}

			// Include request ID if chi generated one
			if reqID := chimiddleware.GetReqID(r.Context()); reqID != "" {
				attrs = append(attrs, slog.String("req_id", reqID))
			}

			// Include player ID if extracted earlier by middleware or handler
			if playerID := GetPlayerID(r.Context()); playerID > 0 {
				attrs = append(attrs, slog.Int("player_id", playerID))
			}

			// Determine log level based on status code
			status := ww.Status()
			switch {
			case status >= 500:
				logger.LogAttrs(r.Context(), slog.LevelError, "request failed", attrs...)
			case status >= 400:
				logger.LogAttrs(r.Context(), slog.LevelWarn, "request warning", attrs...)
			default:
				logger.LogAttrs(r.Context(), slog.LevelInfo, "request", attrs...)
			}
		})
	}
}

// ── Player ID Extractors ───────────────────────────────

// ExtractPlayerID is a middleware that looks for a {playerId} URL parameter
// (from chi's URL params) and stores it in the request context.
// Fallback: also checks for a "player_id" query parameter.
// This makes the player ID available to downstream handlers and the logger middleware.
func ExtractPlayerID(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		playerID := 0

		// Try chi URL param (routes with {playerId})
		if idStr := chi.URLParam(r, "playerId"); idStr != "" {
			if id, err := strconv.Atoi(idStr); err == nil {
				playerID = id
			}
		}

		// Fallback: try query param (routes with ?player_id=)
		if playerID == 0 {
			if idStr := r.URL.Query().Get("player_id"); idStr != "" {
				if id, err := strconv.Atoi(idStr); err == nil {
					playerID = id
				}
			}
		}

		if playerID > 0 {
			ctx := context.WithValue(r.Context(), PlayerIDKey, playerID)
			r = r.WithContext(ctx)
		}

		next.ServeHTTP(w, r)
	})
}

// GetPlayerID retrieves the player ID from the request context.
// Returns 0 if not set.
func GetPlayerID(ctx context.Context) int {
	if id, ok := ctx.Value(PlayerIDKey).(int); ok {
		return id
	}
	return 0
}


