package com.typestrike.ui.home

import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.draw.shadow
import androidx.compose.foundation.BorderStroke
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.typestrike.ui.util.Achievement
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

    var entranceStarted by remember { mutableStateOf(false) }
    LaunchedEffect(Unit) {
        delay(100)
        entranceStarted = true
        viewModel.startEntrance()
    }

    val particleConfig = remember {
        ParticleConfig.fromQuality(ParticleConfig.detect())
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Background)
    ) {
        MapParticleField(
            config = particleConfig.copy(opacity = 0.25f),
            modifier = Modifier.fillMaxSize()
        )

        Column(
            modifier = Modifier
                .fillMaxSize()
                .systemBarsPadding()
                .statusBarsPadding()
                .navigationBarsPadding()
        ) {
            // ── Top bar with animated logo ────────────
            EntranceFadeSlide(entranceStarted, delayMs = 0) {
                HomeTopBar(
                    onSettingsClick = onNavigateToSettings,
                    streakCount = uiState.streakCount
                )
            }

            // ── Scrollable content ────────────────────
            Column(
                modifier = Modifier
                    .weight(1f)
                    .fillMaxWidth(),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Spacer(modifier = Modifier.weight(0.06f))

                // ── Welcome Hero or Enhanced Player Card ──
                if (!uiState.hasPlayer) {
                    WelcomeHero(entranceStarted = entranceStarted)
                } else {
                    EnhancedPlayerCard(
                        level = uiState.playerLevel,
                        title = uiState.playerTitle,
                        totalStars = uiState.totalStars,
                        xp = uiState.xp,
                        xpForNext = uiState.xpForNext,
                        xpProgress = uiState.xpProgress,
                        entranceStarted = entranceStarted
                    )
                }

                Spacer(modifier = Modifier.weight(0.08f))

                // ── JUMP IN Button ────────────────────
                EntranceFadeSlide(entranceStarted, delayMs = 300) {
                    JumpInButton(
                        subLabel = viewModel.jumpInLabel(),
                        onClick = { onJumpIn(viewModel.getNextLevelId()) }
                    )
                }

                Spacer(modifier = Modifier.weight(0.06f))

                // ── Daily Challenge Card ──────────────
                if (uiState.hasPlayer) {
                    EntranceFadeSlide(entranceStarted, delayMs = 500) {
                        DailyChallengeHomeCard(
                            summary = uiState.dailyChallengeSummary,
                            onClick = onNavigateToDailyChallenges
                        )
                    }
                    Spacer(modifier = Modifier.weight(0.06f))
                }

                // ── Achievement Spotlight ─────────────
                if (uiState.hasPlayer && uiState.spotlightAchievement != null) {
                    EntranceFadeSlide(entranceStarted, delayMs = 700) {
                        AchievementSpotlightCard(
                            achievement = uiState.spotlightAchievement!!,
                            onClick = onNavigateToAchievements
                        )
                    }
                    Spacer(modifier = Modifier.weight(0.06f))
                }

                // ── Bottom breathing room ─────────────
                Spacer(modifier = Modifier.weight(0.08f))
            }

            // Bottom Navigation Bar
            EntranceFadeSlide(entranceStarted, delayMs = 850) {
                QuickActionRow(
                    onDailyChallengesClick = onNavigateToDailyChallenges,
                    onAchievementsClick = onNavigateToAchievements,
                    onStatsClick = onNavigateToStats,
                    onLeaderboardClick = onNavigateToLeaderboard
                )
            }

            EntranceFadeSlide(entranceStarted, delayMs = 900) {
                HomeNavBar(
                    activeTab = "Home",
                    onPlayClick = onPlay,
                    onStatsClick = onNavigateToStats
                )
            }
        }
    }
}

// ── Top Bar (with animated logo) ─────────────────────────

