import { describe, expect, it } from 'vitest'

import { traceTwoSum, TRACE_LISTING } from './trace'

const NUMS = [2, 7, 11, 15, 3, 6]
const TARGET = 9

describe('twoSumTrace', () => {
  it('ends on a correct result', () => {
    const frames = traceTwoSum(NUMS, TARGET)
    const last = frames[frames.length - 1]

    expect(last.scene.result).toEqual([0, 1])

    const [i, j] = last.scene.result!
    expect(i).toBeLessThan(j)
    expect(NUMS[i] + NUMS[j]).toBe(TARGET)
  })

  it('carries one state per value in every frame', () => {
    for (const frame of traceTwoSum(NUMS, TARGET)) {
      expect(frame.scene.array.states).toHaveLength(frame.scene.array.values.length)
    }
  })

  it('reports no result when no pair sums to the target', () => {
    const frames = traceTwoSum([2, 7, 11], 100)
    expect(frames[frames.length - 1].scene.result).toBeUndefined()
  })

  it('points every frame at a real line of the canonical listing', () => {
    const lineCount = TRACE_LISTING.split('\n').length
    for (const frame of traceTwoSum(NUMS, TARGET)) {
      expect(frame.line).toBeGreaterThanOrEqual(1)
      expect(frame.line).toBeLessThanOrEqual(lineCount)
    }
  })
})
