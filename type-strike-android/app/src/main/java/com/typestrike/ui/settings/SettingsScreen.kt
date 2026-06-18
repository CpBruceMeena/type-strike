package com.typestrike.ui.settings

import androidx.compose.animation.*
import androidx.compose.animation.core.*
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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.typestrike.data.model.KeyboardTheme
import com.typestrike.data.model.KeyboardThemes
import com.typestrike.ui.effects.*
import com.typestrike.ui.theme.*
import kotlinx.coroutines.delay

// ── Layout options ───────────────────────────────────────

private val LAYOUT_OPTIONS = listOf("QWERTY", "AZERTY", "QWERTZ")
private val KEY_SIZE_OPTIONS = listOf("S", "M", "L")
private val CLICK_TYPE_OPTIONS = listOf("BLUE", "BROWN", "RED", "LINEAR")
private val HAPTIC_INTENSITY_OPTIONS = listOf("LIGHT", "MEDIUM", "STRONG")
private val THEME_NAMES = com.typestrike.data.model.KeyboardThemes.ALL.associateBy { it.id }

private fun keySizeLabel(size: String) = when (size) {
    "S" -> "Small"
    "M" -> "Medium"
    "L" -> "Large"
    else -> size
}

private fun clickTypeDesc(type: String) = when (type) {
    "BLUE" -> "Clicky · Tactile"
    "BROWN" -> "Quiet · Tactile"
    "RED" -> "Linear · Smooth"
    "LINEAR" -> "Fast · Silent"
    else -> type
}

private fun intensityLabel(v: String) = when (v) {
    "LIGHT" -> "Light"
    "MEDIUM" -> "Medium"
    "STRONG" -> "Strong"
    else -> v
}

// ── Main Screen ──────────────────────────────────────────

@Composable
fun SettingsScreen(
    onBack: () -> Unit = {},
    viewModel: SettingsViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()

    // Entrance animation
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
        // Particle background
        MapParticleField(
            config = particleConfig.copy(opacity = 0.25f, glowEnabled = false),
            modifier = Modifier.fillMaxSize()
        )

        Column(
            modifier = Modifier
                .fillMaxSize()
                .statusBarsPadding()
        ) {
            // Header
            SettingsHeader(onBack = onBack, entranceStarted = entranceStarted)

            // Content
            when {
                uiState.isLoading -> SettingsLoadingState()
                uiState.hasError -> SettingsErrorState(
                    message = uiState.errorMessage ?: "Failed to load settings",
                    onRetry = { viewModel.loadSettings() }
                )
                else -> SettingsContent(
                    uiState = uiState,
                    viewModel = viewModel,
                    entranceStarted = entranceStarted
                )
            }
        }
    }
}

// ── Header ───────────────────────────────────────────────

