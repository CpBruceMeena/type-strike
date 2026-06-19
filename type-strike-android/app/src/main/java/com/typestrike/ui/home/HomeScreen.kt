package com.typestrike.ui.home

import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
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
import androidx.compose.foundation.BorderStroke
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
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
            // Top bar
            EntranceFadeSlide(entranceStarted, delayMs = 0) {
                HomeTopBar(
                    onSettingsClick = onNavigateToSettings,
                    streakCount = uiState.streakCount
                )
            }

            // Scrollable content — weighted spacers distribute empty space evenly
            Column(
                modifier = Modifier
                    .weight(1f)
                    .fillMaxWidth(),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                // ── Top breathing room (more for new users with larger hero) ──
                Spacer(modifier = Modifier.weight(if (!uiState.hasPlayer) 0.14f else 0.10f))

                // ── Welcome Hero or Compact Player Card ──────
                if (!uiState.hasPlayer) {
                    WelcomeHero(entranceStarted = entranceStarted)
                } else {
                    CompactPlayerCard(
                        level = uiState.playerLevel,
                        title = uiState.playerTitle,
                        totalStars = uiState.totalStars,
                        xpProgress = uiState.xpProgress,
                        entranceStarted = entranceStarted
                    )
                }

                Spacer(modifier = Modifier.weight(0.10f))

                // ── JUMP IN Button ────────────────────────────
                EntranceFadeSlide(entranceStarted, delayMs = 300) {
                    JumpInButton(
                        subLabel = viewModel.jumpInLabel(),
                        onClick = { onJumpIn(viewModel.getNextLevelId()) }
                    )
                }

                Spacer(modifier = Modifier.weight(0.10f))

                // ── Level Progression Preview ─────────────────
                EntranceFadeSlide(entranceStarted, delayMs = 500) {
                    ProgressionPreview(previewTiers = uiState.tiers)
                }

                Spacer(modifier = Modifier.weight(0.08f))

                // ── Quick Stats (only for existing players) ──
                if (uiState.hasPlayer) {
                    EntranceFadeSlide(entranceStarted, delayMs = 700) {
                        CompactStats(
                            todaysBestWpm = uiState.todaysBestWpm,
                            levelsCleared = uiState.levelsCleared,
                            levelsTotal = uiState.levelsTotal
                        )
                    }
                    Spacer(modifier = Modifier.weight(0.06f))
                }

                // ── Secondary Nav Row ─────────────────────────
                EntranceFadeSlide(entranceStarted, delayMs = 800) {
                    SecondaryNavRow(
                        onDailyChallengesClick = onNavigateToDailyChallenges,
                        onAchievementsClick = onNavigateToAchievements,
                        onStatsClick = onNavigateToStats
                    )
                }

                // ── Bottom breathing room ─────────────────────
                Spacer(modifier = Modifier.weight(0.14f))
            }

            // Bottom Navigation Bar
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

// ── Top Bar ──────────────────────────────────────────────

@Composable
private fun HomeTopBar(
    onSettingsClick: () -> Unit,
    streakCount: Int = 0
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .height(44.dp)
            .padding(horizontal = 14.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text("🔥", fontSize = 16.sp, modifier = Modifier.alpha(0.7f))
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

// ── Compact Player Card (existing users) ─────────────────

@Composable
private fun CompactPlayerCard(
    level: Int,
    title: String,
    totalStars: Int,
    xpProgress: Float,
    entranceStarted: Boolean
) {
    EntranceFadeSlide(entranceStarted, delayMs = 120) {
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp),
            shape = RoundedCornerShape(12.dp),
            colors = CardDefaults.cardColors(containerColor = Surface.copy(alpha = 0.8f)),
            border = BorderStroke(1.dp, SurfaceBorder.copy(alpha = 0.25f)),
            elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 14.dp, vertical = 12.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Level badge
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(6.dp))
                        .background(
                            Brush.linearGradient(
                                colors = listOf(MagmaRed, MagmaRedDark),
                                start = androidx.compose.ui.geometry.Offset.Zero,
                                end = androidx.compose.ui.geometry.Offset.Infinite
                            )
                        )
                        .padding(horizontal = 8.dp, vertical = 3.dp)
                ) {
                    Text(
                        text = "LV.$level",
                        style = MaterialTheme.typography.labelMedium,
                        color = TextWhite,
                        fontWeight = FontWeight.Bold
                    )
                }
                Spacer(modifier = Modifier.width(10.dp))
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = title.uppercase(),
                        style = MaterialTheme.typography.labelLarge,
                        color = TextWhite,
                        fontWeight = FontWeight.Bold,
                        maxLines = 1
                    )
                    // XP bar compact
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(4.dp)
                            .padding(end = 8.dp)
                            .clip(RoundedCornerShape(2.dp))
                            .background(SurfaceBorder.copy(alpha = 0.4f))
                    ) {
                        val animProg by animateFloatAsState(
                            targetValue = xpProgress.coerceIn(0f, 1f),
                            animationSpec = tween(1200, easing = FastOutSlowInEasing),
                            label = "xpBar"
                        )
                        Box(
                            modifier = Modifier
                                .fillMaxHeight()
                                .fillMaxWidth(animProg)
                                .clip(RoundedCornerShape(2.dp))
                                .background(
                                    Brush.horizontalGradient(listOf(MagmaRed, MoltenGold))
                                )
                        )
                    }
                }
                Spacer(modifier = Modifier.width(8.dp))
                // Stars
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text("★", color = MoltenGold, fontSize = 14.sp,
                        modifier = Modifier.shadow(2.dp, RoundedCornerShape(0.dp), spotColor = MoltenGold.copy(alpha = 0.3f)))
                    Spacer(modifier = Modifier.width(3.dp))
                    Text("$totalStars", style = MaterialTheme.typography.labelLarge, color = MoltenGold, fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}

