/**
 * Per-language listings (F14), for all THREE of this problem's approaches.
 *
 * Every listing here is a different rendering of the SAME algorithm the
 * canonical trace (`../trace.ts`) actually ran. `lineMap` points each
 * canonical trace line (the only line numbers `Frame.line` ever takes) at the
 * line in THIS listing that performs the same step. Frames, scene, vars and
 * narration never change with language — only the code pane's markup and
 * where its active-line bar lands.
 */

import type { Approach, Language, Solution } from '../../../../lib/types'
import { BRUTE_LISTING, OPTIMIZED_LISTING, SORTED_LISTING } from '../trace'

// ---------------------------------------------------------------------------
// javascript — identity. These ARE the canonical listings.
// ---------------------------------------------------------------------------

const JAVASCRIPT_OPTIMIZED_LINE_MAP: Record<number, number> = {
  3: 3,
  6: 6,
  9: 9,
  13: 13,
  15: 15,
  18: 18,
  21: 21,
}

const JAVASCRIPT_SORTED_LINE_MAP: Record<number, number> = {
  3: 3,
  6: 6,
  7: 7,
  10: 10,
  11: 11,
  15: 15,
}

const JAVASCRIPT_BRUTE_LINE_MAP: Record<number, number> = {
  3: 3,
  6: 6,
  8: 8,
  12: 12,
  13: 13,
  20: 20,
  24: 24,
}

// ---------------------------------------------------------------------------
// python
// ---------------------------------------------------------------------------

const PYTHON_OPTIMIZED_LISTING = [
  'def is_anagram(s, t):', //                            1
  '    if len(s) != len(t):', //                         2
  '        return False', //                             3
  '', //                                                 4
  '    counts = {}', //                                  5
  '', //                                                 6
  '    for ch in s:', //                                 7
  '        counts[ch] = counts.get(ch, 0) + 1', //       8
  '', //                                                 9
  '    for ch in t:', //                                10
  '        count = counts.get(ch)', //                  11
  '        if not count:', //                           12
  '            return False', //                        13
  '', //                                                14
  '        counts[ch] = count - 1', //                  15
  '', //                                                16
  '    return True', //                                 17
].join('\n')

const PYTHON_OPTIMIZED_LINE_MAP: Record<number, number> = {
  3: 3,
  6: 5,
  9: 8,
  13: 11,
  15: 13,
  18: 15,
  21: 17,
}

const PYTHON_SORTED_LISTING = [
  'def is_anagram(s, t):', //                          1
  '    if len(s) != len(t):', //                       2
  '        return False', //                           3
  '', //                                               4
  '    sorted_s = sorted(s)', //                       5
  '    sorted_t = sorted(t)', //                       6
  '', //                                               7
  '    for i in range(len(sorted_s)):', //             8
  '        if sorted_s[i] != sorted_t[i]:', //         9
  '            return False', //                      10
  '', //                                              11
  '    return True', //                               12
].join('\n')

const PYTHON_SORTED_LINE_MAP: Record<number, number> = {
  3: 3,
  6: 5,
  7: 6,
  10: 9,
  11: 10,
  15: 12,
}

const PYTHON_BRUTE_LISTING = [
  'def is_anagram(s, t):', //                                1
  '    if len(s) != len(t):', //                             2
  '        return False', //                                 3
  '', //                                                     4
  '    used = [False] * len(t)', //                          5
  '', //                                                     6
  '    for i in range(len(s)):', //                          7
  '        matched = False', //                              8
  '', //                                                     9
  '        for j in range(len(t)):', //                     10
  '            if not used[j] and s[i] == t[j]:', //         11
  '                used[j] = True', //                      12
  '                matched = True', //                      13
  '                break', //                               14
  '', //                                                    15
  '        if not matched:', //                             16
  '            return False', //                            17
  '', //                                                    18
  '    return True', //                                     19
].join('\n')

const PYTHON_BRUTE_LINE_MAP: Record<number, number> = {
  3: 3,
  6: 5,
  8: 7,
  12: 11,
  13: 12,
  20: 17,
  24: 19,
}

// ---------------------------------------------------------------------------
// java
// ---------------------------------------------------------------------------

const JAVA_OPTIMIZED_LISTING = [
  'public boolean isAnagram(String s, String t) {', //     1
  '    if (s.length() != t.length()) {', //                2
  '        return false;', //                              3
  '    }', //                                              4
  '', //                                                   5
  '    Map<Character, Integer> counts = new HashMap<>();', // 6
  '', //                                                   7
  '    for (char ch : s.toCharArray()) {', //              8
  '        counts.merge(ch, 1, Integer::sum);', //         9
  '    }', //                                             10
  '', //                                                  11
  '    for (char ch : t.toCharArray()) {', //             12
  '        Integer count = counts.get(ch);', //           13
  '        if (count == null || count == 0) {', //        14
  '            return false;', //                         15
  '        }', //                                         16
  '', //                                                  17
  '        counts.put(ch, count - 1);', //                18
  '    }', //                                             19
  '', //                                                  20
  '    return true;', //                                  21
  '}', //                                                 22
].join('\n')

const JAVA_OPTIMIZED_LINE_MAP: Record<number, number> = {
  3: 3,
  6: 6,
  9: 9,
  13: 13,
  15: 15,
  18: 18,
  21: 21,
}

