import { describe, expect, it } from 'vitest'

import type { Approach } from '../../../../lib/types'
import { traces } from '../trace'
import { solutions } from './index'

const APPROACHES: Approach[] = ['optimized', 'brute']

/**
 * A missing lineMap entry doesn't throw — `lineMap[frame.line]` is just
 * `undefined`, which a consumer coalescing to a default would silently render
 * as line 0 (or 1) instead of failing loudly. This is the build-time guard
 * F14 asks for in its place: every distinct line a frame ever points at must
 * have a mapping, for every language, or the test fails.
 */
describe.each(APPROACHES)('%s solutions', (approach) => {
  // Every shipped case, not just the headline one: only the no-answer case
  // ever reaches either listing's final `return []`, so checking one case
  // would leave those mappings unverified.
  const frameLines = new Set(
    traces.cases.flatMap((input) => traces.build[approach](input).map((frame) => frame.line)),
  )

  it.each(solutions[approach])('$language lineMap covers every frame line', (solution) => {
    for (const line of frameLines) {
      expect(
        solution.lineMap[line],
        `${solution.language}/${approach}: no lineMap entry for canonical line ${line}`,
      ).toBeDefined()
    }
  })

  it.each(solutions[approach])(
    '$language lineMap points at a real, non-blank line of its own listing',
    (solution) => {
      const lines = solution.code.split('\n')
      for (const line of frameLines) {
        const target = solution.lineMap[line]
        const source = lines[target - 1]
        expect(
          source,
          `${solution.language}/${approach}: canonical line ${line} maps to ` +
            `${target}, past the end of the ${lines.length}-line listing`,
        ).not.toBeUndefined()
        expect(
          source?.trim(),
          `${solution.language}/${approach}: canonical line ${line} maps to blank line ${target}`,
        ).not.toBe('')
      }
    },
  )
})
