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
import kotlin.math.ceil
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

        /**
         * Applies the streak multiplier to base XP (truncated, matching backend).
         */
        private fun boostedXp(baseXp: Int, multiplier: Double): Int =
            (baseXp * multiplier).toInt()

        /**
         * Applies the streak multiplier to base stars (ceil, matching backend).
         */
        private fun boostedStars(baseStars: Int, multiplier: Double): Int =
            ceil(baseStars * multiplier).toInt()

        /**
         * Computes the total boosted rewards across all completed challenges.
         */
        private fun totalBoostedXp(completed: List<DailyChallenge>, multiplier: Double): Int =
            completed.sumOf { boostedXp(it.rewardXp, multiplier) }

        private fun totalBoostedStars(completed: List<DailyChallenge>, multiplier: Double): Int =
            completed.sumOf { boostedStars(it.rewardStars, multiplier) }
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
                    val completed = challenges.filter { it.completed }
                    val multiplier = response.streakMultiplier
                    _uiState.value = DailyChallengesUiState(
                        isLoading = false,
                        challenges = challenges,
                        challengeDate = response.date,
                        totalCompleted = completed.size,
                        totalRewardXp = totalBoostedXp(completed, multiplier),
                        totalRewardStars = totalBoostedStars(completed, multiplier),
                        streakCount = response.streakCount,
                        streakMultiplier = multiplier,
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
                    val multiplier = response.streakMultiplier
                    val completed = updated.filter { it.completed }
                    val boostedXpTotal = totalBoostedXp(completed, multiplier)
                    val boostedStarsTotal = totalBoostedStars(completed, multiplier)
                    _uiState.value = _uiState.value.copy(
                        challenges = updated,
                        totalCompleted = completed.size,
                        totalRewardXp = boostedXpTotal,
                        totalRewardStars = boostedStarsTotal,
                        streakCount = response.streakCount,
                        streakMultiplier = multiplier,
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
