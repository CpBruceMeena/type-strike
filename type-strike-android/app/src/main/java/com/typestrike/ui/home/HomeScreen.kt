package com.typestrike.ui.home

import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
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

            // ── Dashboard content (scrollable, no weight-based gaps) ───
            Column(
                modifier = Modifier
                    .weight(1f)
                    .fillMaxWidth()
                    .verticalScroll(rememberScrollState())
                    .padding(horizontal = 16.dp),
                verticalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                Spacer(modifier = Modifier.height(4.dp))

                // ── Welcome Hero or Enhanced Player Card ──
                EntranceFadeSlide(entranceStarted, delayMs = 120) {
                    if (!uiState.hasPlayer) {
                        WelcomeHero()
                    } else {
                        EnhancedPlayerCard(
                            level = uiState.playerLevel,
                            title = uiState.playerTitle,
                            totalStars = uiState.totalStars,
                            xp = uiState.xp,
                            xpForNext = uiState.xpForNext,
                            xpProgress = uiState.xpProgress
                        )
                    }
                }

                // ── Quick Stats Row ────────────────────
                if (uiState.hasPlayer) {
                    EntranceFadeSlide(entranceStarted, delayMs = 200) {
                        QuickStatRow(
                            bestWpm = uiState.todaysBestWpm,
                            totalStars = uiState.totalStars,
                            streakCount = uiState.streakCount,
                            levelsCleared = uiState.levelsCleared
                        )
                    }
                }

                // ── JUMP IN Button ────────────────────
                EntranceFadeSlide(entranceStarted, delayMs = 300) {
                    JumpInButton(
                        subLabel = viewModel.jumpInLabel(),
                        onClick = { onJumpIn(viewModel.getNextLevelId()) }
                    )
                }

                // ── Two-column: Daily + Achievement side by side ──
                if (uiState.hasPlayer) {
                    EntranceFadeSlide(entranceStarted, delayMs = 500) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            // Daily Challenge mini card
                            DailyChallengeMiniCard(
                                summary = uiState.dailyChallengeSummary,
                                onClick = onNavigateToDailyChallenges,
                                modifier = Modifier.weight(1f)
                            )

                            // Achievement spotlight mini card
                            if (uiState.spotlightAchievement != null) {
                                AchievementMiniCard(
                                    achievement = uiState.spotlightAchievement!!,
                                    onClick = onNavigateToAchievements,
                                    modifier = Modifier.weight(1f)
                                )
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(8.dp))
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
private fun WelcomeHero() {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 16.dp)
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

// ── Enhanced Player Card (with circular XP arc) ──────────

@Composable
private fun EnhancedPlayerCard(
    level: Int,
    title: String,
    totalStars: Int,
    xp: Int,
    xpForNext: Int,
    xpProgress: Float
) {
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
        modifier = Modifier.fillMaxWidth(),
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
                Text(
                    text = "$level",
                    style = MaterialTheme.typography.titleLarge,
                    color = TextWhite,
                    fontWeight = FontWeight.Bold
                )
            }

            Spacer(modifier = Modifier.width(14.dp))

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

// ── Quick Stat Row ───────────────────────────────────────

@Composable
private fun QuickStatRow(
    bestWpm: Int,
    totalStars: Int,
    streakCount: Int,
    levelsCleared: Int
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        StatPill("⚡", "$bestWpm", "WPM", MagmaRed, Modifier.weight(1f))
        StatPill("★", "$totalStars", "Stars", MoltenGold, Modifier.weight(1f))
        StatPill("🔥", "$streakCount", "Streak", MagmaRed, Modifier.weight(1f))
        StatPill("🗺", "$levelsCleared", "Done", TextBody, Modifier.weight(1f))
    }
}

@Composable
private fun StatPill(
    icon: String,
    value: String,
    label: String,
    accentColor: Color,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier,
        shape = RoundedCornerShape(10.dp),
        colors = CardDefaults.cardColors(containerColor = Surface.copy(alpha = 0.6f)),
        border = BorderStroke(1.dp, accentColor.copy(alpha = 0.15f)),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 8.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(text = icon, fontSize = 12.sp)
                Spacer(modifier = Modifier.width(3.dp))
                Text(
                    text = value,
                    style = MaterialTheme.typography.titleMedium,
                    color = TextWhite,
                    fontWeight = FontWeight.Bold
                )
            }
            Text(
                text = label,
                style = MaterialTheme.typography.labelSmall,
                color = TextMuted,
                fontSize = 9.sp
            )
        }
    }
}

// ── Daily Challenge Mini Card (compact, for side-by-side layout) ─

