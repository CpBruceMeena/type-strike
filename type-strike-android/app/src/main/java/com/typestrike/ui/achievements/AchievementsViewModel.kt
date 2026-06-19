package com.typestrike.ui.achievements

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.typestrike.data.repository.LevelRepository
import com.typestrike.data.repository.PlayerRepository
import com.typestrike.ui.util.AchievementInput
import com.typestrike.ui.util.AchievementUtil
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.async
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

/**
 * UI state for the Achievements screen.
 */
data class AchievementsUiState(
    val isLoading: Boolean = true,
    val hasError: Boolean = false,
    val errorMessage: String? = null,
    val achievements: List<com.typestrike.ui.util.Achievement> = emptyList(),
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

            val completedTiers = AchievementUtil.computeCompletedTiers(progress)
            val input = AchievementInput(
                playerLevel = player?.level ?: 1,
                totalStars = player?.totalStars ?: 0,
                levelsCleared = summary?.levelsCleared ?: 0,
                progress = progress,
                totalAttempts = progress.sumOf { it.attempts },
                threeStarLevels = progress.count { it.stars >= 3 },
                completedTiers = completedTiers
            )
            val achievements = AchievementUtil.computeAchievements(input)

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
}
