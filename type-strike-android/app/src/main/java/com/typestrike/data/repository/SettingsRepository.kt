package com.typestrike.data.repository

import com.typestrike.data.api.TypeStrikeApi
import com.typestrike.data.model.BatchUpdateSettingsRequest
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Repository for player settings operations.
 * Wraps the Retrofit API with error handling.
 */
@Singleton
class SettingsRepository @Inject constructor(
    private val api: TypeStrikeApi
) {
    /**
     * Fetches all settings for the given player.
     */
    suspend fun getAll(playerId: Int): Result<Map<String, String>> = safeApiCall {
        val response = api.getSettings(playerId)
        if (response.isSuccessful) {
            response.body() ?: emptyMap()
        } else {
            throw Exception("API error: ${response.code()} ${response.message()}")
        }
    }

    /**
     * Updates multiple settings at once.
     */
    suspend fun batchUpdate(playerId: Int, settings: Map<String, String>): Result<Map<String, String>> = safeApiCall {
        val response = api.updateSettings(playerId, BatchUpdateSettingsRequest(settings))
        if (response.isSuccessful) {
            response.body() ?: emptyMap()
        } else {
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
