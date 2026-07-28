/**
 * Per-language listings (F14), for all THREE of this problem's approaches.
 *
 * Every listing here is a different rendering of the SAME algorithm the
 * canonical trace (`../trace.ts`) actually ran. `lineMap` points each canonical
 * trace line (the only line numbers `Frame.line` ever takes) at the line in
 * THIS listing that performs the same step. Frames, scene, vars and narration
 * never change with language — only the code pane's markup and where its
 * active-line bar lands.
 */

import type { Approach, Language, Solution } from '../../../../lib/types'
import { BRUTE_LISTING, OPTIMIZED_LISTING, SORTED_LISTING } from '../trace'

// ---------------------------------------------------------------------------
// javascript — identity. These ARE the canonical listings.
// ---------------------------------------------------------------------------

const JAVASCRIPT_OPTIMIZED_LINE_MAP: Record<number, number> = {
  2: 2,
  4: 4,
  7: 7,
  13: 13,
  16: 16,
  19: 19,
}

const JAVASCRIPT_SORTED_LINE_MAP: Record<number, number> = {
  2: 2,
  4: 4,
  8: 8,
  10: 10,
  12: 12,
  16: 16,
}

const JAVASCRIPT_BRUTE_LINE_MAP: Record<number, number> = {
  2: 2,
  4: 4,
  8: 8,
  9: 9,
  16: 16,
  20: 20,
}

// ---------------------------------------------------------------------------
// python
// ---------------------------------------------------------------------------

const PYTHON_OPTIMIZED_LISTING = [
  'def group_anagrams(strs):', //                              1
  '    groups = {}', //                                        2
  '', //                                                       3
  '    for word in strs:', //                                  4
  '        count = [0] * 26', //                               5
  '        for ch in word:', //                                6
  "            count[ord(ch) - ord('a')] += 1", //             7
  '', //                                                       8
  '        key = tuple(count)', //                             9
  '', //                                                      10
  '        if key not in groups:', //                         11
  '            groups[key] = []', //                          12
  '', //                                                      13
  '        groups[key].append(word)', //                      14
  '', //                                                      15
  '    return list(groups.values())', //                      16
].join('\n')

const PYTHON_OPTIMIZED_LINE_MAP: Record<number, number> = {
  2: 2,
  4: 4,
  7: 7,
  13: 12,
  16: 14,
  19: 16,
}

const PYTHON_SORTED_LISTING = [
  'def group_anagrams(strs):', //                                        1
  "    keyed = [(''.join(sorted(word)), word) for word in strs]", //     2
  '', //                                                                 3
  '    keyed.sort(key=lambda pair: pair[0])', //                         4
  '', //                                                                 5
  '    groups = []', //                                                  6
  '', //                                                                 7
  '    for i in range(len(keyed)):', //                                  8
  '        if i > 0 and keyed[i][0] == keyed[i - 1][0]:', //             9
  '            groups[-1].append(keyed[i][1])', //                      10
  '        else:', //                                                   11
  '            groups.append([keyed[i][1]])', //                        12
  '', //                                                                13
  '    return groups', //                                               14
].join('\n')

const PYTHON_SORTED_LINE_MAP: Record<number, number> = {
  2: 2,
  4: 4,
  8: 8,
  10: 10,
  12: 12,
  16: 14,
}

const PYTHON_BRUTE_LISTING = [
  'def group_anagrams(strs):', //                             1
  '    groups = []', //                                       2
  '', //                                                      3
  '    for word in strs:', //                                 4
  '        placed = False', //                                5
  '', //                                                      6
  '        for group in groups:', //                          7
  '            if is_anagram(word, group[0]):', //            8
  '                group.append(word)', //                    9
  '                placed = True', //                        10
  '                break', //                                11
  '', //                                                     12
  '        if not placed:', //                               13
  '            groups.append([word])', //                    14
  '', //                                                     15
  '    return groups', //                                    16
  '', //                                                     17
  'def is_anagram(a, b):', //                                18
  '    if len(a) != len(b):', //                             19
  '        return False', //                                 20
  '', //                                                     21
  '    counts = {}', //                                      22
  '    for ch in a:', //                                     23
  '        counts[ch] = counts.get(ch, 0) + 1', //           24
  '', //                                                     25
  '    for ch in b:', //                                     26
  '        n = counts.get(ch)', //                           27
  '        if not n:', //                                    28
  '            return False', //                             29
  '        counts[ch] = n - 1', //                           30
  '', //                                                     31
  '    return True', //                                      32
].join('\n')

const PYTHON_BRUTE_LINE_MAP: Record<number, number> = {
  2: 2,
  4: 4,
  8: 8,
  9: 9,
  16: 14,
  20: 16,
}

// ---------------------------------------------------------------------------
// java
// ---------------------------------------------------------------------------

