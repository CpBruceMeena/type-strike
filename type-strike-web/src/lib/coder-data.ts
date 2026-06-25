/**
 * Type Strike — Coder Mode Snippet Data
 *
 * All code snippets organized by difficulty with descriptive titles.
 * Sourced by both the hub page (for browsing) and CoderTextProvider (for gameplay).
 */

// ── Types ────────────────────────────────────────────────

export interface CodeSnippet {
  code: string;
  language: string;
  title: string;
}

// ── Language Colors ──────────────────────────────────────

export const LANGUAGE_COLORS: Record<string, string> = {
  JavaScript: '#F7DF1E',
  TypeScript: '#3178C6',
  Python: '#3776AB',
  Go: '#00ADD8',
  Java: '#ED8B00',
  'C++': '#00599C',
  Rust: '#DEA584',
};

export const ALL_LANGUAGES = Object.keys(LANGUAGE_COLORS);

// ── Difficulty Config ────────────────────────────────────

export interface DifficultyConfig {
  key: string;
  label: string;
  description: string;
  icon: string;
  color: string;
}

export const DIFFICULTIES: DifficultyConfig[] = [
  { key: 'easy', label: 'EASY', description: 'Basic algorithms & syntax', icon: '🔤', color: '#22FF44' },
  { key: 'medium', label: 'MEDIUM', description: 'Data structures & patterns', icon: '⚙️', color: '#FFCC00' },
  { key: 'hard', label: 'HARD', description: 'Advanced DSA & optimizations', icon: '🚀', color: '#FF5020' },
];

// ── Easy Snippets ────────────────────────────────────────

const EASY_SNIPPETS: CodeSnippet[] = [
  {
    title: 'Arithmetic Functions',
    language: 'JavaScript',
    code: "function add(a, b) {\n  return a + b;\n}\n\nfunction multiply(a, b) {\n  return a * b;\n}\n\nfunction square(n) {\n  return n * n;\n}\n\nfunction cube(n) {\n  return n * n * n;\n}",
  },
  {
    title: 'Factorial',
    language: 'JavaScript',
    code: "function factorial(n) {\n  if (n <= 1) {\n    return 1;\n  }\n  let result = 1;\n  for (let i = 2; i <= n; i++) {\n    result *= i;\n  }\n  return result;\n}",
  },
  {
    title: 'String & Array Utilities',
    language: 'JavaScript',
    code: "function reverseString(s) {\n  return s.split('').reverse().join('');\n}\n\nfunction isPalindrome(s) {\n  return s === s.split('').reverse().join('');\n}\n\nfunction arraySum(arr) {\n  return arr.reduce((sum, n) => sum + n, 0);\n}",
  },
  {
    title: 'TypeScript Interfaces',
    language: 'TypeScript',
    code: "interface User {\n  id: number;\n  name: string;\n  email: string;\n}\n\nfunction getUser(id: number): User {\n  return { id, name: 'Alice', email: 'alice@example.com' };\n}\n\ntype Point = { x: number; y: number };\n\nfunction distance(a: Point, b: Point): number {\n  return Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2);\n}",
  },
  {
    title: 'Python Helpers',
    language: 'Python',
    code: "def greet(name):\n    return f'Hello, {name}!'\n\n\ndef is_positive(n):\n    return n > 0\n\n\ndef celsius_to_fahrenheit(c):\n    return (c * 9 / 5) + 32",
  },
  {
    title: 'String Analysis',
    language: 'Python',
    code: "def count_vowels(s):\n    vowels = set('aeiou')\n    return sum(1 for char in s.lower() if char in vowels)\n\n\ndef first_non_repeating(s):\n    from collections import Counter\n    counts = Counter(s)\n    for i, char in enumerate(s):\n        if counts[char] == 1:\n            return i\n    return -1",
  },
  {
    title: 'Go Basics',
    language: 'Go',
    code: "func add(a int, b int) int {\n  return a + b\n}\n\nfunc multiply(a int, b int) int {\n  return a * b\n}\n\nfunc isEven(n int) bool {\n  return n % 2 == 0\n}",
  },
  {
    title: 'Java Calculator',
    language: 'Java',
    code: "public class Calculator {\n  public static int add(int a, int b) {\n    return a + b;\n  }\n\n  public static int square(int n) {\n    return n * n;\n  }\n\n  public static boolean isEven(int n) {\n    return n % 2 == 0;\n  }\n}",
  },
  {
    title: 'C++ Math Functions',
    language: 'C++',
    code: "#include <iostream>\nusing namespace std;\n\nint factorial(int n) {\n  if (n <= 1) return 1;\n  int result = 1;\n  for (int i = 2; i <= n; i++) {\n    result *= i;\n  }\n  return result;\n}\n\nbool isPrime(int n) {\n  if (n < 2) return false;\n  for (int i = 2; i * i <= n; i++) {\n    if (n % i == 0) return false;\n  }\n  return true;\n}",
  },
  {
    title: 'Rust Functions',
    language: 'Rust',
    code: "fn add(a: i32, b: i32) -> i32 {\n  a + b\n}\n\nfn square(n: i32) -> i32 {\n  n * n\n}\n\nfn factorial(n: u32) -> u32 {\n  (1..=n).product()\n}\n\nfn is_even(n: i32) -> bool {\n  n % 2 == 0\n}",
  },
  {
    title: 'Fibonacci Sequence',
    language: 'JavaScript',
    code: "function fib(n) {\n  if (n <= 1) return n;\n  const dp = [0, 1];\n  for (let i = 2; i <= n; i++) {\n    dp[i] = dp[i - 1] + dp[i - 2];\n  }\n  return dp[n];\n}\n\nfunction fibMemo(n, memo = {}) {\n  if (n <= 1) return n;\n  if (memo[n] !== undefined) return memo[n];\n  memo[n] = fibMemo(n - 1, memo) + fibMemo(n - 2, memo);\n  return memo[n];\n}",
  },
  {
    title: 'Two Sum (HashMap)',
    language: 'Python',
    code: "def two_sum(nums, target):\n    seen = {}\n    for i, num in enumerate(nums):\n        complement = target - num\n        if complement in seen:\n            return [seen[complement], i]\n        seen[num] = i\n    return []\n\n\ndef contains_duplicate(nums):\n    return len(nums) != len(set(nums))",
  },
  {
    title: 'Binary Tree Depth',
    language: 'Python',
    code: "class TreeNode:\n    def __init__(self, val=0, left=None, right=None):\n        self.val = val\n        self.left = left\n        self.right = right\n\n\ndef max_depth(root):\n    if not root:\n        return 0\n    return 1 + max(max_depth(root.left), max_depth(root.right))\n\n\ndef invert_tree(root):\n    if not root:\n        return None\n    root.left, root.right = root.right, root.left\n    invert_tree(root.left)\n    invert_tree(root.right)\n    return root",
  },
];

