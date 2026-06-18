package com.typestrike.data.repository

import com.typestrike.data.api.TypeStrikeApi
import com.typestrike.data.model.DailyChallengesResponse
import com.typestrike.data.model.SubmitChallengeRequest
import com.typestrike.data.model.SubmitChallengeResponse
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Repository for daily challenge operations.
 */
@Singleton
class DailyChallengeRepository @Inject constructor(
    private val api: TypeStrikeApi
) {
    /**
     * Gets today's challenges for the player (generates them if they don't exist).
     */
    suspend fun getChallenges(playerId: Int): Result<DailyChallengesResponse> = safeApiCall {
        val response = api.getDailyChallenges(playerId)
        if (response.isSuccessful) {
            response.body() ?: throw Exception("Empty response")
        } else {
            throw Exception("API error: ${response.code()} ${response.message()}")
        }
    }

    /**
     * Submits a challenge result and gets updated challenge + potential reward.
     */
    suspend fun submitResult(
        playerId: Int,
        challengeId: Int,
        wpm: Int,
        accuracy: Double
    ): Result<SubmitChallengeResponse> = safeApiCall {
        val response = api.submitChallengeResult(
            playerId, challengeId,
            SubmitChallengeRequest(wpm, accuracy)
        )
        if (response.isSuccessful) {
            response.body() ?: throw Exception("Empty response")
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
