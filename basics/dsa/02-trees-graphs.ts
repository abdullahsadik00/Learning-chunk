// ════════════════════════════════════════════════════════
// DSA 02: TREES & GRAPHS — PATTERNS FOR INTERVIEWS
// Run: npx ts-node 02-trees-graphs.ts
// ════════════════════════════════════════════════════════

// ─────────────────────────────────────────────
// SECTION 1: TREE FUNDAMENTALS
// ─────────────────────────────────────────────

/**
 * TreeNode — the building block of every binary tree problem.
 *
 * KEY PROPERTIES:
 *   height    — longest path from node down to a leaf
 *   depth     — distance from root down to this node
 *   balanced  — |height(left) - height(right)| <= 1 at every node
 *   BST prop  — left subtree < node < right subtree (no duplicates by convention)
 *
 * WHEN TO REACH FOR A TREE:
 *   - Hierarchical data (file system, org chart, DOM)
 *   - Need sorted order AND fast lookup: BST gives O(log n) avg for search/insert/delete
 *   - Priority queues / scheduling → heap (special tree)
 *   - Prefix matching / autocomplete → trie
 */
class TreeNode {
  val: number;
  left: TreeNode | null;
  right: TreeNode | null;

  constructor(val: number, left: TreeNode | null = null, right: TreeNode | null = null) {
    this.val = val;
    this.left = left;
    this.right = right;
  }
}

/** Height: longest root-to-leaf edge count. Empty tree = -1 (edge convention). */
function height(node: TreeNode | null): number {
  if (node === null) return -1;
  return 1 + Math.max(height(node.left), height(node.right));
}

/** Is the tree balanced at every node? */
function isBalanced(node: TreeNode | null): boolean {
  if (node === null) return true;
  const diff = Math.abs(height(node.left) - height(node.right));
  return diff <= 1 && isBalanced(node.left) && isBalanced(node.right);
}

/** Build a TreeNode tree from a level-order array (null = missing node). */
function buildTree(values: (number | null)[]): TreeNode | null {
  if (!values.length || values[0] === null) return null;
  const root = new TreeNode(values[0] as number);
  const queue: TreeNode[] = [root];
  let i = 1;
  while (i < values.length) {
    const node = queue.shift()!;
    if (i < values.length && values[i] !== null) {
      node.left = new TreeNode(values[i] as number);
      queue.push(node.left);
    }
    i++;
    if (i < values.length && values[i] !== null) {
      node.right = new TreeNode(values[i] as number);
      queue.push(node.right);
    }
    i++;
  }
  return root;
}

// ─────────────────────────────────────────────
// SECTION 2: DFS ON TREES (RECURSION)
// ─────────────────────────────────────────────

/**
 * THE 3-QUESTION FRAMEWORK FOR TREE RECURSION
 * Before writing a single line, answer these:
 *   1. What do I RETURN from a call?       (single value, array, boolean…)
 *   2. What is my BASE CASE?               (almost always: null node → leaf/empty)
 *   3. What do I DO with children's results? (combine, compare, propagate…)
 *
 * TRAVERSAL ORDER CHEAT SHEET:
 *   Preorder  (root → left → right)  — serialize tree, copy structure
 *   Inorder   (left → root → right)  — BST gives SORTED order
 *   Postorder (left → right → root)  — delete tree, evaluate expression tree
 *
 * GOTCHA: ALWAYS handle null node base case FIRST.
 *         Forgetting it causes a TypeError on node.left / node.right.
 */

function preorder(node: TreeNode | null): number[] {
  if (node === null) return [];                       // base case — null first!
  return [node.val, ...preorder(node.left), ...preorder(node.right)];
}

function inorder(node: TreeNode | null): number[] {
  if (node === null) return [];
  return [...inorder(node.left), node.val, ...inorder(node.right)];
}

function postorder(node: TreeNode | null): number[] {
  if (node === null) return [];
  return [...postorder(node.left), ...postorder(node.right), node.val];
}

// ── PROBLEM: Maximum Depth of Binary Tree ─────────────────────────────────────
// LeetCode 104 — Easy/Medium in interviews because of follow-up variants.
//
// Pattern: return a number (depth). Base case: null → 0.
// Combine: take the max of left/right depth, add 1 for current node.
//
// Time: O(n) — visit every node once.   Space: O(h) call stack (h = height).

function maxDepth(root: TreeNode | null): number {
  if (root === null) return 0;                        // base case
  const leftDepth  = maxDepth(root.left);
  const rightDepth = maxDepth(root.right);
  return 1 + Math.max(leftDepth, rightDepth);         // combine
}

// ── PROBLEM: Path Sum ─────────────────────────────────────────────────────────
// LeetCode 112 — Does a root-to-leaf path exist that sums to targetSum?
//
// Pattern: return boolean. Base case: leaf node where remaining === node.val.
// Combine: short-circuit OR across left and right children.
//
// KEY: A leaf has BOTH children null. Don't return true at an internal node
//      that happens to match — the path must reach a leaf.

