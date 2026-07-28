/**
 * Top K Frequent Elements — build-time trace generators.
 *
 * Nothing here runs in the browser: scripts/build-traces.ts executes these
 * generators at build time, once per entry in TEST_CASES, and writes one
 * frames.<case>.<approach>.json per combination next to this file.
 *
 * ## Fitting the problem onto the shared scene
 *
 * This is the first problem in the family whose input is already exactly what
 * the shared scene (lib/types.ts's ArrayMemoryScene) holds — one array of
 * plain numbers — so there is no packing and no `labels`. Two mappings are
 * worth stating anyway:
 *
 *   - `scene.target` is **k**. It is the problem's only scalar besides the
 *     array, which is what `target` is for, and the flat view's caption row
 *     renders it as `k = 2`.
 *   - The memory wall is the COUNT MAP: `slot.key` is a value from the array
 *     and `slot.value` is how many times it has been seen. Only the optimized
 *     approach fills it; the other two leave `slots` empty and the wall stays
 *     sunk.
 *
 * ## Where the answer lives
 *
 * The answer is a SET of k values and `scene.result` is a tile pair, so — the
 * same move Group Anagrams makes for its partition — the last frame of every
 * approach rewrites `nums` to put every occurrence of the chosen values at the
 * FRONT, in the order they were chosen, with the rejected elements behind them.
 * That is legal because `scene.nums` is per frame (only its length is
 * invariant, G1 rule 4), and it makes `result` the real tile span the answer
 * covers. The k values themselves are prose in `vars.result`, where AGENTS.md
 * requires every word and number to live.
 *
 * `result` is `null` when NO value repeats. There is still an answer in that
 * case (any k of the values will do), but nothing is more frequent than
 * anything else, and that is the branch the `no-answer` case exists to show:
 * the picker's pill reads as a negative and the flat view's return chip is
 * absent, exactly as it does for a Two Sum with no pair.
 *
 * Three approaches, and the gap between the first two is the lesson: count
 * every value in one pass and then read the counts back off BUCKETS indexed by
 * frequency (optimized, O(n) — no comparison sort anywhere), sort the array so
 * equal values form runs and then sort the runs by length (sorted, O(n log n)),
 * or take k rounds and in each one re-count every remaining candidate by
 * scanning the whole array (brute, O(k·n²)).
 *
 * Sorting is the obvious way to rank things by frequency and it is not the
 * cheapest — the counts are bounded by n, so they can index an array instead of
 * being compared, which is exactly why `sorted` is a separate tab and not the
 * headline.
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
export const EXAMPLE_NUMS = [3, 1, 2, 3, 2, 3]

/** The k the shipped frames are generated with. */
export const EXAMPLE_K = 2

// ---------------------------------------------------------------------------
// Playable inputs
// ---------------------------------------------------------------------------

/**
 * Four inputs, each reaching something the others don't:
 *   - `sample` has three values with three different counts, so the wall fills,
 *     the ranking is unambiguous and brute force has two full rounds of work.
 *   - `first-pair` repeats on the very second element — the earliest a count
 *     can reach two at all — and the value that wins is NOT that one.
 *   - `late-answer` leaves two values tied for the lead until the final
 *     element breaks it, so the run looks undecided the whole way.
 *   - `no-answer` never repeats anything: every count is 1, which is the branch
 *     where `result` stays null and the return chip is absent.
 *
 * Every case obeys the problem's own constraint that 1 <= k <= the number of
 * distinct values, and no case's array is already in ascending order — the
 * `sorted` approach spends one frame on its sort, and an already-sorted input
 * would make that frame reorder nothing. `trace.test.ts` asserts both rather
 * than trusting them.
 */
