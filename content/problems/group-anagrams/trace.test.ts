import { describe, expect, it } from 'vitest'

import type { Approach, ArrayMemoryFrame } from '../../../lib/types'
import {
  BRUTE_LISTING,
  EXAMPLE_WORDS,
  OPTIMIZED_LISTING,
  SORTED_LISTING,
  TEST_CASES,
  countKeyOf,
  countLabelOf,
  decodeWord,
  encodeWord,
  signatureOf,
  traceBrute,
  traceOptimized,
  traceSorted,
  traces,
  wordsOf,
} from './trace'

type Case = { label: string; words: string[] }

/**
 * Every SHIPPED case, plus a few that exercise shapes no shipped case reaches:
 * a single word (nothing to compare it to), two words that group immediately,
 * and a list where every word is the same string.
 */
const CASES: Case[] = [
  ...TEST_CASES.map((input) => ({ label: input.label, words: wordsOf(input) })),
  { label: 'a single word', words: ['solo'] },
  { label: 'two words, one group', words: ['ab', 'ba'] },
  { label: 'the same word twice', words: ['ab', 'ab'] },
]

const APPROACHES: {
  name: Approach
  run: (words: string[]) => ArrayMemoryFrame[]
  listing: string
}[] = [
  { name: 'optimized', run: traceOptimized, listing: OPTIMIZED_LISTING },
  { name: 'sorted', run: traceSorted, listing: SORTED_LISTING },
  { name: 'brute', run: traceBrute, listing: BRUTE_LISTING },
]

/**
 * The answer as the PROBLEM asks it — the partition itself, read off the last
 * frame's `vars.groups`, which is where the DOM shows it (AGENTS.md keeps every
 * word out of the canvas, so this string IS the rendered answer).
 */
const answerOf = (frames: ArrayMemoryFrame[]): string[][] => {
  const text = String(frames[frames.length - 1].vars.groups)
  return [...text.matchAll(/\[([^[\]]*)\]/g)].map((match) =>
    match[1].split(', ').filter((word) => word !== ''),
  )
}

/** The problem allows any order, for the groups and within them — so two
 *  answers agree when they are the same SET of sets. */
const canonical = (groups: string[][]): string =>
  JSON.stringify(
    groups
      .map((group) => [...group].sort())
      .sort((a, b) => (a.join() < b.join() ? -1 : 1)),
  )

/** Ground truth, computed independently of every generator under test. */
const groupAnagrams = (words: string[]): string[][] => {
  const byKey = new Map<string, string[]>()
  for (const word of words) {
    const key = [...word].sort().join('')
    const group = byKey.get(key)
    if (group) group.push(word)
    else byKey.set(key, [word])
  }
  return [...byKey.values()]
}

/** The size of the biggest group, which is what `scene.result` spans — or 0
 *  when nothing grouped and `result` is null. */
const biggestGroup = (groups: string[][]): number => {
  const largest = Math.max(...groups.map((group) => group.length))
  return largest > 1 ? largest : 0
}

describe('packing words into the numeric scene', () => {
  it('round-trips every word any shipped case uses', () => {
    for (const input of TEST_CASES) {
      for (const word of wordsOf(input)) {
        expect(decodeWord(encodeWord(word))).toBe(word)
      }
    }
  })

  it('never collides a word with a shorter one sharing its tail', () => {
    // The reason the base is 27 and not 26: 'a' packs to 1, 'aa' to 28.
    expect(encodeWord('a')).not.toBe(encodeWord('aa'))
    expect(encodeWord('at')).not.toBe(encodeWord('bat'))
  })

  /**
   * The optimized approach keys on letter COUNTS, not on a sorted signature —
   * that is the whole difference between it and the `sorted` tab. The two
   * agree on which words group (they must, or the approaches would disagree),
   * so this pins the equivalence rather than assuming it.
   */
  it('reaches the same groups by counting as by sorting', () => {
    const words = ['eat', 'tea', 'tan', 'ate', 'nat', 'bat', 'aab', 'aba', 'abb']
    for (const a of words) {
      for (const b of words) {
        expect(countKeyOf(a) === countKeyOf(b)).toBe(signatureOf(a) === signatureOf(b))
      }
    }
  })

  it('renders a count key compactly, without twenty-two zeros', () => {
    expect(countLabelOf('eat')).toBe('a1 e1 t1')
    expect(countLabelOf('aab')).toBe('a2 b1')
    expect(countKeyOf('eat').split(',')).toHaveLength(26)
  })
})