// ── Medium Snippets ──────────────────────────────────────

const MEDIUM_SNIPPETS: CodeSnippet[] = [
  {
    title: 'Linked List Reversal',
    language: 'JavaScript',
    code: "class ListNode {\n  constructor(val, next = null) {\n    this.val = val;\n    this.next = next;\n  }\n}\n\nfunction reverseList(head) {\n  let prev = null;\n  let curr = head;\n  while (curr) {\n    const next = curr.next;\n    curr.next = prev;\n    prev = curr;\n    curr = next;\n  }\n  return prev;\n}",
  },
  {
    title: 'Binary Tree Traversal',
    language: 'JavaScript',
    code: "class TreeNode {\n  constructor(val) {\n    this.val = val;\n    this.left = null;\n    this.right = null;\n  }\n}\n\nfunction inorderTraversal(root) {\n  const result = [];\n  function dfs(node) {\n    if (!node) return;\n    dfs(node.left);\n    result.push(node.val);\n    dfs(node.right);\n  }\n  dfs(root);\n  return result;\n}",
  },
  {
    title: 'Parentheses Validator',
    language: 'JavaScript',
    code: "function isValidParentheses(s) {\n  const stack = [];\n  const map = { '(': ')', '{': '}', '[': ']' };\n  for (const char of s) {\n    if (map[char]) {\n      stack.push(map[char]);\n    } else if (stack.pop() !== char) {\n      return false;\n    }\n  }\n  return stack.length === 0;\n}",
  },
  {
    title: 'Sorting Algorithms',
    language: 'Python',
    code: "def bubble_sort(arr):\n    n = len(arr)\n    for i in range(n):\n        for j in range(0, n - i - 1):\n            if arr[j] > arr[j + 1]:\n                arr[j], arr[j + 1] = arr[j + 1], arr[j]\n    return arr\n\n\ndef merge_sort(arr):\n    if len(arr) <= 1:\n        return arr\n    mid = len(arr) // 2\n    left = merge_sort(arr[:mid])\n    right = merge_sort(arr[mid:])\n    i = j = 0\n    result = []\n    while i < len(left) and j < len(right):\n        if left[i] < right[j]:\n            result.append(left[i])\n            i += 1\n        else:\n            result.append(right[j])\n            j += 1\n    return result + left[i:] + right[j:]",
  },
  {
    title: 'Hash Map & Kadane',
    language: 'Python',
    code: "def group_anagrams(strs):\n    from collections import defaultdict\n    groups = defaultdict(list)\n    for s in strs:\n        key = ''.join(sorted(s))\n        groups[key].append(s)\n    return list(groups.values())\n\n\ndef max_subarray(nums):\n    max_sum = current_sum = nums[0]\n    for num in nums[1:]:\n        current_sum = max(num, current_sum + num)\n        max_sum = max(max_sum, current_sum)\n    return max_sum",
  },
  {
    title: 'Go Palindrome & DP',
    language: 'Go',
    code: "func isPalindrome(s string) bool {\n  runes := []rune(s)\n  for i, j := 0, len(runes)-1; i < j; i, j = i+1, j-1 {\n    if runes[i] != runes[j] {\n      return false\n    }\n  }\n  return true\n}\n\nfunc maxSubarray(nums []int) int {\n  maxSum := nums[0]\n  currentSum := nums[0]\n  for _, num := range nums[1:] {\n    if num > currentSum+num {\n      currentSum = num\n    } else {\n      currentSum = currentSum + num\n    }\n    if currentSum > maxSum {\n      maxSum = currentSum\n    }\n  }\n  return maxSum\n}",
  },
  {
    title: 'Java LinkedList',
    language: 'Java',
    code: "class ListNode {\n  int val;\n  ListNode next;\n  ListNode(int x) { val = x; }\n}\n\nclass Solution {\n  public ListNode reverseList(ListNode head) {\n    ListNode prev = null;\n    ListNode curr = head;\n    while (curr != null) {\n      ListNode next = curr.next;\n      curr.next = prev;\n      prev = curr;\n      curr = next;\n    }\n    return prev;\n  }\n}",
  },
  {
    title: 'C++ Binary Search',
    language: 'C++',
    code: "#include <vector>\nusing namespace std;\n\nint binarySearch(vector<int>& arr, int target) {\n  int left = 0;\n  int right = arr.size() - 1;\n  while (left <= right) {\n    int mid = left + (right - left) / 2;\n    if (arr[mid] == target) return mid;\n    if (arr[mid] < target) {\n      left = mid + 1;\n    } else {\n      right = mid - 1;\n    }\n  }\n  return -1;\n}",
  },
  {
    title: 'Coin Change (DP)',
    language: 'Python',
    code: "def coin_change(coins, amount):\n    dp = [float('inf')] * (amount + 1)\n    dp[0] = 0\n    for coin in coins:\n        for x in range(coin, amount + 1):\n            dp[x] = min(dp[x], dp[x - coin] + 1)\n    return dp[amount] if dp[amount] != float('inf') else -1\n\n\ndef climb_stairs(n):\n    if n <= 2:\n        return n\n    a, b = 1, 2\n    for _ in range(3, n + 1):\n        a, b = b, a + b\n    return b",
  },
  {
    title: 'Binary Tree Level Order',
    language: 'JavaScript',
    code: "function levelOrder(root) {\n  if (!root) return [];\n  const result = [];\n  const queue = [root];\n  while (queue.length) {\n    const level = [];\n    const size = queue.length;\n    for (let i = 0; i < size; i++) {\n      const node = queue.shift();\n      level.push(node.val);\n      if (node.left) queue.push(node.left);\n      if (node.right) queue.push(node.right);\n    }\n    result.push(level);\n  }\n  return result;\n}\n\nfunction isSameTree(p, q) {\n  if (!p && !q) return true;\n  if (!p || !q) return false;\n  return p.val === q.val\n    && isSameTree(p.left, q.left)\n    && isSameTree(p.right, q.right);\n}",
  },
  {
    title: 'Graph BFS Traversal',
    language: 'Python',
    code: "from collections import deque\n\n\ndef bfs(graph, start):\n    visited = set()\n    queue = deque([start])\n    visited.add(start)\n    result = []\n    while queue:\n        node = queue.popleft()\n        result.append(node)\n        for neighbor in graph[node]:\n            if neighbor not in visited:\n                visited.add(neighbor)\n                queue.append(neighbor)\n    return result\n\n\ndef has_path(graph, start, end):\n    if start == end:\n        return True\n    visited = set()\n    stack = [start]\n    while stack:\n        node = stack.pop()\n        if node == end:\n            return True\n        if node not in visited:\n            visited.add(node)\n            stack.extend(graph[node] - visited)\n    return False",
  },
  {
    title: 'Valid Anagram & Missing',
    language: 'Go',
    code: "func isAnagram(s string, t string) bool {\n  if len(s) != len(t) {\n    return false\n  }\n  counts := make([]int, 26)\n  for i := 0; i < len(s); i++ {\n    counts[s[i]-'a']++\n    counts[t[i]-'a']--\n  }\n  for _, c := range counts {\n    if c != 0 {\n      return false\n    }\n  }\n  return true\n}\n\nfunc missingNumber(nums []int) int {\n  n := len(nums)\n  expected := n * (n + 1) / 2\n  sum := 0\n  for _, v := range nums {\n    sum += v\n  }\n  return expected - sum\n}",
  },
];

