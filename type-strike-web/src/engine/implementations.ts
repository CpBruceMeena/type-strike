/**
 * Type Strike — Engine Implementations
 *
 * Concrete implementations of all engine interfaces.
 * Each is swappable — the engine accepts any implementation.
 */

import type {
  IInputSource,
  ITimerStrategy,
  IScoringStrategy,
  IComboSystem,
  ITelemetryPipeline,
  ITextProvider,
  TextBundle,
  LevelThreshold,
} from "./interfaces";

import { COMBO_TIERS, STALL_TIMEOUT_MS } from "@/lib/constants";
import { api } from "@/lib/api";

// ── Keyboard Input Source ──────────────────────────────

export class KeyboardInputSource implements IInputSource {
  private keydownCb?: (char: string) => void;
  private backspaceCb?: () => void;
  private keyupCb?: () => void;
  private handler = (e: Event) => {
    const ke = e as KeyboardEvent;
    if (ke.repeat) return;
    if (ke.key === "Backspace") {
      ke.preventDefault();
      this.backspaceCb?.();
      return;
    }
    // Enter → \n for multi-line code snippet newlines
    if (ke.key === "Enter") {
      ke.preventDefault();
      this.keydownCb?.("\n");
      return;
    }
    // Tab → \t for code indentation
    if (ke.key === "Tab") {
      ke.preventDefault();
      this.keydownCb?.("\t");
      return;
    }
    if (ke.key.length === 1) {
      ke.preventDefault();
      this.keydownCb?.(ke.key);
    }
  };

  private upHandler = () => {
    this.keyupCb?.();
  };

  onKeyDown(callback: (char: string) => void): void {
    this.keydownCb = callback;
  }

  onBackspace(callback: () => void): void {
    this.backspaceCb = callback;
  }

  onKeyUp(callback: () => void): void {
    this.keyupCb = callback;
  }

  destroy(): void {
    document.removeEventListener("keydown", this.handler);
    document.removeEventListener("keyup", this.upHandler);
  }

  isActive(): boolean {
    return !!this.keydownCb;
  }

  attach(element?: HTMLElement): void {
    const target = element ?? document;
    target.addEventListener("keydown", this.handler);
    target.addEventListener("keyup", this.upHandler);
  }
}

// ── No-Timer (Level Mode) ─────────────────────────────

export class NoTimer implements ITimerStrategy {
  private startTime = 0;
  private pausedTime = 0;
  private isPaused = false;
  private tickCb?: (elapsed: number) => void;
  private expireCb?: () => void;
  private intervalId?: ReturnType<typeof setInterval>;

  getElapsedMs(): number {
    if (this.startTime === 0) return 0;
    if (this.isPaused) return this.pausedTime;
    return Date.now() - this.startTime;
  }

  getRemainingMs(): number | null {
    return null; // No time limit
  }

  start(): void {
    this.startTime = Date.now();
    this.isPaused = false;
    this.intervalId = setInterval(() => {
      this.tickCb?.(this.getElapsedMs());
    }, 200);
  }

  pause(): void {
    if (!this.isPaused) {
      this.pausedTime = this.getElapsedMs();
      this.isPaused = true;
      clearInterval(this.intervalId);
    }
  }

  resume(): void {
    if (this.isPaused) {
      const elapsed = this.pausedTime;
      this.startTime = Date.now() - elapsed;
      this.isPaused = false;
      this.intervalId = setInterval(() => {
        this.tickCb?.(this.getElapsedMs());
      }, 200);
    }
  }

  reset(): void {
    this.startTime = 0;
    this.pausedTime = 0;
    this.isPaused = false;
    clearInterval(this.intervalId);
  }

  isExpired(): boolean {
    return false;
  }

  onTick(callback: (elapsed: number) => void): void {
    this.tickCb = callback;
  }

  onExpire(callback: () => void): void {
    this.expireCb = callback;
  }
}

// ── Countdown Timer (Timed Modes) ──────────────────────

export class CountdownTimer implements ITimerStrategy {
  private durationMs: number;
  private startTime = 0;
  private pausedTime = 0;
  private isPaused = false;
  private expired = false;
  private tickCb?: (elapsed: number) => void;
  private expireCb?: () => void;
  private intervalId?: ReturnType<typeof setInterval>;

