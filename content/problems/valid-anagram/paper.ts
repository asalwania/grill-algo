/**
 * Valid Anagram — the dry run, as you would do it at a whiteboard.
 *
 * Sibling of `trace.ts`, and the same discipline: a generator that ACTUALLY
 * runs the algorithm, executed at build time, never in the browser. What comes
 * out is a `PaperStroke[]` rather than a `Frame[]`, because paper is
 * append-only and needs no snapshots — see the `PaperStroke` doc in
 * `lib/types.ts` for why the two models stay separate.
 *
 * ## Two strings on a numeric case
 *
 * `PaperCase.nums` is `number[]`, so a case is packed exactly the way
 * `trace.ts` packs a `TestCase`: char codes for `s` followed by `t`, with
 * `target` as the boundary index. `split` below is the inverse, and it is the
 * only place in this file that knows about the packing.
 *
 * ## What the table covers, and what it deliberately does not
 *
 * The algorithm has three parts — the length guard, one pass counting `s`, one
 * pass spending those counts over `t` — and only the third earns a table. The
 * guard is one comparison, and the counting pass is a tally anyone can write
 * in one line, so both are stated in the caption. Every row of the table is
 * therefore a letter of `t` being SPENT, which is where all four failure modes
 * actually live: a letter that was never in `s`, and a letter whose count has
 * already run out.
 */

import type { PaperCase, PaperStroke } from '../../../lib/types.ts'

/** Packs two strings into the shared numeric case shape. The inverse of
 *  `split`, and the mirror of `trace.ts`'s `makeCase`. */
function makeCase(
  s: string,
  t: string,
  expected: string,
  tag: string,
  reasoning: string,
): PaperCase {
  return {
    nums: [...s, ...t].map((ch) => ch.charCodeAt(0)),
    target: s.length,
    expected,
    tag,
    reasoning,
  }
}

/** `s` occupies `[0, target)`, `t` the rest — the boundary convention this
 *  problem shares with `trace.ts` and `ArrayMemoryScene.target`. */
export function split(c: PaperCase): { s: string; t: string } {
  const boundary = c.target ?? c.nums.length
  const letters = c.nums.map((code) => String.fromCharCode(code))
  return { s: letters.slice(0, boundary).join(''), t: letters.slice(boundary).join('') }
}

/**
 * The case list a competent candidate writes before touching the code.
 *
 * The first four are the same pairs as `cases.json`, on purpose — the paper
 * view and the animated one should be dry-running the same strings. **The last
 * three are what the shipped four never reach**: two empty strings, a
 * one-letter pair, and two strings built from the same letter SET with
 * different multiplicities. The first two are cases a scene structurally
 * cannot show — no tiles, or one — and the third is the one people get wrong
 * because "same letters" is not the question. On paper all three cost a line.
 *
 * `expected` is authored and `reasoning` is authored; `paper.test.ts` runs the
 * real algorithm over all seven and refuses to let either drift.
 */
export const CASES: PaperCase[] = [
  makeCase(
    'anagram',
    'nagaram',
    'true',
    'typical — same letters, reordered',
    'the tabled one',
  ),
  makeCase(
    'rat',
    'car',
    'false',
    "a letter that is not in s at all",
    "'c' was never counted, so the map lookup misses on the very first letter of t",
  ),
  makeCase(
    'aab',
    'abb',
    'false',
    'runs out mid-check',
    "'b' was counted once and spent once — the second 'b' finds a count of 0",
  ),
  makeCase(
    'ab',
    'a',
    'false',
    'different lengths',
    'the length guard settles it before a single letter is counted',
  ),
  makeCase(
    '',
    '',
    'true',
    'both empty — nothing to check',
    'lengths match, no letters to count and none to spend, so it falls through to return true',
  ),
  makeCase(
    'a',
    'a',
    'true',
    'single letter',
    "one count in, one count out — the shortest run that still enters the loop",
  ),
  makeCase(
    'aacc',
    'ccac',
    'false',
    'same letter SET, wrong counts',
    "both use only 'a' and 'c', but t wants three c's and s only counted two",
  ),
]

/** The case the table is drawn for: the only one long enough to earn one. */
export const WALKTHROUGH = CASES[0]

/**
 * The columns, and the whole of what makes the table teachable.
 *
 * The split between "counts BEFORE" and "counts AFTER" is the same guard
 * Contains Duplicate needs, for a sharper reason: here the value is a NUMBER
 * that goes down, so a single merged column lets the writer decrement and read
 * in either order and never notice. `count` gets its own column because zero
 * and absent are different reasons to fail and must be visibly the same
 * decision.
 */
export const COLUMNS = [
  'j',
  't[j]',
  'counts BEFORE',
  'count',
  'counts AFTER / action',
] as const

/** Grid tracks, one per column. `fr` throughout so the table stays ruled at
 *  the same proportions on a phone as on the full sheet. */
export const WIDTHS = [
  'minmax(0,0.45fr)',
  'minmax(0,0.7fr)',
  'minmax(0,2.6fr)',
  'minmax(0,0.7fr)',
  'minmax(0,2.6fr)',
]

/** `{ a3, n1, g1 }`, zeros dropped — a hand crosses a letter out when it is
 *  spent rather than writing `a0`, and reading `a0` back as "available" is
 *  exactly the mistake this sheet is trying to prevent. */
function penCounts(counts: Map<string, number>): string {
  const items = [...counts]
    .filter(([, n]) => n > 0)
    .map(([ch, n]) => `${ch}${n}`)
  return items.length === 0 ? '{ }' : `{ ${items.join(', ')} }`
}

