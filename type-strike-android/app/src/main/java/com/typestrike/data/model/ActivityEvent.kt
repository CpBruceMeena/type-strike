package com.typestrike.data.model

import com.google.gson.JsonObject
import com.google.gson.annotations.SerializedName

/**
 * Matches backend activity event model.
 * The metadata field comes from the backend as a JSON object (json.RawMessage),
 * not a string — so we use JsonObject to accept arbitrary JSON structure.
 */
data class ActivityEvent(
    val id: Int,
    @SerializedName("player_id") val playerId: Int,
    val type: String,
    val timestamp: String,
    val metadata: JsonObject? = null
) {
    companion object {
        const val TYPE_LEVEL_COMPLETED = "level_completed"
        const val TYPE_LEVEL_FAILED = "level_failed"
        const val TYPE_ACHIEVEMENT = "achievement"
        const val TYPE_LEVEL_UP = "level_up"
        const val TYPE_NEW_HIGH_SCORE = "new_high_score"
    }
}

/**
 * Payload for POST /api/v1/players/{playerId}/activity.
 */
data class RecordActivityRequest(
    val type: String,
    val playerId: Int,
    val metadata: String? = null
)

/**
 * Response from GET /api/v1/players/{playerId}/settings.
 */
data class SettingsResponse(
    val settings: Map<String, String>
)

/**
 * Payload for PUT /api/v1/players/{playerId}/settings.
 */
data class BatchUpdateSettingsRequest(
    val settings: Map<String, String>
)
