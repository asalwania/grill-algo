/**
 * Two Sum — build-time trace generators.
 *
 * Promoted from app/(SP3)/two-sum-frames/trace.ts. Nothing here runs in the
 * browser: scripts/build-traces.ts executes these generators at build time,
 * once per entry in TEST_CASES, and writes one
 * frames.<case>.<approach>.json per combination next to this file.
 *
 * Two things changed on the way over from SP3, both resolved by the spike's own
 * findings (docs/spikes/SP3-generator-frames.md):
 *
 *   1. The Frame shape is now lib/types.ts's — `vars` (which admits booleans,
 *      so SP3's `found: 'yes' | 'no'` is a real boolean), `tiles`/`cursor`,
 *      `slots`/`probe`/`link` — plus SP3's `why`, which lib/types.ts had
 *      dropped and F6 requires. That is Finding 4's prescribed resolution.
 *
 *   2. Every frame now earns a scene change. SP3's trace did not: its
 *      `complement` frame moved only `vars.complement`, and its `exhausted`
 *      frame was scene-identical to the last `store`. Staging is now
 *      tile lights (L5) -> beam forms (L6) -> beam fires (L8), and `store`
 *      holds cursor/probe so the next `read` has something to clear. Frame
 *      counts are unchanged from SP3: 9 at target 9, 25 at target 21.
 */

import { createEmitter } from '../../../lib/frames.ts'
import type {
  ProblemTraces,
  SlotState,
  TestCase,
  TileState,
  TwoSumFrame,
  TwoSumScene,
} from '../../../lib/types.ts'

/** The input the shipped frames are generated from — SP3 Finding 1. */
export const EXAMPLE_NUMS = [2, 7, 11, 15, 3, 6]
export const EXAMPLE_TARGET = 21

// ---------------------------------------------------------------------------
// Playable inputs
// ---------------------------------------------------------------------------

/**
 * Every input the player can switch between. All four are generated at build
 * time by the same generators below — nothing here is ever run in the browser.
 *
 * The first entry is the default and MUST stay SP3 Finding 1's canonical
 * example: it is the one the S2 mock's "STEP 7 / 24" was drawn against, and
 * the one AGENTS.md's frame counts (optimized 25 / brute 20) refer to.
 *
 * The other three are chosen for the branches the headline example never
 * reaches, one branch each:
 *   - `first-pair` matches on the very first lookup (nothing accumulates),
 *   - `late-answer` proves the answer is not simply "the first two numbers",
 *   - `no-answer` is the only case that reaches either listing's final
 *     `return []` — canonical line 15 (optimized) / 10 (brute). Those lines
 *     were mapped for every language in solutions/index.ts but, until this
 *     case existed, no shipped frame ever pointed at them.
 *
 * Constraint on any case added here: the optimized trace pushes one slot per
 * non-matching element, and both the flat view and the label layer key slots
 * by their map key — so no input may store the same value twice. In practice
 * that means no repeated value that misses (a repeated value that HITS is
 * fine; it returns before the second push).
 */
/** `TestCase.target` is optional in general (array-only problems exist), but
 *  every Two Sum case has one — stated in the type so the tests can rely on
 *  it and an authoring slip is a compile error, not a runtime throw. */
type TwoSumTestCase = TestCase & { target: number }

export const TEST_CASES: TwoSumTestCase[] = [
  {
    id: 'sample',
    label: 'The walkthrough',
    nums: EXAMPLE_NUMS,
    target: EXAMPLE_TARGET,
    note: 'Every tile gets touched and the map fills up before the answer lands.',
  },
  {
    id: 'first-pair',
    label: 'Found immediately',
    nums: [2, 7, 11, 15],
    target: 9,
    note: 'The first two numbers are the answer — one lookup and it is over.',
  },
  {
    id: 'late-answer',
    label: 'Answer at the end',
    nums: [3, 2, 4],
    target: 6,
    note: '3 + 3 would hit the target, but you cannot use one number twice.',
  },
  {
    id: 'no-answer',
    label: 'No pair at all',
    nums: [2, 7, 11],
    target: 100,
    note: 'Nothing adds up, so both approaches run to the end and return nothing.',
  },
]

