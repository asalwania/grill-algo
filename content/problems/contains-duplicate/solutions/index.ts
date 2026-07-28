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
 * `lineMap` is not required to be 1:1. Where a language needs two lines for
 * what the canonical listing does in one (Go has to copy the slice before
 * sorting it), the canonical key points at whichever line performs the step
 * the frame is actually about.
 */

import type { Approach, Language, Solution } from '../../../../lib/types'
import { BRUTE_LISTING, OPTIMIZED_LISTING, SORTED_LISTING } from '../trace'

// ---------------------------------------------------------------------------
// javascript — identity. These ARE the canonical listings (lib/types.ts's
// Solution.lineMap doc: "canonical trace line -> line in THIS listing"; for
// the canonical listing itself, THIS listing is that listing).
// ---------------------------------------------------------------------------

const JAVASCRIPT_OPTIMIZED_LINE_MAP: Record<number, number> = {
  2: 2,
  4: 4,
  5: 5,
  6: 6,
  9: 9,
  12: 12,
}

const JAVASCRIPT_SORTED_LINE_MAP: Record<number, number> = {
  2: 2,
  5: 5,
  6: 6,
  10: 10,
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
  'def contains_duplicate(nums):', //   1
  '    seen = set()', //                2
  '', //                                3
  '    for num in nums:', //            4
  '        if num in seen:', //         5
  '            return True', //         6
  '', //                                7
  '        seen.add(num)', //           8
  '', //                                9
  '    return False', //               10
].join('\n')

const PYTHON_OPTIMIZED_LINE_MAP: Record<number, number> = {
  2: 2, // seen = set()
  4: 4, // for num in nums:
  5: 5, // if num in seen:
  6: 6, // return True
  9: 8, // seen.add(num)
  12: 10, // return False
}

const PYTHON_SORTED_LISTING = [
  'def contains_duplicate(nums):', //                 1
  '    ordered = sorted(nums)', //                    2
  '', //                                              3
  '    for i in range(1, len(ordered)):', //          4
  '        if ordered[i] == ordered[i - 1]:', //      5
  '            return True', //                       6
  '', //                                              7
  '    return False', //                              8
].join('\n')

/** `sorted()` returns a new list, so the copy and the sort really are one
 *  line here — same shape as the canonical listing's spread-then-sort. */
const PYTHON_SORTED_LINE_MAP: Record<number, number> = {
  2: 2, // ordered = sorted(nums)
  5: 5, // if ordered[i] == ordered[i - 1]:
  6: 6, // return True
  10: 8, // return False
}

const PYTHON_BRUTE_LISTING = [
  'def contains_duplicate(nums):', //                    1
  '    for i in range(len(nums)):', //                   2
  '        for j in range(i + 1, len(nums)):', //        3
  '            if nums[i] == nums[j]:', //               4
  '                return True', //                      5
  '', //                                                 6
  '    return False', //                                 7
].join('\n')

const PYTHON_BRUTE_LINE_MAP: Record<number, number> = {
  2: 2, // for i in range(len(nums)):
  4: 4, // if nums[i] == nums[j]:
  5: 5, // return True
  10: 7, // return False
}

// ---------------------------------------------------------------------------
// java
// ---------------------------------------------------------------------------

const JAVA_OPTIMIZED_LISTING = [
  'public boolean containsDuplicate(int[] nums) {', //   1
  '    Set<Integer> seen = new HashSet<>();', //         2
  '', //                                                 3
  '    for (int num : nums) {', //                       4
  '        if (seen.contains(num)) {', //                5
  '            return true;', //                         6
  '        }', //                                        7
  '', //                                                 8
  '        seen.add(num);', //                           9
  '    }', //                                           10
  '', //                                                11
  '    return false;', //                               12
  '}', //                                               13
].join('\n')

