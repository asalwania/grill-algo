import { CATALOG, leetcodeUrl, neetcodeUrl } from '../content/catalog'
import { CATEGORIES } from './types'
import type { Category, CatalogProblem } from './types'

// Re-exported so app code and tests have one import site for catalog helpers;
// it is defined in content/catalog.ts so the Node-run verify script can use it.
export { leetcodeUrl, neetcodeUrl }

/**
 * Catalog resolution, kept deliberately pure and free of `server-only`.
 *
 * lib/content.ts can't be imported from a test — its first line is
 * `import 'server-only'`, which throws outside a server component graph. So the
 * logic that actually decides what a card renders lives here, takes the built
 * slugs as an argument instead of reading the filesystem, and is fully covered
 * by lib/catalog.test.ts. lib/content.ts's `getCatalog()` is the thin async
 * wrapper that supplies the filesystem half.
 */

/**
 * Resolves every catalog row against the set of problems that actually exist
 * on disk. `builtSlugs` is what lib/content.ts's `getProblemSlugs()` returns.
 *
 * `meta` is left null here even for built problems — loading it is async and
 * this function is not. `getCatalog()` fills it in.
 */
export function resolveCatalog(builtSlugs: Iterable<string>): CatalogProblem[] {
  const built = new Set(builtSlugs)
  return CATALOG.map((entry) => ({
    ...entry,
    status: built.has(entry.slug) ? ('ready' as const) : ('soon' as const),
    leetcodeUrl: leetcodeUrl(entry),
    neetcodeUrl: neetcodeUrl(entry),
    meta: null,
  }))
}

/**
 * DOM id / hash fragment for a category section. Shared by the section heading
 * and the rail's anchor, so they can't disagree — the rail's scroll-spy would
 * silently never highlight if they did.
 */
export function categoryId(category: Category): string {
  return category
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export type CatalogSection = {
  category: Category
  problems: CatalogProblem[]
}

/**
 * Groups resolved rows into the 18 sections /problems renders, in CATEGORIES
 * order — NeetCode's teaching order, which is the only structure the list has.
 * Within a section, authored order is preserved; it is never sorted.
 */
export function groupByCategory(problems: CatalogProblem[]): CatalogSection[] {
  return CATEGORIES.map((category) => ({
    category,
    problems: problems.filter((problem) => problem.category === category),
  }))
}

/** The rows a visitor can actually play today. Drives the "Available now" section. */
export function readyProblems(problems: CatalogProblem[]): CatalogProblem[] {
  return problems.filter((problem) => problem.status === 'ready')
}
