import type { CatalogEntry } from '../lib/types'

/**
 * This module's only import is type-only, so Node can run it directly after
 * stripping types. That is load-bearing: scripts/verify-catalog.ts imports
 * from here, and a *runtime* relative import would need an explicit `.ts`
 * extension that the bundler side doesn't use. `leetcodeUrl` lives here rather
 * than in lib/catalog.ts for the same reason — the script needs it, and it
 * belongs beside the `leetcodeSlug` override it exists to honour.
 */
export function leetcodeUrl(entry: CatalogEntry): string {
  return `https://leetcode.com/problems/${entry.leetcodeSlug ?? entry.slug}/`
}

/**
 * The NeetCode 150, in NeetCode's own order.
 *
 * This is the ONLY source of catalog rows. It is deliberately not derived from
 * content/problems/*: 149 of these have no content directory and never will
 * until someone builds them.
 *
 * Two fields you will not find here, both by design:
 *   - `status`   — derived in lib/catalog.ts from whether the content directory
 *                  exists. An authored flag drifts; a derived one can't.
 *   - `leetcodeUrl` — derived from `slug` (or `leetcodeSlug`). Storing 150
 *                  near-identical URLs is 150 chances to typo one.
 *
 * Order within a category is NeetCode's teaching order, so it is meaningful and
 * must not be sorted. `lib/catalog.test.ts` asserts each category appears as
 * one contiguous run, which is what catches a row filed under the wrong
 * heading.
 *
 * `number` is LeetCode's problem number. It is displayed, never used to sort.
 */