@Composable
private fun HomeTopBar(
    onSettingsClick: () -> Unit,
    streakCount: Int = 0
) {
    // Pulsing glow on the flame logo
    val infiniteTransition = rememberInfiniteTransition(label = "logoGlow")
    val glowAlpha by infiniteTransition.animateFloat(
        initialValue = 0.5f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(2000, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "logoGlowAlpha"
    )
    val logoScale by infiniteTransition.animateFloat(
        initialValue = 0.98f,
        targetValue = 1.02f,
        animationSpec = infiniteRepeatable(
            animation = tween(2000, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "logoScale"
    )

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .height(44.dp)
            .padding(horizontal = 14.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text(
                text = "🔥",
                fontSize = 18.sp,
                modifier = Modifier
                    .alpha(glowAlpha)
                    .scale(logoScale)
            )
            Spacer(modifier = Modifier.width(6.dp))
            Text(
                text = "type-strike",
                style = MaterialTheme.typography.titleMedium,
                color = TextWhite,
                fontWeight = FontWeight.Bold,
                letterSpacing = 1.sp
            )
        }
        Row(verticalAlignment = Alignment.CenterVertically) {
            // Streak display
            if (streakCount > 0) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier
                        .clip(RoundedCornerShape(8.dp))
                        .background(MagmaRed.copy(alpha = 0.15f))
                        .padding(horizontal = 8.dp, vertical = 2.dp)
                ) {
                    Text("🔥", fontSize = 13.sp)
                    Spacer(modifier = Modifier.width(3.dp))
                    Text(
                        text = "$streakCount",
                        style = MaterialTheme.typography.labelMedium,
                        color = MagmaRed,
                        fontWeight = FontWeight.Bold
                    )
                }
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
                Text("⚙", fontSize = 18.sp, color = TextLabel)
            }
        }
    }
}

// ── Welcome Hero (new users) ─────────────────────────────

@Composable
private fun WelcomeHero(entranceStarted: Boolean) {
    EntranceFadeSlide(entranceStarted, delayMs = 120) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            modifier = Modifier.padding(horizontal = 24.dp)
        ) {
            Text(
                text = "TYPE WITH FURY",
                style = MaterialTheme.typography.headlineLarge,
                fontSize = 28.sp,
                color = TextWhite,
                fontWeight = FontWeight.Bold,
                letterSpacing = 4.sp,
                textAlign = TextAlign.Center
            )
            Spacer(modifier = Modifier.height(6.dp))
            Text(
                text = "Strike through 100 levels of fire, magma, and obsidian.\nEach level challenges your speed & precision.",
                style = MaterialTheme.typography.bodySmall,
                color = TextMuted,
                textAlign = TextAlign.Center,
                lineHeight = 18.sp
            )
        }
    }
}

// ── Enhanced Player Card (with circular XP arc) ──────────

