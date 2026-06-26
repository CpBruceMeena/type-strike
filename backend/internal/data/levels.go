package data

import (
	"fmt"
	"math/rand"
	"strings"

	"github.com/cpbrucemeena/type-strike-backend/internal/models"
)

// LevelConfig holds the static configuration for a single level.
type LevelConfig struct {
	ID           int    `json:"id"`
	Name         string `json:"name"`
	Tier         string `json:"tier"`
	Difficulty   int    `json:"difficulty"`
	PassWPM      int    `json:"pass_wpm"`
	PassAccuracy int    `json:"pass_accuracy"`
	Paragraph    string `json:"paragraph"`
}

// LevelConfigs is the full catalog of all 100 levels.
var LevelConfigs []LevelConfig

func init() {
	LevelConfigs = generateLevels()
}

// GetLevel returns the config for a specific level ID (1-indexed).
// Uses deterministic paragraph generation so the same level always returns
// the same paragraph — ensuring map preview matches gameplay content.
// Levels beyond 100 are generated dynamically with auto-generated names.
func GetLevel(id int) *LevelConfig {
	if id < 1 {
		return nil
	}
	if id <= len(LevelConfigs) {
		base := LevelConfigs[id-1]
		return &LevelConfig{
			ID:           base.ID,
			Name:         base.Name,
			Tier:         base.Tier,
			Difficulty:   base.Difficulty,
			PassWPM:      base.PassWPM,
			PassAccuracy: base.PassAccuracy,
			Paragraph:    base.Paragraph,
		}
	}
	// Dynamically generate level for IDs beyond the existing catalog.
	return generateDynamicLevel(id)
}

// generateDynamicLevel creates a level config on-the-fly for IDs > 100.
// Uses the "beyond" tier with difficulty and WPM/accuracy scaling.
// Paragraph is randomly generated each time the level is fetched.
func generateDynamicLevel(id int) *LevelConfig {
	paragraph := genParagraph(id)

	// Scale difficulty gradually beyond level 100:
	// WPM: starts at 85 (end of Obsidian) and increases by ~3 per 10 levels
	// Accuracy: stays at 95%
	baseWPM := 85 + (id-100)/10*3
	if baseWPM > 200 {
		baseWPM = 200
	}
	baseAcc := 95
	if id > 150 {
		baseAcc = 96
	}

	// Generate a name
	name := genBeyondName(id)

	// Use the first few beyond names for the "beyond" pool, then auto-generate
	poolIdx := id - 101
	if poolIdx >= 0 && poolIdx < len(beyondNames) {
		name = beyondNames[poolIdx]
	}

	return &LevelConfig{
		ID:           id,
		Name:         name,
		Tier:         TierBeyond,
		Difficulty:   5,
		PassWPM:      baseWPM,
		PassAccuracy: baseAcc,
		Paragraph:    paragraph,
	}
}

// GetLevelsForTier returns all level configs for a given tier.
func GetLevelsForTier(tier string) []LevelConfig {
	var result []LevelConfig
	for _, l := range LevelConfigs {
		if l.Tier == tier {
			result = append(result, l)
		}
	}
	return result
}

// ToLevelDetail converts a config + optional player progress into a LevelDetail response.
func (c *LevelConfig) ToLevelDetail(progress *models.LevelProgress) models.LevelDetail {
	detail := models.LevelDetail{
		ID:           c.ID,
		Name:         c.Name,
		Tier:         c.Tier,
		Difficulty:   c.Difficulty,
		PassWPM:      c.PassWPM,
		PassAccuracy: c.PassAccuracy,
		Paragraph:    c.Paragraph,
	}
	if progress != nil {
		detail.PlayerBestWPM = &progress.BestWPM
		detail.PlayerBestAcc = &progress.BestAccuracy
		detail.PlayerStars = &progress.Stars
	}
	return detail
}

// Tier names, icons, and level ranges
const (
	TierEmber     = "ember"
	TierIgneous   = "igneious"
	TierMagmaCore = "magma_core"
	TierObsidian  = "obsidian"
	TierBeyond    = "beyond"
)

var tierRange = map[string][2]int{
	TierEmber:     {1, 25},
	TierIgneous:   {26, 50},
	TierMagmaCore: {51, 75},
	TierObsidian:  {76, 100},
	TierBeyond:    {101, -1}, // -1 means unlimited — levels are generated dynamically
}

var emberNames = []string{
	"First Light", "Kindle", "Spark", "Flame", "Blaze",
	"Inferno", "Magma's Edge", "Lava Tunnel", "Core Access", "The Crucible",
	"Firestorm", "Wildfire", "Cinder", "Torch", "Pyre",
	"Bonfire", "Ember Glow", "Heat Wave", "Scald", "Burnout",
	"Flashover", "Firelight", "Warmth", "Flicker", "Combustion",
}

