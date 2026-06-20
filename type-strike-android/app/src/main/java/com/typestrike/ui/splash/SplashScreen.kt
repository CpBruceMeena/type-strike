package com.typestrike.ui.splash

import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.background
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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.typestrike.ui.effects.*
import com.typestrike.ui.theme.*
import kotlinx.coroutines.delay

// ── Main Splash Screen ───────────────────────────────────

@Composable
fun SplashScreen(
    onSplashComplete: () -> Unit = {}
) {
    // ── Animation phases ──────────────────────────────
    var phase by remember { mutableIntStateOf(0) }

    LaunchedEffect(Unit) {
        // Phase 1: Particle fade in + ember glow
        delay(300); phase = 1
        // Phase 2: "type-" appears (letter by letter)
        delay(400); phase = 2
        // Phase 3: "strike" appears (letter by letter, with strike impact)
        delay(600); phase = 3
        // Phase 4: Tagline fades in
        delay(500); phase = 4
        // Phase 5: Loading indicator + minimum display time
        delay(500); phase = 5
        // Phase 6: Hold for minimum total splash time (~2.5s)
        delay(800); phase = 6
        // Navigate to Home
        onSplashComplete()
    }

    val particleConfig = remember {
        ParticleConfig.fromQuality(ParticleConfig.detect())
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Background),
        contentAlignment = Alignment.Center
    ) {
        // Particle background (subdued, slow)
        MapParticleField(
            config = particleConfig.copy(
                particleCount = (particleConfig.particleCount * 0.6f).toInt(),
                speedMultiplier = 0.4f,
                opacity = 0.3f,
                glowEnabled = true
            ),
            modifier = Modifier.fillMaxSize()
        )

        // Central glow ember
        if (phase >= 1) {
            CentralEmber(phase = phase)
        }

        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center,
            modifier = Modifier
                .fillMaxSize()
                .systemBarsPadding()
        ) {
            Spacer(modifier = Modifier.weight(1f))

            // ── "type-strike" Logo ──────────────────────
            Row(
                horizontalArrangement = Arrangement.Center,
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier.fillMaxWidth()
            ) {
                // "type-"
                if (phase >= 2) {
                    TypeLetters(
                        text = "type-",
                        phase = phase,
                        startDelay = 0,
                        color = TextBody
                    )
                }

                // "strike"
                if (phase >= 3) {
                    TypeLetters(
                        text = "strike",
                        phase = phase,
                        startDelay = 0,
                        color = MagmaRed,
                        isStrike = true
                    )
                }
            }

            // ── Tagline ─────────────────────────────────
            Spacer(modifier = Modifier.height(16.dp))
            AnimatedVisibility(
                visible = phase >= 4,
                enter = androidx.compose.animation.fadeIn(tween(600)) +
                        androidx.compose.animation.slideInVertically(tween(400)) { it / 2 },
                exit = androidx.compose.animation.fadeOut(tween(200))
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(
                        text = "\"Type with fury.",
                        style = MaterialTheme.typography.bodyMedium,
                        color = TextMuted,
                        fontWeight = FontWeight.Light,
                        letterSpacing = 2.sp,
                        textAlign = TextAlign.Center
                    )
                    Text(
                        text = "Strike with fire.\"",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MagmaRed.copy(alpha = 0.7f),
                        fontWeight = FontWeight.Light,
                        letterSpacing = 2.sp,
                        textAlign = TextAlign.Center
                    )
                }
            }

            Spacer(modifier = Modifier.weight(1f))

            // ── Loading Indicator ────────────────────────
            AnimatedVisibility(
                visible = phase >= 5,
                enter = androidx.compose.animation.fadeIn(tween(400)),
                exit = androidx.compose.animation.fadeOut(tween(200))
            ) {
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    modifier = Modifier.padding(bottom = 48.dp)
                ) {
                    // Pulsing dot trio
                    Row(
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        repeat(3) { index ->
                            PulsingDot(
                                delayMs = index * 200,
                                color = MagmaRed
                            )
                        }
                    }
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "Igniting…",
                        style = MaterialTheme.typography.labelSmall,
                        color = TextDisabled,
                        letterSpacing = 1.sp
                    )
                }
            }
        }
    }
}

// ── Central Ember Glow ───────────────────────────────────

@Composable
private fun CentralEmber(phase: Int) {
    val glowScale by animateFloatAsState(
        targetValue = if (phase >= 1) 1f else 0f,
        animationSpec = tween(1000, easing = FastOutSlowInEasing),
        label = "emberGlowScale"
    )

    val infiniteTransition = rememberInfiniteTransition(label = "emberPulse")
    val pulseAlpha by infiniteTransition.animateFloat(
        initialValue = 0.08f,
        targetValue = 0.2f,
        animationSpec = infiniteRepeatable(
            animation = tween(2000, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "emberPulse"
    )

    Box(
        modifier = Modifier
            .size(200.dp)
            .scale(glowScale)
            .alpha(pulseAlpha)
            .clip(RoundedCornerShape(100.dp))
            .background(MagmaRed.copy(alpha = 0.15f))
    )
}

// ─── Type Letters ────────────────────────────────────────

@Composable
private fun TypeLetters(
    text: String,
    phase: Int,
    startDelay: Int,
    color: androidx.compose.ui.graphics.Color,
    isStrike: Boolean = false
) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        text.forEachIndexed { index, char ->
            val charDelay = startDelay + index * 80
            val charVisible = phase >= 2 && (phase >= 3 || index < 5) // "type-" shows in phase 2, "strike" in phase 3

            if (charVisible) {
                val charScale by animateFloatAsState(
                    targetValue = if (charVisible) 1f else 0f,
                    animationSpec = spring(
                        dampingRatio = if (isStrike) 0.3f else 0.5f,
                        stiffness = if (isStrike) 400f else 250f
                    ),
                    label = "charScale_${char}_$index"
                )

                val shadowGlow = if (isStrike) {
                    Modifier.shadow(
                        elevation = (8f + index * 2).dp,
                        shape = RoundedCornerShape(0.dp),
                        ambientColor = MagmaRed.copy(alpha = 0.3f),
                        spotColor = MagmaRed.copy(alpha = 0.3f)
                    )
                } else Modifier

                Text(
                    text = char.toString(),
                    style = MaterialTheme.typography.displayLarge,
                    color = color,
                    fontWeight = if (isStrike) FontWeight.Bold else FontWeight.Normal,
                    letterSpacing = if (isStrike && index == 0) 0.sp else (-4).sp,
                    modifier = Modifier
                        .scale(charScale)
                        .then(shadowGlow)
                )
            }
        }
    }
}

// ── Pulsing Dot ──────────────────────────────────────────

@Composable
private fun PulsingDot(
    delayMs: Int,
    color: androidx.compose.ui.graphics.Color
) {
    val infiniteTransition = rememberInfiniteTransition(label = "dotPulse_$delayMs")
    val dotAlpha by infiniteTransition.animateFloat(
        initialValue = 0.2f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(600, delayMillis = delayMs, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "dotAlpha_$delayMs"
    )

    Box(
        modifier = Modifier
            .size(6.dp)
            .clip(RoundedCornerShape(3.dp))
            .background(color.copy(alpha = dotAlpha))
    )
}
