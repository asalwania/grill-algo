/**
 * Valid Palindrome — build-time trace generators.
 *
 * Nothing here runs in the browser: scripts/build-traces.ts executes these
 * generators at build time, once per entry in TEST_CASES, and writes one
 * frames.<case>.<approach>.json per combination next to this file.
 *
 * The FIRST genuine two-pointer trace in this codebase (NeetCode's "Two
 * Pointers" category). It fits onto the shared ArrayMemoryScene without any
 * change to the type:
 *
 *   - `cursor` is pinned to the LEFT pointer's tile index — the same
 *     convention brute-force generators already use for an "outer/driving"
 *     index. It never tracks the right pointer.
 *   - `link = [left, right]` is the beam between the two pointers, using the
 *     SAME tile-to-tile rendering brute force and sort-and-scan already get
 *     for free whenever `slots` is empty (lib/types.ts's `link` doc). No
 *     scene or component change was needed for this problem to exist.
 *   - `slots` stays `[]` and `probe` stays `null` on every frame, for BOTH
 *     approaches — this is the first problem with no memory structure on
 *     either tab, so the memory wall simply never rises.
 *   - This is a SINGLE-STRING problem (unlike Valid Anagram's two-string
 *     boundary trick): `nums` holds the char codes of the one input string
 *     `s`, `labels` carries the real characters, and `target` is omitted
 *     entirely — same as Contains Duplicate's array-only problems.
 *
 * `scene.result` follows the SAME direction Contains Duplicate's does: a
 * populated pair means the boolean answer is `true` (ArrayMemoryProblemView
 * derives its "found" pill straight from `result !== null`, with no
 * per-problem override — unlike the grid family, see Appendix D). So the
 * decisive MISMATCH pair — the two characters that prove the string is not a
 * palindrome — flashes its tiles `'match'` for the visual "this is why", but
 * `result` itself stays `null` there. Only the success path (every pair
 * agreed) populates `result`, sweeping every tile to `'match'` at once since
 * there is no single decisive pair for a `true` answer here.
 *
 * Two approaches, not three: sorting the characters would destroy the order
 * the whole question depends on, so there is no `sorted` tab (same reasoning
 * Two Sum's trace.ts already documents for its own missing tab).
 *   optimized  walk in from both ends, skipping junk as you go   O(n) / O(1)
 *   brute      clean the string into a new array, then compare
 *              it against its own reverse                       O(n) / O(n)
 */

import { createEmitter } from '../../../lib/frames.ts'
import type {
  ArrayMemoryFrame,
  ArrayMemoryScene,
  ProblemTraces,
  TestCase,
  TileState,
} from '../../../lib/types.ts'

/** True for a letter or a digit — the only characters a palindrome check
 *  cares about. Shared by both generators below. */
const isAlnum = (ch: string): boolean => /[a-z0-9]/i.test(ch)

/** The input the shipped frames are generated from. */
export const EXAMPLE_S = 'A man, a plan, a canal: Panama'

// ---------------------------------------------------------------------------
// Playable inputs
// ---------------------------------------------------------------------------

/** Packs a string into the shared `TestCase` shape: `nums` is its char
 *  codes, `labels` (carried by every generator's own emitted scene, not
 *  here) is the real characters. No `target` — this problem's only input is
 *  the string itself. */
function makeCase(id: string, label: string, s: string, note: string): TestCase {
  return {
    id,
    label,
    nums: [...s].map((ch) => ch.charCodeAt(0)),
    note,
  }
}

/** The inverse of `makeCase`, used by every generator's caller and by the
 *  chrome's `formatCaseInput`. */
export function stringOf(input: TestCase): string {
  return input.nums.map((code) => String.fromCharCode(code)).join('')
}

/**
 * Every input the player can switch between, each covering a branch no
 * other case reaches:
 *   - `sample` succeeds, and is the only case that needs BOTH skip loops
 *     repeatedly (spaces, commas, a colon) before the pointers ever meet.
 *   - `fails-fast` fails on the very first comparison, with no punctuation
 *     to skip past at all.
 *   - `fails-deep` matches three pairs before the fourth disagrees — the
 *     mismatch is not the first thing either pointer sees.
 *   - `skip-heavy` is almost entirely punctuation, with a single real pair
 *     of letters buried in the middle — the only case that reaches either
 *     listing's final `return true`.
 */
