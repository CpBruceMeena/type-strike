package com.typestrike.ui.dailychallenges

import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
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
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.typestrike.data.model.DailyChallenge
import com.typestrike.ui.effects.*
import com.typestrike.ui.theme.*
import kotlinx.coroutines.delay

// ── Challenge type display info ──────────────────────────

private fun challengeColor(type: String): Color = when (type) {
    "speed_sprint" -> MagmaRed
    "precision_mode" -> SuccessGreen
    "star_challenge" -> MoltenGold
    else -> MagmaRed
}

private fun challengeGradient(type: String): List<Color> = when (type) {
    "speed_sprint" -> listOf(MagmaRed, MagmaRedDark)
    "precision_mode" -> listOf(SuccessGreen, SuccessGreen.copy(alpha = 0.6f))
    "star_challenge" -> listOf(MoltenGold, MoltenGold.copy(alpha = 0.6f))
    else -> listOf(MagmaRed, MagmaRedDark)
}

// ── Main Screen ──────────────────────────────────────────

@Composable
fun DailyChallengesScreen(
    onBack: () -> Unit = {},
    onPlayChallenge: (Int) -> Unit = {},  // levelId
    viewModel: DailyChallengesViewModel = hiltViewModel()
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

    Box(modifier = Modifier.fillMaxSize().background(Background)) {
        MapParticleField(
            config = particleConfig.copy(opacity = 0.2f, glowEnabled = false),
            modifier = Modifier.fillMaxSize()
        )

        Column(modifier = Modifier.fillMaxSize().statusBarsPadding()) {
            // Header
            DailyChallengesHeader(
                onBack = onBack,
                entranceStarted = entranceStarted,
                completed = uiState.totalCompleted,
                total = uiState.challenges.size,
                totalXp = uiState.totalRewardXp,
                totalStars = uiState.totalRewardStars,
                date = uiState.challengeDate,
                streakCount = uiState.streakCount,
                streakMultiplier = uiState.streakMultiplier
            )

            when {
                uiState.isLoading -> LoadingState()
                uiState.hasError -> ErrorState(
                    message = uiState.errorMessage ?: "Failed to load challenges",
                    onRetry = { viewModel.retry() }
                )
                else -> ChallengeList(
                    challenges = uiState.challenges,
                    entranceStarted = entranceStarted,
                    onPlayChallenge = onPlayChallenge
                )
            }
        }

        // Reward animation overlay
        if (uiState.showRewardAnimation) {
            RewardAnimation(
                xp = uiState.lastRewardXp,
                stars = uiState.lastRewardStars,
                multiplier = uiState.streakMultiplier,
                streakCount = uiState.streakCount,
                onDismiss = { viewModel.dismissReward() }
            )
        }
    }
}

// ── Streak Badge ──────────────────────────────────────────