export const TEST_CASES: TestCase[] = [
  {
    id: 'sample',
    label: 'The walkthrough',
    nums: EXAMPLE_NUMS,
    target: EXAMPLE_K,
    note: 'Six elements, three values, counts of 3, 2 and 1 — nothing is tied.',
  },
  {
    id: 'first-pair',
    label: 'A repeat straight away',
    nums: [7, 7, 4, 9, 4, 4],
    target: 2,
    note: 'The first value doubles up immediately, then loses the lead to one that started later.',
  },
  {
    id: 'late-answer',
    label: 'Decided by the last element',
    nums: [8, 5, 8, 5, 6, 5],
    target: 1,
    note: 'Two values are tied at two apiece until the very last element breaks it.',
  },
  {
    id: 'no-answer',
    label: 'Nothing repeats at all',
    nums: [9, 4, 6],
    target: 3,
    note: 'Every value appears once, so no value is more frequent than any other.',
  },
]

/** `TestCase.target` is this problem's k. Read through here so a case that
 *  forgot it fails the build loudly instead of silently becoming k = 0. */
export function kOf(input: TestCase): number {
  if (input.target === undefined) {
    throw new Error(`case "${input.id}" has no k — set TestCase.target`)
  }
  return input.target
}

// ---------------------------------------------------------------------------
// Canonical listings
// ---------------------------------------------------------------------------

/**
 * Every optimized frame's `line` is a 1-based index into this listing, and
 * nothing else. Per-language listings map onto it via Solution.lineMap.
 *
 * The take loop deliberately has NO early `return` inside it: the trailing
 * `return out` is the terminal line for every input, so it is reachable from
 * every case rather than only from a degenerate one.
 */
export const OPTIMIZED_LISTING = [
  'function topKFrequent(nums, k) {', //                                   1
  '  const count = new Map()', //                                          2
  '', //                                                                   3
  '  for (const num of nums) {', //                                        4
  '    const seen = count.get(num) ?? 0', //                               5
  '    count.set(num, seen + 1)', //                                       6
  '  }', //                                                                7
  '', //                                                                   8
  '  const buckets = Array.from({ length: nums.length + 1 }, () => [])', // 9
  '  for (const [num, freq] of count) {', //                              10
  '    buckets[freq].push(num)', //                                       11
  '  }', //                                                               12
  '', //                                                                  13
  '  const out = []', //                                                  14
  '  for (let freq = nums.length; freq > 0 && out.length < k; freq--) {', // 15
  '    for (const num of buckets[freq]) {', //                            16
  '      out.push(num)', //                                               17
  '      if (out.length === k) break', //                                 18
  '    }', //                                                             19
  '  }', //                                                               20
  '', //                                                                  21
  '  return out', //                                                      22
  '}', //                                                                 23
].join('\n')

export const SORTED_LISTING = [
  'function topKFrequent(nums, k) {', //                            1
  '  const ordered = [...nums]', //                                 2
  '  ordered.sort((a, b) => a - b)', //                             3
  '', //                                                            4
  '  const runs = []', //                                           5
  '  for (let i = 0; i < ordered.length; i++) {', //                6
  '    if (i > 0 && ordered[i] === ordered[i - 1]) {', //           7
  '      runs[runs.length - 1].count++', //                         8
  '    } else {', //                                                9
  '      runs.push({ value: ordered[i], count: 1 })', //           10
  '    }', //                                                      11
  '  }', //                                                        12
  '', //                                                           13
  '  runs.sort((a, b) => b.count - a.count)', //                   14
  '', //                                                           15
  '  return runs.slice(0, k).map((run) => run.value)', //          16
  '}', //                                                          17
].join('\n')

export const BRUTE_LISTING = [
  'function topKFrequent(nums, k) {', //                     1
  '  const out = []', //                                     2
  '', //                                                     3
  '  while (out.length < k) {', //                           4
  '    let best = null', //                                  5
  '    let bestCount = 0', //                                6
  '', //                                                     7
  '    for (let i = 0; i < nums.length; i++) {', //          8
  '      if (out.includes(nums[i])) continue', //            9
  '', //                                                    10
  '      let count = 0', //                                 11
  '      for (let j = 0; j < nums.length; j++) {', //       12
  '        if (nums[j] === nums[i]) count++', //            13
  '      }', //                                             14
  '', //                                                    15
  '      if (count > bestCount) {', //                      16
  '        best = nums[i]', //                              17
  '        bestCount = count', //                           18
  '      }', //                                             19
  '    }', //                                               20
  '', //                                                    21
  '    out.push(best)', //                                  22
  '  }', //                                                 23
  '', //                                                    24
  '  return out', //                                        25
  '}', //                                                   26
].join('\n')

