/**
 * Per-language listings (F14), for all THREE of this problem's approaches.
 *
 * Every listing here is a different rendering of the SAME algorithm the
 * canonical trace (`../trace.ts`) actually ran. `lineMap` points each
 * canonical trace line (the only line numbers `Frame.line` ever takes) at the
 * line in THIS listing that performs the same step. Frames, scene, vars and
 * narration never change with language — only the code pane's markup and
 * where its active-line bar lands.
 *
 * `lineMap` is not required to be 1:1. Go has no ternary operator, so its
 * `sorted` listing needs an if/else block where canonical has one line, and
 * it needs a helper function (`containsValue`) for `brute`'s linear scan,
 * same as Java — neither language has an array `.includes()`.
 */

import type { Approach, Language, Solution } from '../../../../lib/types'
import { BRUTE_LISTING, OPTIMIZED_LISTING, SORTED_LISTING } from '../trace'

// ---------------------------------------------------------------------------
// javascript — identity. These ARE the canonical listings.
// ---------------------------------------------------------------------------

const JAVASCRIPT_OPTIMIZED_LINE_MAP: Record<number, number> = {
  2: 2,
  3: 3,
  4: 4,
  10: 10,
  13: 13,
  15: 15,
  18: 18,
}

const JAVASCRIPT_SORTED_LINE_MAP: Record<number, number> = {
  2: 2,
  8: 8,
  10: 10,
  11: 11,
  14: 14,
}

const JAVASCRIPT_BRUTE_LINE_MAP: Record<number, number> = {
  2: 2,
  5: 5,
  8: 8,
  13: 13,
  16: 16,
}

// ---------------------------------------------------------------------------
// python
// ---------------------------------------------------------------------------

const PYTHON_OPTIMIZED_LISTING = [
  'def longest_consecutive(nums):', //           1
  '    num_set = set()', //                      2
  '    for num in nums:', //                     3
  '        num_set.add(num)', //                 4
  '', //                                          5
  '    longest = 0', //                           6
  '', //                                          7
  '    for num in num_set:', //                   8
  '        if num - 1 in num_set: continue', //   9
  '', //                                         10
  '        length = 1', //                       11
  '        while num + length in num_set: length += 1', // 12
  '', //                                         13
  '        longest = max(longest, length)', //   14
  '', //                                         15
  '    return longest', //                       16
].join('\n')

const PYTHON_OPTIMIZED_LINE_MAP: Record<number, number> = {
  2: 2, // num_set = set()
  3: 3, // for num in nums:
  4: 4, // num_set.add(num)
  10: 9, // if num - 1 in num_set: continue
  13: 12, // while num + length in num_set: length += 1
  15: 14, // longest = max(longest, length)
  18: 16, // return longest
}

const PYTHON_SORTED_LISTING = [
  'def longest_consecutive(nums):', //                                       1
  '    ordered = sorted(nums)', //                                           2
  '', //                                                                     3
  '    longest = 1', //                                                      4
  '    current = 1', //                                                      5
  '', //                                                                     6
  '    for i in range(1, len(ordered)):', //                                 7
  '        if ordered[i] == ordered[i - 1]: continue', //                    8
  '', //                                                                     9
  '        current = current + 1 if ordered[i] == ordered[i - 1] + 1 else 1', // 10
  '        longest = max(longest, current)', //                            11
  '', //                                                                    12
  '    return longest', //                                                  13
].join('\n')

const PYTHON_SORTED_LINE_MAP: Record<number, number> = {
  2: 2, // ordered = sorted(nums)
  8: 8, // if ordered[i] == ordered[i - 1]: continue
  10: 10, // current = current + 1 if ... else 1
  11: 11, // longest = max(longest, current)
  14: 13, // return longest
}

const PYTHON_BRUTE_LISTING = [
  'def longest_consecutive(nums):', //          1
  '    longest = 0', //                          2
  '', //                                          3
  '    for i in range(len(nums)):', //            4
  '        current = nums[i]', //                 5
  '        length = 1', //                        6
  '', //                                          7
  '        while current + 1 in nums:', //        8
  '            current += 1', //                  9
  '            length += 1', //                  10
  '', //                                         11
  '        longest = max(longest, length)', //   12
  '', //                                         13
  '    return longest', //                       14
].join('\n')

const PYTHON_BRUTE_LINE_MAP: Record<number, number> = {
  2: 2, // longest = 0
  5: 5, // current = nums[i]
  8: 8, // while current + 1 in nums:
  13: 12, // longest = max(longest, length)
  16: 14, // return longest
}

// ---------------------------------------------------------------------------
// java
// ---------------------------------------------------------------------------

