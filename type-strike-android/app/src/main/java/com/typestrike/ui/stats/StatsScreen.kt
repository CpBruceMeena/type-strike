package com.typestrike.ui.stats

import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
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
import com.typestrike.ui.util.formatTimestamp
import kotlinx.coroutines.delay
import kotlin.math.roundToInt

// ── Tier data ────────────────────────────────────────────

private val TIER_COLORS = mapOf(
    "EMBER" to MagmaRed,
    "IGNEOUS" to TierIgneous,
    "MAGMA CORE" to NeonPurple,
    "OBSIDIAN" to TierObsidian
)

// ── Main Screen ──────────────────────────────────────────

@Composable
fun StatsScreen(
    onBack: () -> Unit = {},
    viewModel: StatsViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    val particleConfig = remember { ParticleConfig.fromQuality(ParticleConfig.detect()) }

    Box(modifier = Modifier.fillMaxSize().background(Background)) {
        // Particle background
        MapParticleField(
            config = particleConfig.copy(opacity = 0.2f, glowEnabled = false),
            modifier = Modifier.fillMaxSize()
        )

        Column(modifier = Modifier.fillMaxSize().statusBarsPadding()) {
            // Header
            StatsHeader(
                onBack = onBack,
                entranceStarted = uiState.entranceStarted
            )

            when {
                uiState.isLoading -> StatsLoadingState()
                uiState.hasError -> StatsErrorState(
                    message = uiState.errorMessage ?: "Failed to load stats",
                    onRetry = { viewModel.loadStats() }
                )
                else -> StatsContent(
                    uiState = uiState,
                    entranceStarted = uiState.entranceStarted
                )
            }
        }
    }
}

// ── Header ───────────────────────────────────────────────

@Composable
private fun StatsHeader(onBack: () -> Unit, entranceStarted: Boolean) {
    AnimatedVisibility(
        visible = entranceStarted,
        enter = slideInVertically(tween(300)) + fadeIn(tween(200))
    ) {
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
                text = "STATISTICS",
                style = MaterialTheme.typography.titleMedium,
                color = TextWhite,
                fontWeight = FontWeight.Bold,
                letterSpacing = 3.sp
            )
        }
    }
}

// ── Content ──────────────────────────────────────────────

@Composable
private fun StatsContent(
    uiState: StatsUiState,
    entranceStarted: Boolean
) {
    val scrollState = rememberScrollState()
    var sectionVisible by remember { mutableIntStateOf(0) }

    LaunchedEffect(entranceStarted) {
        if (entranceStarted) {
            delay(100); sectionVisible = 1  // Player card
            delay(200); sectionVisible = 2  // Stats grid
            delay(200); sectionVisible = 3  // Tier breakdown
            delay(200); sectionVisible = 4  // WPM chart
            delay(200); sectionVisible = 5  // Activity
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(scrollState)
            .padding(horizontal = 16.dp)
    ) {
        Spacer(modifier = Modifier.height(8.dp))

        // ── Player Identity Card ─────────────────────
        AnimatedVisibility(
            visible = sectionVisible >= 1,
            enter = slideInVertically(tween(300)) + fadeIn(tween(200))
        ) {
            StatsPlayerCard(
                level = uiState.playerLevel,
                title = uiState.playerTitle,
                stars = uiState.playerStars,
                xp = uiState.playerXp
            )
        }

        Spacer(modifier = Modifier.height(12.dp))

        // ── Stats Grid ───────────────────────────────
        AnimatedVisibility(
            visible = sectionVisible >= 2,
            enter = slideInVertically(tween(300)) + fadeIn(tween(200))
        ) {
            StatsGrid(
                todaysBestWpm = uiState.todaysBestWpm,
                levelsCleared = uiState.levelsCleared,
                levelsTotal = uiState.levelsTotal,
                totalAttempts = uiState.totalAttempts,
                bestWpmOverall = uiState.bestWpmOverall,
                averageAccuracy = uiState.averageAccuracy
            )
        }

        Spacer(modifier = Modifier.height(12.dp))

        // ── Tier Breakdown ───────────────────────────
        AnimatedVisibility(
            visible = sectionVisible >= 3,
            enter = slideInVertically(tween(300)) + fadeIn(tween(200))
        ) {
            TierBreakdownSection(tierStats = uiState.tierStats)
        }

        Spacer(modifier = Modifier.height(12.dp))

        // ── WPM Progression Chart ────────────────────
        AnimatedVisibility(
            visible = sectionVisible >= 4,
            enter = slideInVertically(tween(300)) + fadeIn(tween(200))
        ) {
            WpmChartSection(datapoints = uiState.wpmProgression)
        }

        Spacer(modifier = Modifier.height(12.dp))

        // ── Recent Activity ──────────────────────────
        AnimatedVisibility(
            visible = sectionVisible >= 5,
            enter = slideInVertically(tween(300)) + fadeIn(tween(200))
        ) {
            StatsActivitySection(
                activities = uiState.recentActivity
            )
        }

        Spacer(modifier = Modifier.height(32.dp))
    }
}

// ── Player Card ──────────────────────────────────────────

@Composable
private fun StatsPlayerCard(
    level: Int,
    title: String,
    stars: Int,
    xp: Int
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = Surface.copy(alpha = 0.8f))
    ) {
        Row(
            modifier = Modifier.fillMaxWidth().padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Level badge
            Box(
                modifier = Modifier
                    .size(56.dp)
                    .clip(RoundedCornerShape(12.dp))
                    .background(MagmaRed.copy(alpha = 0.15f)),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = "$level",
                    style = MaterialTheme.typography.headlineMedium,
                    color = MagmaRed,
                    fontWeight = FontWeight.Bold
                )
            }

            Spacer(modifier = Modifier.width(16.dp))

            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = title.uppercase(),
                    style = MaterialTheme.typography.titleMedium,
                    color = TextWhite,
                    fontWeight = FontWeight.Bold
                )
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        text = "★ $stars",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MoltenGold,
                        fontWeight = FontWeight.Bold
                    )
                    Spacer(modifier = Modifier.width(12.dp))
                    Text(
                        text = "$xp XP",
                        style = MaterialTheme.typography.bodySmall,
                        color = TextLabel
                    )
                }
            }
        }
    }
}

