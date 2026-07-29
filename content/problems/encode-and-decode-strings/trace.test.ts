import { describe, expect, it } from 'vitest'

import type { Approach, ArrayMemoryFrame } from '../../../lib/types'
import {
  BRUTE_LISTING,
  EXAMPLE_STRS,
  OPTIMIZED_LISTING,
  TEST_CASES,
  packStrings,
  stringsOf,
  traceBrute,
  traceOptimized,
  traces,
  unpackStrings,
} from './trace'

type Case = { label: string; strs: string[] }

/**
 * Every SHIPPED case, plus a few extra that exercise branches no shipped case
 * reaches: a single string, one-character strings, a list whose data is
 * nothing but markers and digits, and two zero-length strings back to back.
 *
 * Every one of them has at least one character, because the payload IS the
 * tile row — a list that adds up to no characters has no scene at all, and
 * those inputs are covered by `paper.ts` instead.
 */
const CASES: Case[] = [
  ...TEST_CASES.map((input) => ({ label: input.label, strs: stringsOf(input) })),
  { label: 'a single string', strs: ['solo'] },
  { label: 'one-character strings', strs: ['a', 'b'] },
  { label: 'digits and markers as data', strs: ['##', '12', '#'] },
  { label: 'empty strings back to back', strs: ['x', '', '', 'y'] },
]

const APPROACHES: {
  name: Approach
  run: (strs: string[]) => ArrayMemoryFrame[]
  listing: string
}[] = [
  { name: 'optimized', run: traceOptimized, listing: OPTIMIZED_LISTING },
  { name: 'brute', run: traceBrute, listing: BRUTE_LISTING },
]

/** `["neet", "code"]` — the trace's own rendering of a list, mirrored here so
 *  the expected value is built independently of the generator's helper. */
const penList = (items: string[]): string =>
  items.length === 0 ? '[]' : `[${items.map((s) => `"${s}"`).join(', ')}]`

/**
 * The answer as the PROBLEM asks it — the decoded list, which is prose in the
 * variables panel because `scene.result` is a tile pair and cannot hold a list
 * (AGENTS.md keeps every word in the DOM).
 */
const answerOf = (frames: ArrayMemoryFrame[]): string =>
  String(frames[frames.length - 1].vars.decoded)

/**
 * Ground truth, computed by a codec that shares nothing with either generator:
 * a fixed FOUR-digit length in front of every string, no marker and no scan.
 */
function fixedEncode(strs: string[]): string {
  return strs.map((s) => String(s.length).padStart(4, '0') + s).join('')
}

function fixedDecode(encoded: string): string[] {
  const out: string[] = []
  let i = 0
  while (i < encoded.length) {
    const length = Number(encoded.slice(i, i + 4))
    out.push(encoded.slice(i + 4, i + 4 + length))
    i += 4 + length
  }
  return out
}

