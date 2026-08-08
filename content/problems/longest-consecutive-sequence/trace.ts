/**
 * Longest Consecutive Sequence — build-time trace generators.
 *
 * Nothing here runs in the browser: scripts/build-traces.ts executes these
 * generators at build time, once per entry in TEST_CASES, and writes one
 * frames.<case>.<approach>.json per combination next to this file.
 *
 * ## Fitting the problem onto the shared scene
 *
 * The array is the whole input — there is no scalar, so `scene.target` is
 * unset and `chrome.formatArrayCaption` returns null. The memory wall (only
 * the optimized approach fills it) is a SET, not a map: `slot.key` is a value
 * from the array and `slot.value` is the index it was first seen at, which is
 * carried purely so the wall can point back at where a value came from — the
 * algorithm itself never reads it.
 *
 * ## Where the answer lives
 *
 * The answer is a single NUMBER — a run length — and `scene.result` is a tile
 * pair, so every approach ends the same way Top K and Product of Array Except
 * Self do: rewrite `nums` so the winning run's values sit at the front, in
 * ascending order, with everything else behind them, and report the SPAN that
 * covers (`[0, length - 1]`). That is legal because `scene.nums` is per frame
 * (G1 rule 4), and it means all three approaches — which discover the winning
 * run via different orderings, and may legitimately pick different ties —
 * report the exact same span once they finish, which is what makes `result`
 * comparable across them at all.
 *
 * Unlike a boolean problem, there is no "not found" branch here: every
 * non-empty array has SOME longest run (at minimum, one isolated element is a
 * run of length 1), so `result` is never null on a shipped frame and `found`
 * is always true for every case. The `no-answer` id is kept for consistency
 * with the rest of the family, but repurposed for what this problem's
 * equivalent of "nothing interesting happens" actually is: every value
 * isolated, so the longest run never exceeds 1. For the same reason, every
 * listing's terminal `return` line is reachable from EVERY case, not just
 * `no-answer` — there is no early-return branch anywhere in this problem, so
 * the usual "only no-answer reaches the final line" constraint does not apply.
 *
 * Three approaches, and the gap between the first two is the lesson: remember
 * every value and only ever start counting from a value with no predecessor
 * (optimized, O(n) — each value is visited a bounded number of times in
 * total), sort so a run becomes a run of NEIGHBOURS (sorted, O(n log n)), or
 * try every element as a start and grow it by re-scanning the whole array for
 * each next number (brute, O(n³)).
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
export const EXAMPLE_NUMS = [2, 20, 4, 10, 3, 4, 5]

// ---------------------------------------------------------------------------
// Playable inputs
// ---------------------------------------------------------------------------

/**
 * Four inputs, each reaching something the others don't:
 *   - `sample` has a duplicate (the set collapses it for free) and a run of
 *     four buried among several one-off values, so the wall fills, several
 *     candidates are correctly skipped as non-starts, and one genuinely walks.
 *   - `first-pair` is decided by the very FIRST candidate examined, and every
 *     later value only confirms it — the earliest a run can lock in the lead.
 *   - `late-answer` spends three candidates each briefly "in the lead" at
 *     length one before the real run — length three — turns up right at the
 *     end.
 *   - `no-answer` is this problem's version of nothing happening: every value
 *     is isolated (no two are neighbours), so the longest run never exceeds 1.
 *
 * No case's array is already in ascending order — the `sorted` approach
 * spends one frame on its sort, and an already-sorted input would make that
 * frame reorder nothing. `trace.test.ts` asserts it rather than trusting it.
 */