/** `bucket` lands on the PUSH (line 11), not on the `Array.from` that sizes the
 *  buckets — dropping each value into the slot named by its count is the step
 *  that replaces the sort, and it is the line worth watching. */
const OPTIMIZED_LINE = {
  init: 2,
  read: 4,
  probe: 5,
  tally: 6,
  bucket: 11,
  take: 17,
  done: 22,
} as const

const SORTED_LINE = {
  init: 2,
  sort: 3,
  read: 6,
  extend: 8,
  start: 10,
  rank: 14,
  done: 16,
} as const

/** Line 17 (`best = nums[i]`) is never an active line: taking the lead is a
 *  variable move with nothing to show, so the scan frame that discovers it says
 *  so in its narration instead. Same reason Group Anagrams never lights the
 *  body of its `isAnagram`. */
const BRUTE_LINE = {
  init: 2,
  read: 8,
  scan: 13,
  take: 22,
  done: 25,
} as const

// ---------------------------------------------------------------------------
// Shared machinery
// ---------------------------------------------------------------------------

type CountSlot = { key: number; value: number; state: SlotState }

/** `[3, 2]` — a list of values as the DOM variables panel shows it. */
const formatList = (values: number[]): string => `[${values.join(', ')}]`

/** `{ 3→3, 1→1, 2→2 }` — value to times-seen, in whatever order the structure
 *  currently holds them, which is itself part of what the frame is showing. */
const formatTally = (entries: { value: number; count: number }[]): string =>
  entries.length === 0
    ? '{ }'
    : `{ ${entries.map((entry) => `${entry.value}→${entry.count}`).join(', ')} }`

/**
 * The `return` itself: rewrites `nums` so every occurrence of a CHOSEN value
 * sits at the front, chosen values in the order they were picked, and repaints
 * the tiles against the new layout. Returns the tile span the answer covers, or
 * null when no value repeated — see this file's header for why that is the
 * "nothing found" branch of a problem that always has an answer.
 *
 * Mutates `nums` and `tiles` in place, so anything derived from the OLD
 * positions has to be computed first.
 */
function layoutAnswer(
  picked: number[],
  nums: number[],
  tiles: TileState[],
  repeats: boolean,
): [number, number] | null {
  const chosen = new Set(picked)
  const front: number[] = []
  for (const value of picked) {
    for (let i = 0; i < nums.length; i++) {
      if (nums[i] === value) front.push(i)
    }
  }
  const back: number[] = []
  for (let i = 0; i < nums.length; i++) {
    if (!chosen.has(nums[i])) back.push(i)
  }

  const order = [...front, ...back]
  const reordered = order.map((i) => nums[i])
  for (let i = 0; i < nums.length; i++) nums[i] = reordered[i]

  for (let i = 0; i < tiles.length; i++) {
    tiles[i] = i < front.length ? 'match' : 'done'
  }

  return repeats ? [0, front.length - 1] : null
}

/** The one line of narration every approach ends on, so the three tabs agree
 *  about what was returned even though they ranked it in different ways. */
const doneNarration = (picked: number[], k: number): string =>
  `The ${k} most frequent: ${formatList(picked)}.`

// ---------------------------------------------------------------------------
// Optimized — count once, then read the counts back off buckets
// ---------------------------------------------------------------------------

/**
 * Solves Top K Frequent Elements with a count map plus a bucket pass, yielding
 * a FULL state snapshot at each meaningful point. This actually computes the
 * answer — the frames are a by-product of a real run, not a hand-authored
 * script.
 *
 * The idea that makes it O(n): a count can never exceed n, so the counts are
 * small integers and can INDEX an array instead of being compared to each
 * other. Walking that array from the top hands the values back in descending
 * frequency without a single comparison.
 *
 * Each element gets three beats — the tile lights, the question forms
 * (`probe`), the count moves — and then the whole bucket pass is ONE frame,
 * because what it produces is a reordering of the wall and not a per-value
 * story. Animating a sort (or a bucket pass) is its own problem, with its own
 * page; what matters here is what the reordering BUYS.
 */
