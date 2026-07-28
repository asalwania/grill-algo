/**
 * Runs every problem's generators once per playable input and writes one
 * frames.<case>.<approach>.json per combination into that problem's folder,
 * plus cases.json and approaches.json manifests the runtime loader reads to
 * discover them. Wired as `prebuild`, so `pnpm build` regenerates traces
 * before Next ever looks at them.
 *
 *   pnpm traces
 *
 * Node runs this TypeScript directly — no tsx, no ts-node, no build step
 * (Node >= 22.18 / 23.6 strips types natively; see the SP3 toolchain notes).
 * That is also why the relative imports carry their real `.ts` extension, which
 * tsconfig allows via `allowImportingTsExtensions`.
 *
 * The script knows nothing about any particular problem: it discovers them by
 * directory and requires only that each exports `traces` (lib/types.ts,
 * ProblemTraces).
 */

import { readdir, writeFile } from 'node:fs/promises'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

import type { Approach, ProblemTraces } from '../lib/types.ts'

/** Every approach the union admits — used only to validate what a problem
 *  declares, never to iterate. Iteration is over `traces.approaches`. */
const KNOWN_APPROACHES: Approach[] = ['brute', 'sorted', 'optimized']

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const problemsDir = join(root, 'content', 'problems')

const show = (path: string) => relative(root, path).replaceAll('\\', '/')

const entries = await readdir(problemsDir, { withFileTypes: true })
const slugs = entries
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort()

if (slugs.length === 0) {
  throw new Error(`No problems found in ${show(problemsDir)}`)
}

let written = 0

for (const slug of slugs) {
  const traceFile = join(problemsDir, slug, 'trace.ts')

  // pathToFileURL, not a bare path — a Windows drive letter parses as a URL
  // scheme otherwise, and dynamic import fails with ERR_UNSUPPORTED_ESM_URL_SCHEME.
  const mod: { traces?: ProblemTraces } = await import(pathToFileURL(traceFile).href)
  const traces = mod.traces

  if (!traces) {
    throw new Error(`${show(traceFile)} does not export \`traces\``)
  }

  console.log(`${slug}  —  ${traces.example}`)

  // Approaches are per problem, not a fixed triple (lib/types.ts) — a problem
  // ships only the ones that teach something about IT. Order is meaningful
  // (first = default selection and leftmost tab), so this is written out as a
  // manifest for the same reason cases.json is.
  const approaches = traces.approaches
  if (!approaches || approaches.length === 0) {
    throw new Error(`${show(traceFile)} declares no \`approaches\``)
  }

  const seenApproaches = new Set<Approach>()
  for (const approach of approaches) {
    if (!KNOWN_APPROACHES.includes(approach)) {
      throw new Error(
        `${show(traceFile)} declares unknown approach "${approach}" — ` +
          `expected one of ${KNOWN_APPROACHES.join(', ')}`,
      )
    }
    if (seenApproaches.has(approach)) {
      throw new Error(`${show(traceFile)} declares "${approach}" twice`)
    }
    seenApproaches.add(approach)
  }

  const approachesFile = join(problemsDir, slug, 'approaches.json')
  await writeFile(approachesFile, `${JSON.stringify(approaches, null, 2)}\n`, 'utf8')
  console.log(
    `  ${String(approaches.length).padStart(3)} approach(es) ->  ${show(approachesFile)}  (${approaches.join(', ')})`,
  )

  const cases = traces.cases
  if (!cases || cases.length === 0) {
    throw new Error(`${show(traceFile)} exports no \`cases\``)
  }

  const ids = new Set<string>()
  for (const input of cases) {
    if (ids.has(input.id)) {
      throw new Error(`${show(traceFile)} has two cases with id "${input.id}"`)
    }
    ids.add(input.id)
  }

  // The manifest, not a directory scan, is what tells the runtime loader which
  // cases exist and in what order — order is meaningful (the first is the
  // default selection) and a readdir would lose it.
  const manifestFile = join(problemsDir, slug, 'cases.json')
  await writeFile(manifestFile, `${JSON.stringify(cases, null, 2)}\n`, 'utf8')
  console.log(`  ${String(cases.length).padStart(3)} case(s)  ->  ${show(manifestFile)}`)

  for (const input of cases) {
    for (const approach of approaches) {
      const build = traces.build[approach]
      const listing = traces.listings[approach]

      if (!build || !listing) {
        throw new Error(`${show(traceFile)} is missing \`${approach}\``)
      }

      const frames = build(input)
      const lines = listing.split('\n')

      // Guard the one invariant that would silently mis-highlight the code pane.
      // The tests assert this too; failing the BUILD is the point of doing it here.
      for (const frame of frames) {
        const source = lines[frame.line - 1]
        if (source === undefined || source.trim() === '') {
          throw new Error(
            `${slug}/${input.id}/${approach}: frame ${frame.step} points at line ${frame.line}, ` +
              `which is ${source === undefined ? `past the end of the ${lines.length}-line listing` : 'blank'}`,
          )
        }
      }

      const outFile = join(problemsDir, slug, `frames.${input.id}.${approach}.json`)
      await writeFile(outFile, `${JSON.stringify(frames, null, 2)}\n`, 'utf8')
      written++

      console.log(
        `  ${input.id.padEnd(12)} ${approach.padEnd(9)} ${String(frames.length).padStart(3)} frames  ->  ${show(outFile)}`,
      )
    }
  }
}

console.log(`\n${written} trace file(s) across ${slugs.length} problem(s).`)
