package com.typestrike.data.model

import androidx.compose.ui.graphics.Color

/**
 * A keyboard appearance theme that can be unlocked by completing levels.
 */
data class KeyboardTheme(
    val id: String,
    val name: String,
    val description: String,
    val icon: String,
    val keyBackgroundColor: Long,        // ARGB hex
    val keyPressedColor: Long,           // ARGB hex
    val keyTextColor: Long,              // ARGB hex
    val keyBorderColor: Long,            // ARGB hex
    val glowColor: Long,                 // ARGB hex
    /** Number of levels required to unlock this theme */
    val levelsRequired: Int
)

object KeyboardThemes {

    /** Default theme — always available. */
    val DEFAULT = KeyboardTheme(
        id = "default",
        name = "Magma",
        description = "Default fiery red theme",
        icon = "🔥",
        keyBackgroundColor = 0xFF1A1A28,
        keyPressedColor = 0xFFFF5020,
        keyTextColor = 0xFFCCCCCC,
        keyBorderColor = 0xFF2A2A3A,
        glowColor = 0xFFFF5020,
        levelsRequired = 0
    )

    /** Gold theme — unlocked at 10 levels cleared. */
    val GOLD = KeyboardTheme(
        id = "gold",
        name = "Molten Gold",
        description = "Premium golden keys",
        icon = "★",
        keyBackgroundColor = 0xFF1A1A28,
        keyPressedColor = 0xFFFFCC00,
        keyTextColor = 0xFFFFFFFF,
        keyBorderColor = 0xFF665500,
        glowColor = 0xFFFFCC00,
        levelsRequired = 10
    )

    /** Neon theme — unlocked at 25 levels cleared. */
    val NEON = KeyboardTheme(
        id = "neon",
        name = "Neon Pulse",
        description = "Electric purple glow",
        icon = "✦",
        keyBackgroundColor = 0xFF1A1028,
        keyPressedColor = 0xFFCC44FF,
        keyTextColor = 0xFFFFFFFF,
        keyBorderColor = 0xFF442266,
        glowColor = 0xFFCC44FF,
        levelsRequired = 25
    )

    /** Ice theme — unlocked at 50 levels cleared. */
    val ICE = KeyboardTheme(
        id = "ice",
        name = "Frost Strike",
        description = "Chilling blue keys",
        icon = "❄",
        keyBackgroundColor = 0xFF102028,
        keyPressedColor = 0xFF44AAFF,
        keyTextColor = 0xFFCCDDEE,
        keyBorderColor = 0xFF224466,
        glowColor = 0xFF44AAFF,
        levelsRequired = 50
    )

    /** Obsidian theme — unlocked at 75 levels cleared. */
    val OBSIDIAN = KeyboardTheme(
        id = "obsidian",
        name = "Obsidian Void",
        description = "Dark prestige keys",
        icon = "⚫",
        keyBackgroundColor = 0xFF0A0A10,
        keyPressedColor = 0xFFCCCCCC,
        keyTextColor = 0xFFCCCCCC,
        keyBorderColor = 0xFF333344,
        glowColor = 0xFFCCCCCC,
        levelsRequired = 75
    )

    /** Rainbow theme — unlocked at 100 levels cleared (all completed). */
    val RAINBOW = KeyboardTheme(
        id = "rainbow",
        name = "Prismatic Fury",
        description = "All colors unlocked",
        icon = "🌈",
        keyBackgroundColor = 0xFF1A1A28,
        keyPressedColor = 0xFFFF5020,
        keyTextColor = 0xFFFFFFFF,
        keyBorderColor = 0xFFFFCC00,
        glowColor = 0xFFFF00AA,
        levelsRequired = 100
    )

    val ALL: List<KeyboardTheme> = listOf(DEFAULT, GOLD, NEON, ICE, OBSIDIAN, RAINBOW)

    /** Returns themes unlocked at the given level completion count. */
    fun unlockedFor(levelsCleared: Int): List<KeyboardTheme> {
        return ALL.filter { levelsCleared >= it.levelsRequired }
    }

    /** Returns themes still locked at the given level completion count. */
    fun lockedFor(levelsCleared: Int): List<KeyboardTheme> {
        return ALL.filter { levelsCleared < it.levelsRequired }
    }
}