var igneousNames = []string{
	"Basalt", "Granite", "Pumice", "Obsidian Shard", "Rhyolite",
	"Andesite", "Diorite", "Gabbro", "Pegmatite", "Scoria",
	"Tuff", "Volcanic Ash", "Lava Flow", "Magma Chamber", "Plume",
	"Geode", "Crystal Cavern", "Molten Core", "Sinter", "Fumarole",
	"Hot Spring", "Geyser", "Caldera", "Vent", "Eruption",
}

var magmaCoreNames = []string{
	"Subterranean", "Abyssal", "Infernal Depths", "Plasma Field", "Solar Flare",
	"Thermal Vent", "Nucleus", "Fusion Core", "Reactor", "Meltdown",
	"Overload", "Surge", "Singularity", "Nova", "Supernova",
	"Quasar", "Pulsar", "Heliopause", "Event Horizon", "Solar Wind",
	"Corona", "Prominence", "Chromosphere", "Photosphere", "Radiant",
}

var obsidianNames = []string{
	"Void Walker", "Dark Matter", "Black Ice", "Obsidian Throne", "Shadow Strike",
	"Neon Night", "Digital Abyss", "Cyber Core", "Neural Storm", "Quantum Leap",
	"Zenith", "Apex", "Pinnacle", "Omega", "Absolute Zero",
	"Speed of Light", "Last Stand", "Final Forge", "Unstoppable", "Godspeed",
	"Perfection", "Immortal", "Transcendence", "Eternal Flame", "Type-Strike",
}

// beyondNames is an extensible pool for levels 101+.
// Add new names here to create more levels!
var beyondNames = []string{
	"New Dawn", "Solar Ignition", "Plasma Surge", "Infinite Loop", "Recursion",
	"Deep Core", "Mantle Shift", "Crust Break", "Lava Rise", "Volcanic Winter",
	"Phoenix", "Rebirth", "Second Wind", "Afterglow", "Supernova Remnant",
	"Neutron Star", "Pulsar Wave", "Gamma Burst", "Cosmic Dust", "Stellar Wind",
	"Nebula", "Protostar", "Red Giant", "White Dwarf", "Black Hole",
	"Event Horizon", "Singularity", "Wormhole", "Dark Energy", "Antimatter",
	"Quantum Entanglement", "String Theory", "Dark Flow", "Cosmic Ray", "Solar Wind II",
	"The Final Spark", "Ember's Return", "Infinite Forge", "The Last Keycap", "God Mode",
}

// genBeyondName generates a name for levels beyond the beyondNames pool.
func genBeyondName(levelID int) string {
	adjectives := []string{"Ultimate", "Infinite", "Luminous", "Radiant", "Eternal", "Arcane", "Mythic", "Astral", "Void", "Omega"}
	nouns := []string{"Strike", "Forge", "Flame", "Core", "Storm", "Fury", "Blade", "Spark", "Star", "Gate"}
	seed := rand.New(rand.NewSource(int64(levelID)))
	a := adjectives[seed.Intn(len(adjectives))]
	n := nouns[seed.Intn(len(nouns))]
	return fmt.Sprintf("%s %s — %d", a, n, levelID)
}

// ── Meaningful Content Pools ─────────────────────────────

// Curated, meaningful paragraphs organized by category and difficulty.
// Each pool has content that makes sense and is interesting to type.

