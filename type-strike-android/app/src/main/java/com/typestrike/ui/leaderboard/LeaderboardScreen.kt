package com.typestrike.ui.leaderboard

import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.CircleShape
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
import com.typestrike.data.model.LeaderboardEntry
import com.typestrike.ui.effects.MapParticleField
import com.typestrike.ui.effects.ParticleConfig
import com.typestrike.ui.theme.*
import kotlinx.coroutines.delay

// ── Main Screen ──────────────────────────────────────────

@Composable
fun LeaderboardScreen(
    onBack: () -> Unit = {},
    onViewPlayer: (Int) -> Unit = {},
    viewModel: LeaderboardViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()

    val particleConfig = remember { ParticleConfig.fromQuality(ParticleConfig.detect()) }

    Box(modifier = Modifier.fillMaxSize().background(Background)) {
        MapParticleField(
            config = particleConfig.copy(opacity = 0.2f, glowEnabled = false),
            modifier = Modifier.fillMaxSize()
        )

        Column(modifier = Modifier.fillMaxSize().statusBarsPadding()) {
            // Header
            LeaderboardHeader(
                onBack = onBack,
                entranceStarted = uiState.entranceStarted
            )

            // Tab row
            LeaderboardTabRow(
                activeTab = uiState.activeTab,
                onTabSelected = { viewModel.switchTab(it) },
                entranceStarted = uiState.entranceStarted
            )

            // Content
            when {
                uiState.isLoading -> LeaderboardLoadingState()
                uiState.hasError -> LeaderboardErrorState(
                    message = uiState.errorMessage ?: "Failed to load",
                    onRetry = { viewModel.retry() }
                )
                else -> LeaderboardContent(
                    entries = if (uiState.activeTab == LeaderboardTab.GLOBAL)
                        uiState.globalEntries else uiState.dailyEntries,
                    totalCount = if (uiState.activeTab == LeaderboardTab.GLOBAL)
                        uiState.globalTotalCount else uiState.dailyTotalCount,
                    playerRank = uiState.playerRank,
                    isDaily = uiState.activeTab == LeaderboardTab.DAILY,
                    entranceStarted = uiState.entranceStarted
                )
            }
        }
    }
}

// ── Header ───────────────────────────────────────────────

@Composable
private fun LeaderboardHeader(
    onBack: () -> Unit,
    entranceStarted: Boolean
) {
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
                text = "LEADERBOARD",
                style = MaterialTheme.typography.titleMedium,
                color = TextWhite,
                fontWeight = FontWeight.Bold,
                letterSpacing = 3.sp
            )
        }
    }
}

// ── Tab Row ──────────────────────────────────────────────

@Composable
private fun LeaderboardTabRow(
    activeTab: LeaderboardTab,
    onTabSelected: (LeaderboardTab) -> Unit,
    entranceStarted: Boolean
) {
    AnimatedVisibility(
        visible = entranceStarted,
        enter = slideInVertically(tween(300)) + fadeIn(tween(200))
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 4.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            LeaderboardTabChip(
                label = "🏆 Global",
                isSelected = activeTab == LeaderboardTab.GLOBAL,
                onClick = { onTabSelected(LeaderboardTab.GLOBAL) },
                modifier = Modifier.weight(1f)
            )
            LeaderboardTabChip(
                label = "🎯 Daily",
                isSelected = activeTab == LeaderboardTab.DAILY,
                onClick = { onTabSelected(LeaderboardTab.DAILY) },
                modifier = Modifier.weight(1f)
            )
        }
    }
}

@Composable
private fun LeaderboardTabChip(
    label: String,
    isSelected: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val color = if (isSelected) MagmaRed else TextMuted
    OutlinedButton(
        onClick = onClick,
        modifier = modifier.height(38.dp),
        shape = RoundedCornerShape(10.dp),
        colors = ButtonDefaults.outlinedButtonColors(contentColor = color),
        border = BorderStroke(
            1.dp,
            if (isSelected) MagmaRed.copy(alpha = 0.5f) else SurfaceBorder.copy(alpha = 0.2f)
        ),
        contentPadding = PaddingValues(horizontal = 8.dp, vertical = 0.dp)
    ) {
        Text(
            text = label,
            style = MaterialTheme.typography.labelMedium,
            fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal
        )
    }
}

// ── Content ──────────────────────────────────────────────