export function* topKOptimized(
  input: number[],
  k: number,
): Generator<ArrayMemoryFrame, void, undefined> {
  const nums = [...input]
  const tiles: TileState[] = nums.map(() => 'idle')
  const slots: CountSlot[] = []
  let cursor: number | null = null
  let probe: number | null = null
  let link: [number, number] | null = null
  let result: [number, number] | null = null

  const emit = createEmitter<ArrayMemoryScene>(() => ({
    nums: [...nums],
    target: k,
    tiles: [...tiles],
    cursor,
    slots: slots.map((slot) => ({ ...slot })),
    probe,
    link: link === null ? null : [link[0], link[1]],
    result: result === null ? null : [result[0], result[1]],
  }))

  const tally = () => slots.map((slot) => ({ value: slot.key, count: slot.value }))
  const base = () => ({ n: nums.length, k, counts: formatTally(tally()) })

  yield emit(
    OPTIMIZED_LINE.init,
    'init',
    'An empty map. Its keys will be the values in the array, its entries how often each one turns up.',
    'Nothing about frequency can be known from one element on its own, and the array is the only place the information lives. One pass that writes down what it sees is the cheapest way to learn all of it at once.',
    base(),
  )

  for (let i = 0; i < nums.length; i++) {
    cursor = i
    probe = null
    link = null
    tiles[i] = 'active'
    yield emit(
      OPTIMIZED_LINE.read,
      'compare',
      `Take nums[${i}] = ${nums[i]}.`,
      'Every element is read exactly once, in order, and never compared against another element.',
      { ...base(), i, num: nums[i] },
    )

    probe = nums[i]
    const hit = slots.findIndex((slot) => slot.key === probe)
    if (hit !== -1) slots[hit].state = 'probed'
    yield emit(
      OPTIMIZED_LINE.probe,
      'compare',
      hit === -1
        ? `Nothing under ${nums[i]} yet — that reads as a count of 0.`
        : `${nums[i]} is already in the map, on ${slots[hit].value}.`,
      'The lookup is the whole cost of the step, and it does not grow with the array — a map answers "how many so far?" in the same time on element six as on element six million.',
      { ...base(), i, num: nums[i], found: hit !== -1 },
    )

    let index = hit
    if (hit === -1) {
      slots.push({ key: nums[i], value: 0, state: 'filled' })
      index = slots.length - 1
    }
    slots[index].value++
    slots[index].state = 'filled'
    link = [i, index]
    tiles[i] = 'done'
    yield emit(
      OPTIMIZED_LINE.tally,
      'store',
      `${nums[i]} is now on ${slots[index].value}.`,
      'Write it back and this element is finished with, forever. By the end of the pass the map knows every count, having looked at each element once.',
      { ...base(), i, num: nums[i], count: slots[index].value },
    )
  }

  // The bucket pass, as one frame. `buckets[freq]` is an array indexed by a
  // COUNT, so reading it from the top down is the same ordering a sort would
  // have produced — reached without comparing two counts to each other.
  cursor = null
  probe = null
  link = null
  const ranked = slots
    .map((slot, order) => ({ slot, order }))
    .sort((a, b) => b.slot.value - a.slot.value || a.order - b.order)
    .map((entry) => entry.slot)
  slots.length = 0
  slots.push(...ranked)
  yield emit(
    OPTIMIZED_LINE.bucket,
    'store',
    `Every value dropped into the bucket named by its count, then read back from the top: ${formatTally(tally())}.`,
    'This is the step that replaces the sort. A count is at most n, so it can be an INDEX rather than something to compare — filling the buckets is one pass over the distinct values and reading them back is one pass over the buckets. No comparison, and no log n.',
    { ...base(), order: formatTally(tally()) },
  )

  const picked: number[] = []
  for (let index = 0; index < slots.length && picked.length < k; index++) {
    const slot = slots[index]
    picked.push(slot.key)
    slot.state = 'hit'
    probe = slot.key
    cursor = nums.indexOf(slot.key)
    link = [cursor, index]
    for (let t = 0; t < nums.length; t++) {
      if (nums[t] === slot.key) tiles[t] = 'match'
    }
    yield emit(
      OPTIMIZED_LINE.take,
      'match',
      `Take ${slot.key} — seen ${slot.value} time${slot.value === 1 ? '' : 's'}. ${picked.length} of ${k}.`,
      'The buckets are already in order, so taking the answer is just reading off the front. Nothing is searched for and nothing is compared.',
      { ...base(), num: slot.key, count: slot.value, picked: formatList(picked) },
    )
  }

  const repeats = slots.some((slot) => slot.value > 1)
  cursor = null
  probe = null
  link = null
  result = layoutAnswer(picked, nums, tiles, repeats)
  yield emit(
    OPTIMIZED_LINE.done,
    'return',
    doneNarration(picked, k),
    `Every element was read once and every distinct value was filed once — ${nums.length} lookups and ${slots.length} bucket drops, with no two counts ever compared. That is O(n) for a question that looks like it must be a ranking.`,
    { n: nums.length, k, counts: formatTally(tally()), result: formatList(picked) },
  )
}

