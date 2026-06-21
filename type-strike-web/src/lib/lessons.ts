/**
 * Type Strike — Learning Lessons Data
 *
 * Progressive typing lessons that teach touch typing from the ground up.
 * Lessons start with a single key and gradually introduce new keys,
 * building up to full paragraphs.
 */

export type FingerName = "left-pinky" | "left-ring" | "left-middle" | "left-index" | "right-index" | "right-middle" | "right-ring" | "right-pinky";

export interface Lesson {
  id: number;
  name: string;
  description: string;
  /** The keys this lesson focuses on (new keys) */
  focusKeys: string[];
  /** All allowed keys for this lesson (cumulative) */
  allowedKeys: string[];
  /** The paragraph/text to type */
  paragraph: string;
  /** Category for grouping in the hub */
  category: LessonCategory;
  /** Approximate difficulty 1-10 */
  difficulty: number;
  /** Estimated completion time in seconds */
  estimatedSeconds: number;
}

export type LessonCategory =
  | "single-key"
  | "two-keys"
  | "three-keys"
  | "home-row"
  | "top-row"
  | "bottom-row"
  | "cross-keys"
  | "number-row"
  | "all-rows"
  | "words"
  | "sentences";

export const LESSON_CATEGORIES: Record<LessonCategory, { label: string; color: string; icon: string }> = {
  "single-key": { label: "Single Key", color: "#FF5020", icon: "🔑" },
  "two-keys": { label: "Two Keys", color: "#FF6600", icon: "🔤" },
  "three-keys": { label: "Three Keys", color: "#FF8800", icon: "📝" },
  "home-row": { label: "Home Row", color: "#22DD44", icon: "⌨️" },
  "top-row": { label: "Top Row", color: "#00E5FF", icon: "⬆️" },
  "bottom-row": { label: "Bottom Row", color: "#CC44FF", icon: "⬇️" },
  "cross-keys": { label: "Cross Keys", color: "#FF44AA", icon: "🔄" },
  "number-row": { label: "Number Row", color: "#FFDD00", icon: "🔢" },
  "all-rows": { label: "All Rows", color: "#8844FF", icon: "🎹" },
  "words": { label: "Words", color: "#FFCC00", icon: "📖" },
  "sentences": { label: "Sentences", color: "#FF00AA", icon: "💬" },
};

/**
 * Finger-to-key mapping for the QWERTY layout.
 * Used by the finger guide visualization to show which finger should press which key.
 */
export const KEY_FINGER_MAP: Record<string, FingerName> = {
  // Left hand
  "q": "left-pinky", "a": "left-pinky", "z": "left-pinky",
  "w": "left-ring", "s": "left-ring", "x": "left-ring",
  "e": "left-middle", "d": "left-middle", "c": "left-middle",
  "r": "left-index", "f": "left-index", "v": "left-index",
  "t": "left-index", "g": "left-index", "b": "left-index",
  // Right hand
  "y": "right-index", "h": "right-index", "n": "right-index",
  "u": "right-index", "j": "right-index", "m": "right-index",
  "i": "right-middle", "k": "right-middle", ",": "right-middle",
  "o": "right-ring", "l": "right-ring", ".": "right-ring",
  "p": "right-pinky", ";": "right-pinky", "/": "right-pinky",
  // Number row — top row above home position
  "`": "left-pinky", "~": "left-pinky",
  "1": "left-pinky", "!": "left-pinky",
  "2": "left-ring", "@": "left-ring",
  "3": "left-middle", "#": "left-middle",
  "4": "left-index", "$": "left-index",
  "5": "left-index", "%": "left-index",
  "6": "right-index", "^": "right-index",
  "7": "right-index", "&": "right-index",
  "8": "right-middle", "*": "right-middle",
  "9": "right-ring", "(": "right-ring",
  "0": "right-pinky", ")": "right-pinky",
  "-": "right-pinky", "_": "right-pinky",
  "=": "right-pinky", "+": "right-pinky",
};

