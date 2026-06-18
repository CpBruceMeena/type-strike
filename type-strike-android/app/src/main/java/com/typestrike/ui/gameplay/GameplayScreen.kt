package com.typestrike.ui.gameplay

import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.typestrike.ui.effects.*
import com.typestrike.ui.theme.*
import kotlinx.coroutines.delay

val QWERTY_ROWS = listOf(
    listOf('Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'),
    listOf('A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'),
    listOf('Z', 'X', 'C', 'V', 'B', 'N', 'M')
)

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

    // Keyboard pressed state
    val pressedKey = remember { mutableStateOf<Char?>(null) }

    val particleConfig = remember {
        ParticleConfig.fromQuality(ParticleConfig.detect())
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Background)
            .systemBarsPadding()
    ) {
        // Particle background (behind everything)
        MapParticleField(
            config = particleConfig,
            modifier = Modifier.fillMaxSize()
        )

        when (uiState.gameState) {
            GameState.LOADING -> GameplayLoading()
            else -> {
                Column(modifier = Modifier.fillMaxSize()) {
                    // Arena Header
                    ArenaHeader(
                        levelName = uiState.levelName,
                        wordIndex = uiState.currentWordIndex,
                        wordCount = uiState.words.size,
                        onBack = onBack
                    )

                    // Word Display Panel (with kinetic text overlay)
                    Box(modifier = Modifier.weight(1f)) {
                        WordDisplayPanel(
                            currentWord = uiState.words.getOrNull(uiState.currentWordIndex) ?: "",
                            typedText = uiState.typedText,
                            gameState = uiState.gameState,
                            modifier = Modifier.fillMaxSize()
                        )

                        // Kinetic text overlay (combo milestone messages)
                        KineticTextOverlay(
                            text = uiState.showKineticText,
                            modifier = Modifier.align(Alignment.Center)
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
                    CustomKeyboard(
                        pressedKey = pressedKey.value,
                        onKeyPress = { char ->
                            if (uiState.gameState == GameState.READY) {
                                viewModel.startTyping()
                            }
                            viewModel.onKeyPress(char)
                            pressedKey.value = char
                        },
                        modifier = Modifier.height(200.dp)
                    )
                }
            }
        }

        // Mistake flash overlay
        if (uiState.gameState == GameState.MISTAKE) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(ErrorRed.copy(alpha = 0.08f))
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

// ── Word Display Panel ───────────────────────────────────

@Composable
private fun WordDisplayPanel(
    currentWord: String,
    typedText: String,
    gameState: GameState,
    modifier: Modifier = Modifier
) {
    val infiniteTransition = rememberInfiniteTransition(label = "wordGlow")
    val glowAlpha by infiniteTransition.animateFloat(
        initialValue = 0.06f,
        targetValue = 0.12f,
        animationSpec = infiniteRepeatable(
            animation = tween(2000, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "wordGlow"
    )

    Box(
        modifier = modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 8.dp)
            .clip(RoundedCornerShape(12.dp))
            .background(SurfaceDark.copy(alpha = 0.6f))
            .border(1.dp, SurfaceBorder.copy(alpha = 0.3f), RoundedCornerShape(12.dp))
            .then(
                if (gameState == GameState.MISTAKE)
                    Modifier.background(ErrorRed.copy(alpha = 0.05f))
                else Modifier
            ),
        contentAlignment = Alignment.Center
    ) {
        // Ambient glow
        Box(
            modifier = Modifier
                .matchParentSize()
                .alpha(glowAlpha)
                .background(MagmaRed.copy(alpha = 0.2f))
        )

        if (currentWord.isEmpty()) {
            Text(
                text = "Loading…",
                style = MaterialTheme.typography.headlineLarge,
                color = TextDisabled
            )
        } else {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier.padding(horizontal = 24.dp, vertical = 16.dp)
            ) {
                currentWord.forEachIndexed { index, char ->
                    val isTyped = index < typedText.length
                    val isCorrect = isTyped && typedText[index] == char
                    val isNext = index == typedText.length

                    Text(
                        text = char.toString(),
                        style = MaterialTheme.typography.displaySmall,
                        fontWeight = FontWeight.Bold,
                        color = when {
                            isCorrect -> MagmaRed
                            isNext -> TextWhite
                            else -> TextBody.copy(alpha = 0.3f)
                        },
                        modifier = Modifier.padding(horizontal = 2.dp)
                    )
                }
            }
        }
    }
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
    pressedKey: Char?,
    onKeyPress: (Char) -> Unit,
    modifier: Modifier = Modifier
) {
    val keySpacing = 4.dp

    // Reset pressed state after brief delay
    LaunchedEffect(pressedKey) {
        if (pressedKey != null) {
            delay(100)
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
                // Staggered layout for rows 2 and 3
                if (rowIndex == 1) Spacer(modifier = Modifier.width(12.dp))
                if (rowIndex == 2) Spacer(modifier = Modifier.width(28.dp))

                row.forEach { char ->
                    KeyboardKey(
                        char = char,
                        isPressed = pressedKey == char,
                        onClick = { onKeyPress(char) }
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
                onClick = onClick
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