  constructor(durationSeconds: number) {
    this.durationMs = durationSeconds * 1000;
  }

  getElapsedMs(): number {
    if (this.startTime === 0) return 0;
    if (this.isPaused) return this.pausedTime;
    return Date.now() - this.startTime;
  }

  getRemainingMs(): number {
    return Math.max(0, this.durationMs - this.getElapsedMs());
  }

  start(): void {
    this.startTime = Date.now();
    this.isPaused = false;
    this.expired = false;
    this.intervalId = setInterval(() => {
      const elapsed = this.getElapsedMs();
      this.tickCb?.(elapsed);
      if (elapsed >= this.durationMs) {
        this.expired = true;
        clearInterval(this.intervalId);
        this.expireCb?.();
      }
    }, 200);
  }

  pause(): void {
    if (!this.isPaused) {
      this.pausedTime = this.getElapsedMs();
      this.isPaused = true;
      clearInterval(this.intervalId);
    }
  }

  resume(): void {
    if (this.isPaused) {
      const elapsed = this.pausedTime;
      this.startTime = Date.now() - elapsed;
      this.isPaused = false;
      this.intervalId = setInterval(() => {
        const newElapsed = this.getElapsedMs();
        this.tickCb?.(newElapsed);
        if (newElapsed >= this.durationMs) {
          this.expired = true;
          clearInterval(this.intervalId);
          this.expireCb?.();
        }
      }, 200);
    }
  }

  reset(): void {
    this.startTime = 0;
    this.pausedTime = 0;
    this.isPaused = false;
    this.expired = false;
    clearInterval(this.intervalId);
  }

  isExpired(): boolean {
    return this.expired;
  }

  onTick(callback: (elapsed: number) => void): void {
    this.tickCb = callback;
  }

  onExpire(callback: () => void): void {
    this.expireCb = callback;
  }
}

// ── Standard Scoring ──────────────────────────────────

export class StandardScoring implements IScoringStrategy {
  calculateWpm(correctChars: number, elapsedMs: number): number {
    if (elapsedMs < 1000) return 0;
    const minutes = elapsedMs / 60000;
    const wordsTyped = Math.floor(correctChars / 5);
    return minutes > 0 ? Math.round(wordsTyped / minutes) : 0;
  }

  calculateRawWpm(totalChars: number, elapsedMs: number): number {
    if (elapsedMs < 1000) return 0;
    const minutes = elapsedMs / 60000;
    const wordsTyped = Math.floor(totalChars / 5);
    return minutes > 0 ? Math.round(wordsTyped / minutes) : 0;
  }

  calculateNetWpm(
    correctChars: number,
    errors: number,
    elapsedMs: number
  ): number {
    const netChars = Math.max(0, correctChars - errors);
    return this.calculateWpm(netChars, elapsedMs);
  }

  calculateAccuracy(correctKeystrokes: number, totalKeystrokes: number): number {
    if (totalKeystrokes <= 0) return 1;
    return correctKeystrokes / totalKeystrokes;
  }

  calculateStars(
    wpm: number,
    accuracy: number,
    threshold: LevelThreshold,
    errorCount: number
  ): number {
    const { passWpm, passAccuracy } = threshold;
    if (wpm < passWpm || accuracy < passAccuracy) return 0;

    const meets2Star = wpm >= Math.round(passWpm * 1.15) && accuracy >= 0.95;
    const meets3Star =
      wpm >= Math.round(passWpm * 1.3) && accuracy >= 0.98 && errorCount === 0;

    if (meets3Star) return 3;
    if (meets2Star) return 2;
    return 1;
  }

  calculateConsistency(wpmSamples: number[]): number {
    if (wpmSamples.length < 2) return 100;
    const avg = wpmSamples.reduce((s, v) => s + v, 0) / wpmSamples.length;
    if (avg === 0) return 100;
    const variance =
      wpmSamples.reduce((s, v) => s + (v - avg) ** 2, 0) / wpmSamples.length;
    const stdDev = Math.sqrt(variance);
    const cv = stdDev / avg;
    return Math.max(0, Math.round((1 - cv) * 100));
  }
}

