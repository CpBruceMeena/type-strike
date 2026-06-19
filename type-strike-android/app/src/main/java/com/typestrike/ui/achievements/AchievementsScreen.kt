package com.typestrike.ui.achievements

import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.typestrike.ui.effects.*
import com.typestrike.ui.util.Achievement
import com.typestrike.ui.theme.*
import kotlinx.coroutines.delay

// ── Category display mapping ─────────────────────────────

private val CATEGORY_COLORS = mapOf(
    "Progression" to MagmaRed,
    "Stars" to MoltenGold,
    "Speed" to NeonPurple,
    "Accuracy" to SuccessGreen,
    "Dedication" to TierIgneous
)

private val CATEGORY_ICONS = mapOf(
    "Progression" to "📈",
    "Stars" to "✦",
    "Speed" to "💨",
    "Accuracy" to "🎯",
    "Dedication" to "💪"
)

// ── Main Screen ──────────────────────────────────────────

@Composable
fun AchievementsScreen(
    onBack: () -> Unit = {},
    viewModel: AchievementsViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    val particleConfig = remember { ParticleConfig.fromQuality(ParticleConfig.detect()) }

    Box(modifier = Modifier.fillMaxSize().background(Background)) {
        MapParticleField(
            config = particleConfig.copy(opacity = 0.2f, glowEnabled = false),
            modifier = Modifier.fillMaxSize()
        )

        Column(modifier = Modifier.fillMaxSize().statusBarsPadding()) {
            AchievementsHeader(
                onBack = onBack,
                entranceStarted = uiState.entranceStarted,
                totalUnlocked = uiState.totalUnlocked,
                totalCount = uiState.totalCount
            )

            when {
                uiState.isLoading -> AchievementsLoadingState()
                uiState.hasError -> AchievementsErrorState(
                    message = uiState.errorMessage ?: "Failed to load achievements",
                    onRetry = { viewModel.loadAchievements() }
                )
                else -> AchievementsContent(
                    achievements = uiState.achievements,
                    entranceStarted = uiState.entranceStarted
                )
            }
        }
    }
}

// ── Header ───────────────────────────────────────────────

@Composable
private fun AchievementsHeader(
    onBack: () -> Unit,
    entranceStarted: Boolean,
    totalUnlocked: Int,
    totalCount: Int
) {
    AnimatedVisibility(
        visible = entranceStarted,
        enter = slideInVertically(tween(300)) + fadeIn(tween(200))
    ) {
        Column {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(56.dp)
                    .padding(horizontal = 8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                TextButton(onClick = onBack, modifier = Modifier.size(48.dp)) {
                    Text("←", color = TextBody, fontSize = 22.sp)
                }
                Spacer(modifier = Modifier.width(4.dp))
                Text(
                    text = "ACHIEVEMENTS",
                    style = MaterialTheme.typography.titleMedium,
                    color = TextWhite,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 3.sp
                )
            }
            // Progress summary
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 4.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                val progress = if (totalCount > 0) totalUnlocked.toFloat() / totalCount else 0f
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .height(6.dp)
                        .clip(RoundedCornerShape(3.dp))
                        .background(SurfaceBorder.copy(alpha = 0.3f))
                ) {
                    Box(
                        modifier = Modifier
                            .fillMaxHeight()
                            .fillMaxWidth(progress)
                            .clip(RoundedCornerShape(3.dp))
                            .background(MagmaRed)
                    )
                }
                Spacer(modifier = Modifier.width(12.dp))
                Text(
                    text = "$totalUnlocked / $totalCount",
                    style = MaterialTheme.typography.labelSmall,
                    color = MoltenGold,
                    fontWeight = FontWeight.Bold
                )
            }
            Spacer(modifier = Modifier.height(4.dp))
        }
    }
}

// ── Content ──────────────────────────────────────────────

