import { describe, expect, it } from 'vitest'

import type { Approach, ArrayMemoryFrame } from '../../../lib/types'
import {
  BRUTE_LISTING,
  EXAMPLE_NUMS,
  OPTIMIZED_LISTING,
  SORTED_LISTING,
  TEST_CASES,
  traceBrute,
  traceOptimized,
  traceSorted,
  traces,
} from './trace'

type Case = { label: string; nums: number[] }

/**
 * Every SHIPPED case (so the inputs the player can actually select are the
 * ones under test), plus a few extra that exercise branches no shipped case
 * reaches: two elements that are neighbours, two that are not, a single
 * element, an array that is nothing but one repeated value, and a run made
 * entirely of negative numbers.
 */
const CASES: Case[] = [
  ...TEST_CASES.map(({ label, nums }) => ({ label, nums })),
  { label: 'two consecutive elements', nums: [5, 6] },
  { label: 'two non-consecutive elements', nums: [5, 9] },
  { label: 'single element', nums: [42] },
  { label: 'nothing but one repeated value', nums: [3, 3, 3, 3] },
  { label: 'a run of negatives', nums: [-3, -2, -4, -1] },
]

const APPROACHES: {
  name: Approach
  run: (nums: number[]) => ArrayMemoryFrame[]
  listing: string
}[] = [
  { name: 'optimized', run: traceOptimized, listing: OPTIMIZED_LISTING },
  { name: 'sorted', run: traceSorted, listing: SORTED_LISTING },
  { name: 'brute', run: traceBrute, listing: BRUTE_LISTING },
]

/**
 * The answer as the PROBLEM asks it — a length. Read off `result`'s SPAN
 * rather than comparing pairs directly, because the three approaches
 * legitimately discover the winning run via different orderings and may pick
 * different (equally valid) ties — only the LENGTH is common ground.
 */
const answerOf = (frames: ArrayMemoryFrame[]): number => {
  const result = frames[frames.length - 1].scene.result
  return result === null ? 0 : result[1] - result[0] + 1
}

/** Ground truth, computed independently of every generator under test. */
const referenceLongest = (nums: number[]): number => {
  if (nums.length === 0) return 0
  const unique = [...new Set(nums)].sort((a, b) => a - b)
  let longest = 1
  let current = 1
  for (let i = 1; i < unique.length; i++) {
    current = unique[i] === unique[i - 1] + 1 ? current + 1 : 1
    longest = Math.max(longest, current)
  }
  return longest
}

describe.each(CASES)('$label — nums=[$nums]', ({ nums }) => {
  const optimized = traceOptimized(nums)
  const sorted = traceSorted(nums)
  const brute = traceBrute(nums)

  it('all three approaches agree with each other', () => {
    expect(answerOf(sorted)).toBe(answerOf(optimized))
    expect(answerOf(brute)).toBe(answerOf(optimized))
  })

  it('and all three agree with an independent check', () => {
    expect(answerOf(optimized)).toBe(referenceLongest(nums))
  })

  it('reports a run that is genuinely consecutive and genuinely from the input', () => {
    for (const { name, run } of APPROACHES) {
      const frames = run(nums)
      const last = frames[frames.length - 1]
      const [start, end] = last.scene.result ?? [0, -1]
      const span = last.scene.nums.slice(start, end + 1)

      expect(span.length, `${name}: span should match the reported length`).toBe(
        answerOf(frames),
      )
      for (let i = 1; i < span.length; i++) {
        expect(span[i], `${name}: run should be consecutive`).toBe(span[i - 1] + 1)
      }
      for (const value of span) {
        expect(nums, `${name}: every value in the run must come from the input`).toContain(
          value,
        )
      }
    }
  })

  describe.each(APPROACHES)('$name', ({ run, listing }) => {
    const frames = run(nums)
    const lines = listing.split('\n')

    it('points every frame at a real, non-blank line of the canonical listing', () => {
      for (const frame of frames) {
        expect(frame.line).toBeGreaterThanOrEqual(1)
        expect(frame.line).toBeLessThanOrEqual(lines.length)
        expect(lines[frame.line - 1].trim()).not.toBe('')
      }
    })

    it('never repeats a scene — every step moves something', () => {
      const scenes = frames.map((frame) => JSON.stringify(frame.scene))

      for (let step = 1; step < scenes.length; step++) {
        expect(
          scenes[step],
          `frame ${step} (line ${frames[step].line}, "${frames[step].narration}") is ` +
            `scene-identical to frame ${step - 1} — a wasted step`,
        ).not.toBe(scenes[step - 1])
      }
    })

    it('carries one tile state per value in every frame', () => {
      for (const frame of frames) {
        expect(frame.scene.tiles).toHaveLength(frame.scene.nums.length)
      }
    })

    it('keeps the array LENGTH constant, whatever it does to the order', () => {
      for (const frame of frames) {
        expect(frame.scene.nums).toHaveLength(nums.length)
      }
    })

    it('numbers frames consecutively from zero and flashes nothing on the first', () => {
      expect(frames.map((frame) => frame.step)).toEqual(frames.map((_, i) => i))
      expect(frames[0].changed).toEqual([])
    })

    it('reports a non-empty changed[] on every frame after the first', () => {
      for (const frame of frames.slice(1)) {
        expect(frame.changed.length, `frame ${frame.step} changed nothing`).toBeGreaterThan(0)
      }
    })
  })

  it('only the optimized approach builds a memory structure', () => {
    for (const frame of [...sorted, ...brute]) {
      expect(frame.scene.slots).toEqual([])
      expect(frame.scene.probe).toBeNull()
    }
  })

  it('optimized remembers every distinct value it walked past, never twice', () => {
    // The full set is built in phase 1, before phase 2 (or layoutAnswer) ever
    // touches `nums` — so the LAST frame's slots still index into the
    // ORIGINAL input, not the reordered answer array.
    const last = optimized[optimized.length - 1]
    const stored = last.scene.slots.map((slot) => slot.key)

    expect(stored).toEqual([...new Set(stored)])
    expect(last.scene.slots.every((slot) => nums[slot.value] === slot.key)).toBe(true)
    expect(stored.sort((a, b) => a - b)).toEqual([...new Set(nums)].sort((a, b) => a - b))
  })

  it('sorted actually sorts, and never mutates the caller’s array', () => {
    const input = [...nums]
    const frames = traceSorted(input)

    expect(input, 'the generator mutated its argument').toEqual(nums)
    // Frame 0 is the array BEFORE the sort; frame 1 is the sort itself — the
    // one contrast the frame exists to show. Frames after that go on to
    // rewrite the array again via layoutAnswer, so only frame 1 is pinned
    // against a plain sort.
    expect(frames[0].scene.nums).toEqual(nums)
    expect(frames[1].scene.nums).toEqual([...nums].sort((a, b) => a - b))
  })
})

