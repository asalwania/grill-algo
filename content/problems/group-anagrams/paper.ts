/**
 * Group Anagrams — the dry run, as you would do it at a whiteboard.
 *
 * Sibling of `trace.ts`, and the same discipline: a generator that ACTUALLY
 * runs the algorithm, executed at build time, never in the browser. What comes
 * out is a `PaperStroke[]` rather than a `Frame[]`, because paper is
 * append-only and needs no snapshots — see the `PaperStroke` doc in
 * `lib/types.ts` for why the two models stay separate.
 *
 * ## Words on a numeric case
 *
 * `PaperCase.nums` is `number[]`, so a case is packed the way `trace.ts` packs
 * a `TestCase`: each word base-27, a = 1 … z = 26, with 0 unused so no word
 * collides with a shorter one. `encodeWord`/`decodeWord` are duplicated here
 * rather than imported from `trace.ts` — the same trade `chrome.ts` makes, for
 * the same reason: five lines beats pulling three generators and three code
 * listings in behind them. The packing is pinned by `trace.test.ts`'s
 * round-trip, and by this file's own case-list test against `cases.json`.
 *
 * ## What the table shows
 *
 * One row per word, because that is the granularity everything in this problem
 * happens at. The interesting column is `key`: the whole method is that a word
 * has a NAME its entire group shares, and once you have written the name down
 * the grouping is a map lookup rather than a comparison against anything.
 */

import type { PaperCase, PaperStroke } from '../../../lib/types.ts'

/** 26 letters plus a zero that no letter uses, so 'a' and 'aa' pack apart. */
const BASE = 27

/** 'eat' -> 5*27² + 1*27 + 20. Duplicated from `trace.ts`; see the header. */
function encodeWord(word: string): number {
  return [...word].reduce((code, ch) => code * BASE + (ch.charCodeAt(0) - 96), 0)
}

/** The inverse. `0` decodes to the empty string, which is a legal word here. */
function decodeWord(code: number): string {
  let letters = ''
  let rest = code
  while (rest > 0) {
    letters = String.fromCharCode(96 + (rest % BASE)) + letters
    rest = Math.floor(rest / BASE)
  }
  return letters
}

function makeCase(
  words: string[],
  expected: string,
  tag: string,
  reasoning: string,
): PaperCase {
  return { nums: words.map(encodeWord), expected, tag, reasoning }
}

/** The words back out of a packed case. */
export function wordsOf(c: PaperCase): string[] {
  return c.nums.map(decodeWord)
}

/**
 * The key the optimized listing uses, written the way a hand writes it:
 * 'eat' -> 'a1 e1 t1'. The canonical listing joins all 26 counts, and a
 * whiteboard column reading `0,0,1,0,0,1,…` teaches nothing — the zeros carry
 * no information and the non-zero ones are the entire idea.
 *
 * The empty word tallies nothing, so it gets a visible dash rather than a
 * blank cell. It is still a key of its own: no other word tallies to nothing.
 */
export function keyOf(word: string): string {
  const count = new Array<number>(26).fill(0)
  for (const ch of word) count[ch.charCodeAt(0) - 97]++
  const parts = count
    .map((n, i) => (n === 0 ? '' : `${String.fromCharCode(97 + i)}${n}`))
    .filter((part) => part !== '')
  return parts.length === 0 ? '—' : parts.join(' ')
}

/**
 * The case list a competent candidate writes before touching the code.
 *
 * The first four are the same word lists as `cases.json`, on purpose — the
 * paper view and the animated one should be dry-running the same input. **The
 * last three are what the shipped four never reach**: an empty list, the empty
 * string as a word, and two words that are IDENTICAL rather than merely
 * anagrams. All three are things a scene shows badly or not at all — there is
 * nothing to light up for an empty list — and all three are one line here.
 *
 * `expected` is authored and `reasoning` is authored; `paper.test.ts` runs the
 * real algorithm over all seven and refuses to let either drift.
 */
export const CASES: PaperCase[] = [
  makeCase(
    ['eat', 'tea', 'tan', 'ate', 'nat', 'bat'],
    '[["eat", "tea", "ate"], ["tan", "nat"], ["bat"]]',
    'typical — three groups of three sizes',
    'the tabled one',
  ),
  makeCase(
    ['eat', 'ate', 'bat', 'cab'],
    '[["eat", "ate"], ["bat"], ["cab"]]',
    'groups on the second word',
    'the earliest a group can grow at all; the last two words never find anyone',
  ),
  makeCase(
    ['tan', 'bat', 'eat', 'nat'],
    '[["tan", "nat"], ["bat"], ["eat"]]',
    'groups only on the last word',
    'looks exactly like the no-grouping case until the final word finds the first',
  ),
  makeCase(
    ['cat', 'dog', 'bird'],
    '[["cat"], ["dog"], ["bird"]]',
    'nothing groups at all',
    'three distinct keys, so the map is written three times and read back three times',
  ),
  makeCase(
    [],
    '[]',
    'empty list — loop never runs',
    'no words to key, so the map stays empty and its values are the empty list',
  ),
  makeCase(
    [''],
    '[[""]]',
    'the empty string is a word',
    'it tallies to nothing, which is a key like any other, so it forms a group of one',
  ),
  makeCase(
    ['a', 'a'],
    '[["a", "a"]]',
    'identical words, not merely anagrams',
    'equal words tally equally, so the second joins the first — a word IS an anagram of itself',
  ),
]

