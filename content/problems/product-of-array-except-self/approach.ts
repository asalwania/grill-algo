/**
 * Product of Array Except Self — the approach, the way you would reason it
 * out at a whiteboard.
 *
 * Sibling of `paper.ts`, and a cousin of `trace.ts`. Where the trace shows the
 * finished algorithm running and the paper sheet dry-runs it over cases, this
 * shows the DERIVATION: restate it, try the dumb thing, notice the waste, and
 * let that push you to the prefix/suffix insight.
 *
 * This file is the problem's approach identity, the way `chrome.ts` is its
 * screen identity and `paper.ts` its paper identity. Per-problem here is
 * everything: the prose, the pseudocode, the worked example and the pokes.
 * Shared is the reader — `components/approach/` knows how to draw a block and
 * nothing about products or running totals.
 *
 * ## The one hand-authored thing, and what keeps it honest
 *
 * `EXAMPLE.result` and every `CHECKS[].result` are authored — the author's
 * reading of the QUESTION, not the output of any code, exactly as
 * `PaperCase.expected` is. `approach.test.ts` runs the real two-pass algorithm
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
type CheckSource = { nums: number[]; why: string; result: string }

/** `[2, 3, 4, 5]`, and `[ ]` for the empty case so it still reads as a drawn
 *  box. */
function penArray(nums: number[]): string {
  return nums.length === 0 ? '[ ]' : `[${nums.join(', ')}]`
}

function toCheck({ nums, why, result }: CheckSource): ApproachCheck {
  return { input: penArray(nums), why, result, nums }
}

/**
 * Stage 1's concrete example — the smallest input that is still the real
 * problem. The same array the animated trace defaults to, so the derivation
 * and the animation start from one shared picture.
 */
export const EXAMPLE: CheckSource = {
  nums: [2, 3, 4, 5],
  why: 'each answer is the product of the OTHER three: 3·4·5=60, 2·4·5=40, 2·3·5=30, 2·3·4=24',
  result: '[60, 40, 30, 24]',
}

/**
 * Stage 7's pokes — the three cases `paper.ts` singles out as the ones the 3D
 * scene has nothing interesting to show for: LeetCode pins n >= 2, so these
 * three sit BELOW the constraint on purpose. They are exactly where a
 * loop-bounds mistake or a wrong empty-product shows up, and an interviewer
 * asks for them precisely because the general case can hide both.
 */
export const CHECKS: CheckSource[] = [
  {
    nums: [],
    why: 'no positions at all, so neither pass runs and the answer is empty — not a single [1]',
    result: '[]',
  },
  {
    nums: [7],
    why: 'no other element exists, and the product of nothing is 1 — not 0, and not an empty array',
    result: '[1]',
  },
  {
    nums: [3, 5],
    why: 'with exactly two elements, each answer is simply the OTHER one',
    result: '[5, 3]',
  },
]

/* -------------------------------------------------------------------------- */
/* the pseudocode shown in the reader                                         */
/* -------------------------------------------------------------------------- */

const BRUTE_FORCE = [
  'answer = [1] * len(nums)',
  'for i in range(len(nums)):',
  '    for j in range(len(nums)):',
  '        if j != i:',
  '            answer[i] *= nums[j]',
  'return answer',
].join('\n')

const THE_PLAN = [
  'n = len(nums)',
  'answer = [1] * n',
  '',
  'prefix = 1',
  'for i in range(n):',
  '    answer[i] = prefix          # everything to the LEFT of i',
  '    prefix *= nums[i]           # THEN fold nums[i] in, for i+1 next',
  '',
  'suffix = 1',
  'for i in range(n - 1, -1, -1):',
  '    answer[i] *= suffix         # fold in everything to the RIGHT of i',
  '    suffix *= nums[i]           # THEN fold nums[i] in, for i-1 next',
  '',
  'return answer',
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
            { label: 'Given', text: 'a list of numbers.' },
            {
              label: 'True',
              text: 'every position has a product of all the OTHER elements, itself excluded.',
            },
            { label: 'Return', text: 'one array of those products — no division allowed.' },
          ],
        },
        {
          kind: 'aside',
          tone: 'caution',
          label: 'watch it',
          text: "The obvious first idea is total ÷ nums[i]. The problem forbids it outright — and even ignoring the rule, a single zero breaks it: you cannot divide by zero, and at every OTHER position that zero already erased the one factor you needed.",
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
          text: "Don't be clever yet. What's the most obvious thing that is definitely right? For every position, multiply together everything else, one at a time.",
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
          text: "Read the brute force again. Position i and position i+1 multiply together almost the SAME set of numbers — all but one differs — yet each one is recomputed from nothing.",
        },
        {
          kind: 'aside',
          tone: 'note',
          label: 'the smell',
          text: 'Recomputing something from scratch that barely changed from the last position is a flashing sign. The fix is almost always: carry a running total forward instead of starting over.',
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
          text: "answer[i] is really just two pieces multiplied together: everything to the LEFT of i, and everything to the RIGHT of i. What if I built each piece with a single running product instead of restarting every time?",
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
            'Walk it twice: once carrying the product of everything to the left, once carrying the product of everything to the right.',
          detail:
            "Left to right, keep a running product and drop it into answer[i] BEFORE folding nums[i] in — so each cell gets everything before it, never itself. Then walk right to left the same way, multiplying a running RIGHT-hand product into what is already there. No division, and no second array: the answer array doubles as both passes' storage.",
        },
        {
          kind: 'aside',
          tone: 'caution',
          label: 'order rule',
          text: 'Fold nums[i] into the running product AFTER writing the cell, never before. Fold first and answer[i] multiplies by itself — wrong at every position, in both passes.',
        },
      ],
    },
    {
      id: 'plan',
      label: 'The plan',
      title: 'Write it down as a plan you can read back.',
      blocks: [
        // Lines 7 and 12 are the two "fold in AFTER" lines the order rule turns on.
        { kind: 'code', caption: 'the plan', code: THE_PLAN, mark: [7, 12] },
        {
          kind: 'aside',
          tone: 'note',
          label: 'read it back',
          text: 'Against your example: prefix pass → answer = [1, 2, 6, 24]. Suffix pass, right to left: i=3 → ×1 stays 24, suffix becomes 5; i=2 → 6×5=30, suffix becomes 20; i=1 → 2×20=40, suffix becomes 60; i=0 → 1×60=60. Return [60, 40, 30, 24]. ✓',
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
          text: 'Throw the nasty little cases at it on paper. These are exactly what an interviewer reaches for — and exactly where a loop-bounds mistake or a wrong empty product shows up.',
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
            { label: 'Brute force', time: 'O(n²)', space: 'O(1) extra', win: false },
            { label: 'This', time: 'O(n)', space: 'O(1) extra', win: true },
          ],
          takeaway:
            'Two single passes instead of a full recomputation at every position — and both running products live in two scalars, not two extra arrays, so the answer array is the only thing either pass ever writes into.',
        },
      ],
    },
  ]
}