const JAVA_OPTIMIZED_LISTING = [
  'public List<List<String>> groupAnagrams(String[] strs) {', //             1
  '    Map<String, List<String>> groups = new LinkedHashMap<>();', //        2
  '', //                                                                     3
  '    for (String word : strs) {', //                                       4
  '        int[] count = new int[26];', //                                   5
  "        for (char ch : word.toCharArray()) {", //                         6
  "            count[ch - 'a']++;", //                                       7
  '        }', //                                                            8
  '', //                                                                     9
  '        String key = Arrays.toString(count);', //                        10
  '', //                                                                    11
  '        if (!groups.containsKey(key)) {', //                             12
  '            groups.put(key, new ArrayList<>());', //                     13
  '        }', //                                                           14
  '', //                                                                    15
  '        groups.get(key).add(word);', //                                  16
  '    }', //                                                               17
  '', //                                                                    18
  '    return new ArrayList<>(groups.values());', //                        19
  '}', //                                                                   20
].join('\n')

const JAVA_OPTIMIZED_LINE_MAP: Record<number, number> = {
  2: 2,
  4: 4,
  7: 7,
  13: 13,
  16: 16,
  19: 19,
}

const JAVA_SORTED_LISTING = [
  'public List<List<String>> groupAnagrams(String[] strs) {', //             1
  '    String[][] keyed = new String[strs.length][2];', //                   2
  '    for (int i = 0; i < strs.length; i++) {', //                          3
  '        char[] letters = strs[i].toCharArray();', //                      4
  '        Arrays.sort(letters);', //                                        5
  '        keyed[i] = new String[] { new String(letters), strs[i] };', //    6
  '    }', //                                                                7
  '', //                                                                     8
  '    Arrays.sort(keyed, (a, b) -> a[0].compareTo(b[0]));', //              9
  '', //                                                                    10
  '    List<List<String>> groups = new ArrayList<>();', //                  11
  '', //                                                                    12
  '    for (int i = 0; i < keyed.length; i++) {', //                        13
  '        if (i > 0 && keyed[i][0].equals(keyed[i - 1][0])) {', //         14
  '            groups.get(groups.size() - 1).add(keyed[i][1]);', //         15
  '        } else {', //                                                    16
  '            groups.add(new ArrayList<>(List.of(keyed[i][1])));', //      17
  '        }', //                                                           18
  '    }', //                                                               19
  '', //                                                                    20
  '    return groups;', //                                                  21
  '}', //                                                                   22
].join('\n')

/** Canonical 2 builds the whole signed list in one expression; Java's loop
 *  finishes that job on line 6, so that is where the init frame lands. */
const JAVA_SORTED_LINE_MAP: Record<number, number> = {
  2: 6,
  4: 9,
  8: 13,
  10: 15,
  12: 17,
  16: 21,
}

const JAVA_BRUTE_LISTING = [
  'public List<List<String>> groupAnagrams(String[] strs) {', //             1
  '    List<List<String>> groups = new ArrayList<>();', //                   2
  '', //                                                                     3
  '    for (String word : strs) {', //                                       4
  '        boolean placed = false;', //                                      5
  '', //                                                                     6
  '        for (List<String> group : groups) {', //                          7
  '            if (isAnagram(word, group.get(0))) {', //                     8
  '                group.add(word);', //                                     9
  '                placed = true;', //                                      10
  '                break;', //                                              11
  '            }', //                                                       12
  '        }', //                                                           13
  '', //                                                                    14
  '        if (!placed) {', //                                              15
  '            groups.add(new ArrayList<>(List.of(word)));', //             16
  '        }', //                                                           17
  '    }', //                                                               18
  '', //                                                                    19
  '    return groups;', //                                                  20
  '}', //                                                                   21
  '', //                                                                    22
  'private boolean isAnagram(String a, String b) {', //                     23
  '    if (a.length() != b.length()) {', //                                 24
  '        return false;', //                                               25
  '    }', //                                                               26
  '', //                                                                    27
  '    Map<Character, Integer> counts = new HashMap<>();', //               28
  '    for (char ch : a.toCharArray()) {', //                               29
  '        counts.merge(ch, 1, Integer::sum);', //                          30
  '    }', //                                                               31
  '', //                                                                    32
  '    for (char ch : b.toCharArray()) {', //                               33
  '        Integer n = counts.get(ch);', //                                 34
  '        if (n == null || n == 0) {', //                                  35
  '            return false;', //                                           36
  '        }', //                                                           37
  '        counts.put(ch, n - 1);', //                                      38
  '    }', //                                                               39
  '', //                                                                    40
  '    return true;', //                                                    41
  '}', //                                                                   42
].join('\n')

const JAVA_BRUTE_LINE_MAP: Record<number, number> = {
  2: 2,
  4: 4,
  8: 8,
  9: 9,
  16: 16,
  20: 20,
}

// ---------------------------------------------------------------------------
// go
// ---------------------------------------------------------------------------

