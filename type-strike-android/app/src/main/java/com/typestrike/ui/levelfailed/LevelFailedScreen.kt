package com.typestrike.ui.levelfailed

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
import androidx.compose.ui.graphics.*
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.typestrike.ui.effects.*
import com.typestrike.ui.theme.*
import com.typestrike.ui.util.HapticUtil
import kotlinx.coroutines.delay
import kotlin.math.sin

// ── Main Screen ──────────────────────────────────────────

@Composable
fun LevelFailedScreen(
    levelId: Int,
    wpm: Int,
    accuracy: Int,
    onRetry: (Int) -> Unit = {},
    onBackToMap: () -> Unit = {},
    onBack: () -> Unit = {},
    viewModel: LevelFailedViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()

    val view = LocalView.current

    LaunchedEffect(Unit) {
        viewModel.loadFailedResult(levelId, wpm, accuracy)
        // Haptic: level failed — 200ms heavy buzz
        delay(300)
        HapticUtil.levelFailed(view)
    }



    val particleConfig = remember {
        ParticleConfig.fromQuality(ParticleConfig.detect())
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Background.copy(alpha = 0.95f))
    ) {
        when {
            uiState.isLoading -> LevelFailedLoading()
            else -> {
                MapParticleField(
                    config = particleConfig.copy(
                        opacity = 0.2f,
                        glowEnabled = false,
                        speedMultiplier = 0.5f
                    ),
                    modifier = Modifier.fillMaxSize()
                )

                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .alpha(0.08f)
                        .background(ErrorRed)
                )

                FailedCornerBrackets()

                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .systemBarsPadding()
                        .padding(24.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Center
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.Start
                    ) {
                        TextButton(onClick = onBack, modifier = Modifier.size(48.dp)) {
                            Text("←", color = TextBody, fontSize = 22.sp)
                        }
                    }

                    Spacer(modifier = Modifier.height(8.dp))

                    LevelBreachedBadge()

                    Spacer(modifier = Modifier.height(8.dp))

                    Text(
                        text = uiState.levelName.uppercase(),
                        style = MaterialTheme.typography.labelMedium,
                        color = TextMuted,
                        letterSpacing = 3.sp,
                        fontWeight = FontWeight.SemiBold
                    )

                    Spacer(modifier = Modifier.height(20.dp))

                    RequirementsLabel(
                        wpm = uiState.finalWpm,
                        accuracy = uiState.finalAccuracy,
                        passWpm = uiState.passWpm,
                        passAccuracy = uiState.passAccuracy
                    )

                    Spacer(modifier = Modifier.height(16.dp))

                    FailedMetrics(
                        wpm = uiState.finalWpm,
                        accuracy = uiState.finalAccuracy
                    )

                    Spacer(modifier = Modifier.height(20.dp))

                    PartialXpBadge(
                        xpEarned = uiState.partialXp
                    )

                    Spacer(modifier = Modifier.weight(1f))

                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Button(
                            onClick = { onRetry(levelId) },
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(52.dp),
                            shape = RoundedCornerShape(12.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = ErrorRed)
                        ) {
                            Text(
                                text = "💀  RETRY",
                                color = TextWhite,
                                fontWeight = FontWeight.Bold,
                                letterSpacing = 2.sp
                            )
                        }

                        Spacer(modifier = Modifier.height(16.dp))

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

                    Spacer(modifier = Modifier.height(16.dp))
                }
            }
        }
    }
}

// ── Failed Corner Brackets ───────────────────────────────

@Composable
private fun FailedCornerBrackets() {
    Canvas(modifier = Modifier.fillMaxSize()) {
        val strokeW = 3.dp.toPx()
        val length = 60.dp.toPx()
        val offset = 16.dp.toPx()

        val color = ErrorRed.copy(alpha = 0.4f)

        // Top-left
        drawLine(color, Offset(offset, offset + length), Offset(offset, offset), strokeW)
        drawLine(color, Offset(offset, offset), Offset(offset + length, offset), strokeW)
        // Top-right
        drawLine(color, Offset(size.width - offset, offset + length), Offset(size.width - offset, offset), strokeW)
        drawLine(color, Offset(size.width - offset, offset), Offset(size.width - offset - length, offset), strokeW)
        // Bottom-left
        drawLine(color, Offset(offset, size.height - offset - length), Offset(offset, size.height - offset), strokeW)
        drawLine(color, Offset(offset, size.height - offset), Offset(offset + length, size.height - offset), strokeW)
        // Bottom-right
        drawLine(color, Offset(size.width - offset, size.height - offset - length), Offset(size.width - offset, size.height - offset), strokeW)
        drawLine(color, Offset(size.width - offset, size.height - offset), Offset(size.width - offset - length, size.height - offset), strokeW)
    }
}

// ── LEVEL BREACHED Badge ─────────────────────────────────

@Composable
private fun LevelBreachedBadge() {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Canvas(modifier = Modifier.width(180.dp).height(12.dp).alpha(0.5f)) {
            val path = Path().apply {
                moveTo(0f, size.height / 2f)
                lineTo(size.width * 0.3f, size.height * 0.2f)
                lineTo(size.width * 0.45f, size.height * 0.6f)
                lineTo(size.width * 0.6f, size.height * 0.3f)
                lineTo(size.width * 0.8f, size.height * 0.5f)
                lineTo(size.width, size.height * 0.4f)
            }
            drawPath(path, ErrorRed.copy(alpha = 0.6f), style = Stroke(2f))
            drawPath(path, ErrorRed.copy(alpha = 0.2f), style = Stroke(6f, cap = StrokeCap.Round))
        }

        Spacer(modifier = Modifier.height(4.dp))

        Text(
            text = "LEVEL",
            style = MaterialTheme.typography.headlineLarge,
            color = ErrorRed,
            fontWeight = FontWeight.Bold,
            letterSpacing = 6.sp,
            textAlign = TextAlign.Center,
            modifier = Modifier.shadow(8.dp, RoundedCornerShape(0.dp), ambientColor = ErrorRed, spotColor = ErrorRed)
        )
        Text(
            text = "BREACHED",
            style = MaterialTheme.typography.displaySmall,
            color = ErrorRed,
            fontWeight = FontWeight.Bold,
            letterSpacing = 4.sp,
            textAlign = TextAlign.Center,
            modifier = Modifier.shadow(12.dp, RoundedCornerShape(0.dp), ambientColor = ErrorRed, spotColor = ErrorRed)
        )
    }
}

