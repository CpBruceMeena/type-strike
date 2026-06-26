// ── Player ──────────────────────────────────────────────

export interface Player {
  id: number;
  player_uuid: string;
  level: number;
  title: string;
  xp: number;
  total_stars: number;
  created_at: string;
  last_played_at: string;
  streak_count: number;
  last_streak_date: string | null;
  email: string;
  player_tag: string;
  display_name: string;
}

export interface RegisterPlayerRequest {
  email: string;
  display_name: string;
}

export interface RegisterPlayerResponse {
  player: Player;
  is_new: boolean;
}

export interface PlayerSummary {
  player: Player;
  todays_best_wpm: number;
  levels_total: number;
  levels_cleared: number;
  recent_activity: ActivityEvent[];
  next_level_xp: number;
  settings: Record<string, string>;
  streak_count: number;
}

export interface CreatePlayerRequest {
  title?: string;
  level?: number;
}

export interface AddXpRequest {
  xp: number;
}

export interface AddXpResponse {
  player: Player;
  leveled_up: boolean;
}

// ── Levels ──────────────────────────────────────────────

export interface LevelDetail {
  id: number;
  name: string;
  tier: string;
  difficulty: number;
  pass_wpm: number;
  pass_accuracy: number;
  paragraph: string;
  player_best_wpm?: number | null;
  player_best_acc?: number | null;
  player_stars?: number | null;
}

export interface LevelCompleteResponse {
  id: number;
  player_id: number;
  level_id: number;
  stars: number;
  best_wpm: number;
  best_accuracy: number;
  completed: boolean;
  attempts: number;
  last_played_at: string;
}

export interface CompleteLevelRequest {
  wpm: number;
  accuracy: number;
  stars: number;
  completed: boolean;
}

export interface NextLevelResponse {
  next_level_id: number;
}

// ── Leaderboard ─────────────────────────────────────────

export interface LeaderboardEntry {
  player_id: number;
  player_name: string;
  level: number;
  xp: number;
  total_stars: number;
  levels_cleared: number;
  best_wpm: number;
  updated_at: string;
  rank: number;
}

export interface SyncLeaderboardRequest {
  player_id: number;
}

export interface LeaderboardResponse {
  entries: LeaderboardEntry[];
  total_count: number;
  player_rank?: PlayerRankResponse;
}

export interface PlayerRankResponse {
  entry: LeaderboardEntry;
  above: LeaderboardEntry[];
  below: LeaderboardEntry[];
}

// ── Daily Challenges ────────────────────────────────────

export interface DailyChallenge {
  id: number;
  player_id: number;
  challenge_date: string;
  challenge_type: string;
  challenge_name: string;
  description: string;
  icon: string;
  level_id: number;
  target_wpm: number;
  target_accuracy: number;
  reward_xp: number;
  reward_stars: number;
  current_best_wpm: number;
  current_best_accuracy: number;
  completed: boolean;
  attempts: number;
}

export interface DailyChallengesResponse {
  challenges: DailyChallenge[];
  date: string;
  streak_count: number;
  streak_multiplier: number;
}

export interface SubmitChallengeRequest {
  wpm: number;
  accuracy: number;
}

export interface SubmitChallengeResponse {
  challenge: DailyChallenge;
  reward_awarded: boolean;
  reward_xp: number;
  reward_stars: number;
  just_completed: boolean;
  message?: string;
  streak_count: number;
  streak_multiplier: number;
}

// ── Activity ────────────────────────────────────────────

