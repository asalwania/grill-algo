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
  5: 5,
  6: 6,
  11: 11,
  17: 17,
  22: 22,
}

const JAVASCRIPT_SORTED_LINE_MAP: Record<number, number> = {
  2: 2,
  3: 3,
  6: 6,
  8: 8,
  10: 10,
  14: 14,
  16: 16,
}

const JAVASCRIPT_BRUTE_LINE_MAP: Record<number, number> = {
  2: 2,
  8: 8,
  13: 13,
  22: 22,
  25: 25,
}

// ---------------------------------------------------------------------------
// python
// ---------------------------------------------------------------------------

const PYTHON_OPTIMIZED_LISTING = [
  'def top_k_frequent(nums, k):', //                            1
  '    count = {}', //                                          2
  '', //                                                        3
  '    for num in nums:', //                                    4
  '        seen = count.get(num, 0)', //                        5
  '        count[num] = seen + 1', //                           6
  '', //                                                        7
  '    buckets = [[] for _ in range(len(nums) + 1)]', //        8
  '    for num, freq in count.items():', //                     9
  '        buckets[freq].append(num)', //                      10
  '', //                                                       11
  '    out = []', //                                           12
  '    for freq in range(len(nums), 0, -1):', //               13
  '        for num in buckets[freq]:', //                      14
  '            out.append(num)', //                            15
  '            if len(out) == k:', //                          16
  '                break', //                                  17
  '        if len(out) == k:', //                              18
  '            break', //                                      19
  '', //                                                       20
  '    return out', //                                         21
].join('\n')

const PYTHON_OPTIMIZED_LINE_MAP: Record<number, number> = {
  2: 2,
  4: 4,
  5: 5,
  6: 6,
  11: 10,
  17: 15,
  22: 21,
}

const PYTHON_SORTED_LISTING = [
  'def top_k_frequent(nums, k):', //                            1
  '    ordered = list(nums)', //                                2
  '    ordered.sort()', //                                      3
  '', //                                                        4
  '    runs = []', //                                           5
  '    for i in range(len(ordered)):', //                       6
  '        if i > 0 and ordered[i] == ordered[i - 1]:', //      7
  '            runs[-1][1] += 1', //                            8
  '        else:', //                                           9
  '            runs.append([ordered[i], 1])', //               10
  '', //                                                       11
  '    runs.sort(key=lambda run: -run[1])', //                 12
  '', //                                                       13
  '    return [run[0] for run in runs[:k]]', //                14
].join('\n')

const PYTHON_SORTED_LINE_MAP: Record<number, number> = {
  2: 2,
  3: 3,
  6: 6,
  8: 8,
  10: 10,
  14: 12,
  16: 14,
}

const PYTHON_BRUTE_LISTING = [
  'def top_k_frequent(nums, k):', //                            1
  '    out = []', //                                            2
  '', //                                                        3
  '    while len(out) < k:', //                                 4
  '        best = None', //                                     5
  '        best_count = 0', //                                  6
  '', //                                                        7
  '        for i in range(len(nums)):', //                      8
  '            if nums[i] in out:', //                          9
  '                continue', //                               10
  '', //                                                       11
  '            count = 0', //                                  12
  '            for j in range(len(nums)):', //                 13
  '                if nums[j] == nums[i]:', //                 14
  '                    count += 1', //                         15
  '', //                                                       16
  '            if count > best_count:', //                     17
  '                best = nums[i]', //                         18
  '                best_count = count', //                     19
  '', //                                                       20
  '        out.append(best)', //                               21
  '', //                                                       22
  '    return out', //                                         23
].join('\n')

/** Canonical 13 is `if (nums[j] === nums[i]) count++` on one line; Python needs
 *  two, and the frame is about the COMPARISON, so it lands on that. */
const PYTHON_BRUTE_LINE_MAP: Record<number, number> = {
  2: 2,
  8: 8,
  13: 14,
  22: 21,
  25: 23,
}

// ---------------------------------------------------------------------------
// java
// ---------------------------------------------------------------------------

