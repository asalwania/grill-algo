/**
 * Valid Palindrome — the approach, the way you would reason it out at a
 * whiteboard.
 *
 * Sibling of `paper.ts`, and a cousin of `trace.ts`. Where the trace shows
 * the finished algorithm running and the paper sheet dry-runs it over
 * cases, this shows the DERIVATION: restate it, try the dumb thing, notice
 * the waste, and let that push you to the two-pointer insight.
 *
 * `EXAMPLE.result` and every `CHECKS[].result` are authored — the author's
 * reading of the QUESTION, not the output of any code. `approach.test.ts`
 * runs the real walk (`./paper`'s `resultOf`) over each raw input and
 * refuses to let the two disagree.
 */

import type {
  ApproachBlock,
  ApproachCheck,
  ApproachMove,
} from '../../../lib/types.ts'

/* -------------------------------------------------------------------------- */
/* worked cases — raw sources, authored, pinned by the test                   */
/* -------------------------------------------------------------------------- */

/** A worked case before it is rendered: raw input, an authored argument and
 *  an authored answer. `toCheck` turns it into the display-ready
 *  `ApproachCheck`. */
type CheckSource = { s: string; why: string; result: string }

function penString(s: string): string {
  return `"${s}"`
}

function toCheck({ s, why, result }: CheckSource): ApproachCheck {
  return { input: penString(s), why, result, nums: [...s].map((ch) => ch.charCodeAt(0)) }
}

/**
 * Stage 1's concrete example — the smallest input that is still the real
 * problem. Deliberately the SAME string as the animated trace's
 * `fails-fast` case, so the derivation and the animation start from one
 * shared picture.
 */
export const EXAMPLE: CheckSource = {
  s: 'abc',
  why: "'a' and 'c' don't match, and that settles it — the middle letter never even needs checking",
  result: 'false',
}

/**
 * Stage 7's pokes — the three cases `paper.ts` singles out as the ones the
 * 3D scene structurally cannot show: a scene needs alphanumeric tiles to
 * compare, and a string with none at all has nothing to light up, a single
 * character has no partner, and a digit-vs-letter mismatch renders no
 * differently from any other mismatching pair. On paper — and here, before
 * the plan is even code — they cost nothing to check.
 */
export const CHECKS: CheckSource[] = [
  {
    s: '.,!?',
    why: 'every character gets skipped, so the two pointers meet with nothing ever compared — vacuously true',
    result: 'true',
  },
  {
    s: 'a',
    why: 'one letter has nobody to disagree with — the main loop never even starts',
    result: 'true',
  },
  {
    s: '0P',
    why: "both characters count as alphanumeric, but '0' and lowercase 'p' are still not the same character",
    result: 'false',
  },
]

/* -------------------------------------------------------------------------- */
/* the pseudocode shown in the reader                                         */
/* -------------------------------------------------------------------------- */

const BRUTE_FORCE = [
  'cleaned = []',
  'for ch in s:',
  '    if ch is a letter or digit:',
  '        cleaned.append(lowercase(ch))',
  'return cleaned == reverse(cleaned)',
].join('\n')

const THE_PLAN = [
  'left, right = 0, len(s) - 1',
  'while left < right:',
  '    while left < right and not alnum(s[left]): left += 1',
  '    while left < right and not alnum(s[right]): right -= 1',
  '    if lower(s[left]) != lower(s[right]):',
  '        return False',
  '    left += 1',
  '    right -= 1',
  'return True',
].join('\n')

/* -------------------------------------------------------------------------- */
/* the walkthrough                                                            */
/* -------------------------------------------------------------------------- */

/**
 * The nine moves, in order, each earning the next.
 *
 * The sequence is the lesson: you cannot appreciate the insight (stage 5)
 * until you have felt the waste (stage 3), and you cannot trust the plan
 * (stage 6) until you have poked it (stage 7). Reorder these and it becomes
 * a solution with headings — which is the trace pane, one tab over.
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
            { label: 'Given', text: 'a string, with letters, digits, and possibly spaces or punctuation mixed in.' },
            { label: 'True', text: 'ignoring everything but letters and digits, and ignoring case, it reads the same forward and backward.' },
            { label: 'Return', text: 'just yes or no. Not where it breaks, not a cleaned-up copy.' },
          ],
        },
        {
          kind: 'aside',
          tone: 'caution',
          label: 'watch it',
          text: "\"Alphanumeric\" is doing real work in this problem statement. Spaces and punctuation aren't lowercased away — they're removed from consideration entirely, as if they were never in the string.",
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
          text: "Don't be clever yet. What's the most obvious thing that is definitely right? Build a clean copy — letters and digits only, all lowercase — and check it against its own reverse.",
        },
        { kind: 'code', caption: 'brute force', code: BRUTE_FORCE },
        {
          kind: 'aside',
          tone: 'note',
          label: 'why keep it',
          text: 'It is easy to trust: "reads the same backward" IS "equals its own reverse", almost word for word. Now you have something that works, and something to improve.',
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
          text: "Read the brute force again. It builds an entire second array before checking anything — every character gets copied, whether or not it turns out to matter — and then it walks the FULL cleaned array rather than stopping at the midpoint, so most pairs get compared twice.",
        },
        {
          kind: 'aside',
          tone: 'note',
          label: 'the smell',
          text: '"Build a whole copy just to compare it to itself" is a flashing sign. The comparison never needs the copy to exist all at once — it only ever needs two characters at a time.',
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
          text: 'What if I never built the cleaned copy at all — what if I compared the two ends of the ORIGINAL string directly, skipping over the junk as I go?',
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
            'Walk in from both ends at once. Skip anything that is not a letter or digit, compare what is left, and stop the instant two characters disagree.',
          detail:
            "One pointer starts at the front, one at the back. Each step, both pointers first slide past anything that isn't alphanumeric, then the two letters that are left get compared (case-folded). Agree, and both pointers step inward for another round. Disagree, and the answer is already false — no cleaned copy, no reverse, nothing kept in memory beyond the two indices themselves.",
        },
        {
          kind: 'aside',
          tone: 'caution',
          label: 'the real trap',
          text: "Skip PUNCTUATION — don't just fold case. It's tempting to only lowercase and compare, but a space or a comma sitting where a letter should be will never equal anything. The two skip loops aren't optional cleanup; they're the entire trick that makes comparing in place work at all.",
        },
      ],
    },
    {
      id: 'plan',
      label: 'The plan',
      title: 'Write it down as a plan you can read back.',
      blocks: [
        // Lines 3-4 are the two skip loops — the load-bearing step that lets
        // the comparison below ever be correct.
        { kind: 'code', caption: 'the plan', code: THE_PLAN, mark: [3, 4] },
        {
          kind: 'aside',
          tone: 'note',
          label: 'read it back',
          text: "Against the example: left='a', right='c' — both already alphanumeric, no skipping needed — lower('a') != lower('c') → return False. ✓",
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
            { label: 'Cleaned copy (brute)', time: 'O(n)', space: 'O(n)', win: false },
            { label: 'Two pointers (this)', time: 'O(n)', space: 'O(1)', win: true },
          ],
          takeaway:
            'Same linear time either way — every character gets looked at once. The win here is memory: comparing the original string in place, from both ends, means never paying for a second copy of it.',
        },
      ],
    },
  ]
}