export const TEST_CASES: TestCase[] = [
  makeCase(
    'sample',
    'The walkthrough',
    EXAMPLE_S,
    'Spaces, commas and a colon all get skipped — the letters still mirror once they’re gone.',
  ),
  makeCase(
    'fails-fast',
    'Fails on the first pair',
    'abc',
    '‘a’ and ‘c’ disagree immediately — there is no punctuation to skip past either.',
  ),
  makeCase(
    'fails-deep',
    'Fails after several matches',
    'race a car',
    'r/r, a/a and c/c all agree — then ‘e’ and ‘a’ finally break it.',
  ),
  makeCase(
    'skip-heavy',
    'Mostly punctuation',
    '..A..a..',
    'Six punctuation characters get skipped from both ends before the one real pair, ‘A’ and ‘a’, ever gets compared.',
  ),
]

// ---------------------------------------------------------------------------
// Canonical listings
// ---------------------------------------------------------------------------

/**
 * Every optimized frame's `line` is a 1-based index into this listing, and
 * nothing else. Per-language listings map onto it via Solution.lineMap (F14).
 *
 * Active lines are 3, 7, 8, 10, 11 and 18. Lines 14–15 (`left++` /
 * `right--`) are real code but never an active line: advancing past a
 * matching pair is not narrated as its own frame, exactly like Valid
 * Anagram's sorted walk never narrates its own `continue` — the NEXT
 * emitted frame (a skip or a compare) already shows the pointers having
 * moved.
 */
export const OPTIMIZED_LISTING = [
  'function isPalindrome(s) {', //                                 1
  '  const isAlnum = (ch) => /[a-z0-9]/i.test(ch)', //             2
  '  let left = 0', //                                             3
  '  let right = s.length - 1', //                                 4
  '', //                                                           5
  '  while (left < right) {', //                                  6
  '    while (left < right && !isAlnum(s[left])) left++', //      7
  '    while (left < right && !isAlnum(s[right])) right--', //    8
  '', //                                                           9
  '    if (s[left].toLowerCase() !== s[right].toLowerCase()) {', // 10
  '      return false', //                                        11
  '    }', //                                                     12
  '', //                                                          13
  '    left++', //                                                14
  '    right--', //                                                15
  '  }', //                                                       16
  '', //                                                          17
  '  return true', //                                             18
  '}', //                                                         19
].join('\n')

/**
 * Active lines are 3, 6, 7, 12, 13 and 17. The two loops never share an
 * active line even though both walk the same string — the filter pass
 * (6–7) and the compare pass (12–13) are genuinely separate
 * beats, exactly like the trace itself narrates them.
 */
export const BRUTE_LISTING = [
  'function isPalindrome(s) {', //                                    1
  '  const isAlnum = (ch) => /[a-z0-9]/i.test(ch)', //                2
  '  const cleaned = []', //                                          3
  '', //                                                              4
  '  for (let i = 0; i < s.length; i++) {', //                        5
  '    if (isAlnum(s[i])) {', //                                      6
  '      cleaned.push(s[i].toLowerCase())', //                        7
  '    }', //                                                         8
  '  }', //                                                           9
  '', //                                                             10
  '  for (let i = 0; i < cleaned.length; i++) {', //                 11
  '    if (cleaned[i] !== cleaned[cleaned.length - 1 - i]) {', //    12
  '      return false', //                                          13
  '    }', //                                                        14
  '  }', //                                                          15
  '', //                                                             16
  '  return true', //                                                17
  '}', //                                                            18
].join('\n')

const OPTIMIZED_LINE = {
  init: 3,
  skipLeft: 7,
  skipRight: 8,
  compare: 10,
  mismatch: 11,
  done: 18,
} as const

const BRUTE_LINE = {
  init: 3,
  filterRead: 6,
  filterKeep: 7,
  compareRead: 12,
  mismatch: 13,
  done: 17,
} as const

// ---------------------------------------------------------------------------
// Optimized — two pointers, closing in from both ends
// ---------------------------------------------------------------------------

/**
 * Solves Valid Palindrome by walking `left` in from the start and `right`
 * in from the end at the same time, skipping anything that is not a letter
 * or digit and comparing (lowercased) whatever is left. This actually
 * computes the answer — the frames are a by-product of a real run, not
 * a hand-authored script.
 *
 * `cursor` only ever holds `left` (the doc comment at the top of this file
 * explains why); `right`'s position is always read off `link[1]` instead.
 */
