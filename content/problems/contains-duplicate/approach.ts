/**
 * Contains Duplicate — the approach, the way you would reason it out at a
 * whiteboard.
 *
 * Sibling of `paper.ts`, and a cousin of `trace.ts`. Where the trace shows the
 * finished algorithm running and the paper sheet dry-runs it over cases, this
 * shows the DERIVATION: restate it, try the dumb thing, notice the waste, and
 * let that push you to the hash-set insight.
 *
 * This file is the problem's approach identity, the way `chrome.ts` is its
 * screen identity and `paper.ts` its paper identity. Per-problem here is
 * everything: the prose, the pseudocode, the worked example and the pokes.
 * Shared is the reader — `components/approach/` knows how to draw a block and
 * nothing about sets or duplicates.
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
type CheckSource = { nums: number[]; why: string; result: string }

/** `[4, 1, 9]`, and `[ ]` for the empty case so it still reads as a drawn box. */
function penArray(nums: number[]): string {
  return nums.length === 0 ? '[ ]' : `[${nums.join(', ')}]`
}

function toCheck({ nums, why, result }: CheckSource): ApproachCheck {
  return { input: penArray(nums), why, result, nums }
}

/**
 * Stage 1's concrete example — the smallest input that is still the real
 * problem. Deliberately the SAME array as the animated trace's `first-pair`
 * case, so the derivation and the animation start from one shared picture.
 */
export const EXAMPLE: CheckSource = {
  nums: [5, 5, 9, 2],
  why: 'the second number is a 5, and a 5 is already behind us',
  result: 'true',
}

/**
 * Stage 7's pokes — the three cases `paper.ts` singles out as the ones the 3D
 * scene structurally cannot show: a scene needs tiles to light up, and the
 * empty array has none, the single element has one, and a negative or a zero
 * lights up identically to any other tile. On paper — and here, before the
 * plan is even code — they cost nothing to check and are exactly what an
 * interviewer reaches for.
 */
export const CHECKS: CheckSource[] = [
  {
    nums: [],
    why: 'the loop body never runs at all — no elements means no pair of them can match',
    result: 'false',
  },
  {
    nums: [7],
    why: 'one number has nothing else to be a duplicate OF — the condition needs a repeat, not a value',
    result: 'false',
  },
  {
    nums: [-3, 0, -3],
    why: 'a set keys on equality, not on sign or on being zero — -3 equals -3 just as plainly as 3 equals 3',
    result: 'true',
  },
]

/* -------------------------------------------------------------------------- */
/* the pseudocode shown in the reader                                         */
/* -------------------------------------------------------------------------- */

const BRUTE_FORCE = [
  'for i in 0 … n-2:',
  '    for j in i+1 … n-1:',
  '        if nums[i] == nums[j]:',
  '            return true',
  'return false',
].join('\n')

const THE_PLAN = [
  'seen = {}                      # everything walked past so far',
  'for x in nums:',
  '    if x in seen:',
  '        return true',
  '    seen.add(x)                # store AFTER the check',
  'return false',
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
            { label: 'Given', text: 'a list of numbers, in whatever order they arrived.' },
            { label: 'True', text: 'some value shows up more than once, anywhere in the list.' },
            { label: 'Return', text: 'just yes or no. Not which value, not where.' },
          ],
        },
        {
          kind: 'aside',
          tone: 'caution',
          label: 'watch it',
          text: "The answer is a boolean. It is tempting to build machinery for finding WHICH number repeats — the problem never asked for that.",
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
          text: 'Read the brute force again. For every anchor i, the inner loop walks every number after it, one at a time, asking the same question: does this equal the anchor? It never carries anything forward from one anchor to the next.',
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
          text: 'The inner loop only ever answers one question, over and over: "have I seen this number before?" What if I could answer that instantly, without scanning anything?',
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
            'Remember everything you have walked past. Then "have I seen it?" is one lookup, not a scan.',
          detail:
            'Keep a set of every number visited so far. For each new number, ask the set if it is already there. Yes? You have your duplicate. No? Drop it in and keep going. An instant lookup replaces the whole inner loop, and it never needs to know where anything sits — only whether it exists.',
        },
        {
          kind: 'aside',
          tone: 'caution',
          label: 'order rule',
          text: 'Check the set BEFORE you add the current number. Add first, and every number instantly finds itself already there — the function would return true on the very first element, every time.',
        },
      ],
    },
    {
      id: 'plan',
      label: 'The plan',
      title: 'Write it down as a plan you can read back.',
      blocks: [
        // Line 5 is `seen.add(x)` — the store-after line the order rule turns on.
        { kind: 'code', caption: 'the plan', code: THE_PLAN, mark: [5] },
        {
          kind: 'aside',
          tone: 'note',
          label: 'read it back',
          text: 'Against your example: x=5 → not in seen, store {5}. x=5 → already in seen → return true. ✓',
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
          text: 'Throw the nasty little cases at it on paper. These are exactly what an interviewer reaches for — and exactly what a diagram of tiles cannot show you.',
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
            'One pass, one O(1) lookup each. You traded a little memory for a whole factor of n. That trade — remember what you have seen so you never search twice — is the Hash Set pattern, and you will reach for it again and again.',
        },
      ],
    },
  ]
}
