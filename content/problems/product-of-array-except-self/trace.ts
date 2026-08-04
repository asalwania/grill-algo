/**
 * Product of Array Except Self — build-time trace generators.
 *
 * Nothing here runs in the browser: scripts/build-traces.ts executes these
 * generators at build time, once per entry in TEST_CASES, and writes one
 * frames.<case>.<approach>.json per combination next to this file.
 *
 * ## Fitting an OUTPUT array onto the shared scene
 *
 * This is the first problem in the family whose answer is not a pair of indices
 * or a boolean but a whole SECOND array — one product per position. The shared
 * scene (lib/types.ts's ArrayMemoryScene) holds one array of tiles and, behind
 * it, a wall of key→value slots. The mapping falls straight out of that:
 *
 *   - **The tile row is the INPUT** `nums`, plain numbers, so there is no
 *     packing and no `labels`.
 *   - **The memory wall is the ANSWER** being built: one slot per position,
 *     `slot.key` the index and `slot.value` the product standing at answer[i]
 *     right now. Encode and Decode makes the same move — the wall is whatever
 *     key→value structure the problem accumulates, not only a hash map — and
 *     the wall rises for BOTH approaches here, because both genuinely build the
 *     output array. What separates the tabs is time, not memory, so the frame
 *     counter and the complexity readout carry the lesson (brute is the longer
 *     trace on every shipped case), exactly as Encode and Decode's do.
 *   - **`scene.probe` stays null** on every frame. Nothing is ever looked up by
 *     key — the wall is written by position, in order — so there is no probe
 *     pill, and `link` runs tile i → answer slot i to show which cell a
 *     position is filling.
 *   - **There is no `target`.** The array is the whole input; the flat view's
 *     caption row collapses to just the heading.
 *
 * ## Two approaches, and why the slower one is genuinely slower here
 *
 * `optimized` is the two-pass prefix/suffix method: one sweep left storing the
 * product of everything BEFORE each position, one sweep right multiplying in
 * the product of everything AFTER it. `brute` recomputes each answer from
 * scratch by multiplying every other element — and it shows every one of those
 * multiplications, because the redundant work IS the lesson. On the shipped
 * n = 4 cases that is O(n²) against O(n), and the brute trace is the longer of
 * the two.
 *
 * There is no `sorted` tab: answer[i] is pinned to position i, so reordering
 * the array destroys the mapping the answer has to preserve — the same reason
 * Two Sum ships none.
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
export const EXAMPLE_NUMS = [2, 3, 4, 5]

// ---------------------------------------------------------------------------
// Playable inputs
// ---------------------------------------------------------------------------

/**
 * Four inputs, each reaching something the others don't:
 *   - `sample` has no zeros and distinct products, so the two passes read
 *     cleanly and every wall cell holds a different number.
 *   - `single-zero` is the reason division is banned: only the zero's OWN
 *     position gets a product, and every other position multiplies the zero in
 *     and dies. There is nothing to divide back out.
 *   - `two-zeros` collapses the whole answer to zeros — two or more zeros and
 *     every position still includes one.
 *   - `negatives` carries the signs through: an even count of negatives to a
 *     side is positive, an odd count negative.
 *
 * Every case is length four, so both approaches touch the same amount of the
 * scene and the pinned frame counts hold across all of them (the counts depend
 * only on n, not on the values). None needs to "reach" a terminal return: neither
 * listing has an early one, so the final `return` ends every trace already.
 */
export const TEST_CASES: TestCase[] = [
  {
    id: 'sample',
    label: 'The walkthrough',
    nums: EXAMPLE_NUMS,
    note: 'Four numbers, no zeros — the prefix and suffix products read cleanly.',
  },
  {
    id: 'single-zero',
    label: 'One zero changes everything',
    nums: [4, 0, 2, 3],
    note: 'Only the zero’s own slot is non-zero. Division could never recover this.',
  },
  {
    id: 'two-zeros',
    label: 'Two zeros, all zeros',
    nums: [0, 5, 0, 3],
    note: 'Every position still multiplies in at least one zero, so the whole answer is zero.',
  },
  {
    id: 'negatives',
    label: 'Signs carry through',
    nums: [-2, 3, -4, 5],
    note: 'Negatives just multiply through — the sign of each answer is the parity of the negatives around it.',
  },
]

// ---------------------------------------------------------------------------
// Canonical listings
// ---------------------------------------------------------------------------

