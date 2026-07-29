/**
 * Per-language listings (F14), for both of this problem's approaches.
 *
 * Every listing here is a different rendering of the SAME algorithm the
 * canonical trace (`../trace.ts`) actually ran. `lineMap` points each canonical
 * trace line (the only line numbers `Frame.line` ever takes) at the line in
 * THIS listing that performs the same step. Frames, scene, vars and narration
 * never change with language — only the code pane's markup and where its
 * active-line bar lands.
 *
 * Both methods appear in every listing, because the trace runs the round trip:
 * an encoder nobody decodes proves nothing.
 */

import type { Approach, Language, Solution } from '../../../../lib/types'
import { BRUTE_LISTING, OPTIMIZED_LISTING } from '../trace'

// ---------------------------------------------------------------------------
// javascript — identity. These ARE the canonical listings.
// ---------------------------------------------------------------------------

const JAVASCRIPT_OPTIMIZED_LINE_MAP: Record<number, number> = {
  3: 3,
  4: 4,
  5: 5,
  7: 7,
  12: 12,
  15: 15,
  18: 18,
  21: 21,
  24: 24,
}

const JAVASCRIPT_BRUTE_LINE_MAP: Record<number, number> = {
  4: 4,
  5: 5,
  6: 6,
  10: 10,
  12: 12,
  13: 13,
  20: 20,
  26: 26,
  29: 29,
  31: 31,
  32: 32,
  34: 34,
}

// ---------------------------------------------------------------------------
// python
// ---------------------------------------------------------------------------

const PYTHON_OPTIMIZED_LISTING = [
  'class Solution:', //                             1
  '    def encode(self, strs):', //                 2
  '        res = []', //                            3
  '        for s in strs:', //                      4
  '            res.append(f"{len(s)}#{s}")', //     5
  '        return "".join(res)', //                 6
  '', //                                            7
  '    def decode(self, s):', //                    8
  '        res = []', //                            9
  '        i = 0', //                              10
  '        while i < len(s):', //                  11
  '            j = i', //                          12
  "            while s[j] != '#':", //             13
  '                j += 1', //                     14
  '            length = int(s[i:j])', //           15
  '            i = j + 1', //                      16
  '            res.append(s[i:i + length])', //    17
  '            i += length', //                    18
  '        return res', //                         19
].join('\n')

const PYTHON_OPTIMIZED_LINE_MAP: Record<number, number> = {
  3: 3,
  4: 4,
  5: 5,
  7: 6,
  12: 10,
  15: 13,
  18: 15,
  21: 17,
  24: 19,
}

const PYTHON_BRUTE_LISTING = [
  'class Solution:', //                                 1
  '    def encode(self, strs):', //                     2
  '        if not strs:', //                            3
  '            return ""', //                           4
  '        sizes = []', //                              5
  '        for s in strs:', //                          6
  '            sizes.append(len(s))', //                7
  '        parts = []', //                              8
  '        for sz in sizes:', //                        9
  '            parts.append(str(sz))', //              10
  '            parts.append(",")', //                  11
  '        parts.append("#")', //                      12
  '        parts.extend(strs)', //                     13
  '        return "".join(parts)', //                  14
  '', //                                               15
  '    def decode(self, s):', //                       16
  '        if not s:', //                              17
  '            return []', //                          18
  '        sizes = []', //                             19
  '        res = []', //                               20
  '        i = 0', //                                  21
  "        while s[i] != '#':", //                     22
  '            j = i', //                              23
  "            while s[j] != ',':", //                 24
  '                j += 1', //                         25
  '            sizes.append(int(s[i:j]))', //          26
  '            i = j + 1', //                          27
  '        i += 1', //                                 28
  '        for sz in sizes:', //                       29
  '            res.append(s[i:i + sz])', //            30
  '            i += sz', //                            31
  '        return res', //                             32
].join('\n')

