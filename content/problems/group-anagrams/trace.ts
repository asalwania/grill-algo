/**
 * Group Anagrams — build-time trace generators.
 *
 * Nothing here runs in the browser: scripts/build-traces.ts executes these
 * generators at build time, once per entry in TEST_CASES, and writes one
 * frames.<case>.<approach>.json per combination next to this file.
 *
 * ## Fitting a list of words onto the shared scene
 *
 * The shared scene (lib/types.ts's ArrayMemoryScene) is ONE array of numbers.
 * This problem's input is a list of words, so it is packed the same way Valid
 * Anagram packs its two strings — numerically, with the readable text in the
 * optional display fields:
 *
 *   - ONE TILE PER WORD, not per letter. Everything this problem does happens
 *     at word granularity (take a word, sign it, put it in a group), so a
 *     per-letter row would animate nothing the algorithm actually does.
 *   - `nums[i]` is the word packed base-27 (a=1 … z=26, 0 unused so no word
 *     collides with a shorter one). `labels[i]` carries the word itself, which
 *     is what both renderers actually show. The packing exists only so a word
 *     can round-trip through `TestCase.nums`, which is `number[]` — `chrome.ts`
 *     unpacks it again for the picker.
 *   - `target` is UNUSED: the array of words is the whole input, so there is no
 *     scalar to name and the flat view's caption row collapses to its heading.
 *   - The memory wall becomes key -> group size. `slots[].keyLabel` carries the
 *     key in a form that fits a pill ('a1 e1 t1'), `key` a collision-free
 *     number standing in for it (see `keyIdOf`).
 *
 * ## Where the answer lives
 *
 * The answer is a PARTITION, and `scene.result` is a tile pair — so the last
 * frame of every approach rewrites `nums`/`labels` to lay each group out
 * CONTIGUOUSLY, in the order the groups were created. That is not decoration:
 * it is literally what `return [...groups.values()]` produces, and it is legal
 * because `scene.nums` is per frame (only its length is invariant). `result`
 * is then the real tile span of the biggest group, or null when every word
 * ended up alone — which is what makes the picker's answer pill read as a
 * negative for the `no-answer` case. The full partition is prose in
 * `vars.groups`, where AGENTS.md requires every word and number to live.
 *
 * Three approaches, and the gap between the first two is the lesson: TALLY the
 * letters into a 26-slot count and use that as the key (optimized, O(k) per
 * word), SORT each word's letters into a signature and sort the list by it
 * (sorted, O(k log k) per word plus O(n log n) for the list), or compare each
 * word against every group formed so far (brute, O(n²·k)).
 *
 * Sorting a word is the obvious way to name its group and it is not the
 * cheapest — counting reaches the same equivalence classes without the sort,
 * which is exactly why `sorted` is a separate tab and not the headline.
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
export const EXAMPLE_WORDS = ['eat', 'tea', 'tan', 'ate', 'nat', 'bat']

// ---------------------------------------------------------------------------
// Packing words into the numeric scene
// ---------------------------------------------------------------------------

/** 26 letters plus a zero that no letter uses, so 'a' and 'aa' pack apart. */
const BASE = 27

/** 'eat' -> 5*27² + 1*27 + 20. Lowercase a-z only, which is all LeetCode
 *  allows here; four-letter words stay well inside a safe integer. */
export function encodeWord(word: string): number {
  return [...word].reduce((code, ch) => code * BASE + (ch.charCodeAt(0) - 96), 0)
}

/** The inverse of `encodeWord`. Duplicated (deliberately, in five lines) in
 *  chrome.ts so the client bundle never has to import this whole module. */
export function decodeWord(code: number): string {
  let letters = ''
  let rest = code
  while (rest > 0) {
    letters = String.fromCharCode(96 + (rest % BASE)) + letters
    rest = Math.floor(rest / BASE)
  }
  return letters
}

/** Two words are anagrams exactly when this agrees: 'eat' and 'tea' both sign
 *  as 'aet'. What the `sorted` approach keys on, and what the tests use as an
 *  independent notion of "same group". */
