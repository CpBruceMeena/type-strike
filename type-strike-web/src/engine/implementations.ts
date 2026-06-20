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

const EASY_SNIPPETS = [
  // Basic functions — JS
  "function add(a, b) { return a + b } function multiply(a, b) { return a * b } function square(n) { return n * n } function cube(n) { return n * n * n }",
  "function isEven(n) { return n % 2 === 0 } function isOdd(n) { return n % 2 !== 0 } function max(a, b) { return a > b ? a : b } function min(a, b) { return a < b ? a : b }",
  "function factorial(n) { if (n <= 1) return 1 let result = 1 for (let i = 2 i <= n i++) { result *= i } return result }",
  // Basic functions — Python
  "def greet(name): return f'Hello, {name}!' def add(a, b): return a + b def square(n): return n * n def is_positive(n): return n > 0",
  "def celsius_to_fahrenheit(c): return (c * 9/5) + 32 def fahrenheit_to_celsius(f): return (f - 32) * 5/9",
  "def count_vowels(s): vowels = set('aeiou') return sum(1 for char in s.lower() if char in vowels)",
  // Arrays & strings
  "function reverseString(s) { return s.split('').reverse().join('') } function isPalindrome(s) { return s === s.split('').reverse().join('') }",
  "function arraySum(arr) { return arr.reduce((sum, n) => sum + n, 0) } function arrayAverage(arr) { return arraySum(arr) / arr.length }",
  "def first_non_repeating(s): from collections import Counter counts = Counter(s) for i, char in enumerate(s): if counts[char] == 1: return i return -1",
  // Simple algorithms
  "function linearSearch(arr, target) { for (let i = 0 i < arr.length i++) { if (arr[i] === target) return i } return -1 }",
  "function binarySearch(arr, target) { let left = 0 let right = arr.length - 1 while (left <= right) { const mid = Math.floor((left + right) / 2) if (arr[mid] === target) return mid if (arr[mid] < target) { left = mid + 1 } else { right = mid - 1 } } return -1 }",
  "def bubble_sort(arr): n = len(arr) for i in range(n): for j in range(0, n - i - 1): if arr[j] > arr[j + 1]: arr[j], arr[j + 1] = arr[j + 1], arr[j] return arr",
  "function fibonacci(n) { if (n <= 1) return n let prev = 0 let curr = 1 for (let i = 2 i <= n i++) { const next = prev + curr prev = curr curr = next } return curr }",
  "function twoSum(nums, target) { const seen = new Map() for (let i = 0 i < nums.length i++) { const complement = target - nums[i] if (seen.has(complement)) return [seen.get(complement), i] seen.set(nums[i], i) } return [] }",
  "def is_anagram(s1, s2): return sorted(s1) == sorted(s2) def is_palindrome(s): return s == s[::-1]",
  // TypeScript basics
  "interface User { id: number name: string email: string } function getUser(id: number): User { return { id, name: 'Alice', email: 'alice@example.com' } }",
  "type Point = { x: number y: number } function distance(a: Point, b: Point): number { return Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2) }",
];

