#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# Type Strike — Unified Server Manager
# ─────────────────────────────────────────────────────────────
# Manages both the Go backend and Next.js frontend servers.
#
# Usage:
#   ./run.sh start           — Start both servers
#   ./run.sh stop            — Stop both servers
#   ./run.sh restart         — Restart both servers
#   ./run.sh status          — Check server status
#   ./run.sh logs [service]  — View logs (backend | frontend | all)
#   ./run.sh build           — Build frontend for production
#
# Options (used with start/restart):
#   --seed      — (Re)seed levels before starting backend
#   --force     — Kill any process on backend port before starting
#
# Environment:
#   SERVER_PORT        Backend port (default: 8080)
#   FRONTEND_PORT      Frontend port (default: 3000)
#   DATABASE_URL       PostgreSQL connection string
# ─────────────────────────────────────────────────────────────
set -euo pipefail

# ── Colors ──────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

bold()   { echo -e "${MAGENTA}\033[1m$1\033[0m${NC}"; }
info()   { echo -e "${BLUE}ℹ${NC} $1"; }
ok()     { echo -e "${GREEN}✓${NC} $1"; }
warn()   { echo -e "${YELLOW}⚠${NC} $1"; }
err()    { echo -e "${RED}✗${NC} $1"; }

# ── Config ──────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"
FRONTEND_DIR="$SCRIPT_DIR/type-strike-web"

BACKEND_PID_FILE="$BACKEND_DIR/server.pid"
FRONTEND_PID_FILE="$SCRIPT_DIR/.frontend.pid"

SERVER_PORT="${SERVER_PORT:-8080}"
FRONTEND_PORT="${FRONTEND_PORT:-3000}"

# ── Helpers ─────────────────────────────────────────────

pid_running() {
  local pid="$1"
  [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null
}

read_pid() {
  local file="$1"
  if [ -f "$file" ]; then
    cat "$file"
  fi
}

backend_pid() {
  local pid
  pid=$(read_pid "$BACKEND_PID_FILE")
  if pid_running "$pid"; then
    echo "$pid"
  fi
}

frontend_pid() {
  local pid
  pid=$(read_pid "$FRONTEND_PID_FILE")
  if pid_running "$pid"; then
    echo "$pid"
  fi
}

port_pid() {
  lsof -ti:"$1" 2>/dev/null || echo ""
}

# ── Preflight ───────────────────────────────────────────

preflight() {
  command -v go >/dev/null 2>&1 || { err "Go is not installed."; exit 1; }
  command -v node >/dev/null 2>&1 || { err "Node.js is not installed."; exit 1; }
  command -v npm >/dev/null 2>&1 || { err "npm is not installed."; exit 1; }
  command -v lsof >/dev/null 2>&1 || warn "lsof not found — port detection disabled"

  # Ensure frontend dependencies are installed
  if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
    info "Installing frontend dependencies..."
    (cd "$FRONTEND_DIR" && npm install) || { err "npm install failed"; exit 1; }
    ok "Frontend dependencies installed"
  fi
}

# ── Start ───────────────────────────────────────────────

cmd_start() {
  local DO_SEED=false

  for arg in "$@"; do
    case "$arg" in
      --seed) DO_SEED=true ;;
    esac
  done

  preflight

  # ── Start Backend ──────────────────────────────────
  echo ""
  bold "═══ BACKEND ═══"

  local backend_pid_val
  backend_pid_val=$(backend_pid)
  if [ -n "$backend_pid_val" ]; then
    ok "Backend already running (PID $backend_pid_val)"
  else
    info "Starting Go backend on port $SERVER_PORT..."
    cd "$BACKEND_DIR"

    # Pass through --seed flag
    local seed_flag=""
    $DO_SEED && seed_flag="--seed"

    # Use the backend's own run.sh if available, otherwise build & run directly
    if [ -f "./run.sh" ]; then
      bash ./run.sh start $seed_flag --force
    else
      go build -o server ./cmd/server/ 2>/dev/null || true
      nohup go run ./cmd/server/ > server.log 2>&1 &
      local pid=$!
      echo "$pid" > "$BACKEND_PID_FILE"
      ok "Backend started (PID $pid) — http://localhost:$SERVER_PORT"
    fi

    cd "$SCRIPT_DIR"
  fi

  # ── Start Frontend ─────────────────────────────────
  echo ""
  bold "═══ FRONTEND ═══"

  local frontend_pid_val
  frontend_pid_val=$(frontend_pid)
  if [ -n "$frontend_pid_val" ]; then
    ok "Frontend already running (PID $frontend_pid_val)"
  else
    info "Starting Next.js dev server on port $FRONTEND_PORT..."

    cd "$FRONTEND_DIR"
    NEXT_PUBLIC_API_URL="http://localhost:$SERVER_PORT" \
      nohup npx next dev -p "$FRONTEND_PORT" > "$SCRIPT_DIR/.frontend.log" 2>&1 &

    local pid=$!
    echo "$pid" > "$FRONTEND_PID_FILE"

    # Wait for it to start
    sleep 3
    ok "Frontend started (PID $pid) — http://localhost:$FRONTEND_PORT"
    cd "$SCRIPT_DIR"
  fi

  echo ""
  ok "Both servers are running!"
  info "  Backend:  http://localhost:${SERVER_PORT}/health"
  info "  Frontend: http://localhost:${FRONTEND_PORT}"
  echo ""
}