// ── Combo System ──────────────────────────────────────

export class StandardComboSystem implements IComboSystem {
  private combo = 0;
  private maxCombo = 0;

  getCombo(): number {
    return this.combo;
  }

  getMaxCombo(): number {
    return this.maxCombo;
  }

  getGaugeProgress(): number {
    return Math.min(this.combo / 30, 1);
  }

  getActiveTierIndex(): number {
    let idx = 0;
    for (let i = COMBO_TIERS.length - 1; i >= 0; i--) {
      if (this.combo >= COMBO_TIERS[i].minStreak) {
        idx = i;
        break;
      }
    }
    return idx;
  }

  addCorrect(): void {
    this.combo++;
    this.maxCombo = Math.max(this.maxCombo, this.combo);
  }

  resetCombo(): void {
    this.combo = 0;
  }

  reset(): void {
    this.combo = 0;
    this.maxCombo = 0;
  }
}

// ── Telemetry Pipeline ────────────────────────────────

export class TelemetryPipeline implements ITelemetryPipeline {
  private buffer: Array<{ type: string; data: Record<string, unknown>; timestamp: number }> = [];
  private flushInterval: ReturnType<typeof setInterval>;
  private apiEndpoint: string;

  constructor(apiEndpoint = "/api/v1/telemetry/batch", autoFlushMs = 5000) {
    this.apiEndpoint = apiEndpoint;
    this.flushInterval = setInterval(() => this.flush(), autoFlushMs);
  }

  track(event: { type: string; data: Record<string, unknown> }): void {
    this.buffer.push({ ...event, timestamp: Date.now() });
    if (this.buffer.length >= 50) this.flush();
  }

  async flush(): Promise<void> {
    if (this.buffer.length === 0) return;
    const batch = [...this.buffer];
    this.buffer = [];
    try {
      await fetch(this.apiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ events: batch }),
        keepalive: true,
      });
    } catch {
      // Silent failure — never block gameplay
    }
  }

  getBufferSize(): number {
    return this.buffer.length;
  }

  destroy(): void {
    clearInterval(this.flushInterval);
    this.flush();
  }
}

// ── Text Providers ────────────────────────────────────

export class LevelTextProvider implements ITextProvider {
  private levelId: number;
  private playerId: number;
  private cached: TextBundle | null = null;

  constructor(levelId: number, playerId: number) {
    this.levelId = levelId;
    this.playerId = playerId;
  }

  async getText(): Promise<TextBundle> {
    if (this.cached) return this.cached;
    try {
      const detail = await api.getLevelDetail(this.levelId, this.playerId);
      this.cached = {
        content: detail.paragraph,
        source: "level",
        metadata: { levelId: this.levelId, name: detail.name, tier: detail.tier },
      };
      return this.cached;
    } catch {
      // Fallback
      this.cached = {
        content: "The fire burns brightly. A hot flame forges the stone.",
        source: "level",
        metadata: { levelId: this.levelId, fallback: true },
      };
      return this.cached;
    }
  }

  getMetadata(): Record<string, unknown> {
    return this.cached?.metadata ?? {};
  }
}

export class ContestTextProvider implements ITextProvider {
  private playerId: number;
  private cached: TextBundle | null = null;

  constructor(playerId: number) {
    this.playerId = playerId;
  }

  async getText(): Promise<TextBundle> {
    if (this.cached) return this.cached;
    try {
      const contest = await api.getCurrentContest(this.playerId);
      this.cached = {
        content: contest.paragraph,
        source: "contest",
        metadata: {
          contestId: contest.contest_id,
          difficulty: contest.difficulty,
        },
      };
      return this.cached;
    } catch {
      this.cached = {
        content: "Contest paragraph unavailable. The molten core accelerates beyond all known limits.",
        source: "contest",
        metadata: { fallback: true },
      };
      return this.cached;
    }
  }

  getMetadata(): Record<string, unknown> {
    return this.cached?.metadata ?? {};
  }
}

export class FreePracticeTextProvider implements ITextProvider {
  private paragraph: string;

