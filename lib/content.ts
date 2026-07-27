import 'server-only'

import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'

import type { Approach, Frame, ProblemMeta, Solution } from './types'

const PROBLEMS_DIR = join(process.cwd(), 'content', 'problems')

/**
 * On-disk shape of content/problems/<slug>/:
 *   meta.ts            -> export const meta: ProblemMeta
 *   frames.json        -> Frame[], emitted at build time by scripts/build-traces.ts
 *   solutions/index.ts -> export const solutions: Record<Approach, Solution[]>
 *   content.mdx        -> prose, returned here as raw source
 */
export type Problem<TScene = unknown> = {
  meta: ProblemMeta
  frames: Frame<TScene>[]
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

export async function getProblem<TScene = unknown>(
  slug: string,
): Promise<Problem<TScene>> {
  const dir = join(PROBLEMS_DIR, slug)
  const [meta, framesJson, solutionsMod, mdx] = await Promise.all([
    getProblemMeta(slug),
    readFile(join(dir, 'frames.json'), 'utf8'),
    import(`../content/problems/${slug}/solutions/index`),
    readFile(join(dir, 'content.mdx'), 'utf8'),
  ])

  return {
    meta,
    frames: JSON.parse(framesJson) as Frame<TScene>[],
    solutions: solutionsMod.solutions as Record<Approach, Solution[]>,
    mdx,
  }
}
