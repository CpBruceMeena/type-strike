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
    LaunchedEffect(Unit) {
        delay(1200)
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

        CentralEmber()

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
                Text(
                    text = "type-",
                    style = MaterialTheme.typography.displayLarge,
                    color = TextBody,
                    fontWeight = FontWeight.Normal,
                    letterSpacing = -4.sp
                )
                Text(
                    text = "strike",
                    style = MaterialTheme.typography.displayLarge,
                    color = MagmaRed,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = -4.sp,
                    modifier = Modifier.shadow(12.dp, RoundedCornerShape(0.dp), ambientColor = MagmaRed.copy(alpha = 0.3f), spotColor = MagmaRed.copy(alpha = 0.3f))
                )
            }

            // ── Tagline ─────────────────────────────────
            Spacer(modifier = Modifier.height(16.dp))
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

            Spacer(modifier = Modifier.weight(1f))

            // ── Loading Indicator ────────────────────────
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                modifier = Modifier.padding(bottom = 48.dp)
            ) {
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

// ── Central Ember Glow ───────────────────────────────────

@Composable
private fun CentralEmber() {
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
            .alpha(pulseAlpha)
            .clip(RoundedCornerShape(100.dp))
            .background(MagmaRed.copy(alpha = 0.15f))
    )
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