// ---------------------------------------------------------------------------
// Canonical listings
// ---------------------------------------------------------------------------

/**
 * Every optimized frame's `line` is a 1-based index into this listing, and
 * nothing else. Per-language listings map onto it via Solution.lineMap (F14).
 *
 * Active lines are 2, 5, 6, 8, 9, 12 and 15. The rest are structural — they
 * have no state change to narrate, so they are never an active line. That is
 * deliberate, not an omission.
 */
export const OPTIMIZED_LISTING = [
  'function twoSum(nums, target) {', //             1
  '  const seen = new Map()', //                    2
  '', //                                            3
  '  for (let i = 0; i < nums.length; i++) {', //   4
  '    const num = nums[i]', //                     5
  '    const complement = target - num', //         6
  '', //                                            7
  '    if (seen.has(complement)) {', //             8
  '      return [seen.get(complement), i]', //      9
  '    }', //                                      10
  '', //                                           11
  '    seen.set(num, i)', //                       12
  '  }', //                                        13
  '', //                                           14
  '  return []', //                                15
  '}', //                                          16
].join('\n')

/**
 * Active lines are 2, 4, 5 and 10. Line 3 (the inner loop header) is
 * deliberately never active: picking `j` and comparing the pair are one beat,
 * and splitting them would produce two frames with an identical scene.
 */
export const BRUTE_LISTING = [
  'function twoSum(nums, target) {', //                 1
  '  for (let i = 0; i < nums.length; i++) {', //       2
  '    for (let j = i + 1; j < nums.length; j++) {', // 3
  '      if (nums[i] + nums[j] === target) {', //       4
  '        return [i, j]', //                          5
  '      }', //                                        6
  '    }', //                                          7
  '  }', //                                            8
  '', //                                               9
  '  return []', //                                   10
  '}', //                                             11
].join('\n')

const OPTIMIZED_LINE = {
  init: 2,
  read: 5,
  complement: 6,
  probe: 8,
  found: 9,
  store: 12,
  exhausted: 15,
} as const

const BRUTE_LINE = {
  outer: 2,
  compare: 4,
  found: 5,
  exhausted: 10,
} as const

// ---------------------------------------------------------------------------
// Optimized — one pass, one hash map
// ---------------------------------------------------------------------------

const formatSlots = (slots: TwoSumScene['slots']): string =>
  slots.length === 0
    ? '{}'
    : `{ ${slots.map((slot) => `${slot.key}: ${slot.value}`).join(', ')} }`

/**
 * Solves Two Sum with the hash-map approach, yielding a FULL state snapshot at
 * each meaningful point. This actually computes the answer — the frames are a
 * by-product of a real run, not a hand-authored script.
 */
