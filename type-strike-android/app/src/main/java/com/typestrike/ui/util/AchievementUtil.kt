package com.typestrike.ui.util

import com.typestrike.data.model.LevelCompleteResponse

/**
 * An achievement the player can earn.
 */
data class Achievement(
    val id: String,
    val title: String,
    val description: String,
    val icon: String,
    val category: String,
    val isUnlocked: Boolean = false,
    val progress: Float = 0f,       // 0..1 completion
    val progressText: String = "",  // e.g. "5 / 10"
    val unlockedAt: String? = null  // timestamp when unlocked (if available)
)

/**
 * Input parameters for computing achievements.
 */
data class AchievementInput(
    val playerLevel: Int,
    val totalStars: Int,
    val levelsCleared: Int,
    val progress: List<LevelCompleteResponse>,
    val totalAttempts: Int,
    val threeStarLevels: Int,
    val completedTiers: Int
)

object AchievementUtil {

    /**
     * Computes all 18 achievements based on the player's current stats.
     */
    fun computeAchievements(input: AchievementInput): List<Achievement> {
        val bestWpmOverall = input.progress.maxOfOrNull { it.bestWpm } ?: 0
        val completedLevels = input.progress.filter { it.completed }
        val avgAccuracy = if (completedLevels.isNotEmpty()) {
            completedLevels.map { it.bestAccuracy }.average().toFloat()
        } else 0f

        return listOf(
            // ── Progression ───────────────────────────────
            Achievement(
                id = "first_level",
                title = "First Strike",
                description = "Complete your first level",
                icon = "🔥",
                category = "Progression",
                isUnlocked = input.levelsCleared >= 1,
                progress = (input.levelsCleared.coerceAtMost(1)).toFloat(),
                progressText = if (input.levelsCleared >= 1) "Done!" else "0 / 1"
            ),
            Achievement(
                id = "ten_levels",
                title = "Blaze Runner",
                description = "Complete 10 levels",
                icon = "⚡",
                category = "Progression",
                isUnlocked = input.levelsCleared >= 10,
                progress = (input.levelsCleared.toFloat() / 10f).coerceIn(0f, 1f),
                progressText = "${input.levelsCleared} / 10"
            ),
            Achievement(
                id = "twenty_five_levels",
                title = "Ember Master",
                description = "Complete all Ember tier levels (1–25)",
                icon = "🌋",
                category = "Progression",
                isUnlocked = (1..25).all { id -> input.progress.any { it.levelId == id && it.completed } },
                progress = {
                    val completed = (1..25).count { id -> input.progress.any { it.levelId == id && it.completed } }
                    completed.toFloat() / 25f
                }(),
                progressText = "${(1..25).count { id -> input.progress.any { it.levelId == id && it.completed } }} / 25"
            ),
            Achievement(
                id = "fifty_levels",
                title = "Igneous Warrior",
                description = "Complete all Igneous tier levels (26–50)",
                icon = "🔴",
                category = "Progression",
                isUnlocked = (26..50).all { id -> input.progress.any { it.levelId == id && it.completed } },
                progress = {
                    val completed = (26..50).count { id -> input.progress.any { it.levelId == id && it.completed } }
                    completed.toFloat() / 25f
                }(),
                progressText = "${(26..50).count { id -> input.progress.any { it.levelId == id && it.completed } }} / 25"
            ),
            Achievement(
                id = "seventy_five_levels",
                title = "Magma Lord",
                description = "Complete all Magma Core levels (51–75)",
                icon = "🟣",
                category = "Progression",
                isUnlocked = (51..75).all { id -> input.progress.any { it.levelId == id && it.completed } },
                progress = {
                    val completed = (51..75).count { id -> input.progress.any { it.levelId == id && it.completed } }
                    completed.toFloat() / 25f
                }(),
                progressText = "${(51..75).count { id -> input.progress.any { it.levelId == id && it.completed } }} / 25"
            ),

            // ── Stars ─────────────────────────────────────
            Achievement(
                id = "ten_stars",
                title = "Shard Collector",
                description = "Earn 10 stars total",
                icon = "✦",
                category = "Stars",
                isUnlocked = input.totalStars >= 10,
                progress = (input.totalStars.toFloat() / 10f).coerceIn(0f, 1f),
                progressText = "${input.totalStars} / 10"
            ),
            Achievement(
                id = "fifty_stars",
                title = "Crystal Hoarder",
                description = "Earn 50 stars total",
                icon = "💎",
                category = "Stars",
                isUnlocked = input.totalStars >= 50,
                progress = (input.totalStars.toFloat() / 50f).coerceIn(0f, 1f),
                progressText = "${input.totalStars} / 50"
            ),
            Achievement(
                id = "perfect_three",
                title = "Triple Threat",
                description = "Earn 3 stars on 5 different levels",
                icon = "⭐",
                category = "Stars",
                isUnlocked = input.threeStarLevels >= 5,
                progress = (input.threeStarLevels.toFloat() / 5f).coerceIn(0f, 1f),
                progressText = "${input.threeStarLevels} / 5"
            ),

            // ── Speed ─────────────────────────────────────
            Achievement(
                id = "speed_40",
                title = "Getting Warm",
                description = "Reach 40 WPM on any level",
                icon = "💨",
                category = "Speed",
                isUnlocked = bestWpmOverall >= 40,
                progress = (bestWpmOverall.toFloat() / 40f).coerceIn(0f, 1f),
                progressText = "${bestWpmOverall.coerceAtMost(40)} / 40 WPM"
            ),
            Achievement(
                id = "speed_60",
                title = "Speed Demon",
                description = "Reach 60 WPM on any level",
                icon = "🏃",
                category = "Speed",
                isUnlocked = bestWpmOverall >= 60,
                progress = (bestWpmOverall.toFloat() / 60f).coerceIn(0f, 1f),
                progressText = "${bestWpmOverall.coerceAtMost(60)} / 60 WPM"
            ),
            Achievement(
                id = "speed_80",
                title = "Ignition Speed",
                description = "Reach 80 WPM on any level",
                icon = "🚀",
                category = "Speed",
                isUnlocked = bestWpmOverall >= 80,
                progress = (bestWpmOverall.toFloat() / 80f).coerceIn(0f, 1f),
                progressText = "${bestWpmOverall.coerceAtMost(80)} / 80 WPM"
            ),

            // ── Accuracy ──────────────────────────────────
            Achievement(
                id = "acc_95",
                title = "Precision Striker",
                description = "Average 95% accuracy across all completed levels",
                icon = "🎯",
                category = "Accuracy",
                isUnlocked = avgAccuracy >= 0.95f,
                progress = (avgAccuracy / 0.95f).coerceIn(0f, 1f),
                progressText = "${(avgAccuracy * 100).toInt()}% / 95%"
            ),
            Achievement(
                id = "acc_99",
                title = "Flawless Execution",
                description = "Average 99% accuracy across all completed levels",
                icon = "💯",
                category = "Accuracy",
                isUnlocked = avgAccuracy >= 0.99f,
                progress = (avgAccuracy / 0.99f).coerceIn(0f, 1f),
                progressText = "${(avgAccuracy * 100).toInt()}% / 99%"
            ),

            // ── Dedication ────────────────────────────────
            Achievement(
                id = "level_10",
                title = "Rising Flame",
                description = "Reach player level 10",
                icon = "🎖️",
                category = "Dedication",
                isUnlocked = input.playerLevel >= 10,
                progress = (input.playerLevel.toFloat() / 10f).coerceIn(0f, 1f),
                progressText = "Lv.${input.playerLevel} / 10"
            ),
            Achievement(
                id = "level_25",
                title = "Legend in the Making",
                description = "Reach player level 25",
                icon = "🏆",
                category = "Dedication",
                isUnlocked = input.playerLevel >= 25,
                progress = (input.playerLevel.toFloat() / 25f).coerceIn(0f, 1f),
                progressText = "Lv.${input.playerLevel} / 25"
            ),
            Achievement(
                id = "hundred_attempts",
                title = "Persistent Striker",
                description = "Attempt levels 100 times (total)",
                icon = "💪",
                category = "Dedication",
                isUnlocked = input.totalAttempts >= 100,
                progress = (input.totalAttempts.toFloat() / 100f).coerceIn(0f, 1f),
                progressText = "${input.totalAttempts} / 100"
            ),
            Achievement(
                id = "all_tiers",
                title = "Conqueror",
                description = "Complete at least one level in every tier",
                icon = "👑",
                category = "Dedication",
                isUnlocked = input.completedTiers >= 4,
                progress = (input.completedTiers.toFloat() / 4f).coerceIn(0f, 1f),
                progressText = "${input.completedTiers} / 4 tiers"
            )
        )
    }

    /**
     * Computes how many of the 4 main tiers (Ember, Igneous, Magma Core, Obsidian)
     * the player has fully completed.
     */
    fun computeCompletedTiers(progress: List<LevelCompleteResponse>): Int {
        val ember = (1..25).all { id -> progress.any { it.levelId == id && it.completed } }
        val igneous = (26..50).all { id -> progress.any { it.levelId == id && it.completed } }
        val magmaCore = (51..75).all { id -> progress.any { it.levelId == id && it.completed } }
        val obsidian = (76..100).all { id -> progress.any { it.levelId == id && it.completed } }
        return listOf(ember, igneous, magmaCore, obsidian).count { it }
    }

    /**
     * Picks the best achievement for a home page spotlight:
     * 1. Most recently unlocked (last in the list that's unlocked)
     * 2. Or the closest to unlocking (highest progress that's not yet unlocked)
     */
    fun findSpotlightAchievement(achievements: List<Achievement>): Achievement? {
        val unlocked = achievements.filter { it.isUnlocked }
        if (unlocked.isNotEmpty()) return unlocked.last()
        return achievements.maxByOrNull { it.progress }
    }
}
