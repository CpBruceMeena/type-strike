package com.typestrike.ui.victory

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.typestrike.audio.SoundManager
import com.typestrike.data.model.PlayerSummary
import com.typestrike.data.repository.PlayerRepository
import com.typestrike.data.repository.SettingsRepository
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
 * UI state for the Victory Assessment screen.
 */
data class VictoryUiState(
    val isLoading: Boolean = true,
    val hasError: Boolean = false,
    val errorMessage: String? = null,
    // Player data
    val playerLevel: Int = 1,
    val playerTitle: String = "RECRUIT",
    val xpBefore: Int = 0,
    val xpAfter: Int = 0,
    val xpForNextLevel: Int = 150,
    val leveledUp: Boolean = false,
    val newLevel: Int = 1,
    // Level data
    val stars: Int = 1,
    val finalWpm: Int = 0,
    val finalAccuracy: Int = 0,
    val xpEarned: Int = 0,
    // Animation phase (0-7)
    val animPhase: Int = 0,
    val animComplete: Boolean = false,
    // Progression
    val levelsCleared: Int = 0,
    val levelsTotal: Int = 100
)

/**
 * ViewModel for the Victory Assessment screen.
 * Loads player data, computes XP, manages animation sequence.
 */
@HiltViewModel
class VictoryViewModel @Inject constructor(
    private val playerRepository: PlayerRepository,
    private val settingsRepository: SettingsRepository,
    private val soundManager: SoundManager
) : ViewModel() {

    companion object {
        private const val PLAYER_ID = 1
    }

    private val _uiState = MutableStateFlow(VictoryUiState())
    val uiState: StateFlow<VictoryUiState> = _uiState.asStateFlow()

    /**
     * Called when the screen appears with the game result.
     * Loads player data, computes XP, persists XP to backend, and manages animation.
     */
    fun loadResult(levelId: Int, wpm: Int, accuracy: Int, stars: Int) {
        viewModelScope.launch {
            _uiState.value = VictoryUiState(isLoading = true, finalWpm = wpm, finalAccuracy = accuracy, stars = stars)

            // Load player summary and settings in parallel
            val summaryDeferred = async { playerRepository.getSummary(PLAYER_ID) }
            val settingsDeferred = async { settingsRepository.getAll(PLAYER_ID) }
            val summaryResult = summaryDeferred.await()
            val settingsResult = settingsDeferred.await()

            // Get sound volume from settings (fire-and-forget read — failure is non-critical)
            val soundVolume = (settingsResult.getOrNull()?.get("sound_volume")?.toFloatOrNull() ?: 0.8f).coerceIn(0f, 1f)
            soundManager.playVictory(soundVolume)

            summaryResult.fold(
                onSuccess = { summary ->
                    val currentLevel = summary.player.level
                    val xpEarned = computeXpEarned(stars, levelId)
                    val newXp = summary.player.xp + xpEarned
                    var leveledUp = false
                    var newLevel = currentLevel
                    var adjustedXp = newXp

                    // Check for level-up
                    var xpNeeded = xpForNextLevel(currentLevel)
                    while (adjustedXp >= xpNeeded) {
                        adjustedXp -= xpNeeded
                        newLevel++
                        leveledUp = true
                        xpNeeded = xpForNextLevel(newLevel)
                    }

                    // Persist XP to backend (fire-and-forget on failure — player still sees it)
                    playerRepository.addXp(PLAYER_ID, xpEarned)

                    _uiState.value = VictoryUiState(
                        isLoading = false,
                        playerLevel = currentLevel,
                        playerTitle = summary.player.title,
                        xpBefore = summary.player.xp,
                        xpAfter = adjustedXp,
                        xpForNextLevel = xpForNextLevel(currentLevel),
                        leveledUp = leveledUp,
                        newLevel = newLevel,
                        stars = stars,
                        finalWpm = wpm,
                        finalAccuracy = accuracy,
                        xpEarned = xpEarned,
                        animPhase = 1,
                        levelsCleared = summary.levelsCleared,
                        levelsTotal = summary.levelsTotal
                    )
                },
                onFailure = { error ->
                    // Fallback: show result without XP data - still play victory sound
                    _uiState.value = VictoryUiState(
                        isLoading = false,
                        hasError = true,
                        errorMessage = error.message ?: "Failed to load data",
                        stars = stars,
                        finalWpm = wpm,
                        finalAccuracy = accuracy,
                        animPhase = 7  // skip to end
                    )
                }
            )
        }
    }

    fun advancePhase() {
        val current = _uiState.value.animPhase
        if (current < 7) {
            _uiState.value = _uiState.value.copy(animPhase = current + 1)
        }
        if (current + 1 >= 7) {
            _uiState.value = _uiState.value.copy(animComplete = true)
        }
    }

    fun skipToEnd() {
        _uiState.value = _uiState.value.copy(animPhase = 7, animComplete = true)
    }

    private fun computeXpEarned(stars: Int, levelId: Int): Int {
        val baseXp = when (stars) {
            3 -> 200
            2 -> 100
            else -> 50
        }
        // Add combo bonus (simplified: 10 XP per star)
        val comboBonus = stars * 10
        return baseXp + comboBonus
    }

    private fun xpForNextLevel(currentLevel: Int): Int = Progression.xpForNextLevel(currentLevel)
}
