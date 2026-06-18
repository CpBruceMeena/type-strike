package com.typestrike.ui.util

import android.content.Context
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.view.HapticFeedbackConstants
import android.view.View

/**
 * Haptic feedback patterns for all type-strike game events.
 *
 * Maps to the spec from android-ui-evaluation-2026-06-17.md:
 *   Correct keystroke   → KEYBOARD_TAP        (single short tick)
 *   Incorrect keystroke → REJECTION           (double buzz)
 *   Word complete       → CLOCK_TICK × 3      (rapid triple tick)
 *   Combo milestone     → custom 100/50/200ms (two-stage pulse)
 *   Trophy slam         → custom 300ms heavy  (long heavy thud)
 *   Level failed        → custom 200ms heavy  (single buzz)
 */
object HapticUtil {

    /**
     * Light, short tick — for a correct keystroke.
     * Uses View.performHapticFeedback for the most natural feel.
     */
    fun keyPress(view: View) {
        view.performHapticFeedback(
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R)
                HapticFeedbackConstants.KEYBOARD_TAP
            else
                HapticFeedbackConstants.KEYBOARD_PRESS  // deprecated but works pre-30
        )
    }

    /**
     * Double buzz / rejection — for an incorrect keystroke.
     * Uses custom short-double-buzz pattern (2× 50ms pulses).
     */
    fun keyError(view: View) {
        vibrateCustom(view.context, longArrayOf(0, 50, 30, 50), -1)
    }

    /**
     * Rapid triple pulse — for word completion / shatter.
     */
    fun wordComplete(view: View) {
        vibrateCustom(view.context, longArrayOf(0, 30, 40, 30, 40, 30), -1)
    }

    /**
     * Two-stage pulse — for combo milestone (e.g. "CRITICAL COMBO!").
     * Pattern: 100ms vibration → 50ms pause → 200ms vibration.
     */
    fun comboMilestone(view: View) {
        vibrateCustom(view.context, longArrayOf(0, 100, 50, 200), -1)
    }

    /**
     * Long heavy thud — for trophy slam on Victory screen.
     * Single 300ms blast.
     */
    fun trophySlam(view: View) {
        vibrateCustom(view.context, longArrayOf(0, 300), -1)
    }

    /**
     * Single heavy buzz — for level failure.
     * 200ms.
     */
    fun levelFailed(view: View) {
        vibrateCustom(view.context, longArrayOf(0, 200), -1)
    }

    // ── Custom Vibration Helpers ─────────────────────────

    /**
     * Fires a custom vibration pattern using the Vibrator system service.
     *
     * @param pattern  [longArray] — vibration on/off in milliseconds.
     *                 First value is delay before start (usually 0).
     *                 Example: [0, 100, 50, 200] = start, 100ms on, 50ms off, 200ms on.
     * @param repeat   Index to repeat from, or -1 for one-shot.
     */
    private fun vibrateCustom(context: Context, pattern: LongArray, repeat: Int) {
        val vibrator = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            val vm = context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as? VibratorManager
            vm?.defaultVibrator
        } else {
            @Suppress("DEPRECATION")
            context.getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
        }

        if (vibrator != null && vibrator.hasVibrator()) {
            val effect = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                VibrationEffect.createWaveform(pattern, repeat)
            } else {
                @Suppress("DEPRECATION")
                null
            }
            if (effect != null) {
                vibrator.vibrate(effect)
            } else {
                @Suppress("DEPRECATION")
                vibrator.vibrate(pattern, repeat)
            }
        }
    }
}