export interface ActivityEvent {
  id: number;
  player_id: number;
  type: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface RecordActivityRequest {
  type: string;
  playerId: number;
  metadata?: string;
}

// ── Settings ────────────────────────────────────────────

export interface BatchUpdateSettingsRequest {
  settings: Record<string, string>;
}

// ── Web-specific: Game Sessions ─────────────────────────

export type GameMode = "level" | "timed_1min" | "timed_3min" | "timed_5min" | "contest" | "coder";

export interface GameStartRequest {
  player_id: number;
  mode: GameMode;
  level_id?: number;
}

export interface GameStartResponse {
  game_id: string;
  mode: GameMode;
  paragraph: string;
  duration_seconds: number | null;
  level_id: number | null;
}

export interface GameCompleteRequest {
  player_id: number;
  wpm: number;
  accuracy: number;
  correct_keystrokes: number;
  total_keystrokes: number;
  error_count: number;
  consistency: number;
  max_combo: number;
  completed: boolean;
}

export interface GameCompleteResponse {
  game_id: string;
  wpm: number;
  accuracy: number;
  xp_earned: number;
  stars: number | null;
  rank: number | null;
}

export interface GameHistoryEntry {
  id: string;
  mode: GameMode;
  wpm: number;
  accuracy: number;
  correct_keystrokes: number;
  total_keystrokes: number;
  max_combo: number;
  xp_earned: number;
  played_at: string;
}

export interface GameHistoryResponse {
  games: GameHistoryEntry[];
  total: number;
}

// ── Web-specific: Contest ───────────────────────────────

export interface ContestInfo {
  contest_id: number;
  start_date: string;
  end_date: string;
  paragraph: string;
  difficulty: string;
  player_entry: {
    wpm: number | null;
    accuracy: number | null;
    rank: number | null;
  } | null;
}

export interface ContestLeaderboardEntry {
  rank: number;
  player_id: number;
  player_name: string;
  wpm: number;
  accuracy: number;
  level: number;
}

export interface ContestLeaderboardResponse {
  entries: ContestLeaderboardEntry[];
  total_count: number;
  player_entry?: ContestLeaderboardEntry;
}

// ── Web-specific: Timed Leaderboard ─────────────────────

export interface TimedLeaderboardEntry {
  player_id: number;
  player_name: string;
  mode: string;
  best_wpm: number;
  best_accuracy: number;
  achieved_at: string;
  rank: number;
}

export interface TimedLeaderboardResponse {
  entries: TimedLeaderboardEntry[];
  total_count: number;
}

// ── Web-specific: Player Extended Stats ─────────────────

export interface PlayerExtendedStats {
  total_games: number;
  total_levels_cleared: number;
  best_wpm_by_mode: {
    level: number;
    timed_1min: number;
    timed_3min: number;
    timed_5min: number;
    contest: number;
  };
  average_accuracy: number;
  total_xp: number;
  recent_activity: ActivityEvent[];
  daily_stats_30_days: Array<{
    date: string;
    games: number;
    best_wpm: number;
  }>;
}

// ── Lesson Progress ───────────────────────────────────

export interface LessonProgress {
  id: number;
  player_id: number;
  lesson_id: number;
  best_wpm: number;
  best_accuracy: number;
  completed: boolean;
  attempts: number;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface UpdateLessonProgressRequest {
  wpm: number;
  accuracy: number;
  completed: boolean;
}

// ── Game State (web UI) ─────────────────────────────────

export type GameState = "idle" | "loading" | "countdown" | "typing" | "mistake" | "stalled" | "complete" | "failed";

export interface ComboTier {
  minStreak: number;
  title: string;
  color: string;
  effect: string;
}

export interface CharResult {
  charIndex: number;
  char?: string;
  isCorrect: boolean;
  isTyped: boolean;
}

export interface GameplayUIState {
  gameState: GameState;
  mode: GameMode;
  levelId: number | null;
  levelName: string;
  tier: string;
  paragraph: string;
  currentCharIndex: number;
  charResults: CharResult[];
  totalKeystrokes: number;
  correctKeystrokes: number;
  combo: number;
  maxCombo: number;
  gaugeProgress: number;
  activeComboTierIndex: number;
  liveWpm: number;
  accuracy: number;
  elapsedMs: number;
  countdownValue: number;
  showGo: boolean;
  showKineticText: string | null;
  timeRemaining: number | null;
  finalWpm: number;
  finalAccuracy: number;
  stars: number;
  /** Language shown as a badge (e.g. "JavaScript", "Python") — only for coder mode */
  language?: string;
  languageColor?: string;
}