@Composable
private fun AchievementsContent(
    achievements: List<Achievement>,
    entranceStarted: Boolean
) {
    var sectionVisible by remember { mutableStateOf(false) }
    LaunchedEffect(entranceStarted) {
        if (entranceStarted) {
            delay(200)
            sectionVisible = true
        }
    }

    // Group achievements by category
    val grouped = achievements.groupBy { it.category }

    LazyColumn(
        modifier = Modifier.fillMaxSize().padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        // Summary card at top
        item {
            AnimatedVisibility(
                visible = sectionVisible,
                enter = slideInVertically(tween(300)) + fadeIn(tween(200))
            ) {
                AchievementSummaryCard(achievements = achievements)
            }
        }

        // Unlocked achievements section
        val unlocked = achievements.filter { it.isUnlocked }
        if (unlocked.isNotEmpty()) {
            item {
                Spacer(modifier = Modifier.height(4.dp))
                AnimatedVisibility(
                    visible = sectionVisible,
                    enter = slideInVertically(tween(300)) + fadeIn(tween(200))
                ) {
                    Text(
                        text = "★ UNLOCKED",
                        style = MaterialTheme.typography.labelMedium,
                        color = MoltenGold,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 2.sp
                    )
                }
            }
            items(unlocked.take(3)) { achievement ->
                AnimatedVisibility(
                    visible = sectionVisible,
                    enter = slideInVertically(tween(300)) + fadeIn(tween(200))
                ) {
                    AchievementCard(achievement = achievement)
                }
            }
            if (unlocked.size > 3) {
                item {
                    Text(
                        text = "+${unlocked.size - 3} more unlocked…",
                        style = MaterialTheme.typography.labelSmall,
                        color = TextMuted,
                        modifier = Modifier.padding(start = 4.dp)
                    )
                }
            }
        }

        // All achievements by category
        grouped.forEach { (category, catAchievements) ->
            item {
                Spacer(modifier = Modifier.height(4.dp))
                AnimatedVisibility(
                    visible = sectionVisible,
                    enter = slideInVertically(tween(300)) + fadeIn(tween(200))
                ) {
                    CategoryHeader(
                        name = category,
                        unlocked = catAchievements.count { it.isUnlocked },
                        total = catAchievements.size
                    )
                }
            }

            items(catAchievements) { achievement ->
                AnimatedVisibility(
                    visible = sectionVisible,
                    enter = slideInVertically(
                        animationSpec = tween(300),
                        initialOffsetY = { it / 2 }
                    ) + fadeIn(tween(200))
                ) {
                    AchievementCard(achievement = achievement)
                }
            }
        }

        item { Spacer(modifier = Modifier.height(32.dp)) }
    }
}

// ── Summary Card ─────────────────────────────────────────

@Composable
private fun AchievementSummaryCard(achievements: List<Achievement>) {
    val unlocked = achievements.filter { it.isUnlocked }
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = Surface.copy(alpha = 0.8f))
    ) {
        Column(
            modifier = Modifier.fillMaxWidth().padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Row(
                horizontalArrangement = Arrangement.Center,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text("🏆", fontSize = 28.sp)
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = "${unlocked.size} / ${achievements.size}",
                    style = MaterialTheme.typography.headlineMedium,
                    color = MoltenGold,
                    fontWeight = FontWeight.Bold
                )
            }
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = "Achievements Unlocked",
                style = MaterialTheme.typography.bodySmall,
                color = TextMuted
            )
        }
    }
}

// ── Category Header ──────────────────────────────────────

@Composable
private fun CategoryHeader(
    name: String,
    unlocked: Int,
    total: Int
) {
    val color = CATEGORY_COLORS[name] ?: TextLabel
    val icon = CATEGORY_ICONS[name] ?: "•"

    Row(
        modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(text = icon, fontSize = 14.sp)
        Spacer(modifier = Modifier.width(6.dp))
        Text(
            text = name.uppercase(),
            style = MaterialTheme.typography.labelMedium,
            color = color,
            fontWeight = FontWeight.Bold,
            letterSpacing = 2.sp
        )
        Spacer(modifier = Modifier.weight(1f))
        Text(
            text = "$unlocked / $total",
            style = MaterialTheme.typography.labelSmall,
            color = TextMuted
        )
    }
}