describe('the shipped traces', () => {
  const headline = traces.cases[0]

  it('describes the example it was generated from', () => {
    expect(traces.example).toBe('nums = [2, 20, 4, 10, 3, 4, 5]')
  })

  it('defaults to the canonical example', () => {
    expect(headline.nums).toEqual(EXAMPLE_NUMS)
  })

  it('ships three approaches, best first', () => {
    expect(traces.approaches).toEqual(['optimized', 'sorted', 'brute'])
  })

  it('has no target — this problem takes only an array', () => {
    for (const input of traces.cases) {
      expect(input.target).toBeUndefined()
    }
    for (const frame of traces.build.optimized(headline)) {
      expect(frame.scene.target).toBeUndefined()
    }
  })

  it('fills the set and touches every tile before the answer lands', () => {
    const frames = traces.build.optimized(headline)
    const last = frames[frames.length - 1]

    expect(frames).toHaveLength(29)
    expect(last.scene.slots.length).toBeGreaterThanOrEqual(5)
    expect(last.scene.tiles).not.toContain('idle')
  })

  it('spends more steps on brute force than on the sorted walk', () => {
    // The headline case is chosen so all three approaches have a story: the
    // set fills up with a duplicate collapsing for free, brute force pays a
    // full linear scan per candidate step, and the sorted walk is short
    // because the sort did the reordering off-screen.
    expect(traces.build.brute(headline)).toHaveLength(21)
    expect(traces.build.sorted(headline)).toHaveLength(12)
  })

  it('agrees on the answer across all three shipped approaches', () => {
    expect(answerOf(traces.build.brute(headline))).toBe(4)
    expect(answerOf(traces.build.sorted(headline))).toBe(4)
    expect(answerOf(traces.build.optimized(headline))).toBe(4)
  })
})

describe('the playable cases', () => {
  it('offers at least three inputs, each with a unique id', () => {
    expect(traces.cases.length).toBeGreaterThanOrEqual(3)
    expect(new Set(traces.cases.map((input) => input.id)).size).toBe(
      traces.cases.length,
    )
  })

  /**
   * Constraint from trace.ts, pinned so it cannot regress. The sorted trace's
   * second frame IS the sort. If a case is already in order, that frame
   * reorders nothing and becomes a dead step — it would still pass the
   * scene-identity check (it also moves the cursor), which is exactly why
   * this needs its own assertion.
   */
  it.each(TEST_CASES)('$id is not already sorted', (input) => {
    expect(input.nums).not.toEqual([...input.nums].sort((a, b) => a - b))
  })

  it.each(TEST_CASES)('$id agrees on the answer across all approaches', (input) => {
    const expected = referenceLongest(input.nums)
    expect(answerOf(traces.build.optimized(input))).toBe(expected)
    expect(answerOf(traces.build.sorted(input))).toBe(expected)
    expect(answerOf(traces.build.brute(input))).toBe(expected)
  })

  /**
   * This problem has no early-return branch, unlike most of this family — see
   * trace.ts's header. So every shipped case reaches every listing's final
   * `return`, not only `no-answer`; this pins that it stays true rather than
   * assuming any one case is special.
   */
  it('reaches the terminal return in all three listings, from every case', () => {
    const linesFor = (approach: 'optimized' | 'sorted' | 'brute') =>
      TEST_CASES.flatMap((input) =>
        traces.build[approach](input).map((frame) => frame.line),
      )

    for (const input of TEST_CASES) {
      expect(traces.build.optimized(input).at(-1)?.line).toBe(18)
      expect(traces.build.sorted(input).at(-1)?.line).toBe(14)
      expect(traces.build.brute(input).at(-1)?.line).toBe(16)
    }

    expect(linesFor('optimized')).toContain(18)
    expect(linesFor('sorted')).toContain(14)
    expect(linesFor('brute')).toContain(16)
  })

  it('the no-answer case really has no run longer than one', () => {
    const noAnswer = TEST_CASES.find((c) => c.id === 'no-answer')!
    expect(referenceLongest(noAnswer.nums)).toBe(1)
  })
})