/**
 * Every optimized frame's `line` is a 1-based index into this listing, and
 * nothing else. Per-language listings map onto it via Solution.lineMap.
 *
 * The write folds nums[i] into `prefix` AFTER storing it (line 8), so answer[i]
 * never multiplies by itself — the single most important ordering in the whole
 * problem, and the one the paper sheet's BEFORE/AFTER columns exist to protect.
 */
export const OPTIMIZED_LISTING = [
  'function productExceptSelf(nums) {', //   1
  '  const n = nums.length', //              2
  '  const answer = new Array(n)', //        3
  '', //                                     4
  '  let prefix = 1', //                     5
  '  for (let i = 0; i < n; i++) {', //      6
  '    answer[i] = prefix', //               7
  '    prefix *= nums[i]', //                8
  '  }', //                                  9
  '', //                                    10
  '  let suffix = 1', //                    11
  '  for (let i = n - 1; i >= 0; i--) {', //12
  '    answer[i] *= suffix', //             13
  '    suffix *= nums[i]', //               14
  '  }', //                                 15
  '', //                                    16
  '  return answer', //                     17
  '}', //                                   18
].join('\n')

export const BRUTE_LISTING = [
  'function productExceptSelf(nums) {', //   1
  '  const n = nums.length', //              2
  '  const answer = new Array(n)', //        3
  '', //                                     4
  '  for (let i = 0; i < n; i++) {', //      5
  '    let product = 1', //                  6
  '    for (let j = 0; j < n; j++) {', //    7
  '      if (j === i) continue', //          8
  '      product *= nums[j]', //             9
  '    }', //                               10
  '    answer[i] = product', //             11
  '  }', //                                 12
  '', //                                    13
  '  return answer', //                     14
  '}', //                                   15
].join('\n')

/** `prefixWrite` lands on `answer[i] = prefix` (line 7), the write that fills
 *  a wall cell; the fold on line 8 rides in the same frame's narration because
 *  it moves only a variable, and a frame that moves only a variable is a wasted
 *  step (F1). Same reason `suffixCombine` is 13 and not 14. */
const OPTIMIZED_LINE = {
  init: 3,
  prefixRead: 6,
  prefixWrite: 7,
  transition: 11,
  suffixProbe: 12,
  suffixCombine: 13,
  done: 17,
} as const

/** `multiply` is the inner `product *= nums[j]` (line 9) — the step that is
 *  repeated n(n-1) times and the whole reason this approach is quadratic. The
 *  `continue` on line 8 is never active: skipping the element is narrated, not
 *  a frame of its own. */
const BRUTE_LINE = {
  init: 3,
  read: 6,
  multiply: 9,
  write: 11,
  done: 14,
} as const

// ---------------------------------------------------------------------------
// Shared machinery
// ---------------------------------------------------------------------------

type AnswerSlot = { key: number; value: number; state: SlotState }

/** `[60, 40, 30, 24]`, and `·` for a position not yet written — the answer as
 *  the DOM variables panel shows it building up. */
const formatAnswer = (answer: (number | null)[]): string =>
  `[${answer.map((v) => (v === null ? '·' : v)).join(', ')}]`

// ---------------------------------------------------------------------------
// Optimized — prefix products left to right, then suffix products right to left
// ---------------------------------------------------------------------------

/**
 * Solves Product of Array Except Self in two passes, yielding a FULL state
 * snapshot at each meaningful point. This actually computes the answer — the
 * wall's values at the end are the real products, not a hand-authored script.
 *
 * Each element gets two beats per pass: the tile lights and the running product
 * is named, then the answer cell is written (pass 1) or completed (pass 2). A
 * single frame turns the whole array over between the passes, because repainting
 * every tile at once is one gesture, not one per tile.
 */
