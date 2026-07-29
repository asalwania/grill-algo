/**
 * Encode and Decode Strings — build-time trace generators.
 *
 * Nothing here runs in the browser: scripts/build-traces.ts executes these
 * generators at build time, once per entry in TEST_CASES, and writes one
 * frames.<case>.<approach>.json per combination next to this file.
 *
 * ## Fitting a round trip onto the shared scene
 *
 * The shared scene (lib/types.ts's ArrayMemoryScene) is ONE array of numbers
 * whose LENGTH is fixed for a whole trace — and, because ScenePanel only
 * remounts on a case change and not on an approach change, fixed across the
 * approaches of one case too. That single constraint decides the whole mapping:
 *
 *   - **The tile row is the PAYLOAD** — every character of every input string,
 *     concatenated, one tile per character. `labels[i]` carries the character
 *     itself; `nums[i]` is its char code, the same packing Valid Anagram uses.
 *     The payload is what both approaches have to carry through intact, and it
 *     is identical for both — the two ENCODED strings are not (one is
 *     `4#neet…`, the other `4,4,…#neet…`), so the encoded string could never
 *     have been the row.
 *   - **The memory wall is the ENCODING**: one slot per input string, in
 *     writing order. `slot.keyLabel` is the piece the encoder actually wrote
 *     (`4#neet` for the optimized scheme, `4,` for the size header), and
 *     `slot.value` is the length it records.
 *   - **`slot.key` is the piece's OFFSET in the encoded string** — which is
 *     literally the decoder's `i`. That makes it collision-free (two pieces
 *     cannot start at the same index, even when both strings are empty) and
 *     makes `scene.probe` mean something real: the pill reads `i = 6`, the
 *     position the decoder is reading from.
 *   - **`target` is the number of strings**, the problem's only scalar besides
 *     the list itself. The flat view's caption row renders it as `strings = 4`.
 *
 * ## The trace is the ROUND TRIP, not one function
 *
 * The problem is two methods that only mean anything together, so every trace
 * encodes and then decodes, and the listings hold both. The tiles light as
 * characters are consumed into the output, go dark when decoding starts, and
 * come back green as the decoder hands them out again. `result` is the span of
 * payload recovered — all of it, for every valid input, which is the point.
 *
 * ## Two approaches, and why the slower one is not slower
 *
 * `optimized` writes `length#string` per string, so a length and the data it
 * describes travel together. `brute` is the first thing most people write: a
 * header of every size, comma-separated, then a `#`, then all the strings run
 * together. Both are O(m + n) — the difference is not complexity, it is that
 * the header version needs two passes to encode, two loops to decode, and
 * keeps a `sizes` list alive across the gap between them. The frame counts say
 * it plainly: `brute` is the longer trace on every case.
 *
 * There is no `sorted` tab. Decoding has to return the strings in their
 * original order, so reordering the list destroys the answer — the same reason
 * Two Sum ships no `sorted`.
 */

import { createEmitter } from '../../../lib/frames.ts'
import type {
  ArrayMemoryFrame,
  ArrayMemoryScene,
  ProblemTraces,
  SlotState,
  TestCase,
  TileState,
} from '../../../lib/types.ts'

/** The input the shipped frames are generated from. */
export const EXAMPLE_STRS = ['neet', 'code', 'love', 'you']

// ---------------------------------------------------------------------------
// Packing a list of strings into the numeric case shape
// ---------------------------------------------------------------------------

/**
 * `["neet","code"]` -> `4#neet4#code`, then char codes.
 *
 * `TestCase.nums` is `number[]`, so a list of strings has to survive a trip
 * through numbers, and this problem supplies its own answer to that: the
 * length-prefixed encoding is lossless for ANY list, including one holding
 * `#`, digits, empty strings, or nothing at all. Using it as the case packing
 * is not a cute trick — it is the proof the encoding works, applied to the
 * only place in the codebase that needed it.
 */
