/**
 * Contains Duplicate — build-time trace generators.
 *
 * Nothing here runs in the browser: scripts/build-traces.ts executes these
 * generators at build time, once per entry in TEST_CASES, and writes one
 * frames.<case>.<approach>.json per combination next to this file.
 *
 * THREE approaches, where Two Sum has two. The extra one is the whole reason
 * this problem is worth building second: Contains Duplicate is the smallest
 * problem where sorting is a genuinely reasonable answer, because the question
 * is about the VALUES and not about where they sit. Two Sum has to return
 * indices, which a sort destroys — so it gets no such tab (see its trace.ts).
 *
 * The three read as one argument, left to right on the tab strip:
 *   optimized  remember everything, look each number up once   O(n)      / O(n)
 *   sorted     put twins next to each other, then walk once    O(n log n)/ O(1)
 *   brute      no memory, no order — try every pair            O(n²)     / O(1)
 *
 * `result` is a PAIR OF INDICES on every approach even though the answer is a
 * boolean: the pair is what the scene lights up, and `result !== null` is the
 * boolean (lib/types.ts). For `sorted` those indices are positions in the
 * SORTED array, which is exactly what the viewer is looking at by then.
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
export const EXAMPLE_NUMS = [4, 1, 9, 7, 3, 9]

// ---------------------------------------------------------------------------
// Playable inputs
// ---------------------------------------------------------------------------

/**
 * Every input the player can switch between. All four are generated at build
 * time by the same generators below — nothing here is ever run in the browser.
 *
 * The first entry is the default. It is chosen so that all three approaches
 * have something to show: the set fills to five entries before the duplicate
 * lands, brute force gets three full inner passes, and the sort visibly
 * reorders the row (`[4, 1, 9, 7, 3, 9]` -> `[1, 3, 4, 7, 9, 9]`).
 *
 * The other three cover the branches the headline case never reaches:
 *   - `first-pair` duplicates on the very second element,
 *   - `late-answer` puts the twins at opposite ends, which is brute force's
 *     LUCKY case (its first anchor finds it) and the set's worst,
 *   - `no-answer` is the only case that reaches any listing's final
 *     `return false`.
 *
 * Two constraints on any case added here:
 *
 *  1. Every case must contain values whose sort ACTUALLY REORDERS them.
 *     The sorted trace's second frame is the sort itself, and a frame that
 *     changes nothing is exactly what F1 forbids. (The frame also moves the
 *     cursor, so an already-sorted input would not crash — but it would be a
 *     dead step, which is worse.)
 *  2. No value may repeat more than once before the answer is found. The
 *     optimized trace pushes one slot per distinct value and both FlatView and
 *     LabelLayer key slots by that value, so a second slot with the same key
 *     would collide as a React key. In practice this is automatic: the trace
 *     RETURNS on the first repeat, so it can never store one twice.
 */
export const TEST_CASES: TestCase[] = [
  {
    id: 'sample',
    label: 'The walkthrough',
    nums: EXAMPLE_NUMS,
    note: 'Five numbers get remembered before the sixth turns out to be a repeat.',
  },
  {
    id: 'first-pair',
    label: 'Repeat straight away',
    // Not [3, 3, 5, 7]: that is ALREADY sorted, so the sorted trace's sort
    // frame would reorder nothing and read as a dead step. See constraint 1.
    nums: [5, 5, 9, 2],
    note: 'The first two numbers are the same — one lookup and it is over.',
  },
  {
    id: 'late-answer',
    label: 'Twins at both ends',
    nums: [22, 14, 18, 2, 22],
    note: 'The repeat is the first and last number, which is brute force at its luckiest.',
  },
  {
    id: 'no-answer',
    label: 'All different',
    nums: [5, 2, 8, 1],
    note: 'Nothing repeats, so every approach runs to the end and returns false.',
  },
]

// ---------------------------------------------------------------------------
// Canonical listings
// ---------------------------------------------------------------------------

