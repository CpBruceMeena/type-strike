package com.typestrike.ui.gameplay

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.typestrike.audio.SoundManager
import com.typestrike.data.model.LevelDetail
import com.typestrike.data.repository.LevelRepository
import com.typestrike.data.repository.PlayerRepository
import com.typestrike.data.repository.SettingsRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.Job
import kotlinx.coroutines.async
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import javax.inject.Inject

// ── Game State Machine ───────────────────────────────────

enum class GameState {
    LOADING,
    COUNTDOWN,
    TYPING,
    STALLED,
    MISTAKE,
    COMPLETE,
    FAILED
}

// ── Combo Tiers (unchanged) ──────────────────────────────

data class ComboTier(
    val minStreak: Int,
    val title: String,
    val color: Long,
    val effect: String
)

val COMBO_TIERS = listOf(
    ComboTier(0, "", 0xFFFF5020, ""),
    ComboTier(5, "IGNITING!", 0xFFFF6600, "Gauge 25%"),
    ComboTier(10, "BURNING!", 0xFFFF5020, "Gauge 50%"),
    ComboTier(15, "CRITICAL COMBO!", 0xFFCC44FF, "Gauge 75%"),
    ComboTier(20, "MAX FRENZY!", 0xFFFF00AA, "Gauge 100% • 1.2x WPM"),
    ComboTier(30, "IGNITION SPEED!", 0xFFFFFFFF, "OVERDRIVE • 2x XP"),
)

// ── Per-Character Error Tracking ─────────────────────────

data class CharResult(
    val charIndex: Int,
    val isCorrect: Boolean = true,
    val isTyped: Boolean = false
)

// ── UI State ─────────────────────────────────────────────

data class GameplayUiState(
    val gameState: GameState = GameState.LOADING,
    val levelId: Int = 1,
    val levelName: String = "",
    val tier: String = "",
    val paragraph: String = "",
    val currentCharIndex: Int = 0,
    val charResults: List<CharResult> = emptyList(),
    val totalKeystrokes: Int = 0,
    val correctKeystrokes: Int = 0,
    val errorCount: Int = 0,
    val combo: Int = 0,
    val maxCombo: Int = 0,
    val gaugeProgress: Float = 0f,
    val activeComboTier: ComboTier = COMBO_TIERS[0],
    val liveWpm: Int = 0,
    val accuracy: Float = 1f,
    val elapsedMs: Long = 0L,
    val hasError: Boolean = false,
    val errorMessage: String? = null,
    val showKineticText: String? = null,
    val starProgress: Int = 0,
    // Countdown
    val countdownValue: Int = 3,
    val showGo: Boolean = false,
    // Keyboard type
    val useNativeKeyboard: Boolean = false,
    // Result data
    val finalWpm: Int = 0,
    val finalAccuracy: Float = 0f,
    val stars: Int = 0,
)

/**
 * ViewModel for the Gameplay Arena.
 * Manages the full paragraph-based game loop:
 * countdown → typing through paragraph char-by-char → combo → scoring → result.
 */
