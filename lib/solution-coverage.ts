import { describe, expect, it } from 'vitest'

import type { Approach, ProblemTraces, Solution } from './types'

/**
 * The F14 lineMap guard, as a suite any problem can mount.
 *
 * A missing lineMap entry doesn't throw — `lineMap[frame.line]` is just
 * `undefined`, which a consumer coalescing to a default renders as line 1
 * instead of failing loudly. This is the build-time check F14 asks for in its
 * place: every distinct line a frame ever points at must have a mapping, for
 * every language, pointing at a real non-blank line of that language's own
 * listing.
 *
 * Shared rather than copied per problem for the same reason `createEmitter`
 * is: the check is a property of the lineMap CONTRACT, not of any one problem,
 * and a copy is a chance for one problem's copy to quietly weaken.
 *
 * Call it from inside a `.test.ts` file — it registers `describe`/`it` blocks
 * itself, so it must run at collection time, not inside a test.
 */
export function describeSolutionCoverage<TScene, TApproach extends Approach>(
  traces: ProblemTraces<TScene, TApproach>,
  solutions: Partial<Record<Approach, Solution[]>>,
): void {
  describe.each(traces.approaches as readonly Approach[])(
    '%s solutions',
    (approach) => {
      const build = traces.build[approach as TApproach]
      const listings = solutions[approach]

      it('ships a solution for the approach it declares', () => {
        expect(
          listings,
          `traces.approaches includes "${approach}" but solutions/index.ts has no entry for it`,
        ).toBeDefined()
        expect(listings?.length ?? 0).toBeGreaterThan(0)
      })

      if (!listings) return

      // Every shipped case, not just the headline one: typically only the
      // no-answer case ever reaches a listing's final `return`, so checking a
      // single case would leave those mappings unverified.
      const frameLines = new Set(
        traces.cases.flatMap((input) => build(input).map((frame) => frame.line)),
      )

      it.each(listings)('$language lineMap covers every frame line', (solution) => {
        for (const line of frameLines) {
          expect(
            solution.lineMap[line],
            `${solution.language}/${approach}: no lineMap entry for canonical line ${line}`,
          ).toBeDefined()
        }
      })

      it.each(listings)(
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
    },
  )
}
