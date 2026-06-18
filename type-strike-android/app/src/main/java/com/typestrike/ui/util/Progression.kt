package com.typestrike.ui.util

/**
 * Progression helpers for XP, level, and title calculations.
 */
object Progression {
    fun xpForNextLevel(currentLevel: Int): Int {
        return (100.0 * currentLevel * 1.5).toInt()
    }

    fun xpProgress(currentXp: Int, currentLevel: Int): Float {
        val required = xpForNextLevel(currentLevel)
        if (required <= 0) return 1f
        return (currentXp.toFloat() / required).coerceIn(0f, 1f)
    }

    fun getTitleForLevel(level: Int): String = when {
        level >= 90 -> "OBSIDIAN GOD"
        level >= 75 -> "MAGMA LORD"
        level >= 60 -> "FLAME WEAVER"
        level >= 50 -> "INFERNO KNIGHT"
        level >= 40 -> "EMBER SAGE"
        level >= 30 -> "FIRE BRINGER"
        level >= 20 -> "BLAZE RUNNER"
        level >= 10 -> "SPARK GUARDIAN"
        level >= 5 -> "FLAME KINDLER"
        else -> "RECRUIT"
    }
}
