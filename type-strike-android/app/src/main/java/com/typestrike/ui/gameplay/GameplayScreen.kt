package com.typestrike.ui.gameplay

import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.focus.onFocusChanged
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.TextFieldValue
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.typestrike.ui.effects.*
import com.typestrike.ui.theme.*
import com.typestrike.ui.util.HapticUtil
import kotlinx.coroutines.delay

val QWERTY_ROWS = listOf(
    listOf('Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'),
    listOf('A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'),
    listOf('Z', 'X', 'C', 'V', 'B', 'N', 'M')
)

private val CORRECT_GREEN = Color(0xFF22DD44)
private val ERROR_RED = Color(0xFFFF3300)

// ── Main Gameplay Screen ─────────────────────────────────

@Composable
fun GameplayScreen(
    levelId: Int,
    onLevelComplete: (levelId: Int, wpm: Int, accuracy: Int, stars: Int) -> Unit = { _, _, _, _ -> },
    onLevelFailed: (levelId: Int, wpm: Int, accuracy: Int) -> Unit = { _, _, _ -> },
    onBack: () -> Unit = {},
    viewModel: GameplayViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()

    LaunchedEffect(levelId) {
        viewModel.loadLevel(levelId)
    }

    // Navigate on game end
    LaunchedEffect(uiState.gameState) {
        when (uiState.gameState) {
            GameState.COMPLETE -> {
                delay(800)
                onLevelComplete(
                    uiState.levelId,
                    uiState.finalWpm,
                    (uiState.finalAccuracy * 100).toInt(),
                    uiState.stars
                )
            }
            GameState.FAILED -> {
                delay(800)
                onLevelFailed(
                    uiState.levelId,
                    uiState.finalWpm,
                    (uiState.finalAccuracy * 100).toInt()
                )
            }
            else -> {}
        }
    }

    val view = LocalView.current

    // ── Haptic: word complete ──────────────────────────
    LaunchedEffect(uiState.currentWordIndex) {
        if (uiState.currentWordIndex > 0 && uiState.gameState == GameState.TYPING) {
            HapticUtil.wordComplete(view)
        }
    }

    // ── Haptic: error ─────────────────────────────────
    LaunchedEffect(uiState.gameState) {
        if (uiState.gameState == GameState.MISTAKE) {
            HapticUtil.keyError(view)
        }
    }

    // ── Haptic: combo milestone ───────────────────────
    LaunchedEffect(uiState.showKineticText) {
        if (uiState.showKineticText != null) {
            HapticUtil.comboMilestone(view)
        }
    }

    val particleConfig = remember {
        ParticleConfig.fromQuality(ParticleConfig.detect())
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Background)
            .systemBarsPadding()
    ) {
        // Particle background
        MapParticleField(
            config = particleConfig,
            modifier = Modifier.fillMaxSize()
        )

        when (uiState.gameState) {
            GameState.LOADING -> GameplayLoading()
            GameState.COUNTDOWN -> CountdownOverlay(
                countdownValue = uiState.countdownValue,
                showGo = uiState.showGo,
                onStart = { viewModel.startCountdown() }
            )
            else -> {
                Column(modifier = Modifier.fillMaxSize()) {
                    // Arena Header
                    ArenaHeader(
                        levelName = uiState.levelName,
                        wordIndex = uiState.currentWordIndex,
                        wordCount = uiState.words.size,
                        onBack = onBack
                    )

                    // Combined words panel (scrollable, all words visible)
                    Box(modifier = Modifier.weight(1f)) {
                        AllWordsPanel(
                            words = uiState.words,
                            wordResults = uiState.wordResults,
                            currentWordIndex = uiState.currentWordIndex,
                            typedText = uiState.typedText,
                            gameState = uiState.gameState,
                            modifier = Modifier.fillMaxSize()
                        )

                        // Kinetic text overlay
                        KineticTextOverlay(
                            text = uiState.showKineticText,
                            modifier = Modifier.align(Alignment.Center)
                        )
                    }

                    // Native keyboard hidden input (when enabled)
                    if (uiState.useNativeKeyboard && uiState.gameState == GameState.TYPING) {
                        NativeKeyboardInput(
                            onKeyPress = { viewModel.onKeyPress(it) },
                            modifier = Modifier.height(0.dp)
                        )
                    }

                    // Combo Gauge + Stats Row
                    ComboAndStatsRow(
                        combo = uiState.combo,
                        gaugeProgress = uiState.gaugeProgress,
                        activeTier = uiState.activeComboTier,
                        liveWpm = uiState.liveWpm,
                        accuracy = uiState.accuracy,
                        maxCombo = uiState.maxCombo,
                        modifier = Modifier.height(48.dp)
                    )

                    // Custom Keyboard (only when native keyboard is NOT enabled)
                    if (!uiState.useNativeKeyboard) {
                        CustomKeyboard(
                            onKeyPress = { viewModel.onKeyPress(it) },
                            modifier = Modifier.height(200.dp)
                        )
                    }
                }
            }
        }

        // Mistake flash overlay
        if (uiState.gameState == GameState.MISTAKE) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(ERROR_RED.copy(alpha = 0.08f))
            )
        }

        // Stalled overlay
        if (uiState.gameState == GameState.STALLED) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(ScrimBlack.copy(alpha = 0.3f)),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = "Keep typing…",
                    style = MaterialTheme.typography.headlineSmall,
                    color = TextBody.copy(alpha = 0.5f)
                )
            }
        }
    }
}