export const TEST_CASES: TestCase[] = [
  {
    id: 'sample',
    label: 'The walkthrough',
    nums: EXAMPLE_NUMS,
    note: 'A duplicate 4 collapses for free, and 2·3·4·5 is a run of four hiding among three loners.',
  },
  {
    id: 'first-pair',
    label: 'Decided immediately',
    nums: [50, 51, 52, 10, 11],
    note: 'The very first value tried is the start of the winning run, and nothing later overtakes it.',
  },
  {
    id: 'late-answer',
    label: 'Three short-lived leads',
    nums: [30, 40, 20, 1, 2, 3],
    note: 'Three isolated values each hold the lead at length one before a real run of three shows up last.',
  },
  {
    id: 'no-answer',
    label: 'Nothing is a neighbour',
    nums: [50, 10, 70, 30],
    note: 'Every gap is 20 or more, so no value is ever one more than another — the longest run is a single element.',
  },
]

// ---------------------------------------------------------------------------
// Canonical listings
// ---------------------------------------------------------------------------

/**
 * Every optimized frame's `line` is a 1-based index into this listing, and
 * nothing else. Per-language listings map onto it via Solution.lineMap.
 *
 * `numSet.add(num)` (line 4) is the active line for BOTH "already remembered"
 * and "new value" — the real `Set.add` does not branch on this either, it
 * just collapses a repeat for free. The same holds for line 10 (starting a
 * run or not) and line 13 (a step of the walk extending or stopping): one
 * line, two narrated outcomes, same precedent Contains Duplicate's SORTED
 * listing already sets for its own sort line.
 */
export const OPTIMIZED_LISTING = [
  'function longestConsecutive(nums) {', //  1
  '  const numSet = new Set()', //           2
  '  for (const num of nums) {', //          3
  '    numSet.add(num)', //                  4
  '  }', //                                  5
  '', //                                     6
  '  let longest = 0', //                    7
  '', //                                     8
  '  for (const num of numSet) {', //        9
  '    if (numSet.has(num - 1)) continue', //10
  '', //                                    11
  '    let length = 1', //                  12
  '    while (numSet.has(num + length)) length++', // 13
  '', //                                    14
  '    longest = Math.max(longest, length)', // 15
  '  }', //                                 16
  '', //                                    17
  '  return longest', //                    18
  '}', //                                   19
].join('\n')

/**
 * Active lines are 2 (init, and again for the reorder), 8, 10, 11 and 14.
 * Line 2 is active TWICE in a row at the start, same reasoning as Contains
 * Duplicate's own sorted listing: the second frame is the array physically
 * reordering, which a still diagram cannot show.
 */
export const SORTED_LISTING = [
  'function longestConsecutive(nums) {', //                                1
  '  const sorted = [...nums].sort((a, b) => a - b)', //                   2
  '', //                                                                   3
  '  let longest = 1', //                                                  4
  '  let current = 1', //                                                  5
  '', //                                                                   6
  '  for (let i = 1; i < sorted.length; i++) {', //                        7
  '    if (sorted[i] === sorted[i - 1]) continue', //                      8
  '', //                                                                   9
  '    current = sorted[i] === sorted[i - 1] + 1 ? current + 1 : 1', //   10
  '    longest = Math.max(longest, current)', //                         11
  '  }', //                                                               12
  '', //                                                                  13
  '  return longest', //                                                 14
  '}', //                                                                 15
].join('\n')

/**
 * Active lines are 2, 5, 8 and 13. Line 8's `while` is the active line for
 * BOTH an extending step and the step that stops the chain — the check and
 * its two outcomes are one line, same as every other reused-line listing in
 * this file.
 */
export const BRUTE_LISTING = [
  'function longestConsecutive(nums) {', //           1
  '  let longest = 0', //                             2
  '', //                                               3
  '  for (let i = 0; i < nums.length; i++) {', //     4
  '    let current = nums[i]', //                     5
  '    let length = 1', //                            6
  '', //                                               7
  '    while (nums.includes(current + 1)) {', //      8
  '      current++', //                               9
  '      length++', //                                10
  '    }', //                                        11
  '', //                                              12
  '    longest = Math.max(longest, length)', //      13
  '  }', //                                          14
  '', //                                              15
  '  return longest', //                             16
  '}', //                                            17
].join('\n')

const OPTIMIZED_LINE = {
  init: 2,
  read: 3,
  store: 4,
  start: 10,
  walk: 13,
  record: 15,
  done: 18,
} as const