// ── Stats Grid ───────────────────────────────────────────

@Composable
private fun StatsGrid(
    todaysBestWpm: Int,
    levelsCleared: Int,
    levelsTotal: Int,
    totalAttempts: Int,
    bestWpmOverall: Int,
    averageAccuracy: Float
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = Surface.copy(alpha = 0.8f))
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(
                text = "OVERVIEW",
                style = MaterialTheme.typography.labelMedium,
                color = MagmaRed,
                fontWeight = FontWeight.Bold,
                letterSpacing = 2.sp
            )
            Spacer(modifier = Modifier.height(12.dp))

            // Row 1
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                StatCardItem(
                    label = "Today's Best",
                    value = if (todaysBestWpm > 0) "$todaysBestWpm WPM" else "—",
                    color = MagmaRed,
                    modifier = Modifier.weight(1f)
                )
                StatCardItem(
                    label = "Best WPM",
                    value = if (bestWpmOverall > 0) "$bestWpmOverall" else "—",
                    color = MoltenGold,
                    modifier = Modifier.weight(1f)
                )
            }

            Spacer(modifier = Modifier.height(8.dp))

            // Row 2
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                StatCardItem(
                    label = "Levels Cleared",
                    value = "$levelsCleared / $levelsTotal",
                    color = TextBody,
                    modifier = Modifier.weight(1f)
                )
                StatCardItem(
                    label = "Total Attempts",
                    value = "$totalAttempts",
                    color = TextLabel,
                    modifier = Modifier.weight(1f)
                )
            }

            Spacer(modifier = Modifier.height(8.dp))

            // Row 3
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                StatCardItem(
                    label = "Avg Accuracy",
                    value = if (averageAccuracy > 0f) "${(averageAccuracy * 100).roundToInt()}%" else "—",
                    color = NeonPurple,
                    modifier = Modifier.weight(1f)
                )
                Spacer(modifier = Modifier.weight(1f))
            }
        }
    }
}

@Composable
private fun StatCardItem(
    label: String,
    value: String,
    color: androidx.compose.ui.graphics.Color,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .clip(RoundedCornerShape(8.dp))
            .background(SurfaceDark.copy(alpha = 0.5f))
            .padding(12.dp)
    ) {
        Column {
            Text(
                text = value,
                style = MaterialTheme.typography.titleLarge,
                color = color,
                fontWeight = FontWeight.Bold
            )
            Text(
                text = label,
                style = MaterialTheme.typography.labelSmall,
                color = TextMuted
            )
        }
    }
}

// ── Tier Breakdown ───────────────────────────────────────