// ── Countdown Overlay ────────────────────────────────────

@Composable
private fun CountdownOverlay(
    countdownValue: Int,
    showGo: Boolean,
    onStart: () -> Unit
) {
    var started by remember { mutableStateOf(false) }

    Box(
        modifier = Modifier.fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            if (showGo) {
                // GO!
                val goScale by animateFloatAsState(
                    targetValue = 1f,
                    animationSpec = spring(dampingRatio = 0.4f, stiffness = 200f),
                    label = "goScale"
                )
                Text(
                    text = "GO!",
                    style = MaterialTheme.typography.displayLarge,
                    fontWeight = FontWeight.Bold,
                    color = MagmaRed,
                    letterSpacing = 8.sp,
                    modifier = Modifier
                        .scale(goScale)
                        .shadow(24.dp, RoundedCornerShape(0.dp), ambientColor = MagmaRed, spotColor = MagmaRed)
                        .padding(32.dp)
                )
            } else if (started) {
                // Countdown number
                val countScale by animateFloatAsState(
                    targetValue = 1f,
                    animationSpec = spring(dampingRatio = 0.5f, stiffness = 300f),
                    label = "countScale"
                )
                Text(
                    text = "$countdownValue",
                    style = MaterialTheme.typography.displayLarge,
                    fontSize = 96.sp,
                    fontWeight = FontWeight.Bold,
                    color = TextWhite,
                    modifier = Modifier
                        .scale(countScale)
                        .shadow(16.dp, RoundedCornerShape(0.dp), spotColor = MagmaRed.copy(alpha = 0.5f))
                )
            } else {
                // START button
                val infiniteTransition = rememberInfiniteTransition(label = "startGlow")
                val glowAlpha by infiniteTransition.animateFloat(
                    initialValue = 0.3f,
                    targetValue = 0.6f,
                    animationSpec = infiniteRepeatable(
                        animation = tween(2000, easing = FastOutSlowInEasing),
                        repeatMode = RepeatMode.Reverse
                    ),
                    label = "startGlowAlpha"
                )

                Box(modifier = Modifier.padding(horizontal = 32.dp)) {
                    // Glow
                    Box(
                        modifier = Modifier
                            .matchParentSize()
                            .padding(12.dp)
                            .clip(RoundedCornerShape(24.dp))
                            .alpha(glowAlpha)
                            .background(MagmaRed)
                    )
                    // Button
                    Button(
                        onClick = {
                            started = true
                            onStart()
                        },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(72.dp),
                        shape = RoundedCornerShape(24.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = MagmaRed),
                        elevation = ButtonDefaults.buttonElevation(defaultElevation = 12.dp)
                    ) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Text(
                                text = "🔥  START  🔥",
                                style = MaterialTheme.typography.headlineSmall,
                                color = TextWhite,
                                fontWeight = FontWeight.Bold,
                                letterSpacing = 4.sp
                            )
                            Text(
                                text = "Type with fury. Strike with fire.",
                                style = MaterialTheme.typography.labelSmall,
                                color = TextWhite.copy(alpha = 0.6f),
                                letterSpacing = 1.sp
                            )
                        }
                    }
                }
            }
        }
    }
}

