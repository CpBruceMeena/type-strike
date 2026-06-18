package com.typestrike.data.model

import com.google.gson.annotations.SerializedName

/**
 * Matches backend GET /api/v1/levels/{levelId}?player_id={playerId} response.
 */
data class LevelDetail(
    val id: Int,
    val name: String,
    val tier: String,
    val difficulty: Int,
    @SerializedName("pass_wpm") val passWpm: Int,
    @SerializedName("pass_accuracy") val passAccuracy: Int,
    @SerializedName("word_min_length") val wordMinLength: Int,
    @SerializedName("word_max_length") val wordMaxLength: Int,
    @SerializedName("word_count") val wordCount: Int,
    @SerializedName("sample_words") val sampleWords: List<String>,
    @SerializedName("player_best_wpm") val playerBestWpm: Int? = null,
    @SerializedName("player_best_acc") val playerBestAcc: Float? = null,
    @SerializedName("player_stars") val playerStars: Int? = null
)

/**
 * Response from POST /api/v1/players/{playerId}/levels/{levelId}/complete.
 */
data class LevelCompleteResponse(
    val id: Int,
    @SerializedName("player_id") val playerId: Int,
    @SerializedName("level_id") val levelId: Int,
    val stars: Int,
    @SerializedName("best_wpm") val bestWpm: Int,
    @SerializedName("best_accuracy") val bestAccuracy: Float,
    val completed: Boolean,
    val attempts: Int,
    @SerializedName("last_played_at") val lastPlayedAt: String
)

/**
 * Payload for POST /api/v1/players/{playerId}/levels/{levelId}/complete.
 */
data class CompleteLevelRequest(
    val wpm: Int,
    val accuracy: Float,
    val stars: Int,
    val completed: Boolean
)

/**
 * Response from GET /api/v1/levels/next?player_id={playerId}.
 */
data class NextLevelResponse(
    @SerializedName("next_level_id") val nextLevelId: Int
)
