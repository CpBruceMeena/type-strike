import type {
  Player,
  PlayerSummary,
  CreatePlayerRequest,
  AddXpRequest,
  AddXpResponse,
  RegisterPlayerRequest,
  RegisterPlayerResponse,
  LevelDetail,
  LevelCompleteResponse,
  CompleteLevelRequest,
  NextLevelResponse,
  ActivityEvent,
  LeaderboardResponse,
  PlayerRankResponse,
  SyncLeaderboardRequest,
  DailyChallengesResponse,
  SubmitChallengeRequest,
  SubmitChallengeResponse,
  BatchUpdateSettingsRequest,
  GameStartRequest,
  GameStartResponse,
  GameCompleteRequest,
  GameCompleteResponse,
  GameHistoryResponse,
  ContestInfo,
  ContestLeaderboardResponse,
  TimedLeaderboardResponse,
  PlayerExtendedStats,
  LessonProgress,
  UpdateLessonProgressRequest,
  ProgressionResponse,
  TierUpgradeResponse,
  RankTier,
  AllTiersDetailResponse,
  AllAchievementsResponse,
  CheckAchievementsResult,
  UnlockedCountResponse,
  StreakInfoResponse,
  ClaimRewardResponse,
  UseStreakFreezeResponse,
} from "./types";

// ── Configuration ───────────────────────────────────────

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

// ── Fetch Wrapper ───────────────────────────────────────

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE}/${path}`;
  const res = await fetch(url, {
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API ${res.status}: ${body}`);
  }

  return res.json() as Promise<T>;
}

// ── API Client ──────────────────────────────────────────

