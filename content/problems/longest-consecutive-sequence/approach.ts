/**
 * Longest Consecutive Sequence — the approach, the way you would reason it
 * out at a whiteboard.
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
 * nothing about runs or sets.
 *
 * ## The one hand-authored thing, and what keeps it honest
 *
 * `EXAMPLE.result` and every `CHECKS[].result` are authored — the author's
 * reading of the QUESTION, not the output of any code, exactly as
 * `PaperCase.expected` is. `approach.test.ts` runs the real algorithm over
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

/** A worked case before it is rendered: raw input, an authored argument and an
 *  authored answer. `toCheck` turns it into the display-ready `ApproachCheck`. */
type CheckSource = { nums: number[]; why: string; result: string }

/** `[2, 20, 4]`, and `[ ]` for the empty case so it still reads as a drawn box. */
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
  nums: [50, 51, 52, 10, 11],
  why: '50, 51, 52 are three back-to-back values; 10 and 11 are only two',
  result: '3',
}

/**
 * Stage 7's pokes — the three cases `paper.ts` singles out as the ones the 3D
 * scene structurally cannot show: the empty array has no tiles to light, one
 * element is trivial to a diagram but not to a plan, and negative numbers are
 * where a careless `value - 1` first breaks.
 */
export const CHECKS: CheckSource[] = [
  {
    nums: [],
    why: 'there are no values at all, so there is no run to find — the length of nothing is 0',
    result: '0',
  },
  {
    nums: [42],
    why: 'one value has no predecessor and nothing to walk to, so it is trivially a run of length 1',
    result: '1',
  },
  {
    nums: [-1, -2, -3, 0, 1],
    why: '-3 is the only value with no predecessor in the set (-4 is absent), and walking up from it reaches every other value: -2, -1, 0, 1',
    result: '5',
  },
]

/* -------------------------------------------------------------------------- */
/* the pseudocode shown in the reader                                         */
/* -------------------------------------------------------------------------- */

const BRUTE_FORCE = [
  'for each value v in nums:',
  '    length = 1',
  '    while (v + length) is anywhere in nums:',
  '        length += 1',
  '    best = max(best, length)',
  'return best',
].join('\n')

const THE_PLAN = [
  'seen = set(nums)                    # every value, membership only',
  'best = 0',
  'for v in seen:',
  '    if (v - 1) in seen: continue    # v is in the MIDDLE of a run — skip it',
  '    length = 1',
  '    while (v + length) in seen:',
  '        length += 1',
  '    best = max(best, length)',
  'return best',
].join('\n')

/* -------------------------------------------------------------------------- */
/* the walkthrough                                                            */
/* -------------------------------------------------------------------------- */

/**
 * The eight moves, in order, each earning the next.
 *
 * The sequence is the lesson: you cannot appreciate the insight (stage 5)
 * until you have felt the waste (stage 3), and you cannot trust the plan
 * (stage 6) until you have poked it (stage 7). Reorder these and it becomes a
 * solution with headings — which is the trace pane, one tab over.
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
            { label: 'Given', text: 'a scrambled list of numbers, in whatever order they arrived.' },
            { label: 'True', text: 'some stretch of them, sorted by VALUE, is back to back — 4, 5, 6, 7.' },
            { label: 'Return', text: 'just how long the longest such stretch is. Not which numbers, not where.' },
          ],
        },
        {
          kind: 'aside',
          tone: 'caution',
          label: 'watch it',
          text: '"Consecutive" means the VALUES are neighbours, not the array positions. [9, 5, 6, 7] contains the run 5·6·7 even though 9 sits in front of it.',
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
          text: "Don't be clever yet. What's the most obvious thing that is definitely right? Try every value as if it were the start of a run, and see how far it goes.",
        },
        { kind: 'code', caption: 'brute force', code: BRUTE_FORCE },
        {
          kind: 'aside',
          tone: 'note',
          label: 'why keep it',
          text: 'It is O(n³) — up to n starts, each walking up to n steps, each step scanning the whole array — and that is fine. A correct slow answer beats a clever wrong one. Now you have something that works, and something to improve.',
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
          text: 'Read the brute force again. It tries EVERY value as a start — including values that are obviously in the middle of a run. If 5, 6, 7 is a run, the brute force walks it starting from 5, walks most of it again starting from 6, and walks the last piece again starting from 7.',
        },
        {
          kind: 'aside',
          tone: 'note',
          label: 'the smell',
          text: '"Redoing work that a slightly different starting point already did" is a flashing sign. The fix is almost always: only ever do the work once, from the right place.',
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
          text: 'A value in the middle of a run is never worth starting from — its own run will already be found by whoever starts at the FRONT of it. How do I tell, in one step, whether a value is at the front of its run?',
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
            'A value starts a run exactly when its predecessor — value minus one — is nowhere in the set.',
          detail:
            'Remember every value in a set first, so "is X present?" is an instant lookup. Then walk through the set once: for each value, check whether (value − 1) is also in the set. If it is, this value is in the MIDDLE of a run — some earlier value will discover it — so skip it for free. If it is not, this value is the true start, and only from here do you walk forward counting. Every value gets walked at most once across the ENTIRE run of the algorithm — a value that is part of a run of length L gets touched by exactly one walk, the one starting at its front — so the total work across every walk, summed, is still O(n).',
        },
        {
          kind: 'aside',
          tone: 'caution',
          label: 'order rule',
          text: 'Build the WHOLE set before checking any predecessor. Check while the set is still being filled and an out-of-order value can look like a false start simply because its neighbour has not been inserted yet.',
        },
      ],
    },
    {
      id: 'plan',
      label: 'The plan',
      title: 'Write it down as a plan you can read back.',
      blocks: [
        // Line 4 is the "is this a start?" check the whole plan turns on.
        { kind: 'code', caption: 'the plan', code: THE_PLAN, mark: [4] },
        {
          kind: 'aside',
          tone: 'note',
          label: 'read it back',
          text: 'Against your example: seen = {50, 51, 52, 10, 11}. 50 → 49 absent, starts, walks to 52, length 3. 51 → 50 present, skip. 52 → 51 present, skip. 10 → 9 absent, starts, walks to 11, length 2. 11 → 10 present, skip. Best: 3. ✓',
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
            { label: 'Brute force', time: 'O(n³)', space: 'O(1)', win: false },
            { label: 'Sort and scan', time: 'O(n log n)', space: 'O(n)', win: false },
            { label: 'This', time: 'O(n)', space: 'O(n)', win: true },
          ],
          takeaway:
            'A little memory buys you the one check — "am I a start?" — that turns n overlapping walks into n values each touched once. That trade, spend space so you never redo work, is the Hash Set pattern again, wearing a different problem.',
        },
      ],
    },
  ]
}