export function packStrings(strs: string[]): string {
  return strs.map((s) => `${s.length}#${s}`).join('')
}

/** The exact inverse of `packStrings`, and the algorithm this problem asks
 *  for. Duplicated in five lines by `chrome.ts` and `paper.ts`, the precedent
 *  Group Anagrams' `decodeWord` set — importing this module into a client
 *  bundle would drag two generators and two listings along with it. */
export function unpackStrings(encoded: string): string[] {
  const out: string[] = []
  let i = 0
  while (i < encoded.length) {
    let j = i
    while (encoded[j] !== '#') j++
    const length = Number(encoded.slice(i, j))
    i = j + 1
    out.push(encoded.slice(i, i + length))
    i += length
  }
  return out
}

function makeCase(id: string, label: string, strs: string[], note: string): TestCase {
  return {
    id,
    label,
    nums: [...packStrings(strs)].map((ch) => ch.charCodeAt(0)),
    note,
  }
}

/** The inverse of `makeCase`, used by every generator here and mirrored by
 *  `chrome.ts`'s `formatCaseInput`. There is no `target` to consult — the list
 *  is the whole input, and the scene's own `target` is derived from it. */
export function stringsOf(input: TestCase): string[] {
  return unpackStrings(input.nums.map((code) => String.fromCharCode(code)).join(''))
}

// ---------------------------------------------------------------------------
// Playable inputs
// ---------------------------------------------------------------------------

/**
 * Four inputs, each reaching something the others don't:
 *   - `sample` is NeetCode's own example: four ordinary words, so the wall
 *     fills four times and both encoders have real work to do.
 *   - `hash-inside` puts the delimiter and a digit INSIDE the data. This is the
 *     case the whole problem exists for: any scheme that searches for a
 *     separator gets it wrong, and length prefixing does not even notice.
 *   - `long-string` has a thirteen-character string, so one length prefix is
 *     TWO digits — the decoder has to read digits until the marker rather than
 *     assume one.
 *   - `empty-string` holds a string of length zero between two real ones,
 *     which is the branch where a piece consumes no characters at all.
 *
 * Every case's payload is non-empty, which is not incidental: a list whose
 * characters add up to nothing has no tiles to light, so those inputs live on
 * the paper sheet instead (`paper.ts`), which is exactly the asymmetry the
 * paper feature exists for.
 */
export const TEST_CASES: TestCase[] = [
  makeCase(
    'sample',
    'The walkthrough',
    EXAMPLE_STRS,
    'Four ordinary words — fifteen characters that have to come back out in the same four pieces.',
  ),
  makeCase(
    'hash-inside',
    'The delimiter is in the data',
    ['we', 'said', '#5', 'yes#'],
    'Two strings contain the # itself. Lengths do not care what the characters are.',
  ),
  makeCase(
    'long-string',
    'A two-digit length',
    ['hi', 'abcdefghijklm', 'x'],
    'Thirteen characters means the prefix is 13, not 1 then 3 — read digits until the marker.',
  ),
  makeCase(
    'empty-string',
    'An empty string in the middle',
    ['a', '', 'bc'],
    'A piece that records length 0 and consumes no characters at all still has to survive the round trip.',
  ),
]

// ---------------------------------------------------------------------------
// Canonical listings
// ---------------------------------------------------------------------------

/**
 * Every optimized frame's `line` is a 1-based index into this listing, and
 * nothing else. Per-language listings map onto it via Solution.lineMap.
 *
 * Both methods are here because the trace runs both: an encoder nobody decodes
 * proves nothing, and the `#` is only safe BECAUSE the decoder never searches
 * for it in the data.
 */