  constructor(paragraph: string) {
    this.paragraph = paragraph;
  }

  async getText(): Promise<TextBundle> {
    return {
      content: this.paragraph,
      source: "practice",
      metadata: { generated: true },
    };
  }

  getMetadata(): Record<string, unknown> {
    return { generated: true };
  }
}

// ── Code snippet pools for Coder Mode ──────────────────
// Each snippet is real, valid code — organized by difficulty.
// All content is strictly coding and computer science.

interface CodeSnippet {
  code: string;
  language: string;
}

const LANGUAGE_COLORS: Record<string, string> = {
  JavaScript: '#F7DF1E',
  TypeScript: '#3178C6',
  Python: '#3776AB',
  Go: '#00ADD8',
  Java: '#ED8B00',
  'C++': '#00599C',
  Rust: '#DEA584',
};

const EASY_SNIPPETS: CodeSnippet[] = [
  { code: "function add(a, b) {\n  return a + b;\n}\n" +
    "\n" +
    "function multiply(a, b) {\n  return a * b;\n}\n" +
    "\n" +
    "function square(n) {\n  return n * n;\n}\n" +
    "\n" +
    "function cube(n) {\n  return n * n * n;\n}", language: 'JavaScript' },
  { code: "function factorial(n) {\n  if (n <= 1) {\n    return 1;\n  }\n" +
    "  let result = 1;\n" +
    "  for (let i = 2; i <= n; i++) {\n" +
    "    result *= i;\n" +
    "  }\n" +
    "  return result;\n}", language: 'JavaScript' },
  { code: "function reverseString(s) {\n  return s.split('').reverse().join('');\n}\n" +
    "\n" +
    "function isPalindrome(s) {\n  return s === s.split('').reverse().join('');\n}\n" +
    "\n" +
    "function arraySum(arr) {\n  return arr.reduce((sum, n) => sum + n, 0);\n}", language: 'JavaScript' },
  { code: "interface User {\n  id: number;\n  name: string;\n  email: string;\n}\n" +
    "\n" +
    "function getUser(id: number): User {\n" +
    "  return { id, name: 'Alice', email: 'alice@example.com' };\n}\n" +
    "\n" +
    "type Point = { x: number; y: number };\n" +
    "\n" +
    "function distance(a: Point, b: Point): number {\n" +
    "  return Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2);\n}", language: 'TypeScript' },
  { code: "def greet(name):\n" +
    "    return f'Hello, {name}!\n" +
    "\n" +
    "def is_positive(n):\n" +
    "    return n > 0\n" +
    "\n" +
    "def celsius_to_fahrenheit(c):\n" +
    "    return (c * 9 / 5) + 32", language: 'Python' },
  { code: "def count_vowels(s):\n" +
    "    vowels = set('aeiou')\n" +
    "    return sum(1 for char in s.lower() if char in vowels)\n" +
    "\n" +
    "def first_non_repeating(s):\n" +
    "    from collections import Counter\n" +
    "    counts = Counter(s)\n" +
    "    for i, char in enumerate(s):\n" +
    "        if counts[char] == 1:\n" +
    "            return i\n" +
    "    return -1", language: 'Python' },
  { code: "func add(a int, b int) int {\n" +
    "  return a + b\n}\n" +
    "\n" +
    "func multiply(a int, b int) int {\n" +
    "  return a * b\n}\n" +
    "\n" +
    "func isEven(n int) bool {\n" +
    "  return n % 2 == 0\n}", language: 'Go' },
  { code: "public class Calculator {\n" +
    "  public static int add(int a, int b) {\n" +
    "    return a + b;\n" +
    "  }\n" +
    "\n" +
    "  public static int square(int n) {\n" +
    "    return n * n;\n" +
    "  }\n" +
    "\n" +
    "  public static boolean isEven(int n) {\n" +
    "    return n % 2 == 0;\n" +
    "  }\n}", language: 'Java' },
  { code: "#include <iostream>\n" +
    "using namespace std;\n" +
    "\n" +
    "int factorial(int n) {\n" +
    "  if (n <= 1) return 1;\n" +
    "  int result = 1;\n" +
    "  for (int i = 2; i <= n; i++) {\n" +
    "    result *= i;\n" +
    "  }\n" +
    "  return result;\n}\n" +
    "\n" +
    "bool isPrime(int n) {\n" +
    "  if (n < 2) return false;\n" +
    "  for (int i = 2; i * i <= n; i++) {\n" +
    "    if (n % i == 0) return false;\n" +
    "  }\n" +
    "  return true;\n}", language: 'C++' },
  { code: "fn add(a: i32, b: i32) -> i32 {\n" +
    "  a + b\n}\n" +
    "\n" +
    "fn square(n: i32) -> i32 {\n" +
    "  n * n\n}\n" +
    "\n" +
    "fn factorial(n: u32) -> u32 {\n" +
    "  (1..=n).product()\n}\n" +
    "\n" +
    "fn is_even(n: i32) -> bool {\n" +
    "  n % 2 == 0\n}", language: 'Rust' },
];

