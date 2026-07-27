/**
 * SP3 runner. Executes the generator for real and writes the frame array to
 * disk, then prints frames 0, 5 and the final frame for eyeballing.
 *
 *   node --experimental-strip-types "app/(SP3)/two-sum-frames/build-frames.mts"
 *
 * (On Node >= 22.18 / 23.6 the flag is unnecessary.)
 */

import { writeFile } from 'node:fs/promises'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

import { traceTwoSum, type Frame } from './trace.ts'

const NUMS = [2, 7, 11, 15, 3, 6]
const TARGET = 9

const here = dirname(fileURLToPath(import.meta.url))
const outFile = join(here, 'frames.json')

const frames = traceTwoSum(NUMS, TARGET)
await writeFile(outFile, `${JSON.stringify(frames, null, 2)}\n`, 'utf8')

const rel = relative(process.cwd(), outFile).replaceAll('\\', '/')
console.log(`nums=[${NUMS}] target=${TARGET}`)
console.log(`${frames.length} frames -> ${rel}\n`)

console.log('── the whole trace ──────────────────────────────────────────────')
for (const frame of frames) {
  const step = String(frame.step).padStart(2)
  const line = `L${frame.line}`.padStart(3)
  console.log(`${step} ${line}  ${frame.narration}`)
}

const show = (label: string, frame: Frame) => {
  console.log(`\n── ${label} ${'─'.repeat(Math.max(0, 62 - label.length))}`)
  console.log(JSON.stringify(frame, null, 2))
}

show('frame 0', frames[0])
if (frames[5]) show('frame 5', frames[5])
show(`final frame (${frames.length - 1})`, frames[frames.length - 1])