export const OPTIMIZED_LISTING = [
  'class Solution {', //                                    1
  '  encode(strs) {', //                                    2
  '    const res = []', //                                  3
  '    for (const s of strs) {', //                         4
  "      res.push(String(s.length), '#', s)", //            5
  '    }', //                                               6
  "    return res.join('')", //                             7
  '  }', //                                                 8
  '', //                                                    9
  '  decode(str) {', //                                    10
  '    const res = []', //                                 11
  '    let i = 0', //                                      12
  '    while (i < str.length) {', //                       13
  '      let j = i', //                                    14
  "      while (str[j] !== '#') {", //                     15
  '        j++', //                                        16
  '      }', //                                            17
  '      const length = parseInt(str.substring(i, j))', // 18
  '      i = j + 1', //                                    19
  '      j = i + length', //                               20
  '      res.push(str.substring(i, j))', //                21
  '      i = j', //                                        22
  '    }', //                                              23
  '    return res', //                                     24
  '  }', //                                                25
  '}', //                                                  26
].join('\n')

export const BRUTE_LISTING = [
  'class Solution {', //                                          1
  '  encode(strs) {', //                                          2
  "    if (strs.length === 0) return ''", //                      3
  '    const sizes = []', //                                      4
  '    for (const s of strs) {', //                               5
  '      sizes.push(s.length)', //                                6
  '    }', //                                                     7
  '    const parts = []', //                                      8
  '    for (const sz of sizes) {', //                             9
  "      parts.push(String(sz), ',')", //                        10
  '    }', //                                                    11
  "    parts.push('#', ...strs)", //                             12
  "    return parts.join('')", //                                13
  '  }', //                                                      14
  '', //                                                         15
  '  decode(str) {', //                                          16
  '    if (str.length === 0) return []', //                      17
  '    const sizes = []', //                                     18
  '    const res = []', //                                       19
  '    let i = 0', //                                            20
  "    while (str[i] !== '#') {", //                             21
  '      let j = i', //                                          22
  "      while (str[j] !== ',') {", //                           23
  '        j++', //                                              24
  '      }', //                                                  25
  '      sizes.push(parseInt(str.substring(i, j), 10))', //      26
  '      i = j + 1', //                                          27
  '    }', //                                                    28
  '    i++', //                                                  29
  '    for (const sz of sizes) {', //                            30
  '      res.push(str.substr(i, sz))', //                        31
  '      i += sz', //                                            32
  '    }', //                                                    33
  '    return res', //                                           34
  '  }', //                                                      35
  '}', //                                                        36
].join('\n')

/**
 * `seek` is the inner scan for the marker (line 15), not the `while` that
 * drives the outer loop — finding where the digits stop is the step that frame
 * is about, and it is the one a hand-run gets wrong by assuming a single digit.
 */
const OPTIMIZED_LINE = {
  initEncode: 3,
  take: 4,
  write: 5,
  encoded: 7,
  initDecode: 12,
  seek: 15,
  length: 18,
  extract: 21,
  done: 24,
} as const

/** Lines 3 and 17 — the two empty-input guards — are deliberately never active:
 *  every shipped case has characters in it, and the inputs that would reach
 *  those guards are the ones the canvas cannot render at all (see TEST_CASES).
 *  They are on the paper sheet instead. */
const BRUTE_LINE = {
  initEncode: 4,
  take: 5,
  measure: 6,
  header: 10,
  payload: 12,
  encoded: 13,
  initDecode: 20,
  size: 26,
  past: 29,
  extract: 31,
  advance: 32,
  done: 34,
} as const

// ---------------------------------------------------------------------------
// Shared machinery
// ---------------------------------------------------------------------------

/** One wall row: a piece of the encoding, and the length it records. */
type PieceSlot = { key: number; value: number; state: SlotState; keyLabel: string }

/** The tile row: every character of every string, concatenated. Identical for
 *  both approaches, which is the constraint the whole mapping is built around
 *  (see this file's header). */
function payloadOf(strs: string[]): { nums: number[]; labels: string[] } {
  const chars = [...strs.join('')]
  return { nums: chars.map((ch) => ch.charCodeAt(0)), labels: chars }
}