// Fun facts pool — short, interesting facts about science, history, technology
var funFacts = []string{
	"Honey never spoils. Archaeologists have found pots of honey in ancient Egyptian tombs that are over three thousand years old and still perfectly edible.",
	"Octopuses have three hearts. Two pump blood to the gills while the third pumps it to the rest of the body. The heart that pumps to the body actually stops when they swim.",
	"The human brain generates about twenty-three watts of electrical power when awake. That is enough to power a small light bulb and it never stops generating energy.",
	"Bananas are technically berries while strawberries are not. By botanical definition, a berry is a fruit produced from the ovary of a single flower with seeds embedded in the flesh.",
	"The longest recorded flight of a chicken is thirteen seconds. Contrary to popular belief, chickens can actually fly short distances when sufficiently motivated.",
	"A day on Venus is longer than a year on Venus. It takes Venus two hundred forty-three Earth days to rotate once on its axis but only two hundred twenty-five days to orbit the sun.",
	"The Eiffel Tower can be up to fifteen centimeters taller during summer due to thermal expansion of the iron as the metal heats up and expands.",
	"Wombat droppings are cube-shaped. This unique shape prevents them from rolling away, which helps mark their territory more effectively near burrow entrances.",
	"The world's largest desert is not the Sahara but Antarctica. A desert is defined by low precipitation, and Antarctica receives less than fifty millimeters of rain per year.",
	"A group of flamingos is called a flamboyance. These colorful birds get their pink color from the carotenoid pigments in the shrimp and algae they eat.",
	"The first computer programmer was Ada Lovelace who wrote the first algorithm intended for implementation on Charles Babbage's Analytical Engine in the eighteen forties.",
	"Honeybees can recognize human faces. Studies have shown that bees can be trained to recognize and remember human faces using the same configural processing that humans use.",
	"Mount Everest grows about four millimeters taller every year due to the ongoing collision of the Indian and Eurasian tectonic plates.",
	"The Internet weighs about the same as a strawberry. The electrons that make up the data flowing through the Internet have negligible mass but the total is estimated at fifty grams.",
	"There are more possible iterations of a game of chess than there are atoms in the observable universe. The exact number is approximately ten to the power of one hundred twenty.",
	"Cows have best friends and become stressed when separated from them. Studies show that their heart rates increase and they show signs of anxiety when isolated from companions.",
	"The shortest war in history was between Britain and Zanzibar on August twenty-seventh, eighteen ninety-six. Zanzibar surrendered after just thirty-eight minutes.",
	"Trees can communicate with each other through underground fungal networks called the Wood Wide Web. They share nutrients and send warning signals about pests through this system.",
	"The human stomach dissolves razor blades if swallowed. Stomach acid has a pH of around two which is strong enough to dissolve metal over time.",
	"Butterflies taste with their feet. Their taste sensors are located on their tarsi which are the lower parts of their legs, allowing them to taste food by landing on it.",
	"The Great Wall of China is not actually visible from space with the naked eye. This common myth was debunked by astronauts who confirmed that it blends in with the surrounding landscape.",
	"A single bolt of lightning contains enough energy to toast one hundred thousand slices of bread. The average lightning strike carries about five billion joules of energy.",
	"Polar bear skin is actually black, not white. Their translucent fur appears white because it scatters visible light, while their dark skin helps absorb heat from the sun.",
	"The world's oldest known living tree is over five thousand years old. Named Methuselah, this Great Basin bristlecone pine continues to grow in the White Mountains of California.",
	"Sharks have been roaming the oceans for over four hundred million years. That makes them older than dinosaurs, trees, and even the rings of Saturn.",
	"The average person will spend about six months of their life waiting for red lights to turn green. This adds up to roughly thirty days per decade spent at traffic signals.",
	"A cloud can weigh over a million pounds. Despite their fluffy appearance, a typical cumulus cloud contains enough water droplets to fill several Olympic-sized swimming pools.",
	"The human nose can detect over one trillion different scents. This far exceeds the capabilities of the human eye which can distinguish only about ten million colors.",
	"Koalas have fingerprints that are nearly identical to human fingerprints. Even under a microscope it is extremely difficult to distinguish between a koala and a human fingerprint.",
	"Sloths can hold their breath for up to forty minutes underwater. This remarkable ability helps them cross rivers and evade predators in the rainforest canopy.",
	"A jiffy is an actual unit of time. In physics a jiffy is defined as the time it takes for light to travel one centimeter in a vacuum which is approximately thirty-three point three picoseconds.",
	"The Andromeda Galaxy is on a collision course with the Milky Way. The two galaxies will merge in about four point five billion years forming a new galaxy often called Milkomeda.",
	"Cleopatra lived closer in time to the invention of the iPhone than to the construction of the Great Pyramid of Giza. The pyramids were already ancient when she was born.",
	"There is a species of jellyfish that is biologically immortal. Turritopsis dohrnii can revert its cells back to their earliest form achieving effective immortality.",
	"The bones of a newborn baby contain about three hundred bones. As the baby grows many of these bones fuse together until the adult skeleton contains only two hundred six bones.",
	"Octopuses have been observed using tools. They have been seen collecting coconut shells to use as portable shelters demonstrating advanced problem-solving abilities.",
	"The driest place on Earth is the Atacama Desert in Chile. Some weather stations there have never recorded a single drop of rain in history.",
	"A single teaspoon of neutron star material would weigh about ten million tons on Earth. Neutron stars are among the densest objects in the universe.",
	"The longest word in the English language has one hundred eighty-nine thousand letters. It is the chemical name for the largest known protein titin and takes about three hours to pronounce.",
	"An octopus has nine brains. One central brain controls the nervous system and each of its eight arms has its own mini brain allowing each arm to act independently.",
}