/** `"anagram"`, and `""` for the empty string so it still reads as a written
 *  thing rather than a gap on the page. */
export function penString(text: string): string {
  return `"${text}"`
}

/** How a case is named in the list. */
export function penInput(c: PaperCase): string {
  const { s, t } = split(c)
  return `${penString(s)} vs ${penString(t)}`
}

/** The tally the caption states, so the table can start at the spending pass. */
export function countsOf(s: string): Map<string, number> {
  const counts = new Map<string, number>()
  for (const ch of s) counts.set(ch, (counts.get(ch) ?? 0) + 1)
  return counts
}

/**
 * The hash-map solution, running for real, narrating each letter of `t` as a
 * table row.
 *
 * The generator's RETURN value is the answer, computed by the same loop that
 * produced the rows — so a row and the verdict can never disagree. This is the
 * only implementation of Valid Anagram in this file; `resultOf` gets its
 * answer by draining this rather than keeping a second copy that could drift.
 *
 * The two early exits yield NO rows and one row respectively, and both are
 * honest: a length mismatch is settled before the table starts, and a miss is
 * settled on the row that found it.
 */
export function* runOnPaper(
  s: string,
  t: string,
): Generator<PaperStroke, string, void> {
  if (s.length !== t.length) return 'false'

  const counts = countsOf(s)

  for (let j = 0; j < t.length; j++) {
    const ch = t[j]
    const before = penCounts(counts)
    const count = counts.get(ch) ?? 0

    if (count === 0) {
      yield {
        id: `row-${j}`,
        kind: 'row',
        cells: [`${j}`, ch, before, '0', 'return false'],
        hit: true,
      }
      return 'false'
    }

    counts.set(ch, count - 1)
    yield {
      id: `row-${j}`,
      kind: 'row',
      cells: [`${j}`, ch, before, `${count}`, `spend ${ch} → ${penCounts(counts)}`],
      hit: false,
    }
  }

  return 'true'
}

/** Drains `runOnPaper` for its answer, discarding the rows. */
export function resultOf(c: PaperCase): string {
  const { s, t } = split(c)
  const run = runOnPaper(s, t)
  let step = run.next()
  while (!step.done) step = run.next()
  return step.value
}

/**
 * The whole sheet, in writing order.
 *
 * Three sections, because the lesson is a three-step HABIT and not a table:
 * list the cases, run exactly one of them properly, then dispose of the rest in
 * a line each. Step 3 is the part people skip and the part that saves the
 * interview — seven tables is twenty minutes nobody has.
 */
export function* writeSheet(): Generator<PaperStroke, void, void> {
  yield {
    id: 'title',
    kind: 'title',
    text: 'Valid Anagram',
    sub: 's: string, t: string  →  bool     ·     true if t uses exactly the letters of s',
  }

  // --- 1. the list ---------------------------------------------------------
  yield {
    id: 's1',
    kind: 'section',
    step: 1,
    text: 'List the cases first',
    hint: 'One line each: input → the answer you expect.',
  }
  yield {
    id: 's1-warn',
    kind: 'aside',
    pen: 'red',
    text: 'Expected comes from the QUESTION, not from your code. Read it off your own loop and you have tested nothing.',
  }

  for (const [i, c] of CASES.entries()) {
    yield {
      id: `case-${i}`,
      kind: 'case',
      input: penInput(c),
      expected: c.expected,
      tag: c.tag,
    }
  }

  // --- 2. the table --------------------------------------------------------
  yield {
    id: 's2',
    kind: 'section',
    step: 2,
    text: 'Run ONE case in a table',
    hint: 'Pick the case that actually exercises the loop.',
  }
  yield {
    id: 's2-cols',
    kind: 'aside',
    pen: 'ink',
    text: 'Two of the three parts do not earn a table. The length guard is one comparison, and counting s is a tally you write in a line — so both go in the caption and the table starts where the decisions are.',
  }

  const { s, t } = split(WALKTHROUGH)
  yield {
    id: 'grid',
    kind: 'grid',
    caption: `s = ${penString(s)}   t = ${penString(t)}   lengths match   after counting s: ${penCounts(countsOf(s))}   expected: ${WALKTHROUGH.expected}`,
    columns: [...COLUMNS],
    widths: WIDTHS,
  }

  const run = runOnPaper(s, t)
  let step = run.next()
  while (!step.done) {
    yield step.value
    step = run.next()
  }
  const actual = step.value

  yield {
    id: 's2-order',
    kind: 'aside',
    pen: 'red',
    text: 'A count of 0 and a letter that is absent are the SAME failure, and you must read the count before you decrement it. One merged column and you will spend a letter you never had.',
  }

  yield {
    id: 'verdict',
    kind: 'verdict',
    ok: actual === WALKTHROUGH.expected,
    text: `got ${actual} · expected ${WALKTHROUGH.expected}`,
  }

  // --- 3. the cheap checks -------------------------------------------------
  yield {
    id: 's3',
    kind: 'section',
    step: 3,
    text: 'Argue the rest in one line',
    hint: 'Say it out loud. A table each is twenty minutes you do not have.',
  }

  for (const [i, c] of CASES.entries()) {
    if (i === 0) continue
    yield {
      id: `check-${i}`,
      kind: 'aside',
      pen: 'ink',
      text: `${penInput(c)} → ${c.reasoning} → ${resultOf(c)} ✓`,
    }
  }
}