export const CATALOG: CatalogEntry[] = [
  // --- Arrays & Hashing (9) ------------------------------------------------
  { slug: 'contains-duplicate', number: 217, title: 'Contains Duplicate', difficulty: 'Easy', category: 'Arrays & Hashing' },
  { slug: 'valid-anagram', number: 242, title: 'Valid Anagram', difficulty: 'Easy', category: 'Arrays & Hashing' },
  { slug: 'two-sum', number: 1, title: 'Two Sum', difficulty: 'Easy', category: 'Arrays & Hashing' },
  { slug: 'group-anagrams', number: 49, title: 'Group Anagrams', difficulty: 'Medium', category: 'Arrays & Hashing' },
  { slug: 'top-k-frequent-elements', number: 347, title: 'Top K Frequent Elements', difficulty: 'Medium', category: 'Arrays & Hashing' },
  { slug: 'encode-and-decode-strings', number: 271, title: 'Encode and Decode Strings', difficulty: 'Medium', category: 'Arrays & Hashing' },
  { slug: 'product-of-array-except-self', number: 238, title: 'Product of Array Except Self', difficulty: 'Medium', category: 'Arrays & Hashing' },
  { slug: 'valid-sudoku', number: 36, title: 'Valid Sudoku', difficulty: 'Medium', category: 'Arrays & Hashing' },
  { slug: 'longest-consecutive-sequence', number: 128, title: 'Longest Consecutive Sequence', difficulty: 'Medium', category: 'Arrays & Hashing' },

  // --- Two Pointers (5) ----------------------------------------------------
  { slug: 'valid-palindrome', number: 125, title: 'Valid Palindrome', difficulty: 'Easy', category: 'Two Pointers' },
  { slug: 'two-sum-ii-input-array-is-sorted', number: 167, title: 'Two Sum II - Input Array Is Sorted', difficulty: 'Medium', category: 'Two Pointers' },
  { slug: '3sum', number: 15, title: '3Sum', difficulty: 'Medium', category: 'Two Pointers' },
  { slug: 'container-with-most-water', number: 11, title: 'Container With Most Water', difficulty: 'Medium', category: 'Two Pointers' },
  { slug: 'trapping-rain-water', number: 42, title: 'Trapping Rain Water', difficulty: 'Hard', category: 'Two Pointers' },

  // --- Sliding Window (6) --------------------------------------------------
  { slug: 'best-time-to-buy-and-sell-stock', number: 121, title: 'Best Time to Buy and Sell Stock', difficulty: 'Easy', category: 'Sliding Window' },
  { slug: 'longest-substring-without-repeating-characters', number: 3, title: 'Longest Substring Without Repeating Characters', difficulty: 'Medium', category: 'Sliding Window' },
  { slug: 'longest-repeating-character-replacement', number: 424, title: 'Longest Repeating Character Replacement', difficulty: 'Medium', category: 'Sliding Window' },
  { slug: 'permutation-in-string', number: 567, title: 'Permutation in String', difficulty: 'Medium', category: 'Sliding Window' },
  { slug: 'minimum-window-substring', number: 76, title: 'Minimum Window Substring', difficulty: 'Hard', category: 'Sliding Window' },
  { slug: 'sliding-window-maximum', number: 239, title: 'Sliding Window Maximum', difficulty: 'Hard', category: 'Sliding Window' },

  // --- Stack (7) -----------------------------------------------------------
  { slug: 'valid-parentheses', number: 20, title: 'Valid Parentheses', difficulty: 'Easy', category: 'Stack' },
  { slug: 'min-stack', number: 155, title: 'Min Stack', difficulty: 'Medium', category: 'Stack' },
  { slug: 'evaluate-reverse-polish-notation', number: 150, title: 'Evaluate Reverse Polish Notation', difficulty: 'Medium', category: 'Stack' },
  { slug: 'generate-parentheses', number: 22, title: 'Generate Parentheses', difficulty: 'Medium', category: 'Stack' },
  { slug: 'daily-temperatures', number: 739, title: 'Daily Temperatures', difficulty: 'Medium', category: 'Stack' },
  { slug: 'car-fleet', number: 853, title: 'Car Fleet', difficulty: 'Medium', category: 'Stack' },
  { slug: 'largest-rectangle-in-histogram', number: 84, title: 'Largest Rectangle in Histogram', difficulty: 'Hard', category: 'Stack' },

  // --- Binary Search (7) ---------------------------------------------------
  { slug: 'binary-search', number: 704, title: 'Binary Search', difficulty: 'Easy', category: 'Binary Search' },
  { slug: 'search-a-2d-matrix', number: 74, title: 'Search a 2D Matrix', difficulty: 'Medium', category: 'Binary Search' },
  { slug: 'koko-eating-bananas', number: 875, title: 'Koko Eating Bananas', difficulty: 'Medium', category: 'Binary Search' },
  { slug: 'find-minimum-in-rotated-sorted-array', number: 153, title: 'Find Minimum in Rotated Sorted Array', difficulty: 'Medium', category: 'Binary Search' },
  { slug: 'search-in-rotated-sorted-array', number: 33, title: 'Search in Rotated Sorted Array', difficulty: 'Medium', category: 'Binary Search' },
  { slug: 'time-based-key-value-store', number: 981, title: 'Time Based Key-Value Store', difficulty: 'Medium', category: 'Binary Search' },
  { slug: 'median-of-two-sorted-arrays', number: 4, title: 'Median of Two Sorted Arrays', difficulty: 'Hard', category: 'Binary Search' },

  // --- Linked List (11) ----------------------------------------------------
  { slug: 'reverse-linked-list', number: 206, title: 'Reverse Linked List', difficulty: 'Easy', category: 'Linked List' },
  { slug: 'merge-two-sorted-lists', number: 21, title: 'Merge Two Sorted Lists', difficulty: 'Easy', category: 'Linked List' },
  { slug: 'reorder-list', number: 143, title: 'Reorder List', difficulty: 'Medium', category: 'Linked List' },
  { slug: 'remove-nth-node-from-end-of-list', number: 19, title: 'Remove Nth Node From End of List', difficulty: 'Medium', category: 'Linked List' },
  { slug: 'copy-list-with-random-pointer', number: 138, title: 'Copy List with Random Pointer', difficulty: 'Medium', category: 'Linked List' },
  { slug: 'add-two-numbers', number: 2, title: 'Add Two Numbers', difficulty: 'Medium', category: 'Linked List' },
  { slug: 'linked-list-cycle', number: 141, title: 'Linked List Cycle', difficulty: 'Easy', category: 'Linked List' },
  { slug: 'find-the-duplicate-number', number: 287, title: 'Find the Duplicate Number', difficulty: 'Medium', category: 'Linked List' },
  { slug: 'lru-cache', number: 146, title: 'LRU Cache', difficulty: 'Medium', category: 'Linked List' },
  { slug: 'merge-k-sorted-lists', number: 23, title: 'Merge k Sorted Lists', difficulty: 'Hard', category: 'Linked List' },
  { slug: 'reverse-nodes-in-k-group', number: 25, title: 'Reverse Nodes in k-Group', difficulty: 'Hard', category: 'Linked List' },

  // --- Trees (15) ----------------------------------------------------------
  { slug: 'invert-binary-tree', number: 226, title: 'Invert Binary Tree', difficulty: 'Easy', category: 'Trees' },
  { slug: 'maximum-depth-of-binary-tree', number: 104, title: 'Maximum Depth of Binary Tree', difficulty: 'Easy', category: 'Trees' },
  { slug: 'diameter-of-binary-tree', number: 543, title: 'Diameter of Binary Tree', difficulty: 'Easy', category: 'Trees' },
  { slug: 'balanced-binary-tree', number: 110, title: 'Balanced Binary Tree', difficulty: 'Easy', category: 'Trees' },
  { slug: 'same-tree', number: 100, title: 'Same Tree', difficulty: 'Easy', category: 'Trees' },
  { slug: 'subtree-of-another-tree', number: 572, title: 'Subtree of Another Tree', difficulty: 'Easy', category: 'Trees' },
  { slug: 'lowest-common-ancestor-of-a-binary-search-tree', number: 235, title: 'Lowest Common Ancestor of a Binary Search Tree', difficulty: 'Medium', category: 'Trees' },
  { slug: 'binary-tree-level-order-traversal', number: 102, title: 'Binary Tree Level Order Traversal', difficulty: 'Medium', category: 'Trees' },
  { slug: 'binary-tree-right-side-view', number: 199, title: 'Binary Tree Right Side View', difficulty: 'Medium', category: 'Trees' },
  { slug: 'count-good-nodes-in-binary-tree', number: 1448, title: 'Count Good Nodes in Binary Tree', difficulty: 'Medium', category: 'Trees' },
  { slug: 'validate-binary-search-tree', number: 98, title: 'Validate Binary Search Tree', difficulty: 'Medium', category: 'Trees' },
  { slug: 'kth-smallest-element-in-a-bst', number: 230, title: 'Kth Smallest Element in a BST', difficulty: 'Medium', category: 'Trees' },
  { slug: 'construct-binary-tree-from-preorder-and-inorder-traversal', number: 105, title: 'Construct Binary Tree from Preorder and Inorder Traversal', difficulty: 'Medium', category: 'Trees' },
  { slug: 'binary-tree-maximum-path-sum', number: 124, title: 'Binary Tree Maximum Path Sum', difficulty: 'Hard', category: 'Trees' },
  { slug: 'serialize-and-deserialize-binary-tree', number: 297, title: 'Serialize and Deserialize Binary Tree', difficulty: 'Hard', category: 'Trees' },

  // --- Tries (3) -----------------------------------------------------------
  { slug: 'implement-trie-prefix-tree', number: 208, title: 'Implement Trie (Prefix Tree)', difficulty: 'Medium', category: 'Tries' },
  { slug: 'design-add-and-search-words-data-structure', number: 211, title: 'Design Add and Search Words Data Structure', difficulty: 'Medium', category: 'Tries' },
  { slug: 'word-search-ii', number: 212, title: 'Word Search II', difficulty: 'Hard', category: 'Tries' },

  // --- Heap / Priority Queue (7) -------------------------------------------
  { slug: 'kth-largest-element-in-a-stream', number: 703, title: 'Kth Largest Element in a Stream', difficulty: 'Easy', category: 'Heap / Priority Queue' },
  { slug: 'last-stone-weight', number: 1046, title: 'Last Stone Weight', difficulty: 'Easy', category: 'Heap / Priority Queue' },
  { slug: 'k-closest-points-to-origin', number: 973, title: 'K Closest Points to Origin', difficulty: 'Medium', category: 'Heap / Priority Queue' },
  { slug: 'kth-largest-element-in-an-array', number: 215, title: 'Kth Largest Element in an Array', difficulty: 'Medium', category: 'Heap / Priority Queue' },
  { slug: 'task-scheduler', number: 621, title: 'Task Scheduler', difficulty: 'Medium', category: 'Heap / Priority Queue' },
  { slug: 'design-twitter', number: 355, title: 'Design Twitter', difficulty: 'Medium', category: 'Heap / Priority Queue' },
  { slug: 'find-median-from-data-stream', number: 295, title: 'Find Median from Data Stream', difficulty: 'Hard', category: 'Heap / Priority Queue' },

  // --- Backtracking (9) ----------------------------------------------------
  { slug: 'subsets', number: 78, title: 'Subsets', difficulty: 'Medium', category: 'Backtracking' },
  { slug: 'combination-sum', number: 39, title: 'Combination Sum', difficulty: 'Medium', category: 'Backtracking' },
  { slug: 'permutations', number: 46, title: 'Permutations', difficulty: 'Medium', category: 'Backtracking' },
  { slug: 'subsets-ii', number: 90, title: 'Subsets II', difficulty: 'Medium', category: 'Backtracking' },
  { slug: 'combination-sum-ii', number: 40, title: 'Combination Sum II', difficulty: 'Medium', category: 'Backtracking' },
  { slug: 'word-search', number: 79, title: 'Word Search', difficulty: 'Medium', category: 'Backtracking' },
  { slug: 'palindrome-partitioning', number: 131, title: 'Palindrome Partitioning', difficulty: 'Medium', category: 'Backtracking' },
  { slug: 'letter-combinations-of-a-phone-number', number: 17, title: 'Letter Combinations of a Phone Number', difficulty: 'Medium', category: 'Backtracking' },
  { slug: 'n-queens', number: 51, title: 'N-Queens', difficulty: 'Hard', category: 'Backtracking' },

  // --- Graphs (13) ---------------------------------------------------------
  { slug: 'number-of-islands', number: 200, title: 'Number of Islands', difficulty: 'Medium', category: 'Graphs' },
  { slug: 'max-area-of-island', number: 695, title: 'Max Area of Island', difficulty: 'Medium', category: 'Graphs' },
  { slug: 'clone-graph', number: 133, title: 'Clone Graph', difficulty: 'Medium', category: 'Graphs' },
  { slug: 'walls-and-gates', number: 286, title: 'Walls and Gates', difficulty: 'Medium', category: 'Graphs' },
  { slug: 'rotting-oranges', number: 994, title: 'Rotting Oranges', difficulty: 'Medium', category: 'Graphs' },
  { slug: 'pacific-atlantic-water-flow', number: 417, title: 'Pacific Atlantic Water Flow', difficulty: 'Medium', category: 'Graphs' },
  { slug: 'surrounded-regions', number: 130, title: 'Surrounded Regions', difficulty: 'Medium', category: 'Graphs' },
  { slug: 'course-schedule', number: 207, title: 'Course Schedule', difficulty: 'Medium', category: 'Graphs' },
  { slug: 'course-schedule-ii', number: 210, title: 'Course Schedule II', difficulty: 'Medium', category: 'Graphs' },
  { slug: 'graph-valid-tree', number: 261, title: 'Graph Valid Tree', difficulty: 'Medium', category: 'Graphs' },
  { slug: 'number-of-connected-components-in-an-undirected-graph', number: 323, title: 'Number of Connected Components in an Undirected Graph', difficulty: 'Medium', category: 'Graphs' },
  { slug: 'redundant-connection', number: 684, title: 'Redundant Connection', difficulty: 'Medium', category: 'Graphs' },
  { slug: 'word-ladder', number: 127, title: 'Word Ladder', difficulty: 'Hard', category: 'Graphs' },

  // --- Advanced Graphs (6) -------------------------------------------------
  { slug: 'reconstruct-itinerary', number: 332, title: 'Reconstruct Itinerary', difficulty: 'Hard', category: 'Advanced Graphs' },
  { slug: 'min-cost-to-connect-all-points', number: 1584, title: 'Min Cost to Connect All Points', difficulty: 'Medium', category: 'Advanced Graphs' },
  { slug: 'network-delay-time', number: 743, title: 'Network Delay Time', difficulty: 'Medium', category: 'Advanced Graphs' },
  { slug: 'swim-in-rising-water', number: 778, title: 'Swim in Rising Water', difficulty: 'Hard', category: 'Advanced Graphs' },
  { slug: 'alien-dictionary', number: 269, title: 'Alien Dictionary', difficulty: 'Hard', category: 'Advanced Graphs' },
  { slug: 'cheapest-flights-within-k-stops', number: 787, title: 'Cheapest Flights Within K Stops', difficulty: 'Medium', category: 'Advanced Graphs' },

  // --- 1-D Dynamic Programming (12) ----------------------------------------
  { slug: 'climbing-stairs', number: 70, title: 'Climbing Stairs', difficulty: 'Easy', category: '1-D Dynamic Programming' },
  { slug: 'min-cost-climbing-stairs', number: 746, title: 'Min Cost Climbing Stairs', difficulty: 'Easy', category: '1-D Dynamic Programming' },
  { slug: 'house-robber', number: 198, title: 'House Robber', difficulty: 'Medium', category: '1-D Dynamic Programming' },
  { slug: 'house-robber-ii', number: 213, title: 'House Robber II', difficulty: 'Medium', category: '1-D Dynamic Programming' },
  { slug: 'longest-palindromic-substring', number: 5, title: 'Longest Palindromic Substring', difficulty: 'Medium', category: '1-D Dynamic Programming' },
  { slug: 'palindromic-substrings', number: 647, title: 'Palindromic Substrings', difficulty: 'Medium', category: '1-D Dynamic Programming' },
  { slug: 'decode-ways', number: 91, title: 'Decode Ways', difficulty: 'Medium', category: '1-D Dynamic Programming' },
  { slug: 'coin-change', number: 322, title: 'Coin Change', difficulty: 'Medium', category: '1-D Dynamic Programming' },
  { slug: 'maximum-product-subarray', number: 152, title: 'Maximum Product Subarray', difficulty: 'Medium', category: '1-D Dynamic Programming' },
  { slug: 'word-break', number: 139, title: 'Word Break', difficulty: 'Medium', category: '1-D Dynamic Programming' },
  { slug: 'longest-increasing-subsequence', number: 300, title: 'Longest Increasing Subsequence', difficulty: 'Medium', category: '1-D Dynamic Programming' },
  { slug: 'partition-equal-subset-sum', number: 416, title: 'Partition Equal Subset Sum', difficulty: 'Medium', category: '1-D Dynamic Programming' },

  // --- 2-D Dynamic Programming (11) ----------------------------------------
  { slug: 'unique-paths', number: 62, title: 'Unique Paths', difficulty: 'Medium', category: '2-D Dynamic Programming' },
  { slug: 'longest-common-subsequence', number: 1143, title: 'Longest Common Subsequence', difficulty: 'Medium', category: '2-D Dynamic Programming' },
  { slug: 'best-time-to-buy-and-sell-stock-with-cooldown', number: 309, title: 'Best Time to Buy and Sell Stock with Cooldown', difficulty: 'Medium', category: '2-D Dynamic Programming' },
  { slug: 'coin-change-ii', number: 518, title: 'Coin Change II', difficulty: 'Medium', category: '2-D Dynamic Programming' },
  { slug: 'target-sum', number: 494, title: 'Target Sum', difficulty: 'Medium', category: '2-D Dynamic Programming' },
  { slug: 'interleaving-string', number: 97, title: 'Interleaving String', difficulty: 'Medium', category: '2-D Dynamic Programming' },
  { slug: 'longest-increasing-path-in-a-matrix', number: 329, title: 'Longest Increasing Path in a Matrix', difficulty: 'Hard', category: '2-D Dynamic Programming' },
  { slug: 'distinct-subsequences', number: 115, title: 'Distinct Subsequences', difficulty: 'Hard', category: '2-D Dynamic Programming' },
  { slug: 'edit-distance', number: 72, title: 'Edit Distance', difficulty: 'Medium', category: '2-D Dynamic Programming' },
  { slug: 'burst-balloons', number: 312, title: 'Burst Balloons', difficulty: 'Hard', category: '2-D Dynamic Programming' },
  { slug: 'regular-expression-matching', number: 10, title: 'Regular Expression Matching', difficulty: 'Hard', category: '2-D Dynamic Programming' },

  // --- Greedy (8) ----------------------------------------------------------
  { slug: 'maximum-subarray', number: 53, title: 'Maximum Subarray', difficulty: 'Medium', category: 'Greedy' },
  { slug: 'jump-game', number: 55, title: 'Jump Game', difficulty: 'Medium', category: 'Greedy' },
  { slug: 'jump-game-ii', number: 45, title: 'Jump Game II', difficulty: 'Medium', category: 'Greedy' },
  { slug: 'gas-station', number: 134, title: 'Gas Station', difficulty: 'Medium', category: 'Greedy' },
  { slug: 'hand-of-straights', number: 846, title: 'Hand of Straights', difficulty: 'Medium', category: 'Greedy' },
  { slug: 'merge-triplets-to-form-target-triplet', number: 1899, title: 'Merge Triplets to Form Target Triplet', difficulty: 'Medium', category: 'Greedy' },
  { slug: 'partition-labels', number: 763, title: 'Partition Labels', difficulty: 'Medium', category: 'Greedy' },
  { slug: 'valid-parenthesis-string', number: 678, title: 'Valid Parenthesis String', difficulty: 'Medium', category: 'Greedy' },

  // --- Intervals (6) -------------------------------------------------------
  { slug: 'insert-interval', number: 57, title: 'Insert Interval', difficulty: 'Medium', category: 'Intervals' },
  { slug: 'merge-intervals', number: 56, title: 'Merge Intervals', difficulty: 'Medium', category: 'Intervals' },
  { slug: 'non-overlapping-intervals', number: 435, title: 'Non-overlapping Intervals', difficulty: 'Medium', category: 'Intervals' },
  { slug: 'meeting-rooms', number: 252, title: 'Meeting Rooms', difficulty: 'Easy', category: 'Intervals' },
  { slug: 'meeting-rooms-ii', number: 253, title: 'Meeting Rooms II', difficulty: 'Medium', category: 'Intervals' },
  { slug: 'minimum-interval-to-include-each-query', number: 1851, title: 'Minimum Interval to Include Each Query', difficulty: 'Hard', category: 'Intervals' },

  // --- Math & Geometry (8) -------------------------------------------------
  { slug: 'rotate-image', number: 48, title: 'Rotate Image', difficulty: 'Medium', category: 'Math & Geometry' },
  { slug: 'spiral-matrix', number: 54, title: 'Spiral Matrix', difficulty: 'Medium', category: 'Math & Geometry' },
  { slug: 'set-matrix-zeroes', number: 73, title: 'Set Matrix Zeroes', difficulty: 'Medium', category: 'Math & Geometry' },
  { slug: 'happy-number', number: 202, title: 'Happy Number', difficulty: 'Easy', category: 'Math & Geometry' },
  { slug: 'plus-one', number: 66, title: 'Plus One', difficulty: 'Easy', category: 'Math & Geometry' },
  // Our route segment can't carry LeetCode's punctuation-flattened slug, so this
  // is the one row that needs the override the type exists for.
  { slug: 'pow-x-n', number: 50, title: 'Pow(x, n)', difficulty: 'Medium', category: 'Math & Geometry', leetcodeSlug: 'powx-n' },
  { slug: 'multiply-strings', number: 43, title: 'Multiply Strings', difficulty: 'Medium', category: 'Math & Geometry' },
  { slug: 'detect-squares', number: 2013, title: 'Detect Squares', difficulty: 'Medium', category: 'Math & Geometry' },

  // --- Bit Manipulation (7) ------------------------------------------------
  { slug: 'single-number', number: 136, title: 'Single Number', difficulty: 'Easy', category: 'Bit Manipulation' },
  { slug: 'number-of-1-bits', number: 191, title: 'Number of 1 Bits', difficulty: 'Easy', category: 'Bit Manipulation' },
  { slug: 'counting-bits', number: 338, title: 'Counting Bits', difficulty: 'Easy', category: 'Bit Manipulation' },
  { slug: 'reverse-bits', number: 190, title: 'Reverse Bits', difficulty: 'Easy', category: 'Bit Manipulation' },
  { slug: 'missing-number', number: 268, title: 'Missing Number', difficulty: 'Easy', category: 'Bit Manipulation' },
  { slug: 'sum-of-two-integers', number: 371, title: 'Sum of Two Integers', difficulty: 'Medium', category: 'Bit Manipulation' },
  { slug: 'reverse-integer', number: 7, title: 'Reverse Integer', difficulty: 'Medium', category: 'Bit Manipulation' },
]
