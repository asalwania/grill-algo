import { describe, expect, it } from 'vitest'

import type { Approach, ArrayMemoryFrame } from '../../../lib/types'
import {
  BRUTE_LISTING,
  EXAMPLE_K,
  EXAMPLE_NUMS,
  OPTIMIZED_LISTING,
  SORTED_LISTING,
  TEST_CASES,
  kOf,
  traceBrute,
  traceOptimized,
  traceSorted,
  traces,
} from './trace'

type Case = { label: string; nums: number[]; k: number }

/**
 * Every SHIPPED case, plus a few that exercise shapes no shipped case reaches:
 * a single element (nothing to compare it to), an array of one value repeated,
 * two elements with k equal to both, and a k of 1 over an already-ascending
 * array — which is the input the sorted approach's one sort frame cannot
 * reorder.
 */
const CASES: Case[] = [
  ...TEST_CASES.map((input) => ({
    label: input.label,
    nums: input.nums,
    k: kOf(input),
  })),
  { label: 'a single element', nums: [5], k: 1 },
  { label: 'one value, three times', nums: [4, 4, 4], k: 1 },
  { label: 'two elements, k of two', nums: [1, 2], k: 2 },
  { label: 'already ascending', nums: [2, 6, 6], k: 1 },
]

const APPROACHES: {
  name: Approach
  run: (nums: number[], k: number) => ArrayMemoryFrame[]
  listing: string
}[] = [
  { name: 'optimized', run: traceOptimized, listing: OPTIMIZED_LISTING },
  { name: 'sorted', run: traceSorted, listing: SORTED_LISTING },
  { name: 'brute', run: traceBrute, listing: BRUTE_LISTING },
]

/**
 * The answer as the PROBLEM asks it — the k values, read off the last frame's
 * `vars.result`, which is where the DOM shows them (AGENTS.md keeps every
 * number out of the canvas, so this string IS the rendered answer).
 */
const answerOf = (frames: ArrayMemoryFrame[]): number[] => {
  const text = String(frames[frames.length - 1].vars.result)
  const inner = text.slice(1, -1).trim()
  return inner === '' ? [] : inner.split(', ').map(Number)
}

/** Ground truth, computed independently of every generator under test. */
const countsOf = (nums: number[]): Map<number, number> => {
  const counts = new Map<number, number>()
  for (const num of nums) counts.set(num, (counts.get(num) ?? 0) + 1)
  return counts
}

/**
 * The k largest counts, descending. This — not a specific list of values — is
 * what an answer has to match: the problem allows any order, and when counts
 * TIE it also allows a different set. The `no-answer` case is entirely ties, so
 * `sorted` legitimately returns `[4, 6, 9]` where `optimized` returns
 * `[9, 4, 6]`; both are correct and this is the property that says so.
 */
const topCounts = (nums: number[], k: number): number[] =>
  [...countsOf(nums).values()].sort((a, b) => b - a).slice(0, k)

/** Asserts one approach's answer really is A valid top-k for this input. */
function expectValidAnswer(answer: number[], nums: number[], k: number): void {
  const counts = countsOf(nums)

  expect(answer).toHaveLength(k)
  expect(new Set(answer).size, `${answer} repeats a value`).toBe(k)
  for (const value of answer) {
    expect(counts.has(value), `${value} is not in the array`).toBe(true)
  }

  const chosen = answer.map((value) => counts.get(value)!).sort((a, b) => b - a)
  expect(chosen).toEqual(topCounts(nums, k))
}