export function* twoSumOptimized(
  nums: number[],
  target: number,
): Generator<TwoSumFrame, void, undefined> {
  const tiles: TileState[] = nums.map(() => 'idle')
  const slots: { key: number; value: number; state: SlotState }[] = []
  let cursor: number | null = null
  let probe: number | null = null
  let link: [number, number] | null = null
  let result: [number, number] | null = null
  let lookups = 0

  const emit = createEmitter<TwoSumScene>(() => ({
    nums: [...nums],
    target,
    tiles: [...tiles],
    cursor,
    slots: slots.map((slot) => ({ ...slot })),
    probe,
    link: link === null ? null : [link[0], link[1]],
    result: result === null ? null : [result[0], result[1]],
  }))

  const base = () => ({
    target,
    n: nums.length,
    seen: formatSlots(slots),
    lookups,
  })

  yield emit(
    OPTIMIZED_LINE.init,
    'init',
    'An empty map, and one pass to fill it.',
    'Brute force re-scans the rest of the array for every element. If we instead remember every number we have already walked past, "is its partner out there?" collapses into a single lookup.',
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
      `i = ${i}. Pick up ${num}.`,
      'Each element is touched exactly once. Everything else we need is already behind us, in the map.',
      { ...base(), i, num },
    )

    const complement = target - num
    cursor = i
    yield emit(
      OPTIMIZED_LINE.complement,
      'compare',
      `${num} needs ${complement} to reach ${target}.`,
      'This is the pivot. Instead of hunting for a pair, we turn each number into a question with exactly one right answer — and single answers are what a hash map is for.',
      { ...base(), i, num, complement },
    )

    const hit = slots.findIndex((slot) => slot.key === complement)
    lookups++
    probe = complement

    if (hit === -1) {
      link = null
      yield emit(
        OPTIMIZED_LINE.probe,
        'compare',
        slots.length === 0
          ? `Have we seen ${complement}? The map is empty, so no.`
          : `Have we seen ${complement}? Not in the map.`,
        'One hash lookup, O(1). This single step stands in for the whole of brute force’s inner loop.',
        { ...base(), i, num, complement, found: false },
      )

      slots.push({ key: num, value: i, state: 'filled' })
      tiles[i] = 'done'
      yield emit(
        OPTIMIZED_LINE.store,
        'store',
        `Remember ${num} at index ${i}.`,
        'The number is the key and the index is the value — the array turned inside out. We look up by value, but we have to return indices.',
        { ...base(), i, num, complement, found: false },
      )
      continue
    }

    const j = slots[hit].value
    slots[hit].state = 'probed'
    link = [i, hit]
    yield emit(
      OPTIMIZED_LINE.probe,
      'match',
      `Have we seen ${complement}? Yes — index ${j}.`,
      'Found by remembering, not by searching. That lookup would have cost the same if the array held six million numbers.',
      { ...base(), i, num, complement, found: true },
    )

    slots[hit].state = 'hit'
    tiles[j] = 'match'
    tiles[i] = 'match'
    result = [j, i]
    yield emit(
      OPTIMIZED_LINE.found,
      'return',
      `${complement} + ${num} = ${target}. Return [${j}, ${i}].`,
      `The map bought an O(n) walk in place of O(n²) comparisons — ${lookups} lookups to get here. The payoff scales with the length of the array, not with where the answer happens to sit.`,
      { ...base(), i, num, complement, found: true, result: `[${j}, ${i}]` },
    )
    return
  }

  cursor = null
  probe = null
  link = null
  yield emit(
    OPTIMIZED_LINE.exhausted,
    'return',
    `The walk is over. Nothing pairs to ${target}.`,
    'Every number got one chance to find a partner already behind it. If a pair existed, the later of the two would have found the earlier one — so a single pass really is enough to be sure.',
    { ...base(), result: '[]' },
  )
}

// ---------------------------------------------------------------------------
// Brute force — every pair, no memory
// ---------------------------------------------------------------------------

/**
 * The same problem with nothing remembered. `scene.slots` is `[]` on every
 * single frame and `scene.probe` is always null: there is no wall to raise and
 * no key to look up, and that absence is the entire point of the comparison.
 *
 * One frame per comparison, at BRUTE_LINE.compare. The cost is not summarised
 * anywhere — you watch it accumulate.
 */