// ── Achievement Card ─────────────────────────────────────

@Composable
private fun AchievementCard(achievement: Achievement) {
    val categoryColor = CATEGORY_COLORS[achievement.category] ?: TextLabel
    val isUnlocked = achievement.isUnlocked

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(10.dp),
        colors = CardDefaults.cardColors(
            containerColor = if (isUnlocked)
                Surface.copy(alpha = 0.8f)
            else
                SurfaceDark.copy(alpha = 0.4f)
        ),
        border = if (isUnlocked)
            BorderStroke(1.dp, categoryColor.copy(alpha = 0.15f))
        else null
    ) {
        Row(
            modifier = Modifier.fillMaxWidth().padding(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Icon circle
            Box(
                modifier = Modifier
                    .size(40.dp)
                    .clip(RoundedCornerShape(10.dp))
                    .background(
                        if (isUnlocked) categoryColor.copy(alpha = 0.15f)
                        else SurfaceBorder.copy(alpha = 0.1f)
                    ),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = achievement.icon,
                    fontSize = 18.sp,
                    modifier = Modifier.alpha(if (isUnlocked) 1f else 0.4f)
                )
            }

            Spacer(modifier = Modifier.width(12.dp))

            Column(modifier = Modifier.weight(1f)) {
                // Title
                Text(
                    text = achievement.title,
                    style = MaterialTheme.typography.bodyMedium,
                    color = if (isUnlocked) TextWhite else TextLabel,
                    fontWeight = if (isUnlocked) FontWeight.Bold else FontWeight.Normal
                )
                // Description
                Text(
                    text = achievement.description,
                    style = MaterialTheme.typography.labelSmall,
                    color = TextMuted
                )
                // Progress bar
                if (!isUnlocked) {
                    Spacer(modifier = Modifier.height(4.dp))
                    Box(
                        modifier = Modifier
                            .fillMaxWidth(0.7f)
                            .height(3.dp)
                            .clip(RoundedCornerShape(1.5f.dp))
                            .background(SurfaceBorder.copy(alpha = 0.2f))
                    ) {
                        Box(
                            modifier = Modifier
                                .fillMaxHeight()
                                .fillMaxWidth(achievement.progress)
                                .clip(RoundedCornerShape(1.5f.dp))
                                .background(categoryColor.copy(alpha = 0.5f))
                        )
                    }
                }
            }

            // Status indicator
            Box(
                modifier = Modifier.width(48.dp),
                contentAlignment = Alignment.CenterEnd
            ) {
                if (isUnlocked) {
                    Text(
                        text = "✓",
                        color = categoryColor,
                        fontWeight = FontWeight.Bold,
                        fontSize = 20.sp
                    )
                } else {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text(
                            text = achievement.progressText,
                            style = MaterialTheme.typography.labelSmall,
                            color = TextDisabled,
                            fontSize = 9.sp,
                            textAlign = TextAlign.End
                        )
                    }
                }
            }
        }
    }
}

// ── Loading State ────────────────────────────────────────

@Composable
private fun AchievementsLoadingState() {
    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            CircularProgressIndicator(color = MagmaRed, modifier = Modifier.size(32.dp))
            Spacer(modifier = Modifier.height(16.dp))
            Text("Loading achievements…", style = MaterialTheme.typography.bodyMedium, color = TextLabel)
        }
    }
}

// ── Error State ──────────────────────────────────────────

@Composable
private fun AchievementsErrorState(message: String, onRetry: () -> Unit) {
    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text("⚠️", fontSize = 32.sp)
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = message,
                style = MaterialTheme.typography.bodyMedium,
                color = TextMuted,
                modifier = Modifier.padding(horizontal = 32.dp)
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
