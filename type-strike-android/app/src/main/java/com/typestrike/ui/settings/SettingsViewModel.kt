package com.typestrike.ui.settings

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.typestrike.data.model.KeyboardTheme
import com.typestrike.data.model.KeyboardThemes
import com.typestrike.data.repository.LevelRepository
import com.typestrike.data.repository.SettingsRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.async
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

/**
 * UI state for the Settings screen.
 */
data class SettingsUiState(
    val isLoading: Boolean = true,
    val hasError: Boolean = false,
    val errorMessage: String? = null,
    val isSaving: Boolean = false,
    val saveSuccess: Boolean = false,
    val saveError: String? = null,
    // Keyboard
    val keyboardLayout: String = "QWERTY",
    val keySize: String = "M",
    val keyClickType: String = "BLUE",
    val keyboardType: String = "CUSTOM",  // CUSTOM or NATIVE
    val keyboardTheme: String = "default",
    val unlockedThemes: List<String> = listOf("default"),
    // Sound
    val soundVolume: Float = 0.8f,
    val musicVolume: Float = 0.5f,
    // Haptics
    val hapticsOn: Boolean = true,
    val hapticsIntensity: String = "MEDIUM",
    // Visual
    val reducedParticles: Boolean = false,
    val highContrast: Boolean = false,
    // Accessibility
    val fontSize: Float = 1.0f,
    val leftHanded: Boolean = false
)

/**
 * ViewModel for the Settings screen.
 * Loads current settings from the backend and persists changes.
 */
@HiltViewModel
class SettingsViewModel @Inject constructor(
    private val settingsRepository: SettingsRepository,
    private val levelRepository: LevelRepository
) : ViewModel() {

    companion object {
        private const val PLAYER_ID = 1
    }

    private val _uiState = MutableStateFlow(SettingsUiState())
    val uiState: StateFlow<SettingsUiState> = _uiState.asStateFlow()

    init {
        loadSettings()
    }

    fun loadSettings() {
        viewModelScope.launch {
            _uiState.value = SettingsUiState(isLoading = true)

            val settingsDeferred = async { settingsRepository.getAll(PLAYER_ID) }
            val progressDeferred = async { levelRepository.getAllPlayerProgress(PLAYER_ID) }
            val settingsResult = settingsDeferred.await()
            val progressResult = progressDeferred.await()

            val levelsCleared = progressResult.getOrNull()?.count { it.completed } ?: 0
            val unlockedIds = KeyboardThemes.unlockedFor(levelsCleared).map { it.id }

            settingsResult.fold(
                onSuccess = { settings ->
                    val activeTheme = settings["keyboard_theme"]?.takeIf { it in unlockedIds } ?: "default"
                    _uiState.value = SettingsUiState(
                        isLoading = false,
                        keyboardLayout = settings["keyboard_layout"] ?: "QWERTY",
                        keySize = settings["key_size"] ?: "M",
                        keyClickType = settings["key_click_type"] ?: "BLUE",
                        keyboardType = settings["keyboard_type"] ?: "CUSTOM",
                        keyboardTheme = activeTheme,
                        unlockedThemes = unlockedIds,
                        soundVolume = (settings["sound_volume"]?.toFloatOrNull() ?: 0.8f).coerceIn(0f, 1f),
                        musicVolume = (settings["music_volume"]?.toFloatOrNull() ?: 0.5f).coerceIn(0f, 1f),
                        hapticsOn = settings["haptics_on"]?.toBooleanStrictOrNull() ?: true,
                        hapticsIntensity = settings["haptics_intensity"] ?: "MEDIUM",
                        reducedParticles = settings["reduced_particles"]?.toBooleanStrictOrNull() ?: false,
                        highContrast = settings["high_contrast"]?.toBooleanStrictOrNull() ?: false,
                        fontSize = (settings["font_size"]?.toFloatOrNull() ?: 1.0f).coerceIn(0.5f, 2.0f),
                        leftHanded = settings["left_handed"]?.toBooleanStrictOrNull() ?: false
                    )
                },
                onFailure = { error ->
                    _uiState.value = SettingsUiState(
                        isLoading = false,
                        hasError = true,
                        errorMessage = error.message ?: "Failed to load settings"
                    )
                }
            )
        }
    }

    fun updateKeyboardLayout(value: String) {
        _uiState.value = _uiState.value.copy(keyboardLayout = value)
        saveSetting("keyboard_layout", value)
    }

    fun updateKeySize(value: String) {
        _uiState.value = _uiState.value.copy(keySize = value)
        saveSetting("key_size", value)
    }

    fun updateKeyClickType(value: String) {
        _uiState.value = _uiState.value.copy(keyClickType = value)
        saveSetting("key_click_type", value)
    }

    fun updateSoundVolume(value: Float) {
        _uiState.value = _uiState.value.copy(soundVolume = value)
        saveSetting("sound_volume", value.toString())
    }

    fun updateMusicVolume(value: Float) {
        _uiState.value = _uiState.value.copy(musicVolume = value)
        saveSetting("music_volume", value.toString())
    }

    fun updateHapticsOn(value: Boolean) {
        _uiState.value = _uiState.value.copy(hapticsOn = value)
        saveSetting("haptics_on", value.toString())
    }

    fun updateHapticsIntensity(value: String) {
        _uiState.value = _uiState.value.copy(hapticsIntensity = value)
        saveSetting("haptics_intensity", value)
    }

    fun updateReducedParticles(value: Boolean) {
        _uiState.value = _uiState.value.copy(reducedParticles = value)
        saveSetting("reduced_particles", value.toString())
    }

    fun updateHighContrast(value: Boolean) {
        _uiState.value = _uiState.value.copy(highContrast = value)
        saveSetting("high_contrast", value.toString())
    }

    fun updateFontSize(value: Float) {
        _uiState.value = _uiState.value.copy(fontSize = value)
        saveSetting("font_size", value.toString())
    }

    fun updateLeftHanded(value: Boolean) {
        _uiState.value = _uiState.value.copy(leftHanded = value)
        saveSetting("left_handed", value.toString())
    }

    fun updateKeyboardType(value: String) {
        _uiState.value = _uiState.value.copy(keyboardType = value)
        saveSetting("keyboard_type", value)
    }

    fun updateKeyboardTheme(value: String) {
        if (value in _uiState.value.unlockedThemes) {
            _uiState.value = _uiState.value.copy(keyboardTheme = value)
            saveSetting("keyboard_theme", value)
        }
    }

    private fun saveSetting(key: String, value: String) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isSaving = true, saveSuccess = false, saveError = null)
            val result = settingsRepository.batchUpdate(PLAYER_ID, mapOf(key to value))
            result.fold(
                onSuccess = {
                    _uiState.value = _uiState.value.copy(isSaving = false, saveSuccess = true)
                },
                onFailure = { error ->
                    _uiState.value = _uiState.value.copy(
                        isSaving = false,
                        saveError = error.message ?: "Failed to save"
                    )
                }
            )
        }
    }
}
