#!/bin/bash
# Seed script: creates test game sessions and timed leaderboard entries
# Run AFTER the backend server is started and seed.sh has been run.
# 
# Usage: bash seed_timed_leaderboard.sh
# 
# This script creates several test players with timed game sessions so
# that the timed leaderboard (1min, 3min, 5min) has realistic data.

BASE="http://localhost:8080/api/v1"

echo "=== Seeding timed leaderboard test data ===\n"

# ── Helper: register a player ────────────────────────────

register_player() {
  local EMAIL=$1
  local NAME=$2
  
  curl -s -X POST "$BASE/players/register" \
    -H "Content-Type: application/json" \
    -d "{\"email\": \"$EMAIL\", \"display_name\": \"$NAME\"}"
}

# ── Helper: start and complete a timed game ──────────────

play_timed_game() {
  local PLAYER_ID=$1
  local MODE=$2
  local WPM=$3
  local ACC=$4
  
  # Start game
  START_RESP=$(curl -s -X POST "$BASE/games/start" \
    -H "Content-Type: application/json" \
    -d "{\"player_id\": $PLAYER_ID, \"mode\": \"$MODE\"}")
  
  GAME_ID=$(echo "$START_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin).get('game_id',''))" 2>/dev/null)
  
  if [ -z "$GAME_ID" ]; then
    echo "Failed to start game for player $PLAYER_ID mode $MODE"
    return
  fi
  
  # Complete game
  COMPLETE_RESP=$(curl -s -X POST "$BASE/games/$GAME_ID/complete" \
    -H "Content-Type: application/json" \
    -d "{
      \"player_id\": $PLAYER_ID,
      \"wpm\": $WPM,
      \"accuracy\": $ACC,
      \"correct_keystrokes\": $((WPM * 5)),
      \"total_keystrokes\": $((WPM * 5 + 10)),
      \"max_combo\": 10,
      \"error_count\": 2,
      \"consistency\": 85,
      \"completed\": true
    }")
  
  echo "Player $PLAYER_ID | $MODE | ${WPM} WPM | ${ACC}% accuracy"
}

# ── Create test players ──────────────────────────────────

echo "--- Registering test players ---\n"

PLAYER1=$(register_player "speedster@test.com" "Speedster")
PID1=$(echo "$PLAYER1" | python3 -c "import sys,json; print(json.load(sys.stdin)['player']['id'])" 2>/dev/null)
echo "Player 1 ID: $PID1 (Speedster)"

PLAYER2=$(register_player "typeracer@test.com" "TypeRacer")
PID2=$(echo "$PLAYER2" | python3 -c "import sys,json; print(json.load(sys.stdin)['player']['id'])" 2>/dev/null)
echo "Player 2 ID: $PID2 (TypeRacer)"

PLAYER3=$(register_player "keymaster@test.com" "KeyMaster")
PID3=$(echo "$PLAYER3" | python3 -c "import sys,json; print(json.load(sys.stdin)['player']['id'])" 2>/dev/null)
echo "Player 3 ID: $PID3 (KeyMaster)"

PLAYER4=$(register_player "striker@test.com" "FlameStriker")
PID4=$(echo "$PLAYER4" | python3 -c "import sys,json; print(json.load(sys.stdin)['player']['id'])" 2>/dev/null)
echo "Player 4 ID: $PID4 (FlameStriker)"

PLAYER5=$(register_player "novice@test.com" "TypingNovice")
PID5=$(echo "$PLAYER5" | python3 -c "import sys,json; print(json.load(sys.stdin)['player']['id'])" 2>/dev/null)
echo "Player 5 ID: $PID5 (TypingNovice)"

echo ""

# ── Play timed games ─────────────────────────────────────

echo "--- Playing timed games ---\n"

# Speedster (very fast)
play_timed_game "$PID1" "timed_1min" 98 0.97
play_timed_game "$PID1" "timed_3min" 92 0.95
play_timed_game "$PID1" "timed_5min" 88 0.93

# TypeRacer (fast)
play_timed_game "$PID2" "timed_1min" 85 0.95
play_timed_game "$PID2" "timed_3min" 80 0.93
play_timed_game "$PID2" "timed_5min" 76 0.91

# KeyMaster (above average)
play_timed_game "$PID3" "timed_1min" 72 0.93
play_timed_game "$PID3" "timed_3min" 68 0.91
play_timed_game "$PID3" "timed_5min" 65 0.90

# FlameStriker (average)
play_timed_game "$PID4" "timed_1min" 58 0.90
play_timed_game "$PID4" "timed_3min" 55 0.88
play_timed_game "$PID4" "timed_5min" 52 0.87

# TypingNovice (slow - only played 1min)
play_timed_game "$PID5" "timed_1min" 35 0.85

echo "\n--- Syncing leaderboard ---\n"

for PID in "$PID1" "$PID2" "$PID3" "$PID4" "$PID5"; do
  if [ -n "$PID" ] && [ "$PID" != " " ]; then
    curl -s -X POST "$BASE/leaderboard/sync" \
      -H "Content-Type: application/json" \
      -d "{\"player_id\": $PID}" > /dev/null
    echo "Synced player $PID"
  fi
done

echo "\n"
echo "=== Seed complete! ===\n"
echo "Test players created with timed game sessions:\n"
echo "  Speedster (id=$PID1): 1min=98, 3min=92, 5min=88"
echo "  TypeRacer (id=$PID2): 1min=85, 3min=80, 5min=76"
echo "  KeyMaster (id=$PID3): 1min=72, 3min=68, 5min=65"
echo "  FlameStriker (id=$PID4): 1min=58, 3min=55, 5min=52"
echo "  TypingNovice (id=$PID5): 1min=35\n"
echo "To verify:"
echo "  curl '$BASE/leaderboard/timed?mode=timed_1min&limit=10'"
echo "  curl '$BASE/leaderboard/timed?mode=timed_3min&limit=10'"
echo "  curl '$BASE/leaderboard/timed?mode=timed_5min&limit=10'"
echo "  curl '$BASE/leaderboard'"