@Composable
private fun LeaderboardContent(
    entries: List<LeaderboardEntry>,
    totalCount: Int,
    playerRank: com.typestrike.data.model.PlayerRankResponse?,
    isDaily: Boolean,
    entranceStarted: Boolean
) {
    var listVisible by remember { mutableStateOf(false) }
    LaunchedEffect(entranceStarted) {
        if (entranceStarted) {
            delay(200)
            listVisible = true
        }
    }

    LazyColumn(
        modifier = Modifier.fillMaxSize().padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(6.dp)
    ) {
        // Player's rank card (if available)
        if (playerRank != null && !isDaily) {
            item {
                AnimatedVisibility(
                    visible = listVisible,
                    enter = slideInVertically(tween(300)) + fadeIn(tween(200))
                ) {
                    PlayerRankCard(playerRank = playerRank)
                }
                Spacer(modifier = Modifier.height(4.dp))
            }
        }

        // Daily header note
        if (isDaily) {
            item {
                AnimatedVisibility(
                    visible = listVisible,
                    enter = slideInVertically(tween(300)) + fadeIn(tween(200))
                ) {
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(10.dp),
                        colors = CardDefaults.cardColors(containerColor = Surface.copy(alpha = 0.6f)),
                        border = BorderStroke(1.dp, MoltenGold.copy(alpha = 0.15f))
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth().padding(12.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text("🎯", fontSize = 18.sp)
                            Spacer(modifier = Modifier.width(8.dp))
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = "TODAY'S RANKINGS",
                                    style = MaterialTheme.typography.labelMedium,
                                    color = MoltenGold,
                                    fontWeight = FontWeight.Bold,
                                    letterSpacing = 1.sp
                                )
                                Text(
                                    text = "Based on daily challenge completions",
                                    style = MaterialTheme.typography.labelSmall,
                                    color = TextMuted
                                )
                            }
                            Text(
                                text = "$totalCount",
                                style = MaterialTheme.typography.titleMedium,
                                color = MoltenGold,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                }
                Spacer(modifier = Modifier.height(4.dp))
            }
        }

        // Header row
        item {
            AnimatedVisibility(
                visible = listVisible,
                enter = slideInVertically(tween(300)) + fadeIn(tween(200))
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth().padding(horizontal = 4.dp, vertical = 4.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Rank",
                        style = MaterialTheme.typography.labelSmall,
                        color = TextMuted,
                        modifier = Modifier.width(40.dp)
                    )
                    Text(
                        text = "Player",
                        style = MaterialTheme.typography.labelSmall,
                        color = TextMuted,
                        modifier = Modifier.weight(1f)
                    )
                    Text(
                        text = if (isDaily) "Done" else "Stars",
                        style = MaterialTheme.typography.labelSmall,
                        color = TextMuted,
                        modifier = Modifier.width(40.dp),
                        textAlign = TextAlign.End
                    )
                    Text(
                        text = "WPM",
                        style = MaterialTheme.typography.labelSmall,
                        color = TextMuted,
                        modifier = Modifier.width(44.dp),
                        textAlign = TextAlign.End
                    )
                }
            }
        }

        // Entries
        itemsIndexed(entries) { index, entry ->
            AnimatedVisibility(
                visible = listVisible,
                enter = slideInVertically(
                    animationSpec = tween(300 + index * 30),
                    initialOffsetY = { it / 2 }
                ) + fadeIn(tween(300))
            ) {
                LeaderboardRow(
                    entry = entry,
                    isPlayer = entry.playerId == 1
                )
            }
        }

        // Empty state
        if (entries.isEmpty()) {
            item {
                Spacer(modifier = Modifier.height(32.dp))
                Box(modifier = Modifier.fillMaxWidth(), contentAlignment = Alignment.Center) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("🏆", fontSize = 40.sp, modifier = Modifier.alpha(0.5f))
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = if (isDaily) "No daily challenges completed yet today" else "No players on the leaderboard yet",
                            style = MaterialTheme.typography.bodyMedium,
                            color = TextMuted
                        )
                    }
                }
            }
        }

        item { Spacer(modifier = Modifier.height(32.dp)) }
    }
}

// ── Player Rank Card ─────────────────────────────────────