export const api = {
  // ── Player ──────────────────────────────────────────
  createPlayer(data: CreatePlayerRequest): Promise<Player> {
    return request<Player>("api/v1/players", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  registerPlayer(data: RegisterPlayerRequest): Promise<RegisterPlayerResponse> {
    return request<RegisterPlayerResponse>("api/v1/players/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  getPlayer(id: number): Promise<Player> {
    return request<Player>(`api/v1/players/${id}`);
  },

  getPlayerSummary(id: number): Promise<PlayerSummary> {
    return request<PlayerSummary>(`api/v1/players/${id}/summary`);
  },

  addXp(id: number, data: AddXpRequest): Promise<AddXpResponse> {
    return request<AddXpResponse>(`api/v1/players/${id}/xp`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // ── Levels ──────────────────────────────────────────
  getLevelDetail(levelId: number, playerId: number): Promise<LevelDetail> {
    return request<LevelDetail>(
      `api/v1/levels/${levelId}?player_id=${playerId}`
    );
  },

  getAllLevels(playerId?: number): Promise<LevelDetail[]> {
    const path = playerId
      ? `api/v1/levels?player_id=${playerId}`
      : "api/v1/levels";
    return request<LevelDetail[]>(path);
  },

  getNextLevel(playerId: number): Promise<NextLevelResponse> {
    return request<NextLevelResponse>(
      `api/v1/levels/next?player_id=${playerId}`
    );
  },

  getLevelProgress(
    playerId: number,
    levelId: number
  ): Promise<LevelCompleteResponse> {
    return request<LevelCompleteResponse>(
      `api/v1/players/${playerId}/levels/${levelId}`
    );
  },

  getAllPlayerProgress(
    playerId: number
  ): Promise<LevelCompleteResponse[]> {
    return request<LevelCompleteResponse[]>(
      `api/v1/players/${playerId}/levels`
    );
  },

  completeLevel(
    playerId: number,
    levelId: number,
    data: CompleteLevelRequest
  ): Promise<LevelCompleteResponse> {
    return request<LevelCompleteResponse>(
      `api/v1/players/${playerId}/levels/${levelId}/complete`,
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    );
  },

  // ── Activity ────────────────────────────────────────
  getRecentActivity(
    playerId: number,
    limit = 20
  ): Promise<ActivityEvent[]> {
    return request<ActivityEvent[]>(`api/v1/players/${playerId}/activity?limit=${limit}`);
  },

  // ── Daily Challenges ────────────────────────────────
  getDailyChallenges(playerId: number): Promise<DailyChallengesResponse> {
    return request<DailyChallengesResponse>(
      `api/v1/players/${playerId}/daily-challenges`
    );
  },

  submitChallengeResult(
    playerId: number,
    challengeId: number,
    data: SubmitChallengeRequest
  ): Promise<SubmitChallengeResponse> {
    return request<SubmitChallengeResponse>(
      `api/v1/players/${playerId}/daily-challenges/${challengeId}/complete`,
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    );
  },

  // ── Leaderboard ─────────────────────────────────────
  getLeaderboardTop(limit = 50): Promise<LeaderboardResponse> {
    return request<LeaderboardResponse>(
      `api/v1/leaderboard?limit=${limit}`
    );
  },

  getDailyLeaderboard(limit = 50): Promise<LeaderboardResponse> {
    return request<LeaderboardResponse>(
      `api/v1/leaderboard/daily?limit=${limit}`
    );
  },

  getPlayerRank(playerId: number): Promise<PlayerRankResponse> {
    return request<PlayerRankResponse>(
      `api/v1/leaderboard/${playerId}`
    );
  },

  syncLeaderboard(data: SyncLeaderboardRequest): Promise<Record<string, unknown>> {
    return request("api/v1/leaderboard/sync", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // ── Settings ────────────────────────────────────────
  getSettings(playerId: number): Promise<Record<string, string>> {
    return request(`api/v1/players/${playerId}/settings`);
  },

  updateSettings(
    playerId: number,
    data: BatchUpdateSettingsRequest
  ): Promise<Record<string, string>> {
    return request(`api/v1/players/${playerId}/settings`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  // ── Web-specific: Games ─────────────────────────────
  startGame(data: GameStartRequest): Promise<GameStartResponse> {
    return request<GameStartResponse>("api/v1/games/start", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  completeGame(
    gameId: string,
    data: GameCompleteRequest
  ): Promise<GameCompleteResponse> {
    return request<GameCompleteResponse>(
      `api/v1/games/${gameId}/complete`,
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    );
  },

  getGameHistory(
    playerId: number,
    mode?: string,
    limit = 20,
    offset = 0
  ): Promise<GameHistoryResponse> {
    let path = `api/v1/games/history?player_id=${playerId}&limit=${limit}&offset=${offset}`;
    if (mode) path += `&mode=${mode}`;
    return request<GameHistoryResponse>(path);
  },

  // ── Web-specific: Contest ───────────────────────────
  getCurrentContest(playerId: number): Promise<ContestInfo> {
    return request<ContestInfo>(
      `api/v1/contest/current?player_id=${playerId}`
    );
  },

  getContestLeaderboard(
    contestId: number,
    limit = 50
  ): Promise<ContestLeaderboardResponse> {
    return request<ContestLeaderboardResponse>(
      `api/v1/contest/leaderboard?contest_id=${contestId}&limit=${limit}`
    );
  },

  // ── Web-specific: Timed Leaderboard ────────────────
  getTimedLeaderboard(
    mode: string,
    limit = 50
  ): Promise<TimedLeaderboardResponse> {
    return request<TimedLeaderboardResponse>(
      `api/v1/leaderboard/timed?mode=${mode}&limit=${limit}`
    );
  },

  // ── Web-specific: Extended Stats ────────────────────
  getExtendedStats(playerId: number): Promise<PlayerExtendedStats> {
    return request<PlayerExtendedStats>(
      `api/v1/players/${playerId}/extended-stats`
    );
  },

  // ── Lesson Progress ────────────────────────────────
  getAllLessonProgress(playerId: number): Promise<LessonProgress[]> {
    return request<LessonProgress[]>(
      `api/v1/players/${playerId}/lessons`
    );
  },

  getLessonProgress(
    playerId: number,
    lessonId: number
  ): Promise<LessonProgress> {
    return request<LessonProgress>(
      `api/v1/players/${playerId}/lessons/${lessonId}`
    );
  },

  completeLesson(
    playerId: number,
    lessonId: number,
    data: UpdateLessonProgressRequest
  ): Promise<LessonProgress> {
    return request<LessonProgress>(
      `api/v1/players/${playerId}/lessons/${lessonId}/complete`,
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    );
  },

  // ── Progression (Ranks, Titles, Themes) ────────────
  getProgression(playerId: number): Promise<ProgressionResponse> {
    return request<ProgressionResponse>(
      `api/v1/players/${playerId}/progression`
    );
  },

  checkTierUpgrade(playerId: number): Promise<TierUpgradeResponse> {
    return request<TierUpgradeResponse>(
      `api/v1/players/${playerId}/progression/check`,
      {
        method: "POST",
      }
    );
  },

  getAllTiers(): Promise<RankTier[]> {
    return request<RankTier[]>("api/v1/tiers");
  },

  getTierDetails(): Promise<AllTiersDetailResponse> {
    return request<AllTiersDetailResponse>("api/v1/tiers/detail");
  },

  // ── Achievements ────────────────────────────────
  getAchievements(playerId: number): Promise<AllAchievementsResponse> {
    return request<AllAchievementsResponse>(
      `api/v1/players/${playerId}/achievements`
    );
  },

  checkAchievements(
    playerId: number,
    data: {
      wpm?: number;
      accuracy?: number;
      max_combo?: number;
      levels_cleared?: number;
      streak_count?: number;
      contest_rank?: number;
    }
  ): Promise<CheckAchievementsResult> {
    return request<CheckAchievementsResult>(
      `api/v1/players/${playerId}/achievements/check`,
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    );
  },

  getAchievementUnlockCount(
    playerId: number
  ): Promise<UnlockedCountResponse> {
    return request<UnlockedCountResponse>(
      `api/v1/players/${playerId}/achievements/count`
    );
  },

  // ── Streak Rewards ────────────────────────────────
  getStreakInfo(playerId: number): Promise<StreakInfoResponse> {
    return request<StreakInfoResponse>(
      `api/v1/players/${playerId}/streak`
    );
  },

  claimDailyReward(playerId: number): Promise<ClaimRewardResponse> {
    return request<ClaimRewardResponse>(
      `api/v1/players/${playerId}/streak/claim`,
      { method: "POST" }
    );
  },

  useStreakFreeze(playerId: number): Promise<UseStreakFreezeResponse> {
    return request<UseStreakFreezeResponse>(
      `api/v1/players/${playerId}/streak/freeze`,
      { method: "POST" }
    );
  },
};
