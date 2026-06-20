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

    LaunchedEffect(Unit) {
        viewModel.skipToEnd()
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Background.copy(alpha = 0.95f))
    ) {
        when {
            uiState.isLoading -> VictoryLoading()
            else -> {
                // Smoke particles
                SmokeParticles()
                CornerBrackets()

                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .systemBarsPadding()
                        .padding(24.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.SpaceBetween
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.Start
                    ) {
                        TextButton(onClick = onBack, modifier = Modifier.size(48.dp)) {
                            Text("←", color = TextBody, fontSize = 22.sp)
                        }
                    }

                    LevelBurntBadge()

                    Spacer(modifier = Modifier.height(8.dp))

                    TrophyShards(stars = uiState.stars)

                    Spacer(modifier = Modifier.weight(1f))

                    MetricsDashboard(
                        wpm = uiState.finalWpm,
                        accuracy = uiState.finalAccuracy
                    )

                    Spacer(modifier = Modifier.height(16.dp))

                    XpArcBar(
                        xpBefore = uiState.xpBefore,
                        xpAfter = uiState.xpAfter,
                        xpForNext = uiState.xpForNextLevel,
                        xpEarned = uiState.xpEarned,
                        leveledUp = uiState.leveledUp,
                        newLevel = uiState.newLevel
                    )

                    Spacer(modifier = Modifier.weight(1f))

                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        modifier = Modifier.fillMaxWidth()
                    ) {
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

                    Spacer(modifier = Modifier.height(8.dp))
                }
            }
        }
    }
}

// ── Corner Brackets ──────────────────────────────────────

@Composable
private fun CornerBrackets() {
    Canvas(modifier = Modifier.fillMaxSize()) {
        val strokeW = 3.dp.toPx()
        val length = 60.dp.toPx()
        val offset = 16.dp.toPx()

        val color = MoltenGold.copy(alpha = 0.6f)

        drawLine(color, Offset(offset, offset + length), Offset(offset, offset), strokeW)
        drawLine(color, Offset(offset, offset), Offset(offset + length, offset), strokeW)
        drawLine(color, Offset(size.width - offset, offset + length), Offset(size.width - offset, offset), strokeW)
        drawLine(color, Offset(size.width - offset, offset), Offset(size.width - offset - length, offset), strokeW)
        drawLine(color, Offset(offset, size.height - offset - length), Offset(offset, size.height - offset), strokeW)
        drawLine(color, Offset(offset, size.height - offset), Offset(offset + length, size.height - offset), strokeW)
        drawLine(color, Offset(size.width - offset, size.height - offset - length), Offset(size.width - offset, size.height - offset), strokeW)
        drawLine(color, Offset(size.width - offset, size.height - offset), Offset(size.width - offset - length, size.height - offset), strokeW)
    }
}

// ── Smoke Particles ──────────────────────────────────────

@Composable
private fun SmokeParticles() {
    Canvas(modifier = Modifier.fillMaxSize().alpha(0.12f)) {
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
private fun LevelBurntBadge() {
    Text(
        text = "LEVEL BURNT",
        style = MaterialTheme.typography.displaySmall,
        color = MagmaRed,
        fontWeight = FontWeight.Bold,
        letterSpacing = 4.sp,
        textAlign = TextAlign.Center,
        modifier = Modifier.shadow(12.dp, RoundedCornerShape(0.dp), ambientColor = MagmaRed, spotColor = MagmaRed)
    )
}

// ── Trophy Shards ────────────────────────────────────────

@Composable
private fun TrophyShards(stars: Int) {
    Row(
        horizontalArrangement = Arrangement.spacedBy(12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        repeat(stars.coerceIn(0, 3)) { index ->
            TrophyShard()
        }
    }
}

@Composable
private fun TrophyShard() {
    val view = LocalView.current
    LaunchedEffect(Unit) { HapticUtil.trophySlam(view) }

    Box(modifier = Modifier.size(48.dp)) {
        Canvas(modifier = Modifier.fillMaxSize()) {
            val path = Path().apply {
                moveTo(size.width / 2, 0f)
                lineTo(size.width, size.height * 0.4f)
                lineTo(size.width * 0.8f, size.height)
                lineTo(size.width * 0.2f, size.height)
                lineTo(0f, size.height * 0.4f)
                close()
            }
            drawPath(
                path = path,
                brush = Brush.verticalGradient(
                    colors = listOf(MoltenGold, MoltenGold.copy(alpha = 0.6f))
                )
            )
            drawPath(
                path = path,
                brush = Brush.radialGradient(
                    colors = listOf(MoltenGold.copy(alpha = 0.4f), Color.Transparent),
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
    accuracy: Int
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
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
    newLevel: Int
) {
    val targetProgress = (xpBefore.toFloat() / xpForNext).coerceIn(0f, 1f)

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
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

        Box(modifier = Modifier.fillMaxWidth().height(40.dp).padding(horizontal = 20.dp)) {
            Canvas(modifier = Modifier.fillMaxSize()) {
                val arcWidth = 6.dp.toPx()
                val arcRect = Size(size.width, 30.dp.toPx())

                drawArc(
                    brush = SolidColor(SurfaceBorder.copy(alpha = 0.3f)),
                    startAngle = 180f,
                    sweepAngle = 180f,
                    useCenter = false,
                    topLeft = Offset.Zero,
                    size = arcRect,
                    style = Stroke(width = arcWidth, cap = StrokeCap.Round)
                )

                drawArc(
                    brush = Brush.horizontalGradient(colors = listOf(MagmaRed, MoltenGold)),
                    startAngle = 180f,
                    sweepAngle = 180f * targetProgress,
                    useCenter = false,
                    topLeft = Offset.Zero,
                    size = arcRect,
                    style = Stroke(width = arcWidth, cap = StrokeCap.Round)
                )
            }

            Text(
                text = "$xpBefore",
                style = MaterialTheme.typography.labelSmall,
                color = TextLabel,
                modifier = Modifier.align(Alignment.TopStart)
            )
            Text(
                text = "$xpAfter",
                style = MaterialTheme.typography.labelSmall,
                color = MoltenGold,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.align(Alignment.TopEnd)
            )
        }

        Spacer(modifier = Modifier.height(4.dp))

        if (leveledUp) {
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
