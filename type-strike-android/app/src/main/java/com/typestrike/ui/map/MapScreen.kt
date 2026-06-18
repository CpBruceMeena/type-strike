package com.typestrike.ui.map

import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.lazy.rememberLazyListState
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
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
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
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlin.math.cos
import kotlin.math.sin
import kotlin.random.Random

// Particle system is imported from com.typestrike.ui.effects.*

// ── Tier labels ──────────────────────────────────────────

private data class TierInfo(
    val key: String,
    val label: String,
    val description: String,
    val icon: String,
    val color: Color,
    val levels: IntRange
)

private val TIERS = listOf(
    TierInfo("ember", "EMBER", "The beginning of flame", "🔥", MagmaRed, 1..25),
    TierInfo("igneious", "IGNEOUS", "Forged in volcanic fire", "🌋", TierIgneous, 26..50),
    TierInfo("magma_core", "MAGMA CORE", "The planet's burning heart", "🔴", NeonPurple, 51..75),
    TierInfo("obsidian", "OBSIDIAN", "Only the fastest survive", "⚫", TierObsidian, 76..100),
)

private fun tierForLevel(levelId: Int): TierInfo = when {
    levelId <= 25 -> TIERS[0]
    levelId <= 50 -> TIERS[1]
    levelId <= 75 -> TIERS[2]
    else -> TIERS[3]
}

// ── Main Screen ──────────────────────────────────────────