// ── Arena Header ─────────────────────────────────────────

@Composable
private fun ArenaHeader(
    levelName: String,
    wordIndex: Int,
    wordCount: Int,
    onBack: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .height(48.dp)
            .padding(horizontal = 8.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        TextButton(onClick = onBack, modifier = Modifier.size(48.dp)) {
            Text("←", color = TextBody, fontSize = 22.sp)
        }
        Spacer(modifier = Modifier.width(4.dp))
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = levelName.uppercase(),
                style = MaterialTheme.typography.labelMedium,
                color = TextWhite,
                fontWeight = FontWeight.Bold,
                maxLines = 1
            )
            Text(
                text = "$wordIndex / $wordCount words",
                style = MaterialTheme.typography.labelSmall,
                color = TextMuted
            )
        }
    }
}

// ── All Words Panel ──────────────────────────────────────

@Composable
private fun AllWordsPanel(
    words: List<String>,
    wordResults: List<WordResult>,
    currentWordIndex: Int,
    typedText: String,
    gameState: GameState,
    modifier: Modifier = Modifier
) {
    val scrollState = rememberScrollState()

    // Auto-scroll to current word
    LaunchedEffect(currentWordIndex) {
        // Small delay to let layout settle, then scroll to current word
        delay(50)
        // The scroll will go to roughly the position of the current word
        val targetScroll = (currentWordIndex * 60).coerceAtMost(
            scrollState.maxValue
        )
        scrollState.animateScrollTo(targetScroll, tween(300))
    }

    Box(
        modifier = modifier
            .fillMaxWidth()
            .padding(horizontal = 12.dp, vertical = 4.dp)
            .clip(RoundedCornerShape(12.dp))
            .background(SurfaceDark.copy(alpha = 0.5f))
            .border(1.dp, SurfaceBorder.copy(alpha = 0.2f), RoundedCornerShape(12.dp))
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(scrollState)
                .padding(16.dp)
        ) {
            words.forEachIndexed { index, word ->
                val isCurrent = index == currentWordIndex
                val isCompleted = index < currentWordIndex
                val wordResult = wordResults.getOrNull(index)

                WordRow(
                    word = word,
                    wordResult = wordResult,
                    isCurrent = isCurrent,
                    isCompleted = isCompleted,
                    typedText = if (isCurrent) typedText else "",
                    hasError = gameState == GameState.MISTAKE && isCurrent
                )
                Spacer(modifier = Modifier.height(6.dp))
            }
        }
    }
}

@Composable
private fun WordRow(
    word: String,
    wordResult: WordResult?,
    isCurrent: Boolean,
    isCompleted: Boolean,
    typedText: String,
    hasError: Boolean
) {
    val bgColor = when {
        isCurrent -> Surface.copy(alpha = 0.6f)
        isCompleted -> SurfaceDark.copy(alpha = 0.3f)
        else -> Color.Transparent
    }
    val borderColor = when {
        isCurrent && hasError -> ERROR_RED.copy(alpha = 0.3f)
        isCurrent -> MagmaRed.copy(alpha = 0.4f)
        else -> Color.Transparent
    }

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(8.dp))
            .background(bgColor)
            .then(
                if (isCurrent)
                    Modifier.border(1.dp, borderColor, RoundedCornerShape(8.dp))
                else Modifier
            )
            .padding(horizontal = 12.dp, vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        // Word number
        Text(
            text = "${(wordResult?.wordIndex ?: 0) + 1}.",
            style = MaterialTheme.typography.labelSmall,
            color = if (isCurrent) MagmaRed else TextDisabled,
            fontWeight = if (isCurrent) FontWeight.Bold else FontWeight.Normal,
            modifier = Modifier.width(28.dp)
        )

        // Word characters with coloring
        word.forEachIndexed { charIndex, char ->
            val charColor = when {
                // Completed word
                isCompleted -> {
                    val hadMistake = wordResult?.hadMistake ?: false
                    if (hadMistake) ERROR_RED.copy(alpha = 0.5f) else CORRECT_GREEN.copy(alpha = 0.7f)
                }
                // Current word — typed part
                isCurrent && charIndex < typedText.length -> {
                    val isCorrect = typedText[charIndex] == char
                    if (isCorrect) CORRECT_GREEN.copy(alpha = 0.9f) else ERROR_RED.copy(alpha = 0.9f)
                }
                // Current word — next character to type
                isCurrent && charIndex == typedText.length -> {
                    if (hasError) ERROR_RED else TextWhite
                }
                // Current word — untyped future characters
                isCurrent && charIndex > typedText.length -> {
                    TextBody.copy(alpha = 0.35f)
                }
                // Future words (not yet reached)
                else -> TextBody.copy(alpha = 0.3f)
            }

            val isBold = isCurrent && charIndex == typedText.length
            Text(
                text = char.toString(),
                style = MaterialTheme.typography.titleLarge,
                fontWeight = if (isBold) FontWeight.Bold else FontWeight.Medium,
                color = charColor,
                modifier = Modifier.padding(horizontal = 1.dp)
            )
        }
    }
}

