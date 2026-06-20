package com.typestrike.ui.home

import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.typestrike.ui.effects.MapParticleField
import com.typestrike.ui.effects.ParticleConfig
import com.typestrike.ui.theme.*
import kotlinx.coroutines.delay

// ── Main Screen ──────────────────────────────────────────

@Composable
fun HomeScreen(
    onPlay: () -> Unit = {},
    onJumpIn: (Int) -> Unit = {},
    onNavigateToStats: () -> Unit = {},
    onNavigateToSettings: () -> Unit = {},
    onNavigateToAchievements: () -> Unit = {},
    onNavigateToDailyChallenges: () -> Unit = {},
    onNavigateToLeaderboard: () -> Unit = {},
    viewModel: HomeViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()

    val particleConfig = remember {
        ParticleConfig.fromQuality(ParticleConfig.detect())
    }

    // Infinite flame pulse for the hero PLAY button
    val infiniteTransition = rememberInfiniteTransition(label = "heroPulse")
    val heroGlow by infiniteTransition.animateFloat(
        initialValue = 0.6f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(1200, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "heroGlow"
    )
    val heroScale by infiniteTransition.animateFloat(
        initialValue = 1f,
        targetValue = 1.04f,
        animationSpec = infiniteRepeatable(
            animation = tween(1200, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "heroScale"
    )

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Background)
    ) {
        // Particle field — active flame ambiance
        MapParticleField(
            config = particleConfig.copy(
                opacity = 0.35f,
                glowEnabled = true
            ),
            modifier = Modifier.fillMaxSize()
        )

        // Bottom glow gradient — feels like standing above lava
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(240.dp)
                .align(Alignment.BottomCenter)
                .background(
                    Brush.verticalGradient(
                        colors = listOf(
                            Color.Transparent,
                            MagmaRed.copy(alpha = 0.08f),
                            MagmaRed.copy(alpha = 0.15f)
                        )
                    )
                )
        )

        Column(
            modifier = Modifier
                .fillMaxSize()
                .systemBarsPadding()
                .padding(bottom = 8.dp),
            verticalArrangement = Arrangement.SpaceBetween
        ) {
            // ── Top Bar ──────────────────────────────
            HomeTopBar(
                onSettingsClick = onNavigateToSettings,
                streakCount = uiState.streakCount
            )

            // ── CENTER HERO: PLAY is the star ──────
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                // Player Crest (always visible, even for new players)
                PlayerCrest(
                    level = uiState.playerLevel,
                    title = uiState.playerTitle,
                    hasPlayer = uiState.hasPlayer
                )

                Spacer(modifier = Modifier.height(24.dp))

                // ── MASSIVE PLAY BUTTON ─────────────
                HeroPlayButton(
                    glow = heroGlow,
                    scale = heroScale,
                    onClick = {
                        if (uiState.hasPlayer) onPlay()
                        else onJumpIn(1)
                    }
                )

                Spacer(modifier = Modifier.height(20.dp))

                // ── Quick Stats (compact, visual) ───
                if (uiState.hasPlayer) {
                    HeroStatsRow(
                        bestWpm = uiState.todaysBestWpm,
                        totalStars = uiState.totalStars,
                        streakCount = uiState.streakCount,
                        levelsCleared = uiState.levelsCleared
                    )
                } else {
                    // New player: show mini value prop instead
                    NewPlayerPrompt()
                }

                Spacer(modifier = Modifier.height(14.dp))

                // ── Daily Challenge Badge ────────────
                if (uiState.hasPlayer) {
                    DailyBadge(
                        summary = uiState.dailyChallengeSummary,
                        onClick = onNavigateToDailyChallenges
                    )
                }
            }

            // ── BOTTOM NAV STRIP (compact, no emoji) ─
            BottomNavStrip(
                activeTab = "PLAY",
                onPlay = onPlay,
                onDaily = onNavigateToDailyChallenges,
                onAchievements = onNavigateToAchievements,
                onStats = onNavigateToStats
            )
        }
    }
}

// ── TOP BAR ──────────────────────────────────────────────