@Composable
fun MapScreen(
    onLevelTap: (Int) -> Unit = {},
    onNavigateToSettings: () -> Unit = {},
    onNavigateBack: () -> Unit = {},
    particleConfig: ParticleConfig = ParticleConfig.fromQuality(ParticleConfig.detect()),
    viewModel: MapViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    val listState = rememberLazyListState()
    val scope = rememberCoroutineScope()

    // Entrance animation
    var entranceStarted by remember { mutableStateOf(false) }
    LaunchedEffect(Unit) {
        delay(100)
        entranceStarted = true
    }

    // Pull to refresh
    val isRefreshing = uiState.isRefreshing

    Box(modifier = Modifier.fillMaxSize().background(Background)) {
        when {
            uiState.isLoading -> MapLoadingState()
            uiState.hasError -> MapErrorState(
                message = uiState.errorMessage ?: "Failed to load",
                onRetry = { viewModel.loadMapData() }
            )
            else -> {
                // Main content
                Column(modifier = Modifier.fillMaxSize()) {
                    // Particle background (behind everything)
                    MapParticleField(
                        config = particleConfig,
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(top = 56.dp)
                    )

                    // Header
                    MapHeader(
                        playerLevel = uiState.playerLevel,
                        playerTitle = uiState.playerTitle,
                        playerStars = uiState.playerStars,
                        onSettingsClick = onNavigateToSettings,
                        onBackClick = onNavigateBack,
                        entranceStarted = entranceStarted
                    )

                    // Level list
                    Box(modifier = Modifier.weight(1f).fillMaxWidth()) {
                        MapLevelList(
                            levels = uiState.levels,
                            listState = listState,
                            entranceStarted = entranceStarted,
                            particleConfig = particleConfig,
                            onLevelTap = onLevelTap
                        )

                        // Refreshing indicator
                        if (isRefreshing) {
                            CircularProgressIndicator(
                                modifier = Modifier
                                    .align(Alignment.TopCenter)
                                    .padding(top = 8.dp)
                                    .size(24.dp),
                                color = MagmaRed,
                                strokeWidth = 2.dp
                            )
                        }

                        // Error banner on top
                        if (uiState.hasError) {
                            Surface(
                                modifier = Modifier
                                    .align(Alignment.TopCenter)
                                    .fillMaxWidth()
                                    .padding(16.dp),
                                shape = RoundedCornerShape(8.dp),
                                color = ErrorRed.copy(alpha = 0.15f)
                            ) {
                                Text(
                                    text = uiState.errorMessage ?: "Error loading levels",
                                    color = ErrorRed,
                                    style = MaterialTheme.typography.bodySmall,
                                    modifier = Modifier.padding(12.dp)
                                )
                            }
                        }
                    }
                }

                // Scroll-to-current FAB (overlaid at bottom)
                if (uiState.firstUncompletedLevelId > 1) {
                    Box(modifier = Modifier.fillMaxSize()) {
                        FloatingActionButton(
                            onClick = {
                                val targetIndex = uiState.levels.indexOfFirst { it.id == uiState.firstUncompletedLevelId }
                                if (targetIndex >= 0) {
                                    scope.launch {
                                        val tierHeaderIndex = (uiState.firstUncompletedLevelId - 1) / 25
                                        listState.animateScrollToItem(
                                            index = targetIndex + tierHeaderIndex + 1,
                                            scrollOffset = -200
                                        )
                                    }
                                }
                            },
                            modifier = Modifier
                                .align(Alignment.BottomEnd)
                                .padding(16.dp)
                                .size(40.dp),
                            containerColor = MagmaRed,
                            shape = CircleShape,
                            elevation = FloatingActionButtonDefaults.elevation(4.dp)
                        ) {
                            Text("↓", color = TextWhite, fontSize = 18.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }
    }
}

// ── Map Header ───────────────────────────────────────────

@Composable
private fun MapHeader(
    playerLevel: Int,
    playerTitle: String,
    playerStars: Int,
    onSettingsClick: () -> Unit,
    onBackClick: () -> Unit,
    entranceStarted: Boolean
) {
    AnimatedVisibility(
        visible = entranceStarted,
        enter = slideInVertically(animationSpec = tween(400)) + fadeIn(tween(300))
    ) {
        Surface(
            modifier = Modifier.fillMaxWidth(),
            color = Background,
            shadowElevation = 4.dp,
            tonalElevation = 0.dp
        ) {
            Column {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(56.dp)
                        .padding(horizontal = 8.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    // Back button
                    TextButton(
                        onClick = onBackClick,
                        modifier = Modifier.size(48.dp)
                    ) {
                        Text("←", color = TextBody, fontSize = 22.sp)
                    }

                    // Title
                    Text(
                        text = "PROGRESSION",
                        style = MaterialTheme.typography.labelMedium,
                        color = MagmaRed,
                        letterSpacing = 3.sp,
                        fontWeight = FontWeight.Bold
                    )

                    // Settings
                    TextButton(
                        onClick = onSettingsClick,
                        modifier = Modifier.size(48.dp)
                    ) {
                        Text("⚙", color = TextLabel, fontSize = 20.sp)
                    }
                }

                // Player mini-summary row
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 4.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(4.dp))
                                .background(MagmaRed)
                                .padding(horizontal = 8.dp, vertical = 2.dp)
                        ) {
                            Text(
                                text = "LV.$playerLevel",
                                style = MaterialTheme.typography.labelSmall,
                                color = TextWhite,
                                fontWeight = FontWeight.Bold
                            )
                        }
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = playerTitle.replaceFirstChar { it.uppercase() },
                            style = MaterialTheme.typography.bodySmall,
                            color = TextBody,
                            fontWeight = FontWeight.SemiBold
                        )
                    }
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(text = "★", color = MoltenGold, fontSize = 14.sp)
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(
                            text = "$playerStars",
                            style = MaterialTheme.typography.labelSmall,
                            color = MoltenGold
                        )
                    }
                }
                Spacer(modifier = Modifier.height(4.dp))
            }
        }
    }
}

// ── Map Level List ───────────────────────────────────────

@Composable
private fun MapLevelList(
    levels: List<MapLevelItem>,
    listState: androidx.compose.foundation.lazy.LazyListState,
    entranceStarted: Boolean,
    particleConfig: ParticleConfig = ParticleConfig.HIGH,
    onLevelTap: (Int) -> Unit
) {
    LazyColumn(
        state = listState,
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        // Top spacer
        item { Spacer(modifier = Modifier.height(8.dp)) }

        // Render tier by tier with fracture zones between
        var lastTier = ""
        itemsIndexed(levels) { index, level ->
            // Check if we need a tier fracture zone
            val tier = tierForLevel(level.id)
            if (tier.key != lastTier) {
                lastTier = tier.key
                        TierFractureZone(
                            tier = tier,
                            entranceStarted = entranceStarted,
                            burstParticleCount = particleConfig.burstParticleCount
                        )
            }

            LevelNodeItem(
                level = level,
                index = index,
                entranceStarted = entranceStarted,
                orbitEnabled = particleConfig.orbitParticlesEnabled,
                sparkleEnabled = particleConfig.sparkleEnabled,
                onClick = { onLevelTap(level.id) }
            )
        }

        // Bottom padding
        item { Spacer(modifier = Modifier.height(80.dp)) }
    }
}

