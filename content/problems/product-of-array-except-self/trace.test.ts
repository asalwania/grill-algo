import { describe, expect, it } from 'vitest'

import type { Approach, ArrayMemoryFrame } from '../../../lib/types'
import {
  BRUTE_LISTING,
  EXAMPLE_NUMS,
  OPTIMIZED_LISTING,
  TEST_CASES,
  traceBrute,
  traceOptimized,
  traces,
} from './trace'

type Case = { label: string; nums: number[] }

/**
 * Every SHIPPED case, plus a few extras that reach shapes no shipped case does:
 * a single element, a pair, a small array with a zero, and a run of repeats
 * with negatives. Each has at least one element — the tile row IS the input, so
 * the empty array has no scene and lives on `paper.ts` instead.
 *
 * The extras are deliberately NOT all length four, which is why the "brute is
 * the longer trace" check below is scoped to the shipped cases: n² only
 * overtakes 2n once n is past three, so a length-two brute is legitimately the
 * shorter one.
 */
const CASES: Case[] = [
  ...TEST_CASES.map((input) => ({ label: input.label, nums: input.nums })),
  { label: 'a single element', nums: [7] },
  { label: 'a pair', nums: [3, 5] },
  { label: 'a small array with a zero', nums: [4, 0, 5] },
  { label: 'repeats and negatives', nums: [-1, 1, -1, 1] },
]

const APPROACHES: {
  name: Approach
  run: (nums: number[]) => ArrayMemoryFrame[]
  listing: string
}[] = [
  { name: 'optimized', run: traceOptimized, listing: OPTIMIZED_LISTING },
  { name: 'brute', run: traceBrute, listing: BRUTE_LISTING },
]

/** `[60, 40, 30, 24]` — the trace's own rendering of the finished answer,
 *  mirrored here so the expected value is built independently of the generator. */
const penList = (values: number[]): string => `[${values.join(', ')}]`

/**
 * Ground truth, by a method that shares nothing with either generator: a plain
 * nested loop. O(n²), and it is allowed to be — it is here to be obviously
 * correct, not fast.
 */
function nestedProductExceptSelf(nums: number[]): number[] {
  return nums.map((_, i) =>
    nums.reduce((product, value, j) => (j === i ? product : product * value), 1),
  )
}

/** The answer as the PROBLEM asks it — the finished array, which is prose in
 *  the variables panel because `scene.result` is a tile pair (AGENTS.md keeps
 *  every number in the DOM). */
const answerOf = (frames: ArrayMemoryFrame[]): string =>
  String(frames[frames.length - 1].vars.answer)