@Composable
private fun HomeTopBar(
    onSettingsClick: () -> Unit,
    streakCount: Int
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .height(48.dp)
            .padding(horizontal = 16.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        // Logo wordmark
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text(
                text = "TYPE",
                style = MaterialTheme.typography.titleMedium,
                color = TextBody,
                fontWeight = FontWeight.Bold,
                letterSpacing = 3.sp,
                fontSize = 14.sp
            )
            Text(
                text = "STRIKE",
                style = MaterialTheme.typography.titleMedium,
                color = MagmaRed,
                fontWeight = FontWeight.Black,
                letterSpacing = 3.sp,
                fontSize = 14.sp
            )
        }

        Row(verticalAlignment = Alignment.CenterVertically) {
            // Streak badge
            if (streakCount > 0) {
                StreakBadge(count = streakCount)
                Spacer(modifier = Modifier.width(8.dp))
            }
            // Settings
            Box(
                modifier = Modifier
                    .size(36.dp)
                    .clip(CircleShape)
                    .clickable(onClick = onSettingsClick),
                contentAlignment = Alignment.Center
            ) {
                Text("\u2699", fontSize = 18.sp, color = TextLabel)
            }
        }
    }
}

@Composable
private fun StreakBadge(count: Int) {
    val pulse by rememberInfiniteTransition(label = "streakPulse").animateFloat(
        initialValue = 0.6f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(tween(800), repeatMode = RepeatMode.Reverse),
        label = "streakPulse"
    )

    Row(
        verticalAlignment = Alignment.CenterVertically,
        modifier = Modifier
            .clip(RoundedCornerShape(6.dp))
            .background(MagmaRed.copy(alpha = 0.2f))
            .padding(horizontal = 6.dp, vertical = 2.dp)
    ) {
        Text(
            text = "\u26A1",
            fontSize = 14.sp,
            modifier = Modifier.alpha(pulse)
        )
        Spacer(modifier = Modifier.width(2.dp))
        Text(
            text = "$count",
            style = MaterialTheme.typography.labelSmall,
            color = MagmaRed,
            fontWeight = FontWeight.Bold,
            fontSize = 11.sp
        )
    }
}

// ── PLAYER CREST ─────────────────────────────────────────

@Composable
private fun PlayerCrest(
    level: Int,
    title: String,
    hasPlayer: Boolean
) {
    val crestPulse by rememberInfiniteTransition(label = "crestPulse").animateFloat(
        initialValue = 0.3f,
        targetValue = 0.6f,
        animationSpec = infiniteRepeatable(tween(2500), repeatMode = RepeatMode.Reverse),
        label = "crestPulse"
    )

    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = Modifier.padding(top = 4.dp)
    ) {
        if (hasPlayer) {
            // Level emblem — circular badge with glow
            Box(
                modifier = Modifier
                    .size(64.dp)
                    .shadow(
                        elevation = 12.dp,
                        shape = CircleShape,
                        ambientColor = MagmaRed.copy(alpha = crestPulse),
                        spotColor = MagmaRed.copy(alpha = crestPulse * 0.5f)
                    )
                    .clip(CircleShape)
                    .background(
                        Brush.radialGradient(
                            colors = listOf(MagmaRed, MagmaRedDark),
                            center = Offset(0.3f, 0.3f)
                        )
                    ),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = "$level",
                    style = MaterialTheme.typography.headlineLarge,
                    color = TextWhite,
                    fontWeight = FontWeight.Black,
                    fontSize = 26.sp
                )
            }

            Spacer(modifier = Modifier.height(8.dp))

            Text(
                text = title.uppercase(),
                style = MaterialTheme.typography.titleSmall,
                color = TextBody,
                fontWeight = FontWeight.Bold,
                letterSpacing = 4.sp,
                fontSize = 11.sp
            )
        } else {
            // No player yet: big welcome
            Text(
                text = "TYPE WITH FURY",
                style = MaterialTheme.typography.headlineLarge,
                color = TextWhite,
                fontWeight = FontWeight.Black,
                letterSpacing = 6.sp,
                fontSize = 24.sp,
                textAlign = TextAlign.Center
            )
            Spacer(modifier = Modifier.height(6.dp))
            Text(
                text = "STRIKE WITH FIRE",
                style = MaterialTheme.typography.titleMedium,
                color = MagmaRed,
                fontWeight = FontWeight.Bold,
                letterSpacing = 4.sp,
                fontSize = 12.sp,
                textAlign = TextAlign.Center
            )
        }
    }
}

// ── HERO PLAY BUTTON ─────────────────────────────────────