const MEDIUM_SNIPPETS: CodeSnippet[] = [
  { code: "class ListNode {\n" +
    "  constructor(val, next = null) {\n" +
    "    this.val = val;\n" +
    "    this.next = next;\n" +
    "  }\n}\n" +
    "\n" +
    "function reverseList(head) {\n" +
    "  let prev = null;\n" +
    "  let curr = head;\n" +
    "  while (curr) {\n" +
    "    const next = curr.next;\n" +
    "    curr.next = prev;\n" +
    "    prev = curr;\n" +
    "    curr = next;\n" +
    "  }\n" +
    "  return prev;\n}", language: 'JavaScript' },
  { code: "class TreeNode {\n" +
    "  constructor(val) {\n" +
    "    this.val = val;\n" +
    "    this.left = null;\n" +
    "    this.right = null;\n" +
    "  }\n}\n" +
    "\n" +
    "function inorderTraversal(root) {\n" +
    "  const result = [];\n" +
    "  function dfs(node) {\n" +
    "    if (!node) return;\n" +
    "    dfs(node.left);\n" +
    "    result.push(node.val);\n" +
    "    dfs(node.right);\n" +
    "  }\n" +
    "  dfs(root);\n" +
    "  return result;\n}", language: 'JavaScript' },
  { code: "function isValidParentheses(s) {\n" +
    "  const stack = [];\n" +
    "  const map = { '(': ')', '{': '}', '[': ']' };\n" +
    "  for (const char of s) {\n" +
    "    if (map[char]) {\n" +
    "      stack.push(map[char]);\n" +
    "    } else if (stack.pop() !== char) {\n" +
    "      return false;\n" +
    "    }\n" +
    "  }\n" +
    "  return stack.length === 0;\n}", language: 'JavaScript' },
  { code: "def bubble_sort(arr):\n" +
    "    n = len(arr)\n" +
    "    for i in range(n):\n" +
    "        for j in range(0, n - i - 1):\n" +
    "            if arr[j] > arr[j + 1]:\n" +
    "                arr[j], arr[j + 1] = arr[j + 1], arr[j]\n" +
    "    return arr\n" +
    "\n" +
    "def merge_sort(arr):\n" +
    "    if len(arr) <= 1:\n" +
    "        return arr\n" +
    "    mid = len(arr) // 2\n" +
    "    left = merge_sort(arr[:mid])\n" +
    "    right = merge_sort(arr[mid:])\n" +
    "    i = j = 0\n" +
    "    result = []\n" +
    "    while i < len(left) and j < len(right):\n" +
    "        if left[i] < right[j]:\n" +
    "            result.append(left[i])\n" +
    "            i += 1\n" +
    "        else:\n" +
    "            result.append(right[j])\n" +
    "            j += 1\n" +
    "    return result + left[i:] + right[j:]", language: 'Python' },
  { code: "def group_anagrams(strs):\n" +
    "    from collections import defaultdict\n" +
    "    groups = defaultdict(list)\n" +
    "    for s in strs:\n" +
    "        key = ''.join(sorted(s))\n" +
    "        groups[key].append(s)\n" +
    "    return list(groups.values())\n" +
    "\n" +
    "def max_subarray(nums):\n" +
    "    max_sum = current_sum = nums[0]\n" +
    "    for num in nums[1:]:\n" +
    "        current_sum = max(num, current_sum + num)\n" +
    "        max_sum = max(max_sum, current_sum)\n" +
    "    return max_sum", language: 'Python' },
  { code: "func isPalindrome(s string) bool {\n" +
    "  runes := []rune(s)\n" +
    "  for i, j := 0, len(runes)-1; i < j; i, j = i+1, j-1 {\n" +
    "    if runes[i] != runes[j] {\n" +
    "      return false\n" +
    "    }\n" +
    "  }\n" +
    "  return true\n}\n" +
    "\n" +
    "func maxSubarray(nums []int) int {\n" +
    "  maxSum := nums[0]\n" +
    "  currentSum := nums[0]\n" +
    "  for _, num := range nums[1:] {\n" +
    "    if num > currentSum+num {\n" +
    "      currentSum = num\n" +
    "    } else {\n" +
    "      currentSum = currentSum + num\n" +
    "    }\n" +
    "    if currentSum > maxSum {\n" +
    "      maxSum = currentSum\n" +
    "    }\n" +
    "  }\n" +
    "  return maxSum\n}", language: 'Go' },
  { code: "class ListNode {\n" +
    "  int val;\n" +
    "  ListNode next;\n" +
    "  ListNode(int x) { val = x; }\n}\n" +
    "\n" +
    "class Solution {\n" +
    "  public ListNode reverseList(ListNode head) {\n" +
    "    ListNode prev = null;\n" +
    "    ListNode curr = head;\n" +
    "    while (curr != null) {\n" +
    "      ListNode next = curr.next;\n" +
    "      curr.next = prev;\n" +
    "      prev = curr;\n" +
    "      curr = next;\n" +
    "    }\n" +
    "    return prev;\n" +
    "  }\n}", language: 'Java' },
  { code: "#include <vector>\n" +
    "using namespace std;\n" +
    "\n" +
    "int binarySearch(vector<int>& arr, int target) {\n" +
    "  int left = 0;\n" +
    "  int right = arr.size() - 1;\n" +
    "  while (left <= right) {\n" +
    "    int mid = left + (right - left) / 2;\n" +
    "    if (arr[mid] == target) return mid;\n" +
    "    if (arr[mid] < target) {\n" +
    "      left = mid + 1;\n" +
    "    } else {\n" +
    "      right = mid - 1;\n" +
    "    }\n" +
    "  }\n" +
    "  return -1;\n}", language: 'C++' },
];