function hasPathSum(root: TreeNode | null, targetSum: number): boolean {
  if (root === null) return false;                    // base case — null first!
  const remaining = targetSum - root.val;
  if (root.left === null && root.right === null) {    // leaf check
    return remaining === 0;
  }
  return hasPathSum(root.left, remaining) || hasPathSum(root.right, remaining);
}

// ── PROBLEM: Invert Binary Tree ───────────────────────────────────────────────
// LeetCode 226 — Mirror the tree (swap left/right at every node).
//
// Pattern: return the modified node. Base case: null → null.
// Combine: swap children AFTER recursing into both sides.
//
// ORDER MATTERS: swap first, then recurse? Recurse first, then swap?
// Both work here, but "swap then recurse" is slightly more intuitive.

function invertTree(root: TreeNode | null): TreeNode | null {
  if (root === null) return null;                     // base case
  [root.left, root.right] = [root.right, root.left]; // swap
  invertTree(root.left);
  invertTree(root.right);
  return root;
}

// ─────────────────────────────────────────────
// SECTION 3: BFS ON TREES (LEVEL ORDER)
// ─────────────────────────────────────────────

/**
 * BFS TEMPLATE — memorize this shell:
 *
 *   const queue: TreeNode[] = [];
 *   if (root) queue.push(root);
 *   while (queue.length) {
 *     const size = queue.length;           // snapshot of this level's width
 *     for (let i = 0; i < size; i++) {
 *       const node = queue.shift()!;
 *       // ... process node ...
 *       if (node.left)  queue.push(node.left);
 *       if (node.right) queue.push(node.right);
 *     }
 *   }
 *
 * WHEN BFS BEATS DFS:
 *   - Need level-by-level output (level order traversal, right side view)
 *   - Need MINIMUM depth / shortest path — BFS guarantees shortest first
 *   - Don't need to track recursion state across levels
 *
 * GOTCHA: BFS space is O(w) where w = max width of the tree.
 *         For a perfect binary tree the bottom level has n/2 nodes → O(n).
 *         DFS space is O(h). For balanced trees h = O(log n) — much better.
 *         Pick BFS only when the level-by-level property is actually needed.
 */

// ── PROBLEM: Level Order Traversal ───────────────────────────────────────────
// LeetCode 102 — Return nodes grouped by level: [[3],[9,20],[15,7]].
//
// Use the "snapshot size" trick to separate levels inside the while loop.

function levelOrder(root: TreeNode | null): number[][] {
  const result: number[][] = [];
  if (!root) return result;
  const queue: TreeNode[] = [root];
  while (queue.length) {
    const size = queue.length;              // how many nodes are on THIS level
    const level: number[] = [];
    for (let i = 0; i < size; i++) {
      const node = queue.shift()!;
      level.push(node.val);
      if (node.left)  queue.push(node.left);
      if (node.right) queue.push(node.right);
    }
    result.push(level);
  }
  return result;
}

// ── PROBLEM: Right Side View ──────────────────────────────────────────────────
// LeetCode 199 — Return the last node visible from the right at each level.
//
// Trick: last element of each level group is the rightmost visible node.

function rightSideView(root: TreeNode | null): number[] {
  const result: number[] = [];
  if (!root) return result;
  const queue: TreeNode[] = [root];
  while (queue.length) {
    const size = queue.length;
    for (let i = 0; i < size; i++) {
      const node = queue.shift()!;
      if (i === size - 1) result.push(node.val);   // rightmost of this level
      if (node.left)  queue.push(node.left);
      if (node.right) queue.push(node.right);
    }
  }
  return result;
}

// ── PROBLEM: Minimum Depth ────────────────────────────────────────────────────
// LeetCode 111 — Shortest path from root to a leaf node.
//
// BFS is ideal: the FIRST leaf we encounter is guaranteed to be shallowest.
// DFS would need to explore the whole tree; BFS short-circuits immediately.
//
// COMMON MISTAKE with DFS: returning min(left, right) fails when one subtree
// is empty — an internal node with one child is NOT a leaf.

function minDepth(root: TreeNode | null): number {
  if (!root) return 0;
  const queue: Array<[TreeNode, number]> = [[root, 1]];
  while (queue.length) {
    const [node, depth] = queue.shift()!;
    if (!node.left && !node.right) return depth;    // first leaf hit → done
    if (node.left)  queue.push([node.left,  depth + 1]);
    if (node.right) queue.push([node.right, depth + 1]);
  }
  return 0; // unreachable
}

// ─────────────────────────────────────────────
// SECTION 4: BINARY SEARCH TREES (BST)
// ─────────────────────────────────────────────

