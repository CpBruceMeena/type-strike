package com.typestrike.ui.effects

import androidx.compose.foundation.Canvas
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.foundation.layout.fillMaxSize
import com.typestrike.ui.theme.*
import kotlinx.coroutines.isActive

import kotlin.math.sin
import kotlin.random.Random

// ── Particle Config & Quality Tiers ─────────────────────

enum class ParticleQuality {
    LOW,
    MEDIUM,
    HIGH,
    ULTRA
}

/**
 * Fine-grained configuration for all particle effects.
 * Each [ParticleQuality] preset maps to one of these.
 */
data class ParticleConfig(
    /** Number of background floating particles */
    val particleCount: Int,
    /** Multiplier for particle drift speed (1.0 = normal) */
    val speedMultiplier: Float,
    /** Whether to render glow halos around particles */
    val glowEnabled: Boolean,
    /** Master opacity of the particle field */
    val opacity: Float,
    /** Min/max particle size in px */
    val minSize: Float,
    val maxSize: Float,
    /** Whether orbiting particles appear around nodes */
    val orbitParticlesEnabled: Boolean,
    /** Whether completion sparkle bursts appear */
    val sparkleEnabled: Boolean,
    /** Number of burst particles on tier transition */
    val burstParticleCount: Int
) {
    companion object {
        val LOW = ParticleConfig(
            particleCount = 15,
            speedMultiplier = 0.6f,
            glowEnabled = false,
            opacity = 0.35f,
            minSize = 1f,
            maxSize = 2.5f,
            orbitParticlesEnabled = false,
            sparkleEnabled = false,
            burstParticleCount = 4
        )

        val MEDIUM = ParticleConfig(
            particleCount = 30,
            speedMultiplier = 0.8f,
            glowEnabled = true,
            opacity = 0.55f,
            minSize = 1f,
            maxSize = 3.5f,
            orbitParticlesEnabled = true,
            sparkleEnabled = false,
            burstParticleCount = 8
        )

        val HIGH = ParticleConfig(
            particleCount = 45,
            speedMultiplier = 1.0f,
            glowEnabled = true,
            opacity = 0.7f,
            minSize = 1f,
            maxSize = 5f,
            orbitParticlesEnabled = true,
            sparkleEnabled = true,
            burstParticleCount = 12
        )

        val ULTRA = ParticleConfig(
            particleCount = 60,
            speedMultiplier = 1.3f,
            glowEnabled = true,
            opacity = 0.85f,
            minSize = 1f,
            maxSize = 6f,
            orbitParticlesEnabled = true,
            sparkleEnabled = true,
            burstParticleCount = 18
        )

        /** Map quality → config */
        fun fromQuality(quality: ParticleQuality): ParticleConfig = when (quality) {
            ParticleQuality.LOW -> LOW
            ParticleQuality.MEDIUM -> MEDIUM
            ParticleQuality.HIGH -> HIGH
            ParticleQuality.ULTRA -> ULTRA
        }

        /**
         * Auto-detect the best quality tier based on device CPU capabilities.
         * Uses only lightweight, non-blocking heuristics (no I/O).
         * Higher-core devices get higher quality tiers.
         */
        fun detect(): ParticleQuality {
            val cpuCores = Runtime.getRuntime().availableProcessors()

            return when {
                cpuCores >= 8 -> ParticleQuality.ULTRA
                cpuCores >= 6 -> ParticleQuality.HIGH
                cpuCores >= 4 -> ParticleQuality.MEDIUM
                else -> ParticleQuality.LOW
            }
        }
    }
}

// ── Particle Data ────────────────────────────────────────

data class MapParticle(
    var x: Float,
    var y: Float,
    var velX: Float,
    var velY: Float,
    var size: Float,
    var alpha: Float,
    var phase: Float,
    val color: Color
)

// ── Particle Field Composable ────────────────────────────

/**
 * A configurable animated particle background effect.
 * Renders floating, drifting particles with optional glow halos and breathing alpha.
 * Automatically wraps particles when they exit the screen for continuous flow.
 */
@Composable
fun MapParticleField(
    config: ParticleConfig = ParticleConfig.HIGH,
    modifier: Modifier = Modifier
) {
    val particles = remember(config) {
        List(config.particleCount) {
            val sizeRange = config.maxSize - config.minSize
            MapParticle(
                x = Random.nextFloat(),
                y = Random.nextFloat(),
                velX = (Random.nextFloat() - 0.5f) * 0.4f * config.speedMultiplier,
                velY = -(0.15f + Random.nextFloat() * 0.5f) * config.speedMultiplier,
                size = config.minSize + Random.nextFloat() * sizeRange,
                alpha = 0.08f + Random.nextFloat() * 0.25f,
                phase = Random.nextFloat() * 6.28f,
                color = when (Random.nextInt(4)) {
                    0 -> MagmaRed
                    1 -> MoltenGold
                    2 -> NeonPurple
                    else -> MagmaRedDark
                }
            )
        }
    }

    // Time driver for continuous animation
    var animTime by remember { mutableStateOf(0f) }
    LaunchedEffect(Unit) {
        var lastNanos = 0L
        while (isActive) {
            withFrameNanos { nanos ->
                if (lastNanos != 0L) {
                    animTime += (nanos - lastNanos) / 1_000_000_000f
                }
                lastNanos = nanos
            }
        }
    }

    // speedMultiplier is applied to particle velocity at creation time (above)
    // so the animation loop runs at normal time — no double-scaling

    Canvas(modifier = modifier.fillMaxSize().alpha(config.opacity)) {
        val w = size.width
        val h = size.height
        val dt = animTime

        particles.forEach { p ->
            // Drift motion
            p.x += p.velX * dt * 0.3f
            p.y += p.velY * dt * 0.3f

            // Gentle horizontal sway
            val sway = sin(dt * 0.5f + p.phase) * 0.3f

            // Alpha oscillation
            val breathAlpha = p.alpha * (0.6f + 0.4f * sin(dt * 0.8f + p.phase))

            // Reset when off screen
            if (p.y < -0.05f) {
                p.y = 1.05f
                p.x = Random.nextFloat()
            }
            if (p.x < -0.1f) p.x = 1.1f
            if (p.x > 1.1f) p.x = -0.1f

            // Draw
            val px = (p.x + sway * 0.02f) * w
            val py = p.y * h
            val radius = p.size * (1f + 0.3f * sin(dt * 1.2f + p.phase))

            // Glow halo (only when enabled)
            if (config.glowEnabled) {
                drawCircle(
                    color = p.color.copy(alpha = breathAlpha * 0.3f),
                    radius = radius * 3f,
                    center = Offset(px, py)
                )
            }

            // Core
            drawCircle(
                color = p.color.copy(alpha = breathAlpha),
                radius = radius,
                center = Offset(px, py)
            )
        }
    }
}
