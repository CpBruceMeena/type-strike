package com.typestrike.ui.victory

import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.*
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.typestrike.ui.theme.*
import com.typestrike.ui.util.HapticUtil
import kotlinx.coroutines.delay

// ── Main Screen ──────────────────────────────────────────

@Composable
fun VictoryScreen(
    levelId: Int,
    wpm: Int,
    accuracy: Int,
    stars: Int,
    onPlayAgain: (Int) -> Unit = {},
    onNextLevel: (Int) -> Unit = {},
    onBackToMap: () -> Unit = {},
    onBack: () -> Unit = {},
    viewModel: VictoryViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()

    // Load result on first composition
    LaunchedEffect(Unit) {
        viewModel.loadResult(levelId, wpm, accuracy, stars)
    }

    // Auto-advance through animation phases
    LaunchedEffect(uiState.animPhase) {
        if (uiState.animPhase in 1..6) {
            when (uiState.animPhase) {
                1 -> delay(500)
                2 -> delay(500)
                3 -> delay(500)
                4 -> delay(400)
                5 -> delay(500)
                6 -> delay(500)
            }
            viewModel.advancePhase()
        }
    }

    // Tap-to-skip
    val tapToSkip = Modifier.clickable {
        if (!uiState.animComplete) viewModel.skipToEnd()
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Background.copy(alpha = 0.95f))
            .then(tapToSkip)
    ) {
        when {
            uiState.isLoading -> VictoryLoading()
            else -> {
                // Smoke particles (Canvas)
                SmokeParticles(uiState.animPhase)

                // Metal corner brackets
                if (uiState.animPhase >= 2) {
                    CornerBrackets(uiState.animPhase)
                }

                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .systemBarsPadding()
                        .padding(24.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.SpaceBetween
                ) {
                    // ── Back button (always visible, replaces top spacer) ──
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.Start
                    ) {
                        TextButton(onClick = onBack, modifier = Modifier.size(48.dp)) {
                            Text("←", color = TextBody, fontSize = 22.sp)
                        }
                    }

                    // ── Header Badge ─────────────────────
                    if (uiState.animPhase >= 3) {
                        LevelBurntBadge(animPhase = uiState.animPhase)
                    }

                    Spacer(modifier = Modifier.height(8.dp))

                    // ── Trophy Shards ────────────────────
                    if (uiState.animPhase >= 4) {
                        TrophyShards(stars = uiState.stars, animPhase = uiState.animPhase)
                    }

                    Spacer(modifier = Modifier.weight(1f))

                    // ── Core Metrics ─────────────────────
                    if (uiState.animPhase >= 5) {
                        MetricsDashboard(
                            wpm = uiState.finalWpm,
                            accuracy = uiState.finalAccuracy,
                            animPhase = uiState.animPhase
                        )
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    // ── XP Arc Bar ───────────────────────
                    if (uiState.animPhase >= 6) {
                        XpArcBar(
                            xpBefore = uiState.xpBefore,
                            xpAfter = uiState.xpAfter,
                            xpForNext = uiState.xpForNextLevel,
                            xpEarned = uiState.xpEarned,
                            leveledUp = uiState.leveledUp,
                            newLevel = uiState.newLevel,
                            animPhase = uiState.animPhase
                        )
                    }

                    Spacer(modifier = Modifier.weight(1f))

                    // ── Action Buttons ────────────────────
                    AnimatedVisibility(
                        visible = uiState.animPhase >= 7 || uiState.animComplete,
                        enter = fadeIn(tween(400)) + slideInVertically(tween(400)) { it }
                    ) {
                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally,
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            // Play Again
                            Button(
                                onClick = { onPlayAgain(levelId) },
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(52.dp),
                                shape = RoundedCornerShape(12.dp),
                                colors = ButtonDefaults.buttonColors(containerColor = MagmaRed)
                            ) {
                                Text(
                                    text = "🔥  PLAY AGAIN",
                                    color = TextWhite,
                                    fontWeight = FontWeight.Bold,
                                    letterSpacing = 1.sp
                                )
                            }

                            Spacer(modifier = Modifier.height(12.dp))

                            // Next Level (only if ≥1 star)
                            if (uiState.stars >= 1) {
                                OutlinedButton(
                                    onClick = { onNextLevel(levelId + 1) },
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .height(48.dp),
                                    shape = RoundedCornerShape(12.dp),
                                    colors = ButtonDefaults.outlinedButtonColors(contentColor = MoltenGold),
                                    border = BorderStroke(1.dp, MoltenGold.copy(alpha = 0.5f))
                                ) {
                                    Text(
                                        text = "NEXT LEVEL →",
                                        color = MoltenGold,
                                        fontWeight = FontWeight.Bold,
                                        letterSpacing = 1.sp
                                    )
                                }

                                Spacer(modifier = Modifier.height(12.dp))
                            }

                            // Back to Map
                            TextButton(
                                onClick = onBackToMap,
                                modifier = Modifier.height(40.dp)
                            ) {
                                Text(
                                    text = "BACK TO MAP",
                                    color = TextLabel,
                                    style = MaterialTheme.typography.bodySmall,
                                    letterSpacing = 1.sp
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(8.dp))
                }
            }
        }

        // Tap hint
        AnimatedVisibility(
            visible = !uiState.animComplete && uiState.animPhase >= 2,
            enter = fadeIn(),
            exit = fadeOut(),
            modifier = Modifier.align(Alignment.BottomCenter).padding(bottom = 8.dp)
        ) {
            Text(
                text = "Tap to skip",
                style = MaterialTheme.typography.labelSmall,
                color = TextDisabled.copy(alpha = 0.5f)
            )
        }
    }
}

// ── Corner Brackets ──────────────────────────────────────

@Composable
private fun CornerBrackets(animPhase: Int) {
    val bracketAlpha by animateFloatAsState(
        targetValue = if (animPhase >= 2) 1f else 0f,
        animationSpec = tween(300),
        label = "bracketAlpha"
    )

    Canvas(modifier = Modifier.fillMaxSize().alpha(bracketAlpha)) {
        val strokeW = 3.dp.toPx()
        val length = 60.dp.toPx()
        val offset = 16.dp.toPx()

        val color = MoltenGold.copy(alpha = 0.6f)

        // Top-left bracket
        drawLine(color, Offset(offset, offset + length), Offset(offset, offset), strokeW)
        drawLine(color, Offset(offset, offset), Offset(offset + length, offset), strokeW)

        // Top-right bracket
        drawLine(color, Offset(size.width - offset, offset + length), Offset(size.width - offset, offset), strokeW)
        drawLine(color, Offset(size.width - offset, offset), Offset(size.width - offset - length, offset), strokeW)

        // Bottom-left bracket
        drawLine(color, Offset(offset, size.height - offset - length), Offset(offset, size.height - offset), strokeW)
        drawLine(color, Offset(offset, size.height - offset), Offset(offset + length, size.height - offset), strokeW)

        // Bottom-right bracket
        drawLine(color, Offset(size.width - offset, size.height - offset - length), Offset(size.width - offset, size.height - offset), strokeW)
        drawLine(color, Offset(size.width - offset, size.height - offset), Offset(size.width - offset - length, size.height - offset), strokeW)
    }
}

// ── Smoke Particles ──────────────────────────────────────

@Composable
private fun SmokeParticles(animPhase: Int) {
    val particleAlpha by animateFloatAsState(
        targetValue = if (animPhase >= 1) 0.12f else 0f,
        animationSpec = tween(800),
        label = "smokeAlpha"
    )

    Canvas(modifier = Modifier.fillMaxSize().alpha(particleAlpha)) {
        val particles = listOf(
            Offset(size.width * 0.2f, size.height * 0.3f) to 80f,
            Offset(size.width * 0.7f, size.height * 0.25f) to 60f,
            Offset(size.width * 0.5f, size.height * 0.4f) to 100f,
            Offset(size.width * 0.3f, size.height * 0.6f) to 70f,
            Offset(size.width * 0.8f, size.height * 0.5f) to 90f,
            Offset(size.width * 0.6f, size.height * 0.7f) to 50f,
            Offset(size.width * 0.15f, size.height * 0.5f) to 65f,
            Offset(size.width * 0.85f, size.height * 0.35f) to 75f,
        )
        for ((pos, radius) in particles) {
            drawCircle(
                color = TextBody.copy(alpha = 0.08f),
                radius = radius,
                center = pos
            )
        }
    }
}

// ── Level Burnt Badge ────────────────────────────────────

@Composable
private fun LevelBurntBadge(
    animPhase: Int
) {
    val badgeScale by animateFloatAsState(
        targetValue = if (animPhase >= 3) 1f else 0f,
        animationSpec = spring(dampingRatio = 0.6f, stiffness = 200f),
        label = "badgeScale"
    )

    Text(
        text = "LEVEL BURNT",
        style = MaterialTheme.typography.displaySmall,
        color = MagmaRed,
        fontWeight = FontWeight.Bold,
        letterSpacing = 4.sp,
        textAlign = TextAlign.Center,
        modifier = Modifier
            .scale(badgeScale)
            .shadow(12.dp, RoundedCornerShape(0.dp), ambientColor = MagmaRed, spotColor = MagmaRed)
    )
}

// ── Trophy Shards ────────────────────────────────────────

@Composable
private fun TrophyShards(stars: Int, animPhase: Int) {
    Row(
        horizontalArrangement = Arrangement.spacedBy(12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        repeat(stars.coerceIn(0, 3)) { index ->
            TrophyShard(
                index = index,
                visible = animPhase >= 4,
                slamDelay = index * 150
            )
        }
    }
}

@Composable
private fun TrophyShard(
    index: Int,
    visible: Boolean,
    slamDelay: Int
) {
    val view = LocalView.current
    var slammed by remember { mutableStateOf(false) }

    LaunchedEffect(visible) {
        if (visible) {
            delay(slamDelay.toLong())
            slammed = true
            HapticUtil.trophySlam(view)
        }
    }

    val shardScale by animateFloatAsState(
        targetValue = if (slammed) 1f else 0f,
        animationSpec = spring(dampingRatio = 0.4f, stiffness = 400f),
        label = "shardScale_$index"
    )

    // Screen shake effect on slam
    val shakeOffset by animateFloatAsState(
        targetValue = if (slammed) 0f else 10f,
        animationSpec = tween(200),
        label = "shake_$index"
    )

    Box(
        modifier = Modifier
            .size(48.dp)
            .scale(shardScale)
            .offset(y = shakeOffset.dp)
    ) {
        Canvas(modifier = Modifier.fillMaxSize()) {
            val path = Path().apply {
                // Diamond/crystal shard shape
                moveTo(size.width / 2, 0f)
                lineTo(size.width, size.height * 0.4f)
                lineTo(size.width * 0.8f, size.height)
                lineTo(size.width * 0.2f, size.height)
                lineTo(0f, size.height * 0.4f)
                close()
            }
            // Gold gradient fill
            drawPath(
                path = path,
                brush = Brush.verticalGradient(
                    colors = listOf(MoltenGold, MoltenGold.copy(alpha = 0.6f))
                )
            )
            // Glow effect
            drawPath(
                path = path,
                brush = Brush.radialGradient(
                    colors = listOf(
                        MoltenGold.copy(alpha = 0.4f),
                        Color.Transparent
                    ),
                    center = Offset(size.width / 2, size.height / 2)
                ),
                style = Stroke(width = 2.dp.toPx())
            )
        }
    }
}

// ── Metrics Dashboard ────────────────────────────────────

@Composable
private fun MetricsDashboard(
    wpm: Int,
    accuracy: Int,
    animPhase: Int
) {
    val metricsVisible by animateFloatAsState(
        targetValue = if (animPhase >= 5) 1f else 0f,
        animationSpec = tween(500),
        label = "metricsVisible"
    )

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .alpha(metricsVisible)
            .padding(horizontal = 16.dp),
        horizontalArrangement = Arrangement.SpaceEvenly
    ) {
        // WPM
        MetricCard(
            value = "$wpm",
            label = "WORDS PER MINUTE",
            color = MagmaRed
        )

        // Accuracy
        MetricCard(
            value = "$accuracy%",
            label = "ACCURACY",
            color = MoltenGold
        )
    }
}

@Composable
private fun MetricCard(
    value: String,
    label: String,
    color: Color
) {
    Card(
        modifier = Modifier
            .width(140.dp)
            .height(80.dp),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(
            containerColor = SurfaceDark.copy(alpha = 0.6f)
        ),
        border = BorderStroke(1.dp, color.copy(alpha = 0.3f))
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(12.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Text(
                text = value,
                style = MaterialTheme.typography.displaySmall,
                color = color,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.shadow(4.dp, RoundedCornerShape(0.dp), spotColor = color)
            )
            Text(
                text = label,
                style = MaterialTheme.typography.labelSmall,
                color = TextMuted,
                textAlign = TextAlign.Center
            )
        }
    }
}

// ── XP Arc Bar ───────────────────────────────────────────

@Composable
private fun XpArcBar(
    xpBefore: Int,
    xpAfter: Int,
    xpForNext: Int,
    xpEarned: Int,
    leveledUp: Boolean,
    newLevel: Int,
    animPhase: Int
) {
    val targetProgress = (xpBefore.toFloat() / xpForNext).coerceIn(0f, 1f)
    val fillProgress by animateFloatAsState(
        targetValue = if (animPhase >= 6) targetProgress else 0f,
        animationSpec = tween(1200, easing = FastOutSlowInEasing),
        label = "xpFill"
    )

    // Animate XP numbers
    val displayXpBefore = if (animPhase >= 6) xpBefore else 0
    val displayXpAfter = if (animPhase >= 6) xpAfter else 0

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        // XP earned badge
        Box(
            modifier = Modifier
                .clip(RoundedCornerShape(20.dp))
                .background(MagmaRed.copy(alpha = 0.15f))
                .padding(horizontal = 16.dp, vertical = 6.dp)
        ) {
            Text(
                text = "+$xpEarned XP",
                style = MaterialTheme.typography.titleLarge,
                color = MoltenGold,
                fontWeight = FontWeight.Bold
            )
        }

        Spacer(modifier = Modifier.height(12.dp))

        // Curved arc bar using Canvas
        Box(modifier = Modifier.fillMaxWidth().height(40.dp).padding(horizontal = 20.dp)) {
            Canvas(modifier = Modifier.fillMaxSize()) {
                val arcWidth = 6.dp.toPx()
                val arcRect = Size(size.width, 30.dp.toPx())

                // Background arc
                drawArc(
                    brush = SolidColor(SurfaceBorder.copy(alpha = 0.3f)),
                    startAngle = 180f,
                    sweepAngle = 180f,
                    useCenter = false,
                    topLeft = Offset.Zero,
                    size = arcRect,
                    style = Stroke(width = arcWidth, cap = StrokeCap.Round)
                )

                // Filled arc
                val sweepAngle = 180f * fillProgress
                drawArc(
                    brush = Brush.horizontalGradient(
                        colors = listOf(MagmaRed, MoltenGold)
                    ),
                    startAngle = 180f,
                    sweepAngle = sweepAngle,
                    useCenter = false,
                    topLeft = Offset.Zero,
                    size = arcRect,
                    style = Stroke(width = arcWidth, cap = StrokeCap.Round)
                )
            }

            // Before label
            Text(
                text = "$displayXpBefore",
                style = MaterialTheme.typography.labelSmall,
                color = TextLabel,
                modifier = Modifier.align(Alignment.TopStart)
            )

            // After label
            Text(
                text = "$displayXpAfter",
                style = MaterialTheme.typography.labelSmall,
                color = MoltenGold,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.align(Alignment.TopEnd)
            )
        }

        Spacer(modifier = Modifier.height(4.dp))

        // Level-up notification
        if (leveledUp) {
            AnimatedVisibility(
                visible = animPhase >= 6,
                enter = scaleIn(tween(300)) + fadeIn(tween(200)),
                exit = fadeOut()
            ) {
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(8.dp))
                        .background(MoltenGold.copy(alpha = 0.15f))
                        .padding(horizontal = 12.dp, vertical = 4.dp)
                ) {
                    Text(
                        text = "⚡ LEVEL UP! LV.$newLevel",
                        style = MaterialTheme.typography.labelMedium,
                        color = MoltenGold,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }
    }
}

// ── Loading State ────────────────────────────────────────

@Composable
private fun VictoryLoading() {
    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            CircularProgressIndicator(color = MagmaRed, modifier = Modifier.size(32.dp))
            Spacer(modifier = Modifier.height(16.dp))
            Text("Processing result…", style = MaterialTheme.typography.bodyMedium, color = TextLabel)
        }
    }
}
