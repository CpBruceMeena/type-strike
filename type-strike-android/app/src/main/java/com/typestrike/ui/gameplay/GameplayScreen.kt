package com.typestrike.ui.gameplay

import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
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
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.TextFieldValue
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.typestrike.ui.effects.*
import com.typestrike.ui.theme.*
import com.typestrike.ui.util.HapticUtil
import kotlinx.coroutines.delay

private val CORRECT_GREEN = Color(0xFF22DD44)
private val ERROR_RED = Color(0xFFFF3300)
private val CURSOR_WHITE = Color(0xFFFFF8E7)
private val UNTYPED_DIM = Color(0xFF6A6A7A)

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

    // ── Haptic: character complete (every 5 chars for pacing) ─
    LaunchedEffect(uiState.currentCharIndex) {
        if (uiState.currentCharIndex > 0 && uiState.currentCharIndex % 5 == 0 && uiState.gameState == GameState.TYPING) {
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
                    // Arena Header (showing char progress instead of word progress)
                    ArenaHeader(
                        levelName = uiState.levelName,
                        charIndex = uiState.currentCharIndex,
                        charCount = uiState.paragraph.length,
                        onBack = onBack
                    )

                    // Paragraph panel (scrollable, character-by-character coloring)
                    Box(modifier = Modifier.weight(1f)) {
                        ParagraphPanel(
                            paragraph = uiState.paragraph,
                            charResults = uiState.charResults,
                            currentCharIndex = uiState.currentCharIndex,
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
                            onBackspace = { viewModel.onBackspace() },
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

                    // Custom Keyboard
                    if (!uiState.useNativeKeyboard) {
                        CustomKeyboard(
                            onKeyPress = { viewModel.onKeyPress(it) },
                            onBackspace = { viewModel.onBackspace() },
                            modifier = Modifier.height(240.dp)
                        )
                    }
                }
            }
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
                    Box(
                        modifier = Modifier
                            .matchParentSize()
                            .padding(12.dp)
                            .clip(RoundedCornerShape(24.dp))
                            .alpha(glowAlpha)
                            .background(MagmaRed)
                    )
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

// ── Arena Header (updated for paragraphs) ────────────────

@Composable
private fun ArenaHeader(
    levelName: String,
    charIndex: Int,
    charCount: Int,
    onBack: () -> Unit
) {
    val progress = if (charCount > 0) (charIndex.toFloat() / charCount).coerceIn(0f, 1f) else 0f

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .height(56.dp)
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
                text = "$charIndex / $charCount chars",
                style = MaterialTheme.typography.labelSmall,
                color = TextMuted
            )
        }
        // Mini progress bar
        Box(
            modifier = Modifier
                .width(60.dp)
                .height(4.dp)
                .clip(RoundedCornerShape(2.dp))
                .background(SurfaceDark)
        ) {
            Box(
                modifier = Modifier
                    .fillMaxHeight()
                    .fillMaxWidth(progress)
                    .clip(RoundedCornerShape(2.dp))
                    .background(MagmaRed)
            )
        }
        Spacer(modifier = Modifier.width(8.dp))
    }
}

// ── Paragraph Panel ──────────────────────────────────────