/** Canonical 12 is `parts.push('#', ...strs)` — one call doing two things.
 *  Python splits it, and the frame is about the STRINGS going in, so it maps to
 *  the `extend` (13) rather than the `append("#")` above it. */
const PYTHON_BRUTE_LINE_MAP: Record<number, number> = {
  4: 5,
  5: 6,
  6: 7,
  10: 10,
  12: 13,
  13: 14,
  20: 21,
  26: 26,
  29: 28,
  31: 30,
  32: 31,
  34: 32,
}

// ---------------------------------------------------------------------------
// java
// ---------------------------------------------------------------------------

const JAVA_OPTIMIZED_LISTING = [
  'class Solution {', //                                                1
  '    public String encode(List<String> strs) {', //                   2
  '        StringBuilder res = new StringBuilder();', //                3
  '        for (String s : strs) {', //                                 4
  "            res.append(s.length()).append('#').append(s);", //       5
  '        }', //                                                       6
  '        return res.toString();', //                                  7
  '    }', //                                                           8
  '', //                                                                9
  '    public List<String> decode(String str) {', //                   10
  '        List<String> res = new ArrayList<>();', //                  11
  '        int i = 0;', //                                             12
  '        while (i < str.length()) {', //                             13
  '            int j = i;', //                                         14
  "            while (str.charAt(j) != '#') {", //                     15
  '                j++;', //                                           16
  '            }', //                                                  17
  '            int length = Integer.parseInt(str.substring(i, j));', // 18
  '            i = j + 1;', //                                         19
  '            res.add(str.substring(i, i + length));', //             20
  '            i += length;', //                                       21
  '        }', //                                                      22
  '        return res;', //                                            23
  '    }', //                                                          24
  '}', //                                                              25
].join('\n')

const JAVA_OPTIMIZED_LINE_MAP: Record<number, number> = {
  3: 3,
  4: 4,
  5: 5,
  7: 7,
  12: 12,
  15: 15,
  18: 18,
  21: 20,
  24: 23,
}

const JAVA_BRUTE_LISTING = [
  'class Solution {', //                                               1
  '    public String encode(List<String> strs) {', //                  2
  '        if (strs.isEmpty()) {', //                                  3
  '            return "";', //                                         4
  '        }', //                                                      5
  '        List<Integer> sizes = new ArrayList<>();', //               6
  '        for (String s : strs) {', //                                7
  '            sizes.add(s.length());', //                             8
  '        }', //                                                      9
  '        StringBuilder parts = new StringBuilder();', //            10
  '        for (int sz : sizes) {', //                                11
  "            parts.append(sz).append(',');", //                     12
  '        }', //                                                     13
  "        parts.append('#');", //                                    14
  '        for (String s : strs) {', //                               15
  '            parts.append(s);', //                                  16
  '        }', //                                                     17
  '        return parts.toString();', //                              18
  '    }', //                                                         19
  '', //                                                              20
  '    public List<String> decode(String str) {', //                  21
  '        if (str.isEmpty()) {', //                                  22
  '            return new ArrayList<>();', //                         23
  '        }', //                                                     24
  '        List<Integer> sizes = new ArrayList<>();', //              25
  '        List<String> res = new ArrayList<>();', //                 26
  '        int i = 0;', //                                            27
  "        while (str.charAt(i) != '#') {", //                        28
  '            int j = i;', //                                        29
  "            while (str.charAt(j) != ',') {", //                    30
  '                j++;', //                                          31
  '            }', //                                                 32
  '            sizes.add(Integer.parseInt(str.substring(i, j)));', // 33
  '            i = j + 1;', //                                        34
  '        }', //                                                     35
  '        i++;', //                                                  36
  '        for (int sz : sizes) {', //                                37
  '            res.add(str.substring(i, i + sz));', //                38
  '            i += sz;', //                                          39
  '        }', //                                                     40
  '        return res;', //                                           41
  '    }', //                                                         42
  '}', //                                                             43
].join('\n')