export const FINGER_COLORS: Record<FingerName, string> = {
  "left-pinky": "#FF6666",
  "left-ring": "#FFAA44",
  "left-middle": "#FFDD44",
  "left-index": "#44DD44",
  "right-index": "#44DDAA",
  "right-middle": "#4488FF",
  "right-ring": "#8844FF",
  "right-pinky": "#CC44FF",
};

export const FINGER_LABELS: Record<FingerName, string> = {
  "left-pinky": "Pinky",
  "left-ring": "Ring",
  "left-middle": "Middle",
  "left-index": "Index",
  "right-index": "Index",
  "right-middle": "Middle",
  "right-ring": "Ring",
  "right-pinky": "Pinky",
};

// ── Helper to generate repeating-key paragraphs ─────────

function repeatChars(chars: string, count: number): string {
  let result = "";
  for (let i = 0; i < count; i++) {
    result += chars[i % chars.length] + " ";
  }
  return result.trim();
}

function repeatWords(words: string[], count: number): string {
  let result: string[] = [];
  for (let i = 0; i < count; i++) {
    result.push(words[i % words.length]);
  }
  return result.join(" ");
}

// ── Lessons ─────────────────────────────────────────────

export const LESSONS: Lesson[] = [
  // ═══════════════════════════════════════════════════════
  // SINGLE KEY LESSONS
  // ═══════════════════════════════════════════════════════

  {
    id: 1,
    name: "The F Key",
    description: "Place your left index finger on the F key. Type F repeatedly.",
    focusKeys: ["f"],
    allowedKeys: ["f"],
    paragraph: repeatChars("f", 30),
    category: "single-key",
    difficulty: 1,
    estimatedSeconds: 30,
  },
  {
    id: 2,
    name: "The J Key",
    description: "Place your right index finger on the J key. Type J repeatedly.",
    focusKeys: ["j"],
    allowedKeys: ["j"],
    paragraph: repeatChars("j", 30),
    category: "single-key",
    difficulty: 1,
    estimatedSeconds: 30,
  },
  {
    id: 3,
    name: "The D Key",
    description: "Place your left middle finger on the D key. Type D repeatedly.",
    focusKeys: ["d"],
    allowedKeys: ["d"],
    paragraph: repeatChars("d", 30),
    category: "single-key",
    difficulty: 1,
    estimatedSeconds: 30,
  },
  {
    id: 4,
    name: "The K Key",
    description: "Place your right middle finger on the K key. Type K repeatedly.",
    focusKeys: ["k"],
    allowedKeys: ["k"],
    paragraph: repeatChars("k", 30),
    category: "single-key",
    difficulty: 1,
    estimatedSeconds: 30,
  },

  // ═══════════════════════════════════════════════════════
  // TWO KEYS
  // ═══════════════════════════════════════════════════════

  {
    id: 5,
    name: "F and J",
    description: "Alternate between F (left index) and J (right index).",
    focusKeys: ["f", "j"],
    allowedKeys: ["f", "j"],
    paragraph: repeatChars("f j", 25),
    category: "two-keys",
    difficulty: 2,
    estimatedSeconds: 45,
  },
  {
    id: 6,
    name: "D and K",
    description: "Type D (left middle) and K (right middle).",
    focusKeys: ["d", "k"],
    allowedKeys: ["d", "k"],
    paragraph: repeatChars("d k", 25),
    category: "two-keys",
    difficulty: 2,
    estimatedSeconds: 45,
  },
  {
    id: 7,
    name: "S and L",
    description: "Type S (left ring) and L (right ring).",
    focusKeys: ["s", "l"],
    allowedKeys: ["s", "l"],
    paragraph: repeatChars("s l", 25),
    category: "two-keys",
    difficulty: 2,
    estimatedSeconds: 45,
  },
  {
    id: 8,
    name: "A and Semicolon",
    description: "Type A (left pinky) and ; (right pinky).",
    focusKeys: ["a", ";"],
    allowedKeys: ["a", ";"],
    paragraph: "a ; a ; a ; a ; a ; a ; a ; a ; a ; a ; a ; a ; a ; a ; a ;",
    category: "two-keys",
    difficulty: 2,
    estimatedSeconds: 45,
  },

  // ═══════════════════════════════════════════════════════
  // THREE KEYS
  // ═══════════════════════════════════════════════════════

  {
    id: 9,
    name: "F, D, and J",
    description: "Combine left index, left middle, and right index.",
    focusKeys: ["f", "d", "j"],
    allowedKeys: ["f", "d", "j"],
    paragraph: repeatChars("f d j", 20),
    category: "three-keys",
    difficulty: 3,
    estimatedSeconds: 45,
  },
  {
    id: 10,
    name: "S, K, and L",
    description: "Combine left ring, right middle, and right ring.",
    focusKeys: ["s", "k", "l"],
    allowedKeys: ["s", "k", "l"],
    paragraph: repeatChars("s k l", 20),
    category: "three-keys",
    difficulty: 3,
    estimatedSeconds: 45,
  },
  {
    id: 11,
    name: "A, F, and J",
    description: "Combine left pinky, left index, and right index.",
    focusKeys: ["a", "f", "j"],
    allowedKeys: ["a", "f", "j"],
    paragraph: "a f j a f j a f j a f j a f j a f j a f j a f j",
    category: "three-keys",
    difficulty: 3,
    estimatedSeconds: 45,
  },
  {
    id: 12,
    name: "D, K, and S",
    description: "Combine left middle, right middle, and left ring.",
    focusKeys: ["d", "k", "s"],
    allowedKeys: ["d", "k", "s"],
    paragraph: "d k s d k s d k s d k s d k s d k s d k s d k s",
    category: "three-keys",
    difficulty: 3,
    estimatedSeconds: 45,
  },

  // ═══════════════════════════════════════════════════════
  // HOME ROW
  // ═══════════════════════════════════════════════════════

  {
    id: 13,
    name: "Home Row Left",
    description: "All left-hand home row keys: A, S, D, F.",
    focusKeys: ["a", "s", "d", "f"],
    allowedKeys: ["a", "s", "d", "f"],
    paragraph: repeatChars("a s d f", 18),
    category: "home-row",
    difficulty: 3,
    estimatedSeconds: 60,
  },
  {
    id: 14,
    name: "Home Row Right",
    description: "All right-hand home row keys: J, K, L, ;.",
    focusKeys: ["j", "k", "l", ";"],
    allowedKeys: ["j", "k", "l", ";"],
    paragraph: "j k l ; j k l ; j k l ; j k l ; j k l ; j k l ;",
    category: "home-row",
    difficulty: 3,
    estimatedSeconds: 60,
  },
  {
    id: 15,
    name: "Full Home Row",
    description: "All home row keys together.",
    focusKeys: ["a", "s", "d", "f", "j", "k", "l", ";"],
    allowedKeys: ["a", "s", "d", "f", "j", "k", "l", ";"],
    paragraph: "a s d f j k l ; a s d f j k l ; a s d f j k l ; a s d f j k l ; a s d f j k l ;",
    category: "home-row",
    difficulty: 4,
    estimatedSeconds: 60,
  },
  {
    id: 16,
    name: "Home Row Practice",
    description: "Practice home row with simple combinations.",
    focusKeys: ["a", "s", "d", "f", "j", "k", "l", ";"],
    allowedKeys: ["a", "s", "d", "f", "j", "k", "l", ";"],
    paragraph: "dad fad sad lad jak kad sal jal a lad fad sad jak",
    category: "home-row",
    difficulty: 4,
    estimatedSeconds: 60,
  },

  // ═══════════════════════════════════════════════════════
  // TOP ROW
  // ═══════════════════════════════════════════════════════

  {
    id: 17,
    name: "The E and I Keys",
    description: "E (left middle, up) and I (right middle, up).",
    focusKeys: ["e", "i"],
    allowedKeys: ["a", "s", "d", "f", "j", "k", "l", "e", "i"],
    paragraph: "e i e i e i e i e i e i e i e i e i e i e i e i e i e i e i",
    category: "top-row",
    difficulty: 4,
    estimatedSeconds: 60,
  },
  {
    id: 18,
    name: "The R and U Keys",
    description: "R (left index, up) and U (right index, up).",
    focusKeys: ["r", "u"],
    allowedKeys: ["a", "s", "d", "f", "j", "k", "l", "e", "i", "r", "u"],
    paragraph: "r u r u r u r u r u r u r u r u r u r u r u r u r u r u r u",
    category: "top-row",
    difficulty: 4,
    estimatedSeconds: 60,
  },
  {
    id: 19,
    name: "The T and Y Keys",
    description: "T (left index, up) and Y (right index, up).",
    focusKeys: ["t", "y"],
    allowedKeys: ["a", "s", "d", "f", "j", "k", "l", "e", "i", "r", "u", "t", "y"],
    paragraph: "t y t y t y t y t y t y t y t y t y t y t y t y t y t y t y",
    category: "top-row",
    difficulty: 4,
    estimatedSeconds: 60,
  },
  {
    id: 20,
    name: "Top Row All",
    description: "All top row keys: Q, W, E, R, T, Y, U, I, O, P.",
    focusKeys: ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
    allowedKeys: ["a", "s", "d", "f", "j", "k", "l", ";", "q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
    paragraph: repeatChars("q w e r t y u i o p", 10),
    category: "top-row",
    difficulty: 5,
    estimatedSeconds: 90,
  },
  {
    id: 21,
    name: "Top Row Practice",
    description: "Practice typing words using home row and top row keys.",
    focusKeys: ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
    allowedKeys: ["a", "s", "d", "f", "j", "k", "l", ";", "q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
    paragraph: "we are for top tip per put out our tire fire kite site ride rate tire your write quiet write write tire fire",
    category: "top-row",
    difficulty: 5,
    estimatedSeconds: 90,
  },

  // ═══════════════════════════════════════════════════════
  // BOTTOM ROW
  // ═══════════════════════════════════════════════════════

  {
    id: 22,
    name: "The N and M Keys",
    description: "N (right index, down) and M (right index, down and right).",
    focusKeys: ["n", "m"],
    allowedKeys: ["a", "s", "d", "f", "j", "k", "l", ";", "e", "i", "r", "u", "t", "y", "n", "m"],
    paragraph: "n m n m n m n m n m n m n m n m n m n m n m n m n m n m n m",
    category: "bottom-row",
    difficulty: 5,
    estimatedSeconds: 60,
  },
  {
    id: 23,
    name: "The V, B, and C Keys",
    description: "V, B (left index, down) and C (left middle, down).",
    focusKeys: ["v", "b", "c"],
    allowedKeys: ["a", "s", "d", "f", "j", "k", "l", ";", "e", "i", "r", "u", "t", "y", "n", "m", "v", "b", "c"],
    paragraph: "v b c v b c v b c v b c v b c v b c v b c v b c v b c v b c",
    category: "bottom-row",
    difficulty: 5,
    estimatedSeconds: 60,
  },
  {
    id: 24,
    name: "The X, Z Keys",
    description: "X (left ring, down) and Z (left pinky, down).",
    focusKeys: ["x", "z"],
    allowedKeys: ["a", "s", "d", "f", "j", "k", "l", ";", "e", "i", "r", "u", "t", "y", "n", "m", "v", "b", "c", "x", "z"],
    paragraph: "x z x z x z x z x z x z x z x z x z x z x z x z x z x z x z",
    category: "bottom-row",
    difficulty: 5,
    estimatedSeconds: 60,
  },
  {
    id: 25,
    name: "Bottom Row All",
    description: "All bottom row keys: Z, X, C, V, B, N, M.",
    focusKeys: ["z", "x", "c", "v", "b", "n", "m"],
    allowedKeys: ["a", "s", "d", "f", "j", "k", "l", ";", "e", "i", "r", "u", "t", "y", "q", "w", "o", "p", "z", "x", "c", "v", "b", "n", "m"],
    paragraph: "z x c v b n m z x c v b n m z x c v b n m z x c v b n m z x c v b n m",
    category: "bottom-row",
    difficulty: 5,
    estimatedSeconds: 90,
  },

  // ═══════════════════════════════════════════════════════
  // ALL ROWS
  // ═══════════════════════════════════════════════════════

  {
    id: 26,
    name: "All Rows Mix",
    description: "Practice all rows together for the full keyboard.",
    focusKeys: [],
    allowedKeys: ["a", "s", "d", "f", "j", "k", "l", ";", "q", "w", "e", "r", "t", "y", "u", "i", "o", "p", "z", "x", "c", "v", "b", "n", "m"],
    paragraph: "the quick brown fox jumps over the lazy dog the five boxing wizards jump quickly",
    category: "all-rows",
    difficulty: 6,
    estimatedSeconds: 90,
  },
  {
    id: 27,
    name: "All Rows Practice 2",
    description: "More practice with all rows.",
    focusKeys: [],
    allowedKeys: ["a", "s", "d", "f", "j", "k", "l", ";", "q", "w", "e", "r", "t", "y", "u", "i", "o", "p", "z", "x", "c", "v", "b", "n", "m"],
    paragraph: "pack my box with five dozen liquor jugs the quick brown fox jumps over the lazy dog",
    category: "all-rows",
    difficulty: 6,
    estimatedSeconds: 90,
  },
  {
    id: 28,
    name: "All Rows Practice 3",
    description: "Build speed across all keyboard rows.",
    focusKeys: [],
    allowedKeys: ["a", "s", "d", "f", "j", "k", "l", ";", "q", "w", "e", "r", "t", "y", "u", "i", "o", "p", "z", "x", "c", "v", "b", "n", "m"],
    paragraph: "how vexingly quick daft zebras jump the wizard quickly jinxed the gnomes before they vanished",
    category: "all-rows",
    difficulty: 6,
    estimatedSeconds: 90,
  },

  // ═══════════════════════════════════════════════════════
  // WORDS
  // ═══════════════════════════════════════════════════════

  {
    id: 29,
    name: "Two-Letter Words",
    description: "Practice common two-letter words.",
    focusKeys: [],
    allowedKeys: ["a", "s", "d", "f", "j", "k", "l", ";", "q", "w", "e", "r", "t", "y", "u", "i", "o", "p", "z", "x", "c", "v", "b", "n", "m"],
    paragraph: "it is at to in on of be he we by my up us an or as if do go no so am me ox",
    category: "words",
    difficulty: 7,
    estimatedSeconds: 60,
  },
  {
    id: 30,
    name: "Three-Letter Words",
    description: "Practice three-letter words for speed.",
    focusKeys: [],
    allowedKeys: ["a", "s", "d", "f", "j", "k", "l", ";", "q", "w", "e", "r", "t", "y", "u", "i", "o", "p", "z", "x", "c", "v", "b", "n", "m"],
    paragraph: "the and for are not you all can had her was one two but not she his has out who let get run way map key box fix mix six sit fit bit hit",
    category: "words",
    difficulty: 7,
    estimatedSeconds: 90,
  },
  {
    id: 31,
    name: "Four-Letter Words",
    description: "Practice four-letter words.",
    focusKeys: [],
    allowedKeys: ["a", "s", "d", "f", "j", "k", "l", ";", "q", "w", "e", "r", "t", "y", "u", "i", "o", "p", "z", "x", "c", "v", "b", "n", "m"],
    paragraph: "that with have this from they want been call come does each find give help here just know like make need only part some such take tell than very",
    category: "words",
    difficulty: 7,
    estimatedSeconds: 90,
  },
  {
    id: 32,
    name: "Common Words Mix",
    description: "Mix of common English words at various lengths.",
    focusKeys: [],
    allowedKeys: ["a", "s", "d", "f", "j", "k", "l", ";", "q", "w", "e", "r", "t", "y", "u", "i", "o", "p", "z", "x", "c", "v", "b", "n", "m"],
    paragraph: repeatWords(["the", "and", "for", "are", "not", "you", "all", "can", "had", "her", "was", "one", "two", "but", "she", "his", "out", "who", "let", "get", "run", "way", "map", "key", "box", "fix", "mix", "six", "fit", "bit", "hit"], 5),
    category: "words",
    difficulty: 7,
    estimatedSeconds: 90,
  },

  // ═══════════════════════════════════════════════════════
  // SENTENCES
  // ═══════════════════════════════════════════════════════

  {
    id: 33,
    name: "Simple Sentences",
    description: "Type simple sentences to build real-world typing skill.",
    focusKeys: [],
    allowedKeys: ["a", "s", "d", "f", "j", "k", "l", ";", "q", "w", "e", "r", "t", "y", "u", "i", "o", "p", "z", "x", "c", "v", "b", "n", "m"],
    paragraph: "The cat sat on the mat. The dog ran in the park. We can go to the store. She will make a cake. He can fix the car.",
    category: "sentences",
    difficulty: 8,
    estimatedSeconds: 120,
  },
  {
    id: 34,
    name: "Medium Sentences",
    description: "Longer sentences with common punctuation.",
    focusKeys: [],
    allowedKeys: ["a", "s", "d", "f", "j", "k", "l", ";", "q", "w", "e", "r", "t", "y", "u", "i", "o", "p", "z", "x", "c", "v", "b", "n", "m"],
    paragraph: "The quick brown fox jumps over the lazy dog near the bank of the river. She sells sea shells by the sea shore and he sells sea shells too.",
    category: "sentences",
    difficulty: 8,
    estimatedSeconds: 120,
  },
  {
    id: 35,
    name: "Longer Sentences",
    description: "Build endurance with longer paragraphs.",
    focusKeys: [],
    allowedKeys: ["a", "s", "d", "f", "j", "k", "l", ";", "q", "w", "e", "r", "t", "y", "u", "i", "o", "p", "z", "x", "c", "v", "b", "n", "m"],
    paragraph: "Typing is a skill that takes time and practice to master. The best way to get faster is to type every day. Start slow and focus on accuracy first. Speed will come naturally as your fingers learn where each key is located on the keyboard. Remember to keep your wrists straight and your fingers curved over the home row keys.",
    category: "sentences",
    difficulty: 9,
    estimatedSeconds: 150,
  },
  {
    id: 36,
    name: "Ready for Levels",
    description: "Final practice before moving to real levels.",
    focusKeys: [],
    allowedKeys: ["a", "s", "d", "f", "j", "k", "l", ";", "q", "w", "e", "r", "t", "y", "u", "i", "o", "p", "z", "x", "c", "v", "b", "n", "m"],
    paragraph: "The fire burns brightly in the heart of the mountain. A hot flame forges the hardest stone into steel. Type with fury and strike with fire as you conquer each level that stands before you. The arena is waiting for you to begin your journey through one hundred levels of fire and fury.",
    category: "sentences",
    difficulty: 10,
    estimatedSeconds: 180,
  },

  // ═══════════════════════════════════════════════════════
  // CROSS-KEYS — train fingers to move independently
  // ═══════════════════════════════════════════════════════

  {
    id: 37,
    name: "Index & Middle",
    description: "Cross-train your index and middle fingers between rows.",
    focusKeys: ["f", "r", "d", "e"],
    allowedKeys: ["a", "s", "d", "f", "j", "k", "l", ";", "e", "r", "u", "i"],
    paragraph: repeatChars("f r d e f r d e f r d e f r d e f r d e f r d e", 8),
    category: "cross-keys",
    difficulty: 5,
    estimatedSeconds: 60,
  },
  {
    id: 38,
    name: "Ring & Pinky",
    description: "Strengthen ring and pinky finger independence.",
    focusKeys: ["s", "w", "a", "q"],
    allowedKeys: ["a", "s", "d", "f", "j", "k", "l", ";", "q", "w", "e", "r", "u", "i", "o", "p"],
    paragraph: "s w a q s w a q s w a q s w a q s w a q s w a q s w a q s w a q",
    category: "cross-keys",
    difficulty: 5,
    estimatedSeconds: 60,
  },
  {
    id: 39,
    name: "Cross-Index Stretch",
    description: "Stretch your index finger up and down between rows.",
    focusKeys: ["f", "r", "t", "g", "v", "b"],
    allowedKeys: ["a", "s", "d", "f", "j", "k", "l", ";", "e", "r", "t", "y", "u", "i", "v", "b", "n", "m"],
    paragraph: "f r t g v b f r t g v b f r t g v b f r t g v b f r t g v b",
    category: "cross-keys",
    difficulty: 6,
    estimatedSeconds: 75,
  },
  {
    id: 40,
    name: "Cross-Keys Drill",
    description: "Rapid cross-row combinations for all fingers.",
    focusKeys: ["e", "d", "c", "i", "k", ","],
    allowedKeys: ["a", "s", "d", "f", "j", "k", "l", ";", "q", "w", "e", "r", "t", "y", "u", "i", "o", "p", "z", "x", "c", "v", "b", "n", "m"],
    paragraph: "edc ik, edc ik, edc ik, edc ik, edc ik, edc ik, edc ik, edc ik",
    category: "cross-keys",
    difficulty: 6,
    estimatedSeconds: 75,
  },
  {
    id: 41,
    name: "Full Cross Training",
    description: "Type words that force cross-row finger movement.",
    focusKeys: ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
    allowedKeys: ["a", "s", "d", "f", "j", "k", "l", ";", "q", "w", "e", "r", "t", "y", "u", "i", "o", "p", "z", "x", "c", "v", "b", "n", "m"],
    paragraph: "axe box cry dry fly fry gym icy koi mix nix oak pry sky try vex why yak zip flex grip kick limp mock nick pick quit rich sick tick",
    category: "cross-keys",
    difficulty: 7,
    estimatedSeconds: 90,
  },

  // ═══════════════════════════════════════════════════════
  // NUMBER ROW
  // ═══════════════════════════════════════════════════════

  {
    id: 42,
    name: "The 4 and 7 Keys",
    description: "4 (left index, up-left) and 7 (right index, up-left).",
    focusKeys: ["4", "7"],
    allowedKeys: ["a", "s", "d", "f", "j", "k", "l", ";", "4", "7"],
    paragraph: "4 7 4 7 4 7 4 7 4 7 4 7 4 7 4 7 4 7 4 7 4 7 4 7 4 7 4 7 4 7",
    category: "number-row",
    difficulty: 6,
    estimatedSeconds: 60,
  },
  {
    id: 43,
    name: "The 3 and 8 Keys",
    description: "3 (left middle, up) and 8 (right middle, up).",
    focusKeys: ["3", "8"],
    allowedKeys: ["a", "s", "d", "f", "j", "k", "l", ";", "4", "7", "3", "8"],
    paragraph: "3 8 3 8 3 8 3 8 3 8 3 8 3 8 3 8 3 8 3 8 3 8 3 8 3 8 3 8 3 8",
    category: "number-row",
    difficulty: 6,
    estimatedSeconds: 60,
  },
  {
    id: 44,
    name: "The 2 and 9 Keys",
    description: "2 (left ring, up) and 9 (right ring, up).",
    focusKeys: ["2", "9"],
    allowedKeys: ["a", "s", "d", "f", "j", "k", "l", ";", "4", "7", "3", "8", "2", "9"],
    paragraph: "2 9 2 9 2 9 2 9 2 9 2 9 2 9 2 9 2 9 2 9 2 9 2 9 2 9 2 9 2 9",
    category: "number-row",
    difficulty: 6,
    estimatedSeconds: 60,
  },
  {
    id: 45,
    name: "The 1 and 0 Keys",
    description: "1 (left pinky, up) and 0 (right pinky, up).",
    focusKeys: ["1", "0"],
    allowedKeys: ["a", "s", "d", "f", "j", "k", "l", ";", "4", "7", "3", "8", "2", "9", "1", "0"],
    paragraph: "1 0 1 0 1 0 1 0 1 0 1 0 1 0 1 0 1 0 1 0 1 0 1 0 1 0 1 0 1 0",
    category: "number-row",
    difficulty: 6,
    estimatedSeconds: 60,
  },
  {
    id: 46,
    name: "Number Row All",
    description: "All number row keys: 1 through 0.",
    focusKeys: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"],
    allowedKeys: ["a", "s", "d", "f", "j", "k", "l", ";", "q", "w", "e", "r", "t", "y", "u", "i", "o", "p", "z", "x", "c", "v", "b", "n", "m", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0"],
    paragraph: "1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0",
    category: "number-row",
    difficulty: 7,
    estimatedSeconds: 90,
  },
  {
    id: 47,
    name: "Numbers Practice",
    description: "Practice typing numbers mixed with letters.",
    focusKeys: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"],
    allowedKeys: ["a", "s", "d", "f", "j", "k", "l", ";", "q", "w", "e", "r", "t", "y", "u", "i", "o", "p", "z", "x", "c", "v", "b", "n", "m", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0"],
    paragraph: "room 101 test 42 code 404 year 2025 page 99 level 50 rank 1 item 76 score 88 game 3 zone 7",
    category: "number-row",
    difficulty: 7,
    estimatedSeconds: 90,
  },

  // ═══════════════════════════════════════════════════════
  // EXTRA PRACTICE — mixed drills for speed & accuracy
  // ═══════════════════════════════════════════════════════

  {
    id: 48,
    name: "Speed Builder",
    description: "Rapid-fire short words to build typing speed.",
    focusKeys: [],
    allowedKeys: ["a", "s", "d", "f", "j", "k", "l", ";", "q", "w", "e", "r", "t", "y", "u", "i", "o", "p", "z", "x", "c", "v", "b", "n", "m", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0"],
    paragraph: repeatWords(["the", "and", "for", "are", "not", "you", "all", "can", "had", "her", "was", "one", "two", "but", "she", "his", "has", "out", "who", "let", "get", "run", "way", "map", "key", "box", "fix", "mix", "six", "sit", "fit", "bit", "hit", "win", "top", "big", "red", "new", "old", "hot", "cold"], 4),
    category: "words",
    difficulty: 8,
    estimatedSeconds: 90,
  },
];

// ── Helpers ─────────────────────────────────────────────

export function getLessonById(id: number): Lesson | undefined {
  return LESSONS.find((l) => l.id === id);
}

export function getLessonsByCategory(): Record<LessonCategory, Lesson[]> {
  const grouped: Record<string, Lesson[]> = {};
  for (const lesson of LESSONS) {
    if (!grouped[lesson.category]) grouped[lesson.category] = [];
    grouped[lesson.category].push(lesson);
  }
  return grouped as Record<LessonCategory, Lesson[]>;
}
