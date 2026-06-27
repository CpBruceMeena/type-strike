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

# ── Port helpers ───────────────────────────────────────────
# Get the PID of whatever is listening on SERVER_PORT (if any)
port_pids() {
  lsof -ti:"$SERVER_PORT" 2>/dev/null || true
}

# Check if the port is free
port_is_free() {
  [ -z "$(port_pids)" ]
}

# Kill any process on SERVER_PORT (handles multiple PIDs)
kill_port() {
  local pids
  pids=$(port_pids)
  if [ -z "$pids" ]; then
    return
  fi
  while IFS= read -r pid; do
    [ -z "$pid" ] && continue
    local name
    name=$(ps -o comm= -p "$pid" 2>/dev/null || echo "unknown")
    warn "Killing process on port $SERVER_PORT (PID $pid — $name)..."
    kill "$pid" 2>/dev/null || true
    local waited=0
    while kill -0 "$pid" 2>/dev/null; do
      sleep 1
      waited=$((waited + 1))
      if [ "$waited" -ge 5 ]; then
        kill -9 "$pid" 2>/dev/null || true
        break
      fi
    done
  done <<< "$pids"
  sleep 1
  ok "Port $SERVER_PORT freed"
}

# ── Seed ───────────────────────────────────────────────────

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
  command -v lsof >/dev/null 2>&1 || warn "lsof not found — port detection disabled"
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

  # Clean up any existing process on our port
  if [ -f "$PID_FILE" ]; then
    local existing_pid
    existing_pid=$(cat "$PID_FILE")
    if kill -0 "$existing_pid" 2>/dev/null; then
      warn "Server is already running (PID $existing_pid). Stopping it..."
      kill_port
    else
      warn "Stale PID file found. Cleaning up..."
    fi
    rm -f "$PID_FILE"
  fi

  # Check port availability — if something else is on our port, free it automatically
  if ! port_is_free; then
    local occupant_pid
    occupant_pid=$(port_pid)
    local occupant_name
    occupant_name=$(ps -o comm= -p "$occupant_pid" 2>/dev/null || echo "unknown")
    warn "Port $SERVER_PORT is occupied by PID $occupant_pid ($occupant_name). Freeing it..."
    kill_port
  fi

  preflight
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
  local killed_any=false

  # 1. Try PID file first
  if [ -f "$PID_FILE" ]; then
    local pid
    pid=$(cat "$PID_FILE")
    if kill -0 "$pid" 2>/dev/null; then
      info "Stopping server (PID $pid)..."
      kill "$pid" 2>/dev/null || true
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
      killed_any=true
      ok "Server stopped (PID $pid)"
    fi
    rm -f "$PID_FILE"
  fi

  # 2. Kill any remaining processes on the port (handles multiple PIDs)
  local port_pids_val
  port_pids_val=$(port_pids)
  if [ -n "$port_pids_val" ]; then
    warn "Found process(es) on port $SERVER_PORT — cleaning up..."
    while IFS= read -r pid; do
      [ -z "$pid" ] && continue
      info "Stopping port process (PID $pid)..."
      kill "$pid" 2>/dev/null || true
      local waited=0
      while kill -0 "$pid" 2>/dev/null; do
        sleep 1
        waited=$((waited + 1))
        if [ "$waited" -ge 10 ]; then
          kill -9 "$pid" 2>/dev/null || true
          break
        fi
      done
    done <<< "$port_pids_val"
    killed_any=true
    ok "Port $SERVER_PORT freed"
  fi

  if [ "$killed_any" = false ]; then
    warn "No server process found on port $SERVER_PORT."
  fi
}

# ── Restart ─────────────────────────────────────────────────
cmd_restart() {
  cmd_stop
  sleep 1
  cmd_start "$@"
}

# ── Status ──────────────────────────────────────────────────
cmd_status() {
  local pid=""

  if [ -f "$PID_FILE" ]; then
    pid=$(cat "$PID_FILE")
  fi

  # If PID file process is not alive, try by port
  if [ -z "$pid" ] || ! kill -0 "$pid" 2>/dev/null; then
    local port_pid_val
    port_pid_val=$(port_pid)
    if [ -n "$port_pid_val" ]; then
      pid="$port_pid_val"
      warn "Server running but PID file missing/stale (found PID $pid on port $SERVER_PORT)"
    fi
  fi

  if [ -z "$pid" ] || ! kill -0 "$pid" 2>/dev/null; then
    warn "Server is not running"
    return 1
  fi

  local running_since
  running_since=$(ps -o lstart= -p "$pid" 2>/dev/null || echo "unknown")
  ok "Server is running (PID $pid, started $running_since)"
  info "  Port:      ${SERVER_PORT}"
  info "  Health:    http://localhost:${SERVER_PORT}/health"
  info "  PID file:  ${PID_FILE}"
  info "  Log file:  ${LOG_FILE}"
  return 0
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
    ;;	--seed|--seed-only)
		# Backwards compatibility: seed then optionally start
		if [ "$1" = "--seed-only" ]; then
			shift
			preflight
			seed_levels
			exit 0
		fi
		shift
		preflight
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
