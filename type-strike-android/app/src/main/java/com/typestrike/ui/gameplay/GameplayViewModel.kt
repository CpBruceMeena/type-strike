package com.typestrike.ui.gameplay

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
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

// ── Per-Word Result ──────────────────────────────────────

data class WordResult(
    val wordIndex: Int,
    val word: String,
    val typedText: String = "",
    val isComplete: Boolean = false,
    val hadMistake: Boolean = false,
    val correctChars: Int = 0
)

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
    val wordResults: List<WordResult> = emptyList(),
    val totalKeystrokes: Int = 0,
    val correctKeystrokes: Int = 0,
    val combo: Int = 0,
    val maxCombo: Int = 0,
    val gaugeProgress: Float = 0f,  // 0..1
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
 * Manages the full game loop: countdown → typing → combo → scoring → result.
 */
@HiltViewModel
class GameplayViewModel @Inject constructor(
    private val levelRepository: LevelRepository,
    private val playerRepository: PlayerRepository,
    private val settingsRepository: SettingsRepository
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
    private var levelErrorCount = 0  // for star calculation: 3 stars requires 0 mistakes

    fun loadLevel(levelId: Int) {
        viewModelScope.launch {
            _uiState.value = GameplayUiState(gameState = GameState.LOADING, levelId = levelId)

            val (detailResult, settingsResult) = coroutineScope {
                val d = async { levelRepository.getLevelDetail(levelId, PLAYER_ID) }
                val s = async { settingsRepository.getAll(PLAYER_ID) }
                Pair(d.await(), s.await())
            }

            // Determine keyboard type from settings
            val keyboardType = settingsResult.getOrNull()?.get("keyboard_type") ?: "CUSTOM"

            detailResult.fold(
                onSuccess = { detail ->
                    val words = WordBank.generateWords(
                        count = detail.wordCount,
                        minLen = detail.wordMinLength,
                        maxLen = detail.wordMaxLength
                    )

                    val initialResults = words.mapIndexed { index, word ->
                        WordResult(
                            wordIndex = index,
                            word = word
                        )
                    }

                    _uiState.value = GameplayUiState(
                        gameState = GameState.COUNTDOWN,
                        levelId = detail.id,
                        levelName = detail.name,
                        tier = detail.tier,
                        words = words,
                        wordResults = initialResults,
                        combo = 0,
                        countdownValue = 3,
                        useNativeKeyboard = keyboardType == "NATIVE"
                    )
                },
                onFailure = { error ->
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
            // 3... 2... 1... GO!
            _uiState.value = _uiState.value.copy(countdownValue = 3)
            delay(700)
            _uiState.value = _uiState.value.copy(countdownValue = 2)
            delay(700)
            _uiState.value = _uiState.value.copy(countdownValue = 1)
            delay(700)
            _uiState.value = _uiState.value.copy(showGo = true)
            delay(500)

            // Start typing
            _uiState.value = _uiState.value.copy(
                gameState = GameState.TYPING,
                showGo = false
            )
            startTimeMs = System.currentTimeMillis()
            lastInputTimeMs = startTimeMs
            startTimer()
        }
    }

    // ── Typing Input ─────────────────────────────────────

    fun onKeyPress(char: Char) {
        val state = _uiState.value
        if (state.gameState != GameState.TYPING) return
        if (mistakeJob?.isActive == true) return
        if (state.currentWordIndex >= state.words.size) return

        val currentWord = state.words[state.currentWordIndex]
        val newTyped = state.typedText + char
        val expectedChar = currentWord.getOrNull(state.typedText.length)

        if (char == expectedChar) {
            handleCorrectKeystroke(state, newTyped)
        } else {
            handleMistake(state)
        }
    }

    private fun handleCorrectKeystroke(state: GameplayUiState, newTyped: String) {
        val currentWord = state.words[state.currentWordIndex]
        val wordCompleted = newTyped.length >= currentWord.length

        if (wordCompleted) {
            // Word completed successfully
            val correctedChars = newTyped.length
            val newIndex = state.currentWordIndex + 1
            val newCombo = state.combo + 1
            val newMaxCombo = maxOf(newCombo, state.maxCombo)
            val newGauge = computeGauge(newCombo)
            val tier = getActiveTier(newCombo)

            // Update word result
            val updatedResults = state.wordResults.toMutableList()
            updatedResults[state.currentWordIndex] = WordResult(
                wordIndex = state.currentWordIndex,
                word = currentWord,
                typedText = newTyped,
                isComplete = true,
                hadMistake = false,
                correctChars = correctedChars
            )

            // Show kinetic text if combo milestone reached
            val kineticText = if (tier != state.activeComboTier && tier.title.isNotEmpty()) tier.title else null

            val newState = state.copy(
                gameState = if (newIndex >= state.words.size) GameState.COMPLETE else GameState.TYPING,
                currentWordIndex = newIndex,
                typedText = "",
                wordResults = updatedResults,
                totalKeystrokes = state.totalKeystrokes + correctedChars,
                correctKeystrokes = state.correctKeystrokes + correctedChars,
                combo = newCombo,
                maxCombo = newMaxCombo,
                gaugeProgress = newGauge,
                activeComboTier = tier
            )

            updateWpmAndAccuracy(newState)

            if (kineticText != null) {
                showKineticText(kineticText)
            }

            if (newIndex >= state.words.size) {
                finishGame(newState)
            } else {
                _uiState.value = newState
                lastInputTimeMs = System.currentTimeMillis()
                startStallTimer()
            }
        } else {
            // Still typing the word — update typed text and progress
            val updatedResults = state.wordResults.toMutableList()
            updatedResults[state.currentWordIndex] = WordResult(
                wordIndex = state.currentWordIndex,
                word = currentWord,
                typedText = newTyped,
                isComplete = false,
                hadMistake = false,
                correctChars = newTyped.length
            )

            val newState = state.copy(
                gameState = GameState.TYPING,
                typedText = newTyped,
                wordResults = updatedResults,
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

        // Mark current word as having a mistake
        val updatedResults = state.wordResults.toMutableList()
        val currentWordResult = updatedResults[state.currentWordIndex]
        updatedResults[state.currentWordIndex] = currentWordResult.copy(
            hadMistake = true
        )

        val newState = state.copy(
            gameState = GameState.MISTAKE,
            typedText = state.typedText,
            wordResults = updatedResults,
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

        // Load level detail to get pass thresholds
        viewModelScope.launch {
            val result = levelRepository.getLevelDetail(state.levelId, PLAYER_ID)
            result.fold(
                onSuccess = { detail ->
                    val stars = computeStars(finalWpm, accuracy, detail, levelErrorCount)
                    val passed = stars >= 1

                    // Persist level completion to backend
                    levelRepository.completeLevel(
                        playerId = PLAYER_ID,
                        levelId = state.levelId,
                        wpm = finalWpm,
                        accuracy = accuracy,
                        stars = stars,
                        completed = passed
                    )

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

                    // Still try to persist even if detail fetch failed
                    levelRepository.completeLevel(
                        playerId = PLAYER_ID,
                        levelId = state.levelId,
                        wpm = finalWpm,
                        accuracy = accuracy,
                        stars = stars,
                        completed = passed
                    )

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

    fun retry() {
        loadLevel(_uiState.value.levelId)
    }
}