/**
 * BST PROPERTY: for every node N,
 *   - ALL nodes in left subtree < N.val
 *   - ALL nodes in right subtree > N.val
 *
 * WHY IT MATTERS:
 *   - Inorder traversal of a valid BST yields nodes in SORTED ascending order.
 *   - Search, insert, delete: O(log n) average, O(n) worst (degenerate / skewed).
 *
 * COMMON OPERATIONS:
 *   search(node, target) — go left if target < node.val, right if greater
 *   insert(node, val)    — same traversal, insert at null spot
 *   delete               — three cases: leaf, one child, two children (successor swap)
 *
 * GOTCHA: Validating a BST requires passing DOWN a valid range (min, max)
 *         to each node, NOT just comparing a node to its direct parent.
 *
 *   Example of why parent-only comparison fails:
 *         5
 *        / \
 *       1   4
 *          / \
 *         3   6
 *   Node 3 < parent 4 — looks valid locally, but 3 is in the RIGHT subtree of 5
 *   so it must be > 5. The tree is INVALID. Parent comparison misses this.
 */

// ── PROBLEM: Validate Binary Search Tree ──────────────────────────────────────
// LeetCode 98 — Is this a valid BST?
//
// Pass (min, max) bounds top-down. Each node must satisfy min < node.val < max.
// Root starts with (-Infinity, +Infinity).

function isValidBST(
  root: TreeNode | null,
  min: number = -Infinity,
  max: number = Infinity
): boolean {
  if (root === null) return true;
  if (root.val <= min || root.val >= max) return false;
  return (
    isValidBST(root.left,  min, root.val) &&   // left must be < current
    isValidBST(root.right, root.val, max)       // right must be > current
  );
}

// ── PROBLEM: Lowest Common Ancestor of BST ────────────────────────────────────
// LeetCode 235 — Find LCA of nodes p and q in a BST.
//
// Exploit the BST property: no need to visit every node.
//   - Both p and q < root → LCA is in the left subtree
//   - Both p and q > root → LCA is in the right subtree
//   - They diverge (one on each side, or root is p or q) → root IS the LCA

function lowestCommonAncestorBST(
  root: TreeNode,
  p: TreeNode,
  q: TreeNode
): TreeNode {
  if (p.val < root.val && q.val < root.val) {
    return lowestCommonAncestorBST(root.left!, p, q);
  }
  if (p.val > root.val && q.val > root.val) {
    return lowestCommonAncestorBST(root.right!, p, q);
  }
  return root; // split point — this node is the LCA
}

// ── PROBLEM: Kth Smallest Element in BST ──────────────────────────────────────
// LeetCode 230 — Find the kth smallest value (1-indexed).
//
// KEY INSIGHT: Inorder traversal of a BST produces values in sorted order.
// Just run inorder and return the kth element.
//
// Iterative version (preferred in interviews — avoids recursion overhead
// and can stop early without visiting every node):

function kthSmallest(root: TreeNode | null, k: number): number {
  const stack: TreeNode[] = [];
  let current = root;
  let count = 0;

  while (current !== null || stack.length > 0) {
    while (current !== null) {        // go as far left as possible
      stack.push(current);
      current = current.left;
    }
    current = stack.pop()!;           // process node (inorder visit)
    count++;
    if (count === k) return current.val;
    current = current.right;          // move to right subtree
  }
  return -1; // k out of range
}

// ─────────────────────────────────────────────
// SECTION 5: GRAPH REPRESENTATIONS
// ─────────────────────────────────────────────

/**
 * TWO MAIN REPRESENTATIONS:
 *
 * 1. ADJACENCY LIST  Map<node, neighbors[]>  — use this by default
 *    Pros: space-efficient O(V + E), easy to iterate neighbors
 *    Cons: checking "is there an edge A→B?" is O(degree(A))
 *
 * 2. ADJACENCY MATRIX  boolean[V][V]          — use when V is small & dense
 *    Pros: O(1) edge lookup
 *    Cons: O(V²) space — wasteful for sparse graphs
 *
 * GRAPH TYPES:
 *   Undirected  — edges go both ways (friendship, road network)
 *   Directed    — edges have direction (dependency graph, web links)
 *   Weighted    — edges have costs (GPS routing, network latency)
 *   DAG         — directed acyclic graph (prerequisite chains, task scheduling)
 *
 * COMMON INTERVIEW GRAPH SETUPS:
 *   edges array  → build adjacency list yourself (very common)
 *   2D grid      → treat each cell as a node, 4 neighbors (up/down/left/right)
 *   Node class   → given directly with a neighbors array (clone graph, etc.)
 */

type Graph = Map<number, number[]>;

/** Build an undirected adjacency list from an edges array. */
function buildGraph(n: number, edges: [number, number][]): Graph {
  const graph: Graph = new Map();
  for (let i = 0; i < n; i++) graph.set(i, []);
  for (const [u, v] of edges) {
    graph.get(u)!.push(v);
    graph.get(v)!.push(u);    // remove this line for directed graphs
  }
  return graph;
}

// ─────────────────────────────────────────────
// SECTION 6: DFS ON GRAPHS
// ─────────────────────────────────────────────

