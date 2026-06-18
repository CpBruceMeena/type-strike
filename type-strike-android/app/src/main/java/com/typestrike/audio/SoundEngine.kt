package com.typestrike.audio

import kotlin.math.PI
import kotlin.math.pow
import kotlin.math.sin
import kotlin.random.Random

/**
 * Generates programmatic PCM-16 audio buffers for all game sounds.
 * No audio files needed — every sound is synthesized at runtime.
 */
object SoundEngine {

    const val SAMPLE_RATE = 22050
    private const val MAX_AMP = 0.7f

    // ── Key Click Synthesis ──────────────────────────────────────

    /**
     * Returns the ShortArray PCM buffer for the given switch type.
     * Types: BLUE (clicky), BROWN (quiet tactile), RED (linear smooth), LINEAR (fast silent)
     */
    fun generateKeyClick(type: String): ShortArray = when (type) {
        "BLUE"   -> synthClick(45f, clickStrength = 0.55f, freq = 2800f, noise = 0.8f)
        "BROWN"  -> synthClick(40f, clickStrength = 0.35f, freq = 2000f, noise = 0.5f)
        "RED"    -> synthThud(35f, strength = 0.25f, freq = 120f)
        "LINEAR" -> synthThud(25f, strength = 0.10f, freq = 100f)
        else     -> synthClick(45f, clickStrength = 0.55f, freq = 2800f, noise = 0.8f)
    }

    private fun synthClick(durationMs: Float, clickStrength: Float, freq: Float, noise: Float): ShortArray {
        val samples = (SAMPLE_RATE * durationMs / 1000f).toInt()
        val buf = ShortArray(samples)
        val rng = Random.Default

        for (i in 0 until samples) {
            val t = i.toFloat() / SAMPLE_RATE
            val p = i.toFloat() / samples

            // Fast attack (~2%), exponential decay
            val env = if (p < 0.02f) p / 0.02f else (-p + 1f).pow(2f) * 1.2f

            val tone  = sin(2f * PI * freq * t).toFloat() * clickStrength * 0.5f
            val noiseV = (rng.nextFloat() * 2f - 1f) * noise * 0.3f

            val s = (tone + noiseV) * env * MAX_AMP * 0.8f
            buf[i] = (s * Short.MAX_VALUE).toInt().coerceIn(Short.MIN_VALUE.toInt(), Short.MAX_VALUE.toInt()).toShort()
        }
        return buf
    }

    private fun synthThud(durationMs: Float, strength: Float, freq: Float): ShortArray {
        val samples = (SAMPLE_RATE * durationMs / 1000f).toInt()
        val buf = ShortArray(samples)

        for (i in 0 until samples) {
            val t = i.toFloat() / SAMPLE_RATE
            val p = i.toFloat() / samples

            val env = if (p < 0.05f) p / 0.05f else (-p + 1f).pow(1.5f)

            val tone = sin(2f * PI * freq * t).toFloat() * 0.4f
            val sub  = sin(PI * freq * t).toFloat() * 0.2f

            val s = (tone + sub) * env * strength * MAX_AMP * 0.6f
            buf[i] = (s * Short.MAX_VALUE).toInt().coerceIn(Short.MIN_VALUE.toInt(), Short.MAX_VALUE.toInt()).toShort()
        }
        return buf
    }

    // ── Gameplay Feedback ────────────────────────────────────────

    /** Brief two-tone chime on correct keystroke (60 ms). */
    fun generateCorrect(): ShortArray {
        val samples = (SAMPLE_RATE * 60f / 1000f).toInt()
        val buf = ShortArray(samples)

        for (i in 0 until samples) {
            val t = i.toFloat() / SAMPLE_RATE
            val p = i.toFloat() / samples
            val env = (-p + 1f).pow(2f)

            val c5   = sin(2f * PI * 523f * t).toFloat() * 0.3f
            val g5   = sin(2f * PI * 784f * t).toFloat() * 0.2f

            val s = (c5 + g5) * env * MAX_AMP * 0.5f
            buf[i] = (s * Short.MAX_VALUE).toInt().coerceIn(Short.MIN_VALUE.toInt(), Short.MAX_VALUE.toInt()).toShort()
        }
        return buf
    }

    /** Low-frequency harsh buzz on mistake (100 ms). */
    fun generateError(): ShortArray {
        val samples = (SAMPLE_RATE * 100f / 1000f).toInt()
        val buf = ShortArray(samples)
        val rng = Random.Default

        for (i in 0 until samples) {
            val t = i.toFloat() / SAMPLE_RATE
            val p = i.toFloat() / samples
            val env = (-p + 1f).pow(1.5f)

            val buzz  = if (sin(2f * PI * 150f * t) > 0f) 0.5f else -0.5f
            val noise = (rng.nextFloat() * 2f - 1f) * 0.4f

            val s = (buzz + noise) * env * MAX_AMP * 0.6f
            buf[i] = (s * Short.MAX_VALUE).toInt().coerceIn(Short.MIN_VALUE.toInt(), Short.MAX_VALUE.toInt()).toShort()
        }
        return buf
    }

    // ── Combo Milestone ──────────────────────────────────────────

