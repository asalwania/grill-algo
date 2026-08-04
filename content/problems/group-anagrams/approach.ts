/**
 * Group Anagrams — the approach, the way you would reason it out at a
 * whiteboard.
 *
 * Sibling of `paper.ts`, and a cousin of `trace.ts`. Where the trace shows the
 * finished algorithm running and the paper sheet dry-runs it over cases, this
 * shows the DERIVATION: restate it, try the dumb thing, notice the waste, and
 * let that push you to the count-key insight.
 *
 * This file is the problem's approach identity, the way `chrome.ts` is its
 * screen identity and `paper.ts` its paper identity. Per-problem here is
 * everything: the prose, the pseudocode, the worked example and the pokes.
 * Shared is the reader — `components/approach/` knows how to draw a block and
 * nothing about words or letter counts.
 *
 * ## Packing words the way `paper.ts` does
 *
 * `ApproachCheck.nums` holds each word packed base-27 (a=1 … z=26, 0 unused so
 * no word collides with a shorter one) — the same packing `trace.ts` and
 * `paper.ts` use. `encodeWord`/`decodeWord` are duplicated here in five lines
 * rather than imported, the same trade `chrome.ts` and `paper.ts` make: it
 * beats pulling three generators and three code listings into this module.
 * There is no `target` — the word list is the whole input.
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

/** 26 letters plus a zero that no letter uses, so 'a' and 'aa' pack apart. */
const BASE = 27

/** 'eat' -> 5*27² + 1*27 + 20. See the file header for why this is duplicated
 *  rather than imported from `trace.ts`. */
function encodeWord(word: string): number {
  return [...word].reduce((code, ch) => code * BASE + (ch.charCodeAt(0) - 96), 0)
}

/** A worked case before it is rendered: raw words, an authored argument and an
 *  authored answer. `toCheck` turns it into the display-ready `ApproachCheck`. */
type CheckSource = { words: string[]; why: string; result: string }

/** `["eat", "tea"]`, and `[]` for the empty list so it still reads as a drawn
 *  box. */
function penWords(words: string[]): string {
  return words.length === 0 ? '[]' : `[${words.map((w) => `"${w}"`).join(', ')}]`
}

function toCheck({ words, why, result }: CheckSource): ApproachCheck {
  return { input: penWords(words), why, result, nums: words.map(encodeWord) }
}

/**
 * Stage 1's concrete example — the smallest input that is still the real
 * problem. Deliberately the SAME words as the animated trace's `first-pair`
 * case, so the derivation and the animation start from one shared picture.
 */
export const EXAMPLE: CheckSource = {
  words: ['eat', 'ate', 'bat', 'cab'],
  why: 'eat and ate share a letter count and join up; bat and cab never find a partner',
  result: '[["eat", "ate"], ["bat"], ["cab"]]',
}

/**
 * Stage 7's pokes — the three cases `paper.ts` singles out as the ones the 3D
 * scene structurally cannot show: there is nothing to light up for an empty
 * list, and one tile carries no useful picture for a word with no letters.
 * All three are one line on paper and exactly what an interviewer probes for.
 */
export const CHECKS: CheckSource[] = [
  {
    words: [],
    why: 'no words to key at all, so the map stays empty and the partition is the empty list',
    result: '[]',
  },
  {
    words: [''],
    why: 'the empty string tallies to nothing, but "nothing" is still a key of its own — one word, one group',
    result: '[[""]]',
  },
  {
    words: ['a', 'a'],
    why: 'identical words tally identically — a word is an anagram of itself, and the second joins the first',
    result: '[["a", "a"]]',
  },
]

/* -------------------------------------------------------------------------- */
/* the pseudocode shown in the reader                                         */
/* -------------------------------------------------------------------------- */

const BRUTE_FORCE = [
  'groups = []                       # each one: { key_word, words }',
  'for word in strs:',
  '    placed = false',
  '    for group in groups:',
  '        if is_anagram(word, group.key_word):',
  '            group.words.append(word)',
  '            placed = true',
  '            break',
  '    if not placed:',
  '        groups.append({ key_word: word, words: [word] })',
  'return [g.words for g in groups]',
].join('\n')

const THE_PLAN = [
  'groups = {}                       # key (letter counts) → list of words',
  'for word in strs:',
  '    key = tally(word)             # 26 counts, not just which letters appear',
  '    if key not in groups:',
  '        groups[key] = []',
  '    groups[key].append(word)',
  'return list(groups.values())',
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
            { label: 'Given', text: 'a list of words.' },
            {
              label: 'True',
              text: 'some of them are anagrams of each other — same letters, the same number of times each.',
            },
            {
              label: 'Return',
              text: 'every word, partitioned into groups. A word with no match is still a group of one.',
            },
          ],
        },
        {
          kind: 'aside',
          tone: 'caution',
          label: 'watch it',
          text: 'Sharing a letter SET is not the same as being an anagram — "aab" and "ab" share the letters a and b, but not the same count of each. The rule is counts, not presence.',
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
          text: "Don't be clever yet. What's the most obvious thing that is definitely right? For every word, check it against every group already made, and join the first one that matches.",
        },
        { kind: 'code', caption: 'brute force', code: BRUTE_FORCE },
        {
          kind: 'aside',
          tone: 'note',
          label: 'why keep it',
          text: 'It is O(n²·k) for n words of length k, and that is fine — a correct slow answer beats a clever wrong one. Now you have something that works, and something to improve.',
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
          text: 'Read the brute force again. Every new word gets compared against every group formed so far, from scratch — re-deriving "are these two the same shape" again and again, even for groups it has nothing in common with.',
        },
        {
          kind: 'aside',
          tone: 'note',
          label: 'the smell',
          text: '"Searching a list, from the start, repeatedly" is a flashing sign. The fix is almost always: give the thing you are looking for a NAME, so two matching things carry the same name automatically.',
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
          text: 'What if every word had a name built only from what makes it an anagram — so two words are anagrams exactly when their names are identical? Then there is nothing left to compare.',
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
            'Give every word a name built from its letter counts. Same name, same group — no comparison required.',
          detail:
            'Tally each word into 26 letter counts and use that tally as a key. Two words are anagrams exactly when their keys match. Walk the list once: compute a key, file the word under it in a map. The map IS the partition — read its values back out at the end.',
        },
        {
          kind: 'aside',
          tone: 'caution',
          label: 'watch it',
          text: 'Do not special-case equal words out. Two identical words tally identically, so they key the same and land in the same group — that is not a bug, it is the definition: a word is an anagram of itself.',
        },
      ],
    },
    {
      id: 'plan',
      label: 'The plan',
      title: 'Write it down as a plan you can read back.',
      blocks: [
        // Line 3 is the tally itself — the counts-not-presence rule the first
        // caution turns on.
        { kind: 'code', caption: 'the plan', code: THE_PLAN, mark: [3] },
        {
          kind: 'aside',
          tone: 'note',
          label: 'read it back',
          text: 'Against your example: eat → key "a1e1t1", new group. ate → same key, joins eat. bat → key "a1b1t1", new group. cab → key "a1b1c1", new group. Return [[eat, ate], [bat], [cab]]. ✓',
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
            { label: 'Brute force', time: 'O(n²·k)', space: 'O(n·k)', win: false },
            { label: 'This', time: 'O(n·k)', space: 'O(n·k)', win: true },
          ],
          takeaway:
            'One O(k) tally per word, ever — instead of an O(k) comparison against every group already made. You traded repeated comparison for a single lookup, and dropped a whole factor of n.',
        },
      ],
    },
  ]
}