const HARD_SNIPPETS: CodeSnippet[] = [
  { code: "function longestPalindrome(s) {\n" +
    "  let start = 0;\n" +
    "  let maxLen = 1;\n" +
    "  function expand(l, r) {\n" +
    "    while (l >= 0 && r < s.length && s[l] === s[r]) {\n" +
    "      if (r - l + 1 > maxLen) {\n" +
    "        start = l;\n" +
    "        maxLen = r - l + 1;\n" +
    "      }\n" +
    "      l--;\n" +
    "      r++;\n" +
    "    }\n" +
    "  }\n" +
    "  for (let i = 0; i < s.length; i++) {\n" +
    "    expand(i, i);\n" +
    "    expand(i, i + 1);\n" +
    "  }\n" +
    "  return s.slice(start, start + maxLen);\n}", language: 'JavaScript' },
  { code: "class LRUCache {\n" +
    "  constructor(capacity) {\n" +
    "    this.capacity = capacity;\n" +
    "    this.cache = new Map();\n" +
    "  }\n" +
    "  get(key) {\n" +
    "    if (!this.cache.has(key)) return -1;\n" +
    "    const value = this.cache.get(key);\n" +
    "    this.cache.delete(key);\n" +
    "    this.cache.set(key, value);\n" +
    "    return value;\n" +
    "  }\n" +
    "  put(key, value) {\n" +
    "    if (this.cache.has(key)) {\n" +
    "      this.cache.delete(key);\n" +
    "    }\n" +
    "    this.cache.set(key, value);\n" +
    "    if (this.cache.size > this.capacity) {\n" +
    "      const firstKey = this.cache.keys().next().value;\n" +
    "      this.cache.delete(firstKey);\n" +
    "    }\n" +
    "  }\n}", language: 'JavaScript' },
  { code: "class TrieNode {\n" +
    "  constructor() {\n" +
    "    this.children = {};\n" +
    "    this.isEnd = false;\n" +
    "  }\n}\n" +
    "\n" +
    "class Trie {\n" +
    "  constructor() {\n" +
    "    this.root = new TrieNode();\n" +
    "  }\n" +
    "  insert(word) {\n" +
    "    let node = this.root;\n" +
    "    for (const ch of word) {\n" +
    "      if (!node.children[ch]) {\n" +
    "        node.children[ch] = new TrieNode();\n" +
    "      }\n" +
    "      node = node.children[ch];\n" +
    "    }\n" +
    "    node.isEnd = true;\n" +
    "  }\n" +
    "  search(word) {\n" +
    "    let node = this.root;\n" +
    "    for (const ch of word) {\n" +
    "      if (!node.children[ch]) return false;\n" +
    "      node = node.children[ch];\n" +
    "    }\n" +
    "    return node.isEnd;\n" +
    "  }\n" +
    "  startsWith(prefix) {\n" +
    "    let node = this.root;\n" +
    "    for (const ch of prefix) {\n" +
    "      if (!node.children[ch]) return false;\n" +
    "      node = node.children[ch];\n" +
    "    }\n" +
    "    return true;\n" +
    "  }\n}", language: 'JavaScript' },
  { code: "def serialize(root):\n" +
    "    if not root:\n" +
    "        return 'null'\n" +
    "    left = serialize(root.left)\n" +
    "    right = serialize(root.right)\n" +
    "    return f'{root.val},{left},{right}'\n" +
    "\n" +
    "def deserialize(data):\n" +
    "    nodes = data.split(',')\n" +
    "    def build():\n" +
    "        val = nodes.pop(0)\n" +
    "        if val == 'null':\n" +
    "            return None\n" +
    "        node = TreeNode(int(val))\n" +
    "        node.left = build()\n" +
    "        node.right = build()\n" +
    "        return node\n" +
    "    return build()\n" +
    "\n" +
    "def coin_change(coins, amount):\n" +
    "    dp = [float('inf')] * (amount + 1)\n" +
    "    dp[0] = 0\n" +
    "    for coin in coins:\n" +
    "        for x in range(coin, amount + 1):\n" +
    "            dp[x] = min(dp[x], dp[x - coin] + 1)\n" +
    "    return dp[amount] if dp[amount] != float('inf') else -1", language: 'Python' },
  { code: "type EventHandler = (...args: any[]) => void;\n" +
    "\n" +
    "class EventEmitter {\n" +
    "  private handlers = new Map<string, EventHandler[]>();\n" +
    "\n" +
    "  on(event: string, handler: EventHandler) {\n" +
    "    if (!this.handlers.has(event)) {\n" +
    "      this.handlers.set(event, []);\n" +
    "    }\n" +
    "    this.handlers.get(event)!.push(handler);\n" +
    "  }\n" +
    "\n" +
    "  emit(event: string, ...args: any[]) {\n" +
    "    this.handlers.get(event)?.forEach(h => h(...args));\n" +
    "  }\n" +
    "\n" +
    "  off(event: string, handler: EventHandler) {\n" +
    "    const handlers = this.handlers.get(event);\n" +
    "    if (handlers) {\n" +
    "      this.handlers.set(event, handlers.filter(x => x !== handler));\n" +
    "    }\n" +
    "  }\n}", language: 'TypeScript' },
  { code: "func mergeSort(arr []int) []int {\n" +
    "  if len(arr) <= 1 {\n" +
    "    return arr\n" +
    "  }\n" +
    "  mid := len(arr) / 2\n" +
    "  left := mergeSort(arr[:mid])\n" +
    "  right := mergeSort(arr[mid:])\n" +
    "  return merge(left, right)\n}\n" +
    "\n" +
    "func merge(left, right []int) []int {\n" +
    "  result := make([]int, 0, len(left)+len(right))\n" +
    "  i, j := 0, 0\n" +
    "  for i < len(left) && j < len(right) {\n" +
    "    if left[i] < right[j] {\n" +
    "      result = append(result, left[i])\n" +
    "      i++\n" +
    "    } else {\n" +
    "      result = append(result, right[j])\n" +
    "      j++\n" +
    "    }\n" +
    "  }\n" +
    "  result = append(result, left[i:]...)\n" +
    "  result = append(result, right[j:]...)\n" +
    "  return result\n}", language: 'Go' },
];