@Composable
private fun EnhancedPlayerCard(
    level: Int,
    title: String,
    totalStars: Int,
    xp: Int,
    xpForNext: Int,
    xpProgress: Float,
    entranceStarted: Boolean
) {
    EntranceFadeSlide(entranceStarted, delayMs = 120) {
        val glowTransition = rememberInfiniteTransition(label = "cardGlow")
        val borderGlow by glowTransition.animateFloat(
            initialValue = 0.3f,
            targetValue = 0.6f,
            animationSpec = infiniteRepeatable(
                animation = tween(2000, easing = FastOutSlowInEasing),
                repeatMode = RepeatMode.Reverse
            ),
            label = "cardBorderGlow"
        )

        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp),
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = Surface.copy(alpha = 0.85f)),
            border = BorderStroke(1.dp, MagmaRed.copy(alpha = borderGlow * 0.5f)),
            elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 14.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                // ── Circular XP arc ─────────────────
                Box(
                    modifier = Modifier.size(56.dp),
                    contentAlignment = Alignment.Center
                ) {
                    val animProgress by animateFloatAsState(
                        targetValue = xpProgress.coerceIn(0f, 1f),
                        animationSpec = tween(1200, easing = FastOutSlowInEasing),
                        label = "xpArcAnim"
                    )
                    Canvas(modifier = Modifier.fillMaxSize()) {
                        val strokeW = 4.dp.toPx()
                        val arcSize = Size(size.width - strokeW, size.height - strokeW)
                        val arcTopLeft = Offset(strokeW / 2f, strokeW / 2f)

                        // Background ring
                        drawArc(
                            brush = SolidColor(SurfaceBorder.copy(alpha = 0.3f)),
                            startAngle = -90f,
                            sweepAngle = 360f,
                            useCenter = false,
                            topLeft = arcTopLeft,
                            size = arcSize,
                            style = Stroke(width = strokeW, cap = StrokeCap.Round)
                        )
                        // Progress ring
                        drawArc(
                            brush = Brush.sweepGradient(
                                colors = listOf(MagmaRed, MoltenGold, MagmaRed),
                                center = Offset(size.width / 2f, size.height / 2f)
                            ),
                            startAngle = -90f,
                            sweepAngle = 360f * animProgress,
                            useCenter = false,
                            topLeft = arcTopLeft,
                            size = arcSize,
                            style = Stroke(width = strokeW, cap = StrokeCap.Round)
                        )
                    }
                    // Level number in center
                    Text(
                        text = "$level",
                        style = MaterialTheme.typography.titleLarge,
                        color = TextWhite,
                        fontWeight = FontWeight.Bold
                    )
                }

                Spacer(modifier = Modifier.width(14.dp))

                // ── Player info ─────────────────────
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = title.uppercase(),
                        style = MaterialTheme.typography.titleMedium,
                        color = TextWhite,
                        fontWeight = FontWeight.Bold,
                        maxLines = 1
                    )
                    Spacer(modifier = Modifier.height(2.dp))
                    Text(
                        text = "$xp / $xpForNext XP",
                        style = MaterialTheme.typography.labelSmall,
                        color = TextMuted
                    )
                }

                // ── Stars ──────────────────────────
                Column(horizontalAlignment = Alignment.End) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(
                            text = "★",
                            color = MoltenGold,
                            fontSize = 16.sp,
                            modifier = Modifier.shadow(3.dp, RoundedCornerShape(0.dp), spotColor = MoltenGold.copy(alpha = 0.4f))
                        )
                        Spacer(modifier = Modifier.width(3.dp))
                        Text(
                            text = "$totalStars",
                            style = MaterialTheme.typography.titleMedium,
                            color = MoltenGold,
                            fontWeight = FontWeight.Bold
                        )
                    }
                    // XP label below stars
                    val xpPercent = (xpProgress * 100).toInt()
                    Text(
                        text = "$xpPercent%",
                        style = MaterialTheme.typography.labelSmall,
                        color = MagmaRed.copy(alpha = 0.7f),
                        fontWeight = FontWeight.SemiBold
                    )
                }
            }
        }
    }
}

// ── Daily Challenge Home Card ────────────────────────────

