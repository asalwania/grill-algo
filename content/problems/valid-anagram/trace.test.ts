import { describe, expect, it } from 'vitest'

import type { Approach, ArrayMemoryFrame } from '../../../lib/types'
import {
  BRUTE_LISTING,
  EXAMPLE_S,
  EXAMPLE_T,
  OPTIMIZED_LISTING,
  SORTED_LISTING,
  TEST_CASES,
  splitCase,
  traceBrute,
  traceOptimized,
  traceSorted,
  traces,
} from './trace'

type Case = { label: string; s: string; t: string }

/**
 * Every SHIPPED case, plus a few extra that exercise branches no shipped
 * case reaches: a single-letter pair, two disjoint-alphabet strings, and an
 * anagram whose repeated letters split unevenly across positions.
 */
const CASES: Case[] = [
  ...TEST_CASES.map((input) => ({ label: input.label, ...splitCase(input) })),
  { label: 'single letter, match', s: 'a', t: 'a' },
  { label: 'single letter, no match', s: 'a', t: 'b' },
  { label: 'heavier repeats', s: 'aaabbbccc', t: 'cbaabcabc' },
]

const APPROACHES: {
  name: Approach
  run: (s: string, t: string) => ArrayMemoryFrame[]
  listing: string
}[] = [
  { name: 'optimized', run: traceOptimized, listing: OPTIMIZED_LISTING },
  { name: 'sorted', run: traceSorted, listing: SORTED_LISTING },
  { name: 'brute', run: traceBrute, listing: BRUTE_LISTING },
]

/** The answer as the PROBLEM asks it — a boolean, read the same way every
 *  other problem in the family reads a boolean out of `result`. */
const answerOf = (frames: ArrayMemoryFrame[]): boolean =>
  frames[frames.length - 1].scene.result !== null

/** Ground truth, computed independently of every generator under test. */
const isAnagram = (s: string, t: string): boolean => {
  if (s.length !== t.length) return false
  const counts = new Map<string, number>()
  for (const ch of s) counts.set(ch, (counts.get(ch) ?? 0) + 1)
  for (const ch of t) {
    const count = counts.get(ch)
    if (!count) return false
    counts.set(ch, count - 1)
  }
  return true
}

describe.each(CASES)('$label — s="$s" t="$t"', ({ s, t }) => {
  const optimized = traceOptimized(s, t)
  const sorted = traceSorted(s, t)
  const brute = traceBrute(s, t)

  it('all three approaches agree with each other', () => {
    expect(answerOf(sorted)).toBe(answerOf(optimized))
    expect(answerOf(brute)).toBe(answerOf(optimized))
  })

  it('and all three agree with an independent check', () => {
    expect(answerOf(optimized)).toBe(isAnagram(s, t))
  })

  describe.each(APPROACHES)('$name', ({ run, listing }) => {
    const frames = run(s, t)
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

    it('carries one label per element, matching nums length', () => {
      for (const frame of frames) {
        expect(frame.scene.labels).toHaveLength(frame.scene.nums.length)
      }
    })

    it('keeps the array LENGTH constant at s.length + t.length', () => {
      for (const frame of frames) {
        expect(frame.scene.nums).toHaveLength(s.length + t.length)
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

  it('sorted never mutates the caller’s strings, only its own copy', () => {
    const before = { s, t }
    traceSorted(s, t)
    expect({ s, t }).toEqual(before)
  })
})

describe('the shipped traces', () => {
  const headline = traces.cases[0]

  it('describes the example it was generated from', () => {
    expect(traces.example).toBe(`s = "${EXAMPLE_S}", t = "${EXAMPLE_T}"`)
  })

  it('defaults to the canonical example', () => {
    expect(splitCase(headline)).toEqual({ s: EXAMPLE_S, t: EXAMPLE_T })
  })

  it('ships three approaches, best first', () => {
    expect(traces.approaches).toEqual(['optimized', 'sorted', 'brute'])
  })

  it('agrees on the answer across all three shipped approaches', () => {
    expect(answerOf(traces.build.brute(headline))).toBe(true)
    expect(answerOf(traces.build.sorted(headline))).toBe(true)
    expect(answerOf(traces.build.optimized(headline))).toBe(true)
  })

  it('fills the count map and touches every tile before the answer lands', () => {
    const frames = traces.build.optimized(headline)
    const last = frames[frames.length - 1]

    expect(last.scene.slots.length).toBeGreaterThan(0)
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

  it.each(TEST_CASES)('$id agrees on the answer across all approaches', (input) => {
    const { s, t } = splitCase(input)
    const expected = isAnagram(s, t)
    expect(answerOf(traces.build.optimized(input))).toBe(expected)
    expect(answerOf(traces.build.sorted(input))).toBe(expected)
    expect(answerOf(traces.build.brute(input))).toBe(expected)
  })

  /**
   * Every branch this problem can take needs at least one shipped case to
   * reach it, or the line (and its per-language lineMap entry) is dead:
   *   - the length-mismatch short-circuit,
   *   - a letter t has that s never had (map miss),
   *   - a letter t asks for one too many times (map hit, count already 0),
   *   - the full success path.
   */
  it('reaches every branch across the shipped cases', () => {
    const linesFor = (approach: 'optimized' | 'sorted' | 'brute') =>
      TEST_CASES.flatMap((input) =>
        traces.build[approach](input).map((frame) => frame.line),
      )

    expect(linesFor('optimized')).toEqual(
      expect.arrayContaining([3, 15, 21]),
    )
    expect(linesFor('sorted')).toEqual(expect.arrayContaining([3, 11, 15]))
    expect(linesFor('brute')).toEqual(expect.arrayContaining([3, 20, 24]))

    const answers = TEST_CASES.map((input) => answerOf(traces.build.optimized(input)))
    expect(answers).toContain(true)
    expect(answers).toContain(false)
  })

  it('the "runs out" case misses on a count already at zero, not a missing key', () => {
    const input = TEST_CASES.find((c) => c.id === 'runs-out')!
    const frames = traces.build.optimized(input)
    const last = frames[frames.length - 1]

    // The failing lookup's key IS in the map (it was counted from s) —
    // distinguishing this from 'not-in-s', where the key is absent entirely.
    const { t } = splitCase(input)
    const failingLetter = t[t.length - 1].charCodeAt(0)
    expect(last.scene.slots.some((slot) => slot.key === failingLetter)).toBe(true)
  })
})