@Composable
private fun StreakBadge(
    streakCount: Int,
    multiplier: Double
) {
    val infiniteTransition = rememberInfiniteTransition(label = "streakGlow")
    val glowAlpha by infiniteTransition.animateFloat(
        initialValue = 0.3f,
        targetValue = 0.6f,
        animationSpec = infiniteRepeatable(
            animation = tween(1200, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "streakGlow"
    )

    Row(
        verticalAlignment = Alignment.CenterVertically,
        modifier = Modifier
            .clip(RoundedCornerShape(8.dp))
            .background(
                if (streakCount > 1) MagmaRed.copy(alpha = 0.15f)
                else SurfaceBorder.copy(alpha = 0.2f)
            )
            .border(
                1.dp,
                if (streakCount > 1) MagmaRed.copy(alpha = if (streakCount > 2) 0.4f else 0.2f)
                else SurfaceBorder.copy(alpha = 0.1f),
                RoundedCornerShape(8.dp)
            )
            .padding(horizontal = 8.dp, vertical = 4.dp)
    ) {
        // Flame glow for active streak
        if (streakCount > 1) {
            Box(
                modifier = Modifier
                    .size(8.dp)
                    .clip(CircleShape)
                    .background(MagmaRed.copy(alpha = glowAlpha))
            )
            Spacer(modifier = Modifier.width(4.dp))
        }

        Text(
            text = if (streakCount >= 1) "\uD83D\uDD25" else "\uD83D\uDD25",
            fontSize = 14.sp
        )
        Spacer(modifier = Modifier.width(3.dp))
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text(
                text = "$streakCount",
                style = MaterialTheme.typography.labelMedium,
                color = if (streakCount > 1) MagmaRed else TextMuted,
                fontWeight = if (streakCount > 1) FontWeight.Bold else FontWeight.SemiBold
            )
            if (streakCount > 0 && multiplier > 1.0) {
                Text(
                    text = "${String.format("%.1f", multiplier)}×",
                    style = MaterialTheme.typography.labelSmall,
                    color = MagmaRed.copy(alpha = 0.7f),
                    fontSize = 8.sp
                )
            }
        }
    }
}

// ── Header ───────────────────────────────────────────────

@Composable
private fun DailyChallengesHeader(
    onBack: () -> Unit,
    entranceStarted: Boolean,
    completed: Int,
    total: Int,
    totalXp: Int,
    totalStars: Int,
    date: String,
    streakCount: Int = 0,
    streakMultiplier: Double = 1.0
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
                    Text("\u2190", color = TextBody, fontSize = 22.sp)
                }
                Spacer(modifier = Modifier.width(4.dp))
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = "DAILY CHALLENGES",
                        style = MaterialTheme.typography.titleMedium,
                        color = TextWhite,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 3.sp
                    )
                    if (date.isNotEmpty()) {
                        Text(
                            text = date,
                            style = MaterialTheme.typography.labelSmall,
                            color = TextMuted
                        )
                    }
                }

                // Streak badge
                StreakBadge(streakCount = streakCount, multiplier = streakMultiplier)
            }

            // Progress summary card
            if (total > 0) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 4.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    // Progress bar
                    val progress = completed.toFloat() / total
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
                                .background(
                                    brush = Brush.horizontalGradient(
                                        colors = listOf(MagmaRed, MoltenGold)
                                    )
                                )
                        )
                    }
                    Spacer(modifier = Modifier.width(12.dp))
                    Text(
                        text = "$completed / $total",
                        style = MaterialTheme.typography.labelSmall,
                        color = MoltenGold,
                        fontWeight = FontWeight.Bold
                    )
                }

                // Rewards summary
                if (totalXp > 0 || totalStars > 0) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 16.dp, vertical = 2.dp),
                        horizontalArrangement = Arrangement.End,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        if (totalXp > 0) {
                            Text(
                                text = "+$totalXp XP",
                                style = MaterialTheme.typography.labelSmall,
                                color = MagmaRed,
                                fontWeight = FontWeight.SemiBold
                            )
                        }
                        if (totalStars > 0) {
                            Spacer(modifier = Modifier.width(12.dp))
                            Text(
                                text = "+$totalStars \u2605",
                                style = MaterialTheme.typography.labelSmall,
                                color = MoltenGold,
                                fontWeight = FontWeight.SemiBold
                            )
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(4.dp))
        }
    }
}

// ── Challenge List ───────────────────────────────────────

@Composable
private fun ChallengeList(
    challenges: List<DailyChallenge>,
    entranceStarted: Boolean,
    onPlayChallenge: (Int) -> Unit
) {
    val scrollState = rememberScrollState()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(scrollState)
            .padding(horizontal = 16.dp)
    ) {
        Spacer(modifier = Modifier.height(8.dp))

        challenges.forEachIndexed { index, challenge ->
            val delayMs = 200 + index * 200

            AnimatedVisibility(
                visible = entranceStarted,
                enter = slideInVertically(
                    animationSpec = tween(400, delayMillis = delayMs),
                    initialOffsetY = { it / 2 }
                ) + fadeIn(tween(300, delayMillis = delayMs))
            ) {
                ChallengeCard(
                    challenge = challenge,
                    index = index,
                    onClick = {
                        if (!challenge.completed) {
                            onPlayChallenge(challenge.levelId)
                        }
                    }
                )
            }

            Spacer(modifier = Modifier.height(12.dp))
        }

        Spacer(modifier = Modifier.height(32.dp))
    }
}

// ── Challenge Card ───────────────────────────────────────