@Composable
private fun DailyChallengeHomeCard(
    summary: DailyChallengeSummary,
    onClick: () -> Unit
) {
    val infiniteTransition = rememberInfiniteTransition(label = "dcGlow")
    val glowAlpha by infiniteTransition.animateFloat(
        initialValue = 0.15f,
        targetValue = 0.35f,
        animationSpec = infiniteRepeatable(
            animation = tween(1800, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "dcGlowAlpha"
    )

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp)
            .clickable(onClick = onClick),
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(containerColor = Surface.copy(alpha = 0.85f)),
        border = BorderStroke(1.dp, MoltenGold.copy(alpha = if (summary.hasIncomplete) glowAlpha else 0.1f)),
        elevation = CardDefaults.cardElevation(defaultElevation = 3.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(14.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // ── Left icon area ──────────────────────
            Box(
                modifier = Modifier
                    .size(44.dp)
                    .clip(RoundedCornerShape(12.dp))
                    .background(
                        Brush.linearGradient(
                            colors = if (summary.completed >= summary.total)
                                listOf(MoltenGold, MoltenGold.copy(alpha = 0.4f))
                            else
                                listOf(MagmaRed, MagmaRedDark)
                        )
                    ),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = if (summary.completed >= summary.total) "🏆" else "🎯",
                    fontSize = 20.sp
                )
            }

            Spacer(modifier = Modifier.width(12.dp))

            // ── Info ────────────────────────────────
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = "DAILY CHALLENGES",
                    style = MaterialTheme.typography.labelMedium,
                    color = TextWhite,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 1.sp
                )
                Spacer(modifier = Modifier.height(2.dp))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        text = "${summary.completed} / ${summary.total} complete",
                        style = MaterialTheme.typography.bodySmall,
                        color = TextBody
                    )
                    if (summary.streakCount > 1) {
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "🔥 ×${String.format("%.1f", summary.streakMultiplier)}",
                            style = MaterialTheme.typography.labelSmall,
                            color = MagmaRed,
                            fontWeight = FontWeight.Bold,
                            fontSize = 10.sp
                        )
                    }
                }

                // Mini progress dots
                Spacer(modifier = Modifier.height(6.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                    repeat(summary.total) { i ->
                        val filled = i < summary.completed
                        Box(
                            modifier = Modifier
                                .size(8.dp)
                                .clip(CircleShape)
                                .background(
                                    if (filled) MagmaRed
                                    else SurfaceBorder.copy(alpha = 0.3f)
                                )
                        )
                    }
                }
            }

            // ── Play button ─────────────────────────
            if (summary.hasIncomplete) {
                val pulse by infiniteTransition.animateFloat(
                    initialValue = 0.9f,
                    targetValue = 1f,
                    animationSpec = infiniteRepeatable(
                        animation = tween(1200, easing = FastOutSlowInEasing),
                        repeatMode = RepeatMode.Reverse
                    ),
                    label = "dcBtnPulse"
                )
                Box(
                    modifier = Modifier
                        .size(40.dp)
                        .scale(pulse)
                        .clip(CircleShape)
                        .background(MagmaRed),
                    contentAlignment = Alignment.Center
                ) {
                    Text("▶", color = TextWhite, fontSize = 16.sp, modifier = Modifier.padding(start = 2.dp))
                }
            } else {
                Box(
                    modifier = Modifier
                        .size(40.dp)
                        .clip(CircleShape)
                        .background(MoltenGold.copy(alpha = 0.15f)),
                    contentAlignment = Alignment.Center
                ) {
                    Text("✓", color = MoltenGold, fontSize = 18.sp, fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}

// ── Achievement Spotlight Card ───────────────────────────

@Composable
private fun AchievementSpotlightCard(
    achievement: Achievement,
    onClick: () -> Unit
) {
    val isUnlocked = achievement.isUnlocked
    val accentColor = if (isUnlocked) MoltenGold else MagmaRed

    val infiniteTransition = rememberInfiniteTransition(label = "achGlow")
    val progressPulse by infiniteTransition.animateFloat(
        initialValue = 0.15f,
        targetValue = 0.35f,
        animationSpec = infiniteRepeatable(
            animation = tween(2000, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "achProgressPulse"
    )

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp)
            .clickable(onClick = onClick),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = Surface.copy(alpha = 0.7f)),
        border = BorderStroke(1.dp, accentColor.copy(alpha = if (isUnlocked) 0.2f else 0.1f))
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Icon
            Box(
                modifier = Modifier
                    .size(36.dp)
                    .clip(RoundedCornerShape(8.dp))
                    .background(
                        if (isUnlocked) MoltenGold.copy(alpha = 0.15f)
                        else accentColor.copy(alpha = if (achievement.progress > 0) progressPulse else 0.05f)
                    ),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = achievement.icon,
                    fontSize = 16.sp,
                    modifier = Modifier.alpha(if (isUnlocked) 1f else 0.6f)
                )
            }

            Spacer(modifier = Modifier.width(10.dp))

            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = if (isUnlocked) "★ UNLOCKED" else "NEXT ACHIEVEMENT",
                    style = MaterialTheme.typography.labelSmall,
                    color = if (isUnlocked) MoltenGold else TextMuted,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 1.sp,
                    fontSize = 9.sp
                )
                Spacer(modifier = Modifier.height(1.dp))
                Text(
                    text = achievement.title,
                    style = MaterialTheme.typography.bodyMedium,
                    color = TextWhite,
                    fontWeight = FontWeight.Bold,
                    maxLines = 1
                )
                Spacer(modifier = Modifier.height(1.dp))
                Text(
                    text = achievement.description,
                    style = MaterialTheme.typography.labelSmall,
                    color = TextMuted,
                    fontSize = 10.sp,
                    maxLines = 1
                )
            }

            // Progress or checkmark
            if (isUnlocked) {
                Text("✓", color = MoltenGold, fontSize = 20.sp, fontWeight = FontWeight.Bold)
            } else if (achievement.progress > 0f) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Box(
                        modifier = Modifier
                            .size(32.dp)
                            .clip(CircleShape)
                            .background(accentColor.copy(alpha = 0.1f)),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "${(achievement.progress * 100).toInt()}%",
                            style = MaterialTheme.typography.labelSmall,
                            color = accentColor,
                            fontWeight = FontWeight.Bold,
                            fontSize = 9.sp
                        )
                    }
                    if (achievement.progressText.isNotBlank()) {
                        Text(
                            text = achievement.progressText,
                            style = MaterialTheme.typography.labelSmall,
                            color = TextDisabled,
                            fontSize = 7.sp
                        )
                    }
                }
            } else {
                Text("🔒", fontSize = 16.sp, modifier = Modifier.alpha(0.4f))
            }
        }
    }
}