const JAVA_OPTIMIZED_LISTING = [
  'public int longestConsecutive(int[] nums) {', //   1
  '    Set<Integer> numSet = new HashSet<>();', //     2
  '    for (int num : nums) {', //                     3
  '        numSet.add(num);', //                       4
  '    }', //                                          5
  '', //                                                6
  '    int longest = 0;', //                            7
  '', //                                                8
  '    for (int num : numSet) {', //                    9
  '        if (numSet.contains(num - 1)) continue;', // 10
  '', //                                                11
  '        int length = 1;', //                         12
  '        while (numSet.contains(num + length)) length++;', // 13
  '', //                                                14
  '        longest = Math.max(longest, length);', //   15
  '    }', //                                           16
  '', //                                                17
  '    return longest;', //                             18
  '}', //                                               19
].join('\n')

const JAVA_OPTIMIZED_LINE_MAP: Record<number, number> = {
  2: 2,
  3: 3,
  4: 4,
  10: 10,
  13: 13,
  15: 15,
  18: 18,
}

const JAVA_SORTED_LISTING = [
  'public int longestConsecutive(int[] nums) {', //      1
  '    int[] sorted = nums.clone();', //                  2
  '    Arrays.sort(sorted);', //                          3
  '', //                                                   4
  '    int longest = 1;', //                               5
  '    int current = 1;', //                               6
  '', //                                                    7
  '    for (int i = 1; i < sorted.length; i++) {', //       8
  '        if (sorted[i] == sorted[i - 1]) continue;', //   9
  '', //                                                   10
  '        current = sorted[i] == sorted[i - 1] + 1 ? current + 1 : 1;', // 11
  '        longest = Math.max(longest, current);', //      12
  '    }', //                                              13
  '', //                                                   14
  '    return longest;', //                                15
  '}', //                                                  16
].join('\n')

/** `nums.clone()` then `Arrays.sort(sorted)` splits canonical's one-line
 *  copy-and-sort into two — same shape as Go's `sort.Ints`. Canonical line 2
 *  maps to the SORT (line 3), the step both the init and sort frames are
 *  about: the array's order changing. */
const JAVA_SORTED_LINE_MAP: Record<number, number> = {
  2: 3, // Arrays.sort(sorted);
  8: 9, // if (sorted[i] == sorted[i - 1]) continue;
  10: 11, // current = sorted[i] == sorted[i - 1] + 1 ? current + 1 : 1;
  11: 12, // longest = Math.max(longest, current);
  14: 15, // return longest;
}

const JAVA_BRUTE_LISTING = [
  'public int longestConsecutive(int[] nums) {', //  1
  '    int longest = 0;', //                          2
  '', //                                               3
  '    for (int i = 0; i < nums.length; i++) {', //   4
  '        int current = nums[i];', //                5
  '        int length = 1;', //                       6
  '', //                                               7
  '        while (contains(nums, current + 1)) {', // 8
  '            current++;', //                        9
  '            length++;', //                        10
  '        }', //                                    11
  '', //                                              12
  '        longest = Math.max(longest, length);', //  13
  '    }', //                                         14
  '', //                                              15
  '    return longest;', //                           16
  '}', //                                             17
  '', //                                              18
  'private boolean contains(int[] nums, int value) {', // 19
  '    for (int num : nums) {', //                    20
  '        if (num == value) return true;', //        21
  '    }', //                                         22
  '    return false;', //                             23
  '}', //                                             24
].join('\n')

const JAVA_BRUTE_LINE_MAP: Record<number, number> = {
  2: 2,
  5: 5,
  8: 8,
  13: 13,
  16: 16,
}

// ---------------------------------------------------------------------------
// go
// ---------------------------------------------------------------------------

const GO_OPTIMIZED_LISTING = [
  'func longestConsecutive(nums []int) int {', //   1
  '    numSet := make(map[int]struct{})', //         2
  '    for _, num := range nums {', //               3
  '        numSet[num] = struct{}{}', //             4
  '    }', //                                        5
  '', //                                              6
  '    longest := 0', //                              7
  '', //                                              8
  '    for num := range numSet {', //                 9
  '        if _, ok := numSet[num-1]; ok {', //      10
  '            continue', //                         11
  '        }', //                                    12
  '', //                                             13
  '        length := 1', //                          14
  '        for {', //                                15
  '            if _, ok := numSet[num+length]; !ok {', // 16
  '                break', //                        17
  '            }', //                                18
  '            length++', //                         19
  '        }', //                                    20
  '', //                                             21
  '        longest = max(longest, length)', //       22
  '    }', //                                        23
  '', //                                             24
  '    return longest', //                           25
  '}', //                                            26
].join('\n')

const GO_OPTIMIZED_LINE_MAP: Record<number, number> = {
  2: 2,
  3: 3,
  4: 4,
  10: 10, // if _, ok := numSet[num-1]; ok {
  13: 16, // if _, ok := numSet[num+length]; !ok {
  15: 22, // longest = max(longest, length)
  18: 25, // return longest
}