// ── Native Keyboard Input ────────────────────────────────

@Composable
private fun NativeKeyboardInput(
    onKeyPress: (Char) -> Unit,
    modifier: Modifier = Modifier
) {
    val focusRequester = remember { FocusRequester() }
    var textFieldValue by remember { mutableStateOf(TextFieldValue("")) }
    var lastProcessedLength by remember { mutableIntStateOf(0) }

    // Auto-focus when visible
    LaunchedEffect(Unit) {
        delay(100)
        focusRequester.requestFocus()
    }

    BasicTextField(
        value = textFieldValue,
        onValueChange = { newValue ->
            val newText = newValue.text
            // Process new characters since last check
            if (newText.length > lastProcessedLength) {
                for (i in lastProcessedLength until newText.length) {
                    onKeyPress(newText[i])
                }
            }
            // Reset after processing each character
            textFieldValue = TextFieldValue("")
            lastProcessedLength = 0
        },
        modifier = Modifier
            .focusRequester(focusRequester)
            .then(modifier)
            .alpha(0f) // invisible
            .width(1.dp),
        textStyle = TextStyle(color = Color.Transparent, fontSize = 1.sp),
        cursorBrush = SolidColor(Color.Transparent),
        singleLine = true
    )
}

// ── Combo Gauge + Stats ──────────────────────────────────

@Composable
private fun ComboAndStatsRow(
    combo: Int,
    gaugeProgress: Float,
    activeTier: ComboTier,
    liveWpm: Int,
    accuracy: Float,
    maxCombo: Int,
    modifier: Modifier = Modifier
) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        // Combo gauge (vertical bar)
        Box(
            modifier = Modifier
                .width(8.dp)
                .height(40.dp)
                .clip(RoundedCornerShape(4.dp))
                .background(SurfaceBorder)
        ) {
            val fillColor = Color(activeTier.color)
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .fillMaxHeight(gaugeProgress.coerceIn(0f, 1f))
                    .align(Alignment.BottomCenter)
                    .clip(RoundedCornerShape(4.dp))
                    .background(
                        brush = Brush.verticalGradient(
                            colors = listOf(fillColor, MagmaRed)
                        )
                    )
            )
        }

        Spacer(modifier = Modifier.width(12.dp))

        // Streak info
        Column(modifier = Modifier.width(60.dp)) {
            if (combo > 0) {
                Text(
                    text = "×$combo",
                    style = MaterialTheme.typography.titleLarge,
                    color = Color(activeTier.color),
                    fontWeight = FontWeight.Bold
                )
            }
            if (maxCombo > 0) {
                Text(
                    text = "best $maxCombo",
                    style = MaterialTheme.typography.labelSmall,
                    color = TextMuted
                )
            }
        }

        Spacer(modifier = Modifier.weight(1f))

        // WPM
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text(
                text = "$liveWpm",
                style = MaterialTheme.typography.headlineSmall,
                color = MagmaRed,
                fontWeight = FontWeight.Bold
            )
            Text(
                text = "WPM",
                style = MaterialTheme.typography.labelSmall,
                color = TextMuted
            )
        }

        Spacer(modifier = Modifier.width(16.dp))

        // Accuracy
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text(
                text = "${(accuracy * 100).toInt()}%",
                style = MaterialTheme.typography.headlineSmall,
                color = if (accuracy >= 0.95f) MoltenGold else TextBody,
                fontWeight = FontWeight.Bold
            )
            Text(
                text = "ACC",
                style = MaterialTheme.typography.labelSmall,
                color = TextMuted
            )
        }

        Spacer(modifier = Modifier.width(8.dp))
    }
}

