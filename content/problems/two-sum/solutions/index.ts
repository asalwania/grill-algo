/**
 * Per-language listings (F14).
 *
 * Every listing here is a different rendering of the SAME algorithm the
 * canonical trace (`../trace.ts`) actually ran. `lineMap` points each
 * canonical trace line (the only line numbers `Frame.line` ever takes) at the
 * line in THIS listing that performs the same step. Frames, scene, vars and
 * narration never change with language — only the code pane's markup and
 * where its active-line bar lands.
 *
 * `lineMap` is not required to be 1:1. Where a language's idiom folds two
 * canonical steps onto one line (e.g. Python's `for i, num in enumerate(nums)`
 * binds `num` on the same line as the loop header), both canonical keys point
 * at that one line — the bar just lands on it twice, for two different
 * frames.
 */

import type { Approach, Language, Solution } from '../../../../lib/types'
import { BRUTE_LISTING, OPTIMIZED_LISTING } from '../trace'

// ---------------------------------------------------------------------------
// javascript — identity. This IS the canonical listing (lib/types.ts's
// Solution.lineMap doc: "canonical trace line -> line in THIS listing"; for
// the canonical listing itself, THIS listing is that listing).
// ---------------------------------------------------------------------------

const JAVASCRIPT_OPTIMIZED_LINE_MAP: Record<number, number> = {
  2: 2,
  5: 5,
  6: 6,
  8: 8,
  9: 9,
  12: 12,
  15: 15,
}

const JAVASCRIPT_BRUTE_LINE_MAP: Record<number, number> = {
  2: 2,
  4: 4,
  5: 5,
  10: 10,
}

// ---------------------------------------------------------------------------
// python
// ---------------------------------------------------------------------------

const PYTHON_OPTIMIZED_LISTING = [
  'def two_sum(nums, target):', //                    1
  '    seen = {}', //                                 2
  '', //                                               3
  '    for i, num in enumerate(nums):', //            4
  '        complement = target - num', //             5
  '', //                                               6
  '        if complement in seen:', //                7
  '            return [seen[complement], i]', //      8
  '', //                                               9
  '        seen[num] = i', //                         10
  '', //                                              11
  '    return []', //                                 12
].join('\n')

/**
 * `enumerate(nums)` binds `num` on the loop line itself, so canonical's
 * separate "read" step (`const num = nums[i]`, trace line 5) has no line of
 * its own here — it maps to line 4, the `for` header, same as canonical's
 * own loop line would.
 */
const PYTHON_OPTIMIZED_LINE_MAP: Record<number, number> = {
  2: 2, // seen = {}
  5: 4, // for i, num in enumerate(nums):  (num is bound here)
  6: 5, // complement = target - num
  8: 7, // if complement in seen:
  9: 8, // return [seen[complement], i]
  12: 10, // seen[num] = i
  15: 12, // return []
}

const PYTHON_BRUTE_LISTING = [
  'def two_sum(nums, target):', //                          1
  '    for i in range(len(nums)):', //                      2
  '        for j in range(i + 1, len(nums)):', //           3
  '            if nums[i] + nums[j] == target:', //         4
  '                return [i, j]', //                       5
  '', //                                                     6
  '    return []', //                                        7
].join('\n')

const PYTHON_BRUTE_LINE_MAP: Record<number, number> = {
  2: 2, // for i in range(len(nums)):
  4: 4, // if nums[i] + nums[j] == target:
  5: 5, // return [i, j]
  10: 7, // return []
}

// ---------------------------------------------------------------------------
// java
// ---------------------------------------------------------------------------

const JAVA_OPTIMIZED_LISTING = [
  'public int[] twoSum(int[] nums, int target) {', //             1
  '    Map<Integer, Integer> seen = new HashMap<>();', //         2
  '', //                                                           3
  '    for (int i = 0; i < nums.length; i++) {', //               4
  '        int num = nums[i];', //                                5
  '        int complement = target - num;', //                    6
  '', //                                                           7
  '        if (seen.containsKey(complement)) {', //               8
  '            return new int[] { seen.get(complement), i };', // 9
  '        }', //                                                10
  '', //                                                          11
  '        seen.put(num, i);', //                                12
  '    }', //                                                    13
  '', //                                                         14
  '    return new int[] {};', //                                 15
  '}', //                                                        16
].join('\n')

const JAVA_OPTIMIZED_LINE_MAP: Record<number, number> = {
  2: 2,
  5: 5,
  6: 6,
  8: 8,
  9: 9,
  12: 12,
  15: 15,
}

const JAVA_BRUTE_LISTING = [
  'public int[] twoSum(int[] nums, int target) {', //   1
  '    for (int i = 0; i < nums.length; i++) {', //     2
  '        for (int j = i + 1; j < nums.length; j++) {', // 3
  '            if (nums[i] + nums[j] == target) {', //  4
  '                return new int[] { i, j };', //       5
  '            }', //                                    6
  '        }', //                                        7
  '    }', //                                            8
  '', //                                                 9
  '    return new int[] {};', //                        10
  '}', //                                                11
].join('\n')

const JAVA_BRUTE_LINE_MAP: Record<number, number> = {
  2: 2,
  4: 4,
  5: 5,
  10: 10,
}

// ---------------------------------------------------------------------------
// go
// ---------------------------------------------------------------------------

const GO_OPTIMIZED_LISTING = [
  'func twoSum(nums []int, target int) []int {', //  1
  '    seen := make(map[int]int)', //                2
  '', //                                              3
  '    for i, num := range nums {', //               4
  '        complement := target - num', //           5
  '', //                                              6
  '        if j, ok := seen[complement]; ok {', //   7
  '            return []int{j, i}', //               8
  '        }', //                                     9
  '', //                                             10
  '        seen[num] = i', //                        11
  '    }', //                                        12
  '', //                                             13
  '    return []int{}', //                           14
  '}', //                                            15
].join('\n')

/** `range nums` binds `num` on the loop line, same shape as Python's `enumerate`. */
const GO_OPTIMIZED_LINE_MAP: Record<number, number> = {
  2: 2, // seen := make(map[int]int)
  5: 4, // for i, num := range nums {  (num is bound here)
  6: 5, // complement := target - num
  8: 7, // if j, ok := seen[complement]; ok {
  9: 8, // return []int{j, i}
  12: 11, // seen[num] = i
  15: 14, // return []int{}
}

const GO_BRUTE_LISTING = [
  'func twoSum(nums []int, target int) []int {', //          1
  '    for i := 0; i < len(nums); i++ {', //                 2
  '        for j := i + 1; j < len(nums); j++ {', //         3
  '            if nums[i]+nums[j] == target {', //           4
  '                return []int{i, j}', //                   5
  '            }', //                                        6
  '        }', //                                            7
  '    }', //                                                8
  '', //                                                     9
  '    return []int{}', //                                  10
  '}', //                                                    11
].join('\n')

const GO_BRUTE_LINE_MAP: Record<number, number> = {
  2: 2,
  4: 4,
  5: 5,
  10: 10,
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

/** Keyed only by the approaches Two Sum ships (see `traces.approaches`) —
 *  `Partial` because the `Approach` union spans every problem, not this one. */
export const solutions: Partial<Record<Approach, Solution[]>> = {
  optimized: LANGUAGES.map((language) => OPTIMIZED[language]),
  brute: LANGUAGES.map((language) => BRUTE[language]),
}
