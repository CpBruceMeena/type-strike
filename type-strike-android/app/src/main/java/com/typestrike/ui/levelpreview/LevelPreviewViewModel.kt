package com.typestrike.ui.levelpreview

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.typestrike.data.model.LevelDetail
import com.typestrike.data.repository.LevelRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

/**
 * UI state for the Level Preview bottom sheet.
 */
data class LevelPreviewUiState(
    val isLoading: Boolean = true,
    val hasError: Boolean = false,
    val errorMessage: String? = null,
    val levelDetail: LevelDetail? = null
)

/**
 * ViewModel for the Level Preview bottom sheet.
 * Loads the level detail (config + player progress) from the backend.
 */
@HiltViewModel
class LevelPreviewViewModel @Inject constructor(
    private val levelRepository: LevelRepository
) : ViewModel() {

    companion object {
        private const val PLAYER_ID = 1
    }

    private val _uiState = MutableStateFlow(LevelPreviewUiState())
    val uiState: StateFlow<LevelPreviewUiState> = _uiState.asStateFlow()

    fun loadLevel(levelId: Int) {
        if (_uiState.value.levelDetail?.id == levelId && !_uiState.value.isLoading) return

        viewModelScope.launch {
            _uiState.value = LevelPreviewUiState(isLoading = true)

            val result = levelRepository.getLevelDetail(levelId, PLAYER_ID)
            result.fold(
                onSuccess = { detail ->
                    _uiState.value = LevelPreviewUiState(
                        isLoading = false,
                        levelDetail = detail
                    )
                },
                onFailure = { error ->
                    _uiState.value = LevelPreviewUiState(
                        isLoading = false,
                        hasError = true,
                        errorMessage = error.message ?: "Failed to load level"
                    )
                }
            )
        }
    }
}
