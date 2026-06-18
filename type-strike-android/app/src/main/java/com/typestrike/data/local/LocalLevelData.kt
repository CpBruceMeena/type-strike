package com.typestrike.data.local

import com.typestrike.data.model.LevelDetail
import kotlin.random.Random

/**
 * Mirrors the Go backend's paragraph-based level generation
 * (backend/internal/data/levels.go) so the Android app has a complete local fallback.
 *
 * Each level has a paragraph of increasing complexity:
 * - Ember (1-25): simple lowercase sentences, basic punctuation
 * - Igneous (26-50): medium sentences, capitalization, some numbers
 * - Magma Core (51-75): complex with numbers, special chars, mixed case
 * - Obsidian (76-100): expert with special characters, formats, code-style text
 */
object LocalLevelData {

    // ── Level Names (matching Go backend) — must be before TIERS ──

    private val EMBER_NAMES = listOf(
        "First Light", "Kindle", "Spark", "Flame", "Blaze",
        "Inferno", "Magma's Edge", "Lava Tunnel", "Core Access", "The Crucible",
        "Firestorm", "Wildfire", "Cinder", "Torch", "Pyre",
        "Bonfire", "Ember Glow", "Heat Wave", "Scald", "Burnout",
        "Flashover", "Firelight", "Warmth", "Flicker", "Combustion"
    )

    private val IGNEOUS_NAMES = listOf(
        "Basalt", "Granite", "Pumice", "Obsidian Shard", "Rhyolite",
        "Andesite", "Diorite", "Gabbro", "Pegmatite", "Scoria",
        "Tuff", "Volcanic Ash", "Lava Flow", "Magma Chamber", "Plume",
        "Geode", "Crystal Cavern", "Molten Core", "Sinter", "Fumarole",
        "Hot Spring", "Geyser", "Caldera", "Vent", "Eruption"
    )

    private val MAGMA_CORE_NAMES = listOf(
        "Subterranean", "Abyssal", "Infernal Depths", "Plasma Field", "Solar Flare",
        "Thermal Vent", "Nucleus", "Fusion Core", "Reactor", "Meltdown",
        "Overload", "Surge", "Singularity", "Nova", "Supernova",
        "Quasar", "Pulsar", "Heliopause", "Event Horizon", "Solar Wind",
        "Corona", "Prominence", "Chromosphere", "Photosphere", "Radiant"
    )

    private val OBSIDIAN_NAMES = listOf(
        "Void Walker", "Dark Matter", "Black Ice", "Obsidian Throne", "Shadow Strike",
        "Neon Night", "Digital Abyss", "Cyber Core", "Neural Storm", "Quantum Leap",
        "Zenith", "Apex", "Pinnacle", "Omega", "Absolute Zero",
        "Speed of Light", "Last Stand", "Final Forge", "Unstoppable", "Godspeed",
        "Perfection", "Immortal", "Transcendence", "Eternal Flame", "Type-Strike"
    )

    // Extensible pool for levels 101+. Add more names here to create more levels!
    private val BEYOND_NAMES = listOf(
        "New Dawn", "Solar Ignition", "Plasma Surge", "Infinite Loop", "Recursion",
        "Deep Core", "Mantle Shift", "Crust Break", "Lava Rise", "Volcanic Winter",
        "Phoenix", "Rebirth", "Second Wind", "Afterglow", "Supernova Remnant",
        "Neutron Star", "Pulsar Wave", "Gamma Burst", "Cosmic Dust", "Stellar Wind",
        "Nebula", "Protostar", "Red Giant", "White Dwarf", "Black Hole",
        "Event Horizon", "Singularity", "Wormhole", "Dark Energy", "Antimatter",
        "Quantum Entanglement", "String Theory", "Dark Flow", "Cosmic Ray", "Solar Wind II",
        "The Final Spark", "Ember's Return", "Infinite Forge", "The Last Keycap", "God Mode",
    )

    private data class TierConfig(
        val name: String,
        val levelNames: List<String>,
        val startId: Int,
        val endId: Int,
        val difficulty: Int,
        val passWpmRange: IntRange,
        val passAccRange: IntRange
    )

    private val TIERS = listOf(
        TierConfig("ember", EMBER_NAMES, 1, 25, 1, 30..40, 85..88),
        TierConfig("igneious", IGNEOUS_NAMES, 26, 50, 2, 40..55, 88..92),
        TierConfig("magma_core", MAGMA_CORE_NAMES, 51, 75, 3, 55..70, 90..93),
        TierConfig("obsidian", OBSIDIAN_NAMES, 76, 100, 4, 70..85, 92..95),
    )

    // ── Word pools for generating paragraph text ────────────