// ── Hard Snippets ────────────────────────────────────────

const HARD_SNIPPETS: CodeSnippet[] = [
  {
    title: 'Longest Palindromic Substring',
    language: 'JavaScript',
    code: "function longestPalindrome(s) {\n  let start = 0;\n  let maxLen = 1;\n  function expand(l, r) {\n    while (l >= 0 && r < s.length && s[l] === s[r]) {\n      if (r - l + 1 > maxLen) {\n        start = l;\n        maxLen = r - l + 1;\n      }\n      l--;\n      r++;\n    }\n  }\n  for (let i = 0; i < s.length; i++) {\n    expand(i, i);\n    expand(i, i + 1);\n  }\n  return s.slice(start, start + maxLen);\n}",
  },
  {
    title: 'LRU Cache',
    language: 'JavaScript',
    code: "class LRUCache {\n  constructor(capacity) {\n    this.capacity = capacity;\n    this.cache = new Map();\n  }\n  get(key) {\n    if (!this.cache.has(key)) return -1;\n    const value = this.cache.get(key);\n    this.cache.delete(key);\n    this.cache.set(key, value);\n    return value;\n  }\n  put(key, value) {\n    if (this.cache.has(key)) {\n      this.cache.delete(key);\n    }\n    this.cache.set(key, value);\n    if (this.cache.size > this.capacity) {\n      const firstKey = this.cache.keys().next().value;\n      this.cache.delete(firstKey);\n    }\n  }\n}",
  },
  {
    title: 'Trie Data Structure',
    language: 'JavaScript',
    code: "class TrieNode {\n  constructor() {\n    this.children = {};\n    this.isEnd = false;\n  }\n}\n\nclass Trie {\n  constructor() {\n    this.root = new TrieNode();\n  }\n  insert(word) {\n    let node = this.root;\n    for (const ch of word) {\n      if (!node.children[ch]) {\n        node.children[ch] = new TrieNode();\n      }\n      node = node.children[ch];\n    }\n    node.isEnd = true;\n  }\n  search(word) {\n    let node = this.root;\n    for (const ch of word) {\n      if (!node.children[ch]) return false;\n      node = node.children[ch];\n    }\n    return node.isEnd;\n  }\n  startsWith(prefix) {\n    let node = this.root;\n    for (const ch of prefix) {\n      if (!node.children[ch]) return false;\n      node = node.children[ch];\n    }\n    return true;\n  }\n}",
  },
  {
    title: 'Tree Serialization & DP',
    language: 'Python',
    code: "def serialize(root):\n    if not root:\n        return 'null'\n    left = serialize(root.left)\n    right = serialize(root.right)\n    return f'{root.val},{left},{right}'\n\n\ndef deserialize(data):\n    nodes = data.split(',')\n    def build():\n        val = nodes.pop(0)\n        if val == 'null':\n            return None\n        node = TreeNode(int(val))\n        node.left = build()\n        node.right = build()\n        return node\n    return build()\n\n\ndef coin_change(coins, amount):\n    dp = [float('inf')] * (amount + 1)\n    dp[0] = 0\n    for coin in coins:\n        for x in range(coin, amount + 1):\n            dp[x] = min(dp[x], dp[x - coin] + 1)\n    return dp[amount] if dp[amount] != float('inf') else -1",
  },
  {
    title: 'TypeScript Event Emitter',
    language: 'TypeScript',
    code: "type EventHandler = (...args: any[]) => void;\n\nclass EventEmitter {\n  private handlers = new Map<string, EventHandler[]>();\n\n  on(event: string, handler: EventHandler) {\n    if (!this.handlers.has(event)) {\n      this.handlers.set(event, []);\n    }\n    this.handlers.get(event)!.push(handler);\n  }\n\n  emit(event: string, ...args: any[]) {\n    this.handlers.get(event)?.forEach(h => h(...args));\n  }\n\n  off(event: string, handler: EventHandler) {\n    const handlers = this.handlers.get(event);\n    if (handlers) {\n      this.handlers.set(event, handlers.filter(x => x !== handler));\n    }\n  }\n}",
  },
  {
    title: 'Go Merge Sort',
    language: 'Go',
    code: "func mergeSort(arr []int) []int {\n  if len(arr) <= 1 {\n    return arr\n  }\n  mid := len(arr) / 2\n  left := mergeSort(arr[:mid])\n  right := mergeSort(arr[mid:])\n  return merge(left, right)\n}\n\nfunc merge(left, right []int) []int {\n  result := make([]int, 0, len(left)+len(right))\n  i, j := 0, 0\n  for i < len(left) && j < len(right) {\n    if left[i] < right[j] {\n      result = append(result, left[i])\n      i++\n    } else {\n      result = append(result, right[j])\n      j++\n    }\n  }\n  result = append(result, left[i:]...)\n  result = append(result, right[j:]...)\n  return result\n}",
  },
  {
    title: 'Edit Distance (DP)',
    language: 'Python',
    code: "def min_distance(word1, word2):\n    m, n = len(word1), len(word2)\n    dp = [[0] * (n + 1) for _ in range(m + 1)]\n    for i in range(m + 1):\n        dp[i][0] = i\n    for j in range(n + 1):\n        dp[0][j] = j\n    for i in range(1, m + 1):\n        for j in range(1, n + 1):\n            if word1[i - 1] == word2[j - 1]:\n                dp[i][j] = dp[i - 1][j - 1]\n            else:\n                dp[i][j] = 1 + min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])\n    return dp[m][n]",
  },
  {
    title: "Dijkstra's Algorithm",
    language: 'JavaScript',
    code: "function dijkstra(graph, start) {\n  const dist = {};\n  const visited = new Set();\n  const pq = [[0, start]];\n  dist[start] = 0;\n  while (pq.length) {\n    pq.sort((a, b) => a[0] - b[0]);\n    const [d, u] = pq.shift();\n    if (visited.has(u)) continue;\n    visited.add(u);\n    for (const [v, w] of graph[u] || []) {\n      const nd = d + w;\n      if (nd < (dist[v] ?? Infinity)) {\n        dist[v] = nd;\n        pq.push([nd, v]);\n      }\n    }\n  }\n  return dist;\n}",
  },
  {
    title: 'Topological Sort',
    language: 'Python',
    code: "from collections import deque\n\n\ndef topo_sort(num_nodes, edges):\n    graph = [[] for _ in range(num_nodes)]\n    in_degree = [0] * num_nodes\n    for u, v in edges:\n        graph[u].append(v)\n        in_degree[v] += 1\n    queue = deque([i for i in range(num_nodes) if in_degree[i] == 0])\n    result = []\n    while queue:\n        node = queue.popleft()\n        result.append(node)\n        for neighbor in graph[node]:\n            in_degree[neighbor] -= 1\n            if in_degree[neighbor] == 0:\n                queue.append(neighbor)\n    return result if len(result) == num_nodes else []",
  },
  {
    title: 'N-Queens (Backtrack)',
    language: 'JavaScript',
    code: "function solveNQueens(n) {\n  const result = [];\n  const board = Array.from({ length: n }, () => Array(n).fill('.'));\n  function isSafe(row, col) {\n    for (let i = 0; i < row; i++) {\n      if (board[i][col] === 'Q') return false;\n      if (col - (row - i) >= 0 && board[i][col - (row - i)] === 'Q') return false;\n      if (col + (row - i) < n && board[i][col + (row - i)] === 'Q') return false;\n    }\n    return true;\n  }\n  function backtrack(row) {\n    if (row === n) {\n      result.push(board.map(r => r.join('')));\n      return;\n    }\n    for (let col = 0; col < n; col++) {\n      if (isSafe(row, col)) {\n        board[row][col] = 'Q';\n        backtrack(row + 1);\n        board[row][col] = '.';\n      }\n    }\n  }\n  backtrack(0);\n  return result;\n}",
  },
  {
    title: 'Longest Common Subseq',
    language: 'Go',
    code: "func longestCommonSubsequence(text1 string, text2 string) int {\n  m, n := len(text1), len(text2)\n  dp := make([][]int, m+1)\n  for i := range dp {\n    dp[i] = make([]int, n+1)\n  }\n  for i := 1; i <= m; i++ {\n    for j := 1; j <= n; j++ {\n      if text1[i-1] == text2[j-1] {\n        dp[i][j] = dp[i-1][j-1] + 1\n      } else {\n        if dp[i-1][j] > dp[i][j-1] {\n          dp[i][j] = dp[i-1][j]\n        } else {\n          dp[i][j] = dp[i][j-1]\n        }\n      }\n    }\n  }\n  return dp[m][n]\n}",
  },
  {
    title: 'Merge k Sorted Lists',
    language: 'TypeScript',
    code: "class ListNode {\n  constructor(val = 0, next = null) {\n    this.val = val;\n    this.next = next;\n  }\n}\n\nfunction mergeKLists(lists: (ListNode | null)[]): ListNode | null {\n  if (!lists.length) return null;\n  while (lists.length > 1) {\n    const merged: (ListNode | null)[] = [];\n    for (let i = 0; i < lists.length; i += 2) {\n      const l1 = lists[i];\n      const l2 = lists[i + 1] ?? null;\n      merged.push(mergeTwo(l1, l2));\n    }\n    lists = merged;\n  }\n  return lists[0];\n}\n\nfunction mergeTwo(l1: ListNode | null, l2: ListNode | null): ListNode | null {\n  const dummy = new ListNode();\n  let curr = dummy;\n  while (l1 && l2) {\n    if (l1.val < l2.val) {\n      curr.next = l1;\n      l1 = l1.next;\n    } else {\n      curr.next = l2;\n      l2 = l2.next;\n    }\n    curr = curr.next;\n  }\n  curr.next = l1 || l2;\n  return dummy.next;\n}",
  },
  {
    title: 'Serialize Binary Tree',
    language: 'Python',
    code: "class TreeNode:\n    def __init__(self, val=0, left=None, right=None):\n        self.val = val\n        self.left = left\n        self.right = right\n\n\ndef serialize(root):\n    if not root:\n        return 'null'\n    left = serialize(root.left)\n    right = serialize(root.right)\n    return f'{root.val},{left},{right}'\n\n\ndef deserialize(data):\n    nodes = data.split(',')\n    def build():\n        val = nodes.pop(0)\n        if val == 'null':\n            return None\n        node = TreeNode(int(val))\n        node.left = build()\n        node.right = build()\n        return node\n    return build()",
  },
];

// ── Accessors ─────────────────────────────────────────────

export const SNIPPET_POOLS: Record<string, CodeSnippet[]> = {
  easy: EASY_SNIPPETS,
  medium: MEDIUM_SNIPPETS,
  hard: HARD_SNIPPETS,
};

export function getSnippetPool(difficulty: string): CodeSnippet[] {
  return SNIPPET_POOLS[difficulty] ?? EASY_SNIPPETS;
}

export function getFilteredSnippets(difficulty: string, language?: string): CodeSnippet[] {
  let pool = getSnippetPool(difficulty);
  if (language) {
    pool = pool.filter((s) => s.language === language);
  }
  return pool;
}

export function pickRandomSnippet(difficulty: string, language?: string): CodeSnippet | null {
  const pool = getFilteredSnippets(difficulty, language);
  if (pool.length === 0) return null;
  const idx = Math.floor(Math.random() * pool.length);
  return pool[idx];
}