const JAVA_OPTIMIZED_LINE_MAP: Record<number, number> = {
  2: 2,
  4: 4,
  5: 5,
  6: 6,
  9: 9,
  12: 12,
}

const JAVA_SORTED_LISTING = [
  'public boolean containsDuplicate(int[] nums) {', //             1
  '    int[] sorted = Arrays.stream(nums).sorted().toArray();', // 2
  '', //                                                           3
  '    for (int i = 1; i < sorted.length; i++) {', //              4
  '        if (sorted[i] == sorted[i - 1]) {', //                  5
  '            return true;', //                                   6
  '        }', //                                                  7
  '    }', //                                                      8
  '', //                                                           9
  '    return false;', //                                         10
  '}', //                                                         11
].join('\n')

/** The stream form is used over `nums.clone()` + `Arrays.sort()` precisely so
 *  the copy-and-sort stays on ONE line, keeping this map 1:1 with canonical. */
const JAVA_SORTED_LINE_MAP: Record<number, number> = {
  2: 2,
  5: 5,
  6: 6,
  10: 10,
}

const JAVA_BRUTE_LISTING = [
  'public boolean containsDuplicate(int[] nums) {', //      1
  '    for (int i = 0; i < nums.length; i++) {', //         2
  '        for (int j = i + 1; j < nums.length; j++) {', // 3
  '            if (nums[i] == nums[j]) {', //               4
  '                return true;', //                        5
  '            }', //                                       6
  '        }', //                                           7
  '    }', //                                               8
  '', //                                                    9
  '    return false;', //                                  10
  '}', //                                                  11
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
  'func containsDuplicate(nums []int) bool {', //   1
  '    seen := make(map[int]struct{})', //          2
  '', //                                            3
  '    for _, num := range nums {', //              4
  '        if _, ok := seen[num]; ok {', //         5
  '            return true', //                     6
  '        }', //                                   7
  '', //                                            8
  '        seen[num] = struct{}{}', //              9
  '    }', //                                      10
  '', //                                           11
  '    return false', //                           12
  '}', //                                          13
].join('\n')

/** Go has no set type; `map[int]struct{}` is the idiom, and `struct{}{}` is a
 *  zero-width value — so this really is a set, not a map with wasted values. */
const GO_OPTIMIZED_LINE_MAP: Record<number, number> = {
  2: 2,
  4: 4,
  5: 5,
  6: 6,
  9: 9,
  12: 12,
}

const GO_SORTED_LISTING = [
  'func containsDuplicate(nums []int) bool {', //          1
  '    sorted := append([]int(nil), nums...)', //          2
  '    sort.Ints(sorted)', //                              3
  '', //                                                   4
  '    for i := 1; i < len(sorted); i++ {', //             5
  '        if sorted[i] == sorted[i-1] {', //              6
  '            return true', //                            7
  '        }', //                                          8
  '    }', //                                              9
  '', //                                                  10
  '    return false', //                                  11
  '}', //                                                 12
].join('\n')

/**
 * `sort.Ints` sorts IN PLACE, so Go needs a separate copy line — the only
 * listing here where the canonical single line becomes two. Canonical line 2
 * maps to the SORT (line 3) rather than the copy, because that is the step
 * both frames pointing at it are about: the array's order changing.
 */
const GO_SORTED_LINE_MAP: Record<number, number> = {
  2: 3, // sort.Ints(sorted)
  5: 6, // if sorted[i] == sorted[i-1] {
  6: 7, // return true
  10: 11, // return false
}

const GO_BRUTE_LISTING = [
  'func containsDuplicate(nums []int) bool {', //     1
  '    for i := 0; i < len(nums); i++ {', //          2
  '        for j := i + 1; j < len(nums); j++ {', //  3
  '            if nums[i] == nums[j] {', //           4
  '                return true', //                   5
  '            }', //                                 6
  '        }', //                                     7
  '    }', //                                         8
  '', //                                              9
  '    return false', //                             10
  '}', //                                            11
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
