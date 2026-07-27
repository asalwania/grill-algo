/**
 * SP3 — does a yield-based generator produce frames worth watching?
 *
 * Self-contained on purpose: the Frame type here is the one from specs/main.md
 * SP3, NOT the one in lib/types.ts. The two have drifted; reconciling them is
 * part of F1 ("promote the SP3 generator into content/problems/two-sum").
 */

export type ArrayState = 'idle' | 'active' | 'seen' | 'matched'

export type Frame = {
  step: number
  line: number
  narration: string
  why: string
  variables: Record<string, string | number>
  scene: {
    array: { values: number[]; states: ArrayState[] }
    map: { entries: [number, number][]; probeKey?: number }
    target: number
    result?: [number, number]
  }
  changed: string[]
}

/**
 * The canonical listing every frame's `line` points into. Language-specific
 * listings map onto this via Solution.lineMap; nothing here is ever executed.
 */
export const TRACE_LISTING = [
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

const LINE = {
  init: 2,
  read: 5,
  complement: 6,
  probe: 8,
  found: 9,
  store: 12,
  exhausted: 15,
} as const

// ---------------------------------------------------------------------------
// changed[] — computed by diffing, never hand-listed
// ---------------------------------------------------------------------------

/**
 * Flattens to leaf paths. Arrays are compared whole rather than per index:
 * `scene.array.states` is one hint, not six, because the scene retargets every
 * tile on any change anyway.
 */
function collect(value: unknown, path: string, out: Map<string, string>): void {
  if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    for (const [key, child] of Object.entries(value)) {
      collect(child, path ? `${path}.${key}` : key, out)
    }
    return
  }
  out.set(path, JSON.stringify(value ?? null))
}

/**
 * `narration` and `why` are deliberately excluded — they change on every frame,
 * so flagging them carries no signal.
 */
function changedPaths(prev: Frame | null, next: Frame): string[] {
  if (prev === null) return [] // nothing to flash against on the first frame

  const before = new Map<string, string>()
  const after = new Map<string, string>()
  for (const root of ['line', 'variables', 'scene'] as const) {
    collect(prev[root], root, before)
    collect(next[root], root, after)
  }

  return [...new Set([...before.keys(), ...after.keys()])]
    .filter((path) => before.get(path) !== after.get(path))
    .sort()
}

// ---------------------------------------------------------------------------
// The trace
// ---------------------------------------------------------------------------

const formatMap = (seen: Map<number, number>): string =>
  seen.size === 0
    ? '{}'
    : `{ ${[...seen].map(([key, index]) => `${key}: ${index}`).join(', ')} }`

/**
 * Solves Two Sum with the hash-map approach, yielding a FULL state snapshot at
 * each meaningful point. This actually computes the answer — the frames are a
 * by-product of a real run, not a hand-authored script.
 */
export function* twoSumTrace(
  nums: number[],
  target: number,
): Generator<Frame, void, undefined> {
  const seen = new Map<number, number>()
  const states: ArrayState[] = nums.map(() => 'idle')

  let step = 0
  let previous: Frame | null = null

  const emit = (
    line: number,
    narration: string,
    why: string,
    variables: Record<string, string | number>,
    extra: { probeKey?: number; result?: [number, number] } = {},
  ): Frame => {
    const scene: Frame['scene'] = {
      array: { values: [...nums], states: [...states] },
      map: { entries: [...seen] },
      target,
    }
    if (extra.probeKey !== undefined) scene.map.probeKey = extra.probeKey
    if (extra.result !== undefined) scene.result = [...extra.result]

    const frame: Frame = {
      step: step++,
      line,
      narration,
      why,
      variables,
      scene,
      changed: [],
    }
    frame.changed = changedPaths(previous, frame)
    previous = frame
    return frame
  }

  const base = () => ({ target, n: nums.length, seen: formatMap(seen) })

  yield emit(
    LINE.init,
    'An empty map, and one pass to fill it.',
    'Brute force re-scans the rest of the array for every element. If we instead remember every number we have already walked past, "is its partner out there?" collapses into a single lookup.',
    base(),
  )

  for (let i = 0; i < nums.length; i++) {
    const num = nums[i]

    states[i] = 'active'
    yield emit(
      LINE.read,
      `i = ${i}. Pick up ${num}.`,
      'Each element is touched exactly once. Everything else we need is already behind us, in the map.',
      { ...base(), i, num },
    )

    const complement = target - num
    yield emit(
      LINE.complement,
      `${num} needs ${complement} to reach ${target}.`,
      'This is the pivot. Instead of hunting for a pair, we turn each number into a question with exactly one right answer — and single answers are what a hash map is for.',
      { ...base(), i, num, complement },
    )

    const hitIndex = seen.get(complement)

    if (hitIndex === undefined) {
      yield emit(
        LINE.probe,
        seen.size === 0
          ? `Have we seen ${complement}? The map is empty, so no.`
          : `Have we seen ${complement}? Not in the map.`,
        'One hash lookup, O(1). This single step stands in for the whole of brute force’s inner loop.',
        { ...base(), i, num, complement, found: 'no' },
        { probeKey: complement },
      )

      seen.set(num, i)
      states[i] = 'seen'
      yield emit(
        LINE.store,
        `Remember ${num} at index ${i}.`,
        'The number is the key and the index is the value — the array turned inside out. We look up by value, but we have to return indices.',
        { ...base(), i, num, complement },
      )
      continue
    }

    yield emit(
      LINE.probe,
      `Have we seen ${complement}? Yes — index ${hitIndex}.`,
      'Found by remembering, not by searching. That lookup would have cost the same if the array held six million numbers.',
      { ...base(), i, num, complement, found: 'yes' },
      { probeKey: complement },
    )

    states[hitIndex] = 'matched'
    states[i] = 'matched'
    yield emit(
      LINE.found,
      `${complement} + ${num} = ${target}. Return [${hitIndex}, ${i}].`,
      'The map bought an O(n) walk in place of O(n²) comparisons. The payoff scales with the length of the array, not with where the answer happens to sit.',
      {
        ...base(),
        i,
        num,
        complement,
        result: `[${hitIndex}, ${i}]`,
      },
      { probeKey: complement, result: [hitIndex, i] },
    )
    return
  }

  yield emit(
    LINE.exhausted,
    `The walk is over. Nothing pairs to ${target}.`,
    'Every number got one chance to find a partner already behind it. If a pair existed, the later of the two would have found the earlier one — so a single pass really is enough to be sure.',
    { ...base(), result: '[]' },
  )
}

export const traceTwoSum = (nums: number[], target: number): Frame[] => [
  ...twoSumTrace(nums, target),
]
