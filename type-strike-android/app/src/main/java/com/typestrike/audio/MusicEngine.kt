package com.typestrike.audio

import kotlin.math.PI
import kotlin.math.pow
import kotlin.math.sin

/**
 * Generates a seamless looping PCM-16 buffer of ambient electronic music
 * to play as background music during gameplay.
 *
 * 4-bar phrase in E minor at 130 BPM, with:
 * - Kick drum on beats 1 & 3
 * - Closed hi-hat on 8th notes
 * - Sub-bass following chord changes
 * - Warm filtered pad chords
 * - Subtle arpeggiated synth line
 */
object MusicEngine {

    const val SAMPLE_RATE = 22050
    private const val MAX_AMP = 0.5f

    /** BPM and timing */
    private const val BPM = 130
    private const val BEAT_DURATION_S = 60f / BPM       // ~0.462s
    private const val BEAT_SAMPLES = (SAMPLE_RATE * BEAT_DURATION_S).toInt()

    /** 4 bars × 4 beats = 16 beats */
    private const val TOTAL_BEATS = 16
    val LOOP_SAMPLES = BEAT_SAMPLES * TOTAL_BEATS       // ≈ 176,400 at 22kHz
    val LOOP_DURATION_MS = (LOOP_SAMPLES.toFloat() / SAMPLE_RATE * 1000f).toLong()

    // Chord progression (E minor): Em | C | G | Am
    // Each chord lasts 4 beats (1 bar)
    private val CHORDS = listOf(
        listOf(52f, 55f, 59f),   // E2, G2, B2  (Em)
        listOf(48f, 52f, 55f),   // C2, E2, G2  (C)
        listOf(55f, 59f, 62f),   // G2, B2, D3  (G)
        listOf(57f, 60f, 64f),   // A2, C3, E3  (Am)
    )
    private val BASS_NOTES = listOf(40f, 48f, 43f, 45f)  // E1, C2, G1, A1

    /** Generate the full looping PCM buffer. */
    fun generateLoop(): ShortArray {
        val buf = ShortArray(LOOP_SAMPLES)

        for (i in 0 until LOOP_SAMPLES) {
            val t = i.toFloat() / SAMPLE_RATE
            val beat = (i.toFloat() / BEAT_SAMPLES)
            val barIndex = (beat / 4).toInt().coerceAtMost(3)
            val beatInBar = beat % 4
            val eighthNote = (beat * 2).toInt() % 4  // 0,1,2,3 per bar (8th notes)

            // ── Kick drum on beats 1 & 3 ──────────────────────────
            val kick = when ((beatInBar + 0.5f).toInt() % 4) {
                0, 2 -> synthKick(t, i, beatInBar)
                else -> 0f
            }

            // ── Hi-hat on every 8th note ──────────────────────────
            val hat = synthHat(i, eighthNote)

            // ── Sub bass ──────────────────────────────────────────
            val bassFreq = BASS_NOTES[barIndex]
            val bass = synthBass(bassFreq, t, i, beatInBar)

            // ── Pad chord ─────────────────────────────────────────
            val chord = CHORDS[barIndex]
            val pad = synthPad(chord, t, i, beatInBar)

            // ── Arpeggio (every 16th note) ────────────────────────
            val arp = synthArp(chord, t, i, beatInBar)

            // Mix: kick is prominent, bass supports, pad is warm, arp is subtle
            val sample = (kick * 0.35f + hat * 0.12f + bass * 0.25f + pad * 0.20f + arp * 0.08f)

            buf[i] = (sample * MAX_AMP * Short.MAX_VALUE)
                .toInt()
                .coerceIn(Short.MIN_VALUE.toInt(), Short.MAX_VALUE.toInt())
                .toShort()
        }

        return buf
    }

    // ── Synth helpers ─────────────────────────────────────────────

    private fun synthKick(t: Float, sampleIdx: Int, beatInBar: Float): Float {
        val beatStart = (beatInBar.toInt()).toFloat()
        val localT = t - beatStart * BEAT_DURATION_S
        if (localT > 0.12f) return 0f

        val env = (-localT / 0.12f + 1f).pow(1.5f)
        val freq = 150f - localT * 800f  // pitch sweep down 150→50 Hz
        val tone = sin(2f * PI * freq.coerceAtLeast(30f) * localT).toFloat() * 0.6f

        // Sub click at attack
        val click = sin(2f * PI * 3000f * localT).toFloat() * (-localT * 20f + 1f).coerceAtLeast(0f) * 0.3f

        return (tone + click) * env
    }

    private fun synthHat(i: Int, eighthNote: Int): Float {
        // 8th note timing — hit at the start of each 8th note
        val eighthSamples = BEAT_SAMPLES / 2
        val localI = i % eighthSamples
        val progress = localI.toFloat() / eighthSamples
        if (progress > 0.06f) return 0f

        val env = (-progress / 0.06f + 1f).pow(2f)
        val noise = (kotlin.random.Random.Default.nextFloat() * 2f - 1f) * 0.5f
        return noise * env
    }

    private fun synthBass(freq: Float, t: Float, i: Int, beatInBar: Float): Float {
        val localT = t % BEAT_DURATION_S
        // Gentle attack per note
        val env = ((-localT / 0.05f + 1f).coerceIn(0f, 1f)) * 0.8f + 0.2f

        val sine  = sin(2f * PI * freq * t).toFloat()
        val sub   = sin(2f * PI * freq * 0.5f * t).toFloat() * 0.3f

        // Slight triangle wave character
        val tri = (2f * abs(freq * t % 1f - 0.5f) - 0.5f) * 0.2f

        return (sine * 0.5f + sub * 0.3f + tri) * env
    }

    private fun synthPad(chord: List<Float>, t: Float, i: Int, beatInBar: Float): Float {
        // Slow attack pad
        val localT = t % (BEAT_DURATION_S * 4f)
        val env = (localT / 0.5f).coerceIn(0f, 1f) * 0.5f + 0.3f

        var sum = 0f
        for (note in chord) {
            sum += sin(2f * PI * note * t).toFloat()
            // Add soft 5th above
            sum += sin(2f * PI * (note + 7f) * t).toFloat() * 0.4f
        }

        // Light low-pass: average over 4 samples (crude but effective)
        val avg = sum / (chord.size * 1.4f)

        return avg * env
    }

    private fun synthArp(chord: List<Float>, t: Float, i: Int, beatInBar: Float): Float {
        // 16th note arpeggio
        val sixteenthSamples = BEAT_SAMPLES / 4
        val localI = i % sixteenthSamples
        val noteIdx = ((i / sixteenthSamples) % chord.size)

        val progress = localI.toFloat() / sixteenthSamples
        if (progress > 0.3f) return 0f

        val env = (-progress / 0.3f + 1f).pow(2f)

        // Slightly detuned for warmth
        val freq = chord[noteIdx] + 12f  // one octave up
        val tone = sin(2f * PI * freq * t).toFloat() * 0.3f
        val h2   = sin(2f * PI * freq * 2f * t).toFloat() * 0.1f

        return (tone + h2) * env
    }

    private fun abs(x: Float): Float = if (x < 0f) -x else x
}
