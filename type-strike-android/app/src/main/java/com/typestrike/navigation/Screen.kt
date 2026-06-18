package com.typestrike.navigation

/**
 * All navigation destinations in the type-strike app.
 */
sealed class Screen(val route: String) {
    data object Home : Screen("home")
    data object Map : Screen("map")
    data object LevelPreview : Screen("level_preview/{levelId}") {
        fun createRoute(levelId: Int) = "level_preview/$levelId"
    }
    data object Gameplay : Screen("gameplay/{levelId}") {
        fun createRoute(levelId: Int) = "gameplay/$levelId"
    }
    data object Victory : Screen("victory/{levelId}/{wpm}/{accuracy}/{stars}") {
        fun createRoute(levelId: Int, wpm: Int, accuracy: Int, stars: Int) =
            "victory/$levelId/$wpm/$accuracy/$stars"
    }
    data object LevelFailed : Screen("level_failed/{levelId}/{wpm}/{accuracy}") {
        fun createRoute(levelId: Int, wpm: Int, accuracy: Int) =
            "level_failed/$levelId/$wpm/$accuracy"
    }
    data object Settings : Screen("settings")
    data object Stats : Screen("stats")
    data object Achievements : Screen("achievements")
}
