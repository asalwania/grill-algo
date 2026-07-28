/**
 * Valid Anagram — build-time trace generators.
 *
 * Nothing here runs in the browser: scripts/build-traces.ts executes these
 * generators at build time, once per entry in TEST_CASES, and writes one
 * frames.<case>.<approach>.json per combination next to this file.
 *
 * The shared scene (lib/types.ts's ArrayMemoryScene) is one array of
 * NUMBERS — every other problem in the family (Two Sum, Contains Duplicate)
 * is genuinely numeric. This problem is not, so it is fit onto the same
 * scene rather than given a new one:
 *
 *   - `nums` holds CHAR CODES for `s` followed by `t`, concatenated into one
 *     fixed-length array (`s.length + t.length`, constant for the whole
 *     trace — the one invariant the scene actually requires). `labels`
 *     (added to ArrayMemoryScene for exactly this problem) carries the real
 *     letters, so tiles read as 'a' rather than 97.
 *   - `target` is repurposed as the boundary index: `s` occupies
 *     `[0, target)`, `t` occupies `[target, nums.length)`.
 *   - The memory wall becomes a letter->count map instead of a value->index
 *     one; `slots[].keyLabel` is what lets it show a letter instead of a
 *     char code.
 *
 * Three approaches, same story as Contains Duplicate: remember (optimized),
 * reorder (sorted), or brute-force search — except here "reorder" sorts BOTH
 * strings and "brute force" is a search-and-cross-off rather than a nested
 * comparison, because the question is "do these multisets match," not
 * "does any pair collide."
 */

import { createEmitter } from '../../../lib/frames.ts'
import type {
  ArrayMemoryFrame,
  ArrayMemoryScene,
  ProblemTraces,
  SlotState,
  TestCase,
  TileState,
} from '../../../lib/types.ts'

/** The input the shipped frames are generated from. */
export const EXAMPLE_S = 'anagram'
export const EXAMPLE_T = 'nagaram'

// ---------------------------------------------------------------------------
// Playable inputs
// ---------------------------------------------------------------------------

/**
 * A case is authored as two strings and packed into the shared `TestCase`
 * shape: `nums` is the char codes of `s` then `t`, `target` is `s.length`
 * (see the boundary note on ArrayMemoryScene.target). `splitCase` below is
 * the inverse, used by every generator and by the chrome's `formatCaseInput`.
 */
function makeCase(id: string, label: string, s: string, t: string, note: string): TestCase {
  const labels = [...s, ...t]
  return {
    id,
    label,
    nums: labels.map((ch) => ch.charCodeAt(0)),
    target: s.length,
    note,
  }
}

export function splitCase(input: TestCase): { s: string; t: string } {
  const boundary = input.target ?? input.nums.length
  const letters = input.nums.map((code) => String.fromCharCode(code))
  return { s: letters.slice(0, boundary).join(''), t: letters.slice(boundary).join('') }
}

/**
 * Every input the player can switch between, each covering a branch no other
 * case reaches:
 *   - `sample` succeeds, and already exercises a repeated letter ('a' three
 *     times) — no separate "duplicates" case is needed.
 *   - `not-in-s` fails on a letter t has that s never had at all (the map
 *     lookup itself misses).
 *   - `runs-out` fails on a letter that IS in the map but has already been
 *     fully spent (the map lookup hits, but the count is zero) — the other
 *     way `!count` can be true, and worth its own case.
 *   - `different-lengths` fails before a single character is compared.
 */
export const TEST_CASES: TestCase[] = [
  makeCase(
    'sample',
    'The walkthrough',
    'anagram',
    'nagaram',
    'Same seven letters, different order — including three a\'s, counted and spent correctly.',
  ),
  makeCase(
    'not-in-s',
    'A letter that never showed up',
    'rat',
    'car',
    '\'c\' is not in "rat" at all, so the very first letter of t already settles it.',
  ),
  makeCase(
    'runs-out',
    'Runs out mid-check',
    'aab',
    'abb',
    '\'b\' appears once in "aab" but twice in "abb" — the second \'b\' has nothing left to spend.',
  ),
  makeCase(
    'different-lengths',
    'Different lengths',
    'ab',
    'a',
    't is missing a letter entirely — settled before comparing a single character.',
  ),
]