@Composable
private fun ChallengeCard(
    challenge: DailyChallenge,
    index: Int,
    onClick: () -> Unit
) {
    val isCompleted = challenge.completed
    val accentColor = challengeColor(challenge.challengeType)
    val gradient = challengeGradient(challenge.challengeType)

    // Pulse animation for incomplete challenges
    val infiniteTransition = rememberInfiniteTransition(label = "challengePulse_$index")
    val pulseAlpha by infiniteTransition.animateFloat(
        initialValue = 0.02f,
        targetValue = 0.06f,
        animationSpec = infiniteRepeatable(
            animation = tween(1500, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "pulseAlpha_$index"
    )

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(
            containerColor = if (isCompleted) SurfaceDark.copy(alpha = 0.5f) else Surface.copy(alpha = 0.85f)
        ),
        border = if (isCompleted) BorderStroke(1.dp, accentColor.copy(alpha = 0.15f))
                else BorderStroke(1.dp, SurfaceBorder.copy(alpha = 0.3f)),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
    ) {
        Box {
            // Ambient pulse glow for incomplete
            if (!isCompleted) {
                Box(
                    modifier = Modifier
                        .matchParentSize()
                        .clip(RoundedCornerShape(14.dp))
                        .background(accentColor.copy(alpha = pulseAlpha))
                )
            }

            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .then(
                        if (!isCompleted) Modifier.clickable(onClick = onClick)
                        else Modifier
                    )
                    .padding(16.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Icon circle
                Box(
                    modifier = Modifier
                        .size(48.dp)
                        .clip(RoundedCornerShape(12.dp))
                        .background(
                            brush = Brush.linearGradient(
                                colors = gradient,
                                start = androidx.compose.ui.geometry.Offset.Zero,
                                end = androidx.compose.ui.geometry.Offset.Infinite
                            )
                        ),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = challenge.icon,
                        fontSize = 22.sp,
                        modifier = Modifier.alpha(if (isCompleted) 0.6f else 1f)
                    )
                }

                Spacer(modifier = Modifier.width(14.dp))

                // Challenge info
                Column(modifier = Modifier.weight(1f)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(
                            text = challenge.challengeName.uppercase(),
                            style = MaterialTheme.typography.bodyMedium,
                            color = if (isCompleted) TextMuted else TextWhite,
                            fontWeight = if (isCompleted) FontWeight.Normal else FontWeight.Bold,
                            maxLines = 1
                        )
                        if (isCompleted) {
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                text = "\u2713",
                                color = accentColor,
                                fontSize = 16.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(2.dp))

                    Text(
                        text = challenge.description,
                        style = MaterialTheme.typography.labelSmall,
                        color = if (isCompleted) TextMuted.copy(alpha = 0.6f) else TextBody,
                        maxLines = 2
                    )

                    // Target & reward row
                    Spacer(modifier = Modifier.height(6.dp))
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        // Target indicator
                        TargetPill(
                            label = "${challenge.targetWpm} WPM",
                            color = MagmaRed,
                            faded = isCompleted
                        )
                        if (challenge.targetAccuracy > 0) {
                            TargetPill(
                                label = "${challenge.targetAccuracy.toInt()}% ACC",
                                color = SuccessGreen,
                                faded = isCompleted
                            )
                        }
                        // Reward
                        TargetPill(
                            label = "+${challenge.rewardXp} XP \u2605+${challenge.rewardStars}",
                            color = MoltenGold,
                            faded = isCompleted
                        )
                    }

                    // Progress indicator for attempts
                    if (challenge.attempts > 0 && !isCompleted) {
                        Spacer(modifier = Modifier.height(4.dp))
                        val bestWpmStr = if (challenge.currentBestWpm > 0) "Best: ${challenge.currentBestWpm} WPM" else ""
                        val bestAccStr = if (challenge.currentBestAccuracy > 0) "${challenge.currentBestAccuracy.toInt()}%" else ""
                        val bestStr = listOfNotNull(bestWpmStr, bestAccStr).joinToString(" \u00b7 ")
                        if (bestStr.isNotEmpty()) {
                            Text(
                                text = "Attempt #${challenge.attempts} \u00b7 $bestStr",
                                style = MaterialTheme.typography.labelSmall,
                                color = TextMuted,
                                fontSize = 9.sp
                            )
                        }
                    }
                }

                // Play button or checkmark
                if (isCompleted) {
                    Text("\u2713", color = accentColor, fontSize = 24.sp, fontWeight = FontWeight.Bold)
                } else {
                    val scale by animateFloatAsState(
                        targetValue = 1f,
                        animationSpec = spring(dampingRatio = 0.6f, stiffness = 300f),
                        label = "playScale_$index"
                    )
                    Box(
                        modifier = Modifier
                            .size(44.dp)
                            .scale(scale)
                            .clip(CircleShape)
                            .background(accentColor)
                            .clickable(onClick = onClick),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "\u25B6",
                            color = TextWhite,
                            fontSize = 18.sp,
                            modifier = Modifier.padding(start = 2.dp)
                        )
                    }
                }
            }
        }
    }
}

// ── Target Pill ──────────────────────────────────────────

