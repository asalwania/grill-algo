/**
 * Top K Frequent Elements — the approach, the way you would reason it out at
 * a whiteboard.
 *
 * Sibling of `paper.ts`, and a cousin of `trace.ts`. Where the trace shows the
 * finished algorithm running and the paper sheet dry-runs it over cases, this
 * shows the DERIVATION: restate it, try the dumb thing, notice the waste, and
 * let that push you to the bucket insight.
 *
 * This file is the problem's approach identity, the way `chrome.ts` is its
 * screen identity and `paper.ts` its paper identity. Per-problem here is
 * everything: the prose, the pseudocode, the worked example and the pokes.
 * Shared is the reader — `components/approach/` knows how to draw a block and
 * nothing about counts or buckets.
 *
 * ## The order is genuinely free
 *
 * Unlike Two Sum or Contains Duplicate, this problem accepts the k values in
 * ANY order — `approach.test.ts` therefore does not just re-check the exact
 * authored string, it also asserts the returned set really IS a valid top k
 * (k distinct values, nothing left out more frequent than anything taken),
 * the same second check `paper.test.ts` runs.
 *
 * ## The one hand-authored thing, and what keeps it honest
 *
 * `EXAMPLE.result` and every `CHECKS[].result` are authored — the author's
 * reading of the QUESTION, not the output of any code, exactly as
 * `PaperCase.expected` is. `approach.test.ts` runs the real count-then-bucket
 * algorithm over each raw input and refuses to let the two disagree. A result
 * copied off the loop proves nothing; a result the loop then confirms is a
 * test.
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
type CheckSource = { nums: number[]; k: number; why: string; result: string }

/** `[3, 1, 2]`, and `[ ]` for the empty case so it still reads as a drawn box. */
function penList(nums: number[]): string {
  return nums.length === 0 ? '[ ]' : `[${nums.join(', ')}]`
}

/** How a case is named in the reader — the array plus the k that goes with it. */
function penInput(nums: number[], k: number): string {
  return `${penList(nums)}  k=${k}`
}

function toCheck({ nums, k, why, result }: CheckSource): ApproachCheck {
  return { input: penInput(nums, k), why, result, nums, target: k }
}

/**
 * Stage 1's concrete example — the smallest input that is still the real
 * problem. Deliberately the SAME array the animated trace defaults to
 * (`first-pair`), so the derivation and the animation start from one shared
 * picture.
 */
export const EXAMPLE: CheckSource = {
  nums: [7, 7, 4, 9, 4, 4],
  k: 2,
  why: "7 doubles up first, but 4 catches up and finishes with three — you only know who's ahead once every element has been counted",
  result: '[4, 7]',
}

/**
 * Stage 7's pokes — the three cases `paper.ts` singles out as the ones the 3D
 * scene structurally cannot show: a single element, negatives, and a genuine
 * TIE. The tie matters most: this problem accepts any order, so it has
 * several correct answers, and the plan must not pretend it only has one.
 */
export const CHECKS: CheckSource[] = [
  {
    nums: [1],
    k: 1,
    why: 'one count of one, one bucket, one value taken — the shortest run there is',
    result: '[1]',
  },
  {
    nums: [-2, -2, 3],
    k: 1,
    why: 'a value is a map KEY; only its COUNT ever becomes a bucket index, so a negative value indexes nothing',
    result: '[-2]',
  },
  {
    nums: [1, 1, 2, 2],
    k: 2,
    why: 'both values count two and both are taken, so the tie never has to be broken — any order is accepted',
    result: '[1, 2]',
  },
]

/* -------------------------------------------------------------------------- */
/* the pseudocode shown in the reader                                         */
/* -------------------------------------------------------------------------- */

const BRUTE_FORCE = [
  'counts = {}',
  'for x in nums:',
  '    counts[x] = counts.get(x, 0) + 1',
  'pairs = list(counts.items())',
  'pairs.sort(key=lambda p: p[1], reverse=True)   # sort by count, descending',
  'return [value for value, count in pairs[:k]]',
].join('\n')