// ---------------------------------------------------------------------------
// Canonical listings
// ---------------------------------------------------------------------------

/**
 * Every optimized frame's `line` is a 1-based index into this listing, and
 * nothing else. Per-language listings map onto it via Solution.lineMap (F14).
 */
export const OPTIMIZED_LISTING = [
  'function isAnagram(s, t) {', //                          1
  '  if (s.length !== t.length) {', //                      2
  '    return false', //                                    3
  '  }', //                                                 4
  '', //                                                    5
  '  const counts = new Map()', //                          6
  '', //                                                    7
  '  for (const ch of s) {', //                             8
  '    counts.set(ch, (counts.get(ch) || 0) + 1)', //       9
  '  }', //                                                10
  '', //                                                   11
  '  for (const ch of t) {', //                            12
  '    const count = counts.get(ch)', //                   13
  '    if (!count) {', //                                  14
  '      return false', //                                 15
  '    }', //                                               16
  '', //                                                   17
  '    counts.set(ch, count - 1)', //                      18
  '  }', //                                                19
  '', //                                                   20
  '  return true', //                                      21
  '}', //                                                  22
].join('\n')

export const SORTED_LISTING = [
  'function isAnagram(s, t) {', //                    1
  '  if (s.length !== t.length) {', //                2
  '    return false', //                              3
  '  }', //                                           4
  '', //                                              5
  '  const sortedS = [...s].sort()', //               6
  '  const sortedT = [...t].sort()', //               7
  '', //                                              8
  '  for (let i = 0; i < sortedS.length; i++) {', //  9
  '    if (sortedS[i] !== sortedT[i]) {', //         10
  '      return false', //                           11
  '    }', //                                        12
  '  }', //                                          13
  '', //                                             14
  '  return true', //                                15
  '}', //                                            16
].join('\n')

export const BRUTE_LISTING = [
  'function isAnagram(s, t) {', //                          1
  '  if (s.length !== t.length) {', //                      2
  '    return false', //                                    3
  '  }', //                                                 4
  '', //                                                    5
  '  const used = new Array(t.length).fill(false)', //      6
  '', //                                                    7
  '  for (let i = 0; i < s.length; i++) {', //              8
  '    let matched = false', //                             9
  '', //                                                   10
  '    for (let j = 0; j < t.length; j++) {', //           11
  '      if (!used[j] && s[i] === t[j]) {', //             12
  '        used[j] = true', //                             13
  '        matched = true', //                             14
  '        break', //                                      15
  '      }', //                                            16
  '    }', //                                              17
  '', //                                                   18
  '    if (!matched) {', //                                19
  '      return false', //                                 20
  '    }', //                                              21
  '  }', //                                                22
  '', //                                                   23
  '  return true', //                                      24
  '}', //                                                  25
].join('\n')

const OPTIMIZED_LINE = {
  mismatch: 3,
  init: 6,
  countRead: 9,
  checkRead: 13,
  miss: 15,
  decrement: 18,
  done: 21,
} as const

const SORTED_LINE = {
  mismatch: 3,
  init: 6,
  sortS: 6,
  sortT: 7,
  compare: 10,
  notFound: 11,
  done: 15,
} as const

const BRUTE_LINE = {
  mismatch: 3,
  init: 6,
  outer: 8,
  inner: 12,
  consume: 13,
  notFound: 20,
  done: 24,
} as const

/** `s` and `t` as char-code / letter arrays, concatenated. Every generator
 *  starts from this same shape; only what they do to it afterward differs. */
function initialArrays(s: string, t: string): { nums: number[]; labels: string[] } {
  const labels = [...s, ...t]
  return { nums: labels.map((ch) => ch.charCodeAt(0)), labels }
}

type CountSlot = { key: number; value: number; state: SlotState; keyLabel: string }