// ── Tier Fracture Zone ───────────────────────────────────

@Composable
private fun TierFractureZone(
    tier: TierInfo,
    entranceStarted: Boolean,
    burstParticleCount: Int = 12
) {
    // Animated fracture progress (draws from left to right)
    val fractureProgress by animateFloatAsState(
        targetValue = if (entranceStarted) 1f else 0f,
        animationSpec = tween(800, easing = FastOutSlowInEasing),
        label = "fractureProgress_${tier.key}"
    )

    // Glow intensity pulsing
    val infiniteTransition = rememberInfiniteTransition(label = "tierGlow_${tier.key}")
    val glowPulse by infiniteTransition.animateFloat(
        initialValue = 0.3f,
        targetValue = 0.7f,
        animationSpec = infiniteRepeatable(
            animation = tween(2000, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "glowPulse_${tier.key}"
    )                // Burst particles for tier transition
    var burstTriggered by remember { mutableStateOf(false) }

    LaunchedEffect(entranceStarted) {
        if (entranceStarted) {
            delay(200)
            burstTriggered = true
        }
    }

    val burstProgress by animateFloatAsState(
        targetValue = if (burstTriggered) 1f else 0f,
        animationSpec = tween(2000, easing = FastOutSlowInEasing),
        label = "burstProgress_${tier.key}"
    )

    // Staggered visibility for label and description
    val labelVisible by animateFloatAsState(
        targetValue = if (entranceStarted) 1f else 0f,
        animationSpec = tween(400, delayMillis = 300),
        label = "labelVisible_${tier.key}"
    )
    val descVisible by animateFloatAsState(
        targetValue = if (entranceStarted) 1f else 0f,
        animationSpec = tween(400, delayMillis = 500),
        label = "descVisible_${tier.key}"
    )

    AnimatedVisibility(
        visible = entranceStarted,
        enter = fadeIn(tween(100))
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 20.dp)
        ) {
            // Fracture line with animated drawing
            Box(modifier = Modifier.fillMaxWidth().height(24.dp)) {
                // Particle burst overlay
                if (burstTriggered) {
                    val burstParticles = remember {
                        List(burstParticleCount) {
                            BurstParticle(
                                x = 0.5f,
                                y = 0.5f,
                                velX = (Random.nextFloat() - 0.5f) * 2f,
                                velY = (Random.nextFloat() - 0.5f) * 2f,
                                life = 0.6f + Random.nextFloat() * 0.8f,
                                size = 1f + Random.nextFloat() * 3f,
                                color = tier.color
                            )
                        }
                    }
                    Canvas(modifier = Modifier.fillMaxSize()) {
                        burstParticles.forEach { p ->
                            val progress = burstProgress / p.life
                            if (progress < 1f) {
                                val px = (p.x + p.velX * progress * 0.3f) * size.width
                                val py = (p.y + p.velY * progress * 0.3f) * size.height
                                val pAlpha = (1f - progress) * 0.6f
                                drawCircle(
                                    color = p.color.copy(alpha = pAlpha),
                                    radius = p.size * (1f - progress * 0.5f),
                                    center = Offset(px, py)
                                )
                            }
                        }
                    }
                }

                Canvas(modifier = Modifier.fillMaxSize()) {
                    val segments = 10
                    val segWidth = size.width / segments
                    val path = Path()
                    val randomSeed = tier.key.hashCode()
                    val rng = Random(randomSeed)

                    var x = 0f
                    var y = size.height / 2f
                    path.moveTo(x, y)
                    for (i in 0..segments) {
                        x += segWidth
                        y = size.height / 2f + (if (i % 2 == 0) -10f else 10f) +
                                (rng.nextFloat() * 8f - 4f)
                        // Only draw up to the fractureProgress
                        val drawToX = x * fractureProgress
                        val clampedX = if (i == segments) x else drawToX
                        path.lineTo(clampedX, y)
                    }

                    // Glowing fracture line
                    drawPath(
                        path = path,
                        color = tier.color.copy(alpha = 0.6f * glowPulse),
                        style = Stroke(width = 2.5f, cap = StrokeCap.Round)
                    )

                    // Glow trail behind the line
                    drawPath(
                        path = path,
                        color = tier.color.copy(alpha = 0.15f * glowPulse),
                        style = Stroke(width = 8f, cap = StrokeCap.Round)
                    )

                    // Segment dots
                    for (i in 0..segments) {
                        val dotX = (i.toFloat() / segments) * size.width * fractureProgress
                        if (dotX > 0f) {
                            val dotY = size.height / 2f + (if (i % 2 == 0) -5f else 5f)
                            val dotAlpha = (0.2f + 0.3f * glowPulse) * fractureProgress
                            drawCircle(
                                color = tier.color.copy(alpha = dotAlpha),
                                radius = 2.5f,
                                center = Offset(dotX, dotY)
                            )
                        }
                    }

                    // Leading edge glow (bright point at the end of the drawing line)
                    if (fractureProgress > 0f && fractureProgress < 1f) {
                        val edgeX = size.width * fractureProgress
                        val edgeY = size.height / 2f
                        drawCircle(
                            color = tier.color.copy(alpha = 0.8f),
                            radius = 4f,
                            center = Offset(edgeX, edgeY)
                        )
                        drawCircle(
                            color = tier.color.copy(alpha = 0.3f),
                            radius = 8f,
                            center = Offset(edgeX, edgeY)
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(6.dp))

            // Tier label with staggered animation
            val labelScale by animateFloatAsState(
                targetValue = if (labelVisible > 0f) 1f else 0.8f,
                animationSpec = spring(dampingRatio = 0.6f, stiffness = 300f),
                label = "labelScale_${tier.key}"
            )

            Row(
                modifier = Modifier.alpha(labelVisible).scale(labelScale),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(text = tier.icon, fontSize = 18.sp)
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = tier.label,
                    style = MaterialTheme.typography.headlineMedium,
                    color = tier.color,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 3.sp
                )
            }

            Text(
                text = tier.description.uppercase(),
                style = MaterialTheme.typography.labelSmall,
                color = tier.color.copy(alpha = 0.6f + 0.3f * descVisible),
                letterSpacing = 1.sp,
                modifier = Modifier
                    .padding(start = 34.dp)
                    .alpha(descVisible)
            )

            Spacer(modifier = Modifier.height(4.dp))
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(1.dp)
                    .background(
                        brush = Brush.horizontalGradient(
                            colors = listOf(
                                tier.color.copy(alpha = 0.3f),
                                tier.color.copy(alpha = 0.05f),
                                Color.Transparent
                            )
                        )
                    )
            )
            Box(
                modifier = Modifier
                    .fillMaxWidth(0.3f * labelVisible)
                    .height(1.dp)
                    .background(tier.color.copy(alpha = 0.15f))
            )
        }
    }
}

// ── Burst Particle Data ──────────────────────────────────

private data class BurstParticle(
    val x: Float,
    val y: Float,
    val velX: Float,
    val velY: Float,
    val life: Float,
    val size: Float,
    val color: Color
)

// ── Level Node Item ──────────────────────────────────────

@Composable
private fun LevelNodeItem(
    level: MapLevelItem,
    index: Int,
    entranceStarted: Boolean,
    orbitEnabled: Boolean = true,
    sparkleEnabled: Boolean = true,
    onClick: () -> Unit
) {
    val delayMs = (50 + index * 12).coerceAtMost(600)

    // Visual state
    val isCompleted = level.completed
    val isUnlocked = level.isUnlocked
    val isLocked = !isUnlocked

    val textColor = when {
        isCompleted -> TextBody
        isUnlocked -> TextWhite
        else -> TextDisabled
    }
    val tier = tierForLevel(level.id)

    // ── Glow pulse for current unlockable ──
    val infiniteTransition = rememberInfiniteTransition(label = "nodeGlow_$index")
    val glowAlpha by infiniteTransition.animateFloat(
        initialValue = 0.15f,
        targetValue = 0.5f,
        animationSpec = infiniteRepeatable(
            animation = tween(1200, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "glowAlpha_$index"
    )

    // ── Orbiting particles around unlocked/completed nodes ──
    val orbitAngle by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 360f,
        animationSpec = infiniteRepeatable(
            animation = tween(4000 + index * 300, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "orbitAngle_$index"
    )
    val orbitAngle2 by infiniteTransition.animateFloat(
        initialValue = 120f,
        targetValue = 480f,
        animationSpec = infiniteRepeatable(
            animation = tween(5000 + index * 200, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "orbitAngle2_$index"
    )

    // ── Scale animation on click using InteractionSource ──
    val interactionSource = remember { MutableInteractionSource() }
    val isPressed by interactionSource.collectIsPressedAsState()
    val pressScale by animateFloatAsState(
        targetValue = if (isPressed) 0.95f else 1f,
        animationSpec = tween(100),
        label = "pressScale_$index"
    )

    // ── Completion sparkle ──
    var showSparkle by remember(isCompleted) { mutableStateOf(isCompleted) }
    val sparkleOpacity by animateFloatAsState(
        targetValue = if (showSparkle) 1f else 0f,
        animationSpec = tween(600),
        label = "sparkleOpacity_$index"
    )
    LaunchedEffect(isCompleted) {
        if (isCompleted) {
            showSparkle = true
            delay(8000)
            showSparkle = false
        }
    }

    AnimatedVisibility(
        visible = entranceStarted,
        enter = slideInVertically(
            animationSpec = tween(400, delayMillis = delayMs),
            initialOffsetY = { it / 2 }
        ) + fadeIn(tween(300, delayMillis = delayMs))
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 4.dp)
                .scale(pressScale)
                .clickable(
                    interactionSource = interactionSource,
                    indication = null,
                    enabled = isUnlocked
                ) { onClick() },
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Path line + node column
            Box(
                modifier = Modifier
                    .width(56.dp)
                    .then(if (isLocked) Modifier.alpha(0.5f) else Modifier),
                contentAlignment = Alignment.Center
            ) {
                // Vertical path line with gradient
                Box(
                    modifier = Modifier
                        .width(2.dp)
                        .height(56.dp)
                        .background(
                            brush = Brush.verticalGradient(
                                colors = when {
                                    isCompleted -> listOf(
                                        NeonPurple.copy(alpha = 0.15f),
                                        NeonPurple.copy(alpha = 0.4f),
                                        NeonPurple.copy(alpha = 0.15f)
                                    )
                                    isUnlocked -> listOf(
                                        MagmaRed.copy(alpha = 0.1f),
                                        MagmaRed.copy(alpha = 0.3f),
                                        MagmaRed.copy(alpha = 0.1f)
                                    )
                                    else -> listOf(
                                        SurfaceBorder.copy(alpha = 0.08f),
                                        SurfaceBorder.copy(alpha = 0.15f),
                                        SurfaceBorder.copy(alpha = 0.08f)
                                    )
                                }
                            )
                        )
                )

                // Node circle with orbiting particles
                Box(
                    modifier = Modifier.size(36.dp),
                    contentAlignment = Alignment.Center
                ) {
                    // Orbiting particles (only for unlocked and completed)
                    if (isUnlocked && orbitEnabled) {
                        OrbitParticlesCanvas(
                            orbitAngle = orbitAngle,
                            orbitAngle2 = orbitAngle2,
                            isCompleted = isCompleted,
                            color = if (isCompleted) NeonPurple else MagmaRed,
                            modifier = Modifier.size(56.dp)
                        )
                    }

                    // Sparkle burst (for completed)
                    if (isCompleted && showSparkle && sparkleEnabled) {
                        SparkleBurstCanvas(
                            opacity = sparkleOpacity,
                            modifier = Modifier.size(60.dp)
                        )
                    }

                    // Node circle
                    Box(
                        modifier = Modifier
                            .size(36.dp)
                            .then(
                                if (isUnlocked && !isCompleted)
                                    Modifier.shadow(
                                        elevation = 8.dp,
                                        shape = CircleShape,
                                        ambientColor = MagmaRed.copy(alpha = glowAlpha),
                                        spotColor = MagmaRed.copy(alpha = glowAlpha)
                                    )
                                else if (isCompleted)
                                    Modifier.shadow(
                                        elevation = 6.dp,
                                        shape = CircleShape,
                                        ambientColor = NeonPurple.copy(alpha = 0.4f),
                                        spotColor = NeonPurple.copy(alpha = 0.4f)
                                    )
                                else Modifier
                            )
                            .background(
                                brush = Brush.radialGradient(
                                    colors = when {
                                        isCompleted -> listOf(NeonPurple, NeonPurple.copy(alpha = 0.3f))
                                        isUnlocked -> listOf(MagmaRed, tier.color.copy(alpha = 0.4f))
                                        else -> listOf(SurfaceBorder, SurfaceBorder.copy(alpha = 0.3f))
                                    }
                                ),
                                shape = CircleShape
                            ),
                        contentAlignment = Alignment.Center
                    ) {
                        when {
                            isCompleted -> Text(
                                "★",
                                color = MoltenGold,
                                fontSize = 16.sp,
                                fontWeight = FontWeight.Bold,
                                modifier = Modifier.shadow(
                                    4.dp,
                                    shape = CircleShape,
                                    spotColor = MoltenGold.copy(alpha = 0.5f)
                                )
                            )
                            isUnlocked -> Text(
                                "${level.id}",
                                color = TextWhite,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold
                            )
                            else -> Text("🔒", fontSize = 11.sp)
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.width(12.dp))

            // Level info with stagger
            val infoTransition = rememberInfiniteTransition(label = "infoPulse_$index")
            val infoAlpha by infoTransition.animateFloat(
                initialValue = 1f,
                targetValue = if (isUnlocked && !isCompleted) 0.85f else 1f,
                animationSpec = infiniteRepeatable(
                    animation = tween(2000, easing = FastOutSlowInEasing),
                    repeatMode = RepeatMode.Reverse
                ),
                label = "infoAlpha_$index"
            )

            Column(
                modifier = Modifier
                    .weight(1f)
                    .alpha(if (isLocked) 0.5f else infoAlpha)
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        text = level.name.uppercase(),
                        style = MaterialTheme.typography.bodyMedium,
                        color = textColor,
                        fontWeight = if (isUnlocked) FontWeight.Bold else FontWeight.Normal,
                        maxLines = 1
                    )
                    if (isCompleted) {
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = "★".repeat(level.stars.coerceIn(0, 3)),
                            color = MoltenGold,
                            fontSize = 10.sp
                        )
                    }
                }
                Spacer(modifier = Modifier.height(2.dp))
                Text(
                    text = when {
                        isCompleted -> "Best: ${level.bestWpm} WPM · ${level.bestAccuracy.toInt()}% ACC"
                        isUnlocked -> "Pass: ${level.passWpm} WPM · ${level.passAccuracy}% ACC"
                        else -> "Clear Level ${(level.id - 1).coerceAtLeast(1)} to unlock"
                    },
                    style = MaterialTheme.typography.labelSmall,
                    color = TextMuted
                )
            }

            // Tier mini badge with glow
            Box(
                modifier = Modifier
                    .clip(RoundedCornerShape(4.dp))
                    .background(
                        brush = Brush.radialGradient(
                            colors = if (isUnlocked)
                                listOf(tier.color.copy(alpha = 0.2f), tier.color.copy(alpha = 0.05f))
                            else
                                listOf(SurfaceBorder.copy(alpha = 0.1f), SurfaceBorder.copy(alpha = 0.02f))
                        )
                    )
                    .padding(horizontal = 6.dp, vertical = 2.dp)
            ) {
                Text(
                    text = tier.icon,
                    fontSize = 10.sp,
                    modifier = Modifier.alpha(if (isLocked) 0.4f else 1f)
                )
            }
        }
    }
}

// ── Orbit Particles Canvas ───────────────────────────────

@Composable
private fun OrbitParticlesCanvas(
    orbitAngle: Float,
    orbitAngle2: Float,
    isCompleted: Boolean,
    color: Color,
    modifier: Modifier = Modifier
) {
    Canvas(modifier = modifier) {
        val cx = size.width / 2f
        val cy = size.height / 2f
        val orbitRadius1 = size.width * 0.38f
        val orbitRadius2 = size.width * 0.32f

        val rad1 = Math.toRadians(orbitAngle.toDouble())
        val rad2 = Math.toRadians(orbitAngle2.toDouble())

        val particleColor = if (isCompleted) {
            color.copy(alpha = 0.5f)
        } else {
            color.copy(alpha = 0.4f)
        }

        // Orbiting particle 1 (larger orbit)
        val p1x = cx + (orbitRadius1 * cos(rad1)).toFloat()
        val p1y = cy + (orbitRadius1 * sin(rad1)).toFloat()
        drawCircle(color = particleColor, radius = 2.5f, center = Offset(p1x, p1y))
        drawCircle(color = particleColor.copy(alpha = 0.15f), radius = 5f, center = Offset(p1x, p1y))

        // Orbiting particle 2 (smaller orbit, opposite direction)
        val p2x = cx + (orbitRadius2 * cos(rad2 + Math.PI)).toFloat()
        val p2y = cy + (orbitRadius2 * sin(rad2 + Math.PI)).toFloat()
        drawCircle(color = particleColor.copy(alpha = 0.6f), radius = 2f, center = Offset(p2x, p2y))
        drawCircle(color = particleColor.copy(alpha = 0.12f), radius = 4f, center = Offset(p2x, p2y))
    }
}

// ── Sparkle Burst Canvas ─────────────────────────────────

@Composable
private fun SparkleBurstCanvas(
    opacity: Float,
    modifier: Modifier = Modifier
) {
    val randomSeed = remember { Random.nextInt() }

    Canvas(modifier = modifier) {
        val cx = size.width / 2f
        val cy = size.height / 2f
        val rng = Random(randomSeed)

        // 8 sparkle rays bursting outward
        for (i in 0..7) {
            val angle = (i.toFloat() / 8f) * 6.2832f + 0.2f * rng.nextFloat()
            val rayLen = (3f + rng.nextFloat() * 4f) * opacity
            val rayWidth = 1.5f * opacity

            drawLine(
                color = MoltenGold.copy(alpha = 0.8f * opacity),
                start = Offset(cx, cy),
                end = Offset(
                    cx + cos(angle.toDouble()).toFloat() * rayLen * 3f,
                    cy + sin(angle.toDouble()).toFloat() * rayLen * 3f
                ),
                strokeWidth = rayWidth,
                cap = StrokeCap.Round
            )

            // Small dot at the tip
            drawCircle(
                color = MoltenGold.copy(alpha = 0.6f * opacity),
                radius = 1.5f * opacity,
                center = Offset(
                    cx + cos(angle.toDouble()).toFloat() * rayLen * 3f,
                    cy + sin(angle.toDouble()).toFloat() * rayLen * 3f
                )
            )
        }

        // Central glow
        drawCircle(
            color = MoltenGold.copy(alpha = 0.3f * opacity),
            radius = 6f * opacity,
            center = Offset(cx, cy)
        )
    }
}

// ── Loading State ────────────────────────────────────────

@Composable
private fun MapLoadingState() {
    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            CircularProgressIndicator(color = MagmaRed, modifier = Modifier.size(32.dp))
            Spacer(modifier = Modifier.height(16.dp))
            Text("Loading levels…", style = MaterialTheme.typography.bodyMedium, color = TextLabel)
        }
    }
}

// ── Error State ──────────────────────────────────────────

@Composable
private fun MapErrorState(message: String, onRetry: () -> Unit) {
    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text("⚠️", fontSize = 32.sp)
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
