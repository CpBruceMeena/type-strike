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
    onNavigateToStats: () -> Unit = {},
    onNavigateToSettings: () -> Unit = {},
    onNavigateToAchievements: () -> Unit = {},
    viewModel: HomeViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()

    // Staggered entrance animation
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
        // Particle background
        MapParticleField(
            config = particleConfig.copy(opacity = 0.3f),
            modifier = Modifier.fillMaxSize()
        )

        Column(
            modifier = Modifier
                .fillMaxSize()
                .systemBarsPadding()
                .statusBarsPadding()
                .navigationBarsPadding()
        ) {
            // Top App Bar
            EntranceFadeSlide(entranceStarted, delayMs = 0) {
                TopAppBar(onSettingsClick = onNavigateToSettings)
            }

            // Main scrollable content
            Column(
                modifier = Modifier
                    .weight(1f)
                    .fillMaxWidth(),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Spacer(modifier = Modifier.height(12.dp))

                // ── Player Identity Card ──────────────
                EntranceFadeSlide(entranceStarted, delayMs = 150) {
                    when {
                        uiState.isLoading -> PlayerIdentitySkeleton()
                        uiState.hasError -> PlayerIdentityError(
                            message = uiState.errorMessage ?: "Failed to load",
                            onRetry = { viewModel.retry() }
                        )
                        else -> PlayerIdentityCard(
                            level = uiState.playerLevel,
                            title = uiState.playerTitle,
                            totalStars = uiState.totalStars,
                            maxStars = uiState.levelsTotal * 3,
                            xp = uiState.xp,
                            xpForNext = uiState.xpForNext,
                            xpProgress = uiState.xpProgress
                        )
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                // ── JUMP IN Button ────────────────────
                EntranceFadeSlide(entranceStarted, delayMs = 350) {
                    JumpInButton(
                        subLabel = viewModel.jumpInLabel(),
                        onClick = onPlay
                    )
                }

                Spacer(modifier = Modifier.height(16.dp))

                // ── Quick Stats Row ───────────────────
                EntranceFadeSlide(entranceStarted, delayMs = 550) {
                    QuickStatsRow(
                        todaysBestWpm = uiState.todaysBestWpm,
                        levelsCleared = uiState.levelsCleared,
                        levelsTotal = uiState.levelsTotal
                    )
                }

                Spacer(modifier = Modifier.weight(1f))

                // ── Secondary Nav Row ─────────────────
                EntranceFadeSlide(entranceStarted, delayMs = 750) {
                    SecondaryNavRow(
                        onStatsClick = onNavigateToStats,
                        onAchievementsClick = onNavigateToAchievements,
                        onSettingsClick = onNavigateToSettings
                    )
                }

                Spacer(modifier = Modifier.height(8.dp))
            }

            // Navigation Bar
            EntranceFadeSlide(entranceStarted, delayMs = 900) {
                NavigationBar(
                    activeTab = "Home",
                    onHomeClick = { },
                    onMapClick = onPlay,
                    onStatsClick = onNavigateToStats
                )
            }
        }
    }
}

// ── Top App Bar ──────────────────────────────────────────

@Composable
private fun TopAppBar(onSettingsClick: () -> Unit) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .height(48.dp)
            .padding(horizontal = 16.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text(
                text = "🔥",
                fontSize = 18.sp,
                modifier = Modifier.alpha(0.7f)
            )
            Spacer(modifier = Modifier.width(8.dp))
            Text(
                text = "type-strike",
                style = MaterialTheme.typography.headlineSmall,
                color = TextWhite,
                fontWeight = FontWeight.Bold,
                letterSpacing = 1.sp
            )
        }
        TextButton(
            onClick = onSettingsClick,
            modifier = Modifier
                .size(48.dp)
                .clip(CircleShape)
        ) {
            Text(
                text = "⚙",
                fontSize = 20.sp,
                color = TextLabel
            )
        }
    }
}

// ── Player Identity Card ─────────────────────────────────