/** `{ a: 3, n: 1 }` — the count map as the DOM variables panel shows it. */
const formatCounts = (slots: CountSlot[]): string =>
  slots.length === 0
    ? '{}'
    : `{ ${slots.map((slot) => `${slot.keyLabel}: ${slot.value}`).join(', ')} }`

// ---------------------------------------------------------------------------
// Optimized — count s, spend the counts against t
// ---------------------------------------------------------------------------

/**
 * Solves Valid Anagram with a letter->count map, yielding a FULL state
 * snapshot at each meaningful point. This actually computes the answer — the
 * frames are a by-product of a real run, not a hand-authored script.
 *
 * Every letter of `s` is counted in one pass; every letter of `t` then
 * spends one count. A miss (the letter was never in `s`) and a zero (the
 * letter WAS in `s`, but every occurrence is already spent) are both `false`,
 * and the trace tells them apart in its narration even though the map lookup
 * that decides them is the same `slots.findIndex`.
 */
export function* validAnagramOptimized(
  s: string,
  t: string,
): Generator<ArrayMemoryFrame, void, undefined> {
  const { nums: codes, labels } = initialArrays(s, t)
  const tiles: TileState[] = codes.map(() => 'idle')
  const slots: CountSlot[] = []
  let cursor: number | null = null
  let probe: number | null = null
  let link: [number, number] | null = null
  let result: [number, number] | null = null

  const emit = createEmitter<ArrayMemoryScene>(() => ({
    nums: [...codes],
    labels: [...labels],
    tiles: [...tiles],
    cursor,
    slots: slots.map((slot) => ({ ...slot })),
    probe,
    link: link === null ? null : [link[0], link[1]],
    result: result === null ? null : [result[0], result[1]],
  }))

  const base = () => ({ s: `"${s}"`, t: `"${t}"`, counts: formatCounts(slots) })

  if (s.length !== t.length) {
    yield emit(
      OPTIMIZED_LINE.mismatch,
      'return',
      `s is ${s.length} letters, t is ${t.length}. Different lengths can never be anagrams.`,
      'An anagram is a rearrangement — it can never add or remove a letter. Unequal lengths settle the question before a single character is compared.',
      base(),
    )
    return
  }

  yield emit(
    OPTIMIZED_LINE.init,
    'init',
    'An empty count map, and one pass over s to fill it.',
    'Two strings are anagrams exactly when every letter appears the same number of times in both. A map turns "same multiset" into "every count nets back to zero."',
    base(),
  )

  for (let i = 0; i < s.length; i++) {
    cursor = null
    probe = null
    link = null
    tiles[i] = 'active'
    yield emit(
      OPTIMIZED_LINE.countRead,
      'compare',
      `Take '${labels[i]}' from s.`,
      'Every letter of s is counted exactly once, in one pass.',
      { ...base(), i, ch: labels[i] },
    )

    const hit = slots.findIndex((slot) => slot.key === codes[i])
    if (hit === -1) {
      slots.push({ key: codes[i], value: 1, state: 'filled', keyLabel: labels[i] })
    } else {
      slots[hit].value++
      slots[hit].state = 'filled'
    }
    tiles[i] = 'done'
    const stored = slots.find((slot) => slot.key === codes[i])!.value
    yield emit(
      OPTIMIZED_LINE.countRead,
      'store',
      `Count '${labels[i]}': ${stored} so far.`,
      'The map is keyed by letter — the only thing that ever matters here is how many of each letter is left to account for.',
      { ...base(), i, ch: labels[i] },
    )
  }

  for (let j = 0; j < t.length; j++) {
    const g = s.length + j
    cursor = null
    probe = null
    link = null
    tiles[g] = 'active'
    yield emit(
      OPTIMIZED_LINE.checkRead,
      'compare',
      `Take '${labels[g]}' from t.`,
      'Now spend what the map remembers, one letter of t at a time.',
      { ...base(), j, ch: labels[g] },
    )

    const code = codes[g]
    probe = code
    const hit = slots.findIndex((slot) => slot.key === code)
    const available = hit !== -1 && slots[hit].value > 0

    if (!available) {
      link = hit === -1 ? null : [g, hit]
      yield emit(
        OPTIMIZED_LINE.miss,
        'return',
        hit === -1
          ? `'${labels[g]}' never showed up in s. Return false.`
          : `No '${labels[g]}' left to spend. Return false.`,
        't has a letter s cannot supply — that alone is enough to know they are not anagrams, with everything else left unchecked.',
        { ...base(), j, ch: labels[g], result: 'false' },
      )
      return
    }

    slots[hit].value--
    slots[hit].state = slots[hit].value === 0 ? 'empty' : 'hit'
    link = [g, hit]
    tiles[g] = 'match'
    yield emit(
      OPTIMIZED_LINE.decrement,
      'match',
      `'${labels[g]}' spent. ${slots[hit].value} left.`,
      'Every successful spend is one letter of t explained by a letter of s — the map is doing the pairing for us.',
      { ...base(), j, ch: labels[g] },
    )
  }

  tiles[0] = 'match'
  tiles[tiles.length - 1] = 'match'
  cursor = null
  probe = null
  link = null
  result = [0, tiles.length - 1]
  yield emit(
    OPTIMIZED_LINE.done,
    'return',
    'Every letter of t found one in s, and none are left over. Return true.',
    `${s.length} letters counted, ${t.length} spent, nothing left in the map — that is exactly what "same multiset" means.`,
    { ...base(), result: 'true' },
  )
}

