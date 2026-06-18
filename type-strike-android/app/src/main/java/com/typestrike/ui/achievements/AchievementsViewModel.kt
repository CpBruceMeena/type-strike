package com.typestrike.ui.achievements

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.typestrike.data.model.LevelCompleteResponse
import com.typestrike.data.repository.LevelRepository
import com.typestrike.data.repository.PlayerRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.async
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

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
 * UI state for the Achievements screen.
 */
data class AchievementsUiState(
    val isLoading: Boolean = true,
    val hasError: Boolean = false,
    val errorMessage: String? = null,
    val achievements: List<Achievement> = emptyList(),
    val totalUnlocked: Int = 0,
    val totalCount: Int = 0,
    val playerLevel: Int = 1,
    val playerTitle: String = "RECRUIT",
    val entranceStarted: Boolean = false
)

@HiltViewModel
class AchievementsViewModel @Inject constructor(
    private val playerRepository: PlayerRepository,
    private val levelRepository: LevelRepository
) : ViewModel() {

    companion object {
        private const val PLAYER_ID = 1
    }

    private val _uiState = MutableStateFlow(AchievementsUiState())
    val uiState: StateFlow<AchievementsUiState> = _uiState.asStateFlow()

    init {
        loadAchievements()
    }

    fun loadAchievements() {
        viewModelScope.launch {
            _uiState.value = AchievementsUiState(isLoading = true)

            val (summaryResult, progressResult) = coroutineScope {
                val s = async { playerRepository.getSummary(PLAYER_ID) }
                val p = async { levelRepository.getAllPlayerProgress(PLAYER_ID) }
                Pair(s.await(), p.await())
            }

            val summary = summaryResult.getOrNull()
            val progress = progressResult.getOrNull() ?: emptyList()
            val player = summary?.player

            val achievements = computeAchievements(
                playerLevel = player?.level ?: 1,
                totalStars = player?.totalStars ?: 0,
                levelsCleared = summary?.levelsCleared ?: 0,
                todaysBestWpm = summary?.todaysBestWpm ?: 0,
                progress = progress,
                totalAttempts = progress.sumOf { it.attempts },
                threeStarLevels = progress.count { it.stars >= 3 },
                completedTiers = computeCompletedTiers(progress)
            )

            _uiState.value = AchievementsUiState(
                isLoading = false,
                achievements = achievements,
                totalUnlocked = achievements.count { it.isUnlocked },
                totalCount = achievements.size,
                playerLevel = player?.level ?: 1,
                playerTitle = player?.title ?: "RECRUIT",
                entranceStarted = true
            )
        }
    }

    private fun computeCompletedTiers(progress: List<LevelCompleteResponse>): Int {
        val ember = (1..25).all { id -> progress.any { it.levelId == id && it.completed } }
        val igneous = (26..50).all { id -> progress.any { it.levelId == id && it.completed } }
        val magmaCore = (51..75).all { id -> progress.any { it.levelId == id && it.completed } }
        val obsidian = (76..100).all { id -> progress.any { it.levelId == id && it.completed } }
        return listOf(ember, igneous, magmaCore, obsidian).count { it }
    }

    private fun computeAchievements(
        playerLevel: Int,
        totalStars: Int,
        levelsCleared: Int,
        todaysBestWpm: Int,
        progress: List<LevelCompleteResponse>,
        totalAttempts: Int,
        threeStarLevels: Int,
        completedTiers: Int
    ): List<Achievement> {
        val bestWpmOverall = progress.maxOfOrNull { it.bestWpm } ?: 0
        val completedLevels = progress.filter { it.completed }
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
                isUnlocked = levelsCleared >= 1,
                progress = (levelsCleared.coerceAtMost(1)).toFloat(),
                progressText = if (levelsCleared >= 1) "Done!" else "0 / 1"
            ),
            Achievement(
                id = "ten_levels",
                title = "Blaze Runner",
                description = "Complete 10 levels",
                icon = "⚡",
                category = "Progression",
                isUnlocked = levelsCleared >= 10,
                progress = (levelsCleared.toFloat() / 10f).coerceIn(0f, 1f),
                progressText = "$levelsCleared / 10"
            ),
            Achievement(
                id = "twenty_five_levels",
                title = "Ember Master",
                description = "Complete all Ember tier levels (1–25)",
                icon = "🌋",
                category = "Progression",
                isUnlocked = (1..25).all { id -> progress.any { it.levelId == id && it.completed } },
                progress = {
                    val emberCompleted = (1..25).count { id -> progress.any { it.levelId == id && it.completed } }
                    emberCompleted.toFloat() / 25f
                }(),
                progressText = "${(1..25).count { id -> progress.any { it.levelId == id && it.completed } }} / 25"
            ),
            Achievement(
                id = "fifty_levels",
                title = "Igneous Warrior",
                description = "Complete all Igneous tier levels (26–50)",
                icon = "🔴",
                category = "Progression",
                isUnlocked = (26..50).all { id -> progress.any { it.levelId == id && it.completed } },
                progress = {
                    val completed = (26..50).count { id -> progress.any { it.levelId == id && it.completed } }
                    completed.toFloat() / 25f
                }(),
                progressText = "${(26..50).count { id -> progress.any { it.levelId == id && it.completed } }} / 25"
            ),
            Achievement(
                id = "seventy_five_levels",
                title = "Magma Lord",
                description = "Complete all Magma Core levels (51–75)",
                icon = "🟣",
                category = "Progression",
                isUnlocked = (51..75).all { id -> progress.any { it.levelId == id && it.completed } },
                progress = {
                    val completed = (51..75).count { id -> progress.any { it.levelId == id && it.completed } }
                    completed.toFloat() / 25f
                }(),
                progressText = "${(51..75).count { id -> progress.any { it.levelId == id && it.completed } }} / 25"
            ),

            // ── Stars ─────────────────────────────────────
            Achievement(
                id = "ten_stars",
                title = "Shard Collector",
                description = "Earn 10 stars total",
                icon = "✦",
                category = "Stars",
                isUnlocked = totalStars >= 10,
                progress = (totalStars.toFloat() / 10f).coerceIn(0f, 1f),
                progressText = "$totalStars / 10"
            ),
            Achievement(
                id = "fifty_stars",
                title = "Crystal Hoarder",
                description = "Earn 50 stars total",
                icon = "💎",
                category = "Stars",
                isUnlocked = totalStars >= 50,
                progress = (totalStars.toFloat() / 50f).coerceIn(0f, 1f),
                progressText = "$totalStars / 50"
            ),
            Achievement(
                id = "perfect_three",
                title = "Triple Threat",
                description = "Earn 3 stars on 5 different levels",
                icon = "⭐",
                category = "Stars",
                isUnlocked = threeStarLevels >= 5,
                progress = (threeStarLevels.toFloat() / 5f).coerceIn(0f, 1f),
                progressText = "$threeStarLevels / 5"
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
                isUnlocked = playerLevel >= 10,
                progress = (playerLevel.toFloat() / 10f).coerceIn(0f, 1f),
                progressText = "Lv.$playerLevel / 10"
            ),
            Achievement(
                id = "level_25",
                title = "Legend in the Making",
                description = "Reach player level 25",
                icon = "🏆",
                category = "Dedication",
                isUnlocked = playerLevel >= 25,
                progress = (playerLevel.toFloat() / 25f).coerceIn(0f, 1f),
                progressText = "Lv.$playerLevel / 25"
            ),
            Achievement(
                id = "hundred_attempts",
                title = "Persistent Striker",
                description = "Attempt levels 100 times (total)",
                icon = "💪",
                category = "Dedication",
                isUnlocked = totalAttempts >= 100,
                progress = (totalAttempts.toFloat() / 100f).coerceIn(0f, 1f),
                progressText = "$totalAttempts / 100"
            ),
            Achievement(
                id = "all_tiers",
                title = "Conqueror",
                description = "Complete at least one level in every tier",
                icon = "👑",
                category = "Dedication",
                isUnlocked = completedTiers >= 4,
                progress = (completedTiers.toFloat() / 4f).coerceIn(0f, 1f),
                progressText = "$completedTiers / 4 tiers"
            )
        )
    }
}