// ── JUMP IN Button ───────────────────────────────────────

@Composable
private fun JumpInButton(
    subLabel: String,
    onClick: () -> Unit
) {
    val infiniteTransition = rememberInfiniteTransition(label = "jumpInGlow")
    val glowAlpha by infiniteTransition.animateFloat(
        initialValue = 0.25f,
        targetValue = 0.55f,
        animationSpec = infiniteRepeatable(
            animation = tween(2000, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "jumpInGlow"
    )
    val pulseScale by infiniteTransition.animateFloat(
        initialValue = 1f,
        targetValue = 1.03f,
        animationSpec = infiniteRepeatable(
            animation = tween(2000, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "jumpInScale"
    )

    Box(
        modifier = Modifier
            .padding(horizontal = 16.dp)
            .fillMaxWidth()
    ) {
        Box(
            modifier = Modifier
                .matchParentSize()
                .padding(horizontal = 8.dp, vertical = 8.dp)
                .clip(RoundedCornerShape(12.dp))
                .alpha(glowAlpha)
                .background(MagmaRed)
        )
        Button(
            onClick = onClick,
            modifier = Modifier
                .fillMaxWidth()
                .height(54.dp)
                .scale(pulseScale),
            shape = RoundedCornerShape(12.dp),
            colors = ButtonDefaults.buttonColors(containerColor = MagmaRed),
            elevation = ButtonDefaults.buttonElevation(defaultElevation = 6.dp)
        ) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text("🔥", fontSize = 18.sp)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "JUMP IN",
                        style = MaterialTheme.typography.titleMedium,
                        color = TextWhite,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 2.sp
                    )
                }
                Text(
                    text = subLabel,
                    style = MaterialTheme.typography.labelSmall,
                    color = TextWhite.copy(alpha = 0.6f),
                    letterSpacing = 0.5.sp
                )
            }
        }
    }
}

// ── Quick Action Row (compact nav buttons) ───────────────

@Composable
private fun QuickActionRow(
    onDailyChallengesClick: () -> Unit,
    onAchievementsClick: () -> Unit,
    onStatsClick: () -> Unit,
    onLeaderboardClick: () -> Unit = {}
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp),
        horizontalArrangement = Arrangement.spacedBy(6.dp)
    ) {
        QuickActionChip("🎯", "Daily", MagmaRed, onDailyChallengesClick, Modifier.weight(1f))
        QuickActionChip("🏆", "Feats", TextBody, onAchievementsClick, Modifier.weight(1f))
        QuickActionChip("📊", "Stats", TextBody, onStatsClick, Modifier.weight(1f))
        QuickActionChip("🏅", "Rank", MoltenGold, onLeaderboardClick, Modifier.weight(1f))
    }
}