/**
 * DFS TEMPLATE (iterative with explicit stack):
 *
 *   const visited = new Set<number>();
 *   const stack = [startNode];
 *   while (stack.length) {
 *     const node = stack.pop()!;
 *     if (visited.has(node)) continue;
 *     visited.add(node);
 *     // process node
 *     for (const neighbor of graph.get(node) ?? []) {
 *       if (!visited.has(neighbor)) stack.push(neighbor);
 *     }
 *   }
 *
 * GOTCHA: ALWAYS maintain a visited set.
 *         Without it, a cycle (A→B→A) causes infinite loops.
 *         Trees avoid this because there are no back edges.
 *
 * GRAPH DFS USE CASES:
 *   - Connected components (count isolated subgraphs)
 *   - Cycle detection (back edge exists in DFS path → cycle)
 *   - Topological sort (finish order of DFS = reverse topo order)
 *   - Flood fill / region exploration
 */

// ── PROBLEM: Number of Islands ────────────────────────────────────────────────
// LeetCode 200 — Count connected groups of '1' cells in a 2D grid.
//
// Treat the grid as a graph: each '1' cell is a node, edges connect
// horizontally/vertically adjacent '1' cells.
//
// Pattern: scan every cell. When we find an unvisited '1', it's a new island.
// DFS (or BFS) to mark all cells of this island as visited.

function numIslands(grid: string[][]): number {
  const rows = grid.length;
  const cols = grid[0].length;
  let count = 0;

  function dfs(r: number, c: number): void {
    // out of bounds, water, or already visited
    if (r < 0 || r >= rows || c < 0 || c >= cols || grid[r][c] !== '1') return;
    grid[r][c] = '0'; // mark visited by mutating (common interview trick)
    dfs(r + 1, c);
    dfs(r - 1, c);
    dfs(r, c + 1);
    dfs(r, c - 1);
  }

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] === '1') {
        count++;
        dfs(r, c);
      }
    }
  }
  return count;
}

// ── PROBLEM: Course Schedule (Cycle Detection) ────────────────────────────────
// LeetCode 207 — Can you finish all courses given prerequisites?
//               Equivalent to: does the directed graph have a cycle?
//
// STATE: 0 = unvisited, 1 = in current DFS path (gray), 2 = fully processed (black)
// If we reach a GRAY node during DFS → back edge → CYCLE → return false.

function canFinish(numCourses: number, prerequisites: [number, number][]): boolean {
  const graph: number[][] = Array.from({ length: numCourses }, () => []);
  for (const [course, prereq] of prerequisites) {
    graph[course].push(prereq);
  }

  const state: number[] = new Array(numCourses).fill(0); // 0=unvisited

  function hasCycle(node: number): boolean {
    if (state[node] === 1) return true;  // back edge → cycle
    if (state[node] === 2) return false; // already cleared

    state[node] = 1; // mark as in-progress (gray)
    for (const neighbor of graph[node]) {
      if (hasCycle(neighbor)) return true;
    }
    state[node] = 2; // mark as done (black)
    return false;
  }

  for (let i = 0; i < numCourses; i++) {
    if (hasCycle(i)) return false;
  }
  return true;
}

// ── PROBLEM: Clone Graph ───────────────────────────────────────────────────────
// LeetCode 133 — Deep copy a graph where each node has a val and neighbors[].
//
// Use a Map<original, clone> as both a visited set AND a lookup table.
// When we encounter a node already in the map, return its clone immediately.

class GraphNode {
  val: number;
  neighbors: GraphNode[];
  constructor(val: number, neighbors: GraphNode[] = []) {
    this.val = val;
    this.neighbors = neighbors;
  }
}

function cloneGraph(node: GraphNode | null): GraphNode | null {
  if (!node) return null;
  const clones = new Map<GraphNode, GraphNode>();

  function dfsClone(n: GraphNode): GraphNode {
    if (clones.has(n)) return clones.get(n)!;
    const copy = new GraphNode(n.val);
    clones.set(n, copy);                           // register BEFORE recursing (handles cycles)
    for (const neighbor of n.neighbors) {
      copy.neighbors.push(dfsClone(neighbor));
    }
    return copy;
  }

  return dfsClone(node);
}

// ─────────────────────────────────────────────
// SECTION 7: BFS ON GRAPHS
// ─────────────────────────────────────────────

/**
 * BFS TEMPLATE (shortest path in unweighted graph):
 *
 *   const visited = new Set([start]);
 *   const queue: number[] = [start];
 *   let steps = 0;
 *   while (queue.length) {
 *     const size = queue.length;
 *     for (let i = 0; i < size; i++) {
 *       const node = queue.shift()!;
 *       if (node === target) return steps;
 *       for (const neighbor of graph.get(node) ?? []) {
 *         if (!visited.has(neighbor)) {
 *           visited.add(neighbor);
 *           queue.push(neighbor);
 *         }
 *       }
 *     }
 *     steps++;
 *   }
 *   return -1; // unreachable
 *
 * WHY BFS FOR SHORTEST PATH:
 *   BFS explores nodes in order of distance from start.
 *   The first time we reach a target node, that path is the SHORTEST.
 *   DFS might find a longer path first and requires exhaustive search.
 *
 * GOTCHA (multi-source BFS): When multiple start nodes exist, add ALL of
 *   them to the queue BEFORE the while loop — not one at a time.
 *   Processing them one at a time would give incorrect minimum distances.
 */

