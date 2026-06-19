package com.typestrike.data.model

import com.google.gson.annotations.SerializedName

/**
 * A single entry on the leaderboard — matches backend LeaderboardEntry.
 */
data class LeaderboardEntry(
    @SerializedName("player_id") val playerId: Int,
    @SerializedName("player_name") val playerName: String,
    val level: Int,
    val xp: Int,
    @SerializedName("total_stars") val totalStars: Int,
    @SerializedName("levels_cleared") val levelsCleared: Int,
    @SerializedName("best_wpm") val bestWpm: Int,
    @SerializedName("updated_at") val updatedAt: String,
    val rank: Int
)

/**
 * Request body to sync a player's stats to the leaderboard.
 */
data class SyncLeaderboardRequest(
    @SerializedName("player_id") val playerId: Int
)

/**
 * Response wrapping a list of leaderboard entries — matches backend LeaderboardResponse.
 */
data class LeaderboardResponse(
    val entries: List<LeaderboardEntry>,
    @SerializedName("total_count") val totalCount: Int,
    @SerializedName("player_rank") val playerRank: PlayerRankResponse? = null
)

/**
 * A specific player's rank with nearby competitors — matches backend PlayerRank.
 */
data class PlayerRankResponse(
    val entry: LeaderboardEntry,
    val above: List<LeaderboardEntry>,
    val below: List<LeaderboardEntry>
)