const JAVA_OPTIMIZED_LISTING = [
  'public int[] topKFrequent(int[] nums, int k) {', //                        1
  '    Map<Integer, Integer> count = new LinkedHashMap<>();', //              2
  '', //                                                                      3
  '    for (int num : nums) {', //                                            4
  '        int seen = count.getOrDefault(num, 0);', //                        5
  '        count.put(num, seen + 1);', //                                     6
  '    }', //                                                                 7
  '', //                                                                      8
  '    List<List<Integer>> buckets = new ArrayList<>();', //                   9
  '    for (int f = 0; f <= nums.length; f++) buckets.add(new ArrayList<>());', // 10
  '    for (Map.Entry<Integer, Integer> entry : count.entrySet()) {', //      11
  '        buckets.get(entry.getValue()).add(entry.getKey());', //            12
  '    }', //                                                                13
  '', //                                                                     14
  '    int[] out = new int[k];', //                                          15
  '    int filled = 0;', //                                                  16
  '    for (int f = nums.length; f > 0 && filled < k; f--) {', //            17
  '        for (int num : buckets.get(f)) {', //                             18
  '            out[filled++] = num;', //                                     19
  '            if (filled == k) break;', //                                  20
  '        }', //                                                            21
  '    }', //                                                                22
  '', //                                                                     23
  '    return out;', //                                                      24
  '}', //                                                                    25
].join('\n')

const JAVA_OPTIMIZED_LINE_MAP: Record<number, number> = {
  2: 2,
  4: 4,
  5: 5,
  6: 6,
  11: 12,
  17: 19,
  22: 24,
}

const JAVA_SORTED_LISTING = [
  'public int[] topKFrequent(int[] nums, int k) {', //                        1
  '    int[] ordered = nums.clone();', //                                     2
  '    Arrays.sort(ordered);', //                                             3
  '', //                                                                      4
  '    List<int[]> runs = new ArrayList<>();', //                             5
  '    for (int i = 0; i < ordered.length; i++) {', //                        6
  '        if (i > 0 && ordered[i] == ordered[i - 1]) {', //                  7
  '            runs.get(runs.size() - 1)[1]++;', //                           8
  '        } else {', //                                                      9
  '            runs.add(new int[] { ordered[i], 1 });', //                   10
  '        }', //                                                            11
  '    }', //                                                                12
  '', //                                                                     13
  '    runs.sort((a, b) -> b[1] - a[1]);', //                                14
  '', //                                                                     15
  '    int[] out = new int[k];', //                                          16
  '    for (int i = 0; i < k; i++) out[i] = runs.get(i)[0];', //             17
  '    return out;', //                                                      18
  '}', //                                                                    19
].join('\n')

const JAVA_SORTED_LINE_MAP: Record<number, number> = {
  2: 2,
  3: 3,
  6: 6,
  8: 8,
  10: 10,
  14: 14,
  16: 18,
}

const JAVA_BRUTE_LISTING = [
  'public int[] topKFrequent(int[] nums, int k) {', //                        1
  '    List<Integer> out = new ArrayList<>();', //                            2
  '', //                                                                      3
  '    while (out.size() < k) {', //                                          4
  '        Integer best = null;', //                                          5
  '        int bestCount = 0;', //                                            6
  '', //                                                                      7
  '        for (int i = 0; i < nums.length; i++) {', //                       8
  '            if (out.contains(nums[i])) continue;', //                      9
  '', //                                                                     10
  '            int count = 0;', //                                           11
  '            for (int j = 0; j < nums.length; j++) {', //                   12
  '                if (nums[j] == nums[i]) count++;', //                      13
  '            }', //                                                        14
  '', //                                                                     15
  '            if (count > bestCount) {', //                                 16
  '                best = nums[i];', //                                      17
  '                bestCount = count;', //                                   18
  '            }', //                                                        19
  '        }', //                                                            20
  '', //                                                                     21
  '        out.add(best);', //                                               22
  '    }', //                                                                23
  '', //                                                                     24
  '    return out.stream().mapToInt(Integer::intValue).toArray();', //       25
  '}', //                                                                    26
].join('\n')

const JAVA_BRUTE_LINE_MAP: Record<number, number> = {
  2: 2,
  8: 8,
  13: 13,
  22: 22,
  25: 25,
}

// ---------------------------------------------------------------------------
// go
// ---------------------------------------------------------------------------

