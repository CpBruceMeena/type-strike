package com.typestrike.ui.home

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.typestrike.data.repository.LevelRepository
import com.typestrike.data.repository.PlayerRepository
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
 * UI state for the Home / Dashboard screen.
 * New-user friendly: gracefully handles the case where no player exists yet.
 */
data class HomeUiState(
    val isLoading: Boolean = true,
    val hasPlayer: Boolean = false,
    val hasError: Boolean = false,
    val errorMessage: String? = null,
    // Player data (only populated when hasPlayer is true)
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
    // Tiers for the progression preview
    val tiers: List<TierPreview> = TIER_PREVIEWS,
    // Animation
    val entranceStarted: Boolean = false
)

/** Preview data for a tier shown on the home page. */
data class TierPreview(
    val name: String,
    val icon: String,
    val color: Long,
    val levelRange: String,
    val description: String
)

private val TIER_PREVIEWS = listOf(
    TierPreview("Ember", "🔥", 0xFFFF5020, "Levels 1–25", "Short, simple sentences — build your rhythm"),
    TierPreview("Igneous", "🌋", 0xFFFFAA44, "Levels 26–50", "Medium length, capital letters, some numbers"),
    TierPreview("Magma Core", "⚡", 0xFFCC44FF, "Levels 51–75", "Complex text, special chars, mixed case"),
    TierPreview("Obsidian", "🖤", 0xFF8866DD, "Levels 76–100", "Code-like syntax, edge case characters"),
)

/**
 * ViewModel for the Home/Dashboard screen.
 * Designed for new users: shows a welcoming hub with level progression preview.
 */
@HiltViewModel
class HomeViewModel @Inject constructor(
    private val playerRepository: PlayerRepository
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

            val result = playerRepository.getSummary(PLAYER_ID)
            result.fold(
                onSuccess = { summary ->
                    val player = summary.player
                    val currentLevel = player.level
                    val xpForNext = Progression.xpForNextLevel(currentLevel)
                    val xpProgress = Progression.xpProgress(player.xp, currentLevel)

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
                        nextLevelId = (summary.levelsCleared + 1).coerceIn(1, 100),
                        entranceStarted = false
                    )
                },
                onFailure = { error ->
                    // New user — no player exists yet. This is NOT an error.
                    // Show the welcoming home page with progression preview.
                    _uiState.value = HomeUiState(
                        isLoading = false,
                        hasPlayer = false,
                        hasError = false,
                        nextLevelId = 1,
                        entranceStarted = false
                    )
                }
            )
        }
    }

    fun startEntrance() {
        _uiState.value = _uiState.value.copy(entranceStarted = true)
    }

    fun retry() {
        loadDashboard()
    }

    /**
     * Dynamic sub-label for the JUMP IN button based on player state.
     */
    fun jumpInLabel(): String = when {
        !_uiState.value.hasPlayer -> "Start your journey — Level 1"
        _uiState.value.levelsCleared == 0 -> "Start with Level 1"
        _uiState.value.levelsCleared >= _uiState.value.levelsTotal -> "Practice mode — no limits!"
        else -> "Continue at Level ${_uiState.value.nextLevelId}"
    }

    fun getNextLevelId(): Int = _uiState.value.nextLevelId
}
