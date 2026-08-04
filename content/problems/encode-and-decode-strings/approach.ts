/**
 * Encode and Decode Strings — the approach, the way you would reason it out
 * at a whiteboard.
 *
 * Sibling of `paper.ts`, and a cousin of `trace.ts`. Where the trace shows the
 * finished round trip running and the paper sheet dry-runs it over cases,
 * this shows the DERIVATION: restate it, try the dumb-but-correct thing,
 * notice what it costs, and let that push you to the length-prefix insight.
 *
 * This file is the problem's approach identity, the way `chrome.ts` is its
 * screen identity and `paper.ts` its paper identity. Per-problem here is
 * everything: the prose, the pseudocode, the worked example and the pokes.
 * Shared is the reader — `components/approach/` knows how to draw a block and
 * nothing about strings or delimiters.
 *
 * ## One wrinkle this problem has that the others don't
 *
 * Every other problem's "dumb way" is O(n²) and the insight buys a factor of
 * n. Here BOTH approaches are O(m + n) — the header-and-separator scheme
 * (stage 2) is correct and no slower, it is just clumsier: two passes to
 * encode, two loops to decode, a sizes list that has to survive the gap
 * between them, and a second delimiter. The cost block says exactly that
 * rather than pretending there is a Big-O win where there isn't one.
 *
 * ## Packing a list of strings the way `paper.ts` does
 *
 * `ApproachCheck.nums` is packed exactly as `PaperCase` packs it for this
 * problem: the char codes of the LENGTH-PREFIXED ENCODING, the same packing
 * `trace.ts`'s `makeCase` uses. There is no `target` — the list is the whole
 * input.
 *
 * ## The one hand-authored thing, and what keeps it honest
 *
 * `EXAMPLE.result` and every `CHECKS[].result` are authored — the author's
 * reading of the QUESTION, not the output of any code, exactly as
 * `PaperCase.expected` is. `approach.test.ts` runs the real round trip over
 * each raw input and refuses to let the two disagree. A result copied off the
 * loop proves nothing; a result the loop then confirms is a test.
 */

import type {
  ApproachBlock,
  ApproachCheck,
  ApproachMove,
} from '../../../lib/types.ts'

/* -------------------------------------------------------------------------- */
/* worked cases — raw sources, authored, pinned by the test                   */
/* -------------------------------------------------------------------------- */

/** A worked case before it is rendered: a raw list of strings, an authored
 *  argument and an authored answer. `toCheck` turns it into the display-ready
 *  `ApproachCheck`, packing `strs` the same way `paper.ts`'s `makeCase` does. */
type CheckSource = { strs: string[]; why: string; result: string }

/** `["neet", "code"]`, and `[]` for the empty list. */
function penList(items: string[]): string {
  return items.length === 0 ? '[]' : `[${items.map((s) => `"${s}"`).join(', ')}]`
}

/** `4#neet4#code` — this problem's own algorithm, used as its own packing. */
function packStrings(strs: string[]): string {
  return strs.map((s) => `${s.length}#${s}`).join('')
}

function toCheck({ strs, why, result }: CheckSource): ApproachCheck {
  return {
    input: penList(strs),
    why,
    result,
    nums: [...packStrings(strs)].map((ch) => ch.charCodeAt(0)),
  }
}

/**
 * Stage 1's concrete example — the smallest input that is still the real
 * problem: two ordinary words, small enough to encode and decode by hand.
 * The same two words the animated trace's default case opens with.
 */
export const EXAMPLE: CheckSource = {
  strs: ['neet', 'code'],
  why: 'each string gets its length written right in front of it, so the reader always knows exactly how far to take',
  result: '"4#neet4#code" → ["neet", "code"]',
}

/**
 * Stage 7's pokes — the three cases `paper.ts` singles out as the ones the 3D
 * scene structurally cannot show (a payload of zero characters has no tiles
 * to light) and, not incidentally, the three a broken scheme collapses into
 * each other: the empty list, a list holding one empty string, and a list
 * holding two. Three different inputs; a wrong encoder gives two of them the
 * same output.
 */