/** The case the table is drawn for: the only one long enough to earn one. */
export const WALKTHROUGH = CASES[0]

/**
 * The columns.
 *
 * `key` is the column the method lives in, and writing it out for every word
 * is what turns "compare this word against the others" into "look this name
 * up". `key seen?` and `its group NOW` are the check and the consequence, kept
 * apart for the same reason Contains Duplicate keeps BEFORE and AFTER apart.
 *
 * The group column shows only THIS word's group, not the whole partition. The
 * partition is the answer and belongs in the verdict; repeating all of it on
 * every row is what makes a hand-drawn table unreadable by the fourth word.
 */
export const COLUMNS = ['i', 'word', 'key (letter counts)', 'key seen?', 'its group NOW'] as const

/** Grid tracks, one per column. `fr` throughout so the table stays ruled at
 *  the same proportions on a phone as on the full sheet. */
export const WIDTHS = [
  'minmax(0,0.45fr)',
  'minmax(0,1.1fr)',
  'minmax(0,2.2fr)',
  'minmax(0,1fr)',
  'minmax(0,2.4fr)',
]

/** `["eat", "tea"]`, and `[]` for the empty list. */
export function penWords(words: string[]): string {
  return words.length === 0 ? '[]' : `[${words.map((w) => `"${w}"`).join(', ')}]`
}

/** The partition, in the map's insertion order — which is the order
 *  `[...groups.values()]` produces, so it is the answer verbatim. */
function penGroups(groups: Map<string, string[]>): string {
  const parts = [...groups.values()].map(penWords)
  return parts.length === 0 ? '[]' : `[${parts.join(', ')}]`
}

/**
 * The counts-to-group map solution, running for real, narrating each word as a
 * table row.
 *
 * The generator's RETURN value is the answer, computed by the same loop that
 * produced the rows — so a row and the verdict can never disagree. This is the
 * only implementation of Group Anagrams in this file; `resultOf` gets its
 * answer by draining this rather than keeping a second copy that could drift.
 *
 * Note there is no early exit: every word must be read, because a group can
 * grow on the very last one. That is what makes the `late-answer` case worth
 * arguing rather than tabling.
 */
export function* runOnPaper(words: string[]): Generator<PaperStroke, string, void> {
  const groups = new Map<string, string[]>()

  for (let i = 0; i < words.length; i++) {
    const word = words[i]
    const key = keyOf(word)
    const seen = groups.has(key)

    if (!seen) groups.set(key, [])
    const group = groups.get(key)!
    group.push(word)

    yield {
      id: `row-${i}`,
      kind: 'row',
      cells: [
        `${i}`,
        `"${word}"`,
        key,
        seen ? 'YES — join it' : 'no — open one',
        penWords(group),
      ],
      hit: seen,
    }
  }

  return penGroups(groups)
}

/** Drains `runOnPaper` for its answer, discarding the rows. */
export function resultOf(words: string[]): string {
  const run = runOnPaper(words)
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
    text: 'Group Anagrams',
    sub: 'strs: string[]  →  string[][]     ·     the words partitioned into anagram groups',
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
      input: penWords(wordsOf(c)),
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
    text: 'One row per WORD, not per letter. Everything this problem does — key a word, file it — happens at word granularity.',
  }

  const words = wordsOf(WALKTHROUGH)
  yield {
    id: 'grid',
    kind: 'grid',
    caption: `strs = ${penWords(words)}     groups = { }     expected: ${WALKTHROUGH.expected}`,
    columns: [...COLUMNS],
    widths: WIDTHS,
  }

  const run = runOnPaper(words)
  let step = run.next()
  while (!step.done) {
    yield step.value
    step = run.next()
  }
  const actual = step.value

  yield {
    id: 's2-key',
    kind: 'aside',
    pen: 'red',
    text: 'The key column is the whole method. Write the letter counts down and grouping is one lookup — miss it out and you are back to comparing every word against every other.',
  }
  yield {
    id: 's2-order',
    kind: 'aside',
    pen: 'ink',
    text: 'Nothing returns early: a group can still grow on the last word, so every word gets a row.',
  }

  yield {
    id: 'verdict',
    kind: 'verdict',
    ok: actual === WALKTHROUGH.expected,
    text: `got ${actual}`,
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
      text: `${penWords(wordsOf(c))} → ${c.reasoning} → ${resultOf(wordsOf(c))} ✓`,
    }
  }
}
