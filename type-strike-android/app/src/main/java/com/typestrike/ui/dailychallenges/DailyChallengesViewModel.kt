package com.typestrike.ui.dailychallenges

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.typestrike.data.model.DailyChallenge
import com.typestrike.data.repository.DailyChallengeRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

/**
 * UI state for the Daily Challenges screen.
 */
data class DailyChallengesUiState(
    val isLoading: Boolean = true,
    val hasError: Boolean = false,
    val errorMessage: String? = null,
    val challenges: List<DailyChallenge> = emptyList(),
    val challengeDate: String = "",
    val totalCompleted: Int = 0,
    val totalRewardXp: Int = 0,
    val totalRewardStars: Int = 0,
    val entranceStarted: Boolean = false,
    // Streak bonus
    val streakCount: Int = 0,
    val streakMultiplier: Double = 1.0,
    // Track which challenge's gameplay just completed (to show reward animation)
    val lastCompletedChallengeId: Int? = null,
    val lastRewardXp: Int = 0,
    val lastRewardStars: Int = 0,
    val showRewardAnimation: Boolean = false
)

@HiltViewModel
class DailyChallengesViewModel @Inject constructor(
    private val dailyChallengeRepository: DailyChallengeRepository
) : ViewModel() {

    companion object {
        private const val PLAYER_ID = 1
    }

    private val _uiState = MutableStateFlow(DailyChallengesUiState())
    val uiState: StateFlow<DailyChallengesUiState> = _uiState.asStateFlow()

    init {
        loadChallenges()
    }

    fun loadChallenges() {
        viewModelScope.launch {
            _uiState.value = DailyChallengesUiState(isLoading = true)

            val result = dailyChallengeRepository.getChallenges(PLAYER_ID)
            result.fold(
                onSuccess = { response ->
                    val challenges = response.challenges
                    _uiState.value = DailyChallengesUiState(
                        isLoading = false,
                        challenges = challenges,
                        challengeDate = response.date,
                        totalCompleted = challenges.count { it.completed },
                        totalRewardXp = challenges.filter { it.completed }.sumOf { it.rewardXp },
                        totalRewardStars = challenges.filter { it.completed }.sumOf { it.rewardStars },
                        streakCount = response.streakCount,
                        streakMultiplier = response.streakMultiplier,
                        entranceStarted = true
                    )
                },
                onFailure = { error ->
                    _uiState.value = DailyChallengesUiState(
                        isLoading = false,
                        hasError = true,
                        errorMessage = error.message ?: "Failed to load daily challenges"
                    )
                }
            )
        }
    }

    /**
     * Starts the entrance animation.
     */
    fun startEntrance() {
        _uiState.value = _uiState.value.copy(entranceStarted = true)
    }

    /**
     * Returns the first incomplete challenge (for auto-navigation), or null if all done.
     */
    fun getFirstIncompleteChallenge(): DailyChallenge? {
        return _uiState.value.challenges.firstOrNull { !it.completed }
    }

    /**
     * Called after a challenge gameplay completes to submit the result.
     */
    fun submitChallengeResult(challengeId: Int, wpm: Int, accuracy: Double) {
        viewModelScope.launch {
            val result = dailyChallengeRepository.submitResult(PLAYER_ID, challengeId, wpm, accuracy)
            result.fold(
                onSuccess = { response ->
                    // Update the specific challenge in the list
                    val updated = _uiState.value.challenges.map {
                        if (it.id == challengeId) response.challenge else it
                    }
                    val justCompleted = response.justCompleted
                    _uiState.value = _uiState.value.copy(
                        challenges = updated,
                        totalCompleted = updated.count { it.completed },
                        totalRewardXp = updated.filter { it.completed }.sumOf { it.rewardXp },
                        totalRewardStars = updated.filter { it.completed }.sumOf { it.rewardStars },
                        streakCount = response.streakCount,
                        streakMultiplier = response.streakMultiplier,
                        lastCompletedChallengeId = if (justCompleted) challengeId else null,
                        lastRewardXp = if (justCompleted) response.rewardXp else 0,
                        lastRewardStars = if (justCompleted) response.rewardStars else 0,
                        showRewardAnimation = justCompleted
                    )
                },
                onFailure = { error ->
                    _uiState.value = _uiState.value.copy(
                        errorMessage = error.message ?: "Failed to submit result",
                        hasError = true
                    )
                }
            )
        }
    }

    fun dismissReward() {
        _uiState.value = _uiState.value.copy(showRewardAnimation = false)
    }

    fun retry() {
        loadChallenges()
    }
}
