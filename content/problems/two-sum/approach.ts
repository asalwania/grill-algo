/**
 * Two Sum — the approach, the way you would reason it out at a whiteboard.
 *
 * Sibling of `paper.ts`, and a cousin of `trace.ts`. Where the trace shows the
 * finished algorithm running and the paper sheet dry-runs it over cases, this
 * shows the DERIVATION: restate it, try the dumb thing, notice the waste, and
 * let that push you to the hash-map insight.
 *
 * This file is the problem's approach identity, the way `chrome.ts` is its
 * screen identity and `paper.ts` its paper identity. Per-problem here is
 * everything: the prose, the pseudocode, the worked example and the pokes.
 * Shared is the reader — `components/approach/` knows how to draw a block and
 * nothing about pairs summing to a target.
 *
 * ## The one hand-authored thing, and what keeps it honest
 *
 * `EXAMPLE.result` and every `CHECKS[].result` are authored — the author's
 * reading of the QUESTION, not the output of any code, exactly as
 * `PaperCase.expected` is. `approach.test.ts` runs the real one-pass algorithm
 * over each raw input and refuses to let the two disagree. A result copied off
 * the loop proves nothing; a result the loop then confirms is a test.
 */

import type {
  ApproachBlock,
  ApproachCheck,
  ApproachMove,
} from '../../../lib/types.ts'

/* -------------------------------------------------------------------------- */
/* worked cases — raw sources, authored, pinned by the test                   */
/* -------------------------------------------------------------------------- */

/** A worked case before it is rendered: raw input, an authored argument and an
 *  authored answer. `toCheck` turns it into the display-ready `ApproachCheck`. */
type CheckSource = { nums: number[]; target: number; why: string; result: string }

/** `[3, 3]`, and `[ ]` for the empty case so it still reads as a drawn box. */
function penArray(nums: number[]): string {
  return nums.length === 0 ? '[ ]' : `[${nums.join(', ')}]`
}

/** How a case is named in the reader — array plus the scalar that goes with it. */
function penInput(nums: number[], target: number): string {
  return `${penArray(nums)} · t=${target}`
}

function toCheck({ nums, target, why, result }: CheckSource): ApproachCheck {
  return { input: penInput(nums, target), why, result, nums, target }
}

/**
 * Stage 1's concrete example — the smallest input that is still the real
 * problem. Deliberately the SAME array the animated trace defaults to
 * (`first-pair` reaches its answer at i = 1), so the derivation and the
 * animation start from one shared picture.
 */
export const EXAMPLE: CheckSource = {
  nums: [2, 7, 11, 15],
  target: 9,
  why: '2 + 7 = 9, so the two you want sit at positions 0 and 1',
  result: '[0, 1]',
}

/**
 * Stage 7's pokes — the nasty little cases the plan has to survive on paper.
 * These are the three an interviewer reaches for, and each is one the canvas
 * never makes interesting: equal values that ARE the answer, a number that must
 * not pair with itself, and no pair at all. The same asymmetry that justifies
 * the paper sheet, aimed one stage earlier — at the plan, before it is code.
 */
export const CHECKS: CheckSource[] = [
  {
    nums: [3, 3],
    target: 6,
    why: 'store-after means the second 3 finds the first — two spots, not one used twice',
    result: '[0, 1]',
  },
  {
    nums: [3, 2, 4],
    target: 6,
    why: '3 cannot pair with itself (nothing is stored yet); 4 later finds the 2',
    result: '[1, 2]',
  },
  {
    nums: [2, 7, 11],
    target: 100,
    why: 'every lookup misses, the loop runs out and falls through',
    result: '[]',
  },
]

/* -------------------------------------------------------------------------- */
/* the pseudocode shown in the reader                                         */
/* -------------------------------------------------------------------------- */

const BRUTE_FORCE = [
  'for i in 0 … n-1:',
  '    for j in i+1 … n-1:',
  '        if nums[i] + nums[j] == target:',
  '            return [i, j]',
  'return []',
].join('\n')

const THE_PLAN = [
  'seen = {}                      # value → index',
  'for i, x in enumerate(nums):',
  '    need = target − x',
  '    if need in seen:',
  '        return [seen[need], i]',
  '    seen[x] = i                # store AFTER the check',
  'return []',
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
            { label: 'Given', text: 'a list of numbers, and one target.' },
            { label: 'True', text: 'exactly two of them add up to the target.' },
            {
              label: 'Return',
              text: 'where they sit — the two positions. Not the numbers.',
            },
          ],
        },
        {
          kind: 'aside',
          tone: 'caution',
          label: 'watch it',
          text: "The output is indices, not values. Miss that one word and you'll solve a different problem perfectly.",
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
          text: "Don't be clever yet. What's the most obvious thing that is definitely right? Check every pair.",
        },
        { kind: 'code', caption: 'brute force', code: BRUTE_FORCE },
        {
          kind: 'aside',
          tone: 'note',
          label: 'why keep it',
          text: 'It is O(n²), and that is fine — a correct slow answer beats a clever wrong one. Now you have something that works, and something to improve.',
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
          text: 'Read the brute force again and ask what work it redoes. For every i, the inner loop re-scans the rest of the list — asking the same shape of question over and over.',
        },
        {
          kind: 'aside',
          tone: 'note',
          label: 'the smell',
          text: '"Searching a list, from the start, repeatedly" is a flashing sign. The fix is almost always: remember what you have already seen.',
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
          text: 'Give it a name: need = target − nums[i]. The whole inner loop is really one question — "have I already seen need?" What if I could answer that instantly?',
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
            'Remember everything you have walked past. Then the partner is one lookup away.',
          detail:
            'Keep a map from value → index as you walk the list once. For each number, ask the map for its need. There? You have found the pair. Not there? Drop this number into the map and keep going. An instant lookup replaces the whole inner loop.',
        },
        {
          kind: 'aside',
          tone: 'caution',
          label: 'order rule',
          text: 'Look up need BEFORE you store the current number. Store first, and a number can pair with itself — [3, 2, 4] with target 6 comes out [0, 0]. This one detail is the whole trap.',
        },
      ],
    },
    {
      id: 'plan',
      label: 'The plan',
      title: 'Write it down as a plan you can read back.',
      blocks: [
        // Line 6 is `seen[x] = i` — the store-after line the order rule turns on.
        { kind: 'code', caption: 'the plan', code: THE_PLAN, mark: [6] },
        {
          kind: 'aside',
          tone: 'note',
          label: 'read it back',
          text: 'Against your example: i=0 → need 7, not seen, store 2→0. i=1 → need 2, it is in seen at 0 → return [0, 1]. ✓',
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
          text: 'Throw the nasty little cases at it on paper. These are exactly what an interviewer reaches for.',
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
            { label: 'Brute force', time: 'O(n²)', space: 'O(1)', win: false },
            { label: 'This', time: 'O(n)', space: 'O(n)', win: true },
          ],
          takeaway:
            'One pass, one O(1) lookup each. You traded a little memory for a whole factor of n. That trade — remember what you have seen so you never search twice — is the Hash Map pattern, and you will reach for it again and again.',
        },
      ],
    },
  ]
}
