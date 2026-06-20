package com.typestrike.ui.levelpreview

import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
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
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.*
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.typestrike.ui.theme.*
import kotlinx.coroutines.delay

// ── Tier helpers ─────────────────────────────────────────

private data class TierDisplay(
    val label: String,
    val icon: String,
    val color: Color,
    val bgColor: Color
)

private fun tierFor(tier: String): TierDisplay = when (tier.lowercase()) {
    "ember" -> TierDisplay("Ember", "🔥", MagmaRed, MagmaRed.copy(alpha = 0.15f))
    "igneious" -> TierDisplay("Igneous", "🌋", TierIgneous, TierIgneous.copy(alpha = 0.15f))
    "magma_core" -> TierDisplay("Magma Core", "🔴", NeonPurple, NeonPurple.copy(alpha = 0.15f))
    "obsidian" -> TierDisplay("Obsidian", "⚫", TierObsidian, TierObsidian.copy(alpha = 0.08f))
    else -> TierDisplay("Unknown", "❓", TextLabel, TextLabel.copy(alpha = 0.1f))
}

private fun difficultyLabel(difficulty: Int): String = when (difficulty) {
    1 -> "Beginner"
    2 -> "Medium"
    3 -> "Hard"
    4 -> "Expert"
    else -> "Unknown"
}

private fun filledShards(difficulty: Int): Int = when (difficulty) {
    1 -> 1
    2 -> 3
    3 -> 4
    4 -> 5
    else -> 1
}

private fun starsString(stars: Int): String = "★".repeat(stars.coerceIn(0, 3))

// ── Main Screen ──────────────────────────────────────────

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LevelPreviewScreen(
    levelId: Int,
    onStrike: (Int) -> Unit = {},
    onDismiss: () -> Unit = {},
    viewModel: LevelPreviewViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()

    LaunchedEffect(levelId) {
        viewModel.loadLevel(levelId)
    }

    val sheetState = rememberModalBottomSheetState(
        skipPartiallyExpanded = true,
        confirmValueChange = { true }
    )

    // Animate dismiss
    LaunchedEffect(uiState.isLoading) {
        if (!uiState.isLoading && uiState.hasError) {
            delay(2000)
            onDismiss()
        }
    }

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = sheetState,
        containerColor = Surface,
        shape = RoundedCornerShape(topStart = 20.dp, topEnd = 20.dp),
        tonalElevation = 0.dp,
        scrimColor = ScrimBlack,
        dragHandle = {
            Box(
                modifier = Modifier
                    .padding(top = 8.dp)
                    .width(32.dp)
                    .height(4.dp)
                    .clip(RoundedCornerShape(2.dp))
                    .background(TextDisabled)
            )
        }
    ) {
        when {
            uiState.isLoading -> LevelPreviewLoading()
            uiState.hasError -> LevelPreviewError(
                message = uiState.errorMessage ?: "Failed to load level"
            )
            uiState.levelDetail != null -> LevelPreviewContent(
                detail = uiState.levelDetail!!,
                onStrike = { onStrike(uiState.levelDetail!!.id) }
            )
        }
    }
}

// ── Content ──────────────────────────────────────────────

