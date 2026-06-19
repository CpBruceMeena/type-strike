package com.typestrike.ui.home

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.typestrike.data.model.DailyChallenge
import com.typestrike.data.model.LevelCompleteResponse
import com.typestrike.data.repository.DailyChallengeRepository
import com.typestrike.data.repository.LevelRepository
import com.typestrike.data.repository.PlayerRepository
import com.typestrike.ui.util.Achievement
import com.typestrike.ui.util.AchievementInput
import com.typestrike.ui.util.AchievementUtil
import com.typestrike.ui.util.Progression
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.async
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

/**
 * Summary of today's daily challenges shown on the home card.
 */
data class DailyChallengeSummary(
    val total: Int = 3,
    val completed: Int = 0,
    val streakCount: Int = 0,
    val streakMultiplier: Double = 1.0,
    val hasIncomplete: Boolean = false,
    val todaysBestWpm: Int = 0
)

/**
 * UI state for the Home / Dashboard screen.
 */
data class HomeUiState(
    val isLoading: Boolean = true,
    val hasPlayer: Boolean = false,
    val hasError: Boolean = false,
    val errorMessage: String? = null,
    // Player data
    val playerLevel: Int = 1,
    val playerTitle: String = "RECRUIT",
    val totalStars: Int = 0,
    val xp: Int = 0,
    val xpForNext: Int = 150,
    val xpProgress: Float = 0f,
    // Quick stats
    val todaysBestWpm: Int = 0,
    val levelsCleared: Int = 0,
    val levelsTotal: Int = 100,
    val nextLevelId: Int = 1,
    // Streak
    val streakCount: Int = 0,
    // Daily challenge summary for home card
    val dailyChallengeSummary: DailyChallengeSummary = DailyChallengeSummary(),
    // Achievement spotlight for home card
    val spotlightAchievement: Achievement? = null,
    // Animation
    val entranceStarted: Boolean = false
)

@HiltViewModel
class HomeViewModel @Inject constructor(
    private val playerRepository: PlayerRepository,
    private val dailyChallengeRepository: DailyChallengeRepository,
    private val levelRepository: LevelRepository
) : ViewModel() {

    companion object {
        private const val PLAYER_ID = 1
    }

    private val _uiState = MutableStateFlow(HomeUiState())
    val uiState: StateFlow<HomeUiState> = _uiState.asStateFlow()

    init {
        loadDashboard()
    }

    private fun loadDashboard() {
        viewModelScope.launch {
            _uiState.value = HomeUiState(isLoading = true)

            val (summaryResult, challengesResult, progressResult) = coroutineScope {
                val s = async { playerRepository.getSummary(PLAYER_ID) }
                val c = async { dailyChallengeRepository.getChallenges(PLAYER_ID) }
                val p = async { levelRepository.getAllPlayerProgress(PLAYER_ID) }
                Triple(s.await(), c.await(), p.await())
            }

            val summary = summaryResult.getOrNull()
            val challenges = challengesResult.getOrNull()?.challenges ?: emptyList()
            val progress = progressResult.getOrNull() ?: emptyList()

            if (summary != null) {
                val player = summary.player
                val currentLevel = player.level
                val xpForNext = Progression.xpForNextLevel(currentLevel)
                val xpProgress = Progression.xpProgress(player.xp, currentLevel)

                // Daily challenge summary
                val completedChallenges = challenges.count { it.completed }
                val dcSummary = DailyChallengeSummary(
                    total = challenges.size.coerceAtLeast(1),
                    completed = completedChallenges,
                    streakCount = challengesResult.getOrNull()?.streakCount ?: 0,
                    streakMultiplier = challengesResult.getOrNull()?.streakMultiplier ?: 1.0,
                    hasIncomplete = challenges.any { !it.completed },
                    todaysBestWpm = summary.todaysBestWpm
                )

                // Compute spotlight achievement
                val completedTiers = AchievementUtil.computeCompletedTiers(progress)
                val input = AchievementInput(
                    playerLevel = currentLevel,
                    totalStars = player.totalStars,
                    levelsCleared = summary.levelsCleared,
                    progress = progress,
                    totalAttempts = progress.sumOf { it.attempts },
                    threeStarLevels = progress.count { it.stars >= 3 },
                    completedTiers = completedTiers
                )
                val achievements = AchievementUtil.computeAchievements(input)
                val spotlight = AchievementUtil.findSpotlightAchievement(achievements)

                _uiState.value = HomeUiState(
                    isLoading = false,
                    hasPlayer = true,
                    playerLevel = currentLevel,
                    playerTitle = player.title.ifBlank { "RECRUIT" },
                    totalStars = player.totalStars,
                    xp = player.xp,
                    xpForNext = xpForNext,
                    xpProgress = xpProgress,
                    todaysBestWpm = summary.todaysBestWpm,
                    levelsCleared = summary.levelsCleared,
                    levelsTotal = summary.levelsTotal,
                    nextLevelId = (summary.levelsCleared + 1).coerceAtLeast(1),
                    streakCount = player.streakCount,
                    dailyChallengeSummary = dcSummary,
                    spotlightAchievement = spotlight,
                    entranceStarted = false
                )
            } else {
                // New user — no player exists yet.
                _uiState.value = HomeUiState(
                    isLoading = false,
                    hasPlayer = false,
                    hasError = false,
                    nextLevelId = 1,
                    entranceStarted = false
                )
            }
        }
    }

    fun startEntrance() {
        _uiState.value = _uiState.value.copy(entranceStarted = true)
    }

    fun retry() {
        loadDashboard()
    }

    fun jumpInLabel(): String = when {
        !_uiState.value.hasPlayer -> "Start your journey — Level 1"
        _uiState.value.levelsCleared == 0 -> "Start with Level 1"
        _uiState.value.levelsCleared >= _uiState.value.levelsTotal -> "Practice mode — no limits!"
        else -> "Continue at Level ${_uiState.value.nextLevelId}"
    }

    fun getNextLevelId(): Int = _uiState.value.nextLevelId
}