export class CoderTextProvider implements ITextProvider {
  private playerId: number;
  private difficulty: string;
  private cached: TextBundle | null = null;

  constructor(playerId: number, difficulty: string = "easy") {
    this.playerId = playerId;
    this.difficulty = difficulty;
  }

  async getText(): Promise<TextBundle> {
    if (this.cached) return this.cached;

    // Select pool based on difficulty
    const pool = this.difficulty === "hard" ? HARD_SNIPPETS : this.difficulty === "medium" ? MEDIUM_SNIPPETS : EASY_SNIPPETS;

    // Pick a random snippet from the pool
    const idx = Math.floor(Math.random() * pool.length);
    const snippet = pool[idx];

    this.cached = {
      content: snippet.code,
      source: "coder",
      metadata: { 
        difficulty: this.difficulty, 
        snippetCount: pool.length,
        language: snippet.language,
        languageColor: LANGUAGE_COLORS[snippet.language] ?? '#888888',
      },
    };

    return this.cached;
  }

  getMetadata(): Record<string, unknown> {
    return this.cached?.metadata ?? {};
  }
}

// ── Lesson Text Provider ─────────────────────────────

export class LessonTextProvider implements ITextProvider {
  private lessonId: number;
  private cached: TextBundle | null = null;

  constructor(lessonId: number) {
    this.lessonId = lessonId;
  }