export function signatureOf(word: string): string {
  return [...word].sort().join('')
}

/** The optimized listing's key, verbatim: one count per letter of the alphabet,
 *  joined. Same equivalence classes as `signatureOf` — and reached in one pass
 *  over the word rather than a sort of it, which is the whole point. */
export function countKeyOf(word: string): string {
  const count = new Array<number>(26).fill(0)
  for (const ch of word) count[ch.charCodeAt(0) - 97]++
  return count.join(',')
}

/** The same key, short enough for a slot pill: 'eat' -> 'a1 e1 t1'. Twenty-two
 *  of the twenty-six counts are zero for a word this size, and a wall row that
 *  reads `0,0,1,0,0,1,…` teaches nothing. */
export function countLabelOf(word: string): string {
  const count = new Array<number>(26).fill(0)
  for (const ch of word) count[ch.charCodeAt(0) - 97]++
  return count
    .map((n, i) => (n === 0 ? '' : `${String.fromCharCode(97 + i)}${n}`))
    .filter((part) => part !== '')
    .join(' ')
}

/**
 * A NUMBER standing in for the count key, because `scene.probe` and
 * `slot.key` are numeric (lib/types.ts) and the real key is a 26-field string.
 *
 * The counts and the sorted form are in bijection — 'a2 b1' is 'aab' and
 * nothing else — so packing the sorted form base-27 is a collision-free id for
 * the count key, and `chrome.ts` unpacks it to render the counts back out. It
 * is an id, not the key: nothing in the trace ever sorts a word to GET it.
 */
const keyIdOf = (word: string): number => encodeWord(signatureOf(word))

// ---------------------------------------------------------------------------
// Playable inputs
// ---------------------------------------------------------------------------

function makeCase(id: string, label: string, words: string[], note: string): TestCase {
  return { id, label, nums: words.map(encodeWord), note }
}

/** The inverse of `makeCase`, used by every generator and by the chrome's
 *  `formatCaseInput`. No `target` to consult — the words are the whole input. */
export function wordsOf(input: TestCase): string[] {
  return input.nums.map(decodeWord)
}

/**
 * Four inputs, each reaching something the others don't:
 *   - `sample` builds three groups of different sizes, so the wall fills, the
 *     biggest group is unambiguous, and brute force has real work to do.
 *   - `first-pair` groups on the very second word — the earliest a group can
 *     grow at all.
 *   - `late-answer` groups only on the LAST word, so every approach spends the
 *     whole run looking like the no-answer case until it isn't.
 *   - `no-answer` never groups anything: every word is its own group, which is
 *     the branch where `result` stays null and the return chip is absent.
 *
 * No case's signatures are already in ascending order — the `sorted` approach
 * spends one frame on its sort, and an already-sorted input would make that
 * frame reorder nothing. `trace.test.ts` asserts it rather than trusting it.
 */
export const TEST_CASES: TestCase[] = [
  makeCase(
    'sample',
    'The walkthrough',
    EXAMPLE_WORDS,
    'Three groups of three different sizes — six words, three signatures.',
  ),
  makeCase(
    'first-pair',
    'Groups straight away',
    ['eat', 'ate', 'bat', 'cab'],
    'The second word already joins the first; the last two never find anyone.',
  ),
  makeCase(
    'late-answer',
    'Groups on the last word',
    ['tan', 'bat', 'eat', 'nat'],
    'Nothing groups until the very last word finds the very first one.',
  ),
  makeCase(
    'no-answer',
    'Nothing groups at all',
    ['cat', 'dog', 'bird'],
    'Three signatures, three groups of one — the map never gets a second hit.',
  ),
]

// ---------------------------------------------------------------------------
// Canonical listings
// ---------------------------------------------------------------------------

/**
 * Every optimized frame's `line` is a 1-based index into this listing, and
 * nothing else. Per-language listings map onto it via Solution.lineMap.
 */