const GO_SORTED_LISTING = [
  'func longestConsecutive(nums []int) int {', //         1
  '    sorted := append([]int(nil), nums...)', //          2
  '    sort.Ints(sorted)', //                               3
  '', //                                                     4
  '    longest := 1', //                                     5
  '    current := 1', //                                     6
  '', //                                                     7
  '    for i := 1; i < len(sorted); i++ {', //               8
  '        if sorted[i] == sorted[i-1] {', //                9
  '            continue', //                                10
  '        }', //                                           11
  '', //                                                    12
  '        if sorted[i] == sorted[i-1]+1 {', //             13
  '            current++', //                               14
  '        } else {', //                                    15
  '            current = 1', //                             16
  '        }', //                                           17
  '', //                                                    18
  '        longest = max(longest, current)', //             19
  '    }', //                                               20
  '', //                                                    21
  '    return longest', //                                  22
  '}', //                                                   23
].join('\n')

/** `sort.Ints` sorts IN PLACE, so Go needs a separate copy line, same as
 *  Contains Duplicate's own Go sorted listing. Canonical line 2 maps to the
 *  SORT (line 3), and Go has no ternary — `step` maps to the `if` that
 *  decides which branch runs, not either assignment inside it. */
const GO_SORTED_LINE_MAP: Record<number, number> = {
  2: 3, // sort.Ints(sorted)
  8: 9, // if sorted[i] == sorted[i-1] {
  10: 13, // if sorted[i] == sorted[i-1]+1 {
  11: 19, // longest = max(longest, current)
  14: 22, // return longest
}

const GO_BRUTE_LISTING = [
  'func longestConsecutive(nums []int) int {', //   1
  '    longest := 0', //                             2
  '', //                                              3
  '    for i := 0; i < len(nums); i++ {', //          4
  '        current := nums[i]', //                    5
  '        length := 1', //                           6
  '', //                                               7
  '        for containsValue(nums, current+1) {', //  8
  '            current++', //                          9
  '            length++', //                          10
  '        }', //                                     11
  '', //                                              12
  '        longest = max(longest, length)', //        13
  '    }', //                                         14
  '', //                                              15
  '    return longest', //                            16
  '}', //                                             17
  '', //                                              18
  'func containsValue(nums []int, value int) bool {', // 19
  '    for _, num := range nums {', //                20
  '        if num == value {', //                     21
  '            return true', //                       22
  '        }', //                                     23
  '    }', //                                         24
  '    return false', //                              25
  '}', //                                             26
].join('\n')

const GO_BRUTE_LINE_MAP: Record<number, number> = {
  2: 2,
  5: 5,
  8: 8,
  13: 13,
  16: 16,
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

const OPTIMIZED: Record<Language, Solution> = {
  javascript: {
    language: 'javascript',
    code: OPTIMIZED_LISTING,
    lineMap: JAVASCRIPT_OPTIMIZED_LINE_MAP,
  },
  python: {
    language: 'python',
    code: PYTHON_OPTIMIZED_LISTING,
    lineMap: PYTHON_OPTIMIZED_LINE_MAP,
  },
  java: {
    language: 'java',
    code: JAVA_OPTIMIZED_LISTING,
    lineMap: JAVA_OPTIMIZED_LINE_MAP,
  },
  go: {
    language: 'go',
    code: GO_OPTIMIZED_LISTING,
    lineMap: GO_OPTIMIZED_LINE_MAP,
  },
}

const SORTED: Record<Language, Solution> = {
  javascript: {
    language: 'javascript',
    code: SORTED_LISTING,
    lineMap: JAVASCRIPT_SORTED_LINE_MAP,
  },
  python: {
    language: 'python',
    code: PYTHON_SORTED_LISTING,
    lineMap: PYTHON_SORTED_LINE_MAP,
  },
  java: {
    language: 'java',
    code: JAVA_SORTED_LISTING,
    lineMap: JAVA_SORTED_LINE_MAP,
  },
  go: {
    language: 'go',
    code: GO_SORTED_LISTING,
    lineMap: GO_SORTED_LINE_MAP,
  },
}

const BRUTE: Record<Language, Solution> = {
  javascript: {
    language: 'javascript',
    code: BRUTE_LISTING,
    lineMap: JAVASCRIPT_BRUTE_LINE_MAP,
  },
  python: {
    language: 'python',
    code: PYTHON_BRUTE_LISTING,
    lineMap: PYTHON_BRUTE_LINE_MAP,
  },
  java: {
    language: 'java',
    code: JAVA_BRUTE_LISTING,
    lineMap: JAVA_BRUTE_LINE_MAP,
  },
  go: {
    language: 'go',
    code: GO_BRUTE_LISTING,
    lineMap: GO_BRUTE_LINE_MAP,
  },
}

const LANGUAGES: Language[] = ['javascript', 'python', 'java', 'go']

/** Keyed by the three approaches this problem ships (see `traces.approaches`)
 *  — `Partial` because the `Approach` union spans every problem, not this one. */
export const solutions: Partial<Record<Approach, Solution[]>> = {
  optimized: LANGUAGES.map((language) => OPTIMIZED[language]),
  sorted: LANGUAGES.map((language) => SORTED[language]),
  brute: LANGUAGES.map((language) => BRUTE[language]),
}
