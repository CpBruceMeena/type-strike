package com.typestrike.ui.levelfailed

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.typestrike.audio.SoundManager
import com.typestrike.data.repository.LevelRepository
import com.typestrike.data.repository.PlayerRepository
import com.typestrike.data.repository.SettingsRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.async
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

/**
 * UI state for the Level Failed overlay screen.
 */
data class LevelFailedUiState(
    val isLoading: Boolean = true,
    val hasError: Boolean = false,
    val errorMessage: String? = null,
    // Player summary info
    val playerLevel: Int = 1,
    val playerTitle: String = "RECRUIT",
    val playerXp: Int = 0,
    val xpForNextLevel: Int = 150,
    val totalStars: Int = 0,
    val levelsCleared: Int = 0,
    // Level result
    val levelId: Int = 1,
    val levelName: String = "",
    val finalWpm: Int = 0,
    val finalAccuracy: Int = 0,
    val passWpm: Int = 40,
    val passAccuracy: Int = 85,
    val partialXp: Int = 0,
    // Animation
    val animPhase: Int = 0,
    val animComplete: Boolean = false
)

/**
 * ViewModel for the Level Failed overlay.
 * Loads player data and level info, computes partial XP for the attempt.
 */
@HiltViewModel
class LevelFailedViewModel @Inject constructor(
    private val playerRepository: PlayerRepository,
    private val levelRepository: LevelRepository,
    private val settingsRepository: SettingsRepository,
    private val soundManager: SoundManager
) : ViewModel() {

    companion object {
        private const val PLAYER_ID = 1
    }

    private val _uiState = MutableStateFlow(LevelFailedUiState())
    val uiState: StateFlow<LevelFailedUiState> = _uiState.asStateFlow()

    fun loadFailedResult(levelId: Int, wpm: Int, accuracy: Int) {
        viewModelScope.launch {
            _uiState.value = LevelFailedUiState(
                isLoading = true,
                levelId = levelId,
                finalWpm = wpm,
                finalAccuracy = accuracy
            )

            // Load player summary, level detail, and settings in parallel
            val summaryDeferred = async { playerRepository.getSummary(PLAYER_ID) }
            val levelDeferred = async { levelRepository.getLevelDetail(levelId, PLAYER_ID) }
            val settingsDeferred = async { settingsRepository.getAll(PLAYER_ID) }
            val summaryResult = summaryDeferred.await()
            val levelResult = levelDeferred.await()
            val settingsResult = settingsDeferred.await()

            // Play failure sound (respecting saved volume)
            val soundVolume = (settingsResult.getOrNull()?.get("sound_volume")?.toFloatOrNull() ?: 0.8f).coerceIn(0f, 1f)
            soundManager.playFailed(soundVolume)

            val summary = summaryResult.getOrNull()
            val level = levelResult.getOrNull()

            val levelName = level?.name ?: "Level $levelId"
            val passWpm = level?.passWpm ?: 40
            val passAccuracy = level?.passAccuracy ?: 85

            // Compute partial XP (consolation for at least trying)
            val partialXp = computePartialXp(wpm, accuracy, passWpm, passAccuracy, levelId)

            // Persist failed attempt to backend (fire-and-forget)
            levelRepository.completeLevel(
                playerId = PLAYER_ID,
                levelId = levelId,
                wpm = wpm,
                accuracy = accuracy.toFloat() / 100f,
                stars = 0,
                completed = false
            )

            // Award partial XP for the attempt
            playerRepository.addXp(PLAYER_ID, partialXp)

            _uiState.value = LevelFailedUiState(
                isLoading = false,
                playerLevel = summary?.player?.level ?: 1,
                playerTitle = summary?.player?.title ?: "RECRUIT",
                playerXp = summary?.player?.xp ?: 0,
                xpForNextLevel = 150,
                totalStars = summary?.player?.totalStars ?: 0,
                levelsCleared = summary?.levelsCleared ?: 0,
                levelId = levelId,
                levelName = levelName,
                finalWpm = wpm,
                finalAccuracy = accuracy,
                passWpm = passWpm,
                passAccuracy = passAccuracy,
                partialXp = partialXp,
                animPhase = 1
            )

            // Auto-advance animation phases
            advanceToPhase(2)
            kotlinx.coroutines.delay(400)
            advanceToPhase(3)
            kotlinx.coroutines.delay(400)
            advanceToPhase(4)
            kotlinx.coroutines.delay(500)
            advanceToPhase(5)
            advanceToPhase(6)
        }
    }

    private fun advanceToPhase(phase: Int) {
        _uiState.value = _uiState.value.copy(animPhase = phase)
        if (phase >= 6) {
            _uiState.value = _uiState.value.copy(animComplete = true)
        }
    }

    fun skipToEnd() {
        _uiState.value = _uiState.value.copy(animPhase = 6, animComplete = true)
    }

    /**
     * Compute partial XP based on how close the attempt was to passing.
     */
    private fun computePartialXp(
        wpm: Int,
        accuracy: Int,
        passWpm: Int,
        passAccuracy: Int,
        levelId: Int
    ): Int {
        val wpmRatio = (wpm.toFloat() / passWpm).coerceIn(0f, 1f)
        val accRatio = (accuracy.toFloat() / passAccuracy).coerceIn(0f, 1f)
        val overall = (wpmRatio * 0.6f + accRatio * 0.4f).coerceIn(0f, 1f)
        // Max partial XP is 25 (vs 50 minimum for 1-star completion)
        return (overall * 25).toInt().coerceAtLeast(1)
    }
}