@Composable
private fun SettingsHeader(
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
                text = "SETTINGS",
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
private fun SettingsContent(
    uiState: SettingsUiState,
    viewModel: SettingsViewModel,
    entranceStarted: Boolean
) {
    val scrollState = rememberScrollState()

    // Save feedback
    LaunchedEffect(uiState.saveSuccess) {
        if (uiState.saveSuccess) {
            delay(1500)
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(scrollState)
            .padding(horizontal = 16.dp)
    ) {
        Spacer(modifier = Modifier.height(8.dp))

        // Section entrance animation
        var sectionVisible by remember { mutableStateOf(0) }
        LaunchedEffect(entranceStarted) {
            if (entranceStarted) {
                delay(100); sectionVisible = 1  // Keyboard
                delay(100); sectionVisible = 2  // Sound
                delay(100); sectionVisible = 3  // Haptics
                delay(100); sectionVisible = 4  // Visual
                delay(100); sectionVisible = 5  // Accessibility
            }
        }

        // ── Keyboard Section ─────────────────────────
        AnimatedVisibility(
            visible = sectionVisible >= 1,
            enter = slideInVertically(tween(300)) + fadeIn(tween(200))
        ) {
            SettingsSection(
                title = "KEYBOARD",
                icon = "⌨️"
            ) {
                // Layout selector
                SettingsSegmentedRow(
                    label = "Layout",
                    options = LAYOUT_OPTIONS,
                    selected = uiState.keyboardLayout,
                    onSelect = { viewModel.updateKeyboardLayout(it) }
                )
                Spacer(modifier = Modifier.height(12.dp))

                // Key size
                SettingsSegmentedRow(
                    label = "Key Size",
                    options = KEY_SIZE_OPTIONS,
                    optionLabels = KEY_SIZE_OPTIONS.map { keySizeLabel(it) },
                    selected = uiState.keySize,
                    onSelect = { viewModel.updateKeySize(it) }
                )
                Spacer(modifier = Modifier.height(12.dp))                // Keyboard type selector
                    SettingsSegmentedRow(
                        label = "Keyboard Type",
                        options = listOf("CUSTOM", "NATIVE"),
                        optionLabels = listOf("In-App", "Device"),
                        selected = uiState.keyboardType,
                        onSelect = { viewModel.updateKeyboardType(it) }
                    )
                Spacer(modifier = Modifier.height(12.dp))

                // Key click type
                    Text(
                        text = "Key Click Type",
                    style = MaterialTheme.typography.labelMedium,
                    color = TextLabel,
                    fontWeight = FontWeight.SemiBold
                )
                Spacer(modifier = Modifier.height(8.dp))
                CLICK_TYPE_OPTIONS.forEach { type ->
                    val isSelected = uiState.keyClickType == type
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 3.dp),
                        shape = RoundedCornerShape(8.dp),
                        colors = CardDefaults.cardColors(
                            containerColor = if (isSelected) MagmaRed.copy(alpha = 0.15f) else Surface
                        ),
                        border = if (isSelected)
                            androidx.compose.foundation.BorderStroke(1.dp, MagmaRed.copy(alpha = 0.3f))
                        else null,
                        onClick = { viewModel.updateKeyClickType(type) }
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 12.dp, vertical = 10.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = type,
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = if (isSelected) TextWhite else TextBody,
                                    fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal
                                )
                                Text(
                                    text = clickTypeDesc(type),
                                    style = MaterialTheme.typography.labelSmall,
                                    color = TextMuted
                                )
                            }
                            if (isSelected) {
                                Text("✓", color = MagmaRed, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // ── Sound Section ────────────────────────────
        AnimatedVisibility(
            visible = sectionVisible >= 2,
            enter = slideInVertically(tween(300)) + fadeIn(tween(200))
        ) {
            SettingsSection(
                title = "SOUND",
                icon = "🔊"
            ) {
                SettingsSliderRow(
                    label = "Key Sound Volume",
                    value = uiState.soundVolume,
                    onValueChange = { viewModel.updateSoundVolume(it) },
                    displayValue = "${(uiState.soundVolume * 100).toInt()}"
                )
                Spacer(modifier = Modifier.height(12.dp))
                SettingsSliderRow(
                    label = "Music Volume",
                    value = uiState.musicVolume,
                    onValueChange = { viewModel.updateMusicVolume(it) },
                    displayValue = "${(uiState.musicVolume * 100).toInt()}"
                )
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // ── Haptics Section ──────────────────────────
        AnimatedVisibility(
            visible = sectionVisible >= 3,
            enter = slideInVertically(tween(300)) + fadeIn(tween(200))
        ) {
            SettingsSection(
                title = "HAPTICS",
                icon = "📳"
            ) {
                // On/off toggle
                SettingsToggleRow(
                    label = "Haptic Feedback",
                    checked = uiState.hapticsOn,
                    onCheckedChange = { viewModel.updateHapticsOn(it) }
                )
                Spacer(modifier = Modifier.height(12.dp))

                // Intensity (only if enabled)
                AnimatedVisibility(visible = uiState.hapticsOn) {
                    SettingsSegmentedRow(
                        label = "Intensity",
                        options = HAPTIC_INTENSITY_OPTIONS,
                        optionLabels = HAPTIC_INTENSITY_OPTIONS.map { intensityLabel(it) },
                        selected = uiState.hapticsIntensity,
                        onSelect = { viewModel.updateHapticsIntensity(it) }
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // ── Visual Section ───────────────────────────
        AnimatedVisibility(
            visible = sectionVisible >= 4,
            enter = slideInVertically(tween(300)) + fadeIn(tween(200))
        ) {
            SettingsSection(
                title = "VISUAL",
                icon = "🎨"
            ) {
                SettingsToggleRow(
                    label = "Reduced Particles",
                    subtitle = "Lower particle effects for better performance",
                    checked = uiState.reducedParticles,
                    onCheckedChange = { viewModel.updateReducedParticles(it) }
                )
                Spacer(modifier = Modifier.height(8.dp))
                SettingsToggleRow(
                    label = "High Contrast Mode",
                    subtitle = "Enhanced text readability",
                    checked = uiState.highContrast,
                    onCheckedChange = { viewModel.updateHighContrast(it) }
                )

                Spacer(modifier = Modifier.height(16.dp))

                // ── Keyboard Themes ───────────────────
                Text(
                    text = "Keyboard Theme",
                    style = MaterialTheme.typography.labelMedium,
                    color = TextLabel,
                    fontWeight = FontWeight.SemiBold
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "Unlock themes by completing levels",
                    style = MaterialTheme.typography.labelSmall,
                    color = TextMuted
                )
                Spacer(modifier = Modifier.height(8.dp))

                KeyboardThemes.ALL.forEach { theme ->
                    val isUnlocked = theme.id in uiState.unlockedThemes
                    val isActive = uiState.keyboardTheme == theme.id

                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 3.dp),
                        shape = RoundedCornerShape(8.dp),
                        colors = CardDefaults.cardColors(
                            containerColor = if (isActive) MagmaRed.copy(alpha = 0.12f) else Surface
                        ),
                        border = if (isActive)
                            androidx.compose.foundation.BorderStroke(1.dp, MagmaRed.copy(alpha = 0.3f))
                        else null,
                        onClick = { if (isUnlocked) viewModel.updateKeyboardTheme(theme.id) }
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 12.dp, vertical = 10.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            // Theme icon
                            Text(
                                text = theme.icon,
                                fontSize = 18.sp,
                                modifier = Modifier.alpha(if (isUnlocked) 1f else 0.4f)
                            )
                            Spacer(modifier = Modifier.width(10.dp))

                            Column(modifier = Modifier.weight(1f)) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Text(
                                        text = theme.name,
                                        style = MaterialTheme.typography.bodyMedium,
                                        color = if (isUnlocked) TextWhite else TextLabel,
                                        fontWeight = if (isActive) FontWeight.Bold else FontWeight.Medium
                                    )
                                    if (isActive) {
                                        Spacer(modifier = Modifier.width(6.dp))
                                        Text("✓", color = MagmaRed, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                                    }
                                }
                                Text(
                                    text = if (isUnlocked) theme.description else "🔒 Unlock at ${theme.levelsRequired} levels",
                                    style = MaterialTheme.typography.labelSmall,
                                    color = if (isUnlocked) TextMuted else TextDisabled
                                )
                            }
                        }
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // ── Accessibility Section ────────────────────
        AnimatedVisibility(
            visible = sectionVisible >= 5,
            enter = slideInVertically(tween(300)) + fadeIn(tween(200))
        ) {
            SettingsSection(
                title = "ACCESSIBILITY",
                icon = "♿"
            ) {
                SettingsSliderRow(
                    label = "Font Size",
                    value = (uiState.fontSize - 0.5f) / 1.5f,  // Map 0.5..2.0 → 0..1
                    onValueChange = { viewModel.updateFontSize(0.5f + it * 1.5f) },
                    displayValue = "${(uiState.fontSize * 100).toInt()}%",
                    valueRange = 0.5f..2.0f
                )
                Spacer(modifier = Modifier.height(12.dp))
                SettingsToggleRow(
                    label = "Left-Handed Mode",
                    subtitle = "Mirror keyboard layout for left-hand use",
                    checked = uiState.leftHanded,
                    onCheckedChange = { viewModel.updateLeftHanded(it) }
                )
            }
        }

        // Save indicator
        Spacer(modifier = Modifier.height(8.dp))
        SettingsSaveIndicator(
            isSaving = uiState.isSaving,
            saveSuccess = uiState.saveSuccess,
            saveError = uiState.saveError
        )

        Spacer(modifier = Modifier.height(32.dp))
    }
}

// ── Section Wrapper ──────────────────────────────────────

@Composable
private fun SettingsSection(
    title: String,
    icon: String,
    content: @Composable ColumnScope.() -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = Surface.copy(alpha = 0.8f))
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(text = icon, fontSize = 16.sp)
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = title,
                    style = MaterialTheme.typography.labelMedium,
                    color = MagmaRed,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 2.sp
                )
            }
            Spacer(modifier = Modifier.height(12.dp))
            content()
        }
    }
}

// ── Segmented Row ────────────────────────────────────────

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun SettingsSegmentedRow(
    label: String,
    options: List<String>,
    selected: String,
    onSelect: (String) -> Unit,
    optionLabels: List<String>? = null
) {
    Column {
        Text(
            text = label,
            style = MaterialTheme.typography.labelMedium,
            color = TextLabel,
            fontWeight = FontWeight.SemiBold
        )
        Spacer(modifier = Modifier.height(6.dp))
        SingleChoiceSegmentedButtonRow(modifier = Modifier.fillMaxWidth()) {
            options.forEachIndexed { index, option ->
                SegmentedButton(
                    selected = selected == option,
                    onClick = { onSelect(option) },
                    shape = SegmentedButtonDefaults.itemShape(
                        index = index,
                        count = options.size
                    ),
                    colors = SegmentedButtonDefaults.colors(
                        activeContainerColor = MagmaRed.copy(alpha = 0.2f),
                        activeContentColor = TextWhite,
                        inactiveContainerColor = SurfaceDark,
                        inactiveContentColor = TextLabel
                    )
                ) {
                    Text(
                        text = optionLabels?.get(index) ?: option,
                        style = MaterialTheme.typography.labelMedium,
                        fontWeight = if (selected == option) FontWeight.Bold else FontWeight.Normal
                    )
                }
            }
        }
    }
}

// ── Slider Row ───────────────────────────────────────────

@Composable
private fun SettingsSliderRow(
    label: String,
    value: Float,
    onValueChange: (Float) -> Unit,
    displayValue: String,
    valueRange: ClosedFloatingPointRange<Float> = 0f..1f
) {
    Column {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = label,
                style = MaterialTheme.typography.labelMedium,
                color = TextLabel,
                fontWeight = FontWeight.SemiBold
            )
            Text(
                text = displayValue,
                style = MaterialTheme.typography.bodyMedium,
                color = MagmaRed,
                fontWeight = FontWeight.Bold
            )
        }
        Spacer(modifier = Modifier.height(4.dp))
        Slider(
            value = value,
            onValueChange = onValueChange,
            valueRange = valueRange,
            modifier = Modifier.fillMaxWidth(),
            colors = SliderDefaults.colors(
                thumbColor = MagmaRed,
                activeTrackColor = MagmaRed,
                inactiveTrackColor = SurfaceBorder
            )
        )
    }
}

// ── Toggle Row ───────────────────────────────────────────

@Composable
private fun SettingsToggleRow(
    label: String,
    checked: Boolean,
    onCheckedChange: (Boolean) -> Unit,
    subtitle: String? = null
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = label,
                style = MaterialTheme.typography.bodyMedium,
                color = TextBody,
                fontWeight = FontWeight.Medium
            )
            if (subtitle != null) {
                Text(
                    text = subtitle,
                    style = MaterialTheme.typography.labelSmall,
                    color = TextMuted
                )
            }
        }
        Spacer(modifier = Modifier.width(12.dp))
        Switch(
            checked = checked,
            onCheckedChange = onCheckedChange,
            colors = SwitchDefaults.colors(
                checkedThumbColor = TextWhite,
                checkedTrackColor = MagmaRed,
                uncheckedThumbColor = TextDisabled,
                uncheckedTrackColor = SurfaceBorder
            )
        )
    }
}