// Technology facts — interesting tech and computer science facts
var techFacts = []string{
	"The first computer virus was created in nineteen eighty three by a programmer named Rich Skrenta. It was called Elk Cloner and spread through floppy disks on Apple systems.",
	"CAPTCHA stands for Completely Automated Public Turing test to tell Computers and Humans Apart. It was invented at Carnegie Mellon University in the year two thousand.",
	"The first ever tweet was sent by Twitter founder Jack Dorsey on March twenty-first, two thousand six. It read just setting up my twttr.",
	"Google was originally called Backrub because the search engine used backlinks to determine page importance. It was later renamed Google a play on the mathematical term googol.",
	"The typical computer mouse weighs around one hundred grams. The first computer mouse invented by Doug Engelbart was made of wood and had only one button.",
	"The first ever website is still online. Created by Tim Berners-Lee in nineteen ninety one it runs on a NeXT computer at CERN and explains the World Wide Web project.",
	"There are over seven hundred thousand new pieces of malware created every single day. That adds up to more than two hundred fifty million new malicious programs each year.",
	"The first domain name ever registered was symbolics dot com on March fifteenth, nineteen eighty five. It belonged to a computer manufacturer in Massachusetts.",
	"The QWERTY keyboard layout was designed to slow typists down. Early mechanical typewriters would jam if keys were pressed too quickly, so the layout separated common letter pairs.",
	"The most expensive domain name ever sold was voice dot com for thirty million dollars. The second most expensive was sex dot com for thirteen million dollars.",
	"A single Google search uses about one thousand computers and takes about zero point two seconds to return results. It processes over forty thousand searches every second globally.",
	"The first ever hard disk drive was made by IBM in nineteen fifty six. It could store five megabytes of data and was the size of two large refrigerators combined.",
	"More than ninety percent of the world's currency is digital. Only about eight percent of all money in circulation exists as physical cash with the rest existing only on computer servers.",
	"The first email was sent by Ray Tomlinson in nineteen seventy one. He sent a message to himself across two computers sitting next to each other and it was something like QWERTYUIOP.",
	"Facebook's like button was originally going to be called the awesome button. Developers considered other options including interesting, cool, and amazing before settling on like.",
	"The most common password in the world is still one two three four five six. Despite decades of warnings about password security it remains unchanged as the most hacked credential.",
	"The first photograph uploaded to the Internet was of a band called Les Horribles Cernettes. It was uploaded in nineteen ninety two by Tim Berners-Lee's team at CERN.",
	"The term bug in computer programming dates back to eighteen forty seven. Ada Lovelace used it to describe a moth that got stuck in Harvard's Mark II computer causing a malfunction.",
	"Over six thousand new blogs are published every minute. WordPress users alone produce about seventy million new posts every month across various topics and industries.",
	"The PlayStation Two is the best selling video game console of all time with over one hundred fifty five million units sold worldwide since its launch in the year two thousand.",
	"The first gigabyte hard drive was released by IBM in nineteen eighty and weighed over five hundred pounds. It cost forty thousand dollars and could store just one gigabyte of data.",
	"The @ symbol used in email addresses is called an ampersat in formal terminology. Ray Tomlinson chose it because it was already on the keyboard and was rarely used in names.",
	"The first mobile phone call was made in nineteen seventy three by Motorola engineer Martin Cooper. He called his rival at Bell Labs to announce that he was speaking on a mobile phone.",
	"The Linux operating system powers over ninety percent of the world's supercomputers. It also runs most of the Internet including Google, Facebook, and Amazon servers.",
	"The first commercial text message was sent in nineteen ninety two. It read Merry Christmas and was sent from a computer to a mobile phone over the Vodafone network.",
	"A computer mouse named the first computer peripheral designed for a graphical user interface. Douglas Engelbart invented it in nineteen sixty four along with the first hypertext system.",
	"The largest DDoS attack in history peaked at over two terabytes per second. It targeted Google Cloud in twenty twenty two and lasted for over six months.",
	"The Java programming language was originally called Oak after an oak tree outside James Gosling's office. It was renamed Java after the coffee consumed by the development team.",
	"The first electronic computer ENIAC weighed over thirty tons and occupied about eighteen hundred square feet. It could perform about five thousand calculations per second.",
	"The Python programming language was named after the comedy group Monty Python. Creator Guido van Rossum wanted a name that was short unique and slightly mysterious.",
	"The first webcam was created at Cambridge University to monitor a coffee pot. Researchers needed to check if there was coffee available without leaving their desks.",
	"Samsung means three stars in Korean. The founder Lee Byung-chul chose the name to represent something big numerous and powerful like stars in the night sky.",
	"The first MP3 player was created by a South Korean company called SaeHan Information Systems in nineteen ninety seven. It could store about twelve songs.",
	"The longest Wi-Fi signal ever achieved was over three hundred eighty kilometers. It connected two mountain peaks in Venezuela using directional antennas and clear line of sight.",
	"The Python programming language was first released in nineteen ninety one. Its philosophy emphasizes code readability and the use of significant whitespace rather than curly braces.",
}