@Composable
private fun TargetPill(
    label: String,
    color: Color,
    faded: Boolean = false
) {
    Box(
        modifier = Modifier
            .clip(RoundedCornerShape(4.dp))
            .background(color.copy(alpha = if (faded) 0.05f else 0.12f))
            .padding(horizontal = 6.dp, vertical = 2.dp)
    ) {
        Text(
            text = label,
            style = MaterialTheme.typography.labelSmall,
            color = if (faded) color.copy(alpha = 0.4f) else color,
            fontWeight = FontWeight.SemiBold,
            fontSize = 9.sp
        )
    }
}

// ── Reward Animation ─────────────────────────────────────

@Composable
private fun RewardAnimation(
    xp: Int,
    stars: Int,
    multiplier: Double = 1.0,
    streakCount: Int = 0,
    onDismiss: () -> Unit
) {
    var visible by remember { mutableStateOf(true) }

    LaunchedEffect(Unit) {
        delay(2000)
        visible = false
        onDismiss()
    }

    AnimatedVisibility(
        visible = visible,
        enter = scaleIn(tween(300)) + fadeIn(tween(200)),
        exit = fadeOut(tween(500))
    ) {
        Box(
            modifier = Modifier.fillMaxSize().background(ScrimBlack.copy(alpha = 0.5f)),
            contentAlignment = Alignment.Center
        ) {
            // Animated star burst
            val starScale by animateFloatAsState(
                targetValue = 1f,
                animationSpec = spring(dampingRatio = 0.4f, stiffness = 200f),
                label = "rewardScale"
            )

            Card(
                modifier = Modifier
                    .width(280.dp)
                    .scale(starScale),
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = Surface.copy(alpha = 0.95f)),
                border = BorderStroke(1.dp, MoltenGold.copy(alpha = 0.5f)),
                elevation = CardDefaults.cardElevation(defaultElevation = 12.dp)
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(24.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text("\u2728", fontSize = 48.sp)
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "CHALLENGE COMPLETE!",
                        style = MaterialTheme.typography.titleLarge,
                        color = MoltenGold,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 2.sp,
                        textAlign = TextAlign.Center
                    )
                    if (multiplier > 1.0 && streakCount > 0) {
                        Spacer(modifier = Modifier.height(4.dp))
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier
                                .clip(RoundedCornerShape(6.dp))
                                .background(MagmaRed.copy(alpha = 0.12f))
                                .padding(horizontal = 10.dp, vertical = 3.dp)
                        ) {
                            Text("\uD83D\uDD25", fontSize = 14.sp)
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(
                                text = "$streakCount-day streak! ×${String.format("%.1f", multiplier)}",
                                style = MaterialTheme.typography.labelSmall,
                                color = MagmaRed,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                    Spacer(modifier = Modifier.height(12.dp))
                    Row(
                        horizontalArrangement = Arrangement.Center,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                    if (xp > 0) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Text(
                                text = "+$xp",
                                style = MaterialTheme.typography.headlineMedium,
                                color = MagmaRed,
                                fontWeight = FontWeight.Bold
                            )
                            Text("XP", style = MaterialTheme.typography.labelSmall, color = TextMuted)
                        }
                    }
                        if (stars > 0) {
                            if (xp > 0) Spacer(modifier = Modifier.width(32.dp))
                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                Text(
                                    text = "+$stars",
                                    style = MaterialTheme.typography.headlineMedium,
                                    color = MoltenGold,
                                    fontWeight = FontWeight.Bold
                                )
                                Text("\u2605 Stars", style = MaterialTheme.typography.labelSmall, color = TextMuted)
                            }
                        }
                    }
                    Spacer(modifier = Modifier.height(16.dp))
                    Text(
                        text = "Tap anywhere to continue",
                        style = MaterialTheme.typography.labelSmall,
                        color = TextDisabled,
                        modifier = Modifier.alpha(0.6f)
                    )
                }
            }
        }
    }
}

// ── Loading State ────────────────────────────────────────

@Composable
private fun LoadingState() {
    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            CircularProgressIndicator(color = MagmaRed, modifier = Modifier.size(32.dp))
            Spacer(modifier = Modifier.height(16.dp))
            Text("Generating challenges\u2026", style = MaterialTheme.typography.bodyMedium, color = TextLabel)
        }
    }
}

// ── Error State ──────────────────────────────────────────

@Composable
private fun ErrorState(message: String, onRetry: () -> Unit) {
    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text("\u26A0\uFE0F", fontSize = 32.sp)
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
