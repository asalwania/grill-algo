/**
 * Per-language listings (F14), for both of this problem's approaches.
 *
 * Every listing here is a different rendering of the SAME algorithm the
 * canonical trace (`../trace.ts`) actually ran. `lineMap` points each
 * canonical trace line (the only line numbers `Frame.line` ever takes) at
 * the line in THIS listing that performs the same step.
 */

import type { Approach, Language, Solution } from '../../../../lib/types'
import { BRUTE_LISTING, OPTIMIZED_LISTING } from '../trace'

// ---------------------------------------------------------------------------
// javascript — identity. These ARE the canonical listings.
// ---------------------------------------------------------------------------

const JAVASCRIPT_OPTIMIZED_LINE_MAP: Record<number, number> = {
  3: 3,
  7: 7,
  8: 8,
  10: 10,
  11: 11,
  18: 18,
}

const JAVASCRIPT_BRUTE_LINE_MAP: Record<number, number> = {
  3: 3,
  6: 6,
  7: 7,
  12: 12,
  13: 13,
  17: 17,
}

// ---------------------------------------------------------------------------
// python
// ---------------------------------------------------------------------------

const PYTHON_OPTIMIZED_LISTING = [
  'def is_palindrome(s):', //                                 1
  '    def is_alnum(ch):', //                                 2
  '        return ch.isalnum()', //                           3
  '', //                                                      4
  '    left, right = 0, len(s) - 1', //                       5
  '', //                                                      6
  '    while left < right:', //                               7
  '        while left < right and not is_alnum(s[left]):', // 8
  '            left += 1', //                                 9
  '        while left < right and not is_alnum(s[right]):', // 10
  '            right -= 1', //                                11
  '', //                                                      12
  '        if s[left].lower() != s[right].lower():', //       13
  '            return False', //                              14
  '', //                                                      15
  '        left += 1', //                                     16
  '        right -= 1', //                                    17
  '', //                                                      18
  '    return True', //                                       19
].join('\n')

const PYTHON_OPTIMIZED_LINE_MAP: Record<number, number> = {
  3: 5, // left, right = 0, len(s) - 1
  7: 9, // left += 1 (the step the skip-left frame is about)
  8: 11, // right -= 1
  10: 13, // if s[left].lower() != s[right].lower():
  11: 14, // return False
  18: 19, // return True
}

const PYTHON_BRUTE_LISTING = [
  'def is_palindrome(s):', //                                   1
  '    def is_alnum(ch):', //                                   2
  '        return ch.isalnum()', //                             3
  '', //                                                        4
  '    cleaned = []', //                                        5
  '', //                                                        6
  '    for ch in s:', //                                        7
  '        if is_alnum(ch):', //                                8
  '            cleaned.append(ch.lower())', //                  9
  '', //                                                        10
  '    for i in range(len(cleaned)):', //                       11
  '        if cleaned[i] != cleaned[len(cleaned) - 1 - i]:', // 12
  '            return False', //                                13
  '', //                                                        14
  '    return True', //                                         15
].join('\n')

const PYTHON_BRUTE_LINE_MAP: Record<number, number> = {
  3: 5, // cleaned = []
  6: 8, // if is_alnum(ch):
  7: 9, // cleaned.append(ch.lower())
  12: 12, // if cleaned[i] != cleaned[len(cleaned) - 1 - i]:
  13: 13, // return False
  17: 15, // return True
}

// ---------------------------------------------------------------------------
// java
// ---------------------------------------------------------------------------

const JAVA_OPTIMIZED_LISTING = [
  'public boolean isPalindrome(String s) {', //                                        1
  '    int left = 0;', //                                                              2
  '    int right = s.length() - 1;', //                                                3
  '', //                                                                               4
  '    while (left < right) {', //                                                     5
  '        while (left < right && !Character.isLetterOrDigit(s.charAt(left))) {', //   6
  '            left++;', //                                                            7
  '        }', //                                                                      8
  '        while (left < right && !Character.isLetterOrDigit(s.charAt(right))) {', //  9
  '            right--;', //                                                           10
  '        }', //                                                                      11
  '', //                                                                               12
  '        if (Character.toLowerCase(s.charAt(left)) != Character.toLowerCase(s.charAt(right))) {', // 13
  '            return false;', //                                                      14
  '        }', //                                                                      15
  '', //                                                                               16
  '        left++;', //                                                                17
  '        right--;', //                                                               18
  '    }', //                                                                          19
  '', //                                                                               20
  '    return true;', //                                                               21
  '}', //                                                                              22
].join('\n')

const JAVA_OPTIMIZED_LINE_MAP: Record<number, number> = {
  3: 2, // int left = 0;
  7: 7, // left++;
  8: 10, // right--;
  10: 13, // if (Character.toLowerCase(...) != Character.toLowerCase(...)) {
  11: 14, // return false;
  18: 21, // return true;
}