@Composable
private fun HeroPlayButton(
    glow: Float,
    scale: Float,
    onClick: () -> Unit
) {
    val interactionSource = remember { MutableInteractionSource() }
    val isPressed by interactionSource.collectIsPressedAsState()
    val pressScale by animateFloatAsState(
        targetValue = if (isPressed) 0.92f else 1f,
        animationSpec = tween(80),
        label = "playPressScale"
    )

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 12.dp)
            .height(64.dp)
            .scale(pressScale * scale)
            .shadow(
                elevation = (16f * glow).dp,
                shape = RoundedCornerShape(16.dp),
                ambientColor = MagmaRed,
                spotColor = MagmaRed.copy(alpha = 0.6f)
            )
            .clip(RoundedCornerShape(16.dp))
            .background(
                Brush.horizontalGradient(
                    colors = listOf(
                        MagmaRed,
                        MagmaRed.copy(red = 1f, green = 0.4f, blue = 0f)
                    )
                )
            )
            .clickable(
                interactionSource = interactionSource,
                indication = null,
                onClick = onClick
            ),
        contentAlignment = Alignment.Center
    ) {
        // Inner glow ring
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(2.dp)
                .clip(RoundedCornerShape(14.dp))
                .background(
                    Brush.horizontalGradient(
                        colors = listOf(
                            Color.White.copy(alpha = 0.08f * glow),
                            Color.Transparent,
                            Color.White.copy(alpha = 0.04f * glow)
                        )
                    )
                )
        )

        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.Center
        ) {
            // Flame icon (drawn, not emoji)
            Canvas(modifier = Modifier.size(22.dp)) {
                val path = androidx.compose.ui.graphics.Path().apply {
                    moveTo(size.width * 0.5f, size.height * 0.1f)
                    cubicTo(
                        size.width * 0.7f, size.height * 0.3f,
                        size.width * 0.8f, size.height * 0.6f,
                        size.width * 0.6f, size.height * 0.9f
                    )
                    cubicTo(
                        size.width * 0.5f, size.height * 0.75f,
                        size.width * 0.35f, size.height * 0.7f,
                        size.width * 0.3f, size.height * 0.6f
                    )
                    cubicTo(
                        size.width * 0.2f, size.height * 0.5f,
                        size.width * 0.3f, size.height * 0.2f,
                        size.width * 0.5f, size.height * 0.1f
                    )
                    close()
                }
                drawPath(path, Color.White.copy(alpha = 0.9f))
            }
            Spacer(modifier = Modifier.width(12.dp))
            Text(
                text = "STRIKE",
                style = MaterialTheme.typography.headlineMedium,
                color = TextWhite,
                fontWeight = FontWeight.Black,
                letterSpacing = 6.sp,
                fontSize = 22.sp
            )
        }
    }
}

// ── HERO STATS ROW ───────────────────────────────────────

@Composable
private fun HeroStatsRow(
    bestWpm: Int,
    totalStars: Int,
    streakCount: Int,
    levelsCleared: Int
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(6.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        HeroStat(value = "$bestWpm", label = "WPM", accent = MagmaRed, modifier = Modifier.weight(1f))
        HeroStat(value = "$totalStars", label = "STARS", accent = MoltenGold, modifier = Modifier.weight(1f))
        HeroStat(value = "$streakCount", label = "STREAK", accent = MagmaRed, modifier = Modifier.weight(1f))
        HeroStat(value = "$levelsCleared", label = "DONE", accent = NeonPurple, modifier = Modifier.weight(1f))
    }
}

@Composable
private fun HeroStat(
    value: String,
    label: String,
    accent: Color,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier
            .clip(RoundedCornerShape(10.dp))
            .background(Surface.copy(alpha = 0.5f))
            .padding(vertical = 8.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(
            text = value,
            style = MaterialTheme.typography.titleLarge,
            color = TextWhite,
            fontWeight = FontWeight.Black,
            fontSize = 18.sp
        )
        Text(
            text = label,
            style = MaterialTheme.typography.labelSmall,
            color = accent,
            fontWeight = FontWeight.Bold,
            fontSize = 8.sp,
            letterSpacing = 1.5.sp
        )
    }
}

// ── NEW PLAYER PROMPT ────────────────────────────────────

@Composable
private fun NewPlayerPrompt() {
    Row(
        modifier = Modifier
            .clip(RoundedCornerShape(10.dp))
            .background(Surface.copy(alpha = 0.4f))
            .padding(horizontal = 14.dp, vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier
                .size(6.dp)
                .clip(CircleShape)
                .background(MagmaRed.copy(alpha = 0.5f))
        )
        Spacer(modifier = Modifier.width(8.dp))
        Text(
            text = "100 LEVELS OF FIRE",
            style = MaterialTheme.typography.labelSmall,
            color = TextBody,
            fontWeight = FontWeight.Bold,
            letterSpacing = 2.sp,
            fontSize = 10.sp
        )
        Spacer(modifier = Modifier.width(8.dp))
        Box(
            modifier = Modifier
                .size(6.dp)
                .clip(CircleShape)
                .background(MagmaRed.copy(alpha = 0.5f))
        )
    }
}

