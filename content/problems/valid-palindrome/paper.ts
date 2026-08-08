/**
 * Valid Palindrome — the dry run, as you would do it at a whiteboard.
 *
 * Sibling of `trace.ts`, and the same discipline: a generator that ACTUALLY
 * runs the algorithm, executed at build time, never in the browser. What
 * comes out is a `PaperStroke[]` rather than a `Frame[]` — see the
 * `PaperStroke` doc in `lib/types.ts` for why the two models stay separate.
 *
 * A problem opts in by adding this file. `lib/content.ts` looks for it and
 * hands back `null` when it is absent, so a problem without one simply does
 * not offer the button.
 */

import type { PaperCase, PaperStroke } from '../../../lib/types.ts'

const isAlnum = (ch: string): boolean => /[a-z0-9]/i.test(ch)

/** `[4, 1, 9]`-style decoder, duplicated from `trace.ts` rather than
 *  imported — `chrome.ts` already sets that precedent (§10c). */
function stringOf(nums: number[]): string {
  return nums.map((code) => String.fromCharCode(code)).join('')
}

/** `"abc"`, and `""` reads oddly on paper — write it as an explicit empty
 *  pair of quotes either way, since s is never actually the empty string
 *  here (LeetCode's own constraint), only empty AFTER cleaning. */
function penString(s: string): string {
  return `"${s}"`
}

/**
 * The case list a competent candidate writes before touching the code.
 *
 * The first four are the same strings as `cases.json`, on purpose — the
 * paper view and the animated one should be dry-running the same inputs.
 * **The last three are the cases the 3D view structurally cannot show**: a
 * scene needs alphanumeric tiles to compare, and a string with none at all
 * has nothing to light up, a single character has no partner to compare
 * against, and a digit-vs-letter mismatch looks identical to any other
 * mismatching tile pair on screen. On paper they cost nothing, and they are
 * exactly what an interviewer probes for.
 *
 * `expected` is authored and `reasoning` is authored; `paper.test.ts` runs
 * the real algorithm over all seven and refuses to let either drift.
 */
export const CASES: PaperCase[] = [
  {
    nums: [...'A man, a plan, a canal: Panama'].map((ch) => ch.charCodeAt(0)),
    expected: 'true',
    tag: 'typical — real sentence with punctuation',
    reasoning: 'the tabled one',
  },
  {
    nums: [...'abc'].map((ch) => ch.charCodeAt(0)),
    expected: 'false',
    tag: 'fails on the very first pair',
    reasoning: "'a' and 'c' disagree immediately, with no punctuation involved at all",
  },
  {
    nums: [...'race a car'].map((ch) => ch.charCodeAt(0)),
    expected: 'false',
    tag: 'fails after several matches',
    reasoning: "r/r, a/a and c/c all agree — then 'e' and 'a' finally break it",
  },
  {
    nums: [...'..A..a..'].map((ch) => ch.charCodeAt(0)),
    expected: 'true',
    tag: 'mostly punctuation',
    reasoning: 'six punctuation characters skipped, one real pair (A/a) agrees',
  },
  {
    nums: [...'.,!?'].map((ch) => ch.charCodeAt(0)),
    expected: 'true',
    tag: 'no letters or digits at all',
    reasoning: 'every character gets skipped — an empty comparison is vacuously true',
  },
  {
    nums: [...'a'].map((ch) => ch.charCodeAt(0)),
    expected: 'true',
    tag: 'single character',
    reasoning: 'one letter has nothing to disagree with — the loop never even runs',
  },
  {
    nums: [...'0P'].map((ch) => ch.charCodeAt(0)),
    expected: 'false',
    tag: 'a digit and a letter',
    reasoning: "'0' and lowercase 'p' are both alphanumeric, but they are not the same character",
  },
]

/** The case the table is drawn for: the only one long enough to earn one. */
export const WALKTHROUGH = CASES[0]

/**
 * The columns, and the whole of what makes the table teachable.
 *
 * Showing `s[left]`/`s[right]` AFTER the skip loops (never before) is the
 * single most common way a hand-run of this problem goes wrong: comparing
 * whatever character a pointer first lands on — punctuation included —
 * instead of skipping past it first. `paper.test.ts` pins this directly:
 * every displayed character is alphanumeric, on every row.
 */
export const COLUMNS = ['left', 'right', 's[left]', 's[right]', 'verdict / action'] as const

/** Grid tracks, one per column. `fr` throughout so the table stays ruled at
 *  the same proportions on a phone as on the full sheet. */
export const WIDTHS = [
  'minmax(0,0.6fr)',
  'minmax(0,0.6fr)',
  'minmax(0,1fr)',
  'minmax(0,1fr)',
  'minmax(0,2.4fr)',
]

/**
 * The two-pointer solution, running for real, narrating each real
 * comparison as a table row (skips happen silently between rows — exactly
 * like the animated trace, a row only exists once both pointers have
 * landed on something worth comparing).
 *
 * The generator's RETURN value is the answer, computed by the same walk
 * that produced the rows — so a row and the verdict can never disagree.
 */
export function* runOnPaper(s: string): Generator<PaperStroke, string, void> {
  let left = 0
  let right = s.length - 1
  let row = 0

  while (left < right) {
    while (left < right && !isAlnum(s[left])) left++
    while (left < right && !isAlnum(s[right])) right--

    if (left >= right) break

    const a = s[left]
    const b = s[right]
    const same = a.toLowerCase() === b.toLowerCase()

    yield {
      id: `row-${row++}`,
      kind: 'row',
      cells: [
        `${left}`,
        `${right}`,
        `'${a}'`,
        `'${b}'`,
        same ? 'same — keep closing in' : 'different — return false',
      ],
      hit: !same,
    }

    if (!same) return 'false'

    left++
    right--
  }

  return 'true'
}

/** Drains `runOnPaper` for its answer, discarding the rows. */
export function resultOf(s: string): string {
  const run = runOnPaper(s)
  let step = run.next()
  while (!step.done) step = run.next()
  return step.value
}

/**
 * The whole sheet, in writing order.
 *
 * Three sections, because the lesson is a three-step HABIT and not a table:
 * list the cases, run exactly one of them properly, then dispose of the
 * rest in a line each.
 */
export function* writeSheet(): Generator<PaperStroke, void, void> {
  yield {
    id: 'title',
    kind: 'title',
    text: 'Valid Palindrome',
    sub: 's: string  →  bool     ·     true if it reads the same forward and backward, ignoring case and punctuation',
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
      input: penString(stringOf(c.nums)),
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
    id: 's2-order',
    kind: 'aside',
    pen: 'ink',
    text: 'Skip past the junk BEFORE you look at what is left, never after — a row only ever compares two letters or digits, nothing else ever reaches this table.',
  }

  yield {
    id: 'grid',
    kind: 'grid',
    caption: `s = ${penString(stringOf(WALKTHROUGH.nums))}     expected: ${WALKTHROUGH.expected}`,
    columns: [...COLUMNS],
    widths: WIDTHS,
  }

  const run = runOnPaper(stringOf(WALKTHROUGH.nums))
  let step = run.next()
  while (!step.done) {
    yield step.value
    step = run.next()
  }
  const actual = step.value

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

  for (const c of CASES.slice(1)) {
    const s = stringOf(c.nums)
    yield {
      id: `check-${s || 'empty'}`,
      kind: 'aside',
      pen: 'ink',
      text: `${penString(s)} → ${c.reasoning} → ${resultOf(s)} ✓`,
    }
  }
}
