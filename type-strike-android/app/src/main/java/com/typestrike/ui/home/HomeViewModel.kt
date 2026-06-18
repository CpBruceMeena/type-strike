package com.typestrike.ui.home

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.typestrike.data.repository.PlayerRepository
import com.typestrike.ui.util.Progression
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

/**
 * UI state for the Home / Dashboard screen.
 * Shows player identity, quick stats, and navigation to game modes.
 */
data class HomeUiState(
    val isLoading: Boolean = true,
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
    // Animation
    val entranceStarted: Boolean = false
)

/**
 * ViewModel for the Home/Dashboard screen.
 * Loads player summary and exposes state for UI components.
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
        loadSummary()
    }

    private fun loadSummary() {
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
                        playerLevel = currentLevel,
                        playerTitle = player.title.ifBlank { "RECRUIT" },
                        totalStars = player.totalStars,
                        xp = player.xp,
                        xpForNext = xpForNext,
                        xpProgress = xpProgress,
                        todaysBestWpm = summary.todaysBestWpm,
                        levelsCleared = summary.levelsCleared,
                        levelsTotal = summary.levelsTotal,
                        entranceStarted = false
                    )
                },
                onFailure = { error ->
                    _uiState.value = HomeUiState(
                        isLoading = false,
                        hasError = true,
                        errorMessage = error.message ?: "Failed to load data",
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
        loadSummary()
    }

    /**
     * Dynamic sub-label for the JUMP IN button based on player state.
     */
    fun jumpInLabel(): String = when {
        _uiState.value.levelsCleared == 0 -> "Begin your journey"
        _uiState.value.levelsCleared >= _uiState.value.levelsTotal -> "Practice mode — no limits!"
        else -> "Continue where you left off"
    }
}