# ── Stop ────────────────────────────────────────────────

cmd_stop() {
  echo ""
  bold "═══ STOPPING SERVERS ═══"

  local backend_pid_val
  backend_pid_val=$(backend_pid)
  if [ -n "$backend_pid_val" ]; then
    info "Stopping backend (PID $backend_pid_val)..."
    kill "$backend_pid_val" 2>/dev/null || true
    local waited=0
    while kill -0 "$backend_pid_val" 2>/dev/null; do
      sleep 1
      waited=$((waited + 1))
      if [ "$waited" -ge 5 ]; then
        kill -9 "$backend_pid_val" 2>/dev/null || true
        break
      fi
    done
    ok "Backend stopped"
  else
    # Try the backend's own run.sh stop
    if [ -f "$BACKEND_DIR/run.sh" ]; then
      (cd "$BACKEND_DIR" && bash ./run.sh stop) 2>/dev/null || true
    fi
  fi
  rm -f "$BACKEND_PID_FILE"

  local frontend_pid_val
  frontend_pid_val=$(frontend_pid)
  if [ -n "$frontend_pid_val" ]; then
    info "Stopping frontend (PID $frontend_pid_val)..."
    kill "$frontend_pid_val" 2>/dev/null || true
    local waited=0
    while kill -0 "$frontend_pid_val" 2>/dev/null; do
      sleep 1
      waited=$((waited + 1))
      if [ "$waited" -ge 5 ]; then
        kill -9 "$frontend_pid_val" 2>/dev/null || true
        break
      fi
    done
    ok "Frontend stopped"
  else
    # Also try killing by port
    local port_pid_val
    port_pid_val=$(port_pid "$FRONTEND_PORT")
    if [ -n "$port_pid_val" ]; then
      info "Killing process on port $FRONTEND_PORT (PID $port_pid_val)..."
      kill "$port_pid_val" 2>/dev/null || true
      ok "Port $FRONTEND_PORT freed"
    fi
  fi
  rm -f "$FRONTEND_PID_FILE"

  echo ""
  ok "All servers stopped"
}

# ── Restart ─────────────────────────────────────────────

cmd_restart() {
  cmd_stop
  sleep 1
  cmd_start "$@"
}

# ── Status ──────────────────────────────────────────────