const JAVA_BRUTE_LINE_MAP: Record<number, number> = {
  4: 6,
  5: 7,
  6: 8,
  10: 12,
  12: 16,
  13: 18,
  20: 27,
  26: 33,
  29: 36,
  31: 38,
  32: 39,
  34: 41,
}

// ---------------------------------------------------------------------------
// go
// ---------------------------------------------------------------------------

const GO_OPTIMIZED_LISTING = [
  'func encode(strs []string) string {', //                    1
  '    var res strings.Builder', //                            2
  '    for _, s := range strs {', //                           3
  '        res.WriteString(strconv.Itoa(len(s)) + "#" + s)', //4
  '    }', //                                                  5
  '    return res.String()', //                                6
  '}', //                                                      7
  '', //                                                       8
  'func decode(str string) []string {', //                     9
  '    res := []string{}', //                                 10
  '    i := 0', //                                            11
  '    for i < len(str) {', //                                12
  '        j := i', //                                        13
  "        for str[j] != '#' {", //                           14
  '            j++', //                                       15
  '        }', //                                             16
  '        length, _ := strconv.Atoi(str[i:j])', //           17
  '        i = j + 1', //                                     18
  '        res = append(res, str[i:i+length])', //            19
  '        i += length', //                                   20
  '    }', //                                                 21
  '    return res', //                                        22
  '}', //                                                     23
].join('\n')

const GO_OPTIMIZED_LINE_MAP: Record<number, number> = {
  3: 2,
  4: 3,
  5: 4,
  7: 6,
  12: 11,
  15: 14,
  18: 17,
  21: 19,
  24: 22,
}

const GO_BRUTE_LISTING = [
  'func encode(strs []string) string {', //                 1
  '    if len(strs) == 0 {', //                             2
  '        return ""', //                                   3
  '    }', //                                               4
  '    sizes := []int{}', //                                5
  '    for _, s := range strs {', //                        6
  '        sizes = append(sizes, len(s))', //               7
  '    }', //                                               8
  '    var parts strings.Builder', //                       9
  '    for _, sz := range sizes {', //                     10
  '        parts.WriteString(strconv.Itoa(sz) + ",")', //  11
  '    }', //                                              12
  '    parts.WriteString("#")', //                         13
  '    for _, s := range strs {', //                       14
  '        parts.WriteString(s)', //                       15
  '    }', //                                              16
  '    return parts.String()', //                          17
  '}', //                                                  18
  '', //                                                   19
  'func decode(str string) []string {', //                 20
  '    if len(str) == 0 {', //                             21
  '        return []string{}', //                          22
  '    }', //                                              23
  '    sizes := []int{}', //                               24
  '    res := []string{}', //                              25
  '    i := 0', //                                         26
  "    for str[i] != '#' {", //                            27
  '        j := i', //                                     28
  "        for str[j] != ',' {", //                        29
  '            j++', //                                    30
  '        }', //                                          31
  '        size, _ := strconv.Atoi(str[i:j])', //          32
  '        sizes = append(sizes, size)', //                33
  '        i = j + 1', //                                  34
  '    }', //                                              35
  '    i++', //                                            36
  '    for _, sz := range sizes {', //                     37
  '        res = append(res, str[i:i+sz])', //             38
  '        i += sz', //                                    39
  '    }', //                                              40
  '    return res', //                                     41
  '}', //                                                  42
].join('\n')

/** Go's `strconv.Atoi` returns a value and an error, so parsing and recording
 *  the size are two lines where canonical does both on 26 — it maps to the
 *  APPEND (33), which is the step the frame is about. */
const GO_BRUTE_LINE_MAP: Record<number, number> = {
  4: 5,
  5: 6,
  6: 7,
  10: 11,
  12: 15,
  13: 17,
  20: 26,
  26: 33,
  29: 36,
  31: 38,
  32: 39,
  34: 41,
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