/**
 * Every optimized frame's `line` is a 1-based index into this listing, and
 * nothing else. Per-language listings map onto it via Solution.lineMap (F14).
 *
 * Active lines are 2, 4, 5, 6, 9 and 12. The rest are structural — they have
 * no state change to narrate, so they are never an active line.
 *
 * Note there is no separate "compute the thing we are looking for" step, which
 * Two Sum needs for its complement. Here the number IS the question, and that
 * absence is the point: this is the simplest possible use of a hash set.
 */
export const OPTIMIZED_LISTING = [
  'function containsDuplicate(nums) {', //   1
  '  const seen = new Set()', //             2
  '', //                                     3
  '  for (const num of nums) {', //          4
  '    if (seen.has(num)) {', //             5
  '      return true', //                    6
  '    }', //                                7
  '', //                                     8
  '    seen.add(num)', //                    9
  '  }', //                                 10
  '', //                                    11
  '  return false', //                      12
  '}', //                                   13
].join('\n')

/**
 * Active lines are 2, 5, 6 and 10.
 *
 * Line 2 is active TWICE in a row at the start — once before the sort has run
 * and once after. That is not a wasted step: the second frame is the array
 * physically reordering, which is the entire idea of this approach and the one
 * thing a still diagram cannot show.
 */
export const SORTED_LISTING = [
  'function containsDuplicate(nums) {', //                  1
  '  const sorted = [...nums].sort((a, b) => a - b)', //    2
  '', //                                                    3
  '  for (let i = 1; i < sorted.length; i++) {', //         4
  '    if (sorted[i] === sorted[i - 1]) {', //              5
  '      return true', //                                   6
  '    }', //                                               7
  '  }', //                                                 8
  '', //                                                    9
  '  return false', //                                     10
  '}', //                                                  11
].join('\n')

/**
 * Active lines are 2, 4, 5 and 10. Line 3 (the inner loop header) is
 * deliberately never active: picking `j` and comparing the pair are one beat,
 * and splitting them would produce two frames with an identical scene.
 */
export const BRUTE_LISTING = [
  'function containsDuplicate(nums) {', //              1
  '  for (let i = 0; i < nums.length; i++) {', //       2
  '    for (let j = i + 1; j < nums.length; j++) {', // 3
  '      if (nums[i] === nums[j]) {', //                4
  '        return true', //                             5
  '      }', //                                         6
  '    }', //                                           7
  '  }', //                                             8
  '', //                                                9
  '  return false', //                                 10
  '}', //                                              11
].join('\n')

const OPTIMIZED_LINE = {
  init: 2,
  read: 4,
  probe: 5,
  found: 6,
  store: 9,
  exhausted: 12,
} as const

const SORTED_LINE = {
  init: 2,
  sort: 2,
  compare: 5,
  found: 6,
  exhausted: 10,
} as const

const BRUTE_LINE = {
  outer: 2,
  compare: 4,
  found: 5,
  exhausted: 10,
} as const

/** `{ 4, 1, 9 }` — the set as the DOM variables panel shows it. Insertion
 *  order, matching the wall's slot order. */
const formatSet = (slots: ArrayMemoryScene['slots']): string =>
  slots.length === 0 ? '{}' : `{ ${slots.map((slot) => slot.key).join(', ')} }`

// ---------------------------------------------------------------------------
// Optimized — one pass, one hash set
// ---------------------------------------------------------------------------

/**
 * Solves Contains Duplicate with a hash set, yielding a FULL state snapshot at
 * each meaningful point. This actually computes the answer — the frames are a
 * by-product of a real run, not a hand-authored script.
 *
 * The set's slots carry `value = the index the key was first seen at`. A set
 * has no values of its own, but the index is what lets the answer frame point
 * at the ORIGINAL sighting rather than just announcing a repeat, and it costs
 * the trace nothing to remember.
 */
