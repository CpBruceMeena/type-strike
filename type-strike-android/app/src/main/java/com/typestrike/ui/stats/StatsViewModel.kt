package com.typestrike.ui.stats

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
 * Per-tier completion summary.
 */
data class TierStats(
    val name: String,
    val levels: IntRange,
    val completed: Int,
    val total: Int
)

/**
 * A datapoint for the WPM progression chart.
 */
data class WpmDatapoint(
    val levelId: Int,
    val wpm: Int,
    val stars: Int
)

/**
 * UI state for the Stats screen.
 */
data class StatsUiState(
    val isLoading: Boolean = true,
    val hasError: Boolean = false,
    val errorMessage: String? = null,
    // Player identity
    val playerLevel: Int = 1,
    val playerTitle: String = "RECRUIT",
    val playerStars: Int = 0,
    val playerXp: Int = 0,
    // Overall stats
    val todaysBestWpm: Int = 0,
    val levelsCleared: Int = 0,
    val levelsTotal: Int = 100,
    val totalAttempts: Int = 0,
    val bestWpmOverall: Int = 0,
    val averageAccuracy: Float = 0f,
    // Data for charts
    val tierStats: List<TierStats> = emptyList(),
    val wpmProgression: List<WpmDatapoint> = emptyList(),
    // Recent activity (from summary)
    val recentActivity: List<com.typestrike.data.model.ActivityEvent> = emptyList(),
    // Animation
    val entranceStarted: Boolean = false
)

@HiltViewModel
class StatsViewModel @Inject constructor(
    private val playerRepository: PlayerRepository,
    private val levelRepository: LevelRepository
) : ViewModel() {

    companion object {
        private const val PLAYER_ID = 1
    }

    private val _uiState = MutableStateFlow(StatsUiState())
    val uiState: StateFlow<StatsUiState> = _uiState.asStateFlow()

    init {
        loadStats()
    }

    fun loadStats() {
        viewModelScope.launch {
            _uiState.value = StatsUiState(isLoading = true)

            val (summaryResult, progressResult) = coroutineScope {
                val s = async { playerRepository.getSummary(PLAYER_ID) }
                val p = async { levelRepository.getAllPlayerProgress(PLAYER_ID) }
                Pair(s.await(), p.await())
            }

            val summary = summaryResult.getOrNull()
            val progress = progressResult.getOrNull() ?: emptyList()

            val player = summary?.player
            val levelsCleared = summary?.levelsCleared ?: 0
            val totalAttempts = progress.sumOf { it.attempts }

            // Best WPM across all levels
            val bestWpmOverall = progress.maxOfOrNull { it.bestWpm } ?: 0

            // Average accuracy (only for completed levels)
            val completedLevels = progress.filter { it.completed }
            val averageAccuracy = if (completedLevels.isNotEmpty()) {
                completedLevels.map { it.bestAccuracy }.average().toFloat()
            } else 0f

            // Tier breakdown
            val tiers = listOf(
                Triple("EMBER", 1..25, 0xFFFF5020L),
                Triple("IGNEOUS", 26..50, 0xFFFF6600L),
                Triple("MAGMA CORE", 51..75, 0xFFCC44FFL),
                Triple("OBSIDIAN", 76..100, 0xFFCCCCCCL)
            )
            val tierStats = tiers.map { (name, range, _) ->
                val inRange = progress.filter { it.levelId in range }
                TierStats(
                    name = name,
                    levels = range,
                    completed = inRange.count { it.completed },
                    total = range.count()
                )
            }

            // WPM progression (only completed levels, sorted)
            val wpmProgression = progress
                .filter { it.completed && it.bestWpm > 0 }
                .sortedBy { it.levelId }
                .map { WpmDatapoint(it.levelId, it.bestWpm, it.stars) }

            _uiState.value = StatsUiState(
                isLoading = false,
                playerLevel = player?.level ?: 1,
                playerTitle = player?.title ?: "RECRUIT",
                playerStars = player?.totalStars ?: 0,
                playerXp = player?.xp ?: 0,
                todaysBestWpm = summary?.todaysBestWpm ?: 0,
                levelsCleared = levelsCleared,
                levelsTotal = summary?.levelsTotal ?: 100,
                totalAttempts = totalAttempts,
                bestWpmOverall = bestWpmOverall,
                averageAccuracy = averageAccuracy,
                tierStats = tierStats,
                wpmProgression = wpmProgression,
                recentActivity = summary?.recentActivity ?: emptyList(),
                entranceStarted = true
            )
        }
    }

}