const MEDIUM_SNIPPETS = [
  // Linked lists
  "class ListNode { constructor(val, next = null) { this.val = val this.next = next } } function reverseList(head) { let prev = null let curr = head while (curr) { const next = curr.next curr.next = prev prev = curr curr = next } return prev }",
  "function mergeTwoLists(l1, l2) { const dummy = new ListNode(0) let curr = dummy while (l1 && l2) { if (l1.val < l2.val) { curr.next = l1 l1 = l1.next } else { curr.next = l2 l2 = l2.next } curr = curr.next } curr.next = l1 || l2 return dummy.next }",
  "def has_cycle(head): slow = fast = head while fast and fast.next: slow = slow.next fast = fast.next.next if slow == fast: return True return False",
  // Trees
  "class TreeNode { constructor(val) { this.val = val this.left = null this.right = null } } function inorderTraversal(root) { const result = [] function dfs(node) { if (!node) return dfs(node.left) result.push(node.val) dfs(node.right) } dfs(root) return result }",
  "function maxDepth(root) { if (!root) return 0 return 1 + Math.max(maxDepth(root.left), maxDepth(root.right)) }",
  "def is_valid_bst(root, min_val=float('-inf'), max_val=float('inf')): if not root: return True if root.val <= min_val or root.val >= max_val: return False return is_valid_bst(root.left, min_val, root.val) and is_valid_bst(root.right, root.val, max_val)",
  "function levelOrder(root) { if (!root) return [] const result = [] const queue = [root] while (queue.length) { const level = [] const size = queue.length for (let i = 0 i < size i++) { const node = queue.shift() level.push(node.val) if (node.left) queue.push(node.left) if (node.right) queue.push(node.right) } result.push(level) } return result }",
  // Hash maps & sets
  "function containsDuplicate(nums) { const seen = new Set() for (const n of nums) { if (seen.has(n)) return true seen.add(n) } return false }",
  "function intersection(nums1, nums2) { const set1 = new Set(nums1) const set2 = new Set(nums2) return [...set1].filter(x => set2.has(x)) }",
  "def group_anagrams(strs): from collections import defaultdict groups = defaultdict(list) for s in strs: key = ''.join(sorted(s)) groups[key].append(s) return list(groups.values())",
  // Dynamic programming basics
  "function climbStairs(n) { if (n <= 2) return n let prev1 = 1 let prev2 = 2 for (let i = 3 i <= n i++) { const curr = prev1 + prev2 prev1 = prev2 prev2 = curr } return prev2 }",
  "def max_subarray(nums): max_sum = current_sum = nums[0] for num in nums[1:]: current_sum = max(num, current_sum + num) max_sum = max(max_sum, current_sum) return max_sum",
  "function rob(nums) { if (!nums.length) return 0 if (nums.length === 1) return nums[0] let prev2 = nums[0] let prev1 = Math.max(nums[0], nums[1]) for (let i = 2 i < nums.length i++) { const curr = Math.max(prev1, prev2 + nums[i]) prev2 = prev1 prev1 = curr } return prev1 }",
  // Sorting
  "function quickSort(arr) { if (arr.length <= 1) return arr const pivot = arr[Math.floor(arr.length / 2)] const left = arr.filter(x => x < pivot) const middle = arr.filter(x => x === pivot) const right = arr.filter(x => x > pivot) return [...quickSort(left), ...middle, ...quickSort(right)] }",
  "def merge_sort(arr): if len(arr) <= 1: return arr mid = len(arr) // 2 left = merge_sort(arr[:mid]) right = merge_sort(arr[mid:]) i = j = 0 result = [] while i < len(left) and j < len(right): if left[i] < right[j]: result.append(left[i]) i += 1 else: result.append(right[j]) j += 1 return result + left[i:] + right[j:]",
  // Stacks & queues
  "function isValidParentheses(s) { const stack = [] const map = { '(': ')', '{': '}', '[': ']' } for (const char of s) { if (map[char]) { stack.push(map[char]) } else if (stack.pop() !== char) { return false } } return stack.length === 0 }",
  "class MinStack { constructor() { this.stack = [] this.minStack = [] } push(val) { this.stack.push(val) if (!this.minStack.length || val <= this.minStack.at(-1)) this.minStack.push(val) } pop() { if (this.stack.pop() === this.minStack.at(-1)) this.minStack.pop() } getMin() { return this.minStack.at(-1) } }",
];