// ---------------------------------------------------------------------------
// Sorted — put both strings in the same order, then walk once
// ---------------------------------------------------------------------------

/**
 * Sorts a copy of each string, then compares them position by position.
 * `scene.slots` stays empty on every frame — this approach spends O(n log n)
 * time instead of memory. The comparison loop reuses FlatView's existing
 * tile-to-tile `link` connector (drawn whenever `slots` is empty), except
 * here the two ends of the link are `s[i]` and `t[i]` rather than neighbours.
 */
export function* validAnagramSorted(
  s: string,
  t: string,
): Generator<ArrayMemoryFrame, void, undefined> {
  const { nums: codes, labels } = initialArrays(s, t)
  const tiles: TileState[] = codes.map(() => 'idle')
  let cursor: number | null = null
  let link: [number, number] | null = null
  let result: [number, number] | null = null

  const emit = createEmitter<ArrayMemoryScene>(() => ({
    nums: [...codes],
    labels: [...labels],
    tiles: [...tiles],
    cursor,
    slots: [], // never fills — the whole point is that this costs no extra memory
    probe: null, // nothing is ever looked up
    link: link === null ? null : [link[0], link[1]],
    result: result === null ? null : [result[0], result[1]],
  }))

  const base = () => ({ s: `"${s}"`, t: `"${t}"` })

  if (s.length !== t.length) {
    yield emit(
      SORTED_LINE.mismatch,
      'return',
      `s is ${s.length} letters, t is ${t.length}. Different lengths can never be anagrams.`,
      'Sorting cannot line up two strings of different lengths — settle this first.',
      base(),
    )
    return
  }

  yield emit(
    SORTED_LINE.init,
    'init',
    'The two strings, side by side, in the order they arrived.',
    'An anagram is a rearrangement, so the order never mattered — which means we are free to pick a more convenient one.',
    base(),
  )

  // Sorts tiles [from, to) of `codes`/`labels` in place, keeping each code
  // paired with its own letter. One frame per string, not per swap: the
  // lesson is what sorting BUYS here, not how a sort works.
  const sortRange = (from: number, to: number) => {
    const order = Array.from({ length: to - from }, (_, k) => from + k).sort(
      (a, b) => codes[a] - codes[b],
    )
    const sortedCodes = order.map((i) => codes[i])
    const sortedLabels = order.map((i) => labels[i])
    for (let k = 0; k < order.length; k++) {
      codes[from + k] = sortedCodes[k]
      labels[from + k] = sortedLabels[k]
    }
  }

  sortRange(0, s.length)
  cursor = 0
  tiles[0] = 'active'
  yield emit(
    SORTED_LINE.sortS,
    'store',
    `Sorted s: "${labels.slice(0, s.length).join('')}".`,
    'Once every occurrence of a letter sits together, "does s hold the same letters as t" turns into "do the two rows read the same, position by position."',
    { ...base(), sortedS: `"${labels.slice(0, s.length).join('')}"` },
  )

  sortRange(s.length, s.length + t.length)
  tiles[0] = 'idle'
  cursor = s.length
  tiles[s.length] = 'active'
  yield emit(
    SORTED_LINE.sortT,
    'store',
    `Sorted t: "${labels.slice(s.length).join('')}".`,
    'Same trade for t. Two anagrams sort to the identical string — that identity is exactly what the walk below checks.',
    { ...base(), sortedT: `"${labels.slice(s.length).join('')}"` },
  )
  tiles[s.length] = 'idle'

  for (let i = 0; i < s.length; i++) {
    const gs = i
    const gt = s.length + i

    for (let k = 0; k < tiles.length; k++) {
      const doneS = k < i
      const doneT = k >= s.length && k < s.length + i
      if (k === gs || k === gt) tiles[k] = 'active'
      else if (doneS || doneT) tiles[k] = 'done'
      else tiles[k] = 'idle'
    }
    cursor = null
    link = [gs, gt]
    const same = codes[gs] === codes[gt]

    yield emit(
      SORTED_LINE.compare,
      same ? 'match' : 'compare',
      `Position ${i}: '${labels[gs]}' (s) vs '${labels[gt]}' (t).`,
      'Sorted, a mismatch anywhere means the multisets differ — and agreement all the way through means they cannot.',
      { ...base(), i, sCh: labels[gs], tCh: labels[gt], match: same },
    )

    if (!same) {
      tiles[gs] = 'done'
      tiles[gt] = 'done'
      yield emit(
        SORTED_LINE.notFound,
        'return',
        `'${labels[gs]}' vs '${labels[gt]}' — different letters at the same position. Return false.`,
        'One disagreement anywhere in the sorted rows is enough: the two strings cannot hold the same letters the same number of times.',
        { ...base(), i, result: 'false' },
      )
      return
    }
  }

  for (let k = 0; k < tiles.length; k++) tiles[k] = 'done'
  tiles[0] = 'match'
  tiles[tiles.length - 1] = 'match'
  link = null
  result = [0, tiles.length - 1]
  yield emit(
    SORTED_LINE.done,
    'return',
    'Every position agreed. Return true.',
    `The sort cost O(n log n) up front so the comparison itself could be a single straight-line walk — ${s.length} positions, no lookups, no extra memory.`,
    { ...base(), result: 'true' },
  )
}