@Composable
private fun PlayerIdentityCard(
    level: Int,
    title: String,
    totalStars: Int,
    maxStars: Int,
    xp: Int,
    xpForNext: Int,
    xpProgress: Float
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp),
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(containerColor = Surface.copy(alpha = 0.85f)),
        border = BorderStroke(1.dp, SurfaceBorder.copy(alpha = 0.3f)),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            // Top row: Level badge + Star count
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Level badge with gradient
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(6.dp))
                        .background(
                            brush = Brush.linearGradient(
                                colors = listOf(MagmaRed, MagmaRedDark),
                                start = androidx.compose.ui.geometry.Offset.Zero,
                                end = androidx.compose.ui.geometry.Offset.Infinite
                            )
                        )
                        .padding(horizontal = 10.dp, vertical = 4.dp)
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(
                            text = "⚡",
                            fontSize = 12.sp,
                            color = TextWhite
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(
                            text = "LV.$level",
                            style = MaterialTheme.typography.labelLarge,
                            color = TextWhite,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }

                // Star count
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        text = "★",
                        color = MoltenGold,
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.shadow(
                            4.dp,
                            RoundedCornerShape(0.dp),
                            spotColor = MoltenGold.copy(alpha = 0.4f)
                        )
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(
                        text = "$totalStars",
                        style = MaterialTheme.typography.titleMedium,
                        color = MoltenGold,
                        fontWeight = FontWeight.Bold
                    )
                    if (maxStars > 0) {
                        Text(
                            text = " / $maxStars",
                            style = MaterialTheme.typography.labelSmall,
                            color = TextMuted
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            // Player title
            Text(
                text = title.uppercase(),
                style = MaterialTheme.typography.headlineSmall,
                color = TextWhite,
                fontWeight = FontWeight.Bold,
                letterSpacing = 2.sp,
                maxLines = 1
            )

            Spacer(modifier = Modifier.height(10.dp))

            // XP Progress Bar
            XpProgressBar(
                xp = xp,
                xpForNext = xpForNext,
                progress = xpProgress,
                nextLevel = level + 1
            )
        }
    }
}

// ── XP Progress Bar ──────────────────────────────────────

@Composable
private fun XpProgressBar(
    xp: Int,
    @Suppress("UNUSED_PARAMETER") xpForNext: Int,
    progress: Float,
    nextLevel: Int
) {
    // Animated fill
    val animatedProgress by animateFloatAsState(
        targetValue = progress.coerceIn(0f, 1f),
        animationSpec = tween(1200, easing = FastOutSlowInEasing),
        label = "xpProgress"
    )

    val percentage = (progress * 100).toInt()

    // XP labels
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(
            text = "$xp XP",
            style = MaterialTheme.typography.labelSmall,
            color = TextLabel,
            fontWeight = FontWeight.Medium
        )
        Text(
            text = "$percentage% → LV.$nextLevel",
            style = MaterialTheme.typography.labelSmall,
            color = MagmaRed,
            fontWeight = FontWeight.SemiBold
        )
    }

    Spacer(modifier = Modifier.height(4.dp))

    // Track
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .height(8.dp)
            .clip(RoundedCornerShape(4.dp))
            .background(SurfaceBorder.copy(alpha = 0.5f))
    ) {
        // Fill with gradient — animated via fillMaxWidth
        Box(
            modifier = Modifier
                .fillMaxWidth(animatedProgress)
                .fillMaxHeight()
                .clip(RoundedCornerShape(4.dp))
                .background(
                    brush = Brush.horizontalGradient(
                        colors = listOf(MagmaRed, MoltenGold)
                    )
                )
        )
    }
}

// ── Player Identity Skeleton ─────────────────────────────

@Composable
private fun PlayerIdentitySkeleton() {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp)
            .height(96.dp),
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(containerColor = Surface.copy(alpha = 0.5f))
    ) {
        Box(
            modifier = Modifier.fillMaxSize(),
            contentAlignment = Alignment.Center
        ) {
            CircularProgressIndicator(
                color = MagmaRed,
                modifier = Modifier.size(24.dp),
                strokeWidth = 2.dp
            )
        }
    }
}