// ── PROBLEM: Shortest Path in Binary Matrix ────────────────────────────────────
// LeetCode 1091 — Find shortest path from top-left to bottom-right through 0-cells.
//                 8-directional movement allowed.
//
// BFS from (0,0). Level = current path length. First time we reach (n-1,n-1) → answer.

function shortestPathBinaryMatrix(grid: number[][]): number {
  const n = grid.length;
  if (grid[0][0] === 1 || grid[n - 1][n - 1] === 1) return -1;
  if (n === 1) return 1;

  const directions = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
  const queue: [number, number, number][] = [[0, 0, 1]]; // row, col, dist
  grid[0][0] = 1; // mark visited

  while (queue.length) {
    const [r, c, dist] = queue.shift()!;
    for (const [dr, dc] of directions) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr < 0 || nr >= n || nc < 0 || nc >= n || grid[nr][nc] !== 0) continue;
      if (nr === n - 1 && nc === n - 1) return dist + 1;
      grid[nr][nc] = 1; // mark visited immediately to avoid re-queuing
      queue.push([nr, nc, dist + 1]);
    }
  }
  return -1;
}

// ── PROBLEM: Word Ladder ───────────────────────────────────────────────────────
// LeetCode 127 — Fewest transformations from beginWord to endWord,
//                changing one letter at a time, each intermediate word in wordList.
//
// GRAPH MODEL: words are nodes, edges connect words that differ by exactly 1 letter.
// BFS gives us the shortest transformation sequence.
//
// OPTIMIZATION: instead of comparing every pair O(n²·m), for each position
//   try all 26 letters → O(n·m·26) where m = word length.

function ladderLength(beginWord: string, endWord: string, wordList: string[]): number {
  const wordSet = new Set(wordList);
  if (!wordSet.has(endWord)) return 0;

  const queue: [string, number][] = [[beginWord, 1]];
  const visited = new Set([beginWord]);

  while (queue.length) {
    const [word, steps] = queue.shift()!;
    for (let i = 0; i < word.length; i++) {
      for (let c = 97; c <= 122; c++) {             // 'a' to 'z'
        const newWord = word.slice(0, i) + String.fromCharCode(c) + word.slice(i + 1);
        if (newWord === endWord) return steps + 1;
        if (wordSet.has(newWord) && !visited.has(newWord)) {
          visited.add(newWord);
          queue.push([newWord, steps + 1]);
        }
      }
    }
  }
  return 0;
}

// ── PROBLEM: Rotting Oranges (Multi-Source BFS) ────────────────────────────────
// LeetCode 994 — Minimum minutes until all oranges rot, or -1 if impossible.
//                Rotten oranges spread to 4-directional fresh neighbors each minute.
//
// GOTCHA: This is MULTI-SOURCE BFS — start with ALL rotten oranges simultaneously.
//         If you process them one at a time, you get wrong distances because
//         rotting happens in parallel, not sequentially from one source.

function orangesRotting(grid: number[][]): number {
  const rows = grid.length;
  const cols = grid[0].length;
  const queue: [number, number][] = [];
  let fresh = 0;

  // Add ALL rotten oranges to queue at once (multi-source init)
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] === 2) queue.push([r, c]);
      else if (grid[r][c] === 1) fresh++;
    }
  }

  if (fresh === 0) return 0;

  let minutes = 0;
  const dirs = [[1,0],[-1,0],[0,1],[0,-1]];

  while (queue.length && fresh > 0) {
    const size = queue.length;
    minutes++;
    for (let i = 0; i < size; i++) {
      const [r, c] = queue.shift()!;
      for (const [dr, dc] of dirs) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr < 0 || nr >= rows || nc < 0 || nc >= cols || grid[nr][nc] !== 1) continue;
        grid[nr][nc] = 2;
        fresh--;
        queue.push([nr, nc]);
      }
    }
  }

  return fresh === 0 ? minutes : -1;
}

// ─────────────────────────────────────────────
// SECTION 8: ADVANCED TREE PATTERNS
// ─────────────────────────────────────────────

// ── TRIE (Prefix Tree) ────────────────────────────────────────────────────────
/**
 * WHEN TO USE A TRIE:
 *   - Autocomplete / prefix search
 *   - Word lookup where many words share prefixes
 *   - Beats sorting for prefix queries: O(m) search vs O(n log n) sort
 *     where m = word length — independent of dictionary size
 *
 * STRUCTURE: Each node holds a children map (letter → TrieNode) and
 *            an isEnd flag marking complete words.
 *
 * GOTCHA: isEnd MUST be set explicitly at the last character of insert.
 *         Without it, "search" can't distinguish "app" stored in the trie
 *         from just being a prefix of "apple".
 */

class TrieNode {
  children: Map<string, TrieNode>;
  isEnd: boolean;
  constructor() {
    this.children = new Map();
    this.isEnd = false;
  }
}

