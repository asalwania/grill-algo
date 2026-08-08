/**
 * Valid Sudoku — the approach, the way you would reason it out at a whiteboard.
 *
 * Sibling of `paper.ts`, cousin of `trace.ts`. Where the trace shows the
 * finished algorithm running and the paper sheet dry-runs it over cases, this
 * shows the DERIVATION: restate it, try the dumb thing, notice the waste, and
 * let that push you to the shared-map insight.
 *
 * `EXAMPLE.result` and every `CHECKS[].result` are authored — the author's
 * reading of the QUESTION, exactly as `PaperCase.expected` is.
 * `approach.test.ts` runs the real algorithm (via `./paper`'s `resultOf`) over
 * each raw board and refuses to let the two disagree.
 */

import type { ApproachBlock, ApproachCheck, ApproachMove } from '../../../lib/types.ts'

/* -------------------------------------------------------------------------- */
/* worked cases — raw sources, authored, pinned by the test                   */
/* -------------------------------------------------------------------------- */

type CheckSource = { nums: number[]; why: string; result: string }

function parseBoard(rows: readonly string[]): number[] {
  return rows.flatMap((row) => row.split('').map((ch) => (ch === '.' ? 0 : Number(ch))))
}

/** `(1,1)=5, (1,2)=5`, and `empty board` when nothing is filled — a hand
 *  writes the givens, not 81 cells including the blanks. */
function penBoard(values: number[]): string {
  const given = values
    .map((v, i) => (v === 0 ? null : `(${Math.floor(i / 9) + 1},${(i % 9) + 1})=${v}`))
    .filter((s): s is string => s !== null)
  return given.length === 0 ? 'empty board' : given.join(', ')
}

function toCheck({ nums, why, result }: CheckSource): ApproachCheck {
  return { input: penBoard(nums), why, result, nums }
}

/** Stage 1's concrete example — the smallest real violation: two 5s sitting
 *  in the same row, nothing else on the board. Small enough to check by eye,
 *  real enough to already be an actual Sudoku rule. */
export const EXAMPLE: CheckSource = {
  nums: parseBoard(['55.......', ...Array.from({ length: 8 }, () => '.........')]),
  why: 'row 1 holds a 5 twice — no column or box even needs checking to know this fails',
  result: 'false',
}

/**
 * Stage 7's pokes — the same three cases the paper sheet's table cannot earn
 * a row for (add-a-problem.md §10c, §11c), aimed one stage earlier: at the
 * PLAN, before it is code. An empty board and a single given are trivially
 * valid; the box-only conflict is the one that actually tests whether the
 * plan checks all three constraints, not just the two a person reads first.
 */
export const CHECKS: CheckSource[] = [
  {
    nums: parseBoard(Array.from({ length: 9 }, () => '.........')),
    why: 'no filled cell ever runs the body — nothing can conflict with nothing',
    result: 'true',
  },
  {
    nums: parseBoard(['5........', ...Array.from({ length: 8 }, () => '.........')]),
    why: 'one cell, three brand-new keys, nothing earlier to possibly match',
    result: 'true',
  },
  {
    nums: parseBoard([
      '9........',
      '.........',
      '..9......',
      ...Array.from({ length: 6 }, () => '.........'),
    ]),
    why: '(1,1)=9 and (3,3)=9 share box 1 but no row or column — only the box key catches it',
    result: 'false',
  },
]

/* -------------------------------------------------------------------------- */
/* the pseudocode shown in the reader                                        */
/* -------------------------------------------------------------------------- */

const BRUTE_FORCE = [
  'for each row:',
  '    seen = {}',
  '    for each filled cell in the row:',
  '        if digit in seen: return false',
  '        seen.add(digit)',
  '# repeat the same shape for every column',
  '# repeat the same shape for every box',
  'return true',
].join('\n')