// Short stories — tiny narrative excerpts
var shortStories = []string{
	"The old lighthouse keeper had tended the flame for forty years. Every night he climbed the spiral stairs and lit the lamp that guided ships safely to harbor through storm and calm alike.",
	"She found the key under the flower pot exactly where her grandmother had said it would be. The rusty lock groaned in protest but the chest opened revealing letters tied with a silk ribbon.",
	"The first raindrop hit the window at exactly midnight. By twelve thirty the streets were rivers of silver reflecting the city lights like a mirror cracked across the asphalt.",
	"He had never seen the desert bloom before. After the rare spring rain the barren landscape transformed into a carpet of wildflowers stretching as far as the horizon in every direction.",
	"The bookshop on the corner had been there for over a century. Its shelves held stories that had traveled across oceans and generations all waiting patiently for the next reader to discover them.",
	"For breakfast she had toast with honey from the apiary down the lane and tea brewed from mint growing wild in the garden. It was a simple meal made perfect by the morning sunlight.",
	"The train departed from platform nine at dawn carrying passengers who had dreams bigger than their suitcases. Each window framed a face looking toward a future written in the morning mist.",
	"Seven generations of the same family had farmed this land. The soil remembered their footsteps and the old oak tree at the edge of the field had witnessed births, deaths, and everything between.",
	"She could hear the ocean from her bedroom window. The rhythmic crash of waves was a lullaby that had sung her to sleep every night since she was a child dreaming of distant shores.",
	"The clock in the town square had stopped at three seventeen on the day the factory closed. Nobody had the heart to fix it so it remained a monument to a moment frozen in time.",
	"Every afternoon at exactly four o clock the old woman fed the pigeons in the park. The birds knew her by the shuffle of her feet and the rustle of breadcrumbs in her paper bag.",
	"The last light of sunset painted the mountains in shades of purple and gold. It was the kind of beauty that made people believe in something greater than themselves.",
	"A single candle burned on the windowsill. It was a signal left by the resistance for their contact who would be passing through the occupied town under cover of darkness.",
	"His workshop smelled of sawdust and linseed oil. Every piece of furniture he made contained a hidden flaw because he believed that perfection was a lie only nature could tell.",
	"The library had a secret room behind a false bookshelf. Only the head librarian knew about it and she guarded its existence with the same devotion she gave to every book in her care.",
	"The old man walked his dog along the same path every evening regardless of weather. The routine had continued for so long that the path had worn into the earth like a river carving a canyon.",
	"She stared at the blank canvas knowing that the first brushstroke was always the hardest. Once the paint touched the white surface there was no going back to the infinite possibilities of nothing.",
	"The letter had been lost in the postal system for forty-seven years. When it finally arrived the envelope was yellowed and the recipient had long since moved away leaving only memories behind.",
	"The musician sat at the piano in the empty concert hall. She played a single note and listened as the sound filled the space like light filling a dark room at dawn.",
	"The garden had grown wild after she left. Roses climbed over the fence and weeds pushed through the cobblestones as if nature was reclaiming what had always belonged to the earth.",
	"The two children met at the fence between their grandfathers farms. They became friends over that fence sharing stories and secrets until the fence became just a formality between two worlds.",
	"The chef's hands moved with the precision of a surgeon. Years of practice had turned cooking into an art form where every slice every season and every plating was a deliberate choice.",
	"The fog rolled in from the sea like a blanket smothering the coastal town. Streetlights became ghostly orbs and the sound of the lighthouse foghorn echoed through the silent streets.",
	"She kept a journal of all the books she read. Each entry contained not just the title and author but also the date the weather and a single sentence about how the book made her feel.",
	"The bridge had stood for over two hundred years connecting two villages separated by a deep gorge. Generations had crossed it to trade to marry and to bury their loved ones.",
	"The cat appeared at her doorstep on a rainy Tuesday and never left. It was a small thing with mismatched eyes and a talent for finding the warmest spot in any room.",
	"He built a telescope in his backyard when he was twelve years old. The first time he saw the rings of Saturn he knew that he would spend the rest of his life looking at the stars.",
	"The market square buzzed with activity every Saturday morning. Farmers sold vegetables bakers sold bread and children ran between the stalls chasing each other in endless games of tag.",
	"She wrote her name in the wet cement of the sidewalk. Years later she returned to find the name still there surrounded by other names and dates like a fossil of a childhood summer.",
	"The old photograph showed three sisters standing in front of a house that had long since been demolished. They were laughing at something the photographer had said and the joy was preserved in silver halide.",
	"The river had frozen solid for the first time in fifty years. Children skated on its surface while their parents watched from the banks remembering their own winters from decades past.",
	"The artist painted murals on abandoned buildings. His work transformed forgotten spaces into galleries that everyone could see without buying a ticket or walking through a museum door.",
	"The first snow of winter arrived in the middle of the night. By morning the world was silent and white and the only sounds were the crunch of boots and the distant laughter of children.",
}

