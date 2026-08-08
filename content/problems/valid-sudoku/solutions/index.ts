/**
 * Per-language listings (F14), for both of this problem's approaches.
 *
 * Every listing here is a different rendering of the SAME algorithm the
 * canonical trace (`../trace.ts`) actually ran. `lineMap` points each
 * canonical trace line (the only line numbers `Frame.line` ever takes) at the
 * line in THIS listing that performs the same step.
 *
 * `lineMap` is not required to be 1:1. Where a language needs several lines
 * for what the canonical listing does in one — Go's key-slice literal, or any
 * language splitting a combined `if (check) return` into two statements —
 * the canonical key points at whichever line performs the step the frame is
 * actually about.
 */

import type { Approach, Language, Solution } from '../../../../lib/types'
import { BRUTE_LISTING, OPTIMIZED_LISTING } from '../trace'

// ---------------------------------------------------------------------------
// javascript — identity. These ARE the canonical listings.
// ---------------------------------------------------------------------------

const JAVASCRIPT_OPTIMIZED_LINE_MAP: Record<number, number> = {
  2: 2,
  11: 11,
  14: 14,
  17: 17,
  20: 20,
}

const JAVASCRIPT_BRUTE_LINE_MAP: Record<number, number> = {
  2: 2,
  3: 3,
  7: 7,
  13: 13,
  17: 17,
  23: 23,
  29: 29,
  34: 34,
}

// ---------------------------------------------------------------------------
// python
// ---------------------------------------------------------------------------

const PYTHON_OPTIMIZED_LISTING = [
  'def is_valid_sudoku(board):', //                       1
  '    seen = {}', //                                     2
  '', //                                                  3
  '    for i in range(81):', //                           4
  '        digit = board[i]', //                          5
  '        if digit == 0:', //                            6
  '            continue', //                               7
  '', //                                                    8
  '        row = i // 9', //                               9
  '        col = i % 9', //                                10
  '        box = (row // 3) * 3 + (col // 3)', //          11
  '        keys = [f"r{row}d{digit}", f"c{col}d{digit}", f"b{box}d{digit}"]', // 12
  '', //                                                    13
  '        if any(key in seen for key in keys):', //       14
  '            return False', //                           15
  '', //                                                    16
  '        for key in keys:', //                           17
  '            seen[key] = i', //                          18
  '', //                                                    19
  '    return True', //                                    20
].join('\n')

const PYTHON_OPTIMIZED_LINE_MAP: Record<number, number> = {
  2: 2, // seen = {}
  11: 12, // keys = [...]
  14: 15, // return False
  17: 18, // seen[key] = i
  20: 20, // return True
}

const PYTHON_BRUTE_LISTING = [
  'def is_valid_sudoku(board):', //                                     1
  '    for r in range(9):', //                                         2
  '        seen = set()', //                                           3
  '        for c in range(9):', //                                     4
  '            digit = board[r * 9 + c]', //                           5
  '            if digit == 0:', //                                     6
  '                continue', //                                        7
  '            if digit in seen:', //                                   8
  '                return False', //                                    9
  '            seen.add(digit)', //                                    10
  '', //                                                                11
  '    for c in range(9):', //                                         12
  '        seen = set()', //                                           13
  '        for r in range(9):', //                                     14
  '            digit = board[r * 9 + c]', //                           15
  '            if digit == 0:', //                                     16
  '                continue', //                                        17
  '            if digit in seen:', //                                   18
  '                return False', //                                    19
  '            seen.add(digit)', //                                    20
  '', //                                                                21
  '    for box in range(9):', //                                       22
  '        seen = set()', //                                           23
  '        box_row = (box // 3) * 3', //                               24
  '        box_col = (box % 3) * 3', //                                25
  '        for k in range(9):', //                                     26
  '            digit = board[(box_row + k // 3) * 9 + (box_col + k % 3)]', // 27
  '            if digit == 0:', //                                     28
  '                continue', //                                        29
  '            if digit in seen:', //                                   30
  '                return False', //                                    31
  '            seen.add(digit)', //                                    32
  '', //                                                                33
  '    return True', //                                                34
].join('\n')