export const OPTIMIZED_LISTING = [
  'function groupAnagrams(strs) {', //                        1
  '  const groups = new Map()', //                            2
  '', //                                                      3
  '  for (const word of strs) {', //                          4
  '    const count = new Array(26).fill(0)', //               5
  '    for (const ch of word) {', //                          6
  "      count[ch.charCodeAt(0) - 'a'.charCodeAt(0)]++", //   7
  '    }', //                                                 8
  '', //                                                      9
  "    const key = count.join(',')", //                      10
  '', //                                                     11
  '    if (!groups.has(key)) {', //                          12
  '      groups.set(key, [])', //                            13
  '    }', //                                                14
  '', //                                                     15
  '    groups.get(key).push(word)', //                       16
  '  }', //                                                  17
  '', //                                                     18
  '  return [...groups.values()]', //                        19
  '}', //                                                    20
].join('\n')

export const SORTED_LISTING = [
  'function groupAnagrams(strs) {', //                                    1
  "  const keyed = strs.map((word) => [[...word].sort().join(''), word])", //  2
  '', //                                                                  3
  '  keyed.sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))', //   4
  '', //                                                                  5
  '  const groups = []', //                                               6
  '', //                                                                  7
  '  for (let i = 0; i < keyed.length; i++) {', //                        8
  '    if (i > 0 && keyed[i][0] === keyed[i - 1][0]) {', //               9
  '      groups[groups.length - 1].push(keyed[i][1])', //                10
  '    } else {', //                                                     11
  '      groups.push([keyed[i][1]])', //                                 12
  '    }', //                                                            13
  '  }', //                                                              14
  '', //                                                                 15
  '  return groups', //                                                  16
  '}', //                                                                17
].join('\n')

export const BRUTE_LISTING = [
  'function groupAnagrams(strs) {', //                              1
  '  const groups = []', //                                         2
  '', //                                                            3
  '  for (const word of strs) {', //                                4
  '    let placed = false', //                                      5
  '', //                                                            6
  '    for (const group of groups) {', //                           7
  '      if (isAnagram(word, group[0])) {', //                      8
  '        group.push(word)', //                                    9
  '        placed = true', //                                      10
  '        break', //                                              11
  '      }', //                                                    12
  '    }', //                                                      13
  '', //                                                           14
  '    if (!placed) {', //                                         15
  '      groups.push([word])', //                                  16
  '    }', //                                                      17
  '  }', //                                                        18
  '', //                                                           19
  '  return groups', //                                            20
  '}', //                                                          21
  '', //                                                           22
  'function isAnagram(a, b) {', //                                 23
  '  if (a.length !== b.length) return false', //                  24
  '', //                                                           25
  '  const counts = new Map()', //                                 26
  '  for (const ch of a) counts.set(ch, (counts.get(ch) || 0) + 1)', // 27
  '', //                                                           28
  '  for (const ch of b) {', //                                    29
  '    const n = counts.get(ch)', //                               30
  '    if (!n) return false', //                                   31
  '    counts.set(ch, n - 1)', //                                  32
  '  }', //                                                        33
  '', //                                                           34
  '  return true', //                                              35
  '}', //                                                          36
].join('\n')

/** `key` lands on the TALLY (line 7), not on the `count.join(',')` that
 *  formats it — the counting is the step that replaces the sort, and it is the
 *  line worth watching. Line 10 is a formatting detail and never active, the
 *  same way the brute listing's `isAnagram` body never is. */
const OPTIMIZED_LINE = {
  init: 2,
  read: 4,
  key: 7,
  create: 13,
  push: 16,
  done: 19,
} as const

const SORTED_LINE = {
  init: 2,
  sort: 4,
  read: 8,
  extend: 10,
  start: 12,
  done: 16,
} as const

const BRUTE_LINE = {
  init: 2,
  read: 4,
  compare: 8,
  join: 9,
  start: 16,
  done: 20,
} as const

// ---------------------------------------------------------------------------
// Shared machinery
// ---------------------------------------------------------------------------

type GroupSlot = { key: number; value: number; state: SlotState; keyLabel: string }