export const CHECKS: CheckSource[] = [
  {
    strs: [],
    why: 'nothing is written at all — the encoded string is empty, and decoding an empty string runs the loop zero times',
    result: '"" → []',
  },
  {
    strs: [''],
    why: 'one string of length zero still gets a full 0# written for it — two characters, not none, so this is NOT the empty list',
    result: '"0#" → [""]',
  },
  {
    strs: ['', ''],
    why: 'two zero-length strings, two separate 0# pieces — the length is what tells them apart, never the content',
    result: '"0#0#" → ["", ""]',
  },
]

/* -------------------------------------------------------------------------- */
/* the pseudocode shown in the reader                                         */
/* -------------------------------------------------------------------------- */

const BRUTE_FORCE = [
  'sizes = []',
  'for s in strs:',
  '    sizes.append(len(s))          # pass 1: measure everything first',
  '',
  "header = ','.join(str(n) for n in sizes) + '#'",
  "encoded = header + ''.join(strs)  # pass 2: THEN write the payload",
  '',
  '# decode reverses it: read sizes up to the #, THEN slice the payload',
].join('\n')

const THE_PLAN = [
  "encoded = ''",
  'for s in strs:',
  "    encoded += str(len(s)) + '#' + s",
  'return encoded              # ── encode done',
  '',
  'i = 0',
  'result = []',
  'while i < len(encoded):',
  '    j = i',
  "    while encoded[j] != '#':",
  '        j += 1',
  '    length = int(encoded[i:j])       # digits BEFORE the marker',
  '    i = j + 1                        # step past the digits and the marker',
  '    result.append(encoded[i:i+length])',
  '    i += length                      # THEN step past the string itself',
  'return result',
].join('\n')

/* -------------------------------------------------------------------------- */
/* the walkthrough                                                            */
/* -------------------------------------------------------------------------- */

/**
 * The eight moves, in order, each earning the next.
 *
 * The sequence is the lesson: you cannot appreciate the insight (stage 5) until
 * you have felt the waste (stage 3), and you cannot trust the plan (stage 6)
 * until you have poked it (stage 7). Reorder these and it becomes a solution
 * with headings — which is the trace pane, one tab over.
 */