describe.each(CASES)('$label — $strs', ({ strs }) => {
  const optimized = traceOptimized(strs)
  const brute = traceBrute(strs)
  const payload = strs.join('')

  it('both approaches agree with each other', () => {
    expect(answerOf(brute)).toBe(answerOf(optimized))
  })

  it('and both agree with an independent fixed-width codec', () => {
    expect(answerOf(optimized)).toBe(penList(fixedDecode(fixedEncode(strs))))
    expect(answerOf(optimized)).toBe(penList(strs))
  })

  it('recovers the whole character row, and says so in `result`', () => {
    for (const frames of [optimized, brute]) {
      const last = frames[frames.length - 1]
      expect(last.scene.result).toEqual([0, payload.length - 1])
      expect(last.scene.tiles.every((tile) => tile === 'match')).toBe(true)
    }
  })

  describe.each(APPROACHES)('$name', ({ run, listing }) => {
    const frames = run(strs)
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

    it('carries one tile state and one label per element in every frame', () => {
      for (const frame of frames) {
        expect(frame.scene.tiles).toHaveLength(frame.scene.nums.length)
        expect(frame.scene.labels).toHaveLength(frame.scene.nums.length)
      }
    })

    it('keeps the character row constant — the payload, never the encoding', () => {
      for (const frame of frames) {
        expect(frame.scene.nums).toHaveLength(payload.length)
        expect(frame.scene.labels?.join('')).toBe(payload)
      }
    })

    it('carries the number of strings as the scene’s scalar', () => {
      for (const frame of frames) {
        expect(frame.scene.target).toBe(strs.length)
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

    it('gives every wall slot a unique key — both renderers key React on it', () => {
      for (const frame of frames) {
        const keys = frame.scene.slots.map((slot) => slot.key)
        expect(new Set(keys).size).toBe(keys.length)
      }
    })

    it('records one piece per string, each holding that string’s real length', () => {
      const last = frames[frames.length - 1]
      expect(last.scene.slots.map((slot) => slot.value)).toEqual(
        strs.map((s) => s.length),
      )
      for (const slot of last.scene.slots) {
        expect(slot.keyLabel?.trim()).not.toBe('')
      }
    })

    it('never points the cursor outside the character row', () => {
      for (const frame of frames) {
        if (frame.scene.cursor === null) continue
        expect(frame.scene.cursor).toBeGreaterThanOrEqual(0)
        expect(frame.scene.cursor).toBeLessThan(frame.scene.nums.length)
      }
    })
  })

  it('brute is the longer trace — same complexity, more bookkeeping', () => {
    expect(brute.length).toBeGreaterThan(optimized.length)
  })
})

describe('the packing', () => {
  it('round-trips every shipped case through the problem’s own encoding', () => {
    for (const input of TEST_CASES) {
      const strs = stringsOf(input)
      expect([...packStrings(strs)].map((ch) => ch.charCodeAt(0))).toEqual(input.nums)
    }
  })

  it('survives markers, digits, empty strings and the empty list', () => {
    for (const strs of [
      [],
      [''],
      ['', ''],
      ['#'],
      ['12#34', ''],
      ['a'.repeat(120), 'b'],
    ]) {
      expect(unpackStrings(packStrings(strs))).toEqual(strs)
    }
  })
})

describe('the shipped traces', () => {
  const headline = traces.cases[0]

  it('describes the example it was generated from', () => {
    expect(traces.example).toBe(`strs = ${penList(EXAMPLE_STRS)}`)
  })

  it('defaults to the canonical example', () => {
    expect(stringsOf(headline)).toEqual(EXAMPLE_STRS)
  })

  it('ships two approaches, best first, and no sorted tab', () => {
    expect(traces.approaches).toEqual(['optimized', 'brute'])
  })

  /**
   * The regression tripwire. Whatever `pnpm traces` prints goes here — a
   * surprising number means the staging changed, not that the algorithm did.
   */
  it('pins the headline frame counts', () => {
    expect(traces.build.optimized(headline)).toHaveLength(24)
    expect(traces.build.brute(headline)).toHaveLength(27)
  })

  it('fills the wall and lights every tile before the answer lands', () => {
    for (const approach of ['optimized', 'brute'] as const) {
      const frames = traces.build[approach](headline)
      const last = frames[frames.length - 1]
      expect(last.scene.slots).toHaveLength(EXAMPLE_STRS.length)
      expect(last.scene.tiles).not.toContain('idle')
    }
  })
})

describe('the playable cases', () => {
  it('offers at least three inputs, each with a unique id', () => {
    expect(traces.cases.length).toBeGreaterThanOrEqual(3)
    expect(new Set(traces.cases.map((input) => input.id)).size).toBe(
      traces.cases.length,
    )
  })

  it.each(TEST_CASES)('$id round-trips under both approaches', (input) => {
    const strs = stringsOf(input)
    const expected = penList(fixedDecode(fixedEncode(strs)))
    expect(answerOf(traces.build.optimized(input))).toBe(expected)
    expect(answerOf(traces.build.brute(input))).toBe(expected)
  })

  it.each(TEST_CASES)('$id has characters for the scene to render', (input) => {
    // The payload is the tile row, so a case adding up to nothing has no
    // scene. Those inputs live on the paper sheet (paper.ts) by design.
    expect(stringsOf(input).join('').length).toBeGreaterThan(0)
  })

  /**
   * Every branch worth reaching needs a shipped case to reach it, or the line
   * (and its per-language lineMap entry) is dead:
   *   - the delimiter appearing inside the data,
   *   - a length that takes more than one digit,
   *   - a string of length zero,
   *   - and, for both listings, the terminal `return` of BOTH methods.
   */
  it('reaches every branch across the shipped cases', () => {
    const lists = TEST_CASES.map(stringsOf)

    expect(lists.some((strs) => strs.some((s) => s.includes('#')))).toBe(true)
    expect(lists.some((strs) => strs.some((s) => s.length >= 10))).toBe(true)
    expect(lists.some((strs) => strs.some((s) => s.length === 0))).toBe(true)

    const linesFor = (approach: 'optimized' | 'brute') =>
      TEST_CASES.flatMap((input) =>
        traces.build[approach](input).map((frame) => frame.line),
      )

    // encode's `return` and decode's `return`, in each listing.
    expect(linesFor('optimized')).toEqual(expect.arrayContaining([7, 24]))
    expect(linesFor('brute')).toEqual(expect.arrayContaining([13, 34]))
  })
})
