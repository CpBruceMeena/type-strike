package com.typestrike.data.repository

import com.typestrike.data.api.TypeStrikeApi
import com.typestrike.data.model.LeaderboardResponse
import com.typestrike.data.model.PlayerRankResponse
import com.typestrike.data.model.SyncLeaderboardRequest
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Repository for leaderboard operations (global + daily).
 */
@Singleton
class LeaderboardRepository @Inject constructor(
    private val api: TypeStrikeApi
) {
    /**
     * Gets the global leaderboard — top players ranked by XP.
     */
    suspend fun getGlobalTop(limit: Int = 50): Result<LeaderboardResponse> = safeApiCall {
        val response = api.getLeaderboardTop(limit)
        if (response.isSuccessful) {
            response.body() ?: throw Exception("Empty response")
        } else {
            throw Exception("API error: ${response.code()} ${response.message()}")
        }
    }

    /**
     * Gets today's daily challenge leaderboard.
     */
    suspend fun getDailyTop(limit: Int = 50): Result<LeaderboardResponse> = safeApiCall {
        val response = api.getDailyLeaderboardTop(limit)
        if (response.isSuccessful) {
            response.body() ?: throw Exception("Empty response")
        } else {
            throw Exception("API error: ${response.code()} ${response.message()}")
        }
    }

    /**
     * Gets a specific player's rank with nearby competitors.
     */
    suspend fun getPlayerRank(playerId: Int): Result<PlayerRankResponse> = safeApiCall {
        val response = api.getPlayerRank(playerId)
        if (response.isSuccessful) {
            response.body() ?: throw Exception("Empty response")
        } else {
            throw Exception("API error: ${response.code()} ${response.message()}")
        }
    }

    /**
     * Syncs a player's stats to the leaderboard.
     */
    suspend fun syncPlayer(playerId: Int): Result<Unit> = safeApiCall {
        val response = api.syncLeaderboard(SyncLeaderboardRequest(playerId))
        if (!response.isSuccessful) {
            throw Exception("API error: ${response.code()} ${response.message()}")
        }
    }

    private suspend fun <T> safeApiCall(call: suspend () -> T): Result<T> {
        return withContext(Dispatchers.IO) {
            try {
                Result.success(call())
            } catch (e: Exception) {
                Result.failure(e)
            }
        }
    }
}