export function* solveOptimized(
  input: number[],
): Generator<ArrayMemoryFrame, void, undefined> {
  const nums = [...input]
  const n = nums.length
  const tiles: TileState[] = nums.map(() => 'idle')
  const slots: AnswerSlot[] = []
  const answer: (number | null)[] = nums.map(() => null)
  let cursor: number | null = null
  let link: [number, number] | null = null
  let result: [number, number] | null = null
  let prefix = 1
  let suffix = 1

  const emit = createEmitter<ArrayMemoryScene>(() => ({
    nums: [...nums],
    tiles: [...tiles],
    cursor,
    slots: slots.map((s) => ({ ...s })),
    probe: null,
    link: link === null ? null : [link[0], link[1]],
    result: result === null ? null : [result[0], result[1]],
  }))

  const base = () => ({ n, answer: formatAnswer(answer) })

  yield emit(
    OPTIMIZED_LINE.init,
    'init',
    'An empty answer array, and a running product that starts at 1.',
    'Division is out — the problem forbids it, and a single zero would break it anyway. So the product is BUILT, in two sweeps: one from the left, one from the right.',
    { ...base(), prefix, suffix },
  )

  // Pass 1: the product of everything to the LEFT of each position.
  for (let i = 0; i < n; i++) {
    cursor = i
    tiles[i] = 'active'
    link = null
    yield emit(
      OPTIMIZED_LINE.prefixRead,
      'compare',
      `Position ${i}. Everything to its left multiplies to ${prefix}.`,
      'answer[i] is the product of every element except nums[i]. Its left half is exactly the running product built from positions before i — and it is already in hand.',
      { ...base(), i, prefix },
    )

    answer[i] = prefix
    slots.push({ key: i, value: prefix, state: 'filled' })
    tiles[i] = 'done'
    link = [i, i]
    const folded = prefix * nums[i]
    yield emit(
      OPTIMIZED_LINE.prefixWrite,
      'store',
      `Write ${prefix} into answer[${i}]. Then fold nums[${i}] = ${nums[i]} in — prefix becomes ${folded}.`,
      'The value stored EXCLUDES nums[i]: it is folded in only after the write, so it counts toward every position to the right and never toward this one.',
      { ...base(), i, prefix, num: nums[i] },
    )
    prefix = folded
  }

  // The turn: every left product is placed; sweep back with a running right one.
  cursor = null
  link = null
  for (let k = 0; k < n; k++) tiles[k] = 'idle'
  yield emit(
    OPTIMIZED_LINE.transition,
    'init',
    'Every left product is in place. Now sweep right to left, multiplying each cell by the product of everything to its right.',
    'The right product is built the same way the left one was — one running value, folded in one element at a time. That is why no second array of suffixes is needed: O(1) extra space beyond the answer itself.',
    { ...base(), prefix, suffix },
  )

  // Pass 2: multiply in the product of everything to the RIGHT.
  for (let i = n - 1; i >= 0; i--) {
    cursor = i
    tiles[i] = 'active'
    slots[i].state = 'probed'
    link = [i, i]
    yield emit(
      OPTIMIZED_LINE.suffixProbe,
      'compare',
      `answer[${i}] holds ${answer[i]} — the product to its left. To its right, everything multiplies to ${suffix}.`,
      'The left half was written in the first pass. Multiplying by the right half now completes the product-of-all-others for this position.',
      { ...base(), i, suffix },
    )

    const combined = (answer[i] as number) * suffix
    answer[i] = combined
    slots[i].value = combined
    slots[i].state = 'hit'
    tiles[i] = 'done'
    const folded = suffix * nums[i]
    yield emit(
      OPTIMIZED_LINE.suffixCombine,
      'store',
      `answer[${i}] = ${combined}. Then fold nums[${i}] = ${nums[i]} into the right product — suffix becomes ${folded}.`,
      'Same ordering as the left pass: the cell is multiplied by the right product BEFORE nums[i] is folded in, so this position never multiplies by itself.',
      { ...base(), i, suffix, num: nums[i] },
    )
    suffix = folded
  }

  cursor = null
  link = null
  for (let k = 0; k < n; k++) tiles[k] = 'match'
  result = n > 0 ? [0, n - 1] : null
  yield emit(
    OPTIMIZED_LINE.done,
    'return',
    `answer = ${formatAnswer(answer)} — each position holds the product of all the others.`,
    'Two passes over the array, no division, one array of output. Every answer[i] is its left product times its right product, and neither ever included nums[i].',
    { ...base(), result: formatAnswer(answer) },
  )
}

// ---------------------------------------------------------------------------
// Brute force — recompute each answer from scratch
// ---------------------------------------------------------------------------

/**
 * Fills answer[i] by multiplying every OTHER element, for every i. `scene.slots`
 * still fills — the output array is real either way — but every inner
 * multiplication is its own frame, because the repeated work is exactly what
 * the tab is here to make visible. `vars.multiplications` counts them: n(n-1)
 * of them, against the two-pass method's single sweep in each direction.
 */