const PYTHON_BRUTE_LINE_MAP: Record<number, number> = {
  2: 2,
  3: 3,
  7: 8, // if digit in seen:
  13: 13,
  17: 18, // if digit in seen:
  23: 23,
  29: 30, // if digit in seen:
  34: 34,
}

// ---------------------------------------------------------------------------
// java
// ---------------------------------------------------------------------------

const JAVA_OPTIMIZED_LISTING = [
  'public boolean isValidSudoku(int[] board) {', //                                              1
  '    Map<String, Integer> seen = new HashMap<>();', //                                         2
  '', //                                                                                          3
  '    for (int i = 0; i < 81; i++) {', //                                                       4
  '        int digit = board[i];', //                                                            5
  '        if (digit == 0) continue;', //                                                        6
  '', //                                                                                          7
  '        int row = i / 9;', //                                                                 8
  '        int col = i % 9;', //                                                                 9
  '        int box = (row / 3) * 3 + (col / 3);', //                                            10
  '        String[] keys = { "r" + row + "d" + digit, "c" + col + "d" + digit, "b" + box + "d" + digit };', // 11
  '', //                                                                                         12
  '        if (Arrays.stream(keys).anyMatch(seen::containsKey)) {', //                          13
  '            return false;', //                                                                14
  '        }', //                                                                                15
  '', //                                                                                         16
  '        for (String key : keys) seen.put(key, i);', //                                       17
  '    }', //                                                                                    18
  '', //                                                                                         19
  '    return true;', //                                                                         20
  '}', //                                                                                         21
].join('\n')

const JAVA_OPTIMIZED_LINE_MAP: Record<number, number> = {
  2: 2,
  11: 11,
  14: 14,
  17: 17,
  20: 20,
}

const JAVA_BRUTE_LISTING = [
  'public boolean isValidSudoku(int[] board) {', //                    1
  '    for (int r = 0; r < 9; r++) {', //                              2
  '        Set<Integer> seen = new HashSet<>();', //                   3
  '        for (int c = 0; c < 9; c++) {', //                          4
  '            int digit = board[r * 9 + c];', //                      5
  '            if (digit == 0) continue;', //                         6
  '            if (seen.contains(digit)) return false;', //           7
  '            seen.add(digit);', //                                  8
  '        }', //                                                     9
  '    }', //                                                        10
  '', //                                                              11
  '    for (int c = 0; c < 9; c++) {', //                             12
  '        Set<Integer> seen = new HashSet<>();', //                  13
  '        for (int r = 0; r < 9; r++) {', //                         14
  '            int digit = board[r * 9 + c];', //                     15
  '            if (digit == 0) continue;', //                        16
  '            if (seen.contains(digit)) return false;', //          17
  '            seen.add(digit);', //                                 18
  '        }', //                                                    19
  '    }', //                                                       20
  '', //                                                             21
  '    for (int box = 0; box < 9; box++) {', //                     22
  '        Set<Integer> seen = new HashSet<>();', //                23
  '        int boxRow = (box / 3) * 3;', //                         24
  '        int boxCol = (box % 3) * 3;', //                         25
  '        for (int k = 0; k < 9; k++) {', //                       26
  '            int digit = board[(boxRow + k / 3) * 9 + (boxCol + k % 3)];', // 27
  '            if (digit == 0) continue;', //                       28
  '            if (seen.contains(digit)) return false;', //         29
  '            seen.add(digit);', //                                30
  '        }', //                                                  31
  '    }', //                                                      32
  '', //                                                           33
  '    return true;', //                                          34
  '}', //                                                          35
].join('\n')

const JAVA_BRUTE_LINE_MAP: Record<number, number> = {
  2: 2,
  3: 3,
  7: 7,
  13: 13,
  17: 17,
  23: 23,
  29: 29,
  34: 34,
}

// ---------------------------------------------------------------------------
// go
// ---------------------------------------------------------------------------