// Science facts — deeper scientific concepts
var scienceFacts = []string{
	"Light from the sun takes about eight minutes and twenty seconds to reach Earth. This means when we look at the sun we are actually seeing it as it appeared eight minutes in the past.",
	"DNA in the human body can stretch from the Earth to the Sun and back over six hundred times. If unwound each cell contains about two meters of DNA bundled into forty-six chromosomes.",
	"The speed of sound is approximately three hundred forty-three meters per second at sea level. It varies with temperature and density of the medium through which it travels.",
	"Quantum entanglement occurs when two particles become linked so that the state of one instantly influences the other regardless of distance. Einstein called it spooky action at a distance.",
	"The observable universe is about ninety-three billion light years in diameter. However the total size of the universe may be much larger or possibly infinite beyond what we can detect.",
	"Neutron stars are incredibly dense. A single teaspoon of neutron star material would weigh about ten million tons on Earth due to the extreme gravitational compression of matter.",
	"Photosynthesis converts sunlight into chemical energy at an efficiency of about three to six percent. Plants use this process to produce glucose and release oxygen as a byproduct.",
	"The human eye can distinguish about ten million different colors. This is achieved through three types of cone cells sensitive to different wavelengths of visible light.",
	"Mitochondria are often called the powerhouse of the cell. These organelles generate most of the cell's energy in the form of ATP through a process called oxidative phosphorylation.",
	"Earth's magnetic field is generated by the movement of molten iron in the outer core. This geodynamo effect creates a protective magnetosphere that shields the planet from solar wind.",
	"The periodic table contains one hundred eighteen confirmed elements. Of these ninety-four occur naturally on Earth while the remaining twenty-four have been created in laboratories.",
	"Black holes are regions of spacetime where gravity is so strong that nothing not even light can escape. The boundary around a black hole is called the event horizon.",
	"The human body contains about thirty-seven trillion cells. Each of these cells performs thousands of chemical reactions every second to keep the body functioning properly.",
	"Plate tectonics describes the movement of Earth's lithosphere which is divided into several large plates. These plates move about as fast as fingernails grow roughly a few centimeters per year.",
	"The electromagnetic spectrum ranges from radio waves with wavelengths of kilometers to gamma rays smaller than atomic nuclei. Visible light occupies only a tiny fraction of this spectrum.",
	"The human microbiome contains approximately one hundred trillion microorganisms. These bacteria viruses and fungi outnumber human cells by about ten to one in the body.",
	"Entropy is a measure of disorder in a system. The second law of thermodynamics states that the total entropy of an isolated system always increases over time.",
	"The Earth's core has a temperature of about fifty-four hundred degrees Celsius. This is roughly the same temperature as the surface of the Sun and generates the planet's magnetic field.",
	"Photosynthesis and cellular respiration are complementary processes. The oxygen produced by plants is used by animals to break down glucose releasing energy and carbon dioxide.",
	"The theory of general relativity describes gravity as the curvature of spacetime caused by mass and energy. It predicts phenomena like gravitational waves and time dilation near massive objects.",
	"The Cambrian Explosion about five hundred forty-one million years ago saw the rapid emergence of most major animal phyla. This evolutionary event remains one of the greatest mysteries in paleontology.",
	"Quantum computing leverages superposition and entanglement to perform calculations. A quantum bit or qubit can represent both zero and one simultaneously enabling massive parallelism.",
	"The human genome contains about three billion base pairs of DNA. Sequencing the first human genome cost about three billion dollars but today it costs less than one thousand dollars.",
	"Sound cannot travel through the vacuum of space because it requires a medium like air or water to propagate. This is why explosions in space movies are scientifically inaccurate.",
	"The water cycle involves evaporation condensation precipitation and collection. About ninety-seven percent of Earth's water is saltwater with only three percent being fresh water.",
	"The Doppler effect causes the frequency of waves to change based on the relative motion between source and observer. It explains why ambulance sirens sound different as they pass by.",
	"Radioactive decay is a random process at the atomic level. However the half-life of a substance which is the time for half of its atoms to decay is predictable and constant.",
	"The human brain consumes about twenty percent of the body's energy despite being only about two percent of body weight. This high energy demand makes it the most energy-intensive organ.",
	"Chemical bonds form when atoms share or transfer electrons. Covalent bonds share electrons while ionic bonds transfer them creating compounds with different properties than the original elements.",
	"Evolution by natural selection requires three conditions: variation inheritance and differential reproductive success. Over generations these factors drive the adaptation of species to their environments.",
}