@HiltViewModel
class GameplayViewModel @Inject constructor(
    private val levelRepository: LevelRepository,
    private val playerRepository: PlayerRepository,
    private val settingsRepository: SettingsRepository,
    private val soundManager: SoundManager
) : ViewModel() {

    companion object {
        private const val PLAYER_ID = 1
        private const val STALL_TIMEOUT_MS = 3000L
        private const val MISTAKE_COOLDOWN_MS = 300L
    }

    private val _uiState = MutableStateFlow(GameplayUiState())
    val uiState: StateFlow<GameplayUiState> = _uiState.asStateFlow()

    private var startTimeMs = 0L
    private var lastInputTimeMs = 0L
    private var stallJob: Job? = null
    private var mistakeJob: Job? = null
    private var kineticTextJob: Job? = null
    private var timerJob: Job? = null
    private var mistakeDuringRun = 0

    // Sound settings cached during loadLevel
    private var _soundVolume: Float = 0.8f
    private var _musicVolume: Float = 0.5f
    private var _keyClickType: String = "BLUE"

    fun loadLevel(levelId: Int) {
        viewModelScope.launch {
            _uiState.value = GameplayUiState(gameState = GameState.LOADING, levelId = levelId)

            val (detailResult, settingsResult) = coroutineScope {
                val d = async { levelRepository.getLevelDetail(levelId, PLAYER_ID) }
                val s = async { settingsRepository.getAll(PLAYER_ID) }
                Pair(d.await(), s.await())
            }

            val keyboardType = settingsResult.getOrNull()?.get("keyboard_type") ?: "CUSTOM"
            val soundVolume = (settingsResult.getOrNull()?.get("sound_volume")?.toFloatOrNull() ?: 0.8f).coerceIn(0f, 1f)
            val musicVolume = (settingsResult.getOrNull()?.get("music_volume")?.toFloatOrNull() ?: 0.5f).coerceIn(0f, 1f)
            val keyClickType = settingsResult.getOrNull()?.get("key_click_type") ?: "BLUE"

            detailResult.fold(
                onSuccess = { detail ->
                    val paragraph = detail.paragraph ?: run {
                        // Fallback if paragraph is null (e.g., API returned incomplete data)
                        android.util.Log.w("GameplayVM", "Paragraph was null for level ${detail.id}, using empty string")
                        ""
                    }
                    val charResults = paragraph.mapIndexed { index, _ ->
                        CharResult(charIndex = index)
                    }

                    // Store sound settings for use during gameplay
                    _soundVolume = soundVolume
                    _musicVolume = musicVolume
                    _keyClickType = keyClickType

                    _uiState.value = GameplayUiState(
                        gameState = GameState.COUNTDOWN,
                        levelId = detail.id,
                        levelName = detail.name,
                        tier = detail.tier,
                        paragraph = paragraph,
                        charResults = charResults,
                        combo = 0,
                        countdownValue = 3,
                        useNativeKeyboard = keyboardType == "NATIVE"
                    )
                },
                onFailure = { error ->
                    _soundVolume = soundVolume
                    _musicVolume = musicVolume
                    _keyClickType = keyClickType

                    _uiState.value = GameplayUiState(
                        gameState = GameState.COUNTDOWN,
                        hasError = true,
                        useNativeKeyboard = keyboardType == "NATIVE",
                        errorMessage = error.message ?: "Failed to load level"
                    )
                }
            )
        }
    }

    // ── Countdown ─────────────────────────────────────────

    fun startCountdown() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(countdownValue = 3)
            soundManager.playCountdown(_soundVolume)
            delay(700)
            _uiState.value = _uiState.value.copy(countdownValue = 2)
            soundManager.playCountdown(_soundVolume)
            delay(700)
            _uiState.value = _uiState.value.copy(countdownValue = 1)
            soundManager.playCountdown(_soundVolume)
            delay(700)
            _uiState.value = _uiState.value.copy(showGo = true)
            soundManager.playGo(_soundVolume)
            delay(500)

            // Start background music
            soundManager.startMusic(_musicVolume)

            _uiState.value = _uiState.value.copy(
                gameState = GameState.TYPING,
                showGo = false
            )
            startTimeMs = System.currentTimeMillis()
            lastInputTimeMs = startTimeMs
            startTimer()
        }
    }

    // ── Typing Input (Character-by-Character) ───────────

    fun onKeyPress(char: Char) {
        val state = _uiState.value
        if (state.gameState != GameState.TYPING) return
        if (mistakeJob?.isActive == true) return
        if (state.currentCharIndex >= state.paragraph.length) return

        val expectedChar = state.paragraph[state.currentCharIndex]

        // Play key click (every registered keystroke)
        soundManager.playKeyClick(_keyClickType, _soundVolume)

        // Case-insensitive comparison — keyboard sends lowercase, paragraphs may be mixed-case
        if (char.equals(expectedChar, ignoreCase = true)) {
            handleCorrectChar(state)
        } else {
            handleMistake(state)
        }
    }

    private fun handleCorrectChar(state: GameplayUiState) {
        val newIndex = state.currentCharIndex + 1
        val newCombo = state.combo + 1
        val newMaxCombo = maxOf(newCombo, state.maxCombo)
        val newGauge = computeGauge(newCombo)
        val tier = getActiveTier(newCombo)

        // Play combo milestone sound when tier advances
        val tierChanged = tier != state.activeComboTier && tier.title.isNotEmpty()
        if (tierChanged) {
            soundManager.playComboMilestone(_soundVolume)
        }

        // Update char result
        val updatedResults = state.charResults.toMutableList()
        updatedResults[state.currentCharIndex] = CharResult(
            charIndex = state.currentCharIndex,
            isCorrect = true,
            isTyped = true
        )

        val kineticText = if (tierChanged) tier.title else null

        val isComplete = newIndex >= state.paragraph.length

        val newState = state.copy(
            gameState = if (isComplete) GameState.COMPLETE else GameState.TYPING,
            currentCharIndex = newIndex,
            charResults = updatedResults,
            totalKeystrokes = state.totalKeystrokes + 1,
            correctKeystrokes = state.correctKeystrokes + 1,
            combo = newCombo,
            maxCombo = newMaxCombo,
            gaugeProgress = newGauge,
            activeComboTier = tier
        )

        updateWpmAndAccuracy(newState)

        if (kineticText != null) {
            showKineticText(kineticText)
        }

        if (isComplete) {
            finishGame(newState)
        } else {
            _uiState.value = newState
            lastInputTimeMs = System.currentTimeMillis()
            startStallTimer()
        }
    }

    private fun handleMistake(state: GameplayUiState) {
        mistakeDuringRun++

        // Play error sound
        soundManager.playError(_soundVolume)

        // Mark current char as wrong
        val updatedResults = state.charResults.toMutableList()
        updatedResults[state.currentCharIndex] = CharResult(
            charIndex = state.currentCharIndex,
            isCorrect = false,
            isTyped = true
        )

        val newState = state.copy(
            gameState = GameState.MISTAKE,
            charResults = updatedResults,
            totalKeystrokes = state.totalKeystrokes + 1,
            // Don't advance charIndex — user must type the correct char
        )
        updateWpmAndAccuracy(newState)
        _uiState.value = newState

        // Reset combo on mistake
        _uiState.value = _uiState.value.copy(combo = 0, gaugeProgress = 0f)

        mistakeJob?.cancel()
        mistakeJob = viewModelScope.launch {
            delay(MISTAKE_COOLDOWN_MS)
            _uiState.value = _uiState.value.copy(gameState = GameState.TYPING)
        }
    }

    // ── Stall Detection ──────────────────────────────────

    private fun startStallTimer() {
        stallJob?.cancel()
        stallJob = viewModelScope.launch {
            delay(STALL_TIMEOUT_MS)
            if (_uiState.value.gameState == GameState.TYPING) {
                _uiState.value = _uiState.value.copy(gameState = GameState.STALLED)
            }
        }
    }

    // ── WPM / Accuracy Timer ─────────────────────────────

    private fun updateWpmAndAccuracy(state: GameplayUiState) {
        val elapsed = System.currentTimeMillis() - startTimeMs
        if (elapsed < 1000) return

        val minutes = elapsed.toFloat() / 60000f
        // Standard WPM: (characters / 5) / minutes
        val wordsTyped = state.correctKeystrokes / 5
        val wpm = if (minutes > 0) (wordsTyped / minutes).toInt() else 0
        val accuracy = if (state.totalKeystrokes > 0)
            state.correctKeystrokes.toFloat() / state.totalKeystrokes
        else 1f

        _uiState.value = state.copy(liveWpm = wpm, accuracy = accuracy, elapsedMs = elapsed)
    }

    private fun startTimer() {
        timerJob?.cancel()
        timerJob = viewModelScope.launch {
            while (isActive) {
                delay(1000)
                val state = _uiState.value
                if (state.gameState in listOf(GameState.TYPING, GameState.STALLED)) {
                    updateWpmAndAccuracy(state)
                }
            }
        }
    }

    // ── Finish Game ───────────────────────────────────────

    private fun finishGame(state: GameplayUiState) {
        val elapsed = System.currentTimeMillis() - startTimeMs
        val minutes = elapsed.toFloat() / 60000f
        val wordsTyped = state.correctKeystrokes / 5
        val finalWpm = if (minutes > 0) (wordsTyped / minutes).toInt() else 0
        val accuracy = if (state.totalKeystrokes > 0)
            state.correctKeystrokes.toFloat() / state.totalKeystrokes
        else 0f

        viewModelScope.launch {
            val result = levelRepository.getLevelDetail(state.levelId, PLAYER_ID)
            result.fold(
                onSuccess = { detail ->
                    val stars = computeStars(finalWpm, accuracy, detail, mistakeDuringRun)
                    val passed = stars >= 1

                    levelRepository.completeLevel(
                        playerId = PLAYER_ID,
                        levelId = state.levelId,
                        wpm = finalWpm,
                        accuracy = accuracy,
                        stars = stars,
                        completed = passed
                    )

                    // Stop background music
                    soundManager.stopMusic()

                    _uiState.value = state.copy(
                        gameState = if (passed) GameState.COMPLETE else GameState.FAILED,
                        finalWpm = finalWpm,
                        finalAccuracy = accuracy,
                        stars = stars
                    )
                },
                onFailure = {
                    val stars = if (finalWpm >= 30 && accuracy >= 0.85f) 1 else 0
                    val passed = stars >= 1

                    levelRepository.completeLevel(
                        playerId = PLAYER_ID,
                        levelId = state.levelId,
                        wpm = finalWpm,
                        accuracy = accuracy,
                        stars = stars,
                        completed = passed
                    )

                    // Stop background music
                    soundManager.stopMusic()

                    _uiState.value = state.copy(
                        gameState = if (passed) GameState.COMPLETE else GameState.FAILED,
                        finalWpm = finalWpm,
                        finalAccuracy = accuracy,
                        stars = stars
                    )
                }
            )
        }
    }

    // ── Star Calculation (unchanged logic) ────────────────

    private fun computeStars(
        wpm: Int,
        accuracy: Float,
        detail: LevelDetail,
        errorCount: Int
    ): Int {
        val passWpm = detail.passWpm
        val passAcc = detail.passAccuracy.toFloat() / 100f

        val meetsPass = wpm >= passWpm && accuracy >= passAcc
        if (!meetsPass) return 0

        val meets2Star = wpm >= (passWpm * 1.15).toInt() && accuracy >= 0.95f
        val meets3Star = wpm >= (passWpm * 1.30).toInt() && accuracy >= 0.98f && errorCount == 0

        return when {
            meets3Star -> 3
            meets2Star -> 2
            else -> 1
        }
    }

    // ── Combo / Gauge (unchanged) ─────────────────────────

    private fun computeGauge(combo: Int): Float {
        return (combo.toFloat() / 30f).coerceIn(0f, 1f)
    }

    private fun getActiveTier(combo: Int): ComboTier {
        return COMBO_TIERS.lastOrNull { combo >= it.minStreak } ?: COMBO_TIERS[0]
    }

    private fun showKineticText(text: String) {
        kineticTextJob?.cancel()
        _uiState.value = _uiState.value.copy(showKineticText = text)
        kineticTextJob = viewModelScope.launch {
            delay(1800)
            _uiState.value = _uiState.value.copy(showKineticText = null)
        }
    }

    // ── Backspace ──────────────────────────────────────────

    fun onBackspace() {
        val state = _uiState.value
        if (state.gameState !in listOf(GameState.TYPING, GameState.MISTAKE)) return
        if (state.currentCharIndex <= 0) return

        val prevIdx = state.currentCharIndex - 1
        val prevResult = state.charResults.getOrNull(prevIdx) ?: return

        // Only backspace if the character was actually typed
        if (!prevResult.isTyped) return

        val updatedResults = state.charResults.toMutableList()
        updatedResults[prevIdx] = CharResult(charIndex = prevIdx, isCorrect = true, isTyped = false)

        // Adjust counters
        val newTotal = state.totalKeystrokes - 1
        val newCorrect = if (prevResult.isCorrect) state.correctKeystrokes - 1 else state.correctKeystrokes
        val newErrors = if (!prevResult.isCorrect) state.errorCount - 1 else state.errorCount

        if (!prevResult.isCorrect) {
            mistakeDuringRun = (mistakeDuringRun - 1).coerceAtLeast(0)
        }

        _uiState.value = state.copy(
            currentCharIndex = prevIdx,
            charResults = updatedResults,
            totalKeystrokes = newTotal.coerceAtLeast(0),
            correctKeystrokes = newCorrect.coerceAtLeast(0),
            errorCount = newErrors.coerceAtLeast(0),
            combo = 0,
            gaugeProgress = 0f,
            gameState = GameState.TYPING
        )

        // Cancel mistake cooldown so user can type immediately
        mistakeJob?.cancel()
        stallJob?.cancel()
    }

    override fun onCleared() {
        super.onCleared()
        soundManager.stopMusic()
    }

    // ── Actions ───────────────────────────────────────────

    fun retry() {
        mistakeDuringRun = 0
        loadLevel(_uiState.value.levelId)
    }
}