const THE_PLAN = [
  'seen = {}                              # one shared map',
  'for each filled cell (row, col, digit):',
  '    box = boxIndex(row, col)',
  '    keys = [rowKey, colKey, boxKey]     # all three constraints, one cell',
  '    if any key already in seen:',
  '        return false',
  '    add all three keys to seen',
  'return true',
].join('\n')

/* -------------------------------------------------------------------------- */
/* the walkthrough                                                            */
/* -------------------------------------------------------------------------- */

/**
 * The eight moves, in order, each earning the next. Reorder these and it
 * becomes a solution with headings — which is the trace pane, one tab over.
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
            { label: 'Given', text: 'a 9x9 board, some cells filled with 1-9, the rest empty.' },
            {
              label: 'True',
              text: 'no digit repeats in any row, any column, or any 3x3 box — counting only the filled cells.',
            },
            { label: 'Return', text: 'true or false. Nothing gets filled in.' },
          ],
        },
        {
          kind: 'aside',
          tone: 'caution',
          label: 'watch it',
          text: "This is VALIDATION, not solving. The board may not even be completable — you never try to fill a blank cell, and empty cells are simply skipped, never compared against anything.",
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
          text: "You can't reason about a shape you can't see. One tiny board, small enough to check by eye, real enough to already break a rule.",
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
          text: "Don't be clever yet. The rules name three kinds of group — check them, one kind at a time.",
        },
        { kind: 'code', caption: 'brute force', code: BRUTE_FORCE },
        {
          kind: 'aside',
          tone: 'note',
          label: 'why keep it',
          text: 'Three honest passes, each one a set that gets thrown away. Slow, but obviously correct — the rules are checked exactly as they are stated.',
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
          text: 'Every filled cell gets read three times: once in its row’s pass, once in its column’s pass, once in its box’s pass. Three full sweeps of the same board, and nothing the row pass learned is remembered by the column pass.',
        },
        {
          kind: 'aside',
          tone: 'note',
          label: 'the smell',
          text: 'Three separate structures answering three separate questions about the SAME cell is a sign they can probably be merged into one.',
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
          text: 'A cell’s row, column and box are three different FACTS about one placement. What if one shared structure could hold all three at once?',
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
          statement: 'Encode the constraint into the key. Then one map answers all three.',
          detail: '"Row 3 already has a 7" and "box 5 already has a 7" are just two different strings. Build a key per constraint — a row-key, a column-key, a box-key, each carrying the digit — and check all three against ONE shared map as you walk the board once.',
        },
        {
          kind: 'aside',
          tone: 'caution',
          label: 'order rule',
          text: 'Check all three keys BEFORE you store any of them. Store first, and a cell would find its own freshly-written entry and report a conflict with itself.',
        },
      ],
    },
    {
      id: 'plan',
      label: 'The plan',
      title: 'Write it down as a plan you can read back.',
      blocks: [
        // Line 5 is the "any key already in seen" check the order rule turns on.
        { kind: 'code', caption: 'the plan', code: THE_PLAN, mark: [5] },
        {
          kind: 'aside',
          tone: 'note',
          label: 'read it back',
          text: 'Against the example: (1,1)=5 stores r1d5/c1d5/b1d5. (1,2)=5 checks r1d5 — already there — return false. ✓',
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
          text: 'Throw the cases the board itself cannot make interesting to look at — the plan still has to survive them.',
        },
        pokes,
        {
          kind: 'aside',
          tone: 'note',
          label: 'the point',
          text: 'The box-only case is the one that actually tests the plan: row-checking and column-checking alone would both wrongly call it valid.',
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
            { label: 'Brute force (3 passes)', time: 'O(n³)', space: 'O(1)', win: false },
            { label: 'Shared map', time: 'O(n²)', space: 'O(n²)', win: true },
          ],
          takeaway: 'One pass instead of three, a handful of map entries instead of nothing remembered at all. n is the board dimension (9) — on a board this size both approaches finish instantly, but the same trick is what makes the pattern scale to a board of any size.',
        },
      ],
    },
  ]
}