// ---------------------------------------------------------------------------
// Sorted — sort the array, read off the runs, then rank the runs
// ---------------------------------------------------------------------------

/**
 * Sorts the array so equal values land next to each other, walks it once
 * turning each run into a (value, count) pair, then sorts those pairs by count
 * and takes the first k. `scene.slots` stays empty on every frame — this
 * approach buys its ranking with comparisons instead of a map, and the flat
 * view's tile-to-tile connector (drawn whenever `slots` is empty) links each
 * element to its predecessor, which is the only thing the sweep looks at.
 *
 * Note it sorts TWICE: once over the array to bring equal values together, and
 * once over the runs to rank them. The optimized tab pays neither — it counts
 * instead of sorting the array, and buckets instead of ranking the counts.
 *
 * Each sort is ONE frame. Animating a sort is its own problem, with its own
 * page; what matters here is what the reordering BUYS.
 */
export function* topKSorted(
  input: number[],
  k: number,
): Generator<ArrayMemoryFrame, void, undefined> {
  const nums = [...input]
  const tiles: TileState[] = nums.map(() => 'idle')
  const runs: { value: number; count: number }[] = []
  let cursor: number | null = null
  let link: [number, number] | null = null
  let result: [number, number] | null = null

  const emit = createEmitter<ArrayMemoryScene>(() => ({
    nums: [...nums],
    target: k,
    tiles: [...tiles],
    cursor,
    slots: [], // never fills — the whole point is that this costs no map
    probe: null, // nothing is ever looked up
    link: link === null ? null : [link[0], link[1]],
    result: result === null ? null : [result[0], result[1]],
  }))

  const base = () => ({ n: nums.length, k, runs: formatTally(runs) })

  yield emit(
    SORTED_LINE.init,
    'init',
    'Work on a copy — the answer never mentions a position, so the original order is not worth keeping.',
    'Two Sum could not do this: it has to return indices, so reordering destroys the answer. Here the answer is a set of VALUES, which makes the array free to rearrange.',
    base(),
  )

  nums.sort((a, b) => a - b)
  // Cursor only, no tile lit: the first element's own read frame is what lights
  // tile 0, and this frame must not pre-empt it into a duplicate scene.
  cursor = 0
  yield emit(
    SORTED_LINE.sort,
    'store',
    `Sorted: ${nums.join(', ')}.`,
    'Once the array is ordered, every count is a RUN of neighbours. Counting stops being a lookup and becomes "same as the one before me?", which needs nothing remembered at all.',
    { ...base(), order: nums.join(', ') },
  )

  for (let i = 0; i < nums.length; i++) {
    cursor = i
    link = null
    tiles[i] = 'active'
    yield emit(
      SORTED_LINE.read,
      'compare',
      `Take position ${i} — the value ${nums[i]}.`,
      'One pass, left to right. Nothing before position i - 1 is ever consulted again.',
      { ...base(), i, num: nums[i] },
    )

    const sameAsPrevious = i > 0 && nums[i] === nums[i - 1]
    link = i > 0 ? [i, i - 1] : null
    tiles[i] = 'done'

    if (sameAsPrevious) {
      runs[runs.length - 1].count++
      yield emit(
        SORTED_LINE.extend,
        'match',
        `Same as the one before it — ${nums[i]} is now on ${runs[runs.length - 1].count}.`,
        'The sort already put every copy of this value side by side; the walk only has to notice where one stops.',
        { ...base(), i, num: nums[i], count: runs[runs.length - 1].count },
      )
    } else {
      runs.push({ value: nums[i], count: 1 })
      yield emit(
        SORTED_LINE.start,
        'store',
        i === 0
          ? `${nums[i]} starts the first run.`
          : `Different from ${nums[i - 1]} — ${nums[i]} starts a new run.`,
        'A change of value in a sorted array is the end of a count, and there can never be another copy of the previous value further along.',
        { ...base(), i, num: nums[i] },
      )
    }
  }

  cursor = null
  link = null
  runs.sort((a, b) => b.count - a.count)
  yield emit(
    SORTED_LINE.rank,
    'store',
    `Runs ranked by length: ${formatTally(runs)}.`,
    'The second sort, and the one the optimized tab does not need. Comparing counts to each other costs O(d log d); dropping them into buckets indexed by the count costs O(d).',
    { ...base(), order: formatTally(runs) },
  )

  const picked = runs.slice(0, k).map((run) => run.value)
  const repeats = runs.some((run) => run.count > 1)
  result = layoutAnswer(picked, nums, tiles, repeats)
  yield emit(
    SORTED_LINE.done,
    'return',
    doneNarration(picked, k),
    'The same answer, and the shortest trace of the three — because the work that makes it short happened inside two sort frames, off screen. The comparisons are still there; they are just not steps you were shown.',
    { n: nums.length, k, runs: formatTally(runs), result: formatList(picked) },
  )
}