export function* validPalindromeOptimized(
  s: string,
): Generator<ArrayMemoryFrame, void, undefined> {
  const labels = [...s]
  const codes = labels.map((ch) => ch.charCodeAt(0))
  const tiles: TileState[] = codes.map(() => 'idle')
  let left = 0
  let right = s.length - 1
  let cursor: number | null = left
  let link: [number, number] | null = left < right ? [left, right] : null
  let result: [number, number] | null = null

  const emit = createEmitter<ArrayMemoryScene>(() => ({
    nums: [...codes],
    labels: [...labels],
    tiles: [...tiles],
    cursor,
    slots: [], // never fills — this problem needs no memory structure at all
    probe: null, // nothing is ever looked up
    link: link === null ? null : [link[0], link[1]],
    result: result === null ? null : [result[0], result[1]],
  }))

  const base = () => ({ n: s.length, left, right })

  yield emit(
    OPTIMIZED_LINE.init,
    'init',
    `Two pointers close in from both ends: left at 0, right at ${right}.`,
    'A palindrome reads the same from either direction, so the fastest check is to walk in from both ends at once and stop the moment two letters disagree.',
    base(),
  )

  while (left < right) {
    while (left < right && !isAlnum(labels[left])) {
      const skipped = labels[left]
      tiles[left] = 'done'
      left++
      cursor = left
      link = left < right ? [left, right] : null
      yield emit(
        OPTIMIZED_LINE.skipLeft,
        'compare',
        `'${skipped}' isn't a letter or digit — left steps past it.`,
        'Only letters and digits count toward the comparison. Spaces, commas, colons — anything else is invisible to a palindrome check.',
        base(),
      )
    }

    while (left < right && !isAlnum(labels[right])) {
      const skipped = labels[right]
      tiles[right] = 'done'
      right--
      link = left < right ? [left, right] : null
      yield emit(
        OPTIMIZED_LINE.skipRight,
        'compare',
        `'${skipped}' isn't a letter or digit — right steps past it.`,
        'The same rule from the other end: right keeps stepping inward until it lands on something worth comparing.',
        base(),
      )
    }

    if (left >= right) break

    tiles[left] = 'active'
    tiles[right] = 'active'
    link = [left, right]
    const a = labels[left].toLowerCase()
    const b = labels[right].toLowerCase()
    const same = a === b
    yield emit(
      OPTIMIZED_LINE.compare,
      same ? 'match' : 'compare',
      `Compare '${labels[left]}' and '${labels[right]}'.${same ? ' Same letter.' : ' Different.'}`,
      'Case never matters here — only whether the two letters are the same once lowercased.',
      { ...base(), a, b, same },
    )

    if (!same) {
      tiles[left] = 'match'
      tiles[right] = 'match'
      yield emit(
        OPTIMIZED_LINE.mismatch,
        'return',
        `'${labels[left]}' and '${labels[right]}' disagree. Return false.`,
        'One disagreement anywhere is enough — the two halves can never mirror each other once a single pair breaks.',
        { ...base(), a, b, result: 'false' },
      )
      return
    }

    tiles[left] = 'done'
    tiles[right] = 'done'
    link = null
    left++
    right--
    cursor = left
  }

  for (let k = 0; k < tiles.length; k++) tiles[k] = 'match'
  cursor = null
  link = null
  result = [0, tiles.length - 1]
  yield emit(
    OPTIMIZED_LINE.done,
    'return',
    'Both pointers met in the middle with nothing left to disagree on. Return true.',
    `Every pair of letters checked out, and each character was visited exactly once — ${s.length} characters, one pass, no memory spent remembering any of them.`,
    { ...base(), result: 'true' },
  )
}

// ---------------------------------------------------------------------------
// Brute force — clean the string, then compare it to its own reverse
// ---------------------------------------------------------------------------

/**
 * Builds a whole second array — letters and digits only, all
 * lowercased — then checks it against its own mirror image. A
 * genuinely different shape from the optimized walk, not just the same scan
 * over pre-cleaned input: it pays for a second array up front, and its
 * compare pass runs the FULL length rather than stopping at the midpoint,
 * so a matching pair gets checked twice (once as `(i, j)`, once again as
 * `(j, i)`).
 *
 * `scene.slots` is `[]` and `scene.probe` is `null` on every frame, same as
 * the optimized trace — there is no memory structure here either, only
 * an extra ARRAY, which is exactly the trade this approach is here to show.
 * The cleaned characters are mapped back onto their ORIGINAL tile indices
 * (`origIndex`) so the comparison still lights up real tiles of `s`, even
 * though the algorithm itself never looks at `s` again once `cleaned` is
 * built.
 */