@Composable
private fun ParagraphPanel(
    paragraph: String,
    charResults: List<CharResult>,
    currentCharIndex: Int,
    gameState: GameState,
    modifier: Modifier = Modifier
) {
    val scrollState = rememberScrollState()

    // Auto-scroll to keep current char line visible
    LaunchedEffect(currentCharIndex, paragraph) {
        delay(50)
        val charsPerLine = 30f.coerceAtLeast(1f)
        val currentLine = (currentCharIndex / charsPerLine).toInt()
        val targetScroll = (currentLine * 48).coerceAtMost(scrollState.maxValue)
        scrollState.animateScrollTo(targetScroll, tween(200))
    }

    // Simple scrollable box — Text handles wrapping row-wise naturally.
    val annotated = remember(paragraph, charResults, currentCharIndex, gameState) {
        buildAnnotatedString {
            paragraph.forEachIndexed { charIndex, char ->
                val result = charResults.getOrNull(charIndex)
                val isCurrent = charIndex == currentCharIndex
                val isTyped = result?.isTyped == true
                val isCorrect = result?.isCorrect ?: true

                val color = when {
                    isCurrent && gameState == GameState.MISTAKE -> ERROR_RED
                    isCurrent -> CURSOR_WHITE
                    isTyped && isCorrect -> CORRECT_GREEN
                    isTyped && !isCorrect -> ERROR_RED
                    else -> UNTYPED_DIM
                }
                withStyle(SpanStyle(color = color, fontWeight = if (isCurrent) FontWeight.Bold else FontWeight.Normal)) {
                    append(char)
                }
            }
        }
    }

    Box(
        modifier = modifier
            .fillMaxWidth()
            .padding(horizontal = 12.dp, vertical = 4.dp)
            .clip(RoundedCornerShape(12.dp))
            .background(SurfaceDark.copy(alpha = 0.5f))
            .border(1.dp, SurfaceBorder.copy(alpha = 0.2f), RoundedCornerShape(12.dp))
            .verticalScroll(scrollState)
            .padding(12.dp)
    ) {
        Text(
            text = annotated,
            style = MaterialTheme.typography.titleMedium,
            lineHeight = 28.sp
        )
    }
}

// ── Native Keyboard Input ────────────────────────────────