/** `[[eat, tea], [tan]]` — the partition as the DOM variables panel shows it.
 *  `groups` holds TILE INDICES, so this must be called before any relayout. */
const formatGroups = (groups: number[][], labels: string[]): string =>
  groups.length === 0
    ? '[]'
    : `[${groups.map((group) => `[${group.map((i) => labels[i]).join(', ')}]`).join(', ')}]`

/**
 * The `return` itself: rewrites `codes`/`labels` so each group's words sit
 * together, groups in creation order, and repaints the tiles against the new
 * layout. Returns the tile span of the BIGGEST group — the pair `scene.result`
 * reports — or null when no group has more than one word, which is this
 * problem's "nothing found".
 *
 * Mutates all three arrays in place, so anything derived from the OLD indices
 * (`formatGroups`) has to be computed first.
 */
function collectGroups(
  groups: number[][],
  codes: number[],
  labels: string[],
  tiles: TileState[],
): [number, number] | null {
  const order = groups.flat()
  const orderedCodes = order.map((i) => codes[i])
  const orderedLabels = order.map((i) => labels[i])
  for (let k = 0; k < order.length; k++) {
    codes[k] = orderedCodes[k]
    labels[k] = orderedLabels[k]
  }

  let biggest: [number, number] | null = null
  let biggestSize = 1 // a group of one is not a grouping, so it never wins
  let start = 0
  for (const group of groups) {
    if (group.length > biggestSize) {
      biggestSize = group.length
      biggest = [start, start + group.length - 1]
    }
    start += group.length
  }

  for (let k = 0; k < tiles.length; k++) {
    tiles[k] = biggest !== null && k >= biggest[0] && k <= biggest[1] ? 'match' : 'done'
  }

  return biggest
}

/** The one line of narration every approach ends on, so the three tabs agree
 *  about what was returned even though they built it in different orders. */
const doneNarration = (groups: number[][], words: string[]): string =>
  `${words.length} words, ${groups.length} group${groups.length === 1 ? '' : 's'}.`

// ---------------------------------------------------------------------------
// Optimized — one pass, letter counts -> group
// ---------------------------------------------------------------------------

/**
 * Solves Group Anagrams with a counts->group map, yielding a FULL state
 * snapshot at each meaningful point. This actually computes the answer — the
 * frames are a by-product of a real run, not a hand-authored script.
 *
 * A word's letter counts are a NAME its entire group shares, so membership is
 * one map lookup rather than a comparison against anything — and the name is
 * built by tallying the word's letters, which is O(k), where sorting them
 * would be O(k log k). That is the only difference from the `sorted` tab, and
 * it is the reason this one is the headline.
 *
 * Each word gets three beats — the tile lights, the tally forms (`probe`), the
 * word lands in a group — plus a fourth when that group has to be created
 * first, which is the frame the memory wall grows on.
 */