cmd_status() {
  echo ""
  bold "═══ SERVER STATUS ═══"

  local backend_pid_val
  backend_pid_val=$(backend_pid)
  if [ -n "$backend_pid_val" ]; then
    local running_since
    running_since=$(ps -o lstart= -p "$backend_pid_val" 2>/dev/null || echo "unknown")
    ok "Backend running (PID $backend_pid_val, started $running_since)"
    info "  http://localhost:${SERVER_PORT}/health"
  else
    warn "Backend not running"
  fi

  local frontend_pid_val
  frontend_pid_val=$(frontend_pid)
  if [ -n "$frontend_pid_val" ]; then
    local running_since
    running_since=$(ps -o lstart= -p "$frontend_pid_val" 2>/dev/null || echo "unknown")
    ok "Frontend running (PID $frontend_pid_val, started $running_since)"
    info "  http://localhost:${FRONTEND_PORT}"
  else
    warn "Frontend not running"
  fi

  echo ""
}

# ── Logs ────────────────────────────────────────────────

cmd_logs() {
  local service="${1:-all}"

  case "$service" in
    backend|back)
      if [ -f "$BACKEND_DIR/server.log" ]; then
        tail -f "$BACKEND_DIR/server.log"
      else
        warn "No backend log file found"
      fi
      ;;
    frontend|front)
      if [ -f "$SCRIPT_DIR/.frontend.log" ]; then
        tail -f "$SCRIPT_DIR/.frontend.log"
      else
        warn "No frontend log file found"
      fi
      ;;
    all)
      echo ""
      bold "═══ BACKEND LOGS (last 10 lines) ═══"
      if [ -f "$BACKEND_DIR/server.log" ]; then
        tail -10 "$BACKEND_DIR/server.log"
      else
        warn "No backend log file"
      fi
      echo ""
      bold "═══ FRONTEND LOGS (last 10 lines) ═══"
      if [ -f "$SCRIPT_DIR/.frontend.log" ]; then
        tail -10 "$SCRIPT_DIR/.frontend.log"
      else
        warn "No frontend log file"
      fi
      echo ""
      info "Use: ./run.sh logs backend  or  ./run.sh logs frontend  to follow"
      ;;
    *)
      err "Unknown service: $service (use: backend, frontend, or all)"
      exit 1
      ;;
  esac
}

# ── Build Frontend ──────────────────────────────────────

cmd_build() {
  info "Building frontend for production..."
  cd "$FRONTEND_DIR"
  npm run build
  cd "$SCRIPT_DIR"
  ok "Frontend built successfully"
  info "  Run: cd type-strike-web && npm start  to serve the production build"
}

# ── Clean ────────────────────────────────────────────────

cmd_clean() {
  warn "This will remove PID files and logs."
  rm -f "$BACKEND_PID_FILE" "$FRONTEND_PID_FILE"
  rm -f "$SCRIPT_DIR/.frontend.log"
  ok "Cleaned up"
}

# ── Usage ───────────────────────────────────────────────

print_usage() {
  echo ""
  bold "TYPE STRIKE — Unified Server Manager"
  echo ""
  echo "  Usage: ./run.sh <command> [options]"
  echo ""
  echo "  Commands:"
  echo "    start              Start both servers"
  echo "    stop               Stop both servers"
  echo "    restart            Restart both servers"
  echo "    status             Check server status"
  echo "    logs [service]     View logs (backend | frontend | all)"
  echo "    build              Build frontend for production"
  echo "    clean              Remove PID files and logs"
  echo ""
  echo "  Options (for start/restart):"
  echo "    --seed             (Re)seed levels before starting backend"
  echo ""
  echo "  Environment:"
  echo "    SERVER_PORT        Backend port (default: 8080)"
  echo "    FRONTEND_PORT      Frontend port (default: 3000)"
  echo "    DATABASE_URL       PostgreSQL connection string"
  echo ""
}

# ── Main ────────────────────────────────────────────────

main() {
  local cmd="${1:-help}"
  shift 2>/dev/null || true

  case "$cmd" in
    start)     cmd_start "$@" ;;
    stop)      cmd_stop ;;
    restart)   cmd_restart "$@" ;;
    status)    cmd_status ;;
    logs)      cmd_logs "$@" ;;
    build)     cmd_build ;;
    clean)     cmd_clean ;;
    help|--help|-h) print_usage ;;
    *)
      err "Unknown command: $cmd"
      print_usage
      exit 1
      ;;
  esac
}

main "$@"
