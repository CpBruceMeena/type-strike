package com.typestrike.data.api

import com.typestrike.data.model.*
import retrofit2.Response
import retrofit2.http.*

/**
 * Retrofit interface for all type-strike Go backend API endpoints.
 */
interface TypeStrikeApi {

    // ── Player Endpoints ────────────────────────────────────

    @POST("api/v1/players")
    suspend fun createPlayer(@Body request: CreatePlayerRequest): Response<Player>

    @GET("api/v1/players/{id}")
    suspend fun getPlayer(@Path("id") playerId: Int): Response<Player>

    @GET("api/v1/players/{id}/summary")
    suspend fun getPlayerSummary(@Path("id") playerId: Int): Response<PlayerSummary>

    @POST("api/v1/players/{id}/xp")
    suspend fun addXp(@Path("id") playerId: Int, @Body request: AddXpRequest): Response<AddXpResponse>

    // ── Level Endpoints ─────────────────────────────────────

    @GET("api/v1/levels/{levelId}")
    suspend fun getLevelDetail(
        @Path("levelId") levelId: Int,
        @Query("player_id") playerId: Int
    ): Response<LevelDetail>

    @GET("api/v1/levels")
    suspend fun getAllLevels(): Response<List<LevelDetail>>

    @GET("api/v1/levels/next")
    suspend fun getNextLevel(@Query("player_id") playerId: Int): Response<NextLevelResponse>

    @GET("api/v1/players/{playerId}/levels/{levelId}")
    suspend fun getLevelProgress(
        @Path("playerId") playerId: Int,
        @Path("levelId") levelId: Int
    ): Response<LevelCompleteResponse>

    @GET("api/v1/players/{playerId}/levels")
    suspend fun getAllPlayerProgress(@Path("playerId") playerId: Int): Response<List<LevelCompleteResponse>>

    @POST("api/v1/players/{playerId}/levels/{levelId}/complete")
    suspend fun completeLevel(
        @Path("playerId") playerId: Int,
        @Path("levelId") levelId: Int,
        @Body request: CompleteLevelRequest
    ): Response<LevelCompleteResponse>

    // ── Activity Endpoints ──────────────────────────────────

    @GET("api/v1/players/{playerId}/activity")
    suspend fun getRecentActivity(
        @Path("playerId") playerId: Int,
        @Query("limit") limit: Int = 20
    ): Response<List<ActivityEvent>>

    @POST("api/v1/players/{playerId}/activity")
    suspend fun recordActivity(
        @Path("playerId") playerId: Int,
        @Body request: RecordActivityRequest
    ): Response<ActivityEvent>

    // ── Daily Challenge Endpoints ──────────────────────────

    @GET("api/v1/players/{playerId}/daily-challenges")
    suspend fun getDailyChallenges(@Path("playerId") playerId: Int): Response<DailyChallengesResponse>

    @POST("api/v1/players/{playerId}/daily-challenges/{challengeId}/complete")
    suspend fun submitChallengeResult(
        @Path("playerId") playerId: Int,
        @Path("challengeId") challengeId: Int,
        @Body request: SubmitChallengeRequest
    ): Response<SubmitChallengeResponse>

    // ── Leaderboard Endpoints ───────────────────────────────

    @GET("api/v1/leaderboard")
    suspend fun getLeaderboardTop(@Query("limit") limit: Int = 50): Response<LeaderboardResponse>

    @GET("api/v1/leaderboard/daily")
    suspend fun getDailyLeaderboardTop(@Query("limit") limit: Int = 50): Response<LeaderboardResponse>

    @GET("api/v1/leaderboard/{playerId}")
    suspend fun getPlayerRank(@Path("playerId") playerId: Int): Response<PlayerRankResponse>

    @POST("api/v1/leaderboard/sync")
    suspend fun syncLeaderboard(@Body request: SyncLeaderboardRequest): Response<Map<String, Any>>

    // ── Settings Endpoints ──────────────────────────────────

    @GET("api/v1/players/{playerId}/settings")
    suspend fun getSettings(@Path("playerId") playerId: Int): Response<Map<String, String>>

    @PUT("api/v1/players/{playerId}/settings")
    suspend fun updateSettings(
        @Path("playerId") playerId: Int,
        @Body request: BatchUpdateSettingsRequest
    ): Response<Map<String, String>>
}