export function* solveBrute(
  input: number[],
): Generator<ArrayMemoryFrame, void, undefined> {
  const nums = [...input]
  const n = nums.length
  const tiles: TileState[] = nums.map(() => 'idle')
  const slots: AnswerSlot[] = []
  const answer: (number | null)[] = nums.map(() => null)
  let cursor: number | null = null
  let link: [number, number] | null = null
  let result: [number, number] | null = null
  let multiplications = 0

  const emit = createEmitter<ArrayMemoryScene>(() => ({
    nums: [...nums],
    tiles: [...tiles],
    cursor,
    slots: slots.map((s) => ({ ...s })),
    probe: null,
    link: link === null ? null : [link[0], link[1]],
    result: result === null ? null : [result[0], result[1]],
  }))

  const base = () => ({ n, answer: formatAnswer(answer), multiplications })

  yield emit(
    BRUTE_LINE.init,
    'init',
    'An empty answer array. For each position, multiply every other element from scratch.',
    'Nothing is carried between positions, so the product for answer[i] shares no work with answer[i-1]. Each of the n answers costs a full pass of n-1 multiplications.',
    { ...base() },
  )

  for (let i = 0; i < n; i++) {
    for (let k = 0; k < n; k++) tiles[k] = 'idle'
    tiles[i] = 'match'
    cursor = i
    link = null
    let product = 1
    yield emit(
      BRUTE_LINE.read,
      'compare',
      `answer[${i}]: skip nums[${i}] = ${nums[i]}, multiply the rest. product starts at 1.`,
      'The one element this position must NOT include is nums[i] itself. Everything else goes into the product.',
      { ...base(), i, product },
    )

    let prev = -1
    for (let j = 0; j < n; j++) {
      if (j === i) continue
      if (prev !== -1) tiles[prev] = 'done'
      tiles[j] = 'active'
      cursor = j
      link = [i, j]
      product *= nums[j]
      multiplications++
      yield emit(
        BRUTE_LINE.multiply,
        'compare',
        `× nums[${j}] = ${nums[j]} → product = ${product}.`,
        'Every element except nums[i] is visited again here — work the two-pass method does once and reuses, and this one repeats for all n positions.',
        { ...base(), i, j, num: nums[j], product },
      )
      prev = j
    }

    if (prev !== -1) tiles[prev] = 'done'
    tiles[i] = 'done'
    answer[i] = product
    slots.push({ key: i, value: product, state: 'filled' })
    cursor = i
    link = [i, i]
    yield emit(
      BRUTE_LINE.write,
      'store',
      `answer[${i}] = ${product}.`,
      'One position settled after a full pass over the array. n such passes is the n² this approach pays and the two-pass method avoids.',
      { ...base(), i, product },
    )
  }

  cursor = null
  link = null
  for (let k = 0; k < n; k++) tiles[k] = 'match'
  result = n > 0 ? [0, n - 1] : null
  yield emit(
    BRUTE_LINE.done,
    'return',
    `answer = ${formatAnswer(answer)} — the product of all others at every position.`,
    `The same answer as the two-pass method, bought with ${multiplications} multiplications: n positions × (n-1) each. The other reuses its running products and never repeats one.`,
    { ...base(), result: formatAnswer(answer) },
  )
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export const traceOptimized = (nums: number[]): ArrayMemoryFrame[] => [
  ...solveOptimized(nums),
]

export const traceBrute = (nums: number[]): ArrayMemoryFrame[] => [
  ...solveBrute(nums),
]

/** Tab order, left to right — best first, and the first entry is the default
 *  selection. No `sorted`: answer[i] is pinned to position i, so reordering the
 *  array destroys the mapping the answer must preserve. */
const APPROACHES = ['optimized', 'brute'] as const

export const traces: ProblemTraces<
  ArrayMemoryScene,
  (typeof APPROACHES)[number]
> = {
  example: `nums = [${EXAMPLE_NUMS.join(', ')}]`,
  approaches: APPROACHES,
  listings: {
    optimized: OPTIMIZED_LISTING,
    brute: BRUTE_LISTING,
  },
  cases: TEST_CASES,
  build: {
    optimized: (input) => traceOptimized(input.nums),
    brute: (input) => traceBrute(input.nums),
  },
}