/** Where each string sits inside the payload row, as `[start, end)`. */
function spansOf(strs: string[]): { start: number; end: number }[] {
  const spans: { start: number; end: number }[] = []
  let at = 0
  for (const s of strs) {
    spans.push({ start: at, end: at + s.length })
    at += s.length
  }
  return spans
}

const quote = (text: string): string => `"${text}"`

/** `["neet", "code"]` — a list of strings as the DOM variables panel shows it. */
const penList = (items: string[]): string =>
  items.length === 0 ? '[]' : `[${items.map(quote).join(', ')}]`

const plural = (n: number, word: string): string => `${n} ${word}${n === 1 ? '' : 's'}`

// ---------------------------------------------------------------------------
// Optimized — every length travels next to the string it measures
// ---------------------------------------------------------------------------

/**
 * Solves Encode and Decode Strings with an inline `length#string` per string,
 * yielding a FULL state snapshot at each meaningful point. This actually runs
 * both halves — the decoded list at the end is produced by the decoder reading
 * back what the encoder wrote, not copied from the input.
 *
 * Encode gets two beats per string (the characters light, then the piece is
 * written to the wall); decode gets three (the read position is announced, the
 * length is parsed, the characters are handed back). A string of length ZERO
 * collapses the beat that would have lit tiles, because it has none — a frame
 * that moves nothing is a wasted step, and the empty string genuinely does
 * take no characters.
 */
