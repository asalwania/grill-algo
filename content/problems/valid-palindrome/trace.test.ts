import { describe, expect, it } from 'vitest'

import type { Approach, ArrayMemoryFrame } from '../../../lib/types'
import {
  BRUTE_LISTING,
  EXAMPLE_S,
  OPTIMIZED_LISTING,
  TEST_CASES,
  stringOf,
  traceBrute,
  traceOptimized,
  traces,
} from './trace'

type Case = { label: string; s: string }

/**
 * Every SHIPPED case (so the inputs the player can actually select are the
 * ones under test), plus a few extra that exercise branches no shipped case
 * reaches: a single character, two matching letters, two different letters,
 * and a string that is entirely punctuation.
 */
const CASES: Case[] = [
  ...TEST_CASES.map((input) => ({ label: input.label, s: stringOf(input) })),
  { label: 'single character', s: 'a' },
  { label: 'two matching letters', s: 'aa' },
  { label: 'two different letters', s: 'ab' },
  { label: 'entirely punctuation', s: '!!!' },
]

const APPROACHES: {
  name: Approach
  run: (s: string) => ArrayMemoryFrame[]
  listing: string
}[] = [
  { name: 'optimized', run: traceOptimized, listing: OPTIMIZED_LISTING },
  { name: 'brute', run: traceBrute, listing: BRUTE_LISTING },
]

/**
 * The answer as the PROBLEM asks it — a boolean.
 *
 * `result` is populated only on the SUCCESS path here (trace.ts's doc
 * comment explains why: `ArrayMemoryProblemView` derives its "found" pill
 * straight from `result !== null`, with no per-problem override, so this
 * problem has to point `result` the same direction Contains Duplicate's
 * does even though the decisive MISMATCH pair is the one that lights up
 * `'match'` tiles).
 */
const answerOf = (frames: ArrayMemoryFrame[]): boolean =>
  frames[frames.length - 1].scene.result !== null

/** Ground truth, computed independently of every generator under test. */
const isPalindromeTruth = (s: string): boolean => {
  const cleaned = [...s]
    .filter((ch) => /[a-z0-9]/i.test(ch))
    .map((ch) => ch.toLowerCase())
  return cleaned.join('') === cleaned.slice().reverse().join('')
}

describe.each(CASES)('$label — s="$s"', ({ s }) => {
  const optimized = traceOptimized(s)
  const brute = traceBrute(s)

  it('both approaches agree with each other', () => {
    expect(answerOf(brute)).toBe(answerOf(optimized))
  })

  it('and both agree with an independent check', () => {
    expect(answerOf(optimized)).toBe(isPalindromeTruth(s))
  })

  it('neither approach ever builds a memory structure', () => {
    for (const frame of [...optimized, ...brute]) {
      expect(frame.scene.slots).toEqual([])
      expect(frame.scene.probe).toBeNull()
    }
  })

  describe.each(APPROACHES)('$name', ({ run, listing }) => {
    const frames = run(s)
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

    it('carries one tile state per character in every frame', () => {
      for (const frame of frames) {
        expect(frame.scene.tiles).toHaveLength(frame.scene.nums.length)
      }
    })

    it('keeps the array LENGTH constant across the whole trace', () => {
      for (const frame of frames) {
        expect(frame.scene.nums).toHaveLength(s.length)
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

  it('reports labels matching the raw string, char for char', () => {
    for (const frame of [...optimized, ...brute]) {
      expect(frame.scene.labels).toEqual([...s])
    }
  })
})

describe('the shipped traces', () => {
  const headline = traces.cases[0]

  it('describes the example it was generated from', () => {
    expect(traces.example).toBe(`s = "${EXAMPLE_S}"`)
  })

  it('defaults to the canonical example', () => {
    expect(stringOf(headline)).toBe(EXAMPLE_S)
  })

  it('ships two approaches, best first, and no sorted tab', () => {
    expect(traces.approaches).toEqual(['optimized', 'brute'])
  })

  it('has no target — this problem takes only a string', () => {
    for (const input of traces.cases) {
      expect(input.target).toBeUndefined()
    }
    for (const frame of traces.build.optimized(headline)) {
      expect(frame.scene.target).toBeUndefined()
    }
  })

  /**
   * Pinned frame counts for the headline case (`pnpm traces`' own printed
   * numbers). The regression tripwire — if these ever move, something
   * about the staging changed.
   */
  it('produces the frame counts pnpm traces printed for the headline case', () => {
    expect(traces.build.optimized(headline)).toHaveLength(21)
    expect(traces.build.brute(headline)).toHaveLength(74)
  })

  it('agrees on the answer across both shipped approaches', () => {
    expect(answerOf(traces.build.brute(headline))).toBe(true)
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

  it.each(TEST_CASES)('$id agrees on the answer across both approaches', (input) => {
    const s = stringOf(input)
    const expected = isPalindromeTruth(s)
    expect(answerOf(traces.build.optimized(input))).toBe(expected)
    expect(answerOf(traces.build.brute(input))).toBe(expected)
  })

  /**
   * No listing's final `return true` is ever an active line unless a case
   * that reaches the end of the string ships — every mismatching case
   * returns early. This pins that: at least one shipped case has to reach
   * the exhausted branch, or those lines (and their per-language lineMap
   * entries) are dead.
   */
  it('reaches the final return in both listings', () => {
    const linesFor = (approach: 'optimized' | 'brute') =>
      TEST_CASES.flatMap((input) =>
        traces.build[approach](input).map((frame) => frame.line),
      )

    expect(linesFor('optimized')).toContain(18)
    expect(linesFor('brute')).toContain(17)
  })

  it('reaches the mismatch return in both listings', () => {
    const linesFor = (approach: 'optimized' | 'brute') =>
      TEST_CASES.flatMap((input) =>
        traces.build[approach](input).map((frame) => frame.line),
      )

    expect(linesFor('optimized')).toContain(11)
    expect(linesFor('brute')).toContain(13)
  })
})