// ── Player Identity Error ─────────────────────────────────

@Composable
private fun PlayerIdentityError(
    message: String,
    onRetry: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp),
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(containerColor = Surface.copy(alpha = 0.5f))
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.Center
        ) {
            Text(
                text = "⚠️",
                fontSize = 14.sp
            )
            Spacer(modifier = Modifier.width(8.dp))
            Text(
                text = message,
                style = MaterialTheme.typography.bodySmall,
                color = TextMuted,
                modifier = Modifier.weight(1f)
            )
            TextButton(onClick = onRetry) {
                Text("Retry", color = MagmaRed, style = MaterialTheme.typography.labelSmall)
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
        label = "jumpInGlowAlpha"
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
            .padding(horizontal = 20.dp)
            .fillMaxWidth()
    ) {
        // Glow behind button
        Box(
            modifier = Modifier
                .matchParentSize()
                .padding(horizontal = 8.dp, vertical = 8.dp)
                .clip(RoundedCornerShape(14.dp))
                .alpha(glowAlpha)
                .background(MagmaRed)
        )

        Button(
            onClick = onClick,
            modifier = Modifier
                .fillMaxWidth()
                .height(64.dp)
                .scale(pulseScale),
            shape = RoundedCornerShape(14.dp),
            colors = ButtonDefaults.buttonColors(
                containerColor = MagmaRed
            ),
            elevation = ButtonDefaults.buttonElevation(
                defaultElevation = 8.dp
            )
        ) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        text = "🔥",
                        fontSize = 20.sp
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "JUMP IN",
                        style = MaterialTheme.typography.titleLarge,
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

// ── Quick Stats Row ──────────────────────────────────────

@Composable
private fun QuickStatsRow(
    todaysBestWpm: Int,
    levelsCleared: Int,
    levelsTotal: Int
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 20.dp),
        horizontalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        // Today's Best WPM
        QuickStatCard(
            label = "Today's Best",
            value = if (todaysBestWpm > 0) "$todaysBestWpm WPM" else "—",
            accentColor = MagmaRed,
            modifier = Modifier.weight(1f)
        )

        // Levels Completed
        QuickStatCard(
            label = "Levels",
            value = "$levelsCleared / $levelsTotal",
            accentColor = TextBody,
            modifier = Modifier.weight(1f)
        )
    }
}

@Composable
private fun QuickStatCard(
    label: String,
    value: String,
    accentColor: Color,
    modifier: Modifier = Modifier
) {
    // Entrance value animation
    val cardAlpha by animateFloatAsState(
        targetValue = 1f,
        animationSpec = tween(500),
        label = "quickStatAlpha"
    )

    Card(
        modifier = modifier
            .height(72.dp)
            .alpha(cardAlpha),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(
            containerColor = Surface.copy(alpha = 0.8f)
        ),
        border = BorderStroke(1.dp, SurfaceBorder.copy(alpha = 0.3f))
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(12.dp),
            verticalArrangement = Arrangement.Center
        ) {
            Text(
                text = label,
                style = MaterialTheme.typography.labelSmall,
                color = TextMuted,
                fontWeight = FontWeight.SemiBold,
                letterSpacing = 0.5.sp
            )
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = value,
                style = MaterialTheme.typography.headlineSmall,
                color = accentColor,
                fontWeight = FontWeight.Bold,
                maxLines = 1
            )
        }
    }
}

// ── Secondary Navigation Row ─────────────────────────────