class Trie {
  private root: TrieNode;

  constructor() {
    this.root = new TrieNode();
  }

  insert(word: string): void {
    let node = this.root;
    for (const ch of word) {
      if (!node.children.has(ch)) {
        node.children.set(ch, new TrieNode());
      }
      node = node.children.get(ch)!;
    }
    node.isEnd = true;                // mark end of word
  }

  search(word: string): boolean {
    let node = this.root;
    for (const ch of word) {
      if (!node.children.has(ch)) return false;
      node = node.children.get(ch)!;
    }
    return node.isEnd;                // must be a complete word, not just a prefix
  }

  startsWith(prefix: string): boolean {
    let node = this.root;
    for (const ch of prefix) {
      if (!node.children.has(ch)) return false;
      node = node.children.get(ch)!;
    }
    return true;                      // any path reaching here is a valid prefix
  }
}

// ── HEAP / PRIORITY QUEUE — Top K Frequent Elements ───────────────────────────
// LeetCode 347 — Find k most frequent elements.
//
// APPROACH: Count frequencies, then use a min-heap of size k.
//   - If heap size < k: push
//   - If new element's freq > heap min: pop min, push new
//   - Result: heap contains the k highest-frequency elements
//
// TypeScript doesn't have a built-in heap. Two common interview options:
//   1. Sort frequencies descending → O(n log n). Simpler, acceptable for small n.
//   2. Quickselect / bucket sort → O(n). Mention this as the optimal approach.
//
// GOTCHA: A min-heap of size k gives O(n log k) — better than O(n log n) sort
//         when k << n. Know which to use and why.

function topKFrequent(nums: number[], k: number): number[] {
  const freq = new Map<number, number>();
  for (const n of nums) freq.set(n, (freq.get(n) ?? 0) + 1);

  // Bucket sort approach — O(n): bucket[i] = numbers with frequency i
  const buckets: number[][] = Array.from({ length: nums.length + 1 }, () => []);
  for (const [num, count] of freq) {
    buckets[count].push(num);
  }

  const result: number[] = [];
  for (let i = buckets.length - 1; i >= 0 && result.length < k; i--) {
    result.push(...buckets[i]);
  }
  return result.slice(0, k);
}

// ── UNION-FIND (Disjoint Set Union) ───────────────────────────────────────────
// LeetCode 323 — Number of Connected Components in an Undirected Graph.
//
// WHY UNION-FIND:
//   - Dynamic connectivity: handle edges one at a time
//   - Near O(1) amortized per operation with path compression + union by rank
//   - Often cleaner than BFS/DFS for "how many connected groups" questions
//
// CORE OPERATIONS:
//   find(x)    — return root representative of x's component (with path compression)
//   union(x,y) — merge the components of x and y (by rank to keep tree shallow)
//
// GOTCHA: Plain union (without rank) degrades to O(n) find in the worst case.
//         With both path compression AND union by rank → O(α(n)) ≈ O(1).

class UnionFind {
  private parent: number[];
  private rank: number[];
  public components: number;

  constructor(n: number) {
    this.parent = Array.from({ length: n }, (_, i) => i); // each node is its own parent
    this.rank = new Array(n).fill(0);
    this.components = n;
  }

  find(x: number): number {
    if (this.parent[x] !== x) {
      this.parent[x] = this.find(this.parent[x]); // path compression
    }
    return this.parent[x];
  }

  union(x: number, y: number): void {
    const rootX = this.find(x);
    const rootY = this.find(y);
    if (rootX === rootY) return; // already in the same component

    // Union by rank: attach smaller tree under larger tree
    if (this.rank[rootX] < this.rank[rootY]) {
      this.parent[rootX] = rootY;
    } else if (this.rank[rootX] > this.rank[rootY]) {
      this.parent[rootY] = rootX;
    } else {
      this.parent[rootY] = rootX;
      this.rank[rootX]++;
    }
    this.components--;
  }
}

function countComponents(n: number, edges: [number, number][]): number {
  const uf = new UnionFind(n);
  for (const [u, v] of edges) uf.union(u, v);
  return uf.components;
}

// ─────────────────────────────────────────────
// COMPLEXITY CHEAT SHEET
// ─────────────────────────────────────────────

