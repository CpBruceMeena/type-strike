package com.typestrike.ui.gameplay

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.typestrike.data.model.LevelDetail
import com.typestrike.data.repository.LevelRepository
import com.typestrike.data.repository.PlayerRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.Job
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
    READY,
    TYPING,
    STALLED,
    MISTAKE,
    COMPLETE,
    FAILED
}

// ── Combo Tiers ──────────────────────────────────────────

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

// ── UI State ─────────────────────────────────────────────

data class GameplayUiState(
    val gameState: GameState = GameState.LOADING,
    val levelId: Int = 1,
    val levelName: String = "",
    val tier: String = "",
    val words: List<String> = emptyList(),
    val currentWordIndex: Int = 0,
    val typedText: String = "",
    val wordProgress: List<Boolean> = emptyList(),  // true=correct, false=incorrect
    val totalKeystrokes: Int = 0,
    val correctKeystrokes: Int = 0,
    val combo: Int = 0,
    val maxCombo: Int = 0,
    val gaugeProgress: Float = 0f,  // 0..1
    val activeComboTier: ComboTier = COMBO_TIERS[0],
    val liveWpm: Int = 0,
    val accuracy: Float = 1f,
    val elapsedMs: Long = 0L,
    val isReady: Boolean = false,
    val hasError: Boolean = false,
    val errorMessage: String? = null,
    val showKineticText: String? = null,
    val starProgress: Int = 0,
    // Result data
    val finalWpm: Int = 0,
    val finalAccuracy: Float = 0f,
    val stars: Int = 0,
)

/**
 * ViewModel for the Gameplay Arena.
 * Manages the full game loop: word queue, typing, combo, scoring, state transitions.
 */