export function* groupAnagramsOptimized(
  words: string[],
): Generator<ArrayMemoryFrame, void, undefined> {
  const labels = [...words]
  const codes = labels.map(encodeWord)
  const tiles: TileState[] = codes.map(() => 'idle')
  const slots: GroupSlot[] = []
  /** Tile indices per group, parallel to `slots`. */
  const groups: number[][] = []
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

  const base = () => ({ n: words.length, groups: formatGroups(groups, labels) })

  yield emit(
    OPTIMIZED_LINE.init,
    'init',
    'An empty map. Its keys will be letter counts, its values the groups.',
    'Anagrams are exactly the words with the same letters in the same quantities — so the counts themselves are a name every member of a group shares, and nothing else does. Names are what a map is for.',
    base(),
  )

  for (let i = 0; i < words.length; i++) {
    cursor = i
    probe = null
    link = null
    tiles[i] = 'active'
    yield emit(
      OPTIMIZED_LINE.read,
      'compare',
      `Take "${labels[i]}".`,
      'Every word is handled once, on its own, and never compared against another word directly.',
      { ...base(), i, word: labels[i] },
    )

    const label = countLabelOf(labels[i])
    probe = keyIdOf(labels[i])
    const hit = slots.findIndex((slot) => slot.key === probe)
    yield emit(
      OPTIMIZED_LINE.key,
      'compare',
      `Tally its letters: ${label}. ${hit === -1 ? 'Nothing under that key yet.' : 'That group already exists.'}`,
      'One pass over the word builds the key — no sorting. Every anagram of this word tallies to the same 26 counts, and no other word does, so one lookup decides membership for a group of any size.',
      {
        ...base(),
        i,
        word: labels[i],
        counts: label,
        key: countKeyOf(labels[i]),
        found: hit !== -1,
      },
    )

    let index = hit
    if (hit === -1) {
      slots.push({ key: probe, value: 0, state: 'filled', keyLabel: label })
      groups.push([])
      index = slots.length - 1
      link = [i, index]
      yield emit(
        OPTIMIZED_LINE.create,
        'store',
        `First word counting ${label} — open a group for it.`,
        'A new tally means a group nobody has needed yet. It costs one entry, and every later anagram of this word finds it in one step.',
        { ...base(), i, word: labels[i], counts: label },
      )
    }

    slots[index].value++
    groups[index].push(i)
    link = [i, index]
    tiles[i] = 'done'
    yield emit(
      OPTIMIZED_LINE.push,
      slots[index].value > 1 ? 'match' : 'store',
      `"${labels[i]}" joins ${label} — ${slots[index].value} in that group now.`,
      'No comparison happened, and no word was sorted. The word was filed under its counts, and everything sharing those counts is already sitting there.',
      { ...base(), i, word: labels[i], counts: label, size: slots[index].value },
    )
  }

  const answer = formatGroups(groups, labels)
  cursor = null
  probe = null
  link = null
  result = collectGroups(groups, codes, labels, tiles)
  yield emit(
    OPTIMIZED_LINE.done,
    'return',
    doneNarration(groups, words),
    `Every word was read once, tallied once and filed once — ${words.length} lookups, no word sorted and no two words ever compared. The map's values, in insertion order, ARE the answer.`,
    { n: words.length, groups: answer, result: `${groups.length} groups` },
  )
}

// ---------------------------------------------------------------------------
// Sorted — sort BY signature, then take the runs
// ---------------------------------------------------------------------------

/**
 * Sorts the words by their signature so anagrams land next to each other, then
 * walks the row once and starts a new group wherever the signature changes.
 * `scene.slots` stays empty on every frame — this approach spends O(n log n)
 * comparisons instead of a map, and the flat view's tile-to-tile connector
 * (drawn whenever `slots` is empty) links each word to its predecessor, which
 * is the only thing it ever needs to look at.
 *
 * Note this approach sorts TWICE: once inside each word to build its signature,
 * and once over the whole list to bring equal signatures together. The
 * optimized tab pays neither — it tallies instead of sorting the word, and
 * files instead of ordering the list.
 *
 * The list sort is ONE frame. Animating a sort is its own problem with its own
 * page; what matters here is what the reordering BUYS.
 */