@Composable
private fun PlayerRankCard(
    playerRank: com.typestrike.data.model.PlayerRankResponse
) {
    val entry = playerRank.entry
    val infiniteTransition = rememberInfiniteTransition(label = "rankGlow")
    val glowAlpha by infiniteTransition.animateFloat(
        initialValue = 0.2f,
        targetValue = 0.4f,
        animationSpec = infiniteRepeatable(
            animation = tween(1500, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "rankGlow"
    )

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = SurfaceDark.copy(alpha = 0.6f)),
        border = BorderStroke(1.dp, MagmaRed.copy(alpha = glowAlpha))
    ) {
        Column(modifier = Modifier.fillMaxWidth().padding(12.dp)) {
            // Your Rank badge
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(6.dp))
                        .background(MagmaRed.copy(alpha = 0.15f))
                        .padding(horizontal = 8.dp, vertical = 3.dp)
                ) {
                    Text(
                        text = "#${entry.rank}",
                        style = MaterialTheme.typography.labelMedium,
                        color = MagmaRed,
                        fontWeight = FontWeight.Bold
                    )
                }
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = "YOUR RANK",
                    style = MaterialTheme.typography.labelSmall,
                    color = TextMuted,
                    letterSpacing = 1.sp
                )
            }

            Spacer(modifier = Modifier.height(8.dp))

            // Neighbors display
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceEvenly,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Above players
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    modifier = Modifier.weight(1f)
                ) {
                    playerRank.above.forEach { above ->
                        Text(
                            text = "#${above.rank}  ${above.playerName.take(12)}",
                            style = MaterialTheme.typography.labelSmall,
                            color = TextMuted,
                            fontSize = 10.sp
                        )
                    }
                }

                // Current player badge
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    modifier = Modifier.weight(1f)
                ) {
                    Box(
                        modifier = Modifier
                            .size(48.dp)
                            .clip(CircleShape)
                            .background(MagmaRed.copy(alpha = 0.2f)),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "${entry.rank}",
                            style = MaterialTheme.typography.titleMedium,
                            color = MagmaRed,
                            fontWeight = FontWeight.Bold
                        )
                    }
                    Spacer(modifier = Modifier.height(2.dp))
                    Text(
                        text = entry.playerName.ifBlank { "Player" },
                        style = MaterialTheme.typography.labelSmall,
                        color = TextWhite,
                        fontWeight = FontWeight.Bold
                    )
                }

                // Below players
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    modifier = Modifier.weight(1f)
                ) {
                    playerRank.below.forEach { below ->
                        Text(
                            text = "#${below.rank}  ${below.playerName.take(12)}",
                            style = MaterialTheme.typography.labelSmall,
                            color = TextMuted,
                            fontSize = 10.sp
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(6.dp))

            // Player stats mini row
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceEvenly
            ) {
                StatChip("Lv.${entry.level}", TextBody)
                StatChip("${entry.totalStars} ★", MoltenGold)
                StatChip("${entry.xp} XP", MagmaRed)
                StatChip("${entry.bestWpm} WPM", SuccessGreen)
            }
        }
    }
}

@Composable
private fun StatChip(text: String, color: androidx.compose.ui.graphics.Color) {
    Box(
        modifier = Modifier
            .clip(RoundedCornerShape(4.dp))
            .background(color.copy(alpha = 0.1f))
            .padding(horizontal = 6.dp, vertical = 2.dp)
    ) {
        Text(
            text = text,
            style = MaterialTheme.typography.labelSmall,
            color = color,
            fontWeight = FontWeight.SemiBold,
            fontSize = 9.sp
        )
    }
}

// ── Leaderboard Row ──────────────────────────────────────

@Composable
private fun LeaderboardRow(
    entry: LeaderboardEntry,
    isPlayer: Boolean
) {
    val bgColor = if (isPlayer) MagmaRed.copy(alpha = 0.08f) else Surface.copy(alpha = 0.6f)
    val borderColor = if (isPlayer) MagmaRed.copy(alpha = 0.2f) else SurfaceBorder.copy(alpha = 0.1f)

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(8.dp),
        colors = CardDefaults.cardColors(containerColor = bgColor),
        border = BorderStroke(1.dp, borderColor)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth().padding(horizontal = 10.dp, vertical = 8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Rank
            val rankColor = when (entry.rank) {
                1 -> MoltenGold
                2 -> TextBody
                3 -> MagmaRed
                else -> TextMuted
            }
            val rankText = when (entry.rank) {
                1 -> "🥇"
                2 -> "🥈"
                3 -> "🥉"
                else -> "#${entry.rank}"
            }
            Text(
                text = rankText,
                style = MaterialTheme.typography.labelMedium,
                color = rankColor,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.width(36.dp),
                fontSize = if (entry.rank <= 3) 14.sp else 11.sp
            )

            // Player name + level
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = entry.playerName.ifBlank { "Player ${entry.playerId}" },
                    style = MaterialTheme.typography.bodySmall,
                    color = if (isPlayer) MagmaRed else TextWhite,
                    fontWeight = if (isPlayer) FontWeight.Bold else FontWeight.Normal,
                    maxLines = 1
                )
                Text(
                    text = "Lv.${entry.level}",
                    style = MaterialTheme.typography.labelSmall,
                    color = TextDisabled,
                    fontSize = 9.sp
                )
            }

            // Stars / levels cleared
            Text(
                text = "${entry.totalStars}",
                style = MaterialTheme.typography.labelMedium,
                color = MoltenGold,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.width(36.dp),
                textAlign = TextAlign.End
            )

            // WPM
            Text(
                text = "${entry.bestWpm}",
                style = MaterialTheme.typography.labelMedium,
                color = TextBody,
                fontWeight = FontWeight.SemiBold,
                modifier = Modifier.width(40.dp),
                textAlign = TextAlign.End
            )
        }
    }
}

// ── Loading & Error States ───────────────────────────────

@Composable
private fun LeaderboardLoadingState() {
    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            CircularProgressIndicator(color = MagmaRed, modifier = Modifier.size(32.dp))
            Spacer(modifier = Modifier.height(16.dp))
            Text("Loading leaderboard…", style = MaterialTheme.typography.bodyMedium, color = TextLabel)
        }
    }
}

@Composable
private fun LeaderboardErrorState(message: String, onRetry: () -> Unit) {
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
