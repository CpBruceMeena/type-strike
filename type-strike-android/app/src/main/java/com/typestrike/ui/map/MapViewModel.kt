package com.typestrike.ui.map

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.typestrike.data.repository.LevelRepository
import com.typestrike.data.repository.PlayerRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.async
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

/**
 * A merged map-level item with player progress.
 */
data class MapLevelItem(
    val id: Int,
    val name: String,
    val tier: String,
    val difficulty: Int,
    val passWpm: Int,
    val passAccuracy: Int,
    val stars: Int = 0,
    val bestWpm: Int = 0,
    val bestAccuracy: Float = 0f,
    val completed: Boolean = false,
    val attempts: Int = 0,
    val isUnlocked: Boolean = false
)

/**
 * UI state for the Map / Level Select screen.
 */
data class MapUiState(
    val isLoading: Boolean = true,
    val isRefreshing: Boolean = false,
    val hasError: Boolean = false,
    val errorMessage: String? = null,
    val levels: List<MapLevelItem> = emptyList(),
    val playerLevel: Int = 1,
    val playerTitle: String = "RECRUIT",
    val playerStars: Int = 0,
    val firstUncompletedLevelId: Int = 1
)

/**
 * ViewModel for the Map / Level Select screen.
 * Loads level configs, merges with player progress, and exposes UI state.
 */
@HiltViewModel
class MapViewModel @Inject constructor(
    private val levelRepository: LevelRepository,
    private val playerRepository: PlayerRepository
) : ViewModel() {

    companion object {
        private const val PLAYER_ID = 1
    }

    private val _uiState = MutableStateFlow(MapUiState())
    val uiState: StateFlow<MapUiState> = _uiState.asStateFlow()

    init {
        loadMapData()
    }

    fun loadMapData() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, hasError = false)

            // Fetch levels and player progress + summary in parallel
            val (levelsResult, progressResult, summaryResult) = coroutineScope {
                val levelsDeferred = async { levelRepository.getAllLevels() }
                val progressDeferred = async { levelRepository.getAllPlayerProgress(PLAYER_ID) }
                val summaryDeferred = async { playerRepository.getSummary(PLAYER_ID) }
                Triple(levelsDeferred.await(), progressDeferred.await(), summaryDeferred.await())
            }

            levelsResult.fold(
                onSuccess = { levels ->
                    val progressMap = progressResult.getOrNull()?.associateBy { it.levelId } ?: emptyMap()
                    val player = summaryResult.getOrNull()?.player
                    val clearedCount = summaryResult.getOrNull()?.levelsCleared ?: 0

                    // Determine which levels are unlocked: the first uncompleted + all before it
                    val firstUncompleted = clearedCount + 1

                    val mapLevels = levels.map { level ->
                        val prog = progressMap[level.id]
                        MapLevelItem(
                            id = level.id,
                            name = level.name,
                            tier = level.tier,
                            difficulty = level.difficulty,
                            passWpm = level.passWpm,
                            passAccuracy = level.passAccuracy,
                            stars = level.playerStars ?: prog?.stars ?: 0,
                            bestWpm = level.playerBestWpm ?: prog?.bestWpm ?: 0,
                            bestAccuracy = (level.playerBestAcc ?: prog?.bestAccuracy)?.toFloat() ?: 0f,
                            completed = prog?.completed ?: false,
                            attempts = prog?.attempts ?: 0,
                            isUnlocked = level.id <= firstUncompleted
                        )
                    }

                    _uiState.value = MapUiState(
                        isLoading = false,
                        levels = mapLevels,
                        playerLevel = player?.level ?: 1,
                        playerTitle = player?.title ?: "RECRUIT",
                        playerStars = player?.totalStars ?: 0,
                        firstUncompletedLevelId = firstUncompleted.coerceAtMost(100)
                    )
                },
                onFailure = { error ->
                    _uiState.value = MapUiState(
                        isLoading = false,
                        hasError = true,
                        errorMessage = error.message ?: "Failed to load map data"
                    )
                }
            )
        }
    }

    fun refresh() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isRefreshing = true)
            loadMapData()
            _uiState.value = _uiState.value.copy(isRefreshing = false)
        }
    }
}