@Composable
private fun SecondaryNavRow(
    onStatsClick: () -> Unit,
    onAchievementsClick: () -> Unit,
    onSettingsClick: () -> Unit
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.Center,
        verticalAlignment = Alignment.CenterVertically
    ) {
        // Stats button
        OutlinedButton(
            onClick = onStatsClick,
            modifier = Modifier.height(42.dp),
            shape = RoundedCornerShape(10.dp),
            colors = ButtonDefaults.outlinedButtonColors(contentColor = TextBody),
            border = BorderStroke(1.dp, SurfaceBorder.copy(alpha = 0.5f))
        ) {
            Text(
                text = "📊  STATS",
                style = MaterialTheme.typography.labelLarge,
                fontWeight = FontWeight.SemiBold,
                letterSpacing = 1.sp
            )
        }

        Spacer(modifier = Modifier.width(10.dp))

        // Achievements / Rewards button
        OutlinedButton(
            onClick = onAchievementsClick,
            modifier = Modifier.height(42.dp),
            shape = RoundedCornerShape(10.dp),
            colors = ButtonDefaults.outlinedButtonColors(contentColor = TextBody),
            border = BorderStroke(1.dp, SurfaceBorder.copy(alpha = 0.5f))
        ) {
            Text(
                text = "🏆  REWARDS",
                style = MaterialTheme.typography.labelLarge,
                fontWeight = FontWeight.SemiBold,
                letterSpacing = 1.sp
            )
        }

        Spacer(modifier = Modifier.width(10.dp))

        // Settings button
        OutlinedButton(
            onClick = onSettingsClick,
            modifier = Modifier.height(42.dp),
            shape = RoundedCornerShape(10.dp),
            colors = ButtonDefaults.outlinedButtonColors(contentColor = TextBody),
            border = BorderStroke(1.dp, SurfaceBorder.copy(alpha = 0.5f))
        ) {
            Text(
                text = "⚙  SETTINGS",
                style = MaterialTheme.typography.labelLarge,
                fontWeight = FontWeight.SemiBold,
                letterSpacing = 1.sp
            )
        }
    }
}

// ── Navigation Bar ───────────────────────────────────────

@Composable
private fun NavigationBar(
    activeTab: String,
    onHomeClick: () -> Unit,
    onMapClick: () -> Unit,
    onStatsClick: () -> Unit
) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        color = Background,
        tonalElevation = 0.dp,
        shadowElevation = 8.dp
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .height(64.dp)
                .background(Background)
                .padding(bottom = 8.dp),
            horizontalArrangement = Arrangement.SpaceEvenly,
            verticalAlignment = Alignment.CenterVertically
        ) {
            NavigationTab("🏠", "Home", activeTab == "Home", onHomeClick)
            NavigationTab("🗺", "Play", activeTab == "Play", onMapClick)
            NavigationTab("📊", "Stats", activeTab == "Stats", onStatsClick)
        }
    }
}

@Composable
private fun NavigationTab(
    icon: String,
    label: String,
    isActive: Boolean,
    onClick: () -> Unit
) {
    val color = if (isActive) MagmaRed else TextDisabled
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = Modifier
            .size(64.dp)
            .padding(4.dp)
            .clickable(onClick = onClick)
    ) {
        if (isActive) {
            Box(
                modifier = Modifier
                    .width(20.dp)
                    .height(3.dp)
                    .clip(RoundedCornerShape(1.5.dp))
                    .background(MagmaRed)
            )
        } else {
            Spacer(modifier = Modifier.height(3.dp))
        }
        Spacer(modifier = Modifier.height(4.dp))
        Text(text = icon, fontSize = 20.sp, color = color)
        Text(
            text = label,
            style = MaterialTheme.typography.labelMedium,
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
            val delay = delayMs.toLong()
            slideInVertically(
                animationSpec = tween(
                    durationMillis = 500,
                    delayMillis = delay.toInt(),
                    easing = FastOutSlowInEasing
                ),
                initialOffsetY = { it / 2 }
            ) + fadeIn(
                animationSpec = tween(
                    durationMillis = 300,
                    delayMillis = delay.toInt()
                )
            ) togetherWith
            slideOutVertically(
                animationSpec = tween(300),
                targetOffsetY = { it / 2 }
            ) + fadeOut(tween(200))
        },
        modifier = modifier,
        label = "entrance_$delayMs"
    ) { targetState ->
        if (targetState) {
            content()
        }
    }
}