export function* encodeDecodeOptimized(
  strs: string[],
): Generator<ArrayMemoryFrame, void, undefined> {
  const { nums, labels } = payloadOf(strs)
  const spans = spansOf(strs)
  const tiles: TileState[] = nums.map(() => 'idle')
  const slots: PieceSlot[] = []
  let cursor: number | null = null
  let probe: number | null = null
  let link: [number, number] | null = null
  let result: [number, number] | null = null
  let encoded = ''
  const decoded: string[] = []

  const emit = createEmitter<ArrayMemoryScene>(() => ({
    nums: [...nums],
    target: strs.length,
    labels: [...labels],
    tiles: [...tiles],
    cursor,
    slots: slots.map((slot) => ({ ...slot })),
    probe,
    link: link === null ? null : [link[0], link[1]],
    result: result === null ? null : [result[0], result[1]],
  }))

  const paint = (state: TileState) => {
    for (let k = 0; k < tiles.length; k++) tiles[k] = state
  }

  const base = () => ({
    n: strs.length,
    chars: nums.length,
    encoded: quote(encoded),
    decoded: penList(decoded),
  })

  yield emit(
    OPTIMIZED_LINE.initEncode,
    'init',
    'One output string, empty. Each input string will be written as its length, a #, then the string itself.',
    'No character can be reserved as a separator, because every character is allowed inside the data. A length can be: it is written OUTSIDE the string it measures, and it says exactly how far to read.',
    base(),
  )

  for (let i = 0; i < strs.length; i++) {
    const s = strs[i]
    const { start, end } = spans[i]

    if (s.length > 0) {
      cursor = start
      link = null
      for (let k = start; k < end; k++) tiles[k] = 'active'
      yield emit(
        OPTIMIZED_LINE.take,
        'compare',
        `Take strs[${i}] = ${quote(s)} — ${plural(s.length, 'character')}.`,
        'The only thing the encoder needs to know about a string is how long it is. It never looks at what the characters are, which is why no character can break it.',
        { ...base(), i, s: quote(s) },
      )
    }

    const piece = `${s.length}#${s}`
    slots.push({ key: encoded.length, value: s.length, state: 'filled', keyLabel: piece })
    encoded += piece
    for (let k = start; k < end; k++) tiles[k] = 'done'
    cursor = s.length > 0 ? start : null
    link = s.length > 0 ? [start, slots.length - 1] : null
    yield emit(
      OPTIMIZED_LINE.write,
      'store',
      s.length > 0
        ? `Write ${quote(piece)} — the length, the marker, then the characters.`
        : `Write ${quote(piece)} — length zero, and no characters follow it.`,
      'The length and the data it describes are written together, so the decoder never has to hold anything between one piece and the next.',
      { ...base(), i, piece: quote(piece) },
    )
  }

  cursor = nums.length > 0 ? 0 : null
  link = null
  paint('active')
  yield emit(
    OPTIMIZED_LINE.encoded,
    'return',
    `Encoded: ${quote(encoded)} — ${plural(encoded.length, 'character')} holding all ${plural(nums.length, 'character')} of the input.`,
    `The overhead is one marker plus the digits of a length, per string — ${encoded.length - nums.length} extra characters for ${plural(strs.length, 'string')}, and it does not depend on what the strings contain.`,
    { ...base(), size: encoded.length },
  )

  cursor = null
  paint('idle')
  yield emit(
    OPTIMIZED_LINE.initDecode,
    'init',
    'Now read it back. Nothing is recovered yet, and i starts at 0.',
    'The decoder gets one string and no other information. Everything it needs to split the string up again is inside the string itself.',
    base(),
  )

  for (let i = 0; i < strs.length; i++) {
    const s = strs[i]
    const { start, end } = spans[i]
    const at = slots[i].key

    cursor = null
    link = null
    probe = at
    slots[i].state = 'probed'
    yield emit(
      OPTIMIZED_LINE.seek,
      'compare',
      `i = ${at}. Run j forward until it lands on the next #.`,
      'The scan looks for the marker in the LENGTH, never in the data — it can only ever run over digits, so a # inside a string is never reached by it.',
      { ...base(), i: at, piece: quote(slots[i].keyLabel) },
    )

    if (s.length > 0) {
      cursor = start
      tiles[start] = 'active'
      yield emit(
        OPTIMIZED_LINE.length,
        'compare',
        `The digits before it read ${s.length}. The next ${plural(s.length, 'character')} ${s.length === 1 ? 'is' : 'are'} one string.`,
        `Every digit before the marker is part of the number — ${s.length} is read as ${s.length}, not as its first digit. That is the whole reason the marker exists.`,
        { ...base(), i: at, length: s.length },
      )
    }

    for (let k = start; k < end; k++) tiles[k] = 'match'
    slots[i].state = 'hit'
    cursor = s.length > 0 ? start : null
    link = s.length > 0 ? [start, i] : null
    decoded.push(s)
    yield emit(
      OPTIMIZED_LINE.extract,
      'match',
      s.length > 0
        ? `Take ${plural(s.length, 'character')}: ${quote(s)}. i moves to ${at + slots[i].keyLabel.length}.`
        : `Take no characters at all: ${quote(s)}. i moves to ${at + slots[i].keyLabel.length}.`,
      'The characters are copied out without being inspected. Whatever they are — a #, a digit, nothing at all — the count already said where they stop.',
      { ...base(), i: at, s: quote(s) },
    )
  }

  cursor = null
  probe = null
  link = null
  result = nums.length > 0 ? [0, nums.length - 1] : null
  yield emit(
    OPTIMIZED_LINE.done,
    'return',
    `Decoded: ${penList(decoded)} — the list we started from.`,
    `One pass to write ${plural(strs.length, 'piece')} and one to read them back, each character touched once in each direction. Nothing was searched for and nothing was escaped.`,
    { ...base(), result: penList(decoded) },
  )
}

// ---------------------------------------------------------------------------
// Brute force — all the sizes first, then all the strings
// ---------------------------------------------------------------------------

/**
 * The first encoding most people write: measure every string, write the sizes
 * out comma-separated, close the header with a `#`, then run all the strings
 * together behind it.
 *
 * It is correct, and it is the same O(m + n) as the optimized tab — the tab
 * exists to show what it costs anyway. Encoding takes two passes instead of
 * one (sizes cannot be written until they are all known, because they share a
 * section). Decoding takes two loops instead of one, and a `sizes` list has to
 * stay alive between them. Every case's brute trace is the longer one, and
 * that gap is not asymptotic — it is bookkeeping.
 */
