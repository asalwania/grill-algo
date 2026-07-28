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
 * reaches: a two-element array, a single element, and a repeat that is not
 * adjacent even after sorting is impossible — so instead, three of a kind.
 */
const CASES: Case[] = [
  ...TEST_CASES.map(({ label, nums }) => ({ label, nums })),
  { label: 'two equal elements', nums: [8, 8] },
  { label: 'two distinct elements', nums: [9, 4] },
  { label: 'single element', nums: [7] },
  { label: 'three of a kind', nums: [6, 2, 6, 6] },
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
 * The answer as the PROBLEM asks it — a boolean.
 *
 * Deliberately not the index pair: the three approaches genuinely disagree
 * about that, and correctly so. `sorted` reports positions in the SORTED
 * array, and where a value appears three times the approaches pick different
 * pairs of the same value. Only the boolean is common ground, which is exactly
 * what `ProblemChrome.formatAnswer` turns it back into.
 */
const answerOf = (frames: ArrayMemoryFrame[]): boolean =>
  frames[frames.length - 1].scene.result !== null

/** Ground truth, computed independently of every generator under test. */
const hasDuplicate = (nums: number[]): boolean =>
  new Set(nums).size !== nums.length

describe.each(CASES)('$label — nums=[$nums]', ({ nums }) => {
  const optimized = traceOptimized(nums)
  const sorted = traceSorted(nums)
  const brute = traceBrute(nums)

  it('all three approaches agree with each other', () => {
    expect(answerOf(sorted)).toBe(answerOf(optimized))
    expect(answerOf(brute)).toBe(answerOf(optimized))
  })

  it('and all three agree with an independent check', () => {
    expect(answerOf(optimized)).toBe(hasDuplicate(nums))
  })

  it('reports a pair that really does hold the same value', () => {
    for (const { name, run } of APPROACHES) {
      const frames = run(nums)
      const last = frames[frames.length - 1]
      const result = last.scene.result
      if (result === null) continue

      const [i, j] = result
      expect(i, `${name}: pair should be ordered`).toBeLessThan(j)
      // Indexed against the LAST FRAME's nums, not the input — `sorted`
      // reorders the array mid-trace, and its indices refer to that order.
      expect(last.scene.nums[i], `${name}: pair should be equal values`).toBe(
        last.scene.nums[j],
      )
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
      // The scene sizes its per-tile ref arrays once at mount from
      // `frames[0].scene.nums.length` (ArrayMemoryScene) — a trace that
      // changed length mid-run would index past them and write NaN into a
      // transform.
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

  it('optimized remembers every distinct value it walked past', () => {
    const last = optimized[optimized.length - 1]
    const stored = last.scene.slots.map((slot) => slot.key)

    // Never the same key twice — FlatView and LabelLayer both key slots by it,
    // so a collision would be a duplicate React key. This holds automatically
    // because the trace RETURNS on the first repeat, and asserting it on the
    // generated slots (rather than on `nums`) is what proves that.
    expect(stored).toEqual([...new Set(stored)])
    // Every slot's `value` is the index its key was first seen at.
    expect(last.scene.slots.every((slot) => nums[slot.value] === slot.key)).toBe(true)
  })

  it('sorted actually sorts, and never mutates the caller’s array', () => {
    const input = [...nums]
    const frames = traceSorted(input)
    const last = frames[frames.length - 1]

    expect(input, 'the generator mutated its argument').toEqual(nums)
    expect(last.scene.nums).toEqual([...nums].sort((a, b) => a - b))
    // Frame 0 is the array BEFORE the sort — that contrast is the frame's
    // entire reason to exist.
    expect(frames[0].scene.nums).toEqual(nums)
  })
})

describe('the shipped traces', () => {
  const headline = traces.cases[0]

  it('describes the example it was generated from', () => {
    expect(traces.example).toBe('nums = [4, 1, 9, 7, 3, 9]')
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

    expect(frames).toHaveLength(19)
    expect(last.scene.slots.length).toBeGreaterThanOrEqual(5)
    expect(last.scene.tiles).not.toContain('idle')
  })

  it('spends more steps on brute force than on the sorted walk', () => {
    // The headline case is chosen so all three approaches have a story: the
    // set fills up, brute force grinds through three anchors, and the sorted
    // walk is short because the sort did the work off-screen.
    expect(traces.build.brute(headline)).toHaveLength(17)
    expect(traces.build.sorted(headline)).toHaveLength(8)
  })

  it('agrees on the answer across all three shipped approaches', () => {
    expect(answerOf(traces.build.brute(headline))).toBe(true)
    expect(answerOf(traces.build.sorted(headline))).toBe(true)
    expect(answerOf(traces.build.optimized(headline))).toBe(true)
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
   * Constraint 1 from trace.ts, pinned so it cannot regress.
   *
   * The sorted trace's second frame IS the sort. If a case is already in
   * order, that frame reorders nothing and becomes a dead step — it would
   * still pass the scene-identity check (it also moves the cursor), which is
   * exactly why this needs its own assertion.
   */
  it.each(TEST_CASES)('$id is not already sorted', (input) => {
    expect(input.nums).not.toEqual([...input.nums].sort((a, b) => a - b))
  })

  it.each(TEST_CASES)('$id agrees on the answer across all approaches', (input) => {
    const expected = hasDuplicate(input.nums)
    expect(answerOf(traces.build.optimized(input))).toBe(expected)
    expect(answerOf(traces.build.sorted(input))).toBe(expected)
    expect(answerOf(traces.build.brute(input))).toBe(expected)
  })

  /**
   * No listing's final `return false` is ever an active line unless a case
   * with no duplicate ships — every other case returns early. This pins that:
   * at least one shipped case has to reach the exhausted branch, or those
   * lines (and their per-language lineMap entries) are dead.
   */
  it('reaches the exhausted return in all three listings', () => {
    const linesFor = (approach: 'optimized' | 'sorted' | 'brute') =>
      TEST_CASES.flatMap((input) =>
        traces.build[approach](input).map((frame) => frame.line),
      )

    expect(linesFor('optimized')).toContain(12)
    expect(linesFor('sorted')).toContain(10)
    expect(linesFor('brute')).toContain(10)
  })
})