@Composable
private fun QuickActionChip(
    icon: String,
    label: String,
    color: Color,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    OutlinedButton(
        onClick = onClick,
        modifier = modifier.height(34.dp),
        shape = RoundedCornerShape(8.dp),
        colors = ButtonDefaults.outlinedButtonColors(contentColor = color),
        border = BorderStroke(1.dp, color.copy(alpha = if (color == MagmaRed) 0.35f else 0.15f)),
        contentPadding = PaddingValues(horizontal = 6.dp, vertical = 0.dp)
    ) {
        Text(text = icon, fontSize = 12.sp)
        Spacer(modifier = Modifier.width(3.dp))
        Text(
            text = label,
            style = MaterialTheme.typography.labelSmall,
            fontWeight = if (color == MagmaRed) FontWeight.Bold else FontWeight.SemiBold,
            fontSize = 10.sp,
            letterSpacing = 0.5.sp
        )
    }
}

// ── Navigation Bar ───────────────────────────────────────

@Composable
private fun HomeNavBar(
    activeTab: String,
    onPlayClick: () -> Unit,
    onStatsClick: () -> Unit
) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        color = Background,
        tonalElevation = 0.dp,
        shadowElevation = 6.dp
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .height(56.dp)
                .background(Background)
                .padding(bottom = 4.dp),
            horizontalArrangement = Arrangement.SpaceEvenly,
            verticalAlignment = Alignment.CenterVertically
        ) {
            NavTab("🏠", "Home", activeTab == "Home", onClick = {})
            NavTab("🗺", "Play", activeTab == "Play", onClick = onPlayClick)
            NavTab("📊", "Stats", activeTab == "Stats", onClick = onStatsClick)
        }
    }
}

@Composable
private fun NavTab(
    icon: String,
    label: String,
    isActive: Boolean,
    onClick: () -> Unit
) {
    val color = if (isActive) MagmaRed else TextDisabled.copy(alpha = 0.6f)
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = Modifier
            .size(56.dp)
            .padding(2.dp)
            .clickable(onClick = onClick)
    ) {
        Box(
            modifier = Modifier
                .width(if (isActive) 16.dp else 0.dp)
                .height(3.dp)
                .clip(RoundedCornerShape(1.5.dp))
                .background(MagmaRed)
        )
        Spacer(modifier = Modifier.height(2.dp))
        Text(text = icon, fontSize = 18.sp, color = color)
        Text(
            text = label,
            style = MaterialTheme.typography.labelSmall,
            color = color,
            fontWeight = if (isActive) FontWeight.Bold else FontWeight.Normal
        )
    }
}

// ── Entrance Animation ───────────────────────────────────

@Composable
@OptIn(ExperimentalAnimationApi::class)
private fun EntranceFadeSlide(
    visible: Boolean,
    delayMs: Int,
    modifier: Modifier = Modifier,
    content: @Composable () -> Unit
) {
    val state = remember { MutableTransitionState(false) }
    LaunchedEffect(visible) {
        state.targetState = visible
    }
    AnimatedContent(
        targetState = state.targetState,
        transitionSpec = {
            val d = delayMs.toLong()
            val enter = slideInVertically(
                animationSpec = tween(500, delayMillis = d.toInt(), easing = FastOutSlowInEasing),
                initialOffsetY = { it / 2 }
            ) + fadeIn(animationSpec = tween(300, delayMillis = d.toInt()))
            val exit = slideOutVertically(
                animationSpec = tween(300),
                targetOffsetY = { it / 2 }
            ) + fadeOut(tween(200))
            enter togetherWith exit
        },
        modifier = modifier,
        label = "entrance_$delayMs"
    ) { targetState ->
        if (targetState) {
            content()
        }
    }
}