const SORTED_LINE = {
  init: 2,
  sort: 2,
  dup: 8,
  step: 10,
  record: 11,
  done: 14,
} as const

const BRUTE_LINE = {
  init: 2,
  outer: 5,
  inner: 8,
  record: 13,
  done: 16,
} as const

// ---------------------------------------------------------------------------
// Shared machinery
// ---------------------------------------------------------------------------

/** `{ 4, 1, 9 }` — the set as the DOM variables panel shows it. Insertion
 *  order, matching the wall's slot order. */
const formatSet = (slots: ArrayMemoryScene['slots']): string =>
  slots.length === 0 ? '{}' : `{ ${slots.map((slot) => slot.key).join(', ')} }`

/**
 * The `return` itself: rewrites `nums` so the winning run's values — reading
 * `[bestStart, bestStart + length - 1]` — sit at the front, in ascending
 * order, with everything else behind them, and repaints the tiles against the
 * new layout. Returns the tile span the answer covers.
 *
 * Legal because `scene.nums` is per frame (G1 rule 4). Shared by all three
 * generators below so that, whatever order they discovered the winning run
 * in, they all report the exact same span at the end — the same move Top K
 * and Product of Array Except Self already make for their own multi-tile
 * answers.
 *
 * Mutates `nums` and `tiles` in place, so anything derived from the OLD
 * positions has to be computed first.
 */
function layoutAnswer(
  bestStart: number,
  length: number,
  nums: number[],
  tiles: TileState[],
): [number, number] {
  const used = new Set<number>()
  const front: number[] = []
  for (let offset = 0; offset < length; offset++) {
    const value = bestStart + offset
    const index = nums.findIndex((n, i) => n === value && !used.has(i))
    if (index === -1) continue
    front.push(index)
    used.add(index)
  }

  const back: number[] = []
  for (let i = 0; i < nums.length; i++) {
    if (!used.has(i)) back.push(i)
  }

  const order = [...front, ...back]
  const reordered = order.map((i) => nums[i])
  for (let i = 0; i < nums.length; i++) nums[i] = reordered[i]

  for (let i = 0; i < tiles.length; i++) {
    tiles[i] = i < front.length ? 'match' : 'done'
  }

  return [0, front.length - 1]
}

// ---------------------------------------------------------------------------
// Optimized — remember every value, then only ever start counting from a
// value with no predecessor
// ---------------------------------------------------------------------------

/**
 * Solves Longest Consecutive Sequence with a hash set, yielding a FULL state
 * snapshot at each meaningful point. This actually computes the answer — the
 * frames are a by-product of a real run, not a hand-authored script.
 *
 * Two phases. Phase 1 remembers every value (two beats per element, exactly
 * Contains Duplicate's own build loop, minus the early return — a repeat
 * collapses for free instead of ending the run). Phase 2 is the idea that
 * makes this O(n): only a value with NO predecessor in the set can be the
 * start of a run, and once that is true, every value is visited by a walk at
 * most once across the whole pass — so the total work across every walk,
 * summed, is still bounded by n.
 */