    private val BASIC_SUBJECTS = listOf("the fire", "a spark", "the flame", "magma", "the forge", "heat", "the core", "steel", "the blade", "fury")
    private val BASIC_VERBS = listOf("burns", "glows", "rises", "flows", "forges", "strikes", "cracks", "shines", "blazes", "surges")
    private val BASIC_OBJECTS = listOf("the stone", "the anvil", "the mountain", "the sky", "the ground", "the dark", "the light", "the path", "the wall", "the gate")
    private val BASIC_ADJS = listOf("hot", "bright", "strong", "deep", "hard", "fast", "cold", "dark", "warm", "pure")
    private val BASIC_ADVS = listOf("slowly", "quickly", "deeply", "brightly", "boldly", "silently", "fiercely", "steadily", "swiftly", "calmly")

    private val ADV_SUBJECTS = listOf("the obsidian throne", "every warrior", "the ancient forge", "crystal caverns", "the molten core", "neural storms", "digital abyss", "quantum flux", "void walkers", "solar flares")
    private val ADV_VERBS = listOf("shatters", "transforms", "illuminates", "crystallizes", "accelerates", "overloads", "synchronizes", "detonates", "penetrates", "calibrates")
    private val ADV_OBJECTS = listOf("the event horizon", "every particle", "the singularity", "dark matter", "the plasma field", "neural networks", "cyber cores", "fusion reactors", "quantum states", "star systems")
    private val ADV_ADJS = listOf("unrelenting", "magnificent", "primordial", "incandescent", "unstoppable", "immortal", "transcendent", "infinite", "absolute", "radiant")
    private val ADV_ADVS = listOf("relentlessly", "magnificently", "inevitably", "instantaneously", "unconditionally", "exponentially", "systematically", "cataclysmically", "permanently", "definitively")

    private fun pick(list: List<String>, rng: Random): String = list[rng.nextInt(list.size)]

    private fun genParagraph(levelId: Int, rng: Random): String {
        // Paragraph length scales smoothly with level number.
        // Level 1 -> 2 sentences, Level 50 -> 4 sentences, Level 100 -> 6 sentences.
        // Formula: 2 + (levelId * 4 / 100), clamped to 2..6.
        val sentenceCount = (2 + (levelId * 4 / 100)).coerceIn(2, 6)

        val subjects: List<String>
        val verbs: List<String>
        val objects: List<String>
        val adjs: List<String>
        val advs: List<String>

        if (levelId > 50) {
            subjects = ADV_SUBJECTS; verbs = ADV_VERBS; objects = ADV_OBJECTS; adjs = ADV_ADJS; advs = ADV_ADVS
        } else if (levelId > 25) {
            subjects = BASIC_SUBJECTS + ADV_SUBJECTS; verbs = BASIC_VERBS + ADV_VERBS
            objects = BASIC_OBJECTS + ADV_OBJECTS; adjs = BASIC_ADJS + ADV_ADJS; advs = BASIC_ADVS + ADV_ADVS
        } else {
            subjects = BASIC_SUBJECTS; verbs = BASIC_VERBS; objects = BASIC_OBJECTS; adjs = BASIC_ADJS; advs = BASIC_ADVS
        }

        // Sentence structure generators
        val structures: List<() -> String> = listOf(
            { "${pick(subjects, rng)} ${pick(verbs, rng)} ${pick(advs, rng)}." },
            { "the ${pick(adjs, rng)} ${pick(subjects, rng)} ${pick(verbs, rng)} ${pick(objects, rng)}." },
            { "${pick(adjs, rng)} in ${pick(objects, rng)}, ${pick(subjects, rng)} ${pick(verbs, rng)}." },
            { "${pick(subjects, rng)} ${pick(verbs, rng)} ${pick(objects, rng)} ${pick(advs, rng)}." },
            { "the ${pick(adjs, rng)} ${pick(subjects, rng)} ${pick(verbs, rng)} and ${pick(subjects, rng)} ${pick(verbs, rng)}." },
        )

        val advancedStructures: List<() -> String> = listOf(
            { "when ${pick(subjects, rng)} ${pick(verbs, rng)}, ${pick(subjects, rng)} ${pick(verbs, rng)}." },
            { "the more ${pick(subjects, rng)} ${pick(verbs, rng)}, the more ${pick(subjects, rng)} ${pick(verbs, rng)}." },
            { "${pick(adjs, rng)} and ${pick(adjs, rng)}, ${pick(subjects, rng)} ${pick(verbs, rng)} ${pick(advs, rng)}." },
        )

        val sentences = mutableListOf<String>()

        when {
            levelId <= 25 -> {
                // Simple: lowercase, basic punctuation
                repeat(sentenceCount) {
                    sentences.add(structures[rng.nextInt(structures.size)]())
                }
            }
            levelId <= 50 -> {
                // Medium: capitalize first letter, some numbers
                repeat(sentenceCount) {
                    val s = if (rng.nextFloat() < 0.4f) advancedStructures[rng.nextInt(advancedStructures.size)]()
                        else structures[rng.nextInt(structures.size)]()
                    val cap = s.replaceFirstChar { it.uppercase() }
                    sentences.add(
                        if (rng.nextFloat() < 0.2f) cap.trimEnd('.') + " ${rng.nextInt(100)}."
                        else cap
                    )
                }
            }
            levelId <= 75 -> {
                // Complex: advanced structures, numbers, special chars
                repeat(sentenceCount) {
                    val s = advancedStructures[rng.nextInt(advancedStructures.size)]()
                    val cap = s.replaceFirstChar { it.uppercase() }
                    val withNum = when (rng.nextInt(3)) {
                        0 -> cap.trimEnd('.') + " (${rng.nextInt(100) + 1}%)"
                        1 -> cap.trimEnd('.') + " at ${rng.nextInt(10) + 1}x speed!"
                        else -> cap
                    }
                    sentences.add(
                        if (rng.nextFloat() < 0.3f) withNum.trimEnd('.') + "!"
                        else withNum
                    )
                }
            }
            else -> {
                // Expert: full complexity, special chars, mixed case, code-like
                repeat(sentenceCount) {
                    val base = advancedStructures[rng.nextInt(advancedStructures.size)]()
                        .replaceFirstChar { it.uppercase() }
                    val formatted = when (rng.nextInt(5)) {
                        0 -> "\"${base.trimEnd('.')}\" - level ${levelId + 1} requires ${60 + rng.nextInt(40)}wpm at ${90 + rng.nextInt(10)}% acc."
                        1 -> "${base.trimEnd('.')} \$${rng.nextInt(1000)}.${rng.nextInt(100)} value @${50 + rng.nextInt(50)}% threshold."
                        2 -> "type_strike_${pick(adjs, rng)} => ${base.trimEnd('.')} (err#${rng.nextInt(5)})."
                        3 -> "${base.trimEnd('.')} [REQ: ${70 + rng.nextInt(30)} WPM | ACC: ${93 + rng.nextInt(7)}%]"
                        4 -> "${base.trimEnd('.')} - precision++ && speed++ @ 100%!"
                        else -> base
                    }
                    sentences.add(formatted)
                }
            }
        }

        return sentences.joinToString(" ")
    }

