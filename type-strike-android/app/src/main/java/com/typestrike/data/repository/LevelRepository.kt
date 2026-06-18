package com.typestrike.data.repository

import com.typestrike.data.api.TypeStrikeApi
import com.typestrike.data.local.LocalLevelData
import com.typestrike.data.model.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Repository for level-related operations.
 * Falls back to [LocalLevelData] when the backend API is unavailable,
 * ensuring the Map screen always shows levels.
 */
@Singleton
class LevelRepository @Inject constructor(
    private val api: TypeStrikeApi
) {
    /**
     * Gets level detail with player's best progress.
     * Falls back to local level data when the API fails.
     */
    suspend fun getLevelDetail(levelId: Int, playerId: Int): Result<LevelDetail> {
        val apiResult = safeApiCall {
            val response = api.getLevelDetail(levelId, playerId)
            if (response.isSuccessful) {
                response.body() ?: throw Exception("Empty response")
            } else {
                throw Exception("API error: ${response.code()} ${response.message()}")
            }
        }
        // Fall back to local data on failure
        return if (apiResult.isSuccess) {
            apiResult
        } else {
            val local = LocalLevelData.getLevel(levelId)
            if (local != null) Result.success(local) else apiResult
        }
    }

    /**
     * Gets all 100 level configs.
     * Falls back to local level data when the API fails.
     */
    suspend fun getAllLevels(): Result<List<LevelDetail>> {
        val apiResult = safeApiCall {
            val response = api.getAllLevels()
            if (response.isSuccessful) {
                response.body() ?: throw Exception("Empty response")
            } else {
                throw Exception("API error: ${response.code()} ${response.message()}")
            }
        }
        // Fall back to local data on failure
        return if (apiResult.isSuccess) {
            apiResult
        } else {
            Result.success(LocalLevelData.allLevels)
        }
    }

    /**
     * Gets the player's progress across all levels.
     */
    suspend fun getAllPlayerProgress(playerId: Int): Result<List<LevelCompleteResponse>> = safeApiCall {
        val response = api.getAllPlayerProgress(playerId)
        if (response.isSuccessful) {
            response.body() ?: emptyList()
        } else {
            throw Exception("API error: ${response.code()} ${response.message()}")
        }
    }

    /**
     * Records a level completion attempt.
     */
    suspend fun completeLevel(
        playerId: Int,
        levelId: Int,
        wpm: Int,
        accuracy: Float,
        stars: Int,
        completed: Boolean
    ): Result<LevelCompleteResponse> = safeApiCall {
        val response = api.completeLevel(
            playerId, levelId,
            CompleteLevelRequest(wpm, accuracy, stars, completed)
        )
        if (response.isSuccessful) {
            response.body() ?: throw Exception("Empty response")
        } else {
            throw Exception("API error: ${response.code()} ${response.message()}")
        }
    }

    /**
     * Gets the player's progress on a specific level.
     */
    suspend fun getLevelProgress(playerId: Int, levelId: Int): Result<LevelCompleteResponse> = safeApiCall {
        val response = api.getLevelProgress(playerId, levelId)
        if (response.isSuccessful) {
            response.body() ?: throw Exception("Empty response")
        } else {
            throw Exception("API error: ${response.code()} ${response.message()}")
        }
    }

    /**
     * Wraps any suspend call in a try-catch and returns Result.
     */
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