/**
 * ┌──────────────────────────────────────────────────────────────────────────────┐
 * │  OPERATION / ALGORITHM          │ TIME         │ SPACE        │ NOTES        │
 * ├──────────────────────────────────────────────────────────────────────────────┤
 * │  Tree DFS (recursive)           │ O(n)         │ O(h)         │ h=height     │
 * │  Tree BFS (level order)         │ O(n)         │ O(w)         │ w=max width  │
 * │  BST search/insert/delete       │ O(log n) avg │ O(h)         │ O(n) worst   │
 * │  Validate BST                   │ O(n)         │ O(h)         │ range checks │
 * │  Inorder traversal (iterative)  │ O(n)         │ O(h)         │ Kth smallest │
 * │  Graph DFS/BFS                  │ O(V + E)     │ O(V)         │ V=vertices   │
 * │  Number of Islands              │ O(m×n)       │ O(m×n)       │ grid cells   │
 * │  Cycle Detection (DFS)          │ O(V + E)     │ O(V)         │ 3-color      │
 * │  Shortest Path (BFS, unweighted)│ O(V + E)     │ O(V)         │              │
 * │  Word Ladder (BFS)              │ O(n·m·26)    │ O(n·m)       │ m=word len   │
 * │  Trie insert/search             │ O(m)         │ O(m)         │ m=word len   │
 * │  Top K Frequent (bucket sort)   │ O(n)         │ O(n)         │              │
 * │  Union-Find (path comp + rank)  │ O(α(n)) ≈ O(1)│ O(n)       │ α=inv Ackerm │
 * └──────────────────────────────────────────────────────────────────────────────┘
 *
 * PATTERN SELECTION GUIDE:
 *   Tree, unknown structure        → DFS recursion (3-question framework)
 *   Tree, need level info          → BFS + snapshot-size trick
 *   Tree, need min path            → BFS (short-circuits at first leaf)
 *   BST, need sorted               → Inorder traversal
 *   Graph, connectivity            → DFS or Union-Find
 *   Graph, shortest path           → BFS (unweighted) or Dijkstra (weighted)
 *   Graph, cycles                  → DFS with 3-color (0/1/2) state
 *   Graph, multiple origins        → Multi-source BFS
 *   String prefix lookup           → Trie
 *   Top K elements                 → Heap or bucket sort
 *   Dynamic connected components   → Union-Find
 */

// ─────────────────────────────────────────────
// SELF-ASSESSMENT — 15 QUESTIONS
// ─────────────────────────────────────────────

/**
 * Score: 0–4 re-study, 5–9 progressing, 10–12 solid, 13–15 ready to advance.
 *
 * Q1.  What is the BST property? Why does validating a BST require passing
 *      min/max ranges rather than comparing a node only to its parent?
 *
 * Q2.  Answer the 3-question recursion framework for `maxDepth`:
 *        - What do you return?
 *        - What is your base case?
 *        - How do you combine children's results?
 *
 * Q3.  You are asked for the RIGHT SIDE VIEW of a binary tree.
 *      Describe the BFS-based approach in 2–3 sentences.
 *
 * Q4.  What is the time and space complexity of DFS on a binary tree?
 *      How does height relate to worst-case space?
 *
 * Q5.  Why does `hasPathSum` check `left === null && right === null` before
 *      returning true? What bug occurs without that check?
 *
 * Q6.  You have an undirected graph. What data structure MUST you always
 *      include in your DFS/BFS to avoid infinite loops, and why?
 *
 * Q7.  Describe how to detect a cycle in a directed graph using DFS.
 *      What are the three states each node can be in and what does each mean?
 *
 * Q8.  Why is BFS preferred over DFS for finding the shortest path in an
 *      unweighted graph? Give a concrete example where DFS would fail.
 *
 * Q9.  What is multi-source BFS? Describe the WRONG way to start it and
 *      the CORRECT way, and explain why they give different results.
 *
 * Q10. You need to run `canFinish` (Course Schedule). In your own words,
 *      what real-world problem does this map to, and what property of the
 *      graph are you checking?
 *
 * Q11. A Trie can answer "does any word start with prefix P?" in O(m) time
 *      where m = len(P). Why is this faster than sorting the dictionary
 *      and binary searching?
 *
 * Q12. Explain Union-Find's `find` operation with path compression.
 *      Why is path compression important for performance?
 *
 * Q13. What is the time complexity of:
 *        (a) BFS on a graph with V vertices and E edges
 *        (b) BST search in the average case and the worst case
 *        (c) Trie insert for a word of length m
 *
 * Q14. Walk through the `orangesRotting` algorithm for this grid:
 *        [[2,1,1],[1,1,0],[0,1,1]]
 *      What is the expected output and how many BFS levels does it take?
 *
 * Q15. You are given N words and asked to find all words with prefix "cat".
 *      Compare the Trie approach vs. linear scan of the array.
 *      When does each win?
 */

// ─────────────────────────────────────────────
// DEMO RUNNER
// ─────────────────────────────────────────────