// ── DAILY BADGE ──────────────────────────────────────────

@Composable
private fun DailyBadge(
    summary: DailyChallengeSummary,
    onClick: () -> Unit
) {
    val hasIncomplete = summary.hasIncomplete
    val glow by rememberInfiniteTransition(label = "dailyGlow").animateFloat(
        initialValue = 0.2f,
        targetValue = 0.5f,
        animationSpec = infiniteRepeatable(tween(1500), repeatMode = RepeatMode.Reverse),
        label = "dailyGlow"
    )

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(10.dp))
            .background(
                if (hasIncomplete) MagmaRed.copy(alpha = 0.08f)
                else Surface.copy(alpha = 0.4f)
            )
            .clickable(onClick = onClick)
            .padding(horizontal = 14.dp, vertical = 10.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Icon box
            Box(
                modifier = Modifier
                    .size(28.dp)
                    .clip(RoundedCornerShape(6.dp))
                    .background(
                        if (hasIncomplete) MagmaRed.copy(alpha = 0.2f)
                        else MoltenGold.copy(alpha = 0.15f)
                    ),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = if (summary.completed >= summary.total) "\uD83C\uDFC6" else "\uD83C\uDFAF",
                    fontSize = 13.sp
                )
            }

            Spacer(modifier = Modifier.width(10.dp))

            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = "DAILY CHALLENGES",
                    style = MaterialTheme.typography.labelSmall,
                    color = TextWhite,
                    fontWeight = FontWeight.Bold,
                    fontSize = 10.sp,
                    letterSpacing = 1.sp
                )
                if (hasIncomplete && summary.streakCount > 1) {
                    Text(
                        text = "${summary.completed}/${summary.total}  \u00D7${String.format("%.1f", summary.streakMultiplier)}x streak",
                        style = MaterialTheme.typography.labelSmall,
                        color = MagmaRed.copy(alpha = 0.7f),
                        fontSize = 9.sp
                    )
                }
            }

            // Mini progress dots
            Row(horizontalArrangement = Arrangement.spacedBy(3.dp)) {
                repeat(summary.total) { i ->
                    val filled = i < summary.completed
                    Box(
                        modifier = Modifier
                            .size(5.dp)
                            .clip(CircleShape)
                            .background(
                                if (filled) MagmaRed
                                else SurfaceBorder.copy(alpha = 0.3f)
                            )
                    )
                }
            }

            Spacer(modifier = Modifier.width(8.dp))

            Text(
                text = "\u2192",
                color = if (hasIncomplete) MagmaRed.copy(alpha = glow) else TextDisabled,
                fontSize = 16.sp,
                fontWeight = FontWeight.Bold
            )
        }
    }
}

// ── BOTTOM NAV STRIP ─────────────────────────────────────

@Composable
private fun BottomNavStrip(
    activeTab: String,
    onPlay: () -> Unit,
    onDaily: () -> Unit,
    onAchievements: () -> Unit,
    onStats: () -> Unit
) {
    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 12.dp),
        shape = RoundedCornerShape(14.dp),
        color = Surface.copy(alpha = 0.85f),
        tonalElevation = 0.dp,
        shadowElevation = 8.dp
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .height(52.dp),
            horizontalArrangement = Arrangement.SpaceEvenly,
            verticalAlignment = Alignment.CenterVertically
        ) {
            NavTab("PLAY", activeTab == "PLAY", MagmaRed, onClick = onPlay)
            NavTab("DAILY", activeTab == "DAILY", MoltenGold, onClick = onDaily)
            NavTab("FEATS", activeTab == "FEATS", NeonPurple, onClick = onAchievements)
            NavTab("STATS", activeTab == "STATS", TextBody, onClick = onStats)
        }
    }
}

@Composable
private fun NavTab(
    label: String,
    isActive: Boolean,
    accent: Color,
    onClick: () -> Unit
) {
    val interactionSource = remember { MutableInteractionSource() }
    val isPressed by interactionSource.collectIsPressedAsState()

    Box(
        modifier = Modifier
            .clip(RoundedCornerShape(8.dp))
            .then(
                if (isActive) Modifier.background(accent.copy(alpha = 0.12f))
                else Modifier
            )
            .clickable(
                interactionSource = interactionSource,
                indication = null,
                onClick = onClick
            )
            .padding(horizontal = 16.dp, vertical = 8.dp),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = label,
            style = MaterialTheme.typography.labelSmall,
            color = if (isActive) accent else TextDisabled,
            fontWeight = if (isActive) FontWeight.Black else FontWeight.Bold,
            letterSpacing = 2.sp,
            fontSize = 11.sp
        )
    }
}

