package com.typestrike.ui.util

/**
 * Formats an ISO-8601 timestamp string into a human-readable relative time.
 * Examples: "Just now", "5m ago", "3h ago", "2d ago", "2026-06-17"
 */
fun formatTimestamp(isoTimestamp: String): String {
    if (isoTimestamp.isBlank()) return ""
    return try {
        val dt = java.time.Instant.parse(isoTimestamp)
        val now = java.time.Instant.now()
        val diff = java.time.Duration.between(dt, now)
        when {
            diff.toMinutes() < 1 -> "Just now"
            diff.toMinutes() < 60 -> "${diff.toMinutes()}m ago"
            diff.toHours() < 24 -> "${diff.toHours()}h ago"
            diff.toDays() < 7 -> "${diff.toDays()}d ago"
            else -> dt.atZone(java.time.ZoneId.systemDefault()).toLocalDate().toString()
        }
    } catch (_: Exception) { "" }
}
