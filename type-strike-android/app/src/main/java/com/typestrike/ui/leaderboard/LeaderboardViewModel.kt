package com.typestrike.ui.leaderboard

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.typestrike.data.model.LeaderboardEntry
import com.typestrike.data.model.LeaderboardResponse
import com.typestrike.data.model.PlayerRankResponse
import com.typestrike.data.repository.LeaderboardRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

/**
 * Which leaderboard tab is active.
 */
enum class LeaderboardTab {
    GLOBAL, DAILY
}

/**
 * UI state for the Leaderboard screen.
 */
data class LeaderboardUiState(
    val isLoading: Boolean = true,
    val hasError: Boolean = false,
    val errorMessage: String? = null,
    // Active tab
    val activeTab: LeaderboardTab = LeaderboardTab.GLOBAL,
    // Global leaderboard
    val globalEntries: List<LeaderboardEntry> = emptyList(),
    val globalTotalCount: Int = 0,
    // Daily leaderboard
    val dailyEntries: List<LeaderboardEntry> = emptyList(),
    val dailyTotalCount: Int = 0,
    // Player's rank (fetched after global)
    val playerRank: PlayerRankResponse? = null,
    // Animation
    val entranceStarted: Boolean = false
)

@HiltViewModel
class LeaderboardViewModel @Inject constructor(
    private val leaderboardRepository: LeaderboardRepository
) : ViewModel() {

    companion object {
        private const val PLAYER_ID = 1
    }

    private val _uiState = MutableStateFlow(LeaderboardUiState())
    val uiState: StateFlow<LeaderboardUiState> = _uiState.asStateFlow()

    init {
        loadLeaderboard()
    }

    fun loadLeaderboard() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, hasError = false)

            // Fetch global leaderboard + player rank in parallel
            val globalResult = leaderboardRepository.getGlobalTop(50)
            val dailyResult = leaderboardRepository.getDailyTop(50)
            val rankResult = leaderboardRepository.getPlayerRank(PLAYER_ID)

            if (globalResult.isFailure && dailyResult.isFailure) {
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    hasError = true,
                    errorMessage = "Failed to load leaderboard. Check your connection."
                )
                return@launch
            }

            val globalResponse = globalResult.getOrNull()
            val dailyResponse = dailyResult.getOrNull()
            val playerRank = rankResult.getOrNull()

            _uiState.value = LeaderboardUiState(
                isLoading = false,
                activeTab = _uiState.value.activeTab,
                globalEntries = globalResponse?.entries ?: emptyList(),
                globalTotalCount = globalResponse?.totalCount ?: 0,
                dailyEntries = dailyResponse?.entries ?: emptyList(),
                dailyTotalCount = dailyResponse?.totalCount ?: 0,
                playerRank = playerRank,
                entranceStarted = true
            )
        }
    }

    fun switchTab(tab: LeaderboardTab) {
        _uiState.value = _uiState.value.copy(activeTab = tab)
    }

    fun retry() {
        loadLeaderboard()
    }
}