describe.each(CASES)('$label — $words', ({ words }) => {
  const optimized = traceOptimized(words)
  const sorted = traceSorted(words)
  const brute = traceBrute(words)

  it('all three approaches agree with each other', () => {
    expect(canonical(answerOf(sorted))).toBe(canonical(answerOf(optimized)))
    expect(canonical(answerOf(brute))).toBe(canonical(answerOf(optimized)))
  })

  it('and all three agree with an independent check', () => {
    expect(canonical(answerOf(optimized))).toBe(canonical(groupAnagrams(words)))
  })

  it('reports the same biggest group from every approach, as tile indices', () => {
    const expected = biggestGroup(groupAnagrams(words))
    for (const frames of [optimized, sorted, brute]) {
      const { result } = frames[frames.length - 1].scene
      expect(result === null ? 0 : result[1] - result[0] + 1).toBe(expected)
    }
  })

  it('lays every group out contiguously in the final frame', () => {
    const expected = canonical(groupAnagrams(words))
    for (const frames of [optimized, sorted, brute]) {
      const last = frames[frames.length - 1].scene
      const laidOut = last.labels ?? []

      // Walk the row and cut a group wherever the signature changes. It can
      // only reproduce the answer if every group really is one unbroken run.
      const runs: string[][] = []
      for (let i = 0; i < laidOut.length; i++) {
        if (i > 0 && signatureOf(laidOut[i]) === signatureOf(laidOut[i - 1])) {
          runs[runs.length - 1].push(laidOut[i])
        } else {
          runs.push([laidOut[i]])
        }
      }
      expect(canonical(runs)).toBe(expected)
    }
  })

  describe.each(APPROACHES)('$name', ({ run, listing }) => {
    const frames = run(words)
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

    it('keeps the array LENGTH constant at one tile per word', () => {
      for (const frame of frames) {
        expect(frame.scene.nums).toHaveLength(words.length)
      }
    })

    it('keeps nums and labels in step with each other', () => {
      for (const frame of frames) {
        expect(frame.scene.nums).toEqual(
          (frame.scene.labels ?? []).map((label) => encodeWord(label)),
        )
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

    it('never mutates the caller’s list, only its own copy', () => {
      const before = [...words]
      run(words)
      expect(words).toEqual(before)
    })
  })

  it('only the optimized approach builds a memory structure', () => {
    for (const frame of [...sorted, ...brute]) {
      expect(frame.scene.slots).toEqual([])
      expect(frame.scene.probe).toBeNull()
    }
  })

  it('keeps one slot per count key, holding that group’s size', () => {
    for (const frame of optimized) {
      const keys = frame.scene.slots.map((slot) => slot.key)
      expect(new Set(keys).size).toBe(keys.length)

      for (const slot of frame.scene.slots) {
        // keyLabel is the count key as the DOM shows it; `key` is the numeric
        // id standing in for it, which chrome.ts unpacks back to the same text.
        expect(countLabelOf(decodeWord(slot.key))).toBe(slot.keyLabel)
        expect(slot.value).toBeGreaterThanOrEqual(0)
      }
    }

    // Every word ends up counted exactly once across the groups.
    const last = optimized[optimized.length - 1].scene
    const total = last.slots.reduce((sum, slot) => sum + slot.value, 0)
    expect(total).toBe(words.length)
  })
})

describe('the shipped traces', () => {
  const headline = traces.cases[0]

  it('describes the example it was generated from', () => {
    expect(traces.example).toBe(
      `strs = [${EXAMPLE_WORDS.map((word) => `"${word}"`).join(', ')}]`,
    )
  })

  it('defaults to the canonical example', () => {
    expect(wordsOf(headline)).toEqual(EXAMPLE_WORDS)
  })

  it('ships three approaches, best first', () => {
    expect(traces.approaches).toEqual(['optimized', 'sorted', 'brute'])
  })

  /**
   * The regression tripwire — whatever `pnpm traces` prints for the headline
   * case. Note the ordering: `sorted` is the SHORTEST of the three, because
   * the comparisons that make it work happen inside its single sort frame,
   * off screen. The step counter is not the complexity story.
   */
  it('pins the headline frame counts', () => {
    expect(traces.build.optimized(headline)).toHaveLength(23)
    expect(traces.build.sorted(headline)).toHaveLength(15)
    expect(traces.build.brute(headline)).toHaveLength(21)
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

  it.each(TEST_CASES)('$id agrees on the answer across all approaches', (input) => {
    const expected = canonical(groupAnagrams(wordsOf(input)))
    expect(canonical(answerOf(traces.build.optimized(input)))).toBe(expected)
    expect(canonical(answerOf(traces.build.sorted(input)))).toBe(expected)
    expect(canonical(answerOf(traces.build.brute(input)))).toBe(expected)
  })

  /**
   * The `sorted` approach spends exactly one frame on its sort, so an input
   * whose signatures are already ascending would make that frame reorder
   * nothing and read as a dead step. It would still pass the scene-identity
   * check (the frame also moves the cursor), which is why this needs its own
   * assertion.
   */
  it.each(TEST_CASES)('$id is not already sorted by signature', (input) => {
    const signatures = wordsOf(input).map(signatureOf)
    const ascending = [...signatures].sort()
    expect(signatures).not.toEqual(ascending)
  })

  /**
   * Every branch needs at least one shipped case to reach it, or the line (and
   * its per-language lineMap entry) is dead: opening a group vs joining one,
   * and — for the sorted walk — extending a run vs starting one.
   */
  it('reaches every branch across the shipped cases', () => {
    const linesFor = (approach: 'optimized' | 'sorted' | 'brute') =>
      TEST_CASES.flatMap((input) =>
        traces.build[approach](input).map((frame) => frame.line),
      )

    expect(linesFor('optimized')).toEqual(expect.arrayContaining([2, 4, 7, 13, 16, 19]))
    expect(linesFor('sorted')).toEqual(expect.arrayContaining([2, 4, 8, 10, 12, 16]))
    expect(linesFor('brute')).toEqual(expect.arrayContaining([2, 4, 8, 9, 16, 20]))
  })

  it('ships one case that groups nothing and others that do', () => {
    const results = TEST_CASES.map((input) => {
      const frames = traces.build.optimized(input)
      return frames[frames.length - 1].scene.result
    })

    // `result === null` is what the picker reads as "not found", and what
    // suppresses the flat view's return chip.
    expect(results.filter((result) => result === null)).toHaveLength(1)
    expect(results.filter((result) => result !== null).length).toBeGreaterThan(0)
  })

  it('the "no-answer" case is the one that groups nothing', () => {
    const input = TEST_CASES.find((entry) => entry.id === 'no-answer')!
    const frames = traces.build.optimized(input)
    const last = frames[frames.length - 1].scene

    expect(last.result).toBeNull()
    expect(last.slots).toHaveLength(wordsOf(input).length)
    expect(last.slots.every((slot) => slot.value === 1)).toBe(true)
  })

  it('the "late-answer" case groups only on its final word', () => {
    const input = TEST_CASES.find((entry) => entry.id === 'late-answer')!
    const frames = traces.build.optimized(input)

    // Up to the last word every signature is new; the last one is the first
    // and only lookup that hits.
    const hits = frames.filter((frame) => frame.vars.found === true)
    expect(hits).toHaveLength(1)
    expect(hits[0].vars.i).toBe(wordsOf(input).length - 1)
  })
})
