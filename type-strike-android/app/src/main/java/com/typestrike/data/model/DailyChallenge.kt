package com.typestrike.data.model

import com.google.gson.annotations.SerializedName

/**
 * Matches backend GET /api/v1/players/{playerId}/daily-challenges response item.
 */
data class DailyChallenge(
    val id: Int,
    @SerializedName("player_id") val playerId: Int,
    @SerializedName("challenge_date") val challengeDate: String,
    @SerializedName("challenge_type") val challengeType: String,
    @SerializedName("challenge_name") val challengeName: String,
    val description: String,
    val icon: String,
    @SerializedName("level_id") val levelId: Int,
    @SerializedName("target_wpm") val targetWpm: Int,
    @SerializedName("target_accuracy") val targetAccuracy: Double,
    @SerializedName("reward_xp") val rewardXp: Int,
    @SerializedName("reward_stars") val rewardStars: Int,
    @SerializedName("current_best_wpm") val currentBestWpm: Int = 0,
    @SerializedName("current_best_accuracy") val currentBestAccuracy: Double = 0.0,
    val completed: Boolean = false,
    val attempts: Int = 0
)

/**
 * Response from GET /api/v1/players/{playerId}/daily-challenges.
 */
data class DailyChallengesResponse(
    val challenges: List<DailyChallenge>,
    val date: String
)

/**
 * Payload for POST /api/v1/players/{playerId}/daily-challenges/{challengeId}/complete.
 */
data class SubmitChallengeRequest(
    val wpm: Int,
    val accuracy: Double
)

/**
 * Response from POST .../daily-challenges/{challengeId}/complete.
 */
data class SubmitChallengeResponse(
    val challenge: DailyChallenge,
    @SerializedName("reward_awarded") val rewardAwarded: Boolean = false,
    @SerializedName("reward_xp") val rewardXp: Int = 0,
    @SerializedName("reward_stars") val rewardStars: Int = 0,
    @SerializedName("just_completed") val justCompleted: Boolean = false,
    val message: String? = null
)
