/**
 * Per-language listings (F14), for both of this problem's approaches.
 *
 * Every listing here is a different rendering of the SAME algorithm the
 * canonical trace (`../trace.ts`) actually ran. `lineMap` points each canonical
 * trace line (the only line numbers `Frame.line` ever takes) at the line in
 * THIS listing that performs the same step. Frames, scene, vars and narration
 * never change with language — only the code pane's markup and where its
 * active-line bar lands.
 */

import type { Approach, Language, Solution } from '../../../../lib/types'
import { BRUTE_LISTING, OPTIMIZED_LISTING } from '../trace'

// ---------------------------------------------------------------------------
// javascript — identity. These ARE the canonical listings.
// ---------------------------------------------------------------------------

const JAVASCRIPT_OPTIMIZED_LINE_MAP: Record<number, number> = {
  3: 3,
  6: 6,
  7: 7,
  11: 11,
  12: 12,
  13: 13,
  17: 17,
}

const JAVASCRIPT_BRUTE_LINE_MAP: Record<number, number> = {
  3: 3,
  6: 6,
  9: 9,
  11: 11,
  14: 14,
}

// ---------------------------------------------------------------------------
// python
// ---------------------------------------------------------------------------

const PYTHON_OPTIMIZED_LISTING = [
  'def productExceptSelf(nums):', //          1
  '    n = len(nums)', //                     2
  '    answer = [1] * n', //                  3
  '', //                                      4
  '    prefix = 1', //                        5
  '    for i in range(n):', //                6
  '        answer[i] = prefix', //            7
  '        prefix *= nums[i]', //             8
  '', //                                      9
  '    suffix = 1', //                       10
  '    for i in range(n - 1, -1, -1):', //   11
  '        answer[i] *= suffix', //          12
  '        suffix *= nums[i]', //            13
  '', //                                     14
  '    return answer', //                    15
].join('\n')

const PYTHON_OPTIMIZED_LINE_MAP: Record<number, number> = {
  3: 3,
  6: 6,
  7: 7,
  11: 10,
  12: 11,
  13: 12,
  17: 15,
}

const PYTHON_BRUTE_LISTING = [
  'def productExceptSelf(nums):', //          1
  '    n = len(nums)', //                     2
  '    answer = [0] * n', //                  3
  '', //                                      4
  '    for i in range(n):', //                5
  '        product = 1', //                   6
  '        for j in range(n):', //            7
  '            if j == i:', //                8
  '                continue', //              9
  '            product *= nums[j]', //       10
  '        answer[i] = product', //          11
  '', //                                     12
  '    return answer', //                    13
].join('\n')

const PYTHON_BRUTE_LINE_MAP: Record<number, number> = {
  3: 3,
  6: 6,
  9: 10,
  11: 11,
  14: 13,
}

// ---------------------------------------------------------------------------
// java
// ---------------------------------------------------------------------------

const JAVA_OPTIMIZED_LISTING = [
  'class Solution {', //                                    1
  '    public int[] productExceptSelf(int[] nums) {', //    2
  '        int n = nums.length;', //                        3
  '        int[] answer = new int[n];', //                  4
  '', //                                                    5
  '        int prefix = 1;', //                             6
  '        for (int i = 0; i < n; i++) {', //               7
  '            answer[i] = prefix;', //                     8
  '            prefix *= nums[i];', //                      9
  '        }', //                                          10
  '', //                                                   11
  '        int suffix = 1;', //                            12
  '        for (int i = n - 1; i >= 0; i--) {', //         13
  '            answer[i] *= suffix;', //                   14
  '            suffix *= nums[i];', //                     15
  '        }', //                                          16
  '', //                                                   17
  '        return answer;', //                             18
  '    }', //                                              19
  '}', //                                                  20
].join('\n')

const JAVA_OPTIMIZED_LINE_MAP: Record<number, number> = {
  3: 4,
  6: 7,
  7: 8,
  11: 12,
  12: 13,
  13: 14,
  17: 18,
}

const JAVA_BRUTE_LISTING = [
  'class Solution {', //                                    1
  '    public int[] productExceptSelf(int[] nums) {', //    2
  '        int n = nums.length;', //                        3
  '        int[] answer = new int[n];', //                  4
  '', //                                                    5
  '        for (int i = 0; i < n; i++) {', //               6
  '            int product = 1;', //                        7
  '            for (int j = 0; j < n; j++) {', //           8
  '                if (j == i) continue;', //               9
  '                product *= nums[j];', //                10
  '            }', //                                      11
  '            answer[i] = product;', //                   12
  '        }', //                                          13
  '', //                                                   14
  '        return answer;', //                             15
  '    }', //                                              16
  '}', //                                                  17
].join('\n')

const JAVA_BRUTE_LINE_MAP: Record<number, number> = {
  3: 4,
  6: 7,
  9: 10,
  11: 12,
  14: 15,
}

// ---------------------------------------------------------------------------
// go
// ---------------------------------------------------------------------------

const GO_OPTIMIZED_LISTING = [
  'func productExceptSelf(nums []int) []int {', //   1
  '    n := len(nums)', //                           2
  '    answer := make([]int, n)', //                 3
  '', //                                             4
  '    prefix := 1', //                              5
  '    for i := 0; i < n; i++ {', //                 6
  '        answer[i] = prefix', //                   7
  '        prefix *= nums[i]', //                    8
  '    }', //                                        9
  '', //                                            10
  '    suffix := 1', //                             11
  '    for i := n - 1; i >= 0; i-- {', //           12
  '        answer[i] *= suffix', //                 13
  '        suffix *= nums[i]', //                   14
  '    }', //                                       15
  '', //                                            16
  '    return answer', //                           17
  '}', //                                           18
].join('\n')

const GO_OPTIMIZED_LINE_MAP: Record<number, number> = {
  3: 3,
  6: 6,
  7: 7,
  11: 11,
  12: 12,
  13: 13,
  17: 17,
}

const GO_BRUTE_LISTING = [
  'func productExceptSelf(nums []int) []int {', //   1
  '    n := len(nums)', //                           2
  '    answer := make([]int, n)', //                 3
  '', //                                             4
  '    for i := 0; i < n; i++ {', //                 5
  '        product := 1', //                         6
  '        for j := 0; j < n; j++ {', //             7
  '            if j == i {', //                      8
  '                continue', //                     9
  '            }', //                               10
  '            product *= nums[j]', //              11
  '        }', //                                   12
  '        answer[i] = product', //                 13
  '    }', //                                       14
  '', //                                            15
  '    return answer', //                           16
  '}', //                                           17
].join('\n')

const GO_BRUTE_LINE_MAP: Record<number, number> = {
  3: 3,
  6: 6,
  9: 11,
  11: 13,
  14: 16,
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

/** Keyed by the two approaches this problem ships (see `traces.approaches`) —
 *  `Partial` because the `Approach` union spans every problem, not this one. */
export const solutions: Partial<Record<Approach, Solution[]>> = {
  optimized: LANGUAGES.map((language) => OPTIMIZED[language]),
  brute: LANGUAGES.map((language) => BRUTE[language]),
}
