package com.typestrike.navigation

import androidx.compose.runtime.Composable
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.typestrike.ui.home.HomeScreen
import com.typestrike.ui.gameplay.GameplayScreen
import com.typestrike.ui.levelpreview.LevelPreviewScreen
import com.typestrike.ui.map.MapScreen
import com.typestrike.ui.victory.VictoryScreen
import com.typestrike.ui.levelfailed.LevelFailedScreen
import com.typestrike.ui.settings.SettingsScreen
import com.typestrike.ui.splash.SplashScreen
import com.typestrike.ui.stats.StatsScreen
import com.typestrike.ui.achievements.AchievementsScreen


@Composable
fun NavGraph(navController: NavHostController = rememberNavController()) {
    NavHost(
        navController = navController,
        startDestination = Screen.Splash.route
    ) {
        // Splash Screen (start destination)
        composable(Screen.Splash.route) {
            SplashScreen(
                onSplashComplete = {
                    navController.navigate(Screen.Home.route) {
                        popUpTo(Screen.Splash.route) { inclusive = true }
                    }
                }
            )
        }

        // Home / Dashboard
        composable(Screen.Home.route) {
            HomeScreen(
                onJumpIn = { levelId ->
                    navController.navigate(Screen.LevelPreview.createRoute(levelId))
                },
                onNavigateToMap = {
                    navController.navigate(Screen.Map.route)
                },
                onNavigateToStats = {
                    navController.navigate(Screen.Stats.route)
                },
                onNavigateToSettings = {
                    navController.navigate(Screen.Settings.route)
                }
            )
        }

        // Map (Level Select)
        composable(Screen.Map.route) {
            MapScreen(
                onLevelTap = { levelId ->
                    navController.navigate(Screen.LevelPreview.createRoute(levelId))
                },
                onNavigateToSettings = {
                    navController.navigate(Screen.Settings.route)
                },
                onNavigateBack = {
                    navController.popBackStack()
                }
            )
        }

        // Level Preview (bottom sheet)
        composable(
            route = Screen.LevelPreview.route,
            arguments = listOf(navArgument("levelId") { type = NavType.IntType })
        ) { backStackEntry ->
            val levelId = backStackEntry.arguments?.getInt("levelId") ?: 1
            LevelPreviewScreen(
                levelId = levelId,
                onStrike = { id ->
                    navController.navigate(Screen.Gameplay.createRoute(id))
                },
                onDismiss = {
                    navController.popBackStack()
                }
            )
        }

        // Gameplay Arena
        composable(
            route = Screen.Gameplay.route,
            arguments = listOf(navArgument("levelId") { type = NavType.IntType })
        ) { backStackEntry ->
            val levelId = backStackEntry.arguments?.getInt("levelId") ?: 1
            GameplayScreen(
                levelId = levelId,
                onLevelComplete = { id, wpm, accuracy, stars ->
                    navController.navigate(Screen.Victory.createRoute(id, wpm, accuracy, stars)) {
                        popUpTo(Screen.Home.route)
                    }
                },
                onLevelFailed = { id, wpm, accuracy ->
                    navController.navigate(Screen.LevelFailed.createRoute(id, wpm, accuracy)) {
                        popUpTo(Screen.Home.route)
                    }
                },
                onBack = {
                    navController.popBackStack()
                }
            )
        }

        // Victory Assessment
        composable(
            route = Screen.Victory.route,
            arguments = listOf(
                navArgument("levelId") { type = NavType.IntType },
                navArgument("wpm") { type = NavType.IntType },
                navArgument("accuracy") { type = NavType.IntType },
                navArgument("stars") { type = NavType.IntType }
            )
        ) { backStackEntry ->
            val levelId = backStackEntry.arguments?.getInt("levelId") ?: 1
            val wpm = backStackEntry.arguments?.getInt("wpm") ?: 0
            val accuracy = backStackEntry.arguments?.getInt("accuracy") ?: 0
            val stars = backStackEntry.arguments?.getInt("stars") ?: 0
            VictoryScreen(
                levelId = levelId,
                wpm = wpm,
                accuracy = accuracy,
                stars = stars,
                onPlayAgain = { id ->
                    navController.navigate(Screen.Gameplay.createRoute(id)) {
                        popUpTo(Screen.Home.route)
                    }
                },
                onNextLevel = { nextId ->
                    navController.navigate(Screen.Gameplay.createRoute(nextId.coerceAtMost(100))) {
                        popUpTo(Screen.Home.route)
                    }
                },
                onBackToMap = {
                    navController.navigate(Screen.Map.route) {
                        popUpTo(Screen.Home.route)
                    }
                }
            )
        }

        // Level Failed (overlay)
        composable(
            route = Screen.LevelFailed.route,
            arguments = listOf(
                navArgument("levelId") { type = NavType.IntType },
                navArgument("wpm") { type = NavType.IntType },
                navArgument("accuracy") { type = NavType.IntType }
            )
        ) { backStackEntry ->
            val levelId = backStackEntry.arguments?.getInt("levelId") ?: 1
            val wpm = backStackEntry.arguments?.getInt("wpm") ?: 0
            val accuracy = backStackEntry.arguments?.getInt("accuracy") ?: 0
            LevelFailedScreen(
                levelId = levelId,
                wpm = wpm,
                accuracy = accuracy,
                onRetry = { id ->
                    navController.navigate(Screen.Gameplay.createRoute(id)) {
                        popUpTo(Screen.Home.route)
                    }
                },
                onBackToMap = {
                    navController.navigate(Screen.Map.route) {
                        popUpTo(Screen.Home.route)
                    }
                }
            )
        }

        // Settings
        composable(Screen.Settings.route) {
            SettingsScreen(
                onBack = {
                    navController.popBackStack()
                }
            )
        }

        // Stats
        composable(Screen.Stats.route) {
            StatsScreen(
                onBack = {
                    navController.popBackStack()
                }
            )
        }

        // Achievements
        composable(Screen.Achievements.route) {
            AchievementsScreen(
                onBack = {
                    navController.popBackStack()
                }
            )
        }
    }
}