// Code snippets pool — real code content for coder mode (algorithms, DSA, real solutions)
var codeSnippets = []string{
	"def two_sum(nums, target): seen = {} for i, num in enumerate(nums): complement = target - num if complement in seen: return [seen[complement], i] seen[num] = i return []",
	"function binarySearch(arr, target) { let left = 0 let right = arr.length - 1 while (left <= right) { const mid = Math.floor((left + right) / 2) if (arr[mid] === target) return mid if (arr[mid] < target) left = mid + 1 else right = mid - 1 } return -1 }",
	"def fibonacci(n): if n <= 1: return n a, b = 0, 1 for _ in range(2, n + 1): a, b = b, a + b return b",
	"function quickSort(arr) { if (arr.length <= 1) return arr const pivot = arr[Math.floor(arr.length / 2)] const left = arr.filter(x => x < pivot) const middle = arr.filter(x => x === pivot) const right = arr.filter(x => x > pivot) return [...quickSort(left), ...middle, ...quickSort(right)] }",
	"def merge_sort(arr): if len(arr) <= 1: return arr mid = len(arr) // 2 left = merge_sort(arr[:mid]) right = merge_sort(arr[mid:]) return merge(left, right) where merge uses two pointers to combine sorted halves",
	"class TreeNode { constructor(val) { this.val = val this.left = null this.right = null } } function inorderTraversal(root) { const result = [] function dfs(node) { if (!node) return dfs(node.left) result.push(node.val) dfs(node.right) } dfs(root) return result }",
	"def longest_substring_without_repeating(s): char_set = set() left = 0 max_length = 0 for right in range(len(s)): while s[right] in char_set: char_set.remove(s[left]) left += 1 char_set.add(s[right]) max_length = max(max_length, right - left + 1) return max_length",
	"function maxSubArray(nums) { let maxSum = nums[0] let currentSum = nums[0] for (let i = 1 i < nums.length i++) { currentSum = Math.max(nums[i], currentSum + nums[i]) maxSum = Math.max(maxSum, currentSum) } return maxSum }",
	"def is_valid_bst(root, min_val=float('-inf'), max_val=float('inf')): if not root: return True if root.val <= min_val or root.val >= max_val: return False return is_valid_bst(root.left, min_val, root.val) and is_valid_bst(root.right, root.val, max_val)",
	"class MinStack { constructor() { this.stack = [] this.minStack = [] } push(val) { this.stack.push(val) if (this.minStack.length === 0 || val <= this.minStack[this.minStack.length - 1]) { this.minStack.push(val) } } pop() { const val = this.stack.pop() if (val === this.minStack[this.minStack.length - 1]) this.minStack.pop() return val } getMin() { return this.minStack[this.minStack.length - 1] } }",
	"function reverseLinkedList(head) { let prev = null let current = head while (current !== null) { const next = current.next current.next = prev prev = current current = next } return prev }",
	"def level_order_traversal(root): if not root: return [] result = [] queue = deque([root]) while queue: level = [] for _ in range(len(queue)): node = queue.popleft() level.append(node.val) if node.left: queue.append(node.left) if node.right: queue.append(node.right) result.append(level) return result",
	"function isValidParentheses(s) { const stack = [] const map = { '(': ')', '{': '}', '[': ']' } for (const char of s) { if (map[char]) { stack.push(map[char]) } else if (stack.pop() !== char) { return false } } return stack.length === 0 }",
	"def coin_change(coins, amount): dp = [float('inf')] * (amount + 1) dp[0] = 0 for coin in coins: for x in range(coin, amount + 1): dp[x] = min(dp[x], dp[x - coin] + 1) return dp[amount] if dp[amount] != float('inf') else -1",
	"class LRUCache { constructor(capacity) { this.capacity = capacity this.cache = new Map() } get(key) { if (!this.cache.has(key)) return -1 const value = this.cache.get(key) this.cache.delete(key) this.cache.set(key, value) return value } put(key, value) { if (this.cache.has(key)) this.cache.delete(key) this.cache.set(key, value) if (this.cache.size > this.capacity) this.cache.delete(this.cache.keys().next().value) } }",
	"def longest_palindromic_substring(s): n = len(s) dp = [[False] * n for _ in range(n)] start = 0 max_len = 1 for i in range(n): dp[i][i] = True for end in range(1, n): for start_idx in range(end): if s[start_idx] == s[end] and (end - start_idx <= 2 or dp[start_idx + 1][end - 1]): dp[start_idx][end] = True if end - start_idx + 1 > max_len: max_len = end - start_idx + 1 start = start_idx return s[start:start + max_len]",
	"function findDuplicate(nums) { let slow = nums[0] let fast = nums[0] do { slow = nums[slow] fast = nums[nums[fast]] } while (slow !== fast) slow = nums[0] while (slow !== fast) { slow = nums[slow] fast = nums[fast] } return slow }",
	"def serialize_tree(root): if not root: return 'null' left = serialize_tree(root.left) right = serialize_tree(root.right) return f'{root.val},{left},{right}' def deserialize(data): nodes = data.split(',') def build(): val = nodes.pop(0) if val == 'null': return None root = TreeNode(int(val)) root.left = build() root.right = build() return root return build()",
	"function climbStairs(n) { if (n <= 2) return n let prev1 = 1 let prev2 = 2 for (let i = 3 i <= n i++) { const current = prev1 + prev2 prev1 = prev2 prev2 = current } return prev2 }",
	"def word_break(s, word_dict): word_set = set(word_dict) dp = [False] * (len(s) + 1) dp[0] = True for i in range(1, len(s) + 1): for j in range(i): if dp[j] and s[j:i] in word_set: dp[i] = True break return dp[len(s)]",
}