const HARD_SNIPPETS = [
  // Advanced DSA
  "function longestPalindrome(s) { let start = 0 let maxLen = 1 function expand(l, r) { while (l >= 0 && r < s.length && s[l] === s[r]) { if (r - l + 1 > maxLen) { start = l maxLen = r - l + 1 } l-- r++ } } for (let i = 0 i < s.length i++) { expand(i, i) expand(i, i + 1) } return s.slice(start, start + maxLen) }",
  "def longest_substring_without_repeating(s): char_set = set() left = max_len = 0 for right in range(len(s)): while s[right] in char_set: char_set.remove(s[left]) left += 1 char_set.add(s[right]) max_len = max(max_len, right - left + 1) return max_len",
  "function numIslands(grid) { let count = 0 function dfs(r, c) { if (r < 0 || r >= grid.length || c < 0 || c >= grid[0].length || grid[r][c] === '0') return grid[r][c] = '0' dfs(r+1, c) dfs(r-1, c) dfs(r, c+1) dfs(r, c-1) } for (let r = 0 r < grid.length r++) { for (let c = 0 c < grid[0].length c++) { if (grid[r][c] === '1') { count++ dfs(r, c) } } } return count }",
  "def coin_change(coins, amount): dp = [float('inf')] * (amount + 1) dp[0] = 0 for coin in coins: for x in range(coin, amount + 1): dp[x] = min(dp[x], dp[x - coin] + 1) return dp[amount] if dp[amount] != float('inf') else -1",
  "function findDuplicate(nums) { let slow = nums[0] let fast = nums[0] do { slow = nums[slow] fast = nums[nums[fast]] } while (slow !== fast) slow = nums[0] while (slow !== fast) { slow = nums[slow] fast = nums[fast] } return slow }",
  // LRU Cache & system design patterns
  "class LRUCache { constructor(capacity) { this.capacity = capacity this.cache = new Map() } get(key) { if (!this.cache.has(key)) return -1 const value = this.cache.get(key) this.cache.delete(key) this.cache.set(key, value) return value } put(key, value) { if (this.cache.has(key)) this.cache.delete(key) this.cache.set(key, value) if (this.cache.size > this.capacity) this.cache.delete(this.cache.keys().next().value) } }",
  "class TrieNode { constructor() { this.children = {} this.isEnd = false } } class Trie { constructor() { this.root = new TrieNode() } insert(word) { let node = this.root for (const ch of word) { if (!node.children[ch]) node.children[ch] = new TrieNode() node = node.children[ch] } node.isEnd = true } search(word) { let node = this.root for (const ch of word) { if (!node.children[ch]) return false node = node.children[ch] } return node.isEnd } startsWith(prefix) { let node = this.root for (const ch of prefix) { if (!node.children[ch]) return false node = node.children[ch] } return true } }",
  // Serialization & complex recursion
  "def serialize(root): if not root: return 'null' left = serialize(root.left) right = serialize(root.right) return f'{root.val},{left},{right}' def deserialize(data): nodes = data.split(',') def build(): val = nodes.pop(0) if val == 'null': return None node = TreeNode(int(val)) node.left = build() node.right = build() return node return build()",
  // Union Find / Disjoint Set
  "class UnionFind { constructor(n) { this.parent = Array.from({length: n}, (_, i) => i) this.rank = new Array(n).fill(0) } find(x) { if (this.parent[x] !== x) this.parent[x] = this.find(this.parent[x]) return this.parent[x] } union(x, y) { let px = this.find(x) let py = this.find(y) if (px === py) return if (this.rank[px] < this.rank[py]) { this.parent[px] = py } else if (this.rank[px] > this.rank[py]) { this.parent[py] = px } else { this.parent[py] = px this.rank[px]++ } } }",
  // Go concurrency
  "func mergeSort(arr []int) []int { if len(arr) <= 1 { return arr } mid := len(arr) / 2 left := mergeSort(arr[:mid]) right := mergeSort(arr[mid:]) return merge(left, right) } func merge(left, right []int) []int { result := make([]int, 0, len(left)+len(right)) i, j := 0, 0 for i < len(left) && j < len(right) { if left[i] < right[j] { result = append(result, left[i]) i++ } else { result = append(result, right[j]) j++ } } result = append(result, left[i:]...) result = append(result, right[j:]...) return result }",
  // Rust ownership
  "fn fibonacci(n: u32) -> u32 { match n { 0 => 0, 1 => 1, _ => fibonacci(n - 1) + fibonacci(n - 2) } } fn is_prime(n: u32) -> bool { if n < 2 { return false } for i in 2..=(n as f64).sqrt() as u32 { if n % i == 0 { return false } } true }",
  // Advanced tree
  "function lowestCommonAncestor(root, p, q) { if (!root || root === p || root === q) return root const left = lowestCommonAncestor(root.left, p, q) const right = lowestCommonAncestor(root.right, p, q) if (left && right) return root return left || right }",
  "def top_k_frequent(nums, k): from collections import Counter import heapq counts = Counter(nums) return [num for num, _ in heapq.nlargest(k, counts.items(), key=lambda x: x[1])]",
  // Design patterns
  "class Singleton { static #instance constructor() { if (Singleton.#instance) return Singleton.#instance Singleton.#instance = this } static getInstance() { if (!Singleton.#instance) Singleton.#instance = new Singleton() return Singleton.#instance } }",
  "type EventHandler = (...args: any[]) => void class EventEmitter { private handlers = new Map<string, EventHandler[]>() on(event: string, handler: EventHandler) { if (!this.handlers.has(event)) this.handlers.set(event, []) this.handlers.get(event)!.push(handler) } emit(event: string, ...args: any[]) { this.handlers.get(event)?.forEach(h => h(...args)) } off(event: string, handler: EventHandler) { const h = this.handlers.get(event) if (h) this.handlers.set(event, h.filter(x => x !== handler)) } }",
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
    const snippet = pool[Math.floor(Math.random() * pool.length)];

    this.cached = {
      content: snippet,
      source: "coder",
      metadata: { difficulty: this.difficulty, snippetCount: pool.length },
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