// ── Custom Keyboard ──────────────────────────────────────

@Composable
private fun CustomKeyboard(
    onKeyPress: (Char) -> Unit,
    modifier: Modifier = Modifier
) {
    val keySpacing = 4.dp
    val pressedKey = remember { mutableStateOf<Char?>(null) }

    // Reset pressed state after brief delay
    LaunchedEffect(pressedKey.value) {
        if (pressedKey.value != null) {
            delay(100)
            pressedKey.value = null
        }
    }

    Column(
        modifier = modifier
            .fillMaxWidth()
            .padding(horizontal = 8.dp, vertical = 4.dp),
        verticalArrangement = Arrangement.Center
    ) {
        QWERTY_ROWS.forEachIndexed { rowIndex, row ->
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 2.dp),
                horizontalArrangement = Arrangement.Center
            ) {
                if (rowIndex == 1) Spacer(modifier = Modifier.width(12.dp))
                if (rowIndex == 2) Spacer(modifier = Modifier.width(28.dp))

                row.forEach { char ->
                    KeyboardKey(
                        char = char,
                        isPressed = pressedKey.value == char,
                        onClick = {
                            pressedKey.value = char
                            onKeyPress(char)
                        }
                    )
                    Spacer(modifier = Modifier.width(keySpacing))
                }

                if (rowIndex == 1) Spacer(modifier = Modifier.width(12.dp))
                if (rowIndex == 2) Spacer(modifier = Modifier.width(28.dp))
            }
        }
    }
}

@Composable
private fun KeyboardKey(
    char: Char,
    isPressed: Boolean,
    onClick: () -> Unit
) {
    val view = LocalView.current
    val scaleAnim by animateFloatAsState(
        targetValue = if (isPressed) 0.92f else 1f,
        animationSpec = tween(80),
        label = "keyScale"
    )

    Box(
        modifier = Modifier
            .width(30.dp)
            .height(40.dp)
            .scale(scaleAnim)
            .clip(RoundedCornerShape(6.dp))
            .background(
                if (isPressed) MagmaRed else Surface,
                shape = RoundedCornerShape(6.dp)
            )
            .border(
                1.dp,
                if (isPressed) MagmaRed else SurfaceBorder,
                RoundedCornerShape(6.dp)
            )
            .clickable(
                interactionSource = remember { MutableInteractionSource() },
                indication = null,
                onClick = {
                    HapticUtil.keyPress(view)
                    onClick()
                }
            ),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = char.toString(),
            style = MaterialTheme.typography.labelMedium,
            color = if (isPressed) TextWhite else TextBody,
            fontWeight = FontWeight.SemiBold
        )
    }
}

// ── Loading State ────────────────────────────────────────

@Composable
private fun GameplayLoading() {
    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            CircularProgressIndicator(color = MagmaRed, modifier = Modifier.size(32.dp))
            Spacer(modifier = Modifier.height(16.dp))
            Text("Preparing arena…", style = MaterialTheme.typography.bodyMedium, color = TextLabel)
        }
    }
}

// ── Kinetic Text Overlay ─────────────────────────────────

@Composable
private fun KineticTextOverlay(
    text: String?,
    modifier: Modifier = Modifier
) {
    AnimatedVisibility(
        visible = text != null,
        enter = scaleIn(animationSpec = tween(200)) + fadeIn(tween(100)),
        exit = fadeOut(tween(500)),
        modifier = modifier
    ) {
        if (text != null) {
            val color = when {
                text.contains("IGNITION") -> TextWhite
                text.contains("MAX") -> Color(0xFFFF00AA)
                text.contains("CRITICAL") -> NeonPurple
                text.contains("BURNING") -> MagmaRed
                else -> MagmaRed
            }
            Text(
                text = text,
                style = MaterialTheme.typography.displaySmall,
                color = color,
                fontWeight = FontWeight.Bold,
                textAlign = TextAlign.Center,
                modifier = Modifier.shadow(8.dp, RoundedCornerShape(0.dp), spotColor = color)
            )
        }
    }
}