@Composable
private fun TierBreakdownSection(tierStats: List<TierStats>) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = Surface.copy(alpha = 0.8f))
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(
                text = "TIER PROGRESSION",
                style = MaterialTheme.typography.labelMedium,
                color = MagmaRed,
                fontWeight = FontWeight.Bold,
                letterSpacing = 2.sp
            )
            Spacer(modifier = Modifier.height(12.dp))

            tierStats.forEach { tier ->
                val color = TIER_COLORS[tier.name] ?: TextLabel
                val progress = if (tier.total > 0) tier.completed.toFloat() / tier.total else 0f

                Row(
                    modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    // Tier name
                    Text(
                        text = tier.name,
                        style = MaterialTheme.typography.labelMedium,
                        color = color,
                        fontWeight = FontWeight.SemiBold,
                        modifier = Modifier.width(90.dp)
                    )
                    Spacer(modifier = Modifier.width(8.dp))

                    // Progress bar
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .height(8.dp)
                            .clip(RoundedCornerShape(4.dp))
                            .background(SurfaceBorder.copy(alpha = 0.3f))
                    ) {
                        // Fill
                        val fillWidth by animateFloatAsState(
                            targetValue = progress,
                            animationSpec = tween(800, easing = FastOutSlowInEasing),
                            label = "tierFill_${tier.name}"
                        )
                        Box(
                            modifier = Modifier
                                .fillMaxHeight()
                                .fillMaxWidth(fillWidth)
                                .clip(RoundedCornerShape(4.dp))
                                .background(color.copy(alpha = 0.7f))
                        )
                    }

                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "${tier.completed} / ${tier.total}",
                        style = MaterialTheme.typography.labelSmall,
                        color = TextLabel
                    )
                }
            }
        }
    }
}

// ── WPM Chart ────────────────────────────────────────────

@Composable
private fun WpmChartSection(datapoints: List<WpmDatapoint>) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = Surface.copy(alpha = 0.8f))
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(
                text = "WPM PROGRESSION",
                style = MaterialTheme.typography.labelMedium,
                color = MagmaRed,
                fontWeight = FontWeight.Bold,
                letterSpacing = 2.sp
            )

            if (datapoints.isEmpty()) {
                Spacer(modifier = Modifier.height(24.dp))
                Text(
                    text = "Complete levels to see your WPM progression",
                    style = MaterialTheme.typography.bodySmall,
                    color = TextMuted,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.fillMaxWidth()
                )
                Spacer(modifier = Modifier.height(24.dp))
            } else {
                Spacer(modifier = Modifier.height(12.dp))

                // Y-axis labels
                val maxWpm = (datapoints.maxOfOrNull { it.wpm } ?: 1) * 1.2f
                val minWpm = 0f

                // Chart animation
                val chartProgress by animateFloatAsState(
                    targetValue = 1f,
                    animationSpec = tween(1200, easing = FastOutSlowInEasing),
                    label = "wpmChartProgress"
                )

                Box(modifier = Modifier.fillMaxWidth().height(160.dp)) {
                    val textColor = TextMuted

                    // Y-axis labels
                    Column(
                        modifier = Modifier.align(Alignment.CenterStart).fillMaxHeight(),
                        verticalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text("${maxWpm.roundToInt()}", style = MaterialTheme.typography.labelSmall, color = textColor)
                        Text("${((maxWpm + minWpm) / 2).roundToInt()}", style = MaterialTheme.typography.labelSmall, color = textColor)
                        Text("${minWpm.roundToInt()}", style = MaterialTheme.typography.labelSmall, color = textColor)
                    }

                    Spacer(modifier = Modifier.width(28.dp))

                    // Chart canvas
                    Canvas(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(start = 32.dp)
                    ) {
                        val chartW = size.width
                        val chartH = size.height
                        val range = (maxWpm - minWpm).coerceAtLeast(1f)
                        val points = datapoints.take((datapoints.size * chartProgress).toInt().coerceAtLeast(1))

                        if (points.size >= 2) {
                            // Draw grid lines
                            for (i in 0..3) {
                                val y = chartH * i / 3
                                drawLine(
                                    color = SurfaceBorder.copy(alpha = 0.2f),
                                    start = Offset(0f, y),
                                    end = Offset(chartW, y),
                                    strokeWidth = 1f
                                )
                            }

                            // Draw line path
                            val path = Path()
                            val stepX = chartW / (points.size - 1).coerceAtLeast(1)

                            points.forEachIndexed { index, dp ->
                                val x = index * stepX
                                val y = chartH * (1f - (dp.wpm - minWpm) / range)

                                if (index == 0) path.moveTo(x, y)
                                else path.lineTo(x, y)
                            }

                            drawPath(
                                path = path,
                                color = MagmaRed.copy(alpha = 0.8f),
                                style = Stroke(width = 2.5f, cap = StrokeCap.Round, join = StrokeJoin.Round)
                            )

                            // Glow under line
                            val glowPath = Path()
                            glowPath.addPath(path)
                            glowPath.lineTo(chartW, chartH)
                            glowPath.lineTo(0f, chartH)
                            glowPath.close()
                            drawPath(
                                path = glowPath,
                                brush = Brush.verticalGradient(
                                    colors = listOf(
                                        MagmaRed.copy(alpha = 0.1f),
                                        Color.Transparent
                                    )
                                )
                            )

                            // Data points
                            points.forEachIndexed { index, dp ->
                                val x = index * stepX
                                val y = chartH * (1f - (dp.wpm - minWpm) / range)

                                val starColor = when (dp.stars) {
                                    3 -> MoltenGold
                                    2 -> MoltenGold.copy(alpha = 0.7f)
                                    else -> MagmaRed.copy(alpha = 0.5f)
                                }
                                drawCircle(color = starColor, radius = 3f, center = Offset(x, y))
                                drawCircle(color = starColor.copy(alpha = 0.3f), radius = 6f, center = Offset(x, y))
                            }
                        } else if (points.size == 1) {
                            // Single point
                            val x = chartW / 2
                            val y = chartH * (1f - (points[0].wpm - minWpm) / range)
                            drawCircle(color = MagmaRed, radius = 4f, center = Offset(x, y))
                        }
                    }
                }

                // X-axis labels
                Row(
                    modifier = Modifier.fillMaxWidth().padding(start = 32.dp),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    val first = datapoints.firstOrNull()?.levelId ?: 1
                    val last = datapoints.lastOrNull()?.levelId ?: 1
                    Text(
                        text = "Lv.$first",
                        style = MaterialTheme.typography.labelSmall,
                        color = TextDisabled
                    )
                    if (datapoints.size > 1) {
                        Text(
                            text = "Lv.$last",
                            style = MaterialTheme.typography.labelSmall,
                            color = TextDisabled
                        )
                    }
                }
            }
        }
    }
}