  async getText(): Promise<TextBundle> {
    if (this.cached) return this.cached;

    // Dynamically import lessons data
    try {
      const { getLessonById } = await import("@/lib/lessons");
      const lesson = getLessonById(this.lessonId);
      if (lesson) {
        this.cached = {
          content: lesson.paragraph,
          source: "practice",
          metadata: { lessonId: this.lessonId, name: lesson.name },
        };
        return this.cached;
      }
    } catch {
      // Fall through to fallback
    }

    this.cached = {
      content: "Type the letters f and j to practice your home row position.",
      source: "practice",
      metadata: { lessonId: this.lessonId, fallback: true },
    };
    return this.cached;
  }

  getMetadata(): Record<string, unknown> {
    return this.cached?.metadata ?? {};
  }
}

export class EnterpriseTextProvider implements ITextProvider {
  private customText: string;

  constructor(customText: string) {
    this.customText = customText;
  }

  async getText(): Promise<TextBundle> {
    return {
      content: this.customText,
      source: "enterprise",
      metadata: { custom: true },
    };
  }

  getMetadata(): Record<string, unknown> {
    return { custom: true };
  }
}

// ── Stall Detector ────────────────────────────────────

export class StallDetector {
  private timeoutMs: number;
  private timer?: ReturnType<typeof setTimeout>;
  private onStall?: () => void;
  private onUnstall?: () => void;
  private isStalled = false;

  constructor(timeoutMs = STALL_TIMEOUT_MS) {
    this.timeoutMs = timeoutMs;
  }

  onStallCallback(cb: () => void): void {
    this.onStall = cb;
  }

  onUnstallCallback(cb: () => void): void {
    this.onUnstall = cb;
  }

  registerActivity(): void {
    clearTimeout(this.timer);
    if (this.isStalled) {
      this.isStalled = false;
      this.onUnstall?.();
    }
    this.timer = setTimeout(() => {
      this.isStalled = true;
      this.onStall?.();
    }, this.timeoutMs);
  }

  isCurrentlyStalled(): boolean {
    return this.isStalled;
  }

  reset(): void {
    clearTimeout(this.timer);
    this.isStalled = false;
  }

  destroy(): void {
    clearTimeout(this.timer);
  }
}