// All pools by difficulty tier
var contentPools = [][]string{
	funFacts,        // Tier 0 (Ember) — easiest, short fun facts
	techFacts,       // Tier 1 (Igneous)
	shortStories,    // Tier 2 (Magma Core)
	scienceFacts,    // Tier 3 (Obsidian) — harder vocabulary
	codeSnippets,    // Tier 4 (Beyond) — code snippets for high levels
}

// ── Paragraph Generation ─────────────────────────────────

// genParagraph creates a deterministic paragraph from the appropriate content pool.
// The seed is derived solely from the level ID, so the SAME level always produces
// the SAME paragraph (for consistent preview vs gameplay alignment).
// Paragraphs combine multiple entries for longer, more substantial text.
func genParagraph(levelID int) string {
	// Deterministic seed: level ID only — no time component
	rng := rand.New(rand.NewSource(int64(levelID) * 9999))

	// Determine which content pool to use based on level:
	// Levels 1-25: Fun facts (simple, short)
	// Levels 26-50: Tech facts (medium)
	// Levels 51-75: Short stories (narrative, medium-long)
	// Levels 76-100: Science facts (complex vocabulary)
	// 101+: Coding/DSA snippets (code syntax)
	var pool []string
	switch {
	case levelID <= 25:
		pool = contentPools[0]
	case levelID <= 50:
		pool = contentPools[1]
	case levelID <= 75:
		pool = contentPools[2]
	case levelID <= 100:
		pool = contentPools[3]
	default:
		pool = contentPools[4]
	}

	// Determine how many entries to combine based on level
	// Higher levels = longer paragraphs
	// Levels 1-25: 2-3 entries
	// Levels 26-50: 3-4 entries
	// Levels 51-75: 3-4 entries
	// Levels 76-100: 4-5 entries
	// 101+: 3-4 code snippets
	entryCount := 2 + rng.Intn(2) // 2-3 base
	if levelID > 25 {
		entryCount = 3 + rng.Intn(2) // 3-4
	}
	if levelID > 75 {
		entryCount = 4 + rng.Intn(2) // 4-5
	}
	// Cap at pool size to avoid index out of range
	if entryCount > len(pool) {
		entryCount = len(pool)
	}

	// Pick unique entries from the pool
	selected := make(map[int]bool)
	var parts []string
	for len(parts) < entryCount {
		idx := rng.Intn(len(pool))
		if selected[idx] {
			continue
		}
		selected[idx] = true
		parts = append(parts, pool[idx])
	}

	// Combine into a single paragraph
	result := strings.Join(parts, " ")

	// For the highest levels (76+), add a citation or reference sentence
	if levelID > 75 {
		switch rng.Intn(3) {
		case 0:
			result = result + fmt.Sprintf(" Reference [%d] contains further reading on this topic.", rng.Intn(100)+1)
		case 1:
			result = result + fmt.Sprintf(" Studies from %d confirm these findings across multiple independent research groups.", 1990+rng.Intn(34))
		case 2:
			result = result + fmt.Sprintf(" This principle was first documented in the early %d by researchers at Cambridge.", 1950+rng.Intn(70))
		}
	}

	return result
}

// GetLevelTotalCount returns the total number of levels that have unique names
// (pre-generated 100 + all named beyond levels). Levels beyond this count are
// dynamically generated with auto-generated names.
func GetLevelTotalCount() int {
	return len(LevelConfigs) + len(beyondNames)
}

// GenerateFreshLevels generates all 100 levels with fresh paragraphs (exported for seeding tools).
func GenerateFreshLevels() []LevelConfig {
	return generateLevels()
}

func generateLevels() []LevelConfig {
	var levels []LevelConfig

	tierKeys := []string{TierEmber, TierIgneous, TierMagmaCore, TierObsidian}
	tierNames := [][]string{emberNames, igneousNames, magmaCoreNames, obsidianNames}
	tierDiffs := []int{1, 2, 3, 4}
	tierWPM := [][2]int{{30, 40}, {40, 55}, {55, 70}, {70, 85}}
	tierAcc := [][2]int{{85, 88}, {88, 92}, {90, 93}, {92, 95}}

	for ti, name := range tierKeys {
		start, end := tierRange[name][0], tierRange[name][1]
		for i := start; i <= end; i++ {
			idx := i - start
			tierSize := end - start
			progress := 0.0
			if tierSize > 0 {
				progress = float64(idx) / float64(tierSize)
			}
			wpm := tierWPM[ti][0] + int(progress*float64(tierWPM[ti][1]-tierWPM[ti][0]))
			acc := tierAcc[ti][0] + int(progress*float64(tierAcc[ti][1]-tierAcc[ti][0]))

			levels = append(levels, LevelConfig{
				ID:           i,
				Name:         tierNames[ti][idx],
				Tier:         name,
				Difficulty:   tierDiffs[ti],
				PassWPM:      wpm,
				PassAccuracy: acc,
				Paragraph:    genParagraph(i),
			})
		}
	}

	return levels
}