// ---------------------------------------------------------------------------
// Brute force — k rounds, each re-counting every candidate from scratch
// ---------------------------------------------------------------------------

/**
 * Takes k rounds. In each one it walks the array, and for every element not
 * already taken it counts that value by scanning the whole array again, keeping
 * the best it has seen. `scene.slots` is `[]` and `scene.probe` is null on every
 * frame — nothing is remembered between one candidate and the next, and that
 * absence is the entire point of the comparison with the optimized tab.
 *
 * Two beats per candidate: the cursor arrives, then the scan lights every
 * element sharing that value. The inner scan is ONE frame rather than n — at
 * n = 6 the per-comparison version is 72 steps for the same story, and the
 * count it is paying is carried in `vars.comparisons` instead.
 */
export function* topKBrute(
  input: number[],
  k: number,
): Generator<ArrayMemoryFrame, void, undefined> {
  const nums = [...input]
  const tiles: TileState[] = nums.map(() => 'idle')
  /** Where a tile returns to once it stops being the candidate under scan —
   *  'idle' until the array has looked at it, 'done' afterwards. */
  const resting: TileState[] = nums.map(() => 'idle')
  const picked: number[] = []
  let cursor: number | null = null
  let link: [number, number] | null = null
  let result: [number, number] | null = null
  let comparisons = 0
  let mostSeen = 0

  const emit = createEmitter<ArrayMemoryScene>(() => ({
    nums: [...nums],
    target: k,
    tiles: [...tiles],
    cursor,
    slots: [], // never fills — brute force has no memory structure
    probe: null, // nothing is ever looked up
    link: link === null ? null : [link[0], link[1]],
    result: result === null ? null : [result[0], result[1]],
  }))

  const base = () => ({
    n: nums.length,
    k,
    taken: formatList(picked),
    comparisons,
  })

  /** Everything that is not already part of the answer goes back to rest. */
  const settle = () => {
    for (let t = 0; t < tiles.length; t++) {
      if (tiles[t] !== 'match') tiles[t] = resting[t]
    }
  }

  yield emit(
    BRUTE_LINE.init,
    'init',
    'No map and no sorting. Each round finds the most frequent value still available by counting every candidate from scratch.',
    'With nothing written down, the only way to know how often a value occurs is to look at every element — and knowing that for one value says nothing about the next.',
    base(),
  )

  while (picked.length < k) {
    let best: number | null = null
    let bestCount = 0

    for (let i = 0; i < nums.length; i++) {
      if (picked.includes(nums[i])) continue

      settle()
      cursor = i
      link = null
      yield emit(
        BRUTE_LINE.read,
        'compare',
        `Candidate at ${i}: the value ${nums[i]}.`,
        'Nothing learned about an earlier candidate helps here, so every one of them starts from zero — including the ones that are copies of a value this round already counted.',
        { ...base(), i, num: nums[i] },
      )

      let count = 0
      let last = -1
      for (let j = 0; j < nums.length; j++) {
        comparisons++
        if (nums[j] !== nums[i]) continue
        count++
        if (j !== i) last = j
        if (tiles[j] !== 'match') {
          tiles[j] = 'active'
          resting[j] = 'done'
        }
      }
      link = last === -1 ? null : [i, last]

      const leads = count > bestCount
      if (leads) {
        best = nums[i]
        bestCount = count
      }
      mostSeen = Math.max(mostSeen, count)

      yield emit(
        BRUTE_LINE.scan,
        leads ? 'match' : 'compare',
        `${nums[i]} appears ${count} time${count === 1 ? '' : 's'}` +
          (leads ? ' — the round has a new leader.' : `; ${best} still leads on ${bestCount}.`),
        'One full pass of the array to learn one number. That pass happens again for the next candidate, and every round starts the whole thing over.',
        { ...base(), i, num: nums[i], count, leader: best, bestCount },
      )
    }

    settle()
    for (let t = 0; t < nums.length; t++) {
      if (nums[t] === best) tiles[t] = 'match'
    }
    cursor = nums.indexOf(best as number)
    link = null
    picked.push(best as number)
    yield emit(
      BRUTE_LINE.take,
      'match',
      `Round over — ${best} wins it on ${bestCount}. ${picked.length} of ${k}.`,
      'Exhausting every candidate is what proves this one is the most frequent, and it is also what makes the next round cost just as much as this one did.',
      { ...base(), num: best, count: bestCount },
    )
  }

  cursor = null
  link = null
  result = layoutAnswer(picked, nums, tiles, mostSeen > 1)
  yield emit(
    BRUTE_LINE.done,
    'return',
    doneNarration(picked, k),
    `The same answer as the other two, bought with ${comparisons} element comparisons where the map approach does ${nums.length} lookups and never compares anything.`,
    { n: nums.length, k, comparisons, result: formatList(picked) },
  )
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export const traceOptimized = (nums: number[], k: number): ArrayMemoryFrame[] => [
  ...topKOptimized(nums, k),
]

export const traceSorted = (nums: number[], k: number): ArrayMemoryFrame[] => [
  ...topKSorted(nums, k),
]

export const traceBrute = (nums: number[], k: number): ArrayMemoryFrame[] => [
  ...topKBrute(nums, k),
]

/** Tab order, left to right — best first, and the first entry is the default
 *  selection. `sorted` ships because the answer is a set of VALUES and never a
 *  position, so reordering the array destroys nothing. */
const TOP_K_APPROACHES = ['optimized', 'sorted', 'brute'] as const

export const traces: ProblemTraces<
  ArrayMemoryScene,
  (typeof TOP_K_APPROACHES)[number]
> = {
  example: `nums = [${EXAMPLE_NUMS.join(', ')}], k = ${EXAMPLE_K}`,
  approaches: TOP_K_APPROACHES,
  listings: {
    optimized: OPTIMIZED_LISTING,
    sorted: SORTED_LISTING,
    brute: BRUTE_LISTING,
  },
  cases: TEST_CASES,
  build: {
    optimized: (input) => traceOptimized(input.nums, kOf(input)),
    sorted: (input) => traceSorted(input.nums, kOf(input)),
    brute: (input) => traceBrute(input.nums, kOf(input)),
  },
}
