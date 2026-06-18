package com.typestrike.ui.home

import androidx.compose.animation.*
import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.typestrike.data.model.PlayerSummary
import com.typestrike.ui.effects.*
import com.typestrike.ui.theme.*
import com.typestrike.ui.util.formatTimestamp

/**
 * Home / Dashboard Screen.
 * Entry point of the app — shows player identity, JUMP IN, stats, activity.
 */
@Composable
fun HomeScreen(
    onJumpIn: (Int) -> Unit = {},
    onNavigateToMap: () -> Unit = {},
    onNavigateToStats: () -> Unit = {},
    onNavigateToSettings: () -> Unit = {},
    viewModel: HomeViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()

    // Staggered entrance animation
    var entranceStarted by remember { mutableStateOf(false) }
    LaunchedEffect(Unit) {
        entranceStarted = true
    }

    val particleConfig = remember {
        ParticleConfig.fromQuality(ParticleConfig.detect())
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Background)
    ) {
        // Particle background (behind everything)
        MapParticleField(
            config = particleConfig,
            modifier = Modifier.fillMaxSize()
        )

        when {
            uiState.isLoading -> LoadingState()
            uiState.hasError -> ErrorState(
                message = uiState.errorMessage ?: "Failed to load",
                onRetry = { viewModel.loadPlayerData() }
            )
            else -> HomeContent(
                summary = uiState.playerSummary,
                isFirstTime = uiState.isFirstTime,
                nextLevelId = uiState.nextLevelId,
                entranceStarted = entranceStarted,
                onJumpIn = onJumpIn,
                onNavigateToMap = onNavigateToMap,
                onNavigateToStats = onNavigateToStats,
                onNavigateToSettings = onNavigateToSettings
            )
        }
    }
}

// ── Content ─────────────────────────────────────────────

@Composable
private fun HomeContent(
    summary: PlayerSummary?,
    isFirstTime: Boolean,
    nextLevelId: Int,
    entranceStarted: Boolean,
    onJumpIn: (Int) -> Unit,
    onNavigateToMap: () -> Unit,
    onNavigateToStats: () -> Unit,
    onNavigateToSettings: () -> Unit
) {
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

        // Player Identity Card
        EntranceFadeSlide(entranceStarted, delayMs = 200) {
            PlayerIdentityCard(
                player = summary?.player,
                nextLevelXp = summary?.nextLevelXp ?: 0,
                modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)
            )
        }

        // JUMP IN Button
        EntranceFadeSlide(entranceStarted, delayMs = 400) {
            JumpInButton(
                isFirstTime = isFirstTime,
                allCompleted = summary?.levelsCleared == summary?.levelsTotal,
                onClick = { onJumpIn(nextLevelId) },
                modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)
            )
        }

        // Quick Stats Row
        Row(
            modifier = Modifier
                .padding(horizontal = 16.dp, vertical = 8.dp)
                .fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            EntranceFadeSlide(entranceStarted, delayMs = 600, modifier = Modifier.weight(1f)) {
                StatCard(
                    label = "Today's Best",
                    value = if ((summary?.todaysBestWpm ?: 0) > 0)
                        "${summary?.todaysBestWpm ?: "—"} WPM"
                    else "—",
                    valueColor = MagmaRed
                )
            }
            EntranceFadeSlide(entranceStarted, delayMs = 700, modifier = Modifier.weight(1f)) {
                StatCard(
                    label = "Levels",
                    value = "${summary?.levelsCleared ?: 0} / ${summary?.levelsTotal ?: 100}",
                    valueColor = TextBody
                )
            }
        }

        // Activity Feed
        EntranceFadeSlide(entranceStarted, delayMs = 800) {
            ActivityFeed(
                activities = summary?.recentActivity ?: emptyList(),
                modifier = Modifier
                    .weight(1f)
                    .padding(horizontal = 16.dp)
            )
        }

        // Navigation Bar
        EntranceFadeSlide(entranceStarted, delayMs = 1200) {
            NavigationBar(
                activeTab = "Home",
                onHomeClick = { },
                onMapClick = onNavigateToMap,
                onStatsClick = onNavigateToStats
            )
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
        Text(
            text = "type-strike",
            style = MaterialTheme.typography.headlineMedium,
            color = TextWhite
        )
        TextButton(
            onClick = onSettingsClick,
            modifier = Modifier.size(48.dp)
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
    player: com.typestrike.data.model.Player?,
    nextLevelXp: Int,
    modifier: Modifier = Modifier
) {
    val level = player?.level ?: 1
    val title = player?.title ?: "RECRUIT"
    val stars = player?.totalStars ?: 0
    val xp = player?.xp ?: 0
    val progress = Progression.xpProgress(xp, level)

    Card(
        modifier = modifier
            .fillMaxWidth()
            .shadow(4.dp, RoundedCornerShape(12.dp)),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = Surface)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            // Row 1: Level Badge + Stars
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Level badge
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(6.dp))
                        .background(MagmaRed)
                        .padding(horizontal = 12.dp, vertical = 4.dp)
                ) {
                    Text(
                        text = "⚡ LV.$level",
                        style = MaterialTheme.typography.labelLarge,
                        color = TextWhite
                    )
                }
                // Stars
                Text(
                    text = "★ $stars / 300",
                    style = MaterialTheme.typography.labelSmall,
                    color = MoltenGold
                )
            }

            Spacer(modifier = Modifier.height(4.dp))

            // Player title
            Text(
                text = title.uppercase(),
                style = MaterialTheme.typography.titleLarge,
                color = TextWhite
            )

            Spacer(modifier = Modifier.height(8.dp))

            // XP Row
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "$xp XP",
                    style = MaterialTheme.typography.labelSmall,
                    color = TextLabel
                )
                Spacer(modifier = Modifier.width(8.dp))

                // XP Progress Bar
                LinearProgressIndicator(
                    progress = { progress },
                    modifier = Modifier
                        .weight(1f)
                        .height(6.dp)
                        .clip(RoundedCornerShape(3.dp)),
                    color = MagmaRed,
                    trackColor = SurfaceBorder,
                    strokeCap = StrokeCap.Round
                )

                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = "${(progress * 100).toInt()}% → LV.${level + 1}",
                    style = MaterialTheme.typography.labelSmall,
                    color = MagmaRed
                )
            }
        }
    }
}