export function* encodeDecodeBrute(
  strs: string[],
): Generator<ArrayMemoryFrame, void, undefined> {
  const { nums, labels } = payloadOf(strs)
  const spans = spansOf(strs)
  const tiles: TileState[] = nums.map(() => 'idle')
  const slots: PieceSlot[] = []
  let cursor: number | null = null
  let probe: number | null = null
  let link: [number, number] | null = null
  let result: [number, number] | null = null
  let header = ''
  const sizes: number[] = []
  const decoded: string[] = []

  const emit = createEmitter<ArrayMemoryScene>(() => ({
    nums: [...nums],
    target: strs.length,
    labels: [...labels],
    tiles: [...tiles],
    cursor,
    slots: slots.map((slot) => ({ ...slot })),
    probe,
    link: link === null ? null : [link[0], link[1]],
    result: result === null ? null : [result[0], result[1]],
  }))

  const paint = (state: TileState) => {
    for (let k = 0; k < tiles.length; k++) tiles[k] = state
  }

  const base = () => ({
    n: strs.length,
    chars: nums.length,
    sizes: `[${sizes.join(', ')}]`,
    header: quote(header),
    decoded: penList(decoded),
  })

  yield emit(
    BRUTE_LINE.initEncode,
    'init',
    'An empty list of sizes. First pass: measure every string, and write nothing yet.',
    'The sizes have to share one section of the output, so none of them can be written until all of them are known. That is the second pass this approach pays for.',
    base(),
  )

  for (let i = 0; i < strs.length; i++) {
    const s = strs[i]
    const { start, end } = spans[i]

    if (s.length > 0) {
      cursor = start
      link = null
      for (let k = start; k < end; k++) tiles[k] = 'active'
      yield emit(
        BRUTE_LINE.take,
        'compare',
        `Take strs[${i}] = ${quote(s)}.`,
        'Same observation as the optimized tab: only the length matters. What differs is where that length is allowed to go.',
        { ...base(), i, s: quote(s) },
      )
    }

    const entry = `${s.length},`
    slots.push({ key: header.length, value: s.length, state: 'filled', keyLabel: entry })
    header += entry
    sizes.push(s.length)
    for (let k = start; k < end; k++) tiles[k] = 'done'
    cursor = s.length > 0 ? start : null
    link = s.length > 0 ? [start, slots.length - 1] : null
    yield emit(
      BRUTE_LINE.measure,
      'store',
      `Record ${s.length}. sizes = [${sizes.join(', ')}].`,
      'The size is remembered, not written — it belongs in a header that does not exist yet, so it has to be carried until the loop ends.',
      { ...base(), i, size: s.length },
    )
  }

  cursor = null
  link = null
  paint('idle')
  yield emit(
    BRUTE_LINE.header,
    'store',
    `Second pass: the sizes, comma-separated — ${quote(header)}.`,
    'Now a SECOND delimiter is needed, because the sizes have to be told apart from each other. It is only safe because digits are the one thing in the output whose alphabet we control.',
    { ...base() },
  )

  cursor = nums.length > 0 ? 0 : null
  paint('active')
  yield emit(
    BRUTE_LINE.payload,
    'store',
    `Then a # to close the header, and every string appended in order: ${quote(strs.join(''))}.`,
    'The characters go in raw, with no boundaries between them at all. The header is the only thing that knows where one string ends — lose it and the payload is unreadable.',
    { ...base() },
  )

  const encoded = `${header}#${strs.join('')}`
  paint('done')
  cursor = null
  yield emit(
    BRUTE_LINE.encoded,
    'return',
    `Encoded: ${quote(encoded)} — ${plural(encoded.length, 'character')}.`,
    `The same information as the optimized tab, in the same O(m + n), one character longer: this scheme spends a comma per string AND a # once, where the other spends one # per string.`,
    { ...base(), size: encoded.length },
  )

  paint('idle')
  yield emit(
    BRUTE_LINE.initDecode,
    'init',
    'Now read it back. First loop: everything before the # is the size header.',
    'Two loops, and the first has to finish before the second can start — the payload cannot be split until every size is known.',
    base(),
  )

  for (let i = 0; i < strs.length; i++) {
    probe = slots[i].key
    slots[i].state = 'probed'
    cursor = null
    link = null
    yield emit(
      BRUTE_LINE.size,
      'compare',
      `Read to the next comma: ${slots[i].value}. sizes = [${sizes.slice(0, i + 1).join(', ')}].`,
      'Nothing is recovered yet. This whole loop reads bookkeeping, and the strings it describes are still an undifferentiated run of characters.',
      { ...base(), i: slots[i].key, size: slots[i].value },
    )
  }

  probe = null
  yield emit(
    BRUTE_LINE.past,
    'store',
    `The # ends the header. The payload starts at index ${header.length + 1}.`,
    'Second loop. Only now can a single character be attributed to a single string.',
    { ...base(), i: header.length + 1 },
  )

  for (let i = 0; i < strs.length; i++) {
    const s = strs[i]
    const { start, end } = spans[i]

    probe = slots[i].key
    cursor = s.length > 0 ? start : null
    link = null
    for (let k = start; k < end; k++) tiles[k] = 'active'
    yield emit(
      BRUTE_LINE.extract,
      'compare',
      `sizes[${i}] is ${s.length}. Take that many characters from the payload.`,
      'The size and the characters it measures were written at opposite ends of the output, so reading one means having kept the other.',
      { ...base(), i, size: s.length },
    )

    for (let k = start; k < end; k++) tiles[k] = 'match'
    slots[i].state = 'hit'
    link = s.length > 0 ? [start, i] : null
    decoded.push(s)
    yield emit(
      BRUTE_LINE.advance,
      'match',
      `Recovered ${quote(s)}. res = ${penList(decoded)}.`,
      'i steps forward by exactly the recorded size — the characters themselves are never inspected, which is what makes a # or a digit inside the data harmless here too.',
      { ...base(), i, s: quote(s) },
    )
  }

  cursor = null
  probe = null
  link = null
  result = nums.length > 0 ? [0, nums.length - 1] : null
  yield emit(
    BRUTE_LINE.done,
    'return',
    `Decoded: ${penList(decoded)} — the list we started from.`,
    `The same answer, reached with two passes to encode and two loops to decode instead of one each. Complexity is identical; the cost is everything you have to keep in your head between the halves.`,
    { ...base(), result: penList(decoded) },
  )
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export const traceOptimized = (strs: string[]): ArrayMemoryFrame[] => [
  ...encodeDecodeOptimized(strs),
]

export const traceBrute = (strs: string[]): ArrayMemoryFrame[] => [
  ...encodeDecodeBrute(strs),
]

/** Tab order, left to right — best first, and the first entry is the default
 *  selection. No `sorted`: decode has to hand the strings back in their
 *  original order, so reordering the list destroys the answer. */
const ENCODE_DECODE_APPROACHES = ['optimized', 'brute'] as const

export const traces: ProblemTraces<
  ArrayMemoryScene,
  (typeof ENCODE_DECODE_APPROACHES)[number]
> = {
  example: `strs = ${penList(EXAMPLE_STRS)}`,
  approaches: ENCODE_DECODE_APPROACHES,
  listings: {
    optimized: OPTIMIZED_LISTING,
    brute: BRUTE_LISTING,
  },
  cases: TEST_CASES,
  build: {
    optimized: (input) => traceOptimized(stringsOf(input)),
    brute: (input) => traceBrute(stringsOf(input)),
  },
}