function runDemo(): void {
  console.log("═══════════════════════════════════════════════════════");
  console.log("  DSA 02: TREES & GRAPHS — DEMO");
  console.log("═══════════════════════════════════════════════════════\n");

  // ── Tree basics ──────────────────────────────────────────────────────────────
  console.log("── SECTION 1: Tree Fundamentals ──────────────────────");
  //         3
  //        / \
  //       9  20
  //         /  \
  //        15   7
  const tree1 = buildTree([3, 9, 20, null, null, 15, 7]);
  console.log("Tree [3,9,20,null,null,15,7]:");
  console.log("  Height:    ", height(tree1));        // 2
  console.log("  Balanced:  ", isBalanced(tree1));    // true

  // ── DFS on trees ─────────────────────────────────────────────────────────────
  console.log("\n── SECTION 2: DFS on Trees ───────────────────────────");
  console.log("Preorder: ", preorder(tree1));          // [3, 9, 20, 15, 7]
  console.log("Inorder:  ", inorder(tree1));           // [9, 3, 15, 20, 7]
  console.log("Postorder:", postorder(tree1));         // [9, 15, 7, 20, 3]
  console.log("Max depth:", maxDepth(tree1));          // 3

  const pathTree = buildTree([5, 4, 8, 11, null, 13, 4, 7, 2]);
  console.log("hasPathSum([5,4,8,11,null,13,4,7,2], 22):", hasPathSum(pathTree, 22)); // true

  const invertTree1 = buildTree([4, 2, 7, 1, 3, 6, 9]);
  invertTree(invertTree1);
  console.log("Inverted tree inorder (expect [9,7,6,4,3,2,1]):", inorder(invertTree1));

  // ── BFS on trees ─────────────────────────────────────────────────────────────
  console.log("\n── SECTION 3: BFS on Trees ───────────────────────────");
  const bfsTree = buildTree([3, 9, 20, null, null, 15, 7]);
  console.log("Level order:", JSON.stringify(levelOrder(bfsTree)));   // [[3],[9,20],[15,7]]
  console.log("Right side view:", rightSideView(bfsTree));            // [3, 20, 7]
  console.log("Min depth:", minDepth(bfsTree));                       // 2

  // ── BST ───────────────────────────────────────────────────────────────────────
  console.log("\n── SECTION 4: Binary Search Trees ───────────────────");
  const validBST   = buildTree([2, 1, 3]);
  const invalidBST = buildTree([5, 1, 4, null, null, 3, 6]);
  console.log("isValidBST [2,1,3]:           ", isValidBST(validBST));    // true
  console.log("isValidBST [5,1,4,null,null,3,6]:", isValidBST(invalidBST)); // false

  //      5
  //     / \
  //    3   6
  //   / \
  //  2   4
  // /
  // 1
  const bst = buildTree([5, 3, 6, 2, 4, null, null, 1]);
  console.log("3rd smallest in BST:", kthSmallest(bst, 3));            // 3

  // ── Graph DFS ─────────────────────────────────────────────────────────────────
  console.log("\n── SECTION 6: DFS on Graphs ──────────────────────────");
  const grid1: string[][] = [
    ['1','1','1','1','0'],
    ['1','1','0','1','0'],
    ['1','1','0','0','0'],
    ['0','0','0','0','0'],
  ];
  console.log("numIslands (expect 1):", numIslands(grid1));

  const grid2: string[][] = [
    ['1','1','0','0','0'],
    ['1','1','0','0','0'],
    ['0','0','1','0','0'],
    ['0','0','0','1','1'],
  ];
  console.log("numIslands (expect 3):", numIslands(grid2));

  console.log("canFinish 2 courses [[1,0]] (expect true):", canFinish(2, [[1,0]]));
  console.log("canFinish 2 courses [[1,0],[0,1]] (expect false):", canFinish(2, [[1,0],[0,1]]));

  // ── Graph BFS ─────────────────────────────────────────────────────────────────
  console.log("\n── SECTION 7: BFS on Graphs ──────────────────────────");
  const binMatrix: number[][] = [[0,0,0],[1,1,0],[1,1,0]];
  console.log("shortestPath binary matrix (expect 4):", shortestPathBinaryMatrix(binMatrix));

  console.log("ladderLength hit→cog (expect 5):",
    ladderLength("hit", "cog", ["hot","dot","dog","lot","log","cog"]));

  const orangeGrid: number[][] = [[2,1,1],[1,1,0],[0,1,1]];
  console.log("orangesRotting (expect 4):", orangesRotting(orangeGrid));

  // ── Advanced patterns ─────────────────────────────────────────────────────────
  console.log("\n── SECTION 8: Advanced Tree Patterns ────────────────");
  const trie = new Trie();
  ["apple", "app", "application"].forEach(w => trie.insert(w));
  console.log("Trie search 'app' (true):",   trie.search("app"));
  console.log("Trie search 'appl' (false):", trie.search("appl"));
  console.log("Trie startsWith 'appl' (true):", trie.startsWith("appl"));

  console.log("Top 2 frequent in [1,1,1,2,2,3]:", topKFrequent([1,1,1,2,2,3], 2)); // [1,2]

  const uf = new UnionFind(5);
  uf.union(0, 1); uf.union(1, 2); uf.union(3, 4);
  console.log("Components after unions (expect 2):", uf.components);
  console.log("countComponents 5 nodes [[0,1],[1,2],[3,4]] (expect 2):",
    countComponents(5, [[0,1],[1,2],[3,4]]));

  console.log("\n═══════════════════════════════════════════════════════");
  console.log("  All demos complete. Answer the 15 questions above.");
  console.log("═══════════════════════════════════════════════════════");
}

runDemo();