    /** All pre-generated levels (first 100). */
    val allLevels: List<LevelDetail> by lazy { generateAllLevels() }

    /** Returns a specific level by ID (1-indexed). */
    fun getLevel(id: Int): LevelDetail? {
        if (id < 1) return null
        if (id <= allLevels.size) {
            return allLevels.getOrNull(id - 1)
        }
        // Dynamically generate levels beyond the pre-generated 100
        return generateDynamicLevel(id)
    }

    /** Dynamic name generator for levels beyond the BEYOND_NAMES pool. */
    private fun genBeyondName(levelId: Int): String {
        val adj = listOf("Ultimate", "Infinite", "Luminous", "Radiant", "Eternal", "Arcane", "Mythic", "Astral", "Void", "Omega")
        val nouns = listOf("Strike", "Forge", "Flame", "Core", "Storm", "Fury", "Blade", "Spark", "Star", "Gate")
        val rng = Random(levelId.toLong())
        return "${adj[rng.nextInt(adj.size)]} ${nouns[rng.nextInt(nouns.size)]} — $levelId"
    }

    /** Dynamically generates a level config for IDs > 100. */
    private fun generateDynamicLevel(id: Int): LevelDetail {
        val rng = Random(id.toLong() * 1000 + 42)
        val paragraph = genParagraph(id, rng)

        // Scale difficulty: WPM starts at 85 and increases by ~3 per 10 levels
        val baseWpm = (85 + (id - 100) / 10 * 3).coerceAtMost(200)
        val baseAcc = if (id > 150) 96 else 95

        // Name from beyond pool or auto-generated
        val poolIdx = id - 101
        val name = if (poolIdx in BEYOND_NAMES.indices) BEYOND_NAMES[poolIdx] else genBeyondName(id)

        return LevelDetail(
            id = id,
            name = name,
            tier = "beyond",
            difficulty = 5,
            passWpm = baseWpm,
            passAccuracy = baseAcc,
            paragraph = paragraph
        )
    }

    private fun generateAllLevels(): List<LevelDetail> {
        val results = mutableListOf<LevelDetail>()

        for (tier in TIERS) {
            val tierSize = tier.endId - tier.startId
            val rng = Random(tier.startId.toLong() * 1000 + tier.endId.toLong())
            for (i in tier.startId..tier.endId) {
                val idx = i - tier.startId
                val progress = if (tierSize > 0) idx.toFloat() / tierSize else 0f

                val wpm = tier.passWpmRange.first +
                        (progress * (tier.passWpmRange.last - tier.passWpmRange.first)).toInt()
                val acc = tier.passAccRange.first +
                        (progress * (tier.passAccRange.last - tier.passAccRange.first)).toInt()

                results.add(
                    LevelDetail(
                        id = i,
                        name = tier.levelNames[idx],
                        tier = tier.name,
                        difficulty = tier.difficulty,
                        passWpm = wpm,
                        passAccuracy = acc,
                        paragraph = genParagraph(i, rng),
                        playerBestWpm = null,
                        playerBestAcc = null,
                        playerStars = null
                    )
                )
            }
        }

        return results
    }
}