export function* containsDuplicateOptimized(
  nums: number[],
): Generator<ArrayMemoryFrame, void, undefined> {
  const tiles: TileState[] = nums.map(() => 'idle')
  const slots: { key: number; value: number; state: SlotState }[] = []
  let cursor: number | null = null
  let probe: number | null = null
  let link: [number, number] | null = null
  let result: [number, number] | null = null
  let lookups = 0

  const emit = createEmitter<ArrayMemoryScene>(() => ({
    nums: [...nums],
    tiles: [...tiles],
    cursor,
    slots: slots.map((slot) => ({ ...slot })),
    probe,
    link: link === null ? null : [link[0], link[1]],
    result: result === null ? null : [result[0], result[1]],
  }))

  const base = () => ({ n: nums.length, seen: formatSet(slots), lookups })

  yield emit(
    OPTIMIZED_LINE.init,
    'init',
    'An empty set, and one pass to fill it.',
    'The question is only ever "have I seen this before?" — and a set answers exactly that, in one step, no matter how much it already holds.',
    base(),
  )

  for (let i = 0; i < nums.length; i++) {
    const num = nums[i]

    // A new element takes the stage: drop last iteration's beam and question.
    cursor = null
    probe = null
    link = null
    tiles[i] = 'active'
    yield emit(
      OPTIMIZED_LINE.read,
      'compare',
      `Pick up ${num}.`,
      'Each element is touched exactly once. There is no inner loop to fall into, because everything already seen is behind us in the set.',
      { ...base(), i, num },
    )

    const hit = slots.findIndex((slot) => slot.key === num)
    lookups++
    probe = num

    if (hit === -1) {
      link = null
      yield emit(
        OPTIMIZED_LINE.probe,
        'compare',
        slots.length === 0
          ? `Have we seen ${num}? The set is empty, so no.`
          : `Have we seen ${num}? Not in the set.`,
        'One hash lookup, O(1). This single step stands in for the whole of brute force’s inner loop.',
        { ...base(), i, num, found: false },
      )

      slots.push({ key: num, value: i, state: 'filled' })
      tiles[i] = 'done'
      yield emit(
        OPTIMIZED_LINE.store,
        'store',
        `New number. Remember ${num}.`,
        'Unlike Two Sum there is nothing to look up later BY — we only ever ask whether a number is present, so the number itself is the whole entry.',
        { ...base(), i, num, found: false },
      )
      continue
    }

    const first = slots[hit].value
    slots[hit].state = 'probed'
    link = [i, hit]
    yield emit(
      OPTIMIZED_LINE.probe,
      'match',
      `Have we seen ${num}? Yes — back at index ${first}.`,
      'Found by remembering, not by searching. That lookup would have cost the same if the array held six million numbers.',
      { ...base(), i, num, found: true },
    )

    slots[hit].state = 'hit'
    tiles[first] = 'match'
    tiles[i] = 'match'
    result = [first, i]
    yield emit(
      OPTIMIZED_LINE.found,
      'return',
      `${num} at index ${first} and again at ${i}. Return true.`,
      `Answered in ${lookups} lookups, and we can stop the moment we know — there is nothing left to prove once a single repeat exists.`,
      { ...base(), i, num, found: true, result: 'true' },
    )
    return
  }

  cursor = null
  probe = null
  link = null
  yield emit(
    OPTIMIZED_LINE.exhausted,
    'return',
    'Every number was new. Return false.',
    'Proving the negative costs a full pass here, but only one: each number had to be checked against everything before it, and the set did all of those checks at once.',
    { ...base(), result: 'false' },
  )
}

// ---------------------------------------------------------------------------
// Sorted — put twins side by side, then walk once
// ---------------------------------------------------------------------------

/**
 * Sorts a copy, then compares each element with the one before it.
 *
 * `scene.nums` CHANGES on the second frame — this is the one generator in the
 * codebase that reorders the array mid-trace, and the reason lib/types.ts
 * documents `nums` as per-frame rather than constant. Everything downstream
 * already handles it: the flat view re-derives its row from the current frame,
 * the label layer takes per-frame values, and the 3D scene never reads a value
 * at all (only the length, which sorting does not change).
 *
 * `scene.slots` stays empty on every frame, which is the entire argument for
 * this approach: it answers the same question in O(1) extra space.
 */
