package com.typestrike.data.model

import com.google.gson.annotations.SerializedName

/**
 * Matches backend GET /api/v1/players/{id} response.
 */
data class Player(
    val id: Int,
    @SerializedName("player_uuid") val playerUuid: String,
    val level: Int,
    val title: String,
    val xp: Int,
    @SerializedName("total_stars") val totalStars: Int,
    @SerializedName("created_at") val createdAt: String,
    @SerializedName("last_played_at") val lastPlayedAt: String,
    @SerializedName("streak_count") val streakCount: Int = 0,
    @SerializedName("last_streak_date") val lastStreakDate: String? = null
)

/**
 * Matches backend GET /api/v1/players/{id}/summary response.
 */
data class PlayerSummary(
    val player: Player,
    @SerializedName("todays_best_wpm") val todaysBestWpm: Int,
    @SerializedName("levels_total") val levelsTotal: Int,
    @SerializedName("levels_cleared") val levelsCleared: Int,
    @SerializedName("recent_activity") val recentActivity: List<ActivityEvent>,
    @SerializedName("next_level_xp") val nextLevelXp: Int,
    val settings: Map<String, String>,
    @SerializedName("streak_count") val streakCount: Int = 0
)

/**
 * Matches backend POST /api/v1/players payload.
 */
data class CreatePlayerRequest(
    val title: String = "RECRUIT",
    val level: Int = 1
)

/**
 * Matches backend POST /api/v1/players/{id}/xp payload + response.
 */
data class AddXpRequest(val xp: Int)

data class AddXpResponse(
    val player: Player,
    @SerializedName("leveled_up") val leveledUp: Boolean
)