export function* longestConsecutiveOptimized(
  input: number[],
): Generator<ArrayMemoryFrame, void, undefined> {
  const nums = [...input]
  const tiles: TileState[] = nums.map(() => 'idle')
  const slots: { key: number; value: number; state: SlotState }[] = []
  let cursor: number | null = null
  let probe: number | null = null
  let link: [number, number] | null = null
  let result: [number, number] | null = null
  let longest = 0
  let bestStart = 0

  const emit = createEmitter<ArrayMemoryScene>(() => ({
    nums: [...nums],
    tiles: [...tiles],
    cursor,
    slots: slots.map((slot) => ({ ...slot })),
    probe,
    link: link === null ? null : [link[0], link[1]],
    result: result === null ? null : [result[0], result[1]],
  }))

  const base = () => ({ n: nums.length, seen: formatSet(slots), longest })

  yield emit(
    OPTIMIZED_LINE.init,
    'init',
    'An empty set, and one pass to fill it.',
    'A run can only be confirmed by asking whether specific neighbouring values exist, and a set answers "is this value present?" in one step no matter how large it grows.',
    base(),
  )

  // Phase 1 — remember every value, once. Exactly Contains Duplicate's build
  // loop, minus the early return: a repeat just collapses instead of ending
  // the run.
  for (let i = 0; i < nums.length; i++) {
    const num = nums[i]
    cursor = i
    probe = null
    link = null
    tiles[i] = 'active'
    yield emit(
      OPTIMIZED_LINE.read,
      'compare',
      `Take nums[${i}] = ${num}.`,
      'Every element is read exactly once here — the real work happens in the second pass, once the whole set is known.',
      { ...base(), i, num },
    )

    probe = num
    const hit = slots.findIndex((slot) => slot.key === num)
    if (hit !== -1) {
      link = [i, hit]
      tiles[i] = 'done'
      yield emit(
        OPTIMIZED_LINE.store,
        'compare',
        `${num} is already remembered.`,
        'A repeated value adds nothing new to the set — it collapses for free.',
        { ...base(), i, num, found: true },
      )
      continue
    }

    link = null
    slots.push({ key: num, value: i, state: 'filled' })
    tiles[i] = 'done'
    yield emit(
      OPTIMIZED_LINE.store,
      'store',
      `New value. Remember ${num}.`,
      'Order does not matter here, only membership — which is exactly what a set is for.',
      { ...base(), i, num, found: false },
    )
  }

  // Phase 2 — for each remembered value, check whether it starts a run.
  cursor = null
  probe = null
  link = null
  for (const slot of slots) {
    const num = slot.key
    const tileIndex = slot.value

    cursor = tileIndex
    probe = num - 1
    const predecessor = slots.findIndex((s) => s.key === probe)
    link = predecessor === -1 ? null : [tileIndex, predecessor]
    tiles[tileIndex] = 'active'

    if (predecessor !== -1) {
      yield emit(
        OPTIMIZED_LINE.start,
        'compare',
        `${num - 1} is already remembered, so ${num} cannot start a run.`,
        'Every consecutive run has exactly one value with no predecessor in the set — checking for it is what stops the same run being counted more than once.',
        { ...base(), num, isStart: false },
      )
      tiles[tileIndex] = 'done'
      continue
    }

    yield emit(
      OPTIMIZED_LINE.start,
      'compare',
      `${num - 1} is not remembered — ${num} starts a run.`,
      'This is the one check brute force never makes: it tries every element as a start, even the ones already in the middle of a run.',
      { ...base(), num, isStart: true },
    )

    let length = 1
    let reach = num
    while (true) {
      probe = reach + 1
      const next = slots.findIndex((s) => s.key === probe)
      link = next === -1 ? null : [tileIndex, next]
      if (next === -1) {
        yield emit(
          OPTIMIZED_LINE.walk,
          'compare',
          `${reach + 1} is not remembered. The run from ${num} stops at length ${length}.`,
          'Each check costs one lookup, so a run of length L is confirmed in L steps — not the L full-array scans brute force needs.',
          { ...base(), num, length },
        )
        break
      }
      reach++
      length++
      yield emit(
        OPTIMIZED_LINE.walk,
        'compare',
        `${reach} is remembered. The run from ${num} is now length ${length}.`,
        'Each check costs one lookup, so a run of length L is confirmed in L steps — not the L full-array scans brute force needs.',
        { ...base(), num, length },
      )
    }

    if (length > longest) {
      longest = length
      bestStart = num
      // A transient marker of the current leader — overwritten wholesale by
      // layoutAnswer's real span at the very end. Without SOME scene change
      // here, a record frame right after a single-step walk would be
      // scene-identical to the walk's own "stops here" frame (F1 rule 1).
      result = [tileIndex, tileIndex]
      yield emit(
        OPTIMIZED_LINE.record,
        'match',
        `${length} beats the previous best. New longest run: ${length}, starting at ${num}.`,
        'The record is kept as a plain number — there is no need to remember which values formed it until the very end.',
        { ...base(), num, length },
      )
    }

    cursor = tileIndex
    tiles[tileIndex] = 'done'
  }

  cursor = null
  probe = null
  link = null
  result = layoutAnswer(bestStart, longest, nums, tiles)
  yield emit(
    OPTIMIZED_LINE.done,
    'return',
    `The longest run has length ${longest}, starting at ${bestStart}.`,
    'Every value was written down once and looked up a bounded number of times — once as a candidate and once per step of the run it belongs to. Summed over the whole array that is O(n), against brute force’s O(n³).',
    { n: nums.length, longest, result: `${longest}` },
  )
}