// ── Save Indicator ───────────────────────────────────────

@Composable
private fun SettingsSaveIndicator(
    isSaving: Boolean,
    saveSuccess: Boolean,
    saveError: String?
) {
    AnimatedVisibility(
        visible = isSaving || saveSuccess || saveError != null,
        enter = fadeIn() + expandVertically(expandFrom = Alignment.Top),
        exit = fadeOut() + shrinkVertically(shrinkTowards = Alignment.Top)
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 8.dp),
            contentAlignment = Alignment.Center
        ) {
            when {
                isSaving -> Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.Center
                ) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(14.dp),
                        color = TextLabel,
                        strokeWidth = 2.dp
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Saving…", style = MaterialTheme.typography.labelSmall, color = TextLabel)
                }
                saveSuccess -> {
                    val alpha by animateFloatAsState(
                        targetValue = if (saveSuccess) 1f else 0f,
                        animationSpec = tween(500),
                        label = "saveAlpha"
                    )
                    Text(
                        text = "✓ Settings saved",
                        style = MaterialTheme.typography.labelSmall,
                        color = MagmaRed.copy(alpha = alpha),
                        fontWeight = FontWeight.Medium
                    )
                }
                saveError != null -> Text(
                    text = "✗ $saveError",
                    style = MaterialTheme.typography.labelSmall,
                    color = ErrorRed
                )
            }
        }
    }
}

// ── Loading State ────────────────────────────────────────

@Composable
private fun SettingsLoadingState() {
    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            CircularProgressIndicator(color = MagmaRed, modifier = Modifier.size(32.dp))
            Spacer(modifier = Modifier.height(16.dp))
            Text("Loading settings…", style = MaterialTheme.typography.bodyMedium, color = TextLabel)
        }
    }
}

// ── Error State ──────────────────────────────────────────

@Composable
private fun SettingsErrorState(message: String, onRetry: () -> Unit) {
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