@Composable
private fun NativeKeyboardInput(
    onKeyPress: (Char) -> Unit,
    onBackspace: () -> Unit = {},
    modifier: Modifier = Modifier
) {
    val focusRequester = remember { FocusRequester() }
    var textFieldValue by remember { mutableStateOf(TextFieldValue("")) }
    var lastProcessedLength by remember { mutableIntStateOf(0) }

    LaunchedEffect(Unit) {
        delay(100)
        focusRequester.requestFocus()
    }

    BasicTextField(
        value = textFieldValue,
        onValueChange = { newValue ->
            val newText = newValue.text
            when {
                newText.length > lastProcessedLength -> {
                    // Characters were added — forward each new char
                    for (i in lastProcessedLength until newText.length) {
                        onKeyPress(newText[i])
                    }
                }
                newText.length < lastProcessedLength -> {
                    // Characters were removed (backspace) — one per deleted char
                    val removed = lastProcessedLength - newText.length
                    repeat(removed) { onBackspace() }
                }
            }
            textFieldValue = TextFieldValue("")
            lastProcessedLength = 0
        },
        modifier = Modifier
            .focusRequester(focusRequester)
            .then(modifier)
            .alpha(0f)
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

// ── Keyboard Mode ────────────────────────────────────────

private enum class KeyboardMode { LETTERS, SYMBOLS }

private val LETTER_ROWS = listOf(
    listOf('q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'),
    listOf('a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'),
    listOf('z', 'x', 'c', 'v', 'b', 'n', 'm')
)

private val SYMBOL_ROWS = listOf(
    listOf('1', '2', '3', '4', '5', '6', '7', '8', '9', '0'),
    listOf('-', '/', ':', ';', '(', ')', '$', '&', '@', '"'),
    listOf('#', '+', '=', '<', '>', '_', '|', '{', '}', '[', ']', '\\')
)

// ── Custom Keyboard ──────────────────────────────────────

@Composable
private fun CustomKeyboard(
    onKeyPress: (Char) -> Unit,
    onBackspace: () -> Unit = {},
    modifier: Modifier = Modifier
) {
    var mode by remember { mutableStateOf(KeyboardMode.LETTERS) }
    var isShifted by remember { mutableStateOf(false) }
    val pressedKey = remember { mutableStateOf<Char?>(null) }

    LaunchedEffect(pressedKey.value) {
        if (pressedKey.value != null) {
            delay(100)
            pressedKey.value = null
        }
    }

    val keyHeight = 36.dp

    Column(
        modifier = modifier
            .fillMaxWidth()
            .padding(horizontal = 4.dp, vertical = 4.dp),
        verticalArrangement = Arrangement.SpaceEvenly
    ) {
        when (mode) {
            KeyboardMode.LETTERS -> {
                // Row 1-3: Letter rows with consistent spacing
                LETTER_ROWS.forEachIndexed { rowIndex, row ->
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 4.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        // Shift key on row 3 (left side)
                        if (rowIndex == 2) {
                            SpecialKey(
                                text = if (isShifted) "⇪" else "⇧",
                                accent = isShifted,
                                width = 44.dp,
                                onClick = { isShifted = !isShifted }
                            )
                        }

                        row.forEach { char ->
                            val displayChar = if (isShifted) char.uppercaseChar() else char
                            KeyboardKey(
                                char = displayChar,
                                keyWidth = 29.dp,
                                keyHeight = keyHeight,
                                isPressed = pressedKey.value == char,
                                onClick = {
                                    pressedKey.value = char
                                    onKeyPress(displayChar)
                                    if (isShifted) isShifted = false
                                }
                            )
                        }

                        // Backspace on row 3 (right side)
                        if (rowIndex == 2) {
                            SpecialKey(
                                text = "⌫",
                                width = 44.dp,
                                onClick = onBackspace
                            )
                        }
                    }
                }

                // Bottom row: ?123, comma, SPACE, period, done
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 8.dp, vertical = 2.dp),
                    horizontalArrangement = Arrangement.spacedBy(4.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    SpecialKey(
                        text = "?123",
                        width = 50.dp,
                        onClick = {
                            mode = KeyboardMode.SYMBOLS
                            isShifted = false
                        }
                    )
                    KeyboardKey(
                        char = ',',
                        keyWidth = 28.dp,
                        keyHeight = 38.dp,
                        isPressed = pressedKey.value == ',',
                        onClick = { pressedKey.value = ','; onKeyPress(',') }
                    )
                    SpaceBar(
                        isPressed = pressedKey.value == ' ',
                        onClick = {
                            pressedKey.value = ' '
                            onKeyPress(' ')
                        },
                        modifier = Modifier.weight(1f)
                    )
                    KeyboardKey(
                        char = '.',
                        keyWidth = 28.dp,
                        keyHeight = 38.dp,
                        isPressed = pressedKey.value == '.',
                        onClick = { pressedKey.value = '.'; onKeyPress('.') }
                    )
                    SpecialKey(
                        text = "⏎",
                        width = 50.dp,
                        onClick = {}
                    )
                }
            }

            KeyboardMode.SYMBOLS -> {
                // Row 1-3: Symbol rows with consistent spacing
                SYMBOL_ROWS.forEachIndexed { rowIndex, row ->
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 4.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        if (rowIndex == 2) {
                            SpecialKey(
                                text = "⇧",
                                width = 44.dp,
                                onClick = { isShifted = !isShifted }
                            )
                        }

                        row.forEach { char ->
                            val displayChar = if (isShifted && rowIndex == 0) {
                                when (char) {
                                    '1' -> '!'; '2' -> '@'; '3' -> '#'; '4' -> '$'
                                    '5' -> '%'; '6' -> '^'; '7' -> '&'; '8' -> '*'
                                    '9' -> '('; '0' -> ')'
                                    else -> char
                                }
                            } else char
                            KeyboardKey(
                                char = displayChar,
                                keyWidth = 29.dp,
                                keyHeight = keyHeight,
                                isPressed = pressedKey.value == char,
                                onClick = {
                                    pressedKey.value = char
                                    onKeyPress(displayChar)
                                    if (rowIndex == 0 && isShifted && char in '0'..'9') {
                                        isShifted = false
                                    }
                                }
                            )
                        }

                        if (rowIndex == 2) {
                            SpecialKey(
                                text = "⌫",
                                width = 44.dp,
                                onClick = onBackspace
                            )
                        }
                    }
                }

                // Bottom row: ABC, comma, SPACE, period
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 8.dp, vertical = 2.dp),
                    horizontalArrangement = Arrangement.spacedBy(4.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    SpecialKey(
                        text = "ABC",
                        width = 50.dp,
                        accent = true,
                        onClick = {
                            mode = KeyboardMode.LETTERS
                            isShifted = false
                        }
                    )
                    KeyboardKey(
                        char = ',',
                        keyWidth = 28.dp,
                        keyHeight = 38.dp,
                        isPressed = pressedKey.value == ',',
                        onClick = { pressedKey.value = ','; onKeyPress(',') }
                    )
                    SpaceBar(
                        isPressed = pressedKey.value == ' ',
                        onClick = {
                            pressedKey.value = ' '
                            onKeyPress(' ')
                        },
                        modifier = Modifier.weight(1f)
                    )
                    KeyboardKey(
                        char = '.',
                        keyWidth = 28.dp,
                        keyHeight = 38.dp,
                        isPressed = pressedKey.value == '.',
                        onClick = { pressedKey.value = '.'; onKeyPress('.') }
                    )
                    SpecialKey(
                        text = "⏎",
                        width = 50.dp,
                        onClick = {}
                    )
                }
            }
        }
    }
}

