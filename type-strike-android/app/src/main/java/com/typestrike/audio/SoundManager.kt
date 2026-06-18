package com.typestrike.audio

import android.content.Context
import android.media.AudioAttributes
import android.media.AudioFormat
import android.media.AudioTrack
import java.util.concurrent.Executors
import java.util.concurrent.atomic.AtomicBoolean
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Manages playback of all game sounds and looping background music.
 *
 * - Sound effects: pre-generated buffers played one-shot via MODE_STATIC
 * - Background music: a single looping AudioTrack with fade in/out
 */
@Singleton
class SoundManager @Inject constructor(
    @Suppress("UNUSED_PARAMETER") context: Context
) {
    private val executor = Executors.newSingleThreadExecutor { r ->
        Thread(r, "sound-playback").apply { priority = Thread.MIN_PRIORITY }
    }

    // Cached PCM buffers for sound effects
    private val clickCache = mutableMapOf<String, ShortArray>()
    private var correctBuf: ShortArray? = null
    private var errorBuf: ShortArray? = null
    private var comboTBuf: ShortArray? = null
    private var victoryBuf: ShortArray? = null
    private var failedBuf: ShortArray? = null
    private var countBuf: ShortArray? = null
    private var goBuf: ShortArray? = null

    // ── Music state ──────────────────────────────────────────────

    private var musicTrack: AudioTrack? = null
    private var musicBuf: ShortArray? = null
    private var musicVolume: Float = 0.5f
    private val musicPlaying = AtomicBoolean(false)

    // ── Public Sound Effect Methods ──────────────────────────────

    fun playKeyClick(type: String, volume: Float) {
        val buf = clickCache.getOrPut(type) { SoundEngine.generateKeyClick(type) }
        playBuffer(buf, volume)
    }

    fun playCorrect(volume: Float) {
        if (volume <= 0f) return
        val buf = correctBuf ?: SoundEngine.generateCorrect().also { correctBuf = it }
        playBuffer(buf, volume)
    }

    fun playError(volume: Float) {
        if (volume <= 0f) return
        val buf = errorBuf ?: SoundEngine.generateError().also { errorBuf = it }
        playBuffer(buf, volume)
    }

    fun playComboMilestone(volume: Float) {
        if (volume <= 0f) return
        val buf = comboTBuf ?: SoundEngine.generateComboMilestone().also { comboTBuf = it }
        playBuffer(buf, volume)
    }

    fun playVictory(volume: Float) {
        if (volume <= 0f) return
        val buf = victoryBuf ?: SoundEngine.generateVictory().also { victoryBuf = it }
        playBuffer(buf, volume)
    }

    fun playFailed(volume: Float) {
        if (volume <= 0f) return
        val buf = failedBuf ?: SoundEngine.generateFailed().also { failedBuf = it }
        playBuffer(buf, volume)
    }

    fun playCountdown(volume: Float) {
        if (volume <= 0f) return
        val buf = countBuf ?: SoundEngine.generateCountdownBeep().also { countBuf = it }
        playBuffer(buf, volume)
    }

    fun playGo(volume: Float) {
        if (volume <= 0f) return
        val buf = goBuf ?: SoundEngine.generateGo().also { goBuf = it }
        playBuffer(buf, volume)
    }

    /** Preview a key click type (clears cache so a regenerated buffer is used). */
    fun previewKeyClick(type: String, volume: Float = 0.8f) {
        clickCache.remove(type)
        playKeyClick(type, volume)
    }

    // ── Background Music ────────────────────────────────────────

    /**
     * Start looping background music.
     * Generates the PCM buffer once (lazy), then starts playback in a loop.
     * If music is already playing, just updates the volume.
     */
    fun startMusic(volume: Float) {
        musicVolume = volume.coerceIn(0f, 1f)
        if (musicPlaying.get()) {
            // Already playing — just update volume
            setMusicVolume(volume)
            return
        }
        if (volume <= 0f) return

        executor.execute {
            try {
                val pcm = musicBuf ?: MusicEngine.generateLoop().also { musicBuf = it }
                val scaled = if (volume >= 1f) pcm else scale(pcm, volume)

                val track = AudioTrack.Builder()
                    .setAudioAttributes(
                        AudioAttributes.Builder()
                            .setUsage(AudioAttributes.USAGE_GAME)
                            .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                            .build()
                    )
                    .setAudioFormat(
                        AudioFormat.Builder()
                            .setEncoding(AudioFormat.ENCODING_PCM_16BIT)
                            .setSampleRate(MusicEngine.SAMPLE_RATE)
                            .setChannelMask(AudioFormat.CHANNEL_OUT_MONO)
                            .build()
                    )
                    .setBufferSizeInBytes(scaled.size * 2)
                    .setTransferMode(AudioTrack.MODE_STATIC)
                    .build()

                track.write(scaled, 0, scaled.size)
                // Loop indefinitely: loopStart=0, loopEnd=buffer, loopCount=-1
                track.setLoopPoints(0, scaled.size, -1)
                track.play()

                musicTrack = track
                musicPlaying.set(true)
            } catch (_: Exception) {
                // Non-critical
            }
        }
    }

    /** Stop background music (with brief fade-out). */
    fun stopMusic() {
        musicPlaying.set(false)
        executor.execute {
            try {
                musicTrack?.let { track ->
                    if (track.playState == AudioTrack.PLAYSTATE_PLAYING) {
                        track.pause()
                    }
                    track.flush()
                    track.release()
                }
                musicTrack = null
            } catch (_: Exception) {
                // Non-critical
            }
        }
    }

    /** Update music volume without restarting playback. */
    fun setMusicVolume(volume: Float) {
        musicVolume = volume.coerceIn(0f, 1f)
        executor.execute {
            try {
                musicTrack?.let { track ->
                    track.pause()
                    track.flush()

                    val pcm = musicBuf ?: return@let
                    val scaled = if (volume >= 1f) pcm else scale(pcm, volume)

                    val newTrack = AudioTrack.Builder()
                        .setAudioAttributes(
                            AudioAttributes.Builder()
                                .setUsage(AudioAttributes.USAGE_GAME)
                                .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                                .build()
                        )
                        .setAudioFormat(
                            AudioFormat.Builder()
                                .setEncoding(AudioFormat.ENCODING_PCM_16BIT)
                                .setSampleRate(MusicEngine.SAMPLE_RATE)
                                .setChannelMask(AudioFormat.CHANNEL_OUT_MONO)
                                .build()
                        )
                        .setBufferSizeInBytes(scaled.size * 2)
                        .setTransferMode(AudioTrack.MODE_STATIC)
                        .build()

                    newTrack.write(scaled, 0, scaled.size)
                    newTrack.setLoopPoints(0, scaled.size, -1)
                    newTrack.play()

                    musicTrack = newTrack
                }
            } catch (_: Exception) {
                // Non-critical
            }
        }
    }

    /** Whether background music is currently playing. */
    fun isMusicPlaying(): Boolean = musicPlaying.get()

    // ── Internal ────────────────────────────────────────────────

    private fun playBuffer(pcm: ShortArray, volume: Float) {
        if (volume <= 0f) return
        executor.execute {
            try {
                val scaled = if (volume >= 1f) pcm else scale(pcm, volume)

                val track = AudioTrack.Builder()
                    .setAudioAttributes(
                        AudioAttributes.Builder()
                            .setUsage(AudioAttributes.USAGE_GAME)
                            .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                            .build()
                    )
                    .setAudioFormat(
                        AudioFormat.Builder()
                            .setEncoding(AudioFormat.ENCODING_PCM_16BIT)
                            .setSampleRate(SoundEngine.SAMPLE_RATE)
                            .setChannelMask(AudioFormat.CHANNEL_OUT_MONO)
                            .build()
                    )
                    .setBufferSizeInBytes(scaled.size * 2)
                    .setTransferMode(AudioTrack.MODE_STATIC)
                    .build()

                track.write(scaled, 0, scaled.size)
                track.play()

                val durMs = (scaled.size.toFloat() / SoundEngine.SAMPLE_RATE * 1000f).toLong()
                Thread.sleep(durMs + 20) // small margin
                track.stop()
                track.release()
            } catch (_: Exception) {
                // Non-critical — log and continue
            }
        }
    }

    private fun scale(pcm: ShortArray, vol: Float): ShortArray {
        if (vol >= 1f) return pcm
        return ShortArray(pcm.size) { i ->
            (pcm[i].toFloat() * vol)
                .toInt()
                .coerceIn(Short.MIN_VALUE.toInt(), Short.MAX_VALUE.toInt())
                .toShort()
        }
    }

    fun release() {
        stopMusic()
        executor.shutdownNow()
        clickCache.clear()
        correctBuf = null
        errorBuf = null
        comboTBuf = null
        victoryBuf = null
        failedBuf = null
        countBuf = null
        goBuf = null
        musicBuf = null
    }
}