// ---------------------------------------------------------------------------
// Sorted — put the whole array in order, so a run becomes a run of neighbours
// ---------------------------------------------------------------------------

/**
 * Sorts a copy, then walks it once comparing each element with the one before
 * it. `scene.slots` stays empty on every frame — this approach buys its
 * answer with a sort instead of a hash set.
 *
 * `scene.nums` CHANGES on the second frame, same as Contains Duplicate's own
 * sorted generator: the array physically reorders, and that reorder is the
 * step the frame exists to show.
 */
export function* longestConsecutiveSorted(
  input: number[],
): Generator<ArrayMemoryFrame, void, undefined> {
  const nums = [...input]
  const tiles: TileState[] = nums.map(() => 'idle')
  let cursor: number | null = null
  let link: [number, number] | null = null
  let result: [number, number] | null = null
  let longest = 1
  let current = 1
  let bestStart = nums[0]

  const emit = createEmitter<ArrayMemoryScene>(() => ({
    nums: [...nums],
    tiles: [...tiles],
    cursor,
    slots: [], // never fills — this approach costs a sort, not a set
    probe: null, // nothing is ever looked up
    link: link === null ? null : [link[0], link[1]],
    result: result === null ? null : [result[0], result[1]],
  }))

  const base = () => ({ n: nums.length, longest, current })

  yield emit(
    SORTED_LINE.init,
    'init',
    'The numbers as they arrived, in no particular order.',
    'A run can be scattered anywhere in here. Sorting turns "is this value one more than some other value in the array" into "is this value one more than the one right beside it".',
    base(),
  )

  // The sort itself, as one frame. Deliberately not animated step by step:
  // the lesson is what sorting BUYS, not how a sort works.
  nums.sort((a, b) => a - b)
  cursor = 0
  tiles[0] = 'active'
  bestStart = nums[0]
  yield emit(
    SORTED_LINE.sort,
    'store',
    `Sorted: ${nums.join(', ')}.`,
    'Once ordered, a run of consecutive values is a run of NEIGHBOURS — walking left to right and comparing each value with the one before it is now enough.',
    { ...base(), sorted: nums.join(', ') },
  )

  for (let i = 1; i < nums.length; i++) {
    for (let k = 0; k < tiles.length; k++) {
      if (k < i - 1) tiles[k] = 'done'
      else if (k === i - 1 || k === i) tiles[k] = 'active'
      else tiles[k] = 'idle'
    }
    cursor = i
    link = [i - 1, i]

    if (nums[i] === nums[i - 1]) {
      yield emit(
        SORTED_LINE.dup,
        'compare',
        `${nums[i]} repeats — skip it, it can neither start nor extend a run of DISTINCT values.`,
        'A duplicate is already a neighbour of itself after the sort, so skipping it costs nothing and loses nothing.',
        { ...base(), i, previous: nums[i - 1], current: nums[i] },
      )
      continue
    }

    if (nums[i] === nums[i - 1] + 1) {
      current++
      yield emit(
        SORTED_LINE.step,
        'match',
        `${nums[i]} is one more than ${nums[i - 1]} — the run extends to ${current}.`,
        'A sorted array turns "is this the next number in the sequence" into a single comparison with a neighbour.',
        { ...base(), i, previous: nums[i - 1], current: nums[i], run: current },
      )
    } else {
      current = 1
      yield emit(
        SORTED_LINE.step,
        'compare',
        `${nums[i]} is not one more than ${nums[i - 1]} — a new run starts here, at length 1.`,
        'The gap breaks the chain for good: nothing later can extend a run that already ended, because the array is sorted and can only move forward.',
        { ...base(), i, previous: nums[i - 1], current: nums[i], run: current },
      )
    }

    if (current > longest) {
      longest = current
      bestStart = nums[i] - current + 1
      // Transient leader marker — see the optimized generator's own comment.
      result = [i, i]
      yield emit(
        SORTED_LINE.record,
        'match',
        `${current} beats the previous best. New longest run: ${current}, starting at ${bestStart}.`,
        'The record is kept as a plain number — there is no need to remember which run holds it until the very end.',
        { ...base(), i, longest, bestStart },
      )
    }
  }

  cursor = null
  link = null
  result = layoutAnswer(bestStart, longest, nums, tiles)
  yield emit(
    SORTED_LINE.done,
    'return',
    `The longest run has length ${longest}, starting at ${bestStart}.`,
    'The sort costs O(n log n) up front; the walk after it is a single O(n) pass with no lookups at all — cheaper per step than the optimized approach, just not cheaper overall.',
    { n: nums.length, longest, result: `${longest}` },
  )
}