    /** Ascending C-E-G-C arpeggio (200 ms). */
    fun generateComboMilestone(): ShortArray {
        val samples = (SAMPLE_RATE * 200f / 1000f).toInt()
        val buf = ShortArray(samples)
        val notes = listOf(523f, 659f, 784f, 1047f) // C5 E5 G5 C6
        val noteLen = samples / notes.size

        for (i in 0 until samples) {
            val idx = (i / noteLen).coerceAtMost(notes.size - 1)
            val np  = (i % noteLen).toFloat() / noteLen
            val env = if (np < 0.1f) np / 0.1f else (-np + 1f).pow(2f)

            val t  = sin(2f * PI * notes[idx] * i.toFloat() / SAMPLE_RATE).toFloat() * 0.3f
            val h2 = sin(2f * PI * notes[idx] * 2f * i.toFloat() / SAMPLE_RATE).toFloat() * 0.1f

            val s = (t + h2) * env * MAX_AMP * 0.5f
            buf[i] = (s * Short.MAX_VALUE).toInt().coerceIn(Short.MIN_VALUE.toInt(), Short.MAX_VALUE.toInt()).toShort()
        }
        return buf
    }

    // ── Victory Fanfare ──────────────────────────────────────────

    /** Ascending C5→E6 arpeggio with harmonics (1.2 s). */
    fun generateVictory(): ShortArray {
        val samples = (SAMPLE_RATE * 1200f / 1000f).toInt()
        val buf = ShortArray(samples)
        val notes = listOf(523f, 659f, 784f, 1047f, 1319f, 1568f)
        val noteLen = samples / notes.size

        for (i in 0 until samples) {
            val idx = (i / noteLen).coerceAtMost(notes.size - 1)
            val np  = (i % noteLen).toFloat() / noteLen
            val env = if (np < 0.1f) np / 0.1f else (-np + 1f).pow(2f)

            val f = notes[idx]
            val t  = sin(2f * PI * f * i.toFloat() / SAMPLE_RATE).toFloat() * 0.3f
            val h2 = sin(2f * PI * f * 2f * i.toFloat() / SAMPLE_RATE).toFloat() * 0.15f
            val h3 = sin(2f * PI * f * 1.5f * i.toFloat() / SAMPLE_RATE).toFloat() * 0.1f

            val s = (t + h2 + h3) * env * MAX_AMP * 0.5f
            buf[i] = (s * Short.MAX_VALUE).toInt().coerceIn(Short.MIN_VALUE.toInt(), Short.MAX_VALUE.toInt()).toShort()
        }
        return buf
    }

    // ── Level Failed ────────────────────────────────────────────

    /** Descending G5→G4 with decaying noise (600 ms). */
    fun generateFailed(): ShortArray {
        val samples = (SAMPLE_RATE * 600f / 1000f).toInt()
        val buf = ShortArray(samples)
        val notes = listOf(784f, 659f, 523f, 392f)
        val noteLen = samples / notes.size
        val rng = Random.Default

        for (i in 0 until samples) {
            val idx = (i / noteLen).coerceAtMost(notes.size - 1)
            val np  = (i % noteLen).toFloat() / noteLen
            val env = if (np < 0.1f) np / 0.1f else (-np + 1f).pow(2f)

            // Slight frequency wobble
            val f   = notes[idx] * (1f + 0.01f * sin(2f * PI * 20f * i.toFloat() / SAMPLE_RATE))
            val t   = sin(2f * PI * f * i.toFloat() / SAMPLE_RATE).toFloat() * 0.3f
            val n   = (rng.nextFloat() * 2f - 1f) * 0.15f * (1f - np)

            val s = (t + n) * env * MAX_AMP * 0.5f
            buf[i] = (s * Short.MAX_VALUE).toInt().coerceIn(Short.MIN_VALUE.toInt(), Short.MAX_VALUE.toInt()).toShort()
        }
        return buf
    }

    // ── Countdown ───────────────────────────────────────────────

    /** Short 880 Hz beep (80 ms). */
    fun generateCountdownBeep(): ShortArray {
        val samples = (SAMPLE_RATE * 80f / 1000f).toInt()
        val buf = ShortArray(samples)

        for (i in 0 until samples) {
            val t = i.toFloat() / SAMPLE_RATE
            val p = i.toFloat() / samples
            val env = if (p < 0.1f) p / 0.1f else (-p + 1f).pow(2f)

            val s = sin(2f * PI * 880f * t).toFloat() * 0.4f * env * MAX_AMP * 0.6f
            buf[i] = (s * Short.MAX_VALUE).toInt().coerceIn(Short.MIN_VALUE.toInt(), Short.MAX_VALUE.toInt()).toShort()
        }
        return buf
    }

    /** Rising sweep 440→1320 Hz with harmonic (300 ms). */
    fun generateGo(): ShortArray {
        val samples = (SAMPLE_RATE * 300f / 1000f).toInt()
        val buf = ShortArray(samples)

        for (i in 0 until samples) {
            val t = i.toFloat() / SAMPLE_RATE
            val p = i.toFloat() / samples

            val f = 440f + (1320f - 440f) * p
            val env = if (p < 0.05f) p / 0.05f else (-p + 1f).pow(1.5f)

            val t1 = sin(2f * PI * f * t).toFloat() * 0.35f
            val t2 = sin(2f * PI * f * 2f * t).toFloat() * 0.15f

            val s = (t1 + t2) * env * MAX_AMP * 0.65f
            buf[i] = (s * Short.MAX_VALUE).toInt().coerceIn(Short.MIN_VALUE.toInt(), Short.MAX_VALUE.toInt()).toShort()
        }
        return buf
    }
}
