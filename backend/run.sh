#!/bin/bash
# ────────────────────────────────────────────────────────────
#  type-strike backend — quick start
# ────────────────────────────────────────────────────────────
# Usage:
#   ./run.sh              — start with default settings
#   DB_URL=... ./run.sh   — start with custom database URL
#   ./run.sh --seed       — (re)seed levels then start
#   ./run.sh --seed-only  — seed levels and exit
# ────────────────────────────────────────────────────────────
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

# ── Config ─────────────────────────────────────────────────
SERVER_PORT="${SERVER_PORT:-8080}"
DB_URL="${DATABASE_URL:-postgresql://postgres:password@localhost:5432/typestrike?sslmode=disable}"

# ── Colors ─────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}"
echo "  ╔═══════════════════════════════════════╗"
echo "  ║       type-strike backend             ║"
echo "  ╚═══════════════════════════════════════╝"
echo -e "${NC}"

# ── Check dependencies ────────────────────────────────────
command -v go >/dev/null 2>&1 || { echo -e "${RED}Error: Go is not installed.${NC}"; exit 1; }
command -v psql >/dev/null 2>&1 || echo -e "${YELLOW}Warning: psql not found — migrations won't auto-run.${NC}"

# ── Migrations ─────────────────────────────────────────────
run_migrations() {
  echo -e "${YELLOW}▶ Running database migrations...${NC}"

  # Check if tables exist
  TABLE_CHECK=$(psql "$DB_URL" -t -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'players');" 2>/dev/null | tr -d '[:space:]')

  if [ "$TABLE_CHECK" != "t" ]; then
    echo "  Running 001_init.sql..."
    psql "$DB_URL" -f migrations/001_init.sql -q
  else
    echo "  ✓ 001_init.sql already applied"
  fi

  TABLE_CHECK=$(psql "$DB_URL" -t -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'levels');" 2>/dev/null | tr -d '[:space:]')

  if [ "$TABLE_CHECK" != "t" ]; then
    echo "  Running 002_levels.sql..."
    psql "$DB_URL" -f migrations/002_levels.sql -q
  else
    echo "  ✓ 002_levels.sql already applied"
  fi
}

# ── Seed levels ────────────────────────────────────────────
seed_levels() {
  echo -e "${YELLOW}▶ Seeding level configurations...${NC}"
  cd scripts
  go run seed_levels.go
  cd ..
  echo -e "${GREEN}  ✓ Levels seeded${NC}"
}

# ── Parse args ─────────────────────────────────────────────
SEED_ONLY=false
DO_SEED=false

for arg in "$@"; do
  case "$arg" in
    --seed-only) SEED_ONLY=true; DO_SEED=true ;;
    --seed) DO_SEED=true ;;
  esac
done

export DATABASE_URL="$DB_URL"
export SERVER_PORT="$SERVER_PORT"

# ── Execute ────────────────────────────────────────────────
run_migrations

if [ "$DO_SEED" = true ]; then
  seed_levels
fi

if [ "$SEED_ONLY" = true ]; then
  echo -e "${GREEN}✓ Seed complete. Exiting.${NC}"
  exit 0
fi

echo ""
echo -e "${CYAN}  Starting server on port ${SERVER_PORT}...${NC}"
echo -e "${CYAN}  Health check: http://localhost:${SERVER_PORT}/health${NC}"
echo ""

go run cmd/server/main.go