// ---------------------------------------------------------------------------
// Brute force — every element as a possible start, each one grown by
// re-scanning the whole array
// ---------------------------------------------------------------------------

/**
 * The same problem with nothing remembered and nothing sorted. `scene.slots`
 * is `[]` on every frame and `scene.probe` is always null — there is no wall
 * to raise, and no set to check membership against.
 *
 * Every element is tried as a possible start (unlike the optimized approach,
 * which skips anything that is provably NOT a start), and each one is grown
 * by asking, one number at a time, "is this anywhere in the array?" — a full
 * linear scan per question. One frame per question, so the cost accumulates
 * on screen rather than being summarised away.
 */
export function* longestConsecutiveBrute(
  input: number[],
): Generator<ArrayMemoryFrame, void, undefined> {
  const nums = [...input]
  const tiles: TileState[] = nums.map(() => 'idle')
  let cursor: number | null = null
  let link: [number, number] | null = null
  let result: [number, number] | null = null
  let longest = 0
  let bestStart = 0
  let comparisons = 0

  const emit = createEmitter<ArrayMemoryScene>(() => ({
    nums: [...nums],
    tiles: [...tiles],
    cursor,
    slots: [], // never fills — brute force has no memory structure
    probe: null, // nothing is ever looked up
    link: link === null ? null : [link[0], link[1]],
    result: result === null ? null : [result[0], result[1]],
  }))

  const base = () => ({ n: nums.length, comparisons, longest })

  yield emit(
    BRUTE_LINE.init,
    'init',
    'No memory, no order. Every element is tried as a possible start, and each one is grown by scanning the whole array again for the next number.',
    'With nothing written down, the only way to know whether a value is present is to look at every element — and knowing that for one value says nothing about the next.',
    base(),
  )

  for (let i = 0; i < nums.length; i++) {
    for (let k = 0; k < tiles.length; k++) {
      if (k < i) tiles[k] = 'done'
      else if (k === i) tiles[k] = 'active'
      else tiles[k] = 'idle'
    }
    cursor = i
    link = null

    let current = nums[i]
    let length = 1
    let next = nums.indexOf(current + 1)
    comparisons += next === -1 ? nums.length : next + 1

    if (next === -1) {
      // Nothing to extend to at all — fold the arrival and the (only) check
      // into ONE frame. A separate "stops at length 1" frame right after
      // arrival would have nothing new to show: cursor and link would both
      // be exactly what the arrival frame already set (F1 rule 1).
      yield emit(
        BRUTE_LINE.outer,
        'compare',
        `Try starting at nums[${i}] = ${nums[i]} — ${current + 1} is nowhere in the array, so the chain stops at length 1.`,
        'There is no way to tell, without scanning, whether this element is truly the start of a run or already the middle of one — so every element gets tried, and confirming absence costs a full scan just like confirming presence.',
        { ...base(), i, current, length },
      )
    } else {
      yield emit(
        BRUTE_LINE.outer,
        'compare',
        `Try starting at nums[${i}] = ${nums[i]}.`,
        'There is no way to tell, without scanning, whether this element is truly the start of a run or already the middle of one — so every element gets tried.',
        { ...base(), i, num: nums[i] },
      )

      while (next !== -1) {
        link = [i, next]
        tiles[next] = 'active'
        current++
        length++
        yield emit(
          BRUTE_LINE.inner,
          'compare',
          `${current} is at index ${next}. The chain from ${nums[i]} is now length ${length}.`,
          'Every step re-scans the ENTIRE array for one more number — the same cost whether this is the first check or the tenth.',
          { ...base(), i, current, length },
        )
        next = nums.indexOf(current + 1)
        comparisons += next === -1 ? nums.length : next + 1
      }

      link = null
      yield emit(
        BRUTE_LINE.inner,
        'compare',
        `${current + 1} is nowhere in the array. The chain from ${nums[i]} stops at length ${length}.`,
        'Confirming absence costs a full scan, exactly like confirming presence — there is no faster way to ask either question here.',
        { ...base(), i, current, length },
      )
    }

    if (length > longest) {
      longest = length
      bestStart = nums[i]
      // Transient leader marker — see the optimized generator's own comment.
      result = [i, i]
      yield emit(
        BRUTE_LINE.record,
        'match',
        `${length} beats the previous best. New longest run: ${length}, starting at ${nums[i]}.`,
        'Nothing here is cheaper for having already scanned index i − 1 — every candidate restarts the search from nothing.',
        { ...base(), i, num: nums[i], length },
      )
    }
  }

  cursor = null
  link = null
  result = layoutAnswer(bestStart, longest, nums, tiles)
  yield emit(
    BRUTE_LINE.done,
    'return',
    `The longest run has length ${longest}, starting at ${bestStart}.`,
    `Every element re-triggers its own linear scan for every step of its own chain — up to n starts, each up to n steps long, each step an O(n) scan. That is O(n³) in the worst case, against the optimized approach's O(n).`,
    { n: nums.length, comparisons, longest, result: `${longest}` },
  )
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export const traceOptimized = (nums: number[]): ArrayMemoryFrame[] => [
  ...longestConsecutiveOptimized(nums),
]

export const traceSorted = (nums: number[]): ArrayMemoryFrame[] => [
  ...longestConsecutiveSorted(nums),
]

export const traceBrute = (nums: number[]): ArrayMemoryFrame[] => [
  ...longestConsecutiveBrute(nums),
]

/** Tab order, left to right — best first, and the first entry is the default
 *  selection. All three ship: the answer is a plain LENGTH, never a position,
 *  so sorting destroys nothing (the same freedom Top K's values-only answer
 *  has, and Two Sum's index-pair answer does not). */
const LONGEST_CONSECUTIVE_SEQUENCE_APPROACHES = [
  'optimized',
  'sorted',
  'brute',
] as const

export const traces: ProblemTraces<
  ArrayMemoryScene,
  (typeof LONGEST_CONSECUTIVE_SEQUENCE_APPROACHES)[number]
> = {
  example: `nums = [${EXAMPLE_NUMS.join(', ')}]`,
  approaches: LONGEST_CONSECUTIVE_SEQUENCE_APPROACHES,
  listings: {
    optimized: OPTIMIZED_LISTING,
    sorted: SORTED_LISTING,
    brute: BRUTE_LISTING,
  },
  cases: TEST_CASES,
  build: {
    optimized: (input) => traceOptimized(input.nums),
    sorted: (input) => traceSorted(input.nums),
    brute: (input) => traceBrute(input.nums),
  },
}