@HiltViewModel
class GameplayViewModel @Inject constructor(
    private val levelRepository: LevelRepository,
    private val playerRepository: PlayerRepository
) : ViewModel() {

    companion object {
        private const val PLAYER_ID = 1
        private const val STALL_TIMEOUT_MS = 3000L
        private const val MISTAKE_COOLDOWN_MS = 300L
        private const val WPM_SAMPLE_WINDOW_MS = 5000L
    }

    private val _uiState = MutableStateFlow(GameplayUiState())
    val uiState: StateFlow<GameplayUiState> = _uiState.asStateFlow()

    private var startTimeMs = 0L
    private var lastInputTimeMs = 0L
    private var stallJob: Job? = null
    private var mistakeJob: Job? = null
    private var kineticTextJob: Job? = null
    private var timerJob: Job? = null
    private var levelErrorCount = 0  // for star calculation: 3 stars requires 0 mistakes + combo break

    fun loadLevel(levelId: Int) {
        viewModelScope.launch {
            _uiState.value = GameplayUiState(gameState = GameState.LOADING, levelId = levelId)

            val result = levelRepository.getLevelDetail(levelId, PLAYER_ID)
            result.fold(
                onSuccess = { detail ->
                    val words = WordBank.generateWords(
                        count = detail.wordCount,
                        minLen = detail.wordMinLength,
                        maxLen = detail.wordMaxLength
                    )
                    _uiState.value = GameplayUiState(
                        gameState = GameState.READY,
                        levelId = detail.id,
                        levelName = detail.name,
                        tier = detail.tier,
                        words = words,
                        wordProgress = List(detail.wordCount) { true },
                        gaugeProgress = 0f,
                        combo = 0,
                        isReady = true
                    )
                    startTimeMs = System.currentTimeMillis()
                    lastInputTimeMs = startTimeMs
                },
                onFailure = { error ->
                    _uiState.value = GameplayUiState(
                        gameState = GameState.READY,
                        hasError = true,
                        errorMessage = error.message ?: "Failed to load level"
                    )
                }
            )
        }
    }

    // ── Typing Input ─────────────────────────────────────

    fun onKeyPress(char: Char) {
        val state = _uiState.value
        if (state.gameState !in listOf(GameState.READY, GameState.TYPING, GameState.STALLED)) return
        if (mistakeJob?.isActive == true) return
        if (state.currentWordIndex >= state.words.size) return

        val currentWord = state.words[state.currentWordIndex]
        val newTyped = state.typedText + char
        val expectedChar = currentWord.getOrNull(state.typedText.length)

        if (char == expectedChar) {
            // Correct keystroke
            handleCorrectKeystroke(state, newTyped)
        } else {
            // Incorrect keystroke
            handleMistake(state)
        }
    }

    private fun handleCorrectKeystroke(state: GameplayUiState, newTyped: String) {
        val currentWord = state.words[state.currentWordIndex]
        val wordCompleted = newTyped.length >= currentWord.length

        if (wordCompleted) {
            // Word completed successfully
            val newIndex = state.currentWordIndex + 1
            val newCombo = state.combo + 1
            val newMaxCombo = maxOf(newCombo, state.maxCombo)
            val newGauge = computeGauge(newCombo)
            val tier = getActiveTier(newCombo)
            val newProgress = state.wordProgress.toMutableList().apply { this[state.currentWordIndex] = true }

            // Show kinetic text if combo milestone reached
            val kineticText = if (tier != state.activeComboTier && tier.title.isNotEmpty()) tier.title else null

            val newState = state.copy(
                gameState = if (newIndex >= state.words.size) GameState.COMPLETE else GameState.TYPING,
                currentWordIndex = newIndex,
                typedText = "",
                totalKeystrokes = state.totalKeystrokes + currentWord.length,
                correctKeystrokes = state.correctKeystrokes + currentWord.length,
                combo = newCombo,
                maxCombo = newMaxCombo,
                gaugeProgress = newGauge,
                activeComboTier = tier,
                wordProgress = newProgress
            )

            updateWpmAndAccuracy(newState)

            if (kineticText != null) {
                showKineticText(kineticText)
            }

            // Check if all words done
            if (newIndex >= state.words.size) {
                finishGame(newState)
            } else {
                _uiState.value = newState
                lastInputTimeMs = System.currentTimeMillis()
                startStallTimer()
            }
        } else {
            // Still typing the word
            val newState = state.copy(
                gameState = GameState.TYPING,
                typedText = newTyped,
                totalKeystrokes = state.totalKeystrokes + 1,
                correctKeystrokes = state.correctKeystrokes + 1
            )
            updateWpmAndAccuracy(newState)
            _uiState.value = newState
            lastInputTimeMs = System.currentTimeMillis()
            startStallTimer()
        }
    }

    private fun handleMistake(state: GameplayUiState) {
        levelErrorCount++

        val newState = state.copy(
            gameState = GameState.MISTAKE,
            totalKeystrokes = state.totalKeystrokes + 1
        )
        updateWpmAndAccuracy(newState)
        _uiState.value = newState

        // Cooldown then return to typing
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
        val wordsTyped = state.correctKeystrokes / 5  // standard: 5 chars = 1 word
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
                if (state.gameState in listOf(GameState.TYPING, GameState.READY, GameState.STALLED)) {
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

        // Load level detail to get pass thresholds
        viewModelScope.launch {
            val result = levelRepository.getLevelDetail(state.levelId, PLAYER_ID)
            result.fold(
                onSuccess = { detail ->
                    val stars = computeStars(finalWpm, accuracy, detail, levelErrorCount)
                    val passed = stars >= 1

                    _uiState.value = state.copy(
                        gameState = if (passed) GameState.COMPLETE else GameState.FAILED,
                        finalWpm = finalWpm,
                        finalAccuracy = accuracy,
                        stars = stars
                    )
                },
                onFailure = {
                    // Fallback: compute stars without detail
                    val stars = if (finalWpm >= 30 && accuracy >= 0.85f) 1 else 0
                    _uiState.value = state.copy(
                        gameState = if (stars >= 1) GameState.COMPLETE else GameState.FAILED,
                        finalWpm = finalWpm,
                        finalAccuracy = accuracy,
                        stars = stars
                    )
                }
            )
        }
    }

    // ── Star Calculation ──────────────────────────────────

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

    // ── Combo / Gauge ─────────────────────────────────────

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

    // ── Actions ───────────────────────────────────────────

    fun startTyping() {
        if (_uiState.value.gameState == GameState.READY) {
            _uiState.value = _uiState.value.copy(gameState = GameState.TYPING)
            startTimeMs = System.currentTimeMillis()
            lastInputTimeMs = startTimeMs
            startTimer()
        }
    }

    fun retry() {
        loadLevel(_uiState.value.levelId)
    }
}
