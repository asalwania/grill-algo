import 'server-only'

import { access, readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'

import { resolveCatalog } from './catalog'
import type {
  Approach,
  CatalogProblem,
  Frame,
  PaperStroke,
  ProblemMeta,
  Solution,
  TestCase,
} from './types'

const PROBLEMS_DIR = join(process.cwd(), 'content', 'problems')

/**
 * On-disk shape of content/problems/<slug>/:
 *   meta.ts                       -> export const meta: ProblemMeta
 *   trace.ts                      -> export const traces: ProblemTraces (build-time only)
 *   cases.json                    -> TestCase[], emitted by scripts/build-traces.ts
 *   approaches.json               -> Approach[], emitted by scripts/build-traces.ts
 *   frames.<case>.<approach>.json -> Frame[],    emitted by scripts/build-traces.ts
 *   solutions/index.ts            -> export const solutions: Partial<Record<Approach, Solution[]>>
 *   content.mdx                   -> prose, returned here as raw source
 *   paper.ts                      -> export function* writeSheet(): PaperStroke (OPTIONAL)
 */
export type Problem<TScene = unknown> = {
  meta: ProblemMeta
  /** Playable inputs in author order; the first is the default selection. */
  cases: TestCase[]
  /**
   * The approaches this problem ships, in tab order; the first is the default.
   * Read from approaches.json rather than assumed, because the set is
   * per-problem (lib/types.ts) — Two Sum has two, Contains Duplicate three.
   */
  approaches: Approach[]
  /**
   * Keyed by case id, then approach. Every combination is loaded together, for
   * the same reason F13's toggle loads both approaches at once: switching is a
   * frame-array swap and must never wait on a fetch.
   *
   * `Partial` in the approach axis: only the keys in `approaches` are present.
   * Consumers should resolve through `approaches`, never enumerate the union.
   */
  frames: Record<string, Partial<Record<Approach, Frame<TScene>[]>>>
  solutions: Partial<Record<Approach, Solution[]>>
  mdx: string
  /**
   * The handwritten dry run, or `null` for a problem that has not written one.
   *
   * Optional because a paper trace is authored per problem — the case list and
   * the loop are both problem-specific — and four of the five built problems
   * have not got one yet. A problem opts in purely by adding `paper.ts`; the
   * view hides the button when this is null.
   */
  paper: PaperStroke[] | null
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

/**
 * The full NeetCode 150 catalog, with `status` derived from what is actually
 * built. This is the only place the two halves meet: content/catalog.ts knows
 * all 150 rows and nothing about the filesystem; getProblemSlugs() knows the
 * filesystem and nothing about the catalog.
 *
 * `meta` is loaded only for `ready` rows — it's the sole reason a card can show
 * a blurb and a pattern pill, and there is nothing to load for the other 149.
 */
export async function getCatalog(): Promise<CatalogProblem[]> {
  const resolved = resolveCatalog(await getProblemSlugs())
  return Promise.all(
    resolved.map(async (problem) =>
      problem.status === 'ready'
        ? { ...problem, meta: await getProblemMeta(problem.slug) }
        : problem,
    ),
  )
}

async function readCases(dir: string): Promise<TestCase[]> {
  const json = await readFile(join(dir, 'cases.json'), 'utf8')
  return JSON.parse(json) as TestCase[]
}

async function readApproaches(dir: string): Promise<Approach[]> {
  const json = await readFile(join(dir, 'approaches.json'), 'utf8')
  return JSON.parse(json) as Approach[]
}

async function readFrames<TScene>(
  dir: string,
  cases: TestCase[],
  approaches: Approach[],
): Promise<Record<string, Partial<Record<Approach, Frame<TScene>[]>>>> {
  const loaded = await Promise.all(
    cases.map(async (input) => {
      const perApproach = await Promise.all(
        approaches.map(async (approach) => {
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
    Partial<Record<Approach, Frame<TScene>[]>>
  >
}

/**
 * Runs the problem's paper generator, if it has one.
 *
 * Existence is checked with `access` rather than by catching the import,
 * because a bare try/catch would also swallow a real error inside a paper.ts
 * that DOES exist and report it to the page as "this problem has no paper
 * trace" — the most confusing possible failure. Absent means absent; broken
 * still throws.
 *
 * This runs at build time (the route is statically generated), so the
 * generator never reaches the browser — same guarantee as the frame JSON,
 * reached without a build script, because strokes are cheap enough to produce
 * during the render and have no other consumer.
 */
async function readPaper(dir: string, slug: string): Promise<PaperStroke[] | null> {
  try {
    await access(join(dir, 'paper.ts'))
  } catch {
    return null
  }
  const mod = await import(`../content/problems/${slug}/paper`)
  return [...(mod.writeSheet() as Generator<PaperStroke>)]
}

export async function getProblem<TScene = unknown>(
  slug: string,
): Promise<Problem<TScene>> {
  const dir = join(PROBLEMS_DIR, slug)
  // Both manifests name the frame files, so they have to resolve before those
  // can be read — the only sequential step in an otherwise parallel load.
  const [cases, approaches] = await Promise.all([
    readCases(dir),
    readApproaches(dir),
  ])
  const [meta, frames, solutionsMod, mdx, paper] = await Promise.all([
    getProblemMeta(slug),
    readFrames<TScene>(dir, cases, approaches),
    import(`../content/problems/${slug}/solutions/index`),
    readFile(join(dir, 'content.mdx'), 'utf8'),
    readPaper(dir, slug),
  ])

  return {
    meta,
    cases,
    approaches,
    frames,
    solutions: solutionsMod.solutions as Partial<Record<Approach, Solution[]>>,
    mdx,
    paper,
  }
}