const JAVA_BRUTE_LISTING = [
  'public boolean isPalindrome(String s) {', //                                    1
  '    StringBuilder cleaned = new StringBuilder();', //                          2
  '', //                                                                          3
  '    for (int i = 0; i < s.length(); i++) {', //                                4
  '        char ch = s.charAt(i);', //                                            5
  '        if (Character.isLetterOrDigit(ch)) {', //                              6
  '            cleaned.append(Character.toLowerCase(ch));', //                    7
  '        }', //                                                                 8
  '    }', //                                                                     9
  '', //                                                                         10
  '    for (int i = 0; i < cleaned.length(); i++) {', //                         11
  '        if (cleaned.charAt(i) != cleaned.charAt(cleaned.length() - 1 - i)) {', // 12
  '            return false;', //                                                13
  '        }', //                                                                14
  '    }', //                                                                    15
  '', //                                                                         16
  '    return true;', //                                                        17
  '}', //                                                                        18
].join('\n')

const JAVA_BRUTE_LINE_MAP: Record<number, number> = {
  3: 2, // StringBuilder cleaned = new StringBuilder();
  6: 6, // if (Character.isLetterOrDigit(ch)) {
  7: 7, // cleaned.append(Character.toLowerCase(ch));
  12: 12, // if (cleaned.charAt(i) != cleaned.charAt(cleaned.length() - 1 - i)) {
  13: 13, // return false;
  17: 17, // return true;
}

// ---------------------------------------------------------------------------
// go
// ---------------------------------------------------------------------------

const GO_OPTIMIZED_LISTING = [
  'func isPalindrome(s string) bool {', //                                          1
  '    isAlnum := func(b byte) bool {', //                                          2
  '        return unicode.IsLetter(rune(b)) || unicode.IsDigit(rune(b))', //        3
  '    }', //                                                                       4
  '    left, right := 0, len(s)-1', //                                              5
  '', //                                                                            6
  '    for left < right {', //                                                      7
  '        for left < right && !isAlnum(s[left]) {', //                             8
  '            left++', //                                                          9
  '        }', //                                                                  10
  '        for left < right && !isAlnum(s[right]) {', //                          11
  '            right--', //                                                       12
  '        }', //                                                                 13
  '', //                                                                          14
  '        if unicode.ToLower(rune(s[left])) != unicode.ToLower(rune(s[right])) {', // 15
  '            return false', //                                                  16
  '        }', //                                                                 17
  '', //                                                                          18
  '        left++', //                                                           19
  '        right--', //                                                          20
  '    }', //                                                                    21
  '', //                                                                         22
  '    return true', //                                                         23
  '}', //                                                                       24
].join('\n')

/** Go has no built-in `isalnum`; `unicode.IsLetter`/`IsDigit` on the
 *  rune-converted byte is the idiom. */
const GO_OPTIMIZED_LINE_MAP: Record<number, number> = {
  3: 5, // left, right := 0, len(s)-1
  7: 9, // left++
  8: 12, // right--
  10: 15, // if unicode.ToLower(...) != unicode.ToLower(...) {
  11: 16, // return false
  18: 23, // return true
}

const GO_BRUTE_LISTING = [
  'func isPalindrome(s string) bool {', //                                    1
  '    isAlnum := func(b byte) bool {', //                                    2
  '        return unicode.IsLetter(rune(b)) || unicode.IsDigit(rune(b))', //  3
  '    }', //                                                                 4
  '    cleaned := make([]byte, 0, len(s))', //                                5
  '', //                                                                      6
  '    for i := 0; i < len(s); i++ {', //                                     7
  '        if isAlnum(s[i]) {', //                                            8
  '            cleaned = append(cleaned, byte(unicode.ToLower(rune(s[i]))))', // 9
  '        }', //                                                            10
  '    }', //                                                                11
  '', //                                                                     12
  '    for i := 0; i < len(cleaned); i++ {', //                              13
  '        if cleaned[i] != cleaned[len(cleaned)-1-i] {', //                 14
  '            return false', //                                            15
  '        }', //                                                           16
  '    }', //                                                                17
  '', //                                                                     18
  '    return true', //                                                     19
  '}', //                                                                    20
].join('\n')

const GO_BRUTE_LINE_MAP: Record<number, number> = {
  3: 5, // cleaned := make([]byte, 0, len(s))
  6: 8, // if isAlnum(s[i]) {
  7: 9, // cleaned = append(cleaned, byte(unicode.ToLower(rune(s[i]))))
  12: 14, // if cleaned[i] != cleaned[len(cleaned)-1-i] {
  13: 15, // return false
  17: 19, // return true
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