describe.each(CASES)('$label — $nums', ({ nums }) => {
  const optimized = traceOptimized(nums)
  const brute = traceBrute(nums)
  const truth = nestedProductExceptSelf(nums)

  it('both approaches agree with each other', () => {
    expect(answerOf(brute)).toBe(answerOf(optimized))
  })

  it('and both agree with an independent nested-loop solve', () => {
    expect(answerOf(optimized)).toBe(penList(truth))
  })

  it('leaves the true product of all others in every wall slot', () => {
    for (const frames of [optimized, brute]) {
      const last = frames[frames.length - 1]
      expect(last.scene.slots.map((slot) => slot.value)).toEqual(truth)
    }
  })

  it('covers the whole array in `result`, and lights every tile', () => {
    for (const frames of [optimized, brute]) {
      const last = frames[frames.length - 1]
      expect(last.scene.result).toEqual([0, nums.length - 1])
      expect(last.scene.tiles.every((tile) => tile === 'match')).toBe(true)
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

    it('carries one tile state per element in every frame, and no labels', () => {
      for (const frame of frames) {
        expect(frame.scene.tiles).toHaveLength(frame.scene.nums.length)
        expect(frame.scene.labels).toBeUndefined()
      }
    })

    it('keeps the array constant — nothing is reordered', () => {
      for (const frame of frames) {
        expect(frame.scene.nums).toEqual(nums)
      }
    })

    it('carries no scalar — the array is the whole input', () => {
      for (const frame of frames) {
        expect(frame.scene.target).toBeUndefined()
      }
    })

    it('never looks anything up — probe is null on every frame', () => {
      for (const frame of frames) {
        expect(frame.scene.probe).toBeNull()
      }
    })

    it('numbers frames consecutively from zero and flashes nothing on the first', () => {
      expect(frames.map((frame) => frame.step)).toEqual(frames.map((_, i) => i))
      expect(frames[0].changed).toEqual([])
    })

    it('reports a non-empty changed[] on every frame after the first', () => {
      for (const frame of frames.slice(1)) {
        expect(
          frame.changed.length,
          `frame ${frame.step} changed nothing`,
        ).toBeGreaterThan(0)
      }
    })

    it('gives every wall slot a unique key that is a real index', () => {
      for (const frame of frames) {
        const keys = frame.scene.slots.map((slot) => slot.key)
        expect(new Set(keys).size).toBe(keys.length)
        for (const key of keys) {
          expect(key).toBeGreaterThanOrEqual(0)
          expect(key).toBeLessThan(nums.length)
        }
      }
    })

    it('never points the cursor outside the array', () => {
      for (const frame of frames) {
        if (frame.scene.cursor === null) continue
        expect(frame.scene.cursor).toBeGreaterThanOrEqual(0)
        expect(frame.scene.cursor).toBeLessThan(frame.scene.nums.length)
      }
    })
  })
})

describe('the shipped traces', () => {
  const headline = traces.cases[0]

  it('describes the example it was generated from', () => {
    expect(traces.example).toBe(`nums = [${EXAMPLE_NUMS.join(', ')}]`)
  })

  it('defaults to the canonical example', () => {
    expect(headline.nums).toEqual(EXAMPLE_NUMS)
  })

  it('ships two approaches, best first, and no sorted tab', () => {
    expect(traces.approaches).toEqual(['optimized', 'brute'])
  })

  /**
   * The regression tripwire. Whatever `pnpm traces` prints goes here — a
   * surprising number means the staging changed, not that the algorithm did.
   * The counts depend only on n (all shipped cases are length four): optimized
   * is 4n + 3, brute is n² + n + 2.
   */
  it('pins the headline frame counts', () => {
    expect(traces.build.optimized(headline)).toHaveLength(19)
    expect(traces.build.brute(headline)).toHaveLength(22)
  })

  it('makes brute the longer trace on every shipped case', () => {
    for (const input of TEST_CASES) {
      expect(traces.build.brute(input).length).toBeGreaterThan(
        traces.build.optimized(input).length,
      )
    }
  })

  it('reaches the terminal return of both listings across the shipped cases', () => {
    const linesFor = (approach: 'optimized' | 'brute') =>
      TEST_CASES.flatMap((input) =>
        traces.build[approach](input).map((frame) => frame.line),
      )
    expect(linesFor('optimized')).toContain(17)
    expect(linesFor('brute')).toContain(14)
  })
})

describe('the playable cases', () => {
  it('offers at least three inputs, each with a unique id', () => {
    expect(traces.cases.length).toBeGreaterThanOrEqual(3)
    expect(new Set(traces.cases.map((input) => input.id)).size).toBe(
      traces.cases.length,
    )
  })

  it('carries no scalar on any shipped case', () => {
    for (const input of TEST_CASES) expect(input.target).toBeUndefined()
  })

  /**
   * Every branch worth reaching needs a shipped case to reach it: a clean
   * multiply with no zeros, a single zero (the reason division is banned), more
   * than one zero, and negatives.
   */
  it('reaches the inputs that teach the edge cases', () => {
    const arrays = TEST_CASES.map((input) => input.nums)
    expect(arrays.some((nums) => nums.every((v) => v !== 0))).toBe(true)
    expect(arrays.some((nums) => nums.filter((v) => v === 0).length === 1)).toBe(true)
    expect(arrays.some((nums) => nums.filter((v) => v === 0).length >= 2)).toBe(true)
    expect(arrays.some((nums) => nums.some((v) => v < 0))).toBe(true)
  })
})