@Composable
private fun LevelPreviewContent(
    detail: com.typestrike.data.model.LevelDetail,
    onStrike: () -> Unit
) {
    val tier = tierFor(detail.tier)
    val shardCount = filledShards(detail.difficulty)
    val hasBestScore = detail.playerStars != null

    // Staggered entrance animation
    var animPhase by remember { mutableIntStateOf(0) }
    LaunchedEffect(Unit) {
        delay(100); animPhase = 1  // Header
        delay(100); animPhase = 2  // Difficulty
        delay(100); animPhase = 3  // Metrics
        delay(100); animPhase = 4  // Words
        delay(100); animPhase = 5  // Button
    }

    // STRIKE button glow
    val infiniteTransition = rememberInfiniteTransition(label = "strikeGlow")
    val glowAlpha by infiniteTransition.animateFloat(
        initialValue = 0.15f,
        targetValue = 0.35f,
        animationSpec = infiniteRepeatable(
            animation = tween(2000, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "strikeGlow"
    )

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .systemBarsPadding()
            .padding(bottom = 16.dp)
    ) {
        // ── Header ──────────────────────────────────────
        AnimatedVisibility(
            visible = animPhase >= 1,
            enter = fadeIn(tween(200))
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(start = 20.dp, end = 20.dp, top = 12.dp, bottom = 4.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = detail.name.uppercase(),
                    style = MaterialTheme.typography.headlineSmall,
                    color = TextWhite,
                    fontWeight = FontWeight.Bold
                )
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(6.dp))
                        .background(tier.bgColor)
                        .padding(horizontal = 10.dp, vertical = 4.dp)
                ) {
                    Text(
                        text = "${tier.label} ${tier.icon}",
                        style = MaterialTheme.typography.labelSmall,
                        color = tier.color,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }

        // ── Difficulty Indicator ────────────────────────
        AnimatedVisibility(
            visible = animPhase >= 2,
            enter = fadeIn(tween(200))
        ) {
            Row(
                modifier = Modifier
                    .padding(start = 20.dp, end = 20.dp, top = 4.dp, bottom = 4.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Shards
                repeat(5) { i ->
                    val isFilled = i < shardCount
                    val shardDelay = i * 80

                    AnimatedVisibility(
                        visible = animPhase >= 2,
                        enter = fadeIn(tween(200, delayMillis = shardDelay))
                    ) {
                        Canvas(modifier = Modifier.size(14.dp).padding(2.dp)) {
                            val diamondPath = Path().apply {
                                moveTo(size.width / 2, 0f)
                                lineTo(size.width, size.height / 2)
                                lineTo(size.width / 2, size.height)
                                lineTo(0f, size.height / 2)
                                close()
                            }
                            drawPath(
                                path = diamondPath,
                                color = if (isFilled) MagmaRed else SurfaceBorder
                            )
                            if (isFilled) {
                                drawPath(
                                    path = diamondPath,
                                    color = MagmaRed.copy(alpha = 0.3f),
                                    style = Stroke(width = 1f)
                                )
                            }
                            // Glow on filled shards
                            if (isFilled) {
                                drawCircle(
                                    color = MagmaRed.copy(alpha = 0.15f),
                                    radius = size.width * 0.6f,
                                    center = Offset(size.width / 2, size.height / 2)
                                )
                            }
                        }
                    }
                    Spacer(modifier = Modifier.width(6.dp))
                }
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = "Difficulty: ${difficultyLabel(detail.difficulty)}",
                    style = MaterialTheme.typography.bodySmall,
                    color = TextMuted
                )
            }
        }

        Spacer(modifier = Modifier.height(8.dp))

        // ── Metrics Section ─────────────────────────────
        AnimatedVisibility(
            visible = animPhase >= 3,
            enter = slideInVertically(
                animationSpec = tween(300, easing = FastOutSlowInEasing),
                initialOffsetY = { it / 2 }
            ) + fadeIn(tween(300))
        ) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp)
                    .clip(RoundedCornerShape(8.dp))
                    .background(SurfaceDark.copy(alpha = 0.5f))
                    .padding(horizontal = 16.dp, vertical = 12.dp)
            ) {
                Column {
                    // Pass Row
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "PASS",
                            style = MaterialTheme.typography.labelSmall,
                            color = TextMuted,
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier.width(42.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "${detail.passWpm} WPM",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MagmaRed,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = " · ",
                            style = MaterialTheme.typography.bodyMedium,
                            color = SurfaceBorder
                        )
                        Text(
                            text = "${detail.passAccuracy}% ACC",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MagmaRed,
                            fontWeight = FontWeight.Bold
                        )
                    }

                    // Best Row (only if player has played this level)
                    if (hasBestScore) {
                        Spacer(modifier = Modifier.height(4.dp))
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = "BEST",
                                style = MaterialTheme.typography.labelSmall,
                                color = MoltenGold,
                                fontWeight = FontWeight.Bold,
                                modifier = Modifier.width(42.dp)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = "${detail.playerBestWpm ?: 0} WPM",
                                style = MaterialTheme.typography.bodyMedium,
                                color = MoltenGold,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = " · ",
                                style = MaterialTheme.typography.bodyMedium,
                                color = SurfaceBorder
                            )
                            Text(
                                text = "${(detail.playerBestAcc ?: 0f).toInt()}% ACC",
                                style = MaterialTheme.typography.bodyMedium,
                                color = MoltenGold,
                                fontWeight = FontWeight.Bold
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            val stars = detail.playerStars ?: 0
                            Text(
                                text = if (stars > 0) starsString(stars) else "",
                                color = MoltenGold,
                                fontSize = 14.sp,
                                style = MaterialTheme.typography.bodyMedium
                            )
                        }
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        // ── Paragraph Preview ───────────────────────────
        AnimatedVisibility(
            visible = animPhase >= 4,
            enter = fadeIn(tween(300))
        ) {
            Column(
                modifier = Modifier
                    .padding(horizontal = 20.dp)
            ) {
                // Short preview of the paragraph
                val previewText = detail.paragraph
                    .take(120)
                    .replaceFirstChar { it.uppercase() }
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text("📜", fontSize = 12.sp, color = TextDisabled)
                    Spacer(modifier = Modifier.width(8.dp))
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(8.dp))
                            .background(Surface.copy(alpha = 0.3f))
                            .border(1.dp, SurfaceBorder, RoundedCornerShape(8.dp))
                            .height(48.dp)
                            .verticalScroll(rememberScrollState())
                            .padding(horizontal = 10.dp, vertical = 6.dp)
                    ) {
                        Text(
                            text = "\"$previewText…\"",
                            style = MaterialTheme.typography.bodySmall,
                            color = TextLabel,
                            maxLines = 2
                        )
                    }
                }
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "${detail.paragraph.length} characters · mixed case, numbers, punctuation",
                    style = MaterialTheme.typography.labelSmall,
                    color = TextDisabled,
                    modifier = Modifier.padding(start = 24.dp)
                )
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // ── STRIKE Button ───────────────────────────────
        AnimatedVisibility(
            visible = animPhase >= 5,
            enter = slideInVertically(
                animationSpec = tween(400, easing = FastOutSlowInEasing),
                initialOffsetY = { it / 2 }
            ) + fadeIn(tween(300))
        ) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp)
            ) {
                // Glow layer behind button
                Box(
                    modifier = Modifier
                        .matchParentSize()
                        .padding(horizontal = 4.dp, vertical = 4.dp)
                        .clip(RoundedCornerShape(12.dp))
                        .alpha(glowAlpha)
                        .background(MagmaRed)
                )
                // Button
                Button(
                    onClick = onStrike,
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(52.dp),
                    shape = RoundedCornerShape(12.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = MagmaRed)
                ) {
                    Text(
                        text = "🔥  STRIKE",
                        style = MaterialTheme.typography.titleMedium,
                        color = TextWhite,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 2.sp
                    )
                }
            }
        }

        // Bottom safe area spacer
        Spacer(modifier = Modifier.height(8.dp))
    }
}

// ── Loading State ────────────────────────────────────────

@Composable
private fun LevelPreviewLoading() {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(40.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        CircularProgressIndicator(color = MagmaRed, modifier = Modifier.size(28.dp))
        Spacer(modifier = Modifier.height(16.dp))
        Text(
            text = "Loading level…",
            style = MaterialTheme.typography.bodyMedium,
            color = TextLabel
        )
        Spacer(modifier = Modifier.height(40.dp))
    }
}

// ── Error State ──────────────────────────────────────────

@Composable
private fun LevelPreviewError(message: String) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(40.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text("⚠️", fontSize = 32.sp)
        Spacer(modifier = Modifier.height(8.dp))
        Text(
            text = message,
            style = MaterialTheme.typography.bodyMedium,
            color = TextMuted,
            textAlign = TextAlign.Center
        )
        Spacer(modifier = Modifier.height(24.dp))
    }
}