export function buildApproach(): ApproachMove[] {
  const example = toCheck(EXAMPLE)
  const pokes: ApproachBlock = { kind: 'checks', rows: CHECKS.map(toCheck) }

  return [
    {
      id: 'understand',
      label: 'Read it back',
      title: "Say what you're actually being asked.",
      blocks: [
        {
          kind: 'text',
          text: 'Before a single line of code, put the problem in your own words. Strip the jargon until only the shape is left.',
        },
        {
          kind: 'restate',
          rows: [
            {
              label: 'Given',
              text: 'a list of strings — any of them can be empty, or hold ANY character at all.',
            },
            {
              label: 'True',
              text: 'decoding what you encoded must reproduce the exact same list — same strings, same order, same count.',
            },
            { label: 'Return', text: 'one string from encode; the original list back from decode.' },
          ],
        },
        {
          kind: 'aside',
          tone: 'caution',
          label: 'watch it',
          text: "There is no safe separator. Comma, space, newline, even '#' itself — every character you could pick is one a string is allowed to contain. Reach for one and some input breaks your scheme.",
        },
      ],
    },
    {
      id: 'concrete',
      label: 'Draw one',
      title: 'Draw the smallest real example.',
      blocks: [
        {
          kind: 'text',
          text: "You can't reason about a shape you can't see. Put one tiny case on paper — small enough to finish by hand, real enough to be the actual problem.",
        },
        { kind: 'checks', rows: [example] },
      ],
    },
    {
      id: 'brute',
      label: 'The dumb way',
      title: 'Do the dumb thing first — and let it be correct.',
      blocks: [
        {
          kind: 'text',
          text: "Don't be clever yet. Since no character is a safe separator over the DATA, control the alphabet instead: measure every string first, write those lengths out comma-separated as a header, close it with one #, then dump all the strings after it. A comma is safe here because the header only ever holds digits — never the strings themselves.",
        },
        { kind: 'code', caption: 'header + separator', code: BRUTE_FORCE },
        {
          kind: 'aside',
          tone: 'note',
          label: 'why keep it',
          text: 'It is correct for every input, including the nasty ones. Now you have something that works, and something to improve.',
        },
      ],
    },
    {
      id: 'waste',
      label: 'Find the waste',
      title: 'Where does it repeat itself?',
      blocks: [
        {
          kind: 'text',
          text: 'Read the header scheme again. It walks the whole list once just to measure every string, then a second time to actually write them — a sizes list has to stay alive across that entire gap for no reason but bookkeeping. And the header now needs its own separator (the comma) to tell one size from the next: you traded "no safe separator over the data" for "a second delimiter, over the sizes."',
        },
        {
          kind: 'aside',
          tone: 'note',
          label: 'the smell',
          text: 'Two passes over the same information, and a value carried across the gap between them, is a sign the pieces are farther apart than they need to be.',
        },
      ],
    },
    {
      id: 'pivot',
      label: 'The question',
      title: '',
      blocks: [
        {
          kind: 'pivot',
          text: "What if a length didn't need a separate section at all — what if it just sat immediately next to the string it measures?",
        },
      ],
    },
    {
      id: 'insight',
      label: 'The insight',
      title: '',
      climax: true,
      blocks: [
        {
          kind: 'insight',
          statement:
            'Write the length right where it is needed: immediately before the string it describes, with one marker between them.',
          detail:
            "Encode each string as length#string, one after another, in a single pass. To decode, read digits until the # — those digits can only ever be a length, never data, because the read position always starts exactly where a length begins. Take that many characters, and the next length starts right after. No header, no second pass, nothing to carry.",
        },
        {
          kind: 'aside',
          tone: 'caution',
          label: 'order rule',
          text: "Read EVERY digit up to the #, not just the first one — a 13-character string writes '13#', and stopping at the first digit reads a length of 1. And advance past the digits AND the marker before adding the length — advancing by the length alone, from where the digits started, lands you inside the string.",
        },
      ],
    },
    {
      id: 'plan',
      label: 'The plan',
      title: 'Write it down as a plan you can read back.',
      blocks: [
        // Lines 13 and 15 are the two-step advance the order rule turns on:
        // past the digits and marker first, THEN past the string itself.
        { kind: 'code', caption: 'the plan', code: THE_PLAN, mark: [13, 15] },
        {
          kind: 'aside',
          tone: 'note',
          label: 'read it back',
          text: 'Against your example: i=0, digits "4" → length 4, i moves to 2, take "neet", i moves to 6. i=6, digits "4" → length 4, i moves to 8, take "code", i moves to 12 = end. Return ["neet", "code"]. ✓',
        },
      ],
    },
    {
      id: 'poke',
      label: 'Poke it',
      title: 'Poke the plan before you trust it.',
      blocks: [
        {
          kind: 'text',
          text: 'Throw the nasty little cases at it on paper. These are exactly what an interviewer reaches for — and exactly what a diagram of tiles cannot show you, since an empty payload lights nothing.',
        },
        pokes,
        {
          kind: 'aside',
          tone: 'note',
          label: 'the point',
          text: 'If the plan survives these on paper, the code will survive them too. This is why you trace before you type.',
        },
      ],
    },
    {
      id: 'cost',
      label: 'What it costs',
      title: 'Name the trade you just made.',
      blocks: [
        {
          kind: 'cost',
          rows: [
            {
              label: 'Header + separator',
              time: 'O(m+n), two passes',
              space: 'O(n) extra — the sizes list',
              win: false,
            },
            { label: 'This', time: 'O(m+n), one pass', space: 'O(1) extra', win: true },
          ],
          takeaway:
            'Both run in the same asymptotic time — the rare case where the win is not a Big-O factor. Writing the length right next to the data it measures means nothing has to survive between two passes, and only one delimiter, the #, ever needs to exist at all.',
        },
      ],
    },
  ]
}
