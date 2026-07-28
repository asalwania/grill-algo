import 'server-only'

import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'

import type { Approach, Frame, ProblemMeta, Solution, TestCase } from './types'

const PROBLEMS_DIR = join(process.cwd(), 'content', 'problems')
const APPROACHES: Approach[] = ['optimized', 'brute']

/**
 * On-disk shape of content/problems/<slug>/:
 *   meta.ts                       -> export const meta: ProblemMeta
 *   trace.ts                      -> export const traces: ProblemTraces (build-time only)
 *   cases.json                    -> TestCase[], emitted by scripts/build-traces.ts
 *   frames.<case>.<approach>.json -> Frame[],    emitted by scripts/build-traces.ts
 *   solutions/index.ts            -> export const solutions: Record<Approach, Solution[]>
 *   content.mdx                   -> prose, returned here as raw source
 */
export type Problem<TScene = unknown> = {
  meta: ProblemMeta
  /** Playable inputs in author order; the first is the default selection. */
  cases: TestCase[]
  /**
   * Keyed by case id, then approach. Every combination is loaded together, for
   * the same reason F13's toggle loads both approaches at once: switching is a
   * frame-array swap and must never wait on a fetch.
   */
  frames: Record<string, Record<Approach, Frame<TScene>[]>>
  solutions: Record<Approach, Solution[]>
  mdx: string
}

export async function getProblemSlugs(): Promise<string[]> {
  const entries = await readdir(PROBLEMS_DIR, { withFileTypes: true })
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()
}

export async function getAllProblemMeta(): Promise<ProblemMeta[]> {
  const slugs = await getProblemSlugs()
  const metas = await Promise.all(slugs.map(getProblemMeta))
  return metas.sort((a, b) => a.number - b.number)
}

export async function getProblemMeta(slug: string): Promise<ProblemMeta> {
  const mod = await import(`../content/problems/${slug}/meta`)
  return mod.meta as ProblemMeta
}

async function readCases(dir: string): Promise<TestCase[]> {
  const json = await readFile(join(dir, 'cases.json'), 'utf8')
  return JSON.parse(json) as TestCase[]
}

async function readFrames<TScene>(
  dir: string,
  cases: TestCase[],
): Promise<Record<string, Record<Approach, Frame<TScene>[]>>> {
  const loaded = await Promise.all(
    cases.map(async (input) => {
      const perApproach = await Promise.all(
        APPROACHES.map(async (approach) => {
          const json = await readFile(
            join(dir, `frames.${input.id}.${approach}.json`),
            'utf8',
          )
          return [approach, JSON.parse(json) as Frame<TScene>[]] as const
        }),
      )
      return [input.id, Object.fromEntries(perApproach)] as const
    }),
  )
  return Object.fromEntries(loaded) as Record<
    string,
    Record<Approach, Frame<TScene>[]>
  >
}

export async function getProblem<TScene = unknown>(
  slug: string,
): Promise<Problem<TScene>> {
  const dir = join(PROBLEMS_DIR, slug)
  // cases.json names the frame files, so it has to resolve before they can be
  // read — the only sequential step in an otherwise parallel load.
  const cases = await readCases(dir)
  const [meta, frames, solutionsMod, mdx] = await Promise.all([
    getProblemMeta(slug),
    readFrames<TScene>(dir, cases),
    import(`../content/problems/${slug}/solutions/index`),
    readFile(join(dir, 'content.mdx'), 'utf8'),
  ])

  return {
    meta,
    cases,
    frames,
    solutions: solutionsMod.solutions as Record<Approach, Solution[]>,
    mdx,
  }
}