const THE_PLAN = [
  'counts = {}',
  'for x in nums:',
  '    counts[x] = counts.get(x, 0) + 1',
  '',
  'buckets = [[] for _ in range(len(nums) + 1)]   # index = a possible count',
  'for value, freq in counts.items():',
  '    buckets[freq].append(value)                # the count IS the index',
  '',
  'out = []',
  'for freq in range(len(nums), 0, -1):',
  '    for value in buckets[freq]:',
  '        out.append(value)',
  '        if len(out) == k:',
  '            return out',
  'return out',
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
            { label: 'Given', text: 'a list of numbers, and a count k.' },
            { label: 'True', text: 'some values occur more often than others.' },
            {
              label: 'Return',
              text: 'the k values that occur most often — not their counts, and in ANY order.',
            },
          ],
        },
        {
          kind: 'aside',
          tone: 'caution',
          label: 'watch it',
          text: 'A value is a map key like any other — a negative number is completely ordinary here. It is only ever a COUNT that becomes an index, never the value itself.',
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
          text: "Don't be clever yet. What's the most obvious thing that is definitely right? Count every value, then sort the counts and read off the top k.",
        },
        { kind: 'code', caption: 'brute force', code: BRUTE_FORCE },
        {
          kind: 'aside',
          tone: 'note',
          label: 'why keep it',
          text: 'It is O(n log n) for the sort, and that is fine — a correct slow answer beats a clever wrong one. Now you have something that works, and something to improve.',
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
          text: "Read the brute force again. It sorts EVERY distinct value by count, just to read the first k off the top — putting the other n - k values in order too, which nobody ever asked for.",
        },
        {
          kind: 'aside',
          tone: 'note',
          label: 'the smell',
          text: 'A full comparison sort, when the numbers being sorted are already bounded by something small, is a flashing sign. A count can never exceed the length of the array — that bound is a lever waiting to be used.',
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
          text: "A count can never be bigger than n. What if, instead of sorting the counts, I used each one as an ADDRESS?",
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
            'Counts are bounded by n — so index by count instead of sorting by it.',
          detail:
            "Make one bucket per possible frequency, 0 through n. Drop every value into buckets[its count]. Then walk the frequency axis from n down to 1, taking values out of each bucket you pass, until you have k. Nothing is ever compared to anything else — a value's place is exactly where its count says it belongs.",
        },
        {
          kind: 'aside',
          tone: 'caution',
          label: 'watch it',
          text: 'The empty buckets you pass near the top are not wasted work — walking the whole axis, n down to 1, is exactly what makes this O(n) rather than O(n log n). Jumping straight to the first occupied bucket would mean knowing where it is, which is a search of its own.',
        },
      ],
    },
    {
      id: 'plan',
      label: 'The plan',
      title: 'Write it down as a plan you can read back.',
      blocks: [
        // Line 7 is `buckets[freq].append(value)` — the count-as-index line the
        // whole insight turns on.
        { kind: 'code', caption: 'the plan', code: THE_PLAN, mark: [7] },
        {
          kind: 'aside',
          tone: 'note',
          label: 'read it back',
          text: 'Against your example: counts = {7:2, 4:3, 9:1}. buckets[2]=[7], buckets[3]=[4], buckets[1]=[9]. Walk freq 6…1: freq 3 → out=[4]; freq 2 → out=[4, 7], out has k=2 → return [4, 7]. ✓',
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
            { label: 'Count + sort', time: 'O(n log n)', space: 'O(n)', win: false },
            { label: 'This', time: 'O(n)', space: 'O(n)', win: true },
          ],
          takeaway:
            'Sorting the counts spent a log factor you never needed — every count is already bounded by n, so indexing by count turns "find the biggest" into one linear walk. You traded a comparison sort for an array lookup.',
        },
      ],
    },
  ]
}