const GO_OPTIMIZED_LISTING = [
  'func topKFrequent(nums []int, k int) []int {', //                          1
  '    count := make(map[int]int)', //                                        2
  '    order := []int{}', //                                                  3
  '', //                                                                      4
  '    for _, num := range nums {', //                                        5
  '        seen, ok := count[num]', //                                        6
  '        if !ok {', //                                                      7
  '            order = append(order, num)', //                                8
  '        }', //                                                             9
  '        count[num] = seen + 1', //                                        10
  '    }', //                                                                11
  '', //                                                                     12
  '    buckets := make([][]int, len(nums)+1)', //                            13
  '    for _, num := range order {', //                                      14
  '        buckets[count[num]] = append(buckets[count[num]], num)', //       15
  '    }', //                                                                16
  '', //                                                                     17
  '    out := []int{}', //                                                   18
  '    for f := len(nums); f > 0 && len(out) < k; f-- {', //                 19
  '        for _, num := range buckets[f] {', //                             20
  '            out = append(out, num)', //                                   21
  '            if len(out) == k {', //                                       22
  '                break', //                                                23
  '            }', //                                                        24
  '        }', //                                                            25
  '    }', //                                                                26
  '', //                                                                     27
  '    return out', //                                                       28
  '}', //                                                                    29
].join('\n')

/** Go's maps have no insertion order, so this listing keeps `order` alongside
 *  and fills the buckets from it — which is what makes ties break the same way
 *  the canonical listing's `Map` iteration does. Canonical 5 (`count.get`) maps
 *  to line 6, where the lookup and its miss flag both come back at once. */
const GO_OPTIMIZED_LINE_MAP: Record<number, number> = {
  2: 2,
  4: 5,
  5: 6,
  6: 10,
  11: 15,
  17: 21,
  22: 28,
}

const GO_SORTED_LISTING = [
  'func topKFrequent(nums []int, k int) []int {', //                                      1
  '    ordered := append([]int{}, nums...)', //                                           2
  '    sort.Ints(ordered)', //                                                            3
  '', //                                                                                  4
  '    type run struct{ value, count int }', //                                           5
  '    runs := []run{}', //                                                               6
  '    for i := range ordered {', //                                                      7
  '        if i > 0 && ordered[i] == ordered[i-1] {', //                                  8
  '            runs[len(runs)-1].count++', //                                             9
  '        } else {', //                                                                 10
  '            runs = append(runs, run{ordered[i], 1})', //                              11
  '        }', //                                                                        12
  '    }', //                                                                            13
  '', //                                                                                 14
  '    sort.SliceStable(runs, func(a, b int) bool { return runs[a].count > runs[b].count })', // 15
  '', //                                                                                 16
  '    out := []int{}', //                                                               17
  '    for _, r := range runs[:k] {', //                                                 18
  '        out = append(out, r.value)', //                                               19
  '    }', //                                                                            20
  '    return out', //                                                                   21
  '}', //                                                                                22
].join('\n')

/** `sort.Ints` sorts in place, so the copy on line 2 is a separate statement —
 *  canonical 2 (`const ordered = [...nums]`) is that copy, and canonical 3 the
 *  sort itself. */
const GO_SORTED_LINE_MAP: Record<number, number> = {
  2: 2,
  3: 3,
  6: 7,
  8: 9,
  10: 11,
  14: 15,
  16: 21,
}

const GO_BRUTE_LISTING = [
  'func topKFrequent(nums []int, k int) []int {', //            1
  '    out := []int{}', //                                      2
  '', //                                                        3
  '    for len(out) < k {', //                                  4
  '        best := 0', //                                       5
  '        bestCount := 0', //                                  6
  '', //                                                        7
  '        for i := 0; i < len(nums); i++ {', //                8
  '            if contains(out, nums[i]) {', //                 9
  '                continue', //                               10
  '            }', //                                          11
  '', //                                                       12
  '            count := 0', //                                 13
  '            for j := 0; j < len(nums); j++ {', //           14
  '                if nums[j] == nums[i] {', //                15
  '                    count++', //                            16
  '                }', //                                      17
  '            }', //                                          18
  '', //                                                       19
  '            if count > bestCount {', //                     20
  '                best = nums[i]', //                         21
  '                bestCount = count', //                      22
  '            }', //                                          23
  '        }', //                                              24
  '', //                                                       25
  '        out = append(out, best)', //                        26
  '    }', //                                                  27
  '', //                                                       28
  '    return out', //                                         29
  '}', //                                                      30
  '', //                                                       31
  'func contains(values []int, target int) bool {', //         32
  '    for _, value := range values {', //                     33
  '        if value == target {', //                           34
  '            return true', //                                35
  '        }', //                                              36
  '    }', //                                                  37
  '    return false', //                                       38
  '}', //                                                      39
].join('\n')

const GO_BRUTE_LINE_MAP: Record<number, number> = {
  2: 2,
  8: 8,
  13: 15,
  22: 26,
  25: 29,
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