describe.each(CASES)('$label — $nums, k = $k', ({ nums, k }) => {
  const optimized = traceOptimized(nums, k)
  const sorted = traceSorted(nums, k)
  const brute = traceBrute(nums, k)

  it('every approach returns a valid top k', () => {
    expectValidAnswer(answerOf(optimized), nums, k)
    expectValidAnswer(answerOf(sorted), nums, k)
    expectValidAnswer(answerOf(brute), nums, k)
  })

  it('all three agree on the counts they picked, if not always the values', () => {
    const counts = countsOf(nums)
    const shape = (frames: ArrayMemoryFrame[]) =>
      answerOf(frames)
        .map((value) => counts.get(value)!)
        .sort((a, b) => b - a)

    expect(shape(sorted)).toEqual(shape(optimized))
    expect(shape(brute)).toEqual(shape(optimized))
  })

  /**
   * `scene.result` is the tile span the answer covers after the final frame's
   * relayout — so its width has to be the total number of occurrences of the
   * chosen values, and it is null exactly when nothing repeated.
   */
  it('reports the same answer span from every approach', () => {
    const counts = countsOf(nums)
    const repeats = [...counts.values()].some((count) => count > 1)

    for (const frames of [optimized, sorted, brute]) {
      const { result } = frames[frames.length - 1].scene
      if (!repeats) {
        expect(result).toBeNull()
        continue
      }
      const width = answerOf(frames).reduce(
        (sum, value) => sum + counts.get(value)!,
        0,
      )
      expect(result).toEqual([0, width - 1])
    }
  })

  it('lays the chosen values out contiguously at the front of the final frame', () => {
    for (const frames of [optimized, sorted, brute]) {
      const last = frames[frames.length - 1].scene
      const answer = new Set(answerOf(frames))
      const front = last.nums.filter((value) => answer.has(value))

      // Every chosen occurrence sits ahead of every rejected one …
      expect(last.nums.slice(0, front.length)).toEqual(front)
      // … and the tiles painted 'match' are exactly that prefix.
      expect(last.tiles.filter((tile) => tile === 'match')).toHaveLength(
        front.length,
      )
      expect(last.tiles.slice(0, front.length).every((t) => t === 'match')).toBe(
        true,
      )
    }
  })

  describe.each(APPROACHES)('$name', ({ run, listing }) => {
    const frames = run(nums, k)
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

    it('carries one tile state per element in every frame', () => {
      for (const frame of frames) {
        expect(frame.scene.tiles).toHaveLength(frame.scene.nums.length)
      }
    })

    it('keeps the array LENGTH constant and its contents a permutation', () => {
      const expected = [...nums].sort((a, b) => a - b)
      for (const frame of frames) {
        expect(frame.scene.nums).toHaveLength(nums.length)
        expect([...frame.scene.nums].sort((a, b) => a - b)).toEqual(expected)
      }
    })

    it('carries k as the scene scalar on every frame', () => {
      for (const frame of frames) {
        expect(frame.scene.target).toBe(k)
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

    it('never mutates the caller’s array, only its own copy', () => {
      const before = [...nums]
      run(nums, k)
      expect(nums).toEqual(before)
    })
  })

  it('only the optimized approach builds a memory structure', () => {
    for (const frame of [...sorted, ...brute]) {
      expect(frame.scene.slots).toEqual([])
      expect(frame.scene.probe).toBeNull()
    }
  })

  it('keeps one slot per value, holding that value’s true count', () => {
    const counts = countsOf(nums)

    for (const frame of optimized) {
      const keys = frame.scene.slots.map((slot) => slot.key)
      expect(new Set(keys).size).toBe(keys.length)

      for (const slot of frame.scene.slots) {
        expect(counts.has(slot.key), `${slot.key} is not in the array`).toBe(true)
        // A count in progress never exceeds the value's true total.
        expect(slot.value).toBeGreaterThan(0)
        expect(slot.value).toBeLessThanOrEqual(counts.get(slot.key)!)
      }
    }

    // By the end every element has been counted exactly once, across all slots.
    const last = optimized[optimized.length - 1].scene
    expect(last.slots).toHaveLength(counts.size)
    expect(last.slots.reduce((sum, slot) => sum + slot.value, 0)).toBe(nums.length)
  })

  it('leaves the wall ranked by count, highest first', () => {
    const last = optimized[optimized.length - 1].scene
    const values = last.slots.map((slot) => slot.value)
    expect(values).toEqual([...values].sort((a, b) => b - a))
  })
})

describe('the shipped traces', () => {
  const headline = traces.cases[0]

  it('describes the example it was generated from', () => {
    expect(traces.example).toBe(
      `nums = [${EXAMPLE_NUMS.join(', ')}], k = ${EXAMPLE_K}`,
    )
  })

  it('defaults to the canonical example', () => {
    expect(headline.nums).toEqual(EXAMPLE_NUMS)
    expect(kOf(headline)).toBe(EXAMPLE_K)
  })

  it('ships three approaches, best first', () => {
    expect(traces.approaches).toEqual(['optimized', 'sorted', 'brute'])
  })

  /**
   * The regression tripwire — whatever `pnpm traces` prints for the headline
   * case. Note the ordering: `sorted` is the SHORTEST of the three, because the
   * comparisons that make it work happen inside its two sort frames, off
   * screen. The step counter is not the complexity story.
   */
  it('pins the headline frame counts', () => {
    expect(traces.build.optimized(headline)).toHaveLength(23)
    expect(traces.build.sorted(headline)).toHaveLength(16)
    expect(traces.build.brute(headline)).toHaveLength(22)
  })

  it('fills the wall and touches every tile before the answer lands', () => {
    const frames = traces.build.optimized(headline)
    const last = frames[frames.length - 1]

    expect(last.scene.slots).toHaveLength(3)
    expect(last.scene.tiles).not.toContain('idle')
  })
})

describe('the playable cases', () => {
  it('offers at least three inputs, each with a unique id', () => {
    expect(traces.cases.length).toBeGreaterThanOrEqual(3)
    expect(new Set(traces.cases.map((input) => input.id)).size).toBe(
      traces.cases.length,
    )
  })

  it.each(TEST_CASES)('$id names a k the problem allows', (input) => {
    const k = kOf(input)
    expect(k).toBeGreaterThanOrEqual(1)
    expect(k).toBeLessThanOrEqual(countsOf(input.nums).size)
  })

  it.each(TEST_CASES)('$id returns a valid top k from every approach', (input) => {
    const k = kOf(input)
    for (const build of [
      traces.build.optimized,
      traces.build.sorted,
      traces.build.brute,
    ]) {
      expectValidAnswer(answerOf(build(input)), input.nums, k)
    }
  })

  /**
   * The `sorted` approach spends exactly one frame on its array sort, so an
   * input that is already ascending would make that frame reorder nothing and
   * read as a dead step. It would still pass the scene-identity check (the
   * frame also moves the cursor), which is why this needs its own assertion.
   */
  it.each(TEST_CASES)('$id is not already in ascending order', (input) => {
    const ascending = [...input.nums].sort((a, b) => a - b)
    expect(input.nums).not.toEqual(ascending)
  })

  /**
   * Every branch needs at least one shipped case to reach it, or the line (and
   * its per-language lineMap entry) is dead: a first sighting vs a repeat for
   * the map, extending a run vs starting one for the sweep — and, for all
   * three, the terminal `return`.
   */
  it('reaches every branch across the shipped cases', () => {
    const linesFor = (approach: 'optimized' | 'sorted' | 'brute') =>
      TEST_CASES.flatMap((input) =>
        traces.build[approach](input).map((frame) => frame.line),
      )

    expect(linesFor('optimized')).toEqual(
      expect.arrayContaining([2, 4, 5, 6, 11, 17, 22]),
    )
    expect(linesFor('sorted')).toEqual(
      expect.arrayContaining([2, 3, 6, 8, 10, 14, 16]),
    )
    expect(linesFor('brute')).toEqual(expect.arrayContaining([2, 8, 13, 22, 25]))
  })

  it('ships one case where nothing repeats and others where something does', () => {
    const results = TEST_CASES.map((input) => {
      const frames = traces.build.optimized(input)
      return frames[frames.length - 1].scene.result
    })

    // `result === null` is what the picker reads as "not found", and what
    // suppresses the flat view's return chip.
    expect(results.filter((result) => result === null)).toHaveLength(1)
    expect(results.filter((result) => result !== null).length).toBeGreaterThan(0)
  })

  it('the "no-answer" case is the one where nothing repeats', () => {
    const input = TEST_CASES.find((entry) => entry.id === 'no-answer')!
    const frames = traces.build.optimized(input)
    const last = frames[frames.length - 1].scene

    expect(last.result).toBeNull()
    expect(last.slots).toHaveLength(input.nums.length)
    expect(last.slots.every((slot) => slot.value === 1)).toBe(true)
  })

  it('the "late-answer" case is only decided by its final element', () => {
    const input = TEST_CASES.find((entry) => entry.id === 'late-answer')!
    const counts = countsOf(input.nums)
    const winner = answerOf(traces.build.optimized(input))[0]

    // Drop the last element and the lead is shared — which is what makes the
    // run read as undecided until the very end.
    const without = countsOf(input.nums.slice(0, -1))
    const best = Math.max(...without.values())
    expect([...without.values()].filter((count) => count === best).length).toBe(2)
    expect(counts.get(winner)).toBe(best + 1)
  })

  it('the "first-pair" case repeats on its second element', () => {
    const input = TEST_CASES.find((entry) => entry.id === 'first-pair')!
    expect(input.nums[1]).toBe(input.nums[0])
  })
})