// ── Level Progression Preview ────────────────────────────

@Composable
private fun ProgressionPreview(previewTiers: List<TierPreview>) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp)
    ) {
        Text(
            text = "PROGRESSION",
            style = MaterialTheme.typography.labelSmall,
            color = TextMuted,
            fontWeight = FontWeight.Bold,
            letterSpacing = 2.sp,
            modifier = Modifier.padding(start = 4.dp, bottom = 6.dp)
        )

        previewTiers.forEachIndexed { index, tier ->
            TierPreviewRow(
                tier = tier,
                isLast = index == previewTiers.lastIndex,
                animDelay = index * 100
            )
        }
    }
}

@Composable
private fun TierPreviewRow(
    tier: TierPreview,
    isLast: Boolean,
    animDelay: Int
) {
    val animProgress by animateFloatAsState(
        targetValue = 1f,
        animationSpec = tween(400, delayMillis = animDelay, easing = FastOutSlowInEasing),
        label = "tier_${tier.name}"
    )

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .alpha(animProgress)
            .padding(vertical = 2.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        // Tier icon (smaller)
        Box(
            modifier = Modifier
                .size(24.dp)
                .clip(RoundedCornerShape(5.dp))
                .background(Color(tier.color).copy(alpha = 0.15f)),
            contentAlignment = Alignment.Center
        ) {
            Text(tier.icon, fontSize = 12.sp)
        }
        Spacer(modifier = Modifier.width(8.dp))
        Column(modifier = Modifier.weight(1f)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(
                    text = tier.name.uppercase(),
                    style = MaterialTheme.typography.labelMedium,
                    color = Color(tier.color),
                    fontWeight = FontWeight.Bold
                )
                Spacer(modifier = Modifier.width(5.dp))
                Text(
                    text = tier.levelRange,
                    style = MaterialTheme.typography.labelSmall,
                    color = TextDisabled,
                    fontSize = 10.sp
                )
            }
            // Description removed for tighter layout
        }
        // Arrow connector (except last)
        if (!isLast) {
            Text(
                text = "▸",
                color = TextDisabled.copy(alpha = 0.4f),
                fontSize = 9.sp,
                modifier = Modifier.padding(start = 2.dp)
            )
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
                .height(56.dp)
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

// ── Compact Stats (existing users only) ──────────────────

@Composable
private fun CompactStats(
    todaysBestWpm: Int,
    levelsCleared: Int,
    levelsTotal: Int
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp),
        horizontalArrangement = Arrangement.spacedBy(10.dp)
    ) {
        MiniStatCard(
            label = "Today's Best",
            value = if (todaysBestWpm > 0) "$todaysBestWpm WPM" else "—",
            accent = MagmaRed,
            modifier = Modifier.weight(1f)
        )
        MiniStatCard(
            label = "Levels",
            value = "$levelsCleared / $levelsTotal",
            accent = TextBody,
            modifier = Modifier.weight(1f)
        )
    }
}

@Composable
private fun MiniStatCard(
    label: String,
    value: String,
    accent: Color,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier.height(52.dp),
        shape = RoundedCornerShape(10.dp),
        colors = CardDefaults.cardColors(containerColor = Surface.copy(alpha = 0.7f)),
        border = BorderStroke(1.dp, SurfaceBorder.copy(alpha = 0.2f))
    ) {
        Row(
            modifier = Modifier.fillMaxSize().padding(horizontal = 12.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Text(
                text = label,
                style = MaterialTheme.typography.labelSmall,
                color = TextMuted
            )
            Text(
                text = value,
                style = MaterialTheme.typography.titleMedium,
                color = accent,
                fontWeight = FontWeight.Bold
            )
        }
    }
}

// ── Secondary Nav Row ────────────────────────────────────

@Composable
private fun SecondaryNavRow(
    onDailyChallengesClick: () -> Unit,
    onAchievementsClick: () -> Unit,
    onStatsClick: () -> Unit
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.Center,
        verticalAlignment = Alignment.CenterVertically
    ) {
        SecondaryNavButton("🎯  DAILY", MagmaRed, onDailyChallengesClick)
        Spacer(modifier = Modifier.width(8.dp))
        SecondaryNavButton("🏆  REWARDS", TextBody, onAchievementsClick)
        Spacer(modifier = Modifier.width(8.dp))
        SecondaryNavButton("📊  STATS", TextBody, onStatsClick)
    }
}

@Composable
private fun SecondaryNavButton(
    text: String,
    color: Color,
    onClick: () -> Unit
) {
    OutlinedButton(
        onClick = onClick,
        modifier = Modifier.height(36.dp),
        shape = RoundedCornerShape(8.dp),
        colors = ButtonDefaults.outlinedButtonColors(contentColor = color),
        border = BorderStroke(1.dp, color.copy(alpha = if (color == MagmaRed) 0.4f else 0.2f)),
        contentPadding = PaddingValues(horizontal = 10.dp, vertical = 0.dp)
    ) {
        Text(
            text = text,
            style = MaterialTheme.typography.labelSmall,
            fontWeight = if (color == MagmaRed) FontWeight.Bold else FontWeight.SemiBold,
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