export function* groupAnagramsSorted(
  words: string[],
): Generator<ArrayMemoryFrame, void, undefined> {
  const labels = [...words]
  const codes = labels.map(encodeWord)
  const tiles: TileState[] = codes.map(() => 'idle')
  const groups: number[][] = []
  let cursor: number | null = null
  let link: [number, number] | null = null
  let result: [number, number] | null = null

  const emit = createEmitter<ArrayMemoryScene>(() => ({
    nums: [...codes],
    labels: [...labels],
    tiles: [...tiles],
    cursor,
    slots: [], // never fills — the whole point is that this costs no map
    probe: null, // nothing is ever looked up
    link: link === null ? null : [link[0], link[1]],
    result: result === null ? null : [result[0], result[1]],
  }))

  const base = () => ({ n: words.length, groups: formatGroups(groups, labels) })

  yield emit(
    SORTED_LINE.init,
    'init',
    'Label every word with its signature — its own letters, sorted.',
    'Same observation as the map approach, reached the expensive way: sorting a word is O(k log k) where tallying it is O(k). What this buys back is that it needs no map at all.',
    base(),
  )

  // Stable, ties by original position: two words with the SAME signature keep
  // the order the caller gave them, which is what makes each group's first
  // word the one that appeared first.
  const order = labels
    .map((_, i) => i)
    .sort((a, b) => {
      const sa = signatureOf(labels[a])
      const sb = signatureOf(labels[b])
      return sa < sb ? -1 : sa > sb ? 1 : a - b
    })
  const sortedCodes = order.map((i) => codes[i])
  const sortedLabels = order.map((i) => labels[i])
  for (let k = 0; k < order.length; k++) {
    codes[k] = sortedCodes[k]
    labels[k] = sortedLabels[k]
  }
  // Cursor only, no tile lit: the first word's own read frame is what lights
  // tile 0, and this frame must not pre-empt it into a duplicate scene.
  cursor = 0
  yield emit(
    SORTED_LINE.sort,
    'store',
    `Sorted by signature: ${labels.map((word) => `"${word}"`).join(', ')}.`,
    'Once the row is ordered by signature, every group is a RUN of neighbours. Membership stops being a lookup and becomes "same as the one before me?".',
    { ...base(), order: labels.map((word) => `"${word}"`).join(', ') },
  )

  for (let i = 0; i < words.length; i++) {
    cursor = i
    link = null
    tiles[i] = 'active'
    yield emit(
      SORTED_LINE.read,
      'compare',
      `Take "${labels[i]}" — signature "${signatureOf(labels[i])}".`,
      'One pass, left to right. Nothing behind position i - 1 is ever consulted again.',
      { ...base(), i, word: labels[i], key: signatureOf(labels[i]) },
    )

    const sameAsPrevious = i > 0 && signatureOf(labels[i]) === signatureOf(labels[i - 1])
    link = i > 0 ? [i, i - 1] : null
    tiles[i] = 'done'

    if (sameAsPrevious) {
      groups[groups.length - 1].push(i)
      yield emit(
        SORTED_LINE.extend,
        'match',
        `Same signature as "${labels[i - 1]}" — same group.`,
        'The sort already proved these two belong together; the walk only has to notice it.',
        { ...base(), i, word: labels[i], size: groups[groups.length - 1].length },
      )
    } else {
      groups.push([i])
      yield emit(
        SORTED_LINE.start,
        'store',
        i === 0
          ? `"${labels[i]}" starts the first group.`
          : `Different signature from "${labels[i - 1]}" — start a new group.`,
        'A change of signature in a sorted row is a group boundary, and there can never be another word of the previous group further along.',
        { ...base(), i, word: labels[i] },
      )
    }
  }

  const answer = formatGroups(groups, labels)
  cursor = null
  link = null
  result = collectGroups(groups, codes, labels, tiles)
  yield emit(
    SORTED_LINE.done,
    'return',
    doneNarration(groups, words),
    'No map, and the shortest trace of the three — because the work that makes it short happened inside one sort frame, off screen. The comparisons are still there; they are just not steps you were shown.',
    { n: words.length, groups: answer, result: `${groups.length} groups` },
  )
}

// ---------------------------------------------------------------------------
// Brute force — try this word against every group formed so far
// ---------------------------------------------------------------------------

/**
 * For every word, compares it against the FIRST member of each group built so
 * far until one matches. `scene.slots` is `[]` and `scene.probe` is null on
 * every frame — there is no wall to raise and no key to look up, and that
 * absence is the entire point of the comparison with the optimized tab.
 */