const GO_OPTIMIZED_LISTING = [
  'func isValidSudoku(board [81]int) bool {', //                                   1
  '    seen := make(map[string]int)', //                                          2
  '', //                                                                          3
  '    for i := 0; i < 81; i++ {', //                                            4
  '        digit := board[i]', //                                                5
  '        if digit == 0 {', //                                                  6
  '            continue', //                                                      7
  '        }', //                                                                8
  '', //                                                                         9
  '        row := i / 9', //                                                    10
  '        col := i % 9', //                                                    11
  '        box := (row/3)*3 + col/3', //                                        12
  '        keys := []string{', //                                               13
  '            fmt.Sprintf("r%dd%d", row, digit),', //                          14
  '            fmt.Sprintf("c%dd%d", col, digit),', //                          15
  '            fmt.Sprintf("b%dd%d", box, digit),', //                          16
  '        }', //                                                               17
  '', //                                                                        18
  '        if slices.ContainsFunc(keys, func(k string) bool {', //              19
  '            _, ok := seen[k]', //                                            20
  '            return ok', //                                                   21
  '        }) {', //                                                            22
  '            return false', //                                                23
  '        }', //                                                               24
  '', //                                                                        25
  '        for _, key := range keys {', //                                     26
  '            seen[key] = i', //                                              27
  '        }', //                                                              28
  '    }', //                                                                  29
  '', //                                                                       30
  '    return true', //                                                       31
  '}', //                                                                      32
].join('\n')

const GO_OPTIMIZED_LINE_MAP: Record<number, number> = {
  2: 2,
  11: 13, // keys := []string{
  14: 23, // return false
  17: 27, // seen[key] = i
  20: 31, // return true
}

const GO_BRUTE_LISTING = [
  'func isValidSudoku(board [81]int) bool {', //                                1
  '    for r := 0; r < 9; r++ {', //                                           2
  '        seen := make(map[int]struct{})', //                                3
  '        for c := 0; c < 9; c++ {', //                                      4
  '            digit := board[r*9+c]', //                                    5
  '            if digit == 0 {', //                                          6
  '                continue', //                                              7
  '            }', //                                                        8
  '            if _, ok := seen[digit]; ok {', //                            9
  '                return false', //                                        10
  '            }', //                                                       11
  '            seen[digit] = struct{}{}', //                                12
  '        }', //                                                          13
  '    }', //                                                              14
  '', //                                                                   15
  '    for c := 0; c < 9; c++ {', //                                      16
  '        seen := make(map[int]struct{})', //                            17
  '        for r := 0; r < 9; r++ {', //                                  18
  '            digit := board[r*9+c]', //                                19
  '            if digit == 0 {', //                                      20
  '                continue', //                                          21
  '            }', //                                                    22
  '            if _, ok := seen[digit]; ok {', //                        23
  '                return false', //                                    24
  '            }', //                                                   25
  '            seen[digit] = struct{}{}', //                            26
  '        }', //                                                      27
  '    }', //                                                          28
  '', //                                                                29
  '    for box := 0; box < 9; box++ {', //                              30
  '        seen := make(map[int]struct{})', //                         31
  '        boxRow := (box / 3) * 3', //                                32
  '        boxCol := (box % 3) * 3', //                                33
  '        for k := 0; k < 9; k++ {', //                               34
  '            digit := board[(boxRow+k/3)*9+(boxCol+k%3)]', //        35
  '            if digit == 0 {', //                                   36
  '                continue', //                                       37
  '            }', //                                                 38
  '            if _, ok := seen[digit]; ok {', //                     39
  '                return false', //                                 40
  '            }', //                                                41
  '            seen[digit] = struct{}{}', //                         42
  '        }', //                                                   43
  '    }', //                                                       44
  '', //                                                             45
  '    return true', //                                             46
  '}', //                                                           47
].join('\n')

const GO_BRUTE_LINE_MAP: Record<number, number> = {
  2: 2,
  3: 3,
  7: 9, // if _, ok := seen[digit]; ok {
  13: 17,
  17: 23, // if _, ok := seen[digit]; ok {
  23: 31,
  29: 39, // if _, ok := seen[digit]; ok {
  34: 46,
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

/** Keyed by the two approaches this problem ships (see `traces.approaches`)
 *  — `Partial` because the `Approach` union spans every problem, not this one. */
export const solutions: Partial<Record<Approach, Solution[]>> = {
  optimized: LANGUAGES.map((language) => OPTIMIZED[language]),
  brute: LANGUAGES.map((language) => BRUTE[language]),
}
