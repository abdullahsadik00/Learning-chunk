// ═══════════════════════════════════════════════════════════
// CHALLENGE C02: TREES & GRAPHS
// Run: npm run challenge:02  |  Time target: 35–45 min
// ═══════════════════════════════════════════════════════════
// PROJECT: Implement the core tree/graph traversals from
//          02-trees-graphs.ts — DFS recursion, BFS level order,
//          root-to-leaf path sum, and graph connectivity.
//
// RULES:
//  • Delete each // TODO comment as you implement it.
//  • Do NOT rename any exported name — assertions depend on them.
//  • The TreeNode class and buildTree helper are GIVEN — do not modify.
//  • You MAY add private helper functions.
//  • Run `npm run challenge:02` to check your work.

// ── ASSERT HELPER (do not modify) ─────────────────────────
function assert(condition: boolean, message: string): void {
  if (!condition) { console.error(`  FAIL  ${message}`); process.exitCode = 1; }
  else            { console.log (`  PASS  ${message}`); }
}

// ── GIVEN: TreeNode + buildTree (do not modify) ───────────
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

/** Build a binary tree from a level-order array (null = missing node). */
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

// ══════════════════════════════════════════════════════════
// EXERCISE 1 — Maximum Depth (DFS recursion)
// ══════════════════════════════════════════════════════════
// Return the number of nodes on the longest root-to-leaf path.
// An empty tree has depth 0; a single node has depth 1.
export function maxDepth(root: TreeNode | null): number {
  // TODO: base case null → 0; else 1 + max(depth(left), depth(right)).
  void root;
  return 0; // placeholder
}

// ══════════════════════════════════════════════════════════
// EXERCISE 2 — Preorder Traversal (root → left → right)
// ══════════════════════════════════════════════════════════
// Return the node values in preorder as an array.
export function preorder(root: TreeNode | null): number[] {
  // TODO: base case null → []; else [val, ...preorder(left), ...preorder(right)].
  void root;
  return []; // placeholder
}

// ══════════════════════════════════════════════════════════
// EXERCISE 3 — Level Order Traversal (BFS)
// ══════════════════════════════════════════════════════════
// Return node values grouped by level, e.g. [[3],[9,20],[15,7]].
// Target: BFS with the "snapshot size" trick.
export function levelOrder(root: TreeNode | null): number[][] {
  // TODO: queue-based BFS; each while-iteration processes one full level.
  void root;
  return []; // placeholder
}

// ══════════════════════════════════════════════════════════
// EXERCISE 4 — Path Sum (root-to-leaf)
// ══════════════════════════════════════════════════════════
// Return true if there is a root-to-LEAF path whose values sum to
// targetSum. A leaf has both children null.
export function hasPathSum(root: TreeNode | null, targetSum: number): boolean {
  // TODO: subtract node.val; at a leaf return (remaining === 0); else recurse OR.
  void root; void targetSum;
  return false; // placeholder
}

// ══════════════════════════════════════════════════════════
// EXERCISE 5 — Graph Has Path (BFS/DFS on adjacency list)
// ══════════════════════════════════════════════════════════
// Given n nodes (0..n-1) and an UNDIRECTED edge list, return true if
// a path exists between src and dst. src === dst is trivially true.
// Build an adjacency list, then traverse with a visited set.
export function hasPath(
  n: number,
  edges: [number, number][],
  src: number,
  dst: number
): boolean {
  // TODO: build adjacency Map, BFS/DFS from src, return whether dst is reached.
  void n; void edges; void src; void dst;
  return false; // placeholder
}

// ══════════════════════════════════════════════════════════
// EXERCISE 6 — Number of Connected Components
// ══════════════════════════════════════════════════════════
// Given n nodes (0..n-1) and an UNDIRECTED edge list, return the
// count of connected components (isolated subgraphs).
export function countComponents(n: number, edges: [number, number][]): number {
  // TODO: build adjacency, run DFS/BFS from each unvisited node, count starts.
  void n; void edges;
  return 0; // placeholder
}

// ── ASSERTIONS (do not modify) ────────────────────────────
console.log("\n── C02 Trees & Graphs assertions ──");

//         3
//        / \
//       9  20
//         /  \
//        15   7
const t1 = buildTree([3, 9, 20, null, null, 15, 7]);

// maxDepth
assert(maxDepth(t1) === 3, "maxDepth: [3,9,20,null,null,15,7] → 3");
assert(maxDepth(null) === 0, "maxDepth: empty → 0");
assert(maxDepth(buildTree([1])) === 1, "maxDepth: single node → 1");

// preorder
assert(JSON.stringify(preorder(t1)) === "[3,9,20,15,7]", "preorder: → [3,9,20,15,7]");
assert(JSON.stringify(preorder(null)) === "[]", "preorder: empty → []");

// levelOrder
assert(JSON.stringify(levelOrder(t1)) === "[[3],[9,20],[15,7]]", "levelOrder: → [[3],[9,20],[15,7]]");
assert(JSON.stringify(levelOrder(null)) === "[]", "levelOrder: empty → []");

// hasPathSum
const pathTree = buildTree([5, 4, 8, 11, null, 13, 4, 7, 2]);
assert(hasPathSum(pathTree, 22) === true, "hasPathSum: target 22 → true");
assert(hasPathSum(pathTree, 100) === false, "hasPathSum: target 100 → false");
assert(hasPathSum(null, 0) === false, "hasPathSum: empty tree → false");

// hasPath
const edges1: [number, number][] = [[0, 1], [1, 2], [3, 4]];
assert(hasPath(5, edges1, 0, 2) === true, "hasPath: 0→2 connected → true");
assert(hasPath(5, edges1, 0, 4) === false, "hasPath: 0→4 disconnected → false");
assert(hasPath(5, edges1, 2, 2) === true, "hasPath: src===dst → true");

// countComponents
assert(countComponents(5, edges1) === 2, "countComponents: {0,1,2}+{3,4} → 2");
assert(countComponents(4, [[0, 1], [2, 3]]) === 2, "countComponents: two pairs → 2");
assert(countComponents(3, []) === 3, "countComponents: no edges → 3");

export {};
