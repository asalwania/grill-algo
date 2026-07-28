/**
 * Best-effort check that every catalog row's derived LeetCode URL resolves.
 *
 *   pnpm verify:catalog
 *
 * Deliberately NOT wired into `build`, `prebuild` or CI. LeetCode rate-limits
 * and may 403 an unattended script, so a red run here means "go look", not
 * "the build is broken". The structural guarantees — 150 rows, unique slugs,
 * kebab-case, contiguous categories — are enforced offline by
 * lib/catalog.test.ts and DO gate `pnpm test`.
 *
 * What neither this nor the tests can catch: a number/title pairing that is
 * wrong but plausible. Both halves of such a row exist on LeetCode; they just
 * don't belong together.
 *
 * Node runs this TypeScript directly, same as scripts/build-traces.ts — hence
 * the real `.ts` extensions on the relative imports.
 */

// Straight from content/catalog.ts, not lib/catalog.ts: that module's imports
// are extensionless for the bundler, which Node's own resolver rejects.
import { CATALOG, leetcodeUrl } from '../content/catalog.ts'

/** LeetCode is unhappy with bursts; this keeps it to a trickle. */
const CONCURRENCY = 4
const DELAY_MS = 250

type Result = { slug: string; url: string; status: number | string }

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

async function check(url: string): Promise<number | string> {
  try {
    // GET, not HEAD — LeetCode answers HEAD inconsistently.
    const response = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      headers: { 'user-agent': 'grill-algo catalog verifier' },
    })
    return response.status
  } catch (error) {
    return error instanceof Error ? error.message : 'fetch failed'
  }
}

const queue = [...CATALOG]
const results: Result[] = []

async function worker() {
  for (;;) {
    const entry = queue.shift()
    if (!entry) return
    const url = leetcodeUrl(entry)
    results.push({ slug: entry.slug, url, status: await check(url) })
    await sleep(DELAY_MS)
  }
}

console.log(`Checking ${CATALOG.length} LeetCode URLs...\n`)
await Promise.all(Array.from({ length: CONCURRENCY }, worker))

const ok = results.filter((result) => result.status === 200)
const missing = results.filter((result) => result.status === 404)
const other = results.filter(
  (result) => result.status !== 200 && result.status !== 404,
)

for (const result of missing) {
  console.log(`404  ${result.slug}  ${result.url}`)
}
for (const result of other) {
  console.log(`${String(result.status).padEnd(4)} ${result.slug}  ${result.url}`)
}

console.log(
  `\n${ok.length} ok, ${missing.length} missing, ${other.length} inconclusive ` +
    `(rate-limited or blocked — re-run, don't assume broken).`,
)

// Only a real 404 is a definite authoring error, so only that fails the run.
if (missing.length > 0) process.exitCode = 1