// ── JUMP IN Button ───────────────────────────────────────

@Composable
private fun JumpInButton(
    isFirstTime: Boolean,
    allCompleted: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val subLabel = when {
        isFirstTime -> "Begin your journey"
        allCompleted -> "Practice mode — no limits!"
        else -> "Continue where you left off"
    }

    val infiniteTransition = rememberInfiniteTransition(label = "glow")
    val glowAlpha by infiniteTransition.animateFloat(
        initialValue = 0.3f,
        targetValue = 0.5f,
        animationSpec = infiniteRepeatable(
            animation = tween(2000, easing = LinearEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "glowAlpha"
    )

    Box(modifier = modifier.fillMaxWidth()) {
        // Glow effect
        Box(
            modifier = Modifier
                .matchParentSize()
                .padding(horizontal = 8.dp, vertical = 8.dp)
                .clip(RoundedCornerShape(12.dp))
                .alpha(glowAlpha)
                .background(MagmaRed)
        )
        // Button
        Button(
            onClick = onClick,
            modifier = Modifier
                .fillMaxWidth()
                .height(56.dp),
            shape = RoundedCornerShape(12.dp),
            colors = ButtonDefaults.buttonColors(containerColor = MagmaRed)
        ) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text(
                    text = "🔥  JUMP IN",
                    style = MaterialTheme.typography.titleMedium,
                    color = TextWhite
                )
                Text(
                    text = subLabel,
                    style = MaterialTheme.typography.labelSmall,
                    color = TextWhite.copy(alpha = 0.6f)
                )
            }
        }
    }
}

// ── Stat Card ────────────────────────────────────────────