export function* groupAnagramsBrute(
  words: string[],
): Generator<ArrayMemoryFrame, void, undefined> {
  const labels = [...words]
  const codes = labels.map(encodeWord)
  const tiles: TileState[] = codes.map(() => 'idle')
  const groups: number[][] = []
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

  const base = () => ({ n: words.length, groups: formatGroups(groups, labels) })

  yield emit(
    BRUTE_LINE.init,
    'init',
    'No map, no sorting. Groups get built by trying each word against the ones already placed.',
    'With nothing remembered under a key, the only way to know where a word belongs is to ask every group that exists — one representative at a time.',
    base(),
  )

  for (let i = 0; i < words.length; i++) {
    cursor = i
    link = null
    tiles[i] = 'active'
    yield emit(
      BRUTE_LINE.read,
      'compare',
      `Take "${labels[i]}". ${groups.length} group${groups.length === 1 ? '' : 's'} to try.`,
      'Every group already formed is a candidate, and there is no way to rule any of them out in advance.',
      { ...base(), i, word: labels[i], candidates: groups.length },
    )

    let joined = -1
    for (let g = 0; g < groups.length; g++) {
      const representative = groups[g][0]
      tiles[representative] = 'active'
      link = [i, representative]
      const same = signatureOf(labels[i]) === signatureOf(labels[representative])
      yield emit(
        BRUTE_LINE.compare,
        same ? 'match' : 'compare',
        `"${labels[i]}" against "${labels[representative]}"${same ? ' — anagrams.' : ' — no.'}`,
        'Each of these is a full letter-count comparison, not a lookup. The map approach pays none of them.',
        { ...base(), i, g, against: labels[representative], found: same },
      )

      if (same) {
        joined = g
        break
      }
      tiles[representative] = 'done'
    }

    if (joined === -1) {
      link = null
      tiles[i] = 'done'
      groups.push([i])
      yield emit(
        BRUTE_LINE.start,
        'store',
        `Nothing matched — "${labels[i]}" starts group ${groups.length - 1}.`,
        'Exhausting every group is what proves a new one is needed, and it is also what makes the next word more expensive than this one.',
        { ...base(), i, word: labels[i] },
      )
    } else {
      tiles[i] = 'done'
      tiles[groups[joined][0]] = 'done'
      link = null
      groups[joined].push(i)
      yield emit(
        BRUTE_LINE.join,
        'store',
        `"${labels[i]}" joins group ${joined} — ${groups[joined].length} in it now.`,
        'The same conclusion the map reached in one lookup, bought here with one comparison per group tried.',
        { ...base(), i, word: labels[i], g: joined, size: groups[joined].length },
      )
    }
  }

  const answer = formatGroups(groups, labels)
  cursor = null
  link = null
  result = collectGroups(groups, codes, labels, tiles)
  yield emit(
    BRUTE_LINE.done,
    'return',
    doneNarration(groups, words),
    `The same partition as the other two, reached by comparing words against groups instead of naming them — up to ${words.length}² comparisons where the map does ${words.length} lookups.`,
    { n: words.length, groups: answer, result: `${groups.length} groups` },
  )
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export const traceOptimized = (words: string[]): ArrayMemoryFrame[] => [
  ...groupAnagramsOptimized(words),
]

export const traceSorted = (words: string[]): ArrayMemoryFrame[] => [
  ...groupAnagramsSorted(words),
]

export const traceBrute = (words: string[]): ArrayMemoryFrame[] => [
  ...groupAnagramsBrute(words),
]

/** Tab order, left to right — best first, and the first entry is the default
 *  selection. `sorted` ships because grouping never has to report a position
 *  in the original list, so reordering the words destroys nothing. */
const GROUP_ANAGRAMS_APPROACHES = ['optimized', 'sorted', 'brute'] as const

export const traces: ProblemTraces<
  ArrayMemoryScene,
  (typeof GROUP_ANAGRAMS_APPROACHES)[number]
> = {
  example: `strs = [${EXAMPLE_WORDS.map((word) => `"${word}"`).join(', ')}]`,
  approaches: GROUP_ANAGRAMS_APPROACHES,
  listings: {
    optimized: OPTIMIZED_LISTING,
    sorted: SORTED_LISTING,
    brute: BRUTE_LISTING,
  },
  cases: TEST_CASES,
  build: {
    optimized: (input) => traceOptimized(wordsOf(input)),
    sorted: (input) => traceSorted(wordsOf(input)),
    brute: (input) => traceBrute(wordsOf(input)),
  },
}