@Composable
private fun DailyChallengeMiniCard(
    summary: DailyChallengeSummary,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val infiniteTransition = rememberInfiniteTransition(label = "dcMiniGlow")
    val glowAlpha by infiniteTransition.animateFloat(
        initialValue = 0.15f,
        targetValue = 0.35f,
        animationSpec = infiniteRepeatable(
            animation = tween(1800, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "dcMiniGlowAlpha"
    )

    Card(
        modifier = modifier
            .clickable(onClick = onClick),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = Surface.copy(alpha = 0.8f)),
        border = BorderStroke(1.dp, MoltenGold.copy(alpha = if (summary.hasIncomplete) glowAlpha else 0.1f)),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp)
        ) {
            // Icon row
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(
                    modifier = Modifier
                        .size(32.dp)
                        .clip(RoundedCornerShape(8.dp))
                        .background(
                            if (summary.completed >= summary.total) MoltenGold.copy(alpha = 0.2f)
                            else MagmaRed.copy(alpha = 0.2f)
                        ),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = if (summary.completed >= summary.total) "🏆" else "🎯",
                        fontSize = 16.sp
                    )
                }
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = "DAILY",
                    style = MaterialTheme.typography.labelSmall,
                    color = TextWhite,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 1.sp
                )
            }

            Spacer(modifier = Modifier.height(8.dp))

            // Progress: "1 / 3"
            Text(
                text = "${summary.completed} / ${summary.total}",
                style = MaterialTheme.typography.headlineLarge,
                fontSize = 20.sp,
                color = if (summary.completed >= summary.total) MoltenGold else TextWhite,
                fontWeight = FontWeight.Bold
            )
            Text(
                text = "challenges",
                style = MaterialTheme.typography.labelSmall,
                color = TextMuted
            )

            // Mini progress dots
            Spacer(modifier = Modifier.height(6.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(3.dp)) {
                repeat(summary.total) { i ->
                    val filled = i < summary.completed
                    Box(
                        modifier = Modifier
                            .size(6.dp)
                            .clip(CircleShape)
                            .background(
                                if (filled) MagmaRed
                                else SurfaceBorder.copy(alpha = 0.3f)
                            )
                    )
                }
            }

            // Streak multiplier if active
            if (summary.streakCount > 1) {
                Spacer(modifier = Modifier.height(6.dp))
                Text(
                    text = "🔥 ×${String.format("%.1f", summary.streakMultiplier)}",
                    style = MaterialTheme.typography.labelSmall,
                    color = MagmaRed,
                    fontWeight = FontWeight.Bold,
                    fontSize = 9.sp
                )
            }
        }
    }
}

// ── Achievement Mini Card (compact, for side-by-side layout) ─

@Composable
private fun AchievementMiniCard(
    achievement: Achievement,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val isUnlocked = achievement.isUnlocked
    val accentColor = if (isUnlocked) MoltenGold else MagmaRed

    Card(
        modifier = modifier
            .clickable(onClick = onClick),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = Surface.copy(alpha = 0.8f)),
        border = BorderStroke(1.dp, accentColor.copy(alpha = 0.12f)),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp)
        ) {
            // Icon + label
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(
                    modifier = Modifier
                        .size(32.dp)
                        .clip(RoundedCornerShape(8.dp))
                        .background(accentColor.copy(alpha = 0.15f)),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = achievement.icon,
                        fontSize = 14.sp,
                        modifier = Modifier.alpha(if (isUnlocked) 1f else 0.6f)
                    )
                }
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = if (isUnlocked) "★ DONE" else "ACHIEVE",
                    style = MaterialTheme.typography.labelSmall,
                    color = if (isUnlocked) MoltenGold else TextMuted,
                    fontWeight = FontWeight.Bold,
                    fontSize = 9.sp,
                    letterSpacing = 1.sp
                )
            }

            Spacer(modifier = Modifier.height(8.dp))

            // Title
            Text(
                text = achievement.title,
                style = MaterialTheme.typography.bodyMedium,
                fontSize = 12.sp,
                color = TextWhite,
                fontWeight = FontWeight.Bold,
                maxLines = 1
            )
            Spacer(modifier = Modifier.height(2.dp))

            // Progress or status
            if (isUnlocked) {
                Text(
                    text = "✓ Completed",
                    style = MaterialTheme.typography.labelSmall,
                    color = MoltenGold,
                    fontSize = 9.sp
                )
            } else if (achievement.progress > 0f) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(4.dp)
                        .clip(RoundedCornerShape(2.dp))
                        .background(SurfaceBorder.copy(alpha = 0.3f))
                ) {
                    Box(
                        modifier = Modifier
                            .fillMaxHeight()
                            .fillMaxWidth(achievement.progress)
                            .clip(RoundedCornerShape(2.dp))
                            .background(
                                Brush.horizontalGradient(
                                    colors = listOf(MagmaRed, MoltenGold)
                                )
                            )
                    )
                }
                Spacer(modifier = Modifier.height(4.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text(
                        text = achievement.description,
                        style = MaterialTheme.typography.labelSmall,
                        color = TextMuted,
                        fontSize = 8.sp,
                        maxLines = 1,
                        modifier = Modifier.weight(1f, fill = false)
                    )
                    if (achievement.progressText.isNotBlank()) {
                        Text(
                            text = achievement.progressText,
                            style = MaterialTheme.typography.labelSmall,
                            color = accentColor,
                            fontSize = 8.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            } else {
                Text(
                    text = achievement.description,
                    style = MaterialTheme.typography.labelSmall,
                    color = TextMuted,
                    fontSize = 9.sp,
                    maxLines = 2
                )
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
