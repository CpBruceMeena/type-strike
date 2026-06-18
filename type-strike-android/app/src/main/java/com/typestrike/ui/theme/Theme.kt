package com.typestrike.ui.theme

import android.app.Activity
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat

private val TypeStrikeColorScheme = darkColorScheme(
    primary = MagmaRed,
    onPrimary = TextWhite,
    primaryContainer = MagmaRedDark,
    secondary = MoltenGold,
    tertiary = NeonPurple,
    background = Background,
    surface = Surface,
    surfaceVariant = SurfaceDark,
    error = ErrorRed,
    onBackground = TextWhite,
    onSurface = TextBody,
    onSurfaceVariant = TextLabel,
    outline = SurfaceBorder,
    outlineVariant = SurfaceDark
)

@Composable
fun TypeStrikeTheme(
    content: @Composable () -> Unit
) {
    val colorScheme = TypeStrikeColorScheme
    val view = LocalView.current

    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as Activity).window
            window.statusBarColor = Background.toArgb()
            WindowCompat.getInsetsController(window, view).isAppearanceLightStatusBars = false
        }
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = TypeStrikeTypography,
        content = content
    )
}