// ── Reusable Key Components ──────────────────────────────

@Composable
private fun KeyboardKey(
    char: Char,
    isPressed: Boolean,
    onClick: () -> Unit,
    keyWidth: Dp = 29.dp,
    keyHeight: Dp = 36.dp
) {
    val view = LocalView.current
    val scaleAnim by animateFloatAsState(
        targetValue = if (isPressed) 0.92f else 1f,
        animationSpec = tween(80),
        label = "keyScale"
    )

    Box(
        modifier = Modifier
            .width(keyWidth)
            .height(keyHeight)
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

@Composable
private fun SpecialKey(
    text: String,
    accent: Boolean = false,
    width: Dp = 40.dp,
    onClick: () -> Unit
) {
    val view = LocalView.current
    var isPressed by remember { mutableStateOf(false) }
    val scaleAnim by animateFloatAsState(
        targetValue = if (isPressed) 0.92f else 1f,
        animationSpec = tween(80),
        label = "specialKeyScale"
    )

    Box(
        modifier = Modifier
            .width(width)
            .height(36.dp)
            .scale(scaleAnim)
            .clip(RoundedCornerShape(6.dp))
            .background(
                when {
                    isPressed -> MagmaRed
                    accent -> MagmaRed.copy(alpha = 0.25f)
                    else -> Surface.copy(alpha = 0.7f)
                },
                shape = RoundedCornerShape(6.dp)
            )
            .border(
                1.dp,
                when {
                    isPressed -> MagmaRed
                    accent -> MagmaRed.copy(alpha = 0.4f)
                    else -> SurfaceBorder.copy(alpha = 0.5f)
                },
                RoundedCornerShape(6.dp)
            )
            .clickable(
                interactionSource = remember { MutableInteractionSource() },
                indication = null,
                onClick = {
                    isPressed = true
                    HapticUtil.keyPress(view)
                    onClick()
                }
            ),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = text,
            style = MaterialTheme.typography.labelSmall,
            color = if (accent && !isPressed) MagmaRed else TextBody,
            fontWeight = FontWeight.Bold
        )
    }

    LaunchedEffect(isPressed) {
        if (isPressed) {
            delay(100)
            isPressed = false
        }
    }
}

@Composable
private fun SpaceBar(
    isPressed: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val view = LocalView.current
    val scaleAnim by animateFloatAsState(
        targetValue = if (isPressed) 0.95f else 1f,
        animationSpec = tween(80),
        label = "spaceScale"
    )

    Box(
        modifier = modifier
            .height(40.dp)
            .scale(scaleAnim)
            .clip(RoundedCornerShape(8.dp))
            .background(
                if (isPressed) MagmaRed else Surface,
                shape = RoundedCornerShape(8.dp)
            )
            .border(
                1.dp,
                if (isPressed) MagmaRed else SurfaceBorder,
                RoundedCornerShape(8.dp)
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
            text = "SPACE",
            style = MaterialTheme.typography.labelSmall,
            color = if (isPressed) TextWhite else TextMuted,
            fontWeight = FontWeight.Medium,
            letterSpacing = 2.sp
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
