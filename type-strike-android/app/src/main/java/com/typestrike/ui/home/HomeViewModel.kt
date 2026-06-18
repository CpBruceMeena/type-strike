package com.typestrike.ui.home

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.typestrike.data.model.PlayerSummary
import com.typestrike.data.repository.PlayerRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

/**
 * UI state for the Home/Dashboard screen.
 */
data class HomeUiState(
    val isLoading: Boolean = true,
    val isFirstTime: Boolean = true,
    val hasError: Boolean = false,
    val errorMessage: String? = null,
    val playerSummary: PlayerSummary? = null,
    val nextLevelId: Int = 1
)

/**
 * ViewModel for the Home/Dashboard screen.
 * Loads player summary from the backend and exposes UI state.
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
        loadPlayerData()
    }

    fun loadPlayerData() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, hasError = false)

            val result = playerRepository.getSummary(PLAYER_ID)
            result.fold(
                onSuccess = { summary ->
                    val nextLevel = summary.levelsCleared + 1
                    _uiState.value = HomeUiState(
                        isLoading = false,
                        isFirstTime = summary.levelsCleared == 0,
                        playerSummary = summary,
                        nextLevelId = nextLevel.coerceIn(1, 100)
                    )
                },
                onFailure = { error ->
                    _uiState.value = HomeUiState(
                        isLoading = false,
                        isFirstTime = true,
                        hasError = true,
                        errorMessage = error.message ?: "Failed to load data"
                    )
                }
            )
        }
    }
}

/**
 * Progression helpers ported from the C# version.
 */
object Progression {
    fun xpForNextLevel(currentLevel: Int): Int {
        return (100.0 * currentLevel * 1.5).toInt()
    }

    fun xpProgress(currentXp: Int, currentLevel: Int): Float {
        val required = xpForNextLevel(currentLevel)
        if (required <= 0) return 1f
        return (currentXp.toFloat() / required).coerceIn(0f, 1f)
    }

    fun getTitleForLevel(level: Int): String = when {
        level >= 90 -> "OBSIDIAN GOD"
        level >= 75 -> "MAGMA LORD"
        level >= 60 -> "FLAME WEAVER"
        level >= 50 -> "INFERNO KNIGHT"
        level >= 40 -> "EMBER SAGE"
        level >= 30 -> "FIRE BRINGER"
        level >= 20 -> "BLAZE RUNNER"
        level >= 10 -> "SPARK GUARDIAN"
        level >= 5 -> "FLAME KINDLER"
        else -> "RECRUIT"
    }
}
