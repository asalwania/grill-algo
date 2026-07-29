/**
 * Encode and Decode Strings — the dry run, as you would do it at a whiteboard.
 *
 * Sibling of `trace.ts`, and the same discipline: a generator that ACTUALLY
 * runs the algorithm, executed at build time, never in the browser. What comes
 * out is a `PaperStroke[]` rather than a `Frame[]`, because paper is
 * append-only and needs no snapshots — see the `PaperStroke` doc in
 * `lib/types.ts` for why the two models stay separate.
 *
 * ## A list of strings on a numeric case
 *
 * `PaperCase.nums` is `number[]`, so a case is packed exactly the way
 * `trace.ts` packs a `TestCase`: char codes of the length-prefixed encoding,
 * which is this problem's own algorithm used as its own packing. `stringsOf`
 * below is the inverse, and the only place in this file that knows about it.
 * There is no `target` — the list is the whole input.
 *
 * ## What the table covers, and what it deliberately does not
 *
 * The round trip has two halves, and only DECODE earns a table. Encoding is
 * one line per string (`length` + `#` + the string) with no state carried
 * between them, so it goes in the caption. Decoding is a pointer walking a
 * single string, and every way this problem goes wrong lives in how that
 * pointer moves: skipping the marker, reading only the first digit of a
 * two-digit length, or advancing by the length instead of past the prefix as
 * well.
 */

import type { PaperCase, PaperStroke } from '../../../lib/types.ts'

// ---------------------------------------------------------------------------
// Packing, and the pen
// ---------------------------------------------------------------------------

/** The five-line decoder, duplicated rather than imported from `./trace` —
 *  the precedent `chrome.ts` set, and it keeps this module cheap. */
export function stringsOf(c: PaperCase): string[] {
  const encoded = c.nums.map((code) => String.fromCharCode(code)).join('')
  const out: string[] = []
  let i = 0
  while (i < encoded.length) {
    let j = i
    while (encoded[j] !== '#') j++
    const length = Number(encoded.slice(i, j))
    i = j + 1
    out.push(encoded.slice(i, i + length))
    i += length
  }
  return out
}

/** `""` for the empty string, so it still reads as a written thing rather than
 *  a gap on the page — which for THIS problem is the whole point. */
export function penString(text: string): string {
  return `"${text}"`
}

/** `["neet", "code"]`, and `[]` for the empty list. Those two, plus `[""]`,
 *  are three different answers, and the sheet has to make them look it. */
export function penList(items: string[]): string {
  return items.length === 0 ? '[]' : `[${items.map(penString).join(', ')}]`
}

/** How a case is named in the list. */
export function penInput(c: PaperCase): string {
  return penList(stringsOf(c))
}

function makeCase(
  strs: string[],
  expected: string,
  tag: string,
  reasoning: string,
): PaperCase {
  const encoded = strs.map((s) => `${s.length}#${s}`).join('')
  return {
    nums: [...encoded].map((ch) => ch.charCodeAt(0)),
    expected,
    tag,
    reasoning,
  }
}

// ---------------------------------------------------------------------------
// The case list
// ---------------------------------------------------------------------------

/**
 * The case list a competent candidate writes before touching the code.
 *
 * The first four are the same lists as `cases.json`, on purpose — the paper
 * view and the animated one should be dry-running the same inputs. **The last
 * three are what the shipped four never reach**: the empty list, a list holding
 * one empty string, and a list holding two. All three have no characters at
 * all, so the canvas has no tiles to light and structurally cannot show them —
 * and they are precisely the three a wrong encoder collapses into each other.
 * On paper they cost a line apiece.
 *
 * `expected` is authored and `reasoning` is authored: `expected` names the
 * ENCODED string as well as the decoded list, because writing the encoding out
 * by hand is the part that is actually a claim. `paper.test.ts` runs the real
 * algorithm over all seven and refuses to let either drift.
 */
export const CASES: PaperCase[] = [
  makeCase(
    ['neet', 'code', 'love', 'you'],
    '"4#neet4#code4#love3#you" → ["neet", "code", "love", "you"]',
    'typical — four ordinary words',
    'the tabled one',
  ),
  makeCase(
    ['we', 'said', '#5', 'yes#'],
    '"2#we4#said2##54#yes#" → ["we", "said", "#5", "yes#"]',
    'the delimiter is inside the data',
    'the decoder only ever scans for # inside a LENGTH, so the two # in the payload are never looked at',
  ),
  makeCase(
    ['hi', 'abcdefghijklm', 'x'],
    '"2#hi13#abcdefghijklm1#x" → ["hi", "abcdefghijklm", "x"]',
    'a two-digit length',
    'the second prefix is 13, not 1 — every digit before the marker belongs to the number',
  ),
  makeCase(
    ['a', '', 'bc'],
    '"1#a0#2#bc" → ["a", "", "bc"]',
    'an empty string in the middle',
    '0# consumes no characters, so i lands straight on the next prefix',
  ),
  makeCase(
    [],
    '"" → []',
    'the empty list',
    'nothing is written, so the decode loop never runs and the result stays empty',
  ),
  makeCase(
    [''],
    '"0#" → [""]',
    'one empty string — NOT the empty list',
    'two characters are written, so the loop runs once and pushes a zero-length string',
  ),
  makeCase(
    ['', ''],
    '"0#0#" → ["", ""]',
    'two empty strings',
    'four characters, two prefixes, two pushes — the length is what tells them apart, not the content',
  ),
]

