package com.typestrike.data.repository

import com.typestrike.data.api.TypeStrikeApi
import com.typestrike.data.model.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Repository for player-related operations.
 * Wraps the Retrofit API with error handling and dispatchers.
 */
@Singleton
class PlayerRepository @Inject constructor(
    private val api: TypeStrikeApi
) {
    /**
     * Fetches the full player summary for the home/dashboard screen.
     */
    suspend fun getSummary(playerId: Int): Result<PlayerSummary> = safeApiCall {
        val response = api.getPlayerSummary(playerId)
        if (response.isSuccessful) {
            response.body() ?: throw Exception("Empty response")
        } else {
            throw Exception("API error: ${response.code()} ${response.message()}")
        }
    }

    /**
     * Creates a new player with optional title and level.
     */
    suspend fun createPlayer(title: String = "RECRUIT", level: Int = 1): Result<Player> = safeApiCall {
        val response = api.createPlayer(CreatePlayerRequest(title, level))
        if (response.isSuccessful) {
            response.body() ?: throw Exception("Empty response")
        } else {
            throw Exception("API error: ${response.code()} ${response.message()}")
        }
    }

    /**
     * Gets player by ID.
     */
    suspend fun getPlayer(playerId: Int): Result<Player> = safeApiCall {
        val response = api.getPlayer(playerId)
        if (response.isSuccessful) {
            response.body() ?: throw Exception("Empty response")
        } else {
            throw Exception("API error: ${response.code()} ${response.message()}")
        }
    }

    /**
     * Adds XP to a player and handles level-up.
     */
    suspend fun addXp(playerId: Int, xp: Int): Result<AddXpResponse> = safeApiCall {
        val response = api.addXp(playerId, AddXpRequest(xp))
        if (response.isSuccessful) {
            response.body() ?: throw Exception("Empty response")
        } else {
            throw Exception("API error: ${response.code()} ${response.message()}")
        }
    }

    /**
     * Gets the next uncompleted level for the player.
     */
    suspend fun getNextLevel(playerId: Int): Result<NextLevelResponse> = safeApiCall {
        val response = api.getNextLevel(playerId)
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