// ---------------------------------------------------------------------------
// Brute force — search and cross off, no memory, no order
// ---------------------------------------------------------------------------

/**
 * For every letter of `s`, searches `t` by hand for an unused match and
 * crosses it off. `scene.slots` is `[]` on every frame and `scene.probe` is
 * always null — there is no wall to raise and no key to look up, and that
 * absence is the entire point of the comparison.
 */
export function* validAnagramBrute(
  s: string,
  t: string,
): Generator<ArrayMemoryFrame, void, undefined> {
  const { nums: codes, labels } = initialArrays(s, t)
  const tiles: TileState[] = codes.map(() => 'idle')
  const used: boolean[] = t.split('').map(() => false)
  let cursor: number | null = null
  let link: [number, number] | null = null
  let result: [number, number] | null = null

  const emit = createEmitter<ArrayMemoryScene>(() => ({
    nums: [...codes],
    labels: [...labels],
    tiles: [...tiles],
    cursor,
    slots: [], // never fills — brute force has no memory structure
    probe: null, // nothing is ever looked up
    link: link === null ? null : [link[0], link[1]],
    result: result === null ? null : [result[0], result[1]],
  }))

  const base = () => ({ s: `"${s}"`, t: `"${t}"` })

  if (s.length !== t.length) {
    yield emit(
      BRUTE_LINE.mismatch,
      'return',
      `s is ${s.length} letters, t is ${t.length}. Different lengths can never be anagrams.`,
      'No amount of searching fixes a length mismatch — settle it before spending a single comparison.',
      base(),
    )
    return
  }

  yield emit(
    BRUTE_LINE.init,
    'init',
    'No memory, no order. For every letter in s, hunt through t for an unused match.',
    'With nothing remembered, the only way to know a letter is accounted for is to physically find it — and cross it off so it cannot be reused.',
    base(),
  )

  for (let i = 0; i < s.length; i++) {
    cursor = i
    link = null
    tiles[i] = 'active'
    yield emit(
      BRUTE_LINE.outer,
      'compare',
      `Take '${labels[i]}' from s.`,
      'Each letter of s needs exactly one partner in t — matched letters are crossed off so they cannot be reused by a later one.',
      { ...base(), i, ch: labels[i] },
    )

    let matchedJ = -1
    for (let j = 0; j < t.length; j++) {
      if (used[j]) continue
      const g = s.length + j
      tiles[g] = 'active'
      link = [i, g]
      const same = codes[i] === codes[g]
      yield emit(
        BRUTE_LINE.inner,
        same ? 'match' : 'compare',
        `'${labels[i]}' vs '${labels[g]}'.${same ? ' A match.' : ''}`,
        'Every candidate has to be tried by hand — there is no lookup standing in for this search.',
        { ...base(), i, j, sCh: labels[i], tCh: labels[g], found: same },
      )
      if (same) {
        matchedJ = j
        break
      }
      tiles[g] = 'idle'
    }

    if (matchedJ === -1) {
      link = null
      yield emit(
        BRUTE_LINE.notFound,
        'return',
        `No unused '${labels[i]}' left in t. Return false.`,
        'Exhausting every candidate and finding none proves the negative — the same conclusion the map reaches in one lookup.',
        { ...base(), i, result: 'false' },
      )
      return
    }

    used[matchedJ] = true
    tiles[i] = 'done'
    tiles[s.length + matchedJ] = 'done'
    link = null
    yield emit(
      BRUTE_LINE.consume,
      'store',
      `Matched. Cross '${labels[i]}' off in t.`,
      'Crossing a letter off is what stops it from being reused by a later letter of s — without it, one letter of t could satisfy two of s.',
      { ...base(), i, j: matchedJ },
    )
  }

  tiles[0] = 'match'
  tiles[tiles.length - 1] = 'match'
  cursor = null
  result = [0, tiles.length - 1]
  yield emit(
    BRUTE_LINE.done,
    'return',
    'Every letter of s found an unused partner in t. Return true.',
    `${s.length} letters matched by exhaustive search — the same answer the map reaches, at up to ${s.length * t.length} comparisons instead of ${s.length + t.length} lookups.`,
    { ...base(), result: 'true' },
  )
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export const traceOptimized = (s: string, t: string): ArrayMemoryFrame[] => [
  ...validAnagramOptimized(s, t),
]

export const traceSorted = (s: string, t: string): ArrayMemoryFrame[] => [
  ...validAnagramSorted(s, t),
]

export const traceBrute = (s: string, t: string): ArrayMemoryFrame[] => [
  ...validAnagramBrute(s, t),
]

/** Tab order, left to right — best-to-worst, same convention as Contains
 *  Duplicate. The first entry is the default selection. */
const VALID_ANAGRAM_APPROACHES = ['optimized', 'sorted', 'brute'] as const

export const traces: ProblemTraces<
  ArrayMemoryScene,
  (typeof VALID_ANAGRAM_APPROACHES)[number]
> = {
  example: `s = "${EXAMPLE_S}", t = "${EXAMPLE_T}"`,
  approaches: VALID_ANAGRAM_APPROACHES,
  listings: {
    optimized: OPTIMIZED_LISTING,
    sorted: SORTED_LISTING,
    brute: BRUTE_LISTING,
  },
  cases: TEST_CASES,
  build: {
    optimized: (input) => {
      const { s, t } = splitCase(input)
      return traceOptimized(s, t)
    },
    sorted: (input) => {
      const { s, t } = splitCase(input)
      return traceSorted(s, t)
    },
    brute: (input) => {
      const { s, t } = splitCase(input)
      return traceBrute(s, t)
    },
  },
}