const JAVA_SORTED_LISTING = [
  'public boolean isAnagram(String s, String t) {', //  1
  '    if (s.length() != t.length()) {', //             2
  '        return false;', //                           3
  '    }', //                                           4
  '', //                                                5
  '    char[] sortedS = s.toCharArray();', //           6
  '    char[] sortedT = t.toCharArray();', //           7
  '    Arrays.sort(sortedS);', //                       8
  '    Arrays.sort(sortedT);', //                       9
  '', //                                               10
  '    for (int i = 0; i < sortedS.length; i++) {', // 11
  '        if (sortedS[i] != sortedT[i]) {', //        12
  '            return false;', //                      13
  '        }', //                                      14
  '    }', //                                          15
  '', //                                               16
  '    return true;', //                               17
  '}', //                                              18
].join('\n')

/** Java splits "make a copy" from "sort it" into two lines; canonical 6/7
 *  (which do both at once) point at the SORT itself, same rationale as
 *  Contains Duplicate's Go listing. */
const JAVA_SORTED_LINE_MAP: Record<number, number> = {
  3: 3,
  6: 8,
  7: 9,
  10: 11,
  11: 13,
  15: 17,
}

const JAVA_BRUTE_LISTING = [
  'public boolean isAnagram(String s, String t) {', //          1
  '    if (s.length() != t.length()) {', //                     2
  '        return false;', //                                   3
  '    }', //                                                   4
  '', //                                                        5
  '    boolean[] used = new boolean[t.length()];', //           6
  '', //                                                        7
  '    for (int i = 0; i < s.length(); i++) {', //              8
  '        boolean matched = false;', //                        9
  '', //                                                       10
  '        for (int j = 0; j < t.length(); j++) {', //         11
  '            if (!used[j] && s.charAt(i) == t.charAt(j)) {', // 12
  '                used[j] = true;', //                         13
  '                matched = true;', //                         14
  '                break;', //                                  15
  '            }', //                                           16
  '        }', //                                              17
  '', //                                                       18
  '        if (!matched) {', //                                19
  '            return false;', //                              20
  '        }', //                                              21
  '    }', //                                                  22
  '', //                                                       23
  '    return true;', //                                       24
  '}', //                                                      25
].join('\n')

const JAVA_BRUTE_LINE_MAP: Record<number, number> = {
  3: 3,
  6: 6,
  8: 8,
  12: 12,
  13: 13,
  20: 20,
  24: 24,
}

// ---------------------------------------------------------------------------
// go
// ---------------------------------------------------------------------------

const GO_OPTIMIZED_LISTING = [
  'func isAnagram(s string, t string) bool {', //   1
  '    if len(s) != len(t) {', //                   2
  '        return false', //                        3
  '    }', //                                       4
  '', //                                            5
  '    counts := make(map[rune]int)', //            6
  '', //                                            7
  '    for _, ch := range s {', //                  8
  '        counts[ch]++', //                        9
  '    }', //                                      10
  '', //                                           11
  '    for _, ch := range t {', //                 12
  '        count, ok := counts[ch]', //            13
  '        if !ok || count == 0 {', //             14
  '            return false', //                   15
  '        }', //                                  16
  '', //                                           17
  '        counts[ch]--', //                       18
  '    }', //                                      19
  '', //                                           20
  '    return true', //                            21
  '}', //                                          22
].join('\n')

const GO_OPTIMIZED_LINE_MAP: Record<number, number> = {
  3: 3,
  6: 6,
  9: 9,
  13: 13,
  15: 15,
  18: 18,
  21: 21,
}

const GO_SORTED_LISTING = [
  'func isAnagram(s string, t string) bool {', //                            1
  '    if len(s) != len(t) {', //                                           2
  '        return false', //                                                3
  '    }', //                                                               4
  '', //                                                                    5
  '    sortedS := []rune(s)', //                                            6
  '    sortedT := []rune(t)', //                                            7
  '    sort.Slice(sortedS, func(i, j int) bool { return sortedS[i] < sortedS[j] })', // 8
  '    sort.Slice(sortedT, func(i, j int) bool { return sortedT[i] < sortedT[j] })', // 9
  '', //                                                                   10
  '    for i := range sortedS {', //                                      11
  '        if sortedS[i] != sortedT[i] {', //                             12
  '            return false', //                                          13
  '        }', //                                                         14
  '    }', //                                                             15
  '', //                                                                  16
  '    return true', //                                                   17
  '}', //                                                                 18
].join('\n')

/** Same rationale as Java's: `sort.Slice` sorts in place, so the copy and the
 *  sort are separate lines here — canonical 6/7 point at the SORT. */
const GO_SORTED_LINE_MAP: Record<number, number> = {
  3: 3,
  6: 8,
  7: 9,
  10: 11,
  11: 13,
  15: 17,
}

const GO_BRUTE_LISTING = [
  'func isAnagram(s string, t string) bool {', //   1
  '    if len(s) != len(t) {', //                   2
  '        return false', //                        3
  '    }', //                                       4
  '', //                                            5
  '    used := make([]bool, len(t))', //            6
  '', //                                            7
  '    for i := 0; i < len(s); i++ {', //           8
  '        matched := false', //                    9
  '', //                                           10
  '        for j := 0; j < len(t); j++ {', //      11
  '            if !used[j] && s[i] == t[j] {', //  12
  '                used[j] = true', //              13
  '                matched = true', //              14
  '                break', //                       15
  '            }', //                               16
  '        }', //                                  17
  '', //                                           18
  '        if !matched {', //                      19
  '            return false', //                   20
  '        }', //                                  21
  '    }', //                                      22
  '', //                                           23
  '    return true', //                            24
  '}', //                                          25
].join('\n')

const GO_BRUTE_LINE_MAP: Record<number, number> = {
  3: 3,
  6: 6,
  8: 8,
  12: 12,
  13: 13,
  20: 20,
  24: 24,
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
