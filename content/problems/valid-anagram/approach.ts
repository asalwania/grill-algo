/**
 * Valid Anagram — the approach, the way you would reason it out at a
 * whiteboard.
 *
 * Sibling of `paper.ts`, and a cousin of `trace.ts`. Where the trace shows the
 * finished algorithm running and the paper sheet dry-runs it over cases, this
 * shows the DERIVATION: restate it, try the dumb thing, notice the waste, and
 * let that push you to the count-map insight.
 *
 * This file is the problem's approach identity, the way `chrome.ts` is its
 * screen identity and `paper.ts` its paper identity. Per-problem here is
 * everything: the prose, the pseudocode, the worked example and the pokes.
 * Shared is the reader — `components/approach/` knows how to draw a block and
 * nothing about letters or counts.
 *
 * ## Packing two strings the way `paper.ts` does
 *
 * `ApproachCheck.nums`/`target` are packed exactly as `PaperCase` packs them:
 * char codes of `s` then `t`, with `target` as the boundary index. `toCheck`
 * below is the inverse of `paper.ts`'s `split` — see that file for why.
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

/** A worked case before it is rendered: raw strings, an authored argument and
 *  an authored answer. `toCheck` turns it into the display-ready
 *  `ApproachCheck`, packing `s`/`t` the same way `paper.ts`'s `makeCase` does. */
type CheckSource = { s: string; t: string; why: string; result: string }

/** `"cat" vs "act"`, and `""` reads as an empty pair of quotes so it still
 *  reads as a written thing rather than a gap on the page. */
function penInput(s: string, t: string): string {
  return `"${s}" vs "${t}"`
}

function toCheck({ s, t, why, result }: CheckSource): ApproachCheck {
  return {
    input: penInput(s, t),
    why,
    result,
    nums: [...s, ...t].map((ch) => ch.charCodeAt(0)),
    target: s.length,
  }
}

/**
 * Stage 1's concrete example — the smallest input that is still the real
 * problem: three distinct letters, genuinely rearranged, small enough to
 * count by hand.
 */
export const EXAMPLE: CheckSource = {
  s: 'cat',
  t: 'act',
  why: 'the same three letters, each used once, just in a different order',
  result: 'true',
}

/**
 * Stage 7's pokes — the same three cases `paper.ts` singles out as the ones
 * that either the 3D scene cannot show at all (empty strings have no tiles)
 * or the ones people get quietly wrong: a length mismatch that a lazy plan
 * would let slide by, and two strings built from the same letter SET but
 * different counts, which "same letters" makes sound true when it isn't.
 */
export const CHECKS: CheckSource[] = [
  {
    s: '',
    t: '',
    why: 'lengths match at zero, there is nothing to count and nothing to spend, so it falls straight through to true',
    result: 'true',
  },
  {
    s: 'ab',
    t: 'a',
    why: 'the length guard has to fire here — without it, spending a single a and simply running out of t looks like success',
    result: 'false',
  },
  {
    s: 'aacc',
    t: 'ccac',
    why: 'both strings use only a and c, but t asks for three cs and s only ever counted two',
    result: 'false',
  },
]

/* -------------------------------------------------------------------------- */
/* the pseudocode shown in the reader                                         */
/* -------------------------------------------------------------------------- */

const BRUTE_FORCE = [
  'if len(s) != len(t):',
  '    return false',
  'used = [false] * len(t)',
  'for i in 0 … len(s)-1:',
  '    matched = false',
  '    for j in 0 … len(t)-1:',
  '        if not used[j] and s[i] == t[j]:',
  '            used[j] = true',
  '            matched = true',
  '            break',
  '    if not matched:',
  '        return false',
  'return true',
].join('\n')

const THE_PLAN = [
  'if len(s) != len(t):',
  '    return false                # different lengths can never be anagrams',
  '',
  'counts = {}                     # letter → how many times seen in s',
  'for ch in s:',
  '    counts[ch] = counts.get(ch, 0) + 1',
  '',
  'for ch in t:',
  '    if counts.get(ch, 0) == 0:',
  '        return false             # never in s, or already fully spent',
  '    counts[ch] -= 1',
  '',
  'return true',
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
            { label: 'Given', text: 'two strings, s and t.' },
            {
              label: 'True',
              text: 't uses exactly the letters of s, the same number of times each.',
            },
            { label: 'Return', text: 'just yes or no. Not which letters, not where.' },
          ],
        },
        {
          kind: 'aside',
          tone: 'caution',
          label: 'watch it',
          text: '"Same letters" is not the same claim as "same letters, same COUNT of each." aacc and ccac share a letter set but not a multiset — that gap is the whole problem.',
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
          text: "Don't be clever yet. What's the most obvious thing that is definitely right? For every letter of s, go find an unused copy of it in t.",
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
          text: 'Read the brute force again. For every letter of s, the inner loop scans t from the start, skipping whatever is already crossed off, until it finds a free match. None of that scanning is remembered — the next letter of s re-scans the same stretch of t from scratch.',
        },
        {
          kind: 'aside',
          tone: 'note',
          label: 'the smell',
          text: '"Searching a list, from the start, repeatedly" is a flashing sign. The fix is almost always: remember what you have already seen, instead of re-finding it.',
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
          text: "Every search is really asking: how many of THIS letter does s still owe, and how many does t still need? What if I tracked that count instead of hunting for a match each time?",
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
            "Don't search for the letter — count it. Two strings are anagrams exactly when every count nets back to zero.",
          detail:
            'Walk s once, tallying how many of each letter it holds. Then walk t once, and for each letter, spend one count. A letter that was never counted, or one whose count already hit zero, means the two strings cannot be anagrams. Make it through all of t and every letter balanced exactly.',
        },
        {
          kind: 'aside',
          tone: 'caution',
          label: 'order rule',
          text: 'Check the lengths FIRST. Skip that guard and a shorter t can simply run out of letters to spend before finding a mismatch — "ab" vs "a" would spend one a, hit the end of t, and report true.',
        },
      ],
    },
    {
      id: 'plan',
      label: 'The plan',
      title: 'Write it down as a plan you can read back.',
      blocks: [
        // Line 1 is the length guard — the order rule the caution above turns on.
        { kind: 'code', caption: 'the plan', code: THE_PLAN, mark: [1] },
        {
          kind: 'aside',
          tone: 'note',
          label: 'read it back',
          text: 'Against your example: lengths both 3. Count s → {c:1, a:1, t:1}. Spend t: a found (0 left), c found (0 left), t found (0 left). Return true. ✓',
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
            { label: 'Brute force', time: 'O(n²)', space: 'O(n)', win: false },
            { label: 'This', time: 'O(n)', space: 'O(n)', win: true },
          ],
          takeaway:
            'Two straight passes, one O(1) lookup each. You traded the search for a running count, and dropped a whole factor of n. That trade — remember what you have counted so you never search twice — is the Hash Map pattern, and you will reach for it again and again.',
        },
      ],
    },
  ]
}