export function* validPalindromeBrute(
  s: string,
): Generator<ArrayMemoryFrame, void, undefined> {
  const labels = [...s]
  const codes = labels.map((ch) => ch.charCodeAt(0))
  const tiles: TileState[] = codes.map(() => 'idle')
  let cursor: number | null = null
  let link: [number, number] | null = null
  let result: [number, number] | null = null

  const emit = createEmitter<ArrayMemoryScene>(() => ({
    nums: [...codes],
    labels: [...labels],
    tiles: [...tiles],
    cursor,
    slots: [], // never fills — brute force has no memory structure either
    probe: null, // nothing is ever looked up
    link: link === null ? null : [link[0], link[1]],
    result: result === null ? null : [result[0], result[1]],
  }))

  const base = () => ({ n: s.length })

  yield emit(
    BRUTE_LINE.init,
    'init',
    'Build a cleaned copy first: letters and digits only, all lowercase.',
    'Filtering once up front turns "ignore the punctuation while comparing" into a plain string-equals-its-reverse check — at the cost of a whole second array.',
    base(),
  )

  const cleaned: string[] = []
  const origIndex: number[] = []

  for (let i = 0; i < s.length; i++) {
    cursor = i
    tiles[i] = 'active'
    const keep = isAlnum(labels[i])
    yield emit(
      BRUTE_LINE.filterRead,
      'compare',
      `'${labels[i]}' ${keep ? 'is' : "isn't"} a letter or digit.`,
      'Every character gets looked at once, whether or not it survives the filter.',
      { ...base(), i, ch: labels[i], keep },
    )

    if (keep) {
      cleaned.push(labels[i].toLowerCase())
      origIndex.push(i)
      tiles[i] = 'done'
      yield emit(
        BRUTE_LINE.filterKeep,
        'store',
        `Keep '${labels[i].toLowerCase()}'. Cleaned so far: "${cleaned.join('')}".`,
        'The cleaned copy is a whole new array, sized for the worst case — this is exactly what the two-pointer version spends nothing on.',
        { ...base(), i, cleaned: `"${cleaned.join('')}"` },
      )
    } else {
      tiles[i] = 'done'
    }
  }

  for (let i = 0; i < cleaned.length; i++) {
    const j = cleaned.length - 1 - i
    const oi = origIndex[i]
    const oj = origIndex[j]

    cursor = null
    tiles[oi] = 'active'
    tiles[oj] = 'active'
    link = oi === oj ? null : [oi, oj]
    const same = cleaned[i] === cleaned[j]

    yield emit(
      BRUTE_LINE.compareRead,
      same ? 'match' : 'compare',
      oi === oj
        ? `Middle character '${cleaned[i]}' — nothing left to compare it against.`
        : `Compare cleaned[${i}] '${cleaned[i]}' with cleaned[${j}] '${cleaned[j]}'.${same ? ' Same letter.' : ' Different.'}`,
      'Checking the cleaned copy against its own mirror image is easy to trust — it is exactly what "reads the same backward" means.',
      { ...base(), i, j, same },
    )

    if (!same) {
      tiles[oi] = 'match'
      tiles[oj] = 'match'
      yield emit(
        BRUTE_LINE.mismatch,
        'return',
        `cleaned[${i}] and cleaned[${j}] disagree. Return false.`,
        'The same conclusion the two-pointer version reaches — just after paying to build and hold the whole cleaned copy first.',
        { ...base(), i, j, result: 'false' },
      )
      return
    }

    tiles[oi] = 'done'
    tiles[oj] = 'done'
    link = null
  }

  for (let k = 0; k < tiles.length; k++) tiles[k] = 'match'
  cursor = null
  link = null
  result = [0, tiles.length - 1]
  yield emit(
    BRUTE_LINE.done,
    'return',
    'The cleaned copy reads the same forward and backward. Return true.',
    `${cleaned.length} character${cleaned.length === 1 ? '' : 's'} kept, each compared against its mirror — correct, but only after paying for a second array to get there.`,
    { ...base(), result: 'true' },
  )
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export const traceOptimized = (s: string): ArrayMemoryFrame[] => [
  ...validPalindromeOptimized(s),
]

export const traceBrute = (s: string): ArrayMemoryFrame[] => [
  ...validPalindromeBrute(s),
]

/** Tab order, left to right — best-to-worst, same convention as every
 *  other problem. No `sorted` tab: reordering the characters would destroy
 *  the very order the palindrome check depends on. */
const VALID_PALINDROME_APPROACHES = ['optimized', 'brute'] as const

export const traces: ProblemTraces<
  ArrayMemoryScene,
  (typeof VALID_PALINDROME_APPROACHES)[number]
> = {
  example: `s = "${EXAMPLE_S}"`,
  approaches: VALID_PALINDROME_APPROACHES,
  listings: {
    optimized: OPTIMIZED_LISTING,
    brute: BRUTE_LISTING,
  },
  cases: TEST_CASES,
  build: {
    optimized: (input) => traceOptimized(stringOf(input)),
    brute: (input) => traceBrute(stringOf(input)),
  },
}
