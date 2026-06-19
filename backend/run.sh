#!/bin/bash
# ────────────────────────────────────────────────────────────
#  type-strike backend — service manager
# ────────────────────────────────────────────────────────────
# Usage:
#   ./run.sh              — show usage
#   ./run.sh start        — start the server in background
#   ./run.sh stop         — stop the server
#   ./run.sh restart      — stop then start
#   ./run.sh status       — check if server is running
#
# Options (used with start/restart):
#   --seed                — (re)seed levels before starting
#   --seed-only           — seed levels and exit (no server start)
# ────────────────────────────────────────────────────────────
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

# ── Config ─────────────────────────────────────────────────
SERVER_PORT="${SERVER_PORT:-8080}"
DB_URL="${DATABASE_URL:-postgresql://postgres:password@localhost:5432/typestrike?sslmode=disable}"
PID_FILE="${DIR}/server.pid"
LOG_FILE="${DIR}/server.log"

# ── Colors ─────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# ── Helpers ────────────────────────────────────────────────
info()  { echo -e "${CYAN}$1${NC}"; }
ok()    { echo -e "${GREEN}✓${NC} $1"; }
warn()  { echo -e "${YELLOW}⚠${NC} $1"; }
err()   { echo -e "${RED}✗${NC} $1"; }

# ── Migration & Seed (kept from original) ──────────────────
run_migrations() {
  echo -e "${YELLOW}▶ Running database migrations...${NC}"

  TABLE_CHECK=$(psql "$DB_URL" -t -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'players');" 2>/dev/null | tr -d '[:space:]')

  if [ "$TABLE_CHECK" != "t" ]; then
    echo "  Running 001_init.sql..."
    psql "$DB_URL" -f migrations/001_init.sql -q
  else
    ok "001_init.sql already applied"
  fi

  TABLE_CHECK=$(psql "$DB_URL" -t -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'levels');" 2>/dev/null | tr -d '[:space:]')

  if [ "$TABLE_CHECK" != "t" ]; then
    echo "  Running 002_levels.sql..."
    psql "$DB_URL" -f migrations/002_levels.sql -q
  else
    ok "002_levels.sql already applied"
  fi
}

seed_levels() {
  echo -e "${YELLOW}▶ Seeding level configurations...${NC}"
  cd scripts
  go run seed_levels.go
  cd ..
  ok "Levels seeded"
}

# ── Pre-flight checks ──────────────────────────────────────
preflight() {
  command -v go >/dev/null 2>&1 || { err "Go is not installed."; exit 1; }
  command -v psql >/dev/null 2>&1 || warn "psql not found — migrations won't auto-run."
}

# ── Start ───────────────────────────────────────────────────
cmd_start() {
  local DO_SEED=false
  local SEED_ONLY=false

  # Parse flags passed to start
  for arg in "$@"; do
    case "$arg" in
      --seed-only) SEED_ONLY=true; DO_SEED=true ;;
      --seed) DO_SEED=true ;;
    esac
  done

  # Check if already running
  if [ -f "$PID_FILE" ]; then
    local existing_pid
    existing_pid=$(cat "$PID_FILE")
    if kill -0 "$existing_pid" 2>/dev/null; then
      err "Server is already running (PID $existing_pid)."
      info "  Use: ./run.sh restart  or  ./run.sh stop"
      exit 1
    else
      warn "Stale PID file found. Cleaning up..."
      rm -f "$PID_FILE"
    fi
  fi

  preflight
  run_migrations

  if [ "$DO_SEED" = true ]; then
    seed_levels
  fi

  if [ "$SEED_ONLY" = true ]; then
    ok "Seed complete. Exiting."
    exit 0
  fi

  export DATABASE_URL="$DB_URL"
  export SERVER_PORT="$SERVER_PORT"

  echo ""
  info "  Starting server on port ${SERVER_PORT}..."
  info "  Health check: http://localhost:${SERVER_PORT}/health"
  info "  Logs: ${LOG_FILE}"
  echo ""

  # Start the server in the background
  go run cmd/server/main.go > "$LOG_FILE" 2>&1 &
  local pid=$!
  echo "$pid" > "$PID_FILE"

  # Wait a moment and check if it's still alive
  sleep 2
  if kill -0 "$pid" 2>/dev/null; then
    ok "Server started (PID $pid)"
  else
    err "Server failed to start. Check logs: ${LOG_FILE}"
    rm -f "$PID_FILE"
    exit 1
  fi
}