export function* containsDuplicateSorted(
  input: number[],
): Generator<ArrayMemoryFrame, void, undefined> {
  const nums = [...input]
  const tiles: TileState[] = nums.map(() => 'idle')
  let cursor: number | null = null
  let link: [number, number] | null = null
  let result: [number, number] | null = null
  let comparisons = 0

  const emit = createEmitter<ArrayMemoryScene>(() => ({
    nums: [...nums],
    tiles: [...tiles],
    cursor,
    slots: [], // never fills — the whole point is that this costs O(1) space
    probe: null, // nothing is ever looked up
    link: link === null ? null : [link[0], link[1]],
    result: result === null ? null : [result[0], result[1]],
  }))

  const base = () => ({ n: nums.length, comparisons })

  yield emit(
    SORTED_LINE.init,
    'init',
    'The numbers as they arrived, in no particular order.',
    'A duplicate can be anywhere in here, which is why brute force has to try every pair. But that is only true because the array is unordered — and that is something we can change.',
    base(),
  )

  // The sort itself, as one frame. Deliberately not animated step by step: the
  // lesson is what sorting BUYS, not how a sort works — that is its own
  // problem, with its own page.
  nums.sort((a, b) => a - b)
  tiles[0] = 'active'
  cursor = 0
  yield emit(
    SORTED_LINE.sort,
    'store',
    'Sorted. Now any repeat has to be sitting next to its twin.',
    'This is the trade: O(n log n) up front, in exchange for never needing to remember anything. Equal numbers cannot end up apart once the row is in order, so checking neighbours is enough.',
    { ...base(), sorted: `[${nums.join(', ')}]` },
  )

  for (let i = 1; i < nums.length; i++) {
    const previous = nums[i - 1]
    const current = nums[i]

    for (let k = 0; k < tiles.length; k++) {
      if (k < i - 1) tiles[k] = 'done'
      else if (k === i - 1 || k === i) tiles[k] = 'active'
      else tiles[k] = 'idle'
    }
    cursor = i
    link = [i - 1, i]
    comparisons++

    if (previous !== current) {
      yield emit(
        SORTED_LINE.compare,
        'compare',
        `${previous} then ${current}. Different, so move on.`,
        'One comparison per element, and never a backward glance — anything equal to this number would already have been the one before it.',
        { ...base(), i, previous, current, found: false },
      )
      continue
    }

    yield emit(
      SORTED_LINE.compare,
      'match',
      `${previous} then ${current}. The same number, twice in a row.`,
      'Sorting turned "is this value anywhere else in the array" into "is it immediately to my left" — the same question, asked somewhere much cheaper.',
      { ...base(), i, previous, current, found: true },
    )

    tiles[i - 1] = 'match'
    tiles[i] = 'match'
    result = [i - 1, i]
    yield emit(
      SORTED_LINE.found,
      'return',
      `Return true. (Positions ${i - 1} and ${i} of the SORTED row.)`,
      'The answer is a yes/no, so losing track of where the numbers originally sat costs nothing. That is precisely the freedom Two Sum does not have — it has to report indices, so it can never sort.',
      { ...base(), i, previous, current, found: true, result: 'true' },
    )
    return
  }

  for (let k = 0; k < tiles.length; k++) tiles[k] = 'done'
  cursor = null
  link = null
  yield emit(
    SORTED_LINE.exhausted,
    'return',
    'Every neighbour differed. Return false.',
    `${comparisons} comparisons after the sort — the walk is the cheap part. The sort is what this approach actually costs, and it is why the hash set still wins on time.`,
    { ...base(), result: 'false' },
  )
}

// ---------------------------------------------------------------------------
// Brute force — every pair, no memory, no order
// ---------------------------------------------------------------------------

/**
 * The same problem with nothing remembered and nothing rearranged.
 * `scene.slots` is `[]` on every frame and `scene.probe` is always null: there
 * is no wall to raise and no key to look up, and that absence is the entire
 * point of the comparison.
 *
 * One frame per comparison. The cost is not summarised anywhere — you watch it
 * accumulate.
 */