/** The case the table is drawn for: the only one long enough to earn one. */
export const WALKTHROUGH = CASES[0]

/**
 * The columns, and the whole of what makes the table teachable.
 *
 * `i BEFORE` and the `i →` at the end of the action column are the same
 * BEFORE/AFTER split Contains Duplicate needs, for this problem's own reason:
 * `i` does not advance by the length. It advances past the digits, past the
 * marker, and THEN by the length. With one merged column a writer records
 * whichever they meant, every later row inherits it, and the dry run "passes"
 * against a decoder reading from the middle of a word. `digits → #` gets its
 * own column so a two-digit length cannot be silently truncated to one.
 */
export const COLUMNS = [
  'i BEFORE',
  'digits → #',
  'len',
  'took',
  'res AFTER / next i',
] as const

/** Grid tracks, one per column. `fr` throughout so the table stays ruled at
 *  the same proportions on a phone as on the full sheet. */
export const WIDTHS = [
  'minmax(0,0.6fr)',
  'minmax(0,0.8fr)',
  'minmax(0,0.5fr)',
  'minmax(0,1.4fr)',
  'minmax(0,2.6fr)',
]

/** The encoding, stated in the caption because it earns no rows: one line per
 *  string, nothing carried between them. */
export function encodeOnPaper(strs: string[]): string {
  return strs.map((s) => `${s.length}#${s}`).join('')
}

/**
 * The round trip, running for real, narrating each piece the decoder pulls out
 * as a table row.
 *
 * The generator's RETURN value is the answer — the encoded string AND the list
 * it decoded back to — computed by the same loop that produced the rows, so a
 * row and the verdict can never disagree. This is the only implementation in
 * this file; `resultOf` drains this rather than keeping a second copy that
 * could drift.
 *
 * The empty list yields NO rows, and that is honest: nothing was written, so
 * the loop never runs.
 *
 * A row is inked in red (`hit`) when a careless reader gets it wrong — a
 * multi-digit length, or a `#` sitting inside the data it just took.
 */
export function* runOnPaper(strs: string[]): Generator<PaperStroke, string, void> {
  const encoded = encodeOnPaper(strs)
  const res: string[] = []
  let i = 0
  let row = 0

  while (i < encoded.length) {
    let j = i
    while (encoded[j] !== '#') j++

    const digits = encoded.slice(i, j)
    const len = Number(digits)
    const from = j + 1
    const took = encoded.slice(from, from + len)
    const next = from + len
    res.push(took)

    yield {
      id: `row-${row}`,
      kind: 'row',
      cells: [
        `${i}`,
        penString(digits),
        `${len}`,
        penString(took),
        `${penList(res)} · i → ${next}`,
      ],
      hit: digits.length > 1 || took.includes('#'),
    }

    i = next
    row++
  }

  return `${penString(encoded)} → ${penList(res)}`
}

/** Drains `runOnPaper` for its answer, discarding the rows. */
export function resultOf(c: PaperCase): string {
  const run = runOnPaper(stringsOf(c))
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
    text: 'Encode and Decode Strings',
    sub: 'strs: string[]  →  string  →  string[]     ·     decode(encode(strs)) must be strs',
  }

  // --- 1. the list ---------------------------------------------------------
  yield {
    id: 's1',
    kind: 'section',
    step: 1,
    text: 'List the cases first',
    hint: 'One line each: input → the encoding you expect, and what it decodes back to.',
  }
  yield {
    id: 's1-warn',
    kind: 'aside',
    pen: 'red',
    text: 'Expected comes from the QUESTION, not from your code. Read it off your own loop and you have tested nothing.',
  }
  yield {
    id: 's1-sep',
    kind: 'aside',
    pen: 'red',
    text: 'Before anything else: there is NO safe separator. Comma, space, pipe, ~ — every one of them is a character a string is allowed to contain. Write the length down instead.',
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
    text: 'Encoding does not earn a table: it is one line per string, and nothing is carried between them. So it goes in the caption, and the table starts where the pointer does.',
  }

  const strs = stringsOf(WALKTHROUGH)
  const encoded = encodeOnPaper(strs)
  yield {
    id: 'grid',
    kind: 'grid',
    caption: `strs = ${penList(strs)}   encode writes len#str per string   encoded = ${penString(encoded)} (${encoded.length} chars)`,
    columns: [...COLUMNS],
    widths: WIDTHS,
  }

  const run = runOnPaper(strs)
  let step = run.next()
  while (!step.done) {
    yield step.value
    step = run.next()
  }
  const actual = step.value

  yield {
    id: 's2-advance',
    kind: 'aside',
    pen: 'red',
    text: 'i does NOT advance by len. It advances past the digits, past the #, and then by len — miss that and row 2 starts inside row 1\'s word, and every row after it is wrong.',
  }
  yield {
    id: 's2-digits',
    kind: 'aside',
    pen: 'red',
    text: 'Read digits until the #, not one digit. A string of 13 characters writes 13#, and a reader that takes the 1 and stops returns a single letter.',
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
      text: `${penInput(c)} → ${c.reasoning} → ${resultOf(c)} ✓`,
    }
  }

  yield {
    id: 's3-trio',
    kind: 'aside',
    pen: 'red',
    text: 'The last three are the whole interview. [], [""] and ["", ""] encode to "", "0#" and "0#0#" — three different strings. Any scheme that maps two of them to the same string is broken, and it is the fastest way to find out that yours is.',
  }
}