// ── Requirements Not Met Label ───────────────────────────

@Composable
private fun RequirementsLabel(
    wpm: Int,
    accuracy: Int,
    passWpm: Int,
    passAccuracy: Int
) {
    // Determine which requirement(s) weren't met
    val wpmMet = wpm >= passWpm
    val accMet = accuracy >= passAccuracy
    val reason = when {
        !wpmMet && !accMet -> "WPM too slow · Accuracy too low"
        !wpmMet -> "WPM too slow"
        !accMet -> "Accuracy too low"
        else -> "Requirements not met"
    }

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp),
        shape = RoundedCornerShape(10.dp),
        colors = CardDefaults.cardColors(containerColor = SurfaceDark.copy(alpha = 0.6f)),
        border = BorderStroke(1.dp, ErrorRed.copy(alpha = 0.15f))
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = "REQUIREMENTS NOT MET",
                style = MaterialTheme.typography.labelSmall,
                color = ErrorRed,
                fontWeight = FontWeight.Bold,
                letterSpacing = 1.sp
            )
            Spacer(modifier = Modifier.height(4.dp))
            AnimatedContent(
                targetState = reason,
                transitionSpec = { fadeIn() togetherWith fadeOut() },
                label = "reasonText"
            ) { text ->
                Text(
                    text = text,
                    style = MaterialTheme.typography.bodySmall,
                    color = TextMuted,
                    textAlign = TextAlign.Center
                )
            }

            // Pass requirement breakdown
            Spacer(modifier = Modifier.height(6.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceEvenly
            ) {
                RequirementPill(
                    label = "WPM",
                    actual = wpm,
                    required = passWpm,
                    met = wpmMet
                )
                RequirementPill(
                    label = "ACC",
                    actual = accuracy,
                    required = passAccuracy,
                    met = accMet
                )
            }
        }
    }
}

@Composable
private fun RequirementPill(
    label: String,
    actual: Int,
    required: Int,
    met: Boolean
) {
    val color = if (met) SuccessGreen else ErrorRed
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(
            text = "$label: $actual / $required",
            style = MaterialTheme.typography.labelSmall,
            color = color,
            fontWeight = FontWeight.SemiBold
        )
        Text(
            text = if (met) "✓ PASS" else "✗ FAIL",
            style = MaterialTheme.typography.labelSmall,
            color = color.copy(alpha = 0.7f),
            fontSize = 9.sp
        )
    }
}

// ── Failed Metrics ───────────────────────────────────────

@Composable
private fun FailedMetrics(
    wpm: Int,
    accuracy: Int
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp),
        horizontalArrangement = Arrangement.SpaceEvenly
    ) {
        FailedMetricCard(
            value = "$wpm",
            label = "WPM",
            color = ErrorRed
        )
        FailedMetricCard(
            value = "$accuracy%",
            label = "ACCURACY",
            color = ErrorRed
        )
    }
}

@Composable
private fun FailedMetricCard(
    value: String,
    label: String,
    color: Color
) {
    Card(
        modifier = Modifier
            .width(140.dp)
            .height(70.dp),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(
            containerColor = SurfaceDark.copy(alpha = 0.4f)
        ),
        border = BorderStroke(1.dp, color.copy(alpha = 0.15f))
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(8.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Text(
                text = value,
                style = MaterialTheme.typography.headlineMedium,
                color = color.copy(alpha = 0.7f),
                fontWeight = FontWeight.Bold
            )
            Text(
                text = label,
                style = MaterialTheme.typography.labelSmall,
                color = TextDisabled,
                textAlign = TextAlign.Center
            )
        }
    }
}

// ── Partial XP Badge ─────────────────────────────────────

@Composable
private fun PartialXpBadge(xpEarned: Int) {
    val pulse by rememberInfiniteTransition(label = "xpPulse").animateFloat(
        initialValue = 0.15f,
        targetValue = 0.3f,
        animationSpec = infiniteRepeatable(
            animation = tween(1500, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "xpPulse"
    )

    Box(
        modifier = Modifier
            .clip(RoundedCornerShape(20.dp))
            .background(ErrorRed.copy(alpha = pulse))
            .padding(horizontal = 20.dp, vertical = 10.dp)
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text(
                text = "Partial XP Earned",
                style = MaterialTheme.typography.labelSmall,
                color = TextMuted,
                fontWeight = FontWeight.SemiBold
            )
            Spacer(modifier = Modifier.height(2.dp))
            Text(
                text = "+$xpEarned XP",
                style = MaterialTheme.typography.titleLarge,
                color = ErrorRed.copy(alpha = 0.8f),
                fontWeight = FontWeight.Bold
            )
        }
    }
}

// ── Loading State ────────────────────────────────────────

@Composable
private fun LevelFailedLoading() {
    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            CircularProgressIndicator(color = ErrorRed, modifier = Modifier.size(32.dp))
            Spacer(modifier = Modifier.height(16.dp))
            Text("Processing…", style = MaterialTheme.typography.bodyMedium, color = TextLabel)
        }
    }
}