export function* twoSumBrute(
  nums: number[],
  target: number,
): Generator<TwoSumFrame, void, undefined> {
  const tiles: TileState[] = nums.map(() => 'idle')
  let cursor: number | null = null
  let link: [number, number] | null = null
  let result: [number, number] | null = null
  let comparisons = 0

  const emit = createEmitter<TwoSumScene>(() => ({
    nums: [...nums],
    target,
    tiles: [...tiles],
    cursor,
    slots: [], // never fills — brute force has no memory structure
    probe: null, // nothing is ever looked up
    link: link === null ? null : [link[0], link[1]],
    result: result === null ? null : [result[0], result[1]],
  }))

  const base = () => ({ target, n: nums.length, comparisons })

  yield emit(
    BRUTE_LINE.outer,
    'init',
    'Nothing remembered. Every pair, checked by hand.',
    'The only tool here is comparison, so the only way forward is to try each pair and see. Watch the work accumulate: the first number is checked against every number after it, the second against every number after that, and so on down.',
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
      `i = ${i}. Anchor on ${a}.`,
      'The inner loop starts one step past the anchor and never looks back — every pair to the left has already been tried. That is why the second pass is shorter than the first, and the last is a single comparison.',
      { ...base(), i, a },
    )

    let previousJ: number | null = null

    for (let j = i + 1; j < nums.length; j++) {
      const b = nums[j]
      const sum = a + b

      if (previousJ !== null) tiles[previousJ] = 'idle'
      tiles[j] = 'active'
      link = [i, j]
      comparisons++

      if (sum !== target) {
        yield emit(
          BRUTE_LINE.compare,
          'compare',
          `${a} + ${b} = ${sum}. Not ${target}.`,
          'One comparison, one step. There is no lookup to hide the cost in — the optimized trace spends a single frame where this one spends an entire inner loop.',
          { ...base(), i, j, a, b, sum, found: false },
        )
        previousJ = j
        continue
      }

      yield emit(
        BRUTE_LINE.compare,
        'match',
        `${a} + ${b} = ${target}.`,
        `Found by exhaustion rather than by memory — ${comparisons} comparisons, against one lookup per element on the other side. On six numbers that is barely a difference. On six million it is the difference between an answer and a hung tab.`,
        { ...base(), i, j, a, b, sum, found: true },
      )

      tiles[i] = 'match'
      tiles[j] = 'match'
      result = [i, j]
      yield emit(
        BRUTE_LINE.found,
        'return',
        `Return [${i}, ${j}].`,
        'The same pair and the same indices the map approach returns — the answer was never in doubt. What differs is how much work it took to become certain of it.',
        { ...base(), i, j, a, b, sum, found: true, result: `[${i}, ${j}]` },
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
    `Every pair checked. Nothing sums to ${target}.`,
    `Proving a negative costs the full n(n-1)/2 — ${comparisons} comparisons, with nothing learned along the way that would let us stop early.`,
    { ...base(), result: '[]' },
  )
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export const traceOptimized = (nums: number[], target: number): TwoSumFrame[] => [
  ...twoSumOptimized(nums, target),
]

export const traceBrute = (nums: number[], target: number): TwoSumFrame[] => [
  ...twoSumBrute(nums, target),
]

/**
 * Two Sum ships TWO approaches, not three.
 *
 * There is no sort-and-scan tab here on purpose: Two Sum has to return
 * INDICES, and sorting destroys them. Recovering them means carrying
 * (value, index) pairs through the sort, which costs O(n) space — so the
 * "sorted is the cheap middle" story that earns the tab on Contains Duplicate
 * simply isn't true here. Adding one would teach the wrong lesson.
 */
const TWO_SUM_APPROACHES = ['optimized', 'brute'] as const

/**
 * `TestCase.target` is optional because array-only problems exist (Contains
 * Duplicate). Two Sum is not one of them, and a case authored without a
 * target must fail the BUILD rather than quietly solve `target = 0`, which
 * would generate a plausible-looking trace of the wrong problem.
 */
function requireTarget(input: TestCase): number {
  if (input.target === undefined) {
    throw new Error(`Two Sum case "${input.id}" has no target`)
  }
  return input.target
}

export const traces: ProblemTraces<TwoSumScene, (typeof TWO_SUM_APPROACHES)[number]> = {
  example: `nums = [${EXAMPLE_NUMS.join(', ')}], target = ${EXAMPLE_TARGET}`,
  approaches: TWO_SUM_APPROACHES,
  listings: { optimized: OPTIMIZED_LISTING, brute: BRUTE_LISTING },
  cases: TEST_CASES,
  build: {
    optimized: (input) => traceOptimized(input.nums, requireTarget(input)),
    brute: (input) => traceBrute(input.nums, requireTarget(input)),
  },
}