@Composable
private fun StatCard(
    label: String,
    value: String,
    valueColor: androidx.compose.ui.graphics.Color,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier
            .height(60.dp)
            .shadow(2.dp, RoundedCornerShape(10.dp)),
        shape = RoundedCornerShape(10.dp),
        colors = CardDefaults.cardColors(containerColor = Surface)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 12.dp, vertical = 8.dp),
            verticalArrangement = Arrangement.Center
        ) {
            Text(
                text = label,
                style = MaterialTheme.typography.labelSmall,
                color = TextMuted
            )
            Text(
                text = value,
                style = MaterialTheme.typography.headlineLarge,
                color = valueColor
            )
        }
    }
}

// ── Activity Feed ────────────────────────────────────────

@Composable
private fun ActivityFeed(
    activities: List<com.typestrike.data.model.ActivityEvent>,
    modifier: Modifier = Modifier
) {
    Column(modifier = modifier) {
        Text(
            text = "Recent Activity",
            style = MaterialTheme.typography.titleMedium,
            color = TextLabel,
            modifier = Modifier.padding(vertical = 8.dp)
        )

        if (activities.isEmpty()) {
            // Empty state
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(32.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(text = "⚡", fontSize = 32.sp, color = TextDisabled)
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = "No activity yet",
                    style = MaterialTheme.typography.bodyMedium,
                    color = TextMuted
                )
                Text(
                    text = "Complete your first level to see your history here!",
                    style = MaterialTheme.typography.labelSmall,
                    color = TextDisabled,
                    textAlign = TextAlign.Center
                )
            }
        } else {
            activities.take(3).forEach { event ->
                ActivityItem(event = event)
                HorizontalDivider(thickness = 1.dp, color = SurfaceCard)
            }
        }
    }
}

@Composable
private fun ActivityItem(event: com.typestrike.data.model.ActivityEvent) {
    val icon = when (event.type) {
        "level_completed" -> "🔥"
        "level_failed" -> "💀"
        "achievement" -> "✦"
        "level_up" -> "⚡"
        "new_high_score" -> "🏆"
        else -> "•"
    }
    val desc = when (event.type) {
        "level_completed" -> "Completed a level"
        "level_failed" -> "Failed a level"
        "achievement" -> "Unlocked achievement"
        "level_up" -> "Leveled up!"
        "new_high_score" -> "New personal best!"
        else -> "Activity recorded"
    }
    val color = when (event.type) {
        "level_completed" -> MagmaRed
        "level_failed" -> ErrorRed
        "achievement" -> NeonPurple
        "level_up" -> MoltenGold
        "new_high_score" -> MoltenGold
        else -> TextLabel
    }

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(text = icon, fontSize = 14.sp, color = color)
        Spacer(modifier = Modifier.width(12.dp))
        Text(
            text = desc,
            style = MaterialTheme.typography.bodyMedium,
            color = TextBody,
            modifier = Modifier.weight(1f)
        )
        Text(
            text = formatTimestamp(event.timestamp),
            style = MaterialTheme.typography.labelSmall,
            color = TextDisabled
        )
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
            NavigationTab("🗺", "Map", activeTab == "Map", onMapClick)
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

// ── Loading & Error States ───────────────────────────────

@Composable
private fun LoadingState() {
    Box(
        modifier = Modifier.fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            CircularProgressIndicator(
                color = MagmaRed,
                modifier = Modifier.size(32.dp)
            )
            Spacer(modifier = Modifier.height(16.dp))
            Text(
                text = "Loading…",
                style = MaterialTheme.typography.bodyMedium,
                color = TextLabel
            )
        }
    }
}

@Composable
private fun ErrorState(
    message: String,
    onRetry: () -> Unit
) {
    Box(
        modifier = Modifier.fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text(
                text = "⚠️",
                fontSize = 32.sp
            )
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = message,
                style = MaterialTheme.typography.bodyMedium,
                color = TextMuted,
                modifier = Modifier.padding(horizontal = 32.dp),
                textAlign = TextAlign.Center
            )
            Spacer(modifier = Modifier.height(16.dp))
            Button(
                onClick = onRetry,
                colors = ButtonDefaults.buttonColors(containerColor = MagmaRed)
            ) {
                Text("Retry", color = TextWhite)
            }
        }
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
