import { describe, expect, it } from 'vitest'

import { CATALOG } from '../content/catalog'
import { meta as twoSumMeta } from '../content/problems/two-sum/meta'
import {
  categoryId,
  groupByCategory,
  leetcodeUrl,
  readyProblems,
  resolveCatalog,
} from './catalog'
import { CATEGORIES } from './types'

/**
 * These guard the failure mode that review can't see: a card that renders
 * perfectly and links to a 404. They catch structural errors — duplicates,
 * typos, bad slugs, a row filed under the wrong heading.
 *
 * What they deliberately CANNOT catch is a plausible-but-wrong number/title
 * pairing (e.g. #56 labelled "Insert Interval"). Nothing offline can. That is
 * what `pnpm verify:catalog` is for, and ultimately a human reading the file.
 */
describe('CATALOG', () => {
  it('has exactly 150 entries', () => {
    expect(CATALOG).toHaveLength(150)
  })

  it('has no duplicate slugs', () => {
    const seen = new Map<string, number>()
    for (const entry of CATALOG) {
      seen.set(entry.slug, (seen.get(entry.slug) ?? 0) + 1)
    }
    expect([...seen].filter(([, count]) => count > 1)).toEqual([])
  })

  it('has no duplicate LeetCode numbers', () => {
    const seen = new Map<number, string[]>()
    for (const entry of CATALOG) {
      seen.set(entry.number, [...(seen.get(entry.number) ?? []), entry.title])
    }
    expect([...seen].filter(([, titles]) => titles.length > 1)).toEqual([])
  })

  it('uses only kebab-case slugs', () => {
    const bad = CATALOG.filter(
      (entry) => !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(entry.slug),
    )
    expect(bad.map((entry) => entry.slug)).toEqual([])
  })

  it('has a positive integer number and a non-empty title on every entry', () => {
    const bad = CATALOG.filter(
      (entry) =>
        !Number.isInteger(entry.number) ||
        entry.number < 1 ||
        entry.title.trim() === '',
    )
    expect(bad.map((entry) => entry.slug)).toEqual([])
  })

  it('uses only known difficulties', () => {
    const bad = CATALOG.filter(
      (entry) => !['Easy', 'Medium', 'Hard'].includes(entry.difficulty),
    )
    expect(bad.map((entry) => entry.slug)).toEqual([])
  })

  it('fills every one of the 18 categories', () => {
    const used = new Set(CATALOG.map((entry) => entry.category))
    expect([...CATEGORIES].filter((category) => !used.has(category))).toEqual([])
  })

  // A row filed under the wrong heading shows up here and nowhere else: it
  // would re-open a category that already ended.
  it('keeps each category as one contiguous run', () => {
    const runs: string[] = []
    for (const entry of CATALOG) {
      if (runs.at(-1) !== entry.category) runs.push(entry.category)
    }
    expect(runs).toEqual([...new Set(runs)])
  })

  it('lists categories in CATEGORIES order', () => {
    const runs: string[] = []
    for (const entry of CATALOG) {
      if (runs.at(-1) !== entry.category) runs.push(entry.category)
    }
    expect(runs).toEqual([...CATEGORIES])
  })

  it('agrees with two-sum/meta.ts on the facts they both carry', () => {
    const entry = CATALOG.find((row) => row.slug === twoSumMeta.slug)
    expect(entry).toBeDefined()
    expect(entry?.number).toBe(twoSumMeta.number)
    expect(entry?.title).toBe(twoSumMeta.title)
    expect(entry?.difficulty).toBe(twoSumMeta.difficulty)
  })
})

describe('leetcodeUrl', () => {
  it('derives the URL from the slug', () => {
    expect(leetcodeUrl({ ...CATALOG[0], slug: 'two-sum' })).toBe(
      'https://leetcode.com/problems/two-sum/',
    )
  })

  it('prefers an explicit leetcodeSlug override', () => {
    expect(
      leetcodeUrl({ ...CATALOG[0], slug: 'pow-x-n', leetcodeSlug: 'powx-n' }),
    ).toBe('https://leetcode.com/problems/powx-n/')
  })
})

describe('resolveCatalog', () => {
  it('marks a row ready only when its content directory exists', () => {
    const resolved = resolveCatalog(['two-sum'])
    const twoSum = resolved.find((row) => row.slug === 'two-sum')
    const other = resolved.find((row) => row.slug === 'valid-anagram')

    expect(twoSum?.status).toBe('ready')
    expect(other?.status).toBe('soon')
    expect(readyProblems(resolved).map((row) => row.slug)).toEqual(['two-sum'])
  })

  it('marks everything soon when nothing is built', () => {
    const resolved = resolveCatalog([])
    expect(readyProblems(resolved)).toEqual([])
    expect(resolved).toHaveLength(150)
  })

  it('ignores built directories that are not in the catalog', () => {
    const resolved = resolveCatalog(['two-sum', 'not-a-neetcode-problem'])
    expect(resolved).toHaveLength(150)
    expect(readyProblems(resolved).map((row) => row.slug)).toEqual(['two-sum'])
  })

  it('leaves meta null — getCatalog fills it in', () => {
    expect(resolveCatalog(['two-sum']).every((row) => row.meta === null)).toBe(
      true,
    )
  })
})

describe('categoryId', () => {
  it('produces a valid, collision-free id for every category', () => {
    const ids = CATEGORIES.map(categoryId)
    expect(new Set(ids).size).toBe(CATEGORIES.length)
    expect(ids.filter((id) => !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(id))).toEqual([])
  })

  it('flattens punctuation the way the rail anchors expect', () => {
    expect(categoryId('Heap / Priority Queue')).toBe('heap-priority-queue')
    expect(categoryId('Arrays & Hashing')).toBe('arrays-hashing')
    expect(categoryId('1-D Dynamic Programming')).toBe('1-d-dynamic-programming')
  })
})

describe('groupByCategory', () => {
  it('returns the 18 sections in CATEGORIES order', () => {
    const sections = groupByCategory(resolveCatalog([]))
    expect(sections.map((section) => section.category)).toEqual([...CATEGORIES])
  })

  it('loses no problems and duplicates none', () => {
    const sections = groupByCategory(resolveCatalog([]))
    const regrouped = sections.flatMap((section) => section.problems)
    expect(regrouped).toHaveLength(150)
    expect(regrouped.map((row) => row.slug)).toEqual(
      CATALOG.map((row) => row.slug),
    )
  })

  it('leaves no section empty', () => {
    const empty = groupByCategory(resolveCatalog([])).filter(
      (section) => section.problems.length === 0,
    )
    expect(empty.map((section) => section.category)).toEqual([])
  })
})
