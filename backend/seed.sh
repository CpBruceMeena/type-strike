#!/bin/bash
# Seed script: creates a test player and records level progress
# Run after the backend server is started.

BASE="http://localhost:8080/api/v1"

echo "=== Seeding type-strike test data ==="

# 1. Create a player
echo ""
echo "--- Creating player ---"
CREATE_RESP=$(curl -s -X POST "$BASE/players" \
  -H "Content-Type: application/json" \
  -d '{"title": "HOPEFUL_TYPER", "level": 1}')

echo "$CREATE_RESP" | python3 -m json.tool 2>/dev/null || echo "$CREATE_RESP"

# Extract player ID
PLAYER_ID=$(echo "$CREATE_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin).get('id', 1))" 2>/dev/null || echo "1")
echo ""
echo "Player ID: $PLAYER_ID"

# 2. Complete levels 1-5 with varying stars
echo ""
echo "--- Recording level completions ---"

complete_level() {
  local LEVEL=$1
  local STARS=$2
  local WPM=$3
  local ACC=$4
  
  curl -s -X POST "$BASE/players/$PLAYER_ID/levels/$LEVEL/complete" \
    -H "Content-Type: application/json" \
    -d "{\"stars\": $STARS, \"wpm\": $WPM, \"accuracy\": $ACC, \"completed\": true}"
  echo ""
}

complete_level 1 3 85 97.5
complete_level 2 3 82 96.0
complete_level 3 2 68 91.0
complete_level 4 2 65 90.5
complete_level 5 1 52 87.0

# 3. Add some XP
echo ""
echo "--- Adding XP ---"
curl -s -X POST "$BASE/players/$PLAYER_ID/xp" \
  -H "Content-Type: application/json" \
  -d '{"xp": 180}'
echo ""

# 4. Verify: get player summary
echo ""
echo "--- Verify: Player Summary ---"
curl -s "$BASE/players/$PLAYER_ID/summary" | python3 -m json.tool 2>/dev/null || curl -s "$BASE/players/$PLAYER_ID/summary"

# 5. Verify: level progress
echo ""
echo "--- Verify: Level 1 Progress ---"
curl -s "$BASE/players/$PLAYER_ID/levels/1" | python3 -m json.tool 2>/dev/null || curl -s "$BASE/players/$PLAYER_ID/levels/1"

echo ""
echo "=== Seed complete! ==="
echo "Player $PLAYER_ID is ready."
echo ""
echo "Quick curl reference:"
echo "  Summary:  curl $BASE/players/$PLAYER_ID/summary"
echo "  All progress: curl $BASE/players/$PLAYER_ID/levels"
echo "  Level detail: curl $BASE/levels/3"