# ── Stop ────────────────────────────────────────────────────
cmd_stop() {
  if [ ! -f "$PID_FILE" ]; then
    warn "No PID file found. Server is not running."
    return
  fi

  local pid
  pid=$(cat "$PID_FILE")

  if ! kill -0 "$pid" 2>/dev/null; then
    warn "Process $pid is not running. Cleaning up PID file."
    rm -f "$PID_FILE"
    return
  fi

  info "Stopping server (PID $pid)..."
  kill "$pid" 2>/dev/null || true

  # Wait for graceful shutdown (up to 10 seconds)
  local waited=0
  while kill -0 "$pid" 2>/dev/null; do
    sleep 1
    waited=$((waited + 1))
    if [ "$waited" -ge 10 ]; then
      warn "Server did not stop gracefully. Force killing..."
      kill -9 "$pid" 2>/dev/null || true
      break
    fi
  done

  rm -f "$PID_FILE"
  ok "Server stopped"
}

# ── Restart ─────────────────────────────────────────────────
cmd_restart() {
  cmd_stop
  sleep 1
  cmd_start "$@"
}

# ── Status ──────────────────────────────────────────────────
cmd_status() {
  if [ ! -f "$PID_FILE" ]; then
    warn "Server is not running (no PID file)"
    return 1
  fi

  local pid
  pid=$(cat "$PID_FILE")

  if kill -0 "$pid" 2>/dev/null; then
    local running_since
    running_since=$(ps -o lstart= -p "$pid" 2>/dev/null || echo "unknown")
    ok "Server is running (PID $pid, started $running_since)"
    info "  Port:      ${SERVER_PORT}"
    info "  Health:    http://localhost:${SERVER_PORT}/health"
    info "  PID file:  ${PID_FILE}"
    info "  Log file:  ${LOG_FILE}"
    return 0
  else
    warn "PID file exists but process $pid is not running"
    info "  Run ./run.sh clean to remove stale PID file"
    return 1
  fi
}

# ── Clean ───────────────────────────────────────────────────
cmd_clean() {
  rm -f "$PID_FILE"
  ok "Cleaned up PID file"
}

# ── Logs ────────────────────────────────────────────────────
cmd_logs() {
  if [ ! -f "$LOG_FILE" ]; then
    warn "No log file found at ${LOG_FILE}"
    exit 1
  fi
  tail -f "$LOG_FILE"
}

# ── Main ────────────────────────────────────────────────────
print_usage() {
  echo ""
  echo "  ╔═══════════════════════════════════════╗"
  echo "  ║     type-strike backend — manager     ║"
  echo "  ╚═══════════════════════════════════════╝"
  echo ""
  echo "  Usage: ./run.sh <command> [options]"
  echo ""
  echo "  Commands:"
  echo "    start              Start the server in the background"
  echo "    stop               Stop the server"
  echo "    restart            Restart the server"
  echo "    status             Check if the server is running"
  echo "    logs               Tail the server logs"
  echo "    clean              Remove stale PID file"
  echo ""
  echo "  Options (for start/restart):"
  echo "    --seed             (Re)seed levels before starting"
  echo "    --seed-only        Seed levels and exit"
  echo ""
  echo "  Environment:"
  echo "    SERVER_PORT        Server port (default: 8080)"
  echo "    DATABASE_URL       PostgreSQL connection string"
  echo ""
}

case "${1:-}" in
  start)
    shift
    cmd_start "$@"
    ;;
  stop)
    cmd_stop
    ;;
  restart)
    shift
    cmd_restart "$@"
    ;;
  status)
    cmd_status
    ;;
  logs)
    cmd_logs
    ;;
  clean)
    cmd_clean
    ;;
  --seed|--seed-only)
    # Backwards compatibility: seed then optionally start
    if [ "$1" = "--seed-only" ]; then
      shift
      preflight
      run_migrations
      seed_levels
      exit 0
    fi
    shift
    preflight
    run_migrations
    seed_levels
    cmd_start
    ;;
  *)
    if [ $# -eq 0 ]; then
      # Backwards compatibility: no args = start the server
      cmd_start
    else
      print_usage
      exit 1
    fi
    ;;
esac