const GO_OPTIMIZED_LISTING = [
  'func groupAnagrams(strs []string) [][]string {', //                    1
  '    groups := make(map[[26]int][]string)', //                          2
  '    order := [][26]int{}', //                                          3
  '', //                                                                  4
  '    for _, word := range strs {', //                                   5
  '        var count [26]int', //                                         6
  "        for _, ch := range word {", //                                 7
  "            count[ch-'a']++", //                                       8
  '        }', //                                                         9
  '', //                                                                 10
  '        if _, ok := groups[count]; !ok {', //                         11
  '            groups[count] = []string{}', //                           12
  '            order = append(order, count)', //                         13
  '        }', //                                                        14
  '', //                                                                 15
  '        groups[count] = append(groups[count], word)', //              16
  '    }', //                                                            17
  '', //                                                                 18
  '    out := [][]string{}', //                                          19
  '    for _, key := range order {', //                                  20
  '        out = append(out, groups[key])', //                           21
  '    }', //                                                            22
  '    return out', //                                                   23
  '}', //                                                                24
].join('\n')

/** Go's maps have no insertion order, so this listing keeps `order` alongside
 *  and rebuilds the answer from it — canonical 19 (`return [...values()]`)
 *  points at the `return` that hands back that rebuilt slice. The `[26]int`
 *  array is comparable, so it can be the map key directly with no `join`. */
const GO_OPTIMIZED_LINE_MAP: Record<number, number> = {
  2: 2,
  4: 5,
  7: 8,
  13: 12,
  16: 16,
  19: 23,
}

const GO_SORTED_LISTING = [
  'func groupAnagrams(strs []string) [][]string {', //                                  1
  '    type pair struct{ key, word string }', //                                        2
  '    keyed := make([]pair, len(strs))', //                                            3
  '    for i, word := range strs {', //                                                 4
  '        letters := []byte(word)', //                                                 5
  '        sort.Slice(letters, func(a, b int) bool { return letters[a] < letters[b] })', // 6
  '        keyed[i] = pair{string(letters), word}', //                                  7
  '    }', //                                                                           8
  '', //                                                                                9
  '    sort.SliceStable(keyed, func(a, b int) bool { return keyed[a].key < keyed[b].key })', // 10
  '', //                                                                               11
  '    groups := [][]string{}', //                                                     12
  '', //                                                                               13
  '    for i := range keyed {', //                                                     14
  '        if i > 0 && keyed[i].key == keyed[i-1].key {', //                           15
  '            groups[len(groups)-1] = append(groups[len(groups)-1], keyed[i].word)', // 16
  '        } else {', //                                                               17
  '            groups = append(groups, []string{keyed[i].word})', //                   18
  '        }', //                                                                      19
  '    }', //                                                                          20
  '', //                                                                               21
  '    return groups', //                                                              22
  '}', //                                                                              23
].join('\n')

/** Same split as Java's: the signed list is finished on line 7, so canonical 2
 *  lands there rather than on the `make` that only sizes it. */
const GO_SORTED_LINE_MAP: Record<number, number> = {
  2: 7,
  4: 10,
  8: 14,
  10: 16,
  12: 18,
  16: 22,
}

const GO_BRUTE_LISTING = [
  'func groupAnagrams(strs []string) [][]string {', //          1
  '    groups := [][]string{}', //                              2
  '', //                                                        3
  '    for _, word := range strs {', //                         4
  '        placed := false', //                                 5
  '', //                                                        6
  '        for g := range groups {', //                         7
  '            if isAnagram(word, groups[g][0]) {', //          8
  '                groups[g] = append(groups[g], word)', //     9
  '                placed = true', //                          10
  '                break', //                                  11
  '            }', //                                          12
  '        }', //                                              13
  '', //                                                       14
  '        if !placed {', //                                   15
  '            groups = append(groups, []string{word})', //    16
  '        }', //                                              17
  '    }', //                                                  18
  '', //                                                       19
  '    return groups', //                                      20
  '}', //                                                      21
  '', //                                                       22
  'func isAnagram(a string, b string) bool {', //              23
  '    if len(a) != len(b) {', //                              24
  '        return false', //                                   25
  '    }', //                                                  26
  '', //                                                       27
  '    counts := make(map[rune]int)', //                       28
  '    for _, ch := range a {', //                             29
  '        counts[ch]++', //                                   30
  '    }', //                                                  31
  '', //                                                       32
  '    for _, ch := range b {', //                             33
  '        if counts[ch] == 0 {', //                           34
  '            return false', //                               35
  '        }', //                                              36
  '        counts[ch]--', //                                   37
  '    }', //                                                  38
  '', //                                                       39
  '    return true', //                                        40
  '}', //                                                      41
].join('\n')

const GO_BRUTE_LINE_MAP: Record<number, number> = {
  2: 2,
  4: 4,
  8: 8,
  9: 9,
  16: 16,
  20: 20,
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