export function* containsDuplicateBrute(
  nums: number[],
): Generator<ArrayMemoryFrame, void, undefined> {
  const tiles: TileState[] = nums.map(() => 'idle')
  let cursor: number | null = null
  let link: [number, number] | null = null
  let result: [number, number] | null = null
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

  const base = () => ({ n: nums.length, comparisons })

  yield emit(
    BRUTE_LINE.outer,
    'init',
    'Nothing remembered, nothing sorted. Every pair, checked by hand.',
    'With no memory and no order, the only way to know a number is unique is to compare it against every other one. Watch the work accumulate.',
    base(),
  )

  for (let i = 0; i < nums.length - 1; i++) {
    const a = nums[i]

    // Everything left of the anchor is finished; everything right of it is
    // fair game again, because brute force never carries anything forward.
    for (let k = 0; k < tiles.length; k++) {
      if (k < i) tiles[k] = 'done'
      else if (k === i) tiles[k] = 'active'
      else tiles[k] = 'idle'
    }
    cursor = i
    link = null
    yield emit(
      BRUTE_LINE.outer,
      'compare',
      `Anchor on ${a}, at index ${i}.`,
      'The inner loop starts one step past the anchor and never looks back — every pair to the left has already been tried. That is why each pass is shorter than the last.',
      { ...base(), i, a },
    )

    let previousJ: number | null = null

    for (let j = i + 1; j < nums.length; j++) {
      const b = nums[j]

      if (previousJ !== null) tiles[previousJ] = 'idle'
      tiles[j] = 'active'
      link = [i, j]
      comparisons++

      if (a !== b) {
        yield emit(
          BRUTE_LINE.compare,
          'compare',
          `${a} against ${b}. Different.`,
          'One comparison, one step. There is no lookup to hide the cost in — the set spends a single frame where this spends an entire inner loop.',
          { ...base(), i, j, a, b, found: false },
        )
        previousJ = j
        continue
      }

      yield emit(
        BRUTE_LINE.compare,
        'match',
        `${a} against ${b}. The same number.`,
        `Found by exhaustion rather than by memory — ${comparisons} comparisons to get here. On six numbers that is barely a difference. On six million it is the difference between an answer and a hung tab.`,
        { ...base(), i, j, a, b, found: true },
      )

      tiles[i] = 'match'
      tiles[j] = 'match'
      result = [i, j]
      yield emit(
        BRUTE_LINE.found,
        'return',
        `Return true. Indices ${i} and ${j} hold the same value.`,
        'The same answer the other two approaches reach — it was never in doubt. What differs is how much work it took to become certain of it.',
        { ...base(), i, j, a, b, found: true, result: 'true' },
      )
      return
    }
  }

  for (let k = 0; k < tiles.length; k++) tiles[k] = 'done'
  cursor = null
  link = null
  yield emit(
    BRUTE_LINE.exhausted,
    'return',
    'Every pair checked. Nothing repeats, so return false.',
    `Proving the negative costs the full n(n-1)/2 — ${comparisons} comparisons, with nothing learned along the way that would let us stop early.`,
    { ...base(), result: 'false' },
  )
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export const traceOptimized = (nums: number[]): ArrayMemoryFrame[] => [
  ...containsDuplicateOptimized(nums),
]

export const traceSorted = (nums: number[]): ArrayMemoryFrame[] => [
  ...containsDuplicateSorted(nums),
]

export const traceBrute = (nums: number[]): ArrayMemoryFrame[] => [
  ...containsDuplicateBrute(nums),
]

/**
 * Tab order, left to right, and the first entry is the default selection.
 * Deliberately best-to-worst rather than the order you would discover them in:
 * the optimized answer is the one worth remembering, and the other two are the
 * argument for it.
 */
const CONTAINS_DUPLICATE_APPROACHES = ['optimized', 'sorted', 'brute'] as const

export const traces: ProblemTraces<
  ArrayMemoryScene,
  (typeof CONTAINS_DUPLICATE_APPROACHES)[number]
> = {
  example: `nums = [${EXAMPLE_NUMS.join(', ')}]`,
  approaches: CONTAINS_DUPLICATE_APPROACHES,
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