// ── Activity Section ─────────────────────────────────────

@Composable
private fun StatsActivitySection(
    activities: List<com.typestrike.data.model.ActivityEvent>
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = Surface.copy(alpha = 0.8f))
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(
                text = "RECENT ACTIVITY",
                style = MaterialTheme.typography.labelMedium,
                color = MagmaRed,
                fontWeight = FontWeight.Bold,
                letterSpacing = 2.sp
            )
            Spacer(modifier = Modifier.height(8.dp))

            if (activities.isEmpty()) {
                Text(
                    text = "No activity yet. Complete a level to start tracking!",
                    style = MaterialTheme.typography.bodySmall,
                    color = TextMuted,
                    modifier = Modifier.padding(vertical = 16.dp)
                )
            } else {
                activities.take(8).forEach { event ->
                    StatsActivityItem(event = event)
                    HorizontalDivider(thickness = 0.5.dp, color = SurfaceBorder.copy(alpha = 0.2f))
                }
            }
        }
    }
}

@Composable
private fun StatsActivityItem(event: com.typestrike.data.model.ActivityEvent) {
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
            .padding(vertical = 10.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier
                .size(28.dp)
                .clip(RoundedCornerShape(6.dp))
                .background(color.copy(alpha = 0.1f)),
            contentAlignment = Alignment.Center
        ) {
            Text(text = icon, fontSize = 12.sp, color = color)
        }
        Spacer(modifier = Modifier.width(10.dp))
        Text(
            text = desc,
            style = MaterialTheme.typography.bodySmall,
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

// ── Loading State ────────────────────────────────────────

@Composable
private fun StatsLoadingState() {
    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            CircularProgressIndicator(color = MagmaRed, modifier = Modifier.size(32.dp))
            Spacer(modifier = Modifier.height(16.dp))
            Text("Loading stats…", style = MaterialTheme.typography.bodyMedium, color = TextLabel)
        }
    }
}

// ── Error State ──────────────────────────────────────────

@Composable
private fun StatsErrorState(message: String, onRetry: () -> Unit) {
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
