import 'server-only'

import { createHighlighter, type Highlighter, type ShikiTransformer } from 'shiki'

import type { Language } from './types'

/**
 * Build-time syntax highlighting.
 *
 * This module is `server-only` on purpose: Shiki (grammars + theme JSON + the
 * Oniguruma engine) must never enter a client bundle. Callers are server
 * components, so the output is a plain HTML string baked into the prerendered
 * payload — zero highlighting JS ships to the browser.
 */

const THEME = 'github-dark-default'

/** Every language the content model can declare on a `Solution` (`lib/types.ts`).
 *  Shiki's bundled grammar ids match these values exactly. */
const LANGS: Language[] = ['javascript', 'python', 'java', 'go']

/** Blank lines collapse to zero height as block boxes; this props them open. */
const ZERO_WIDTH_SPACE = '​'

/**
 * One highlighter for the whole build. `createHighlighter` loads grammars and
 * the regex engine, which is the expensive part; without this every page would
 * pay for it again.
 */
let highlighterPromise: Promise<Highlighter> | null = null

function getHighlighter(): Promise<Highlighter> {
  highlighterPromise ??= createHighlighter({
    themes: [THEME],
    langs: LANGS,
  })
  return highlighterPromise
}

/**
 * Makes every rendered line individually measurable by the client.
 *
 * Three things have to be true for the DOM highlight to line up:
 *   1. each line carries its 1-based number as `data-line`
 *   2. each line is a block box, so its rect is one full line box
 *   3. lines are *adjacent* block boxes with nothing between them
 *
 * (3) is why the `\n` text nodes get dropped. Shiki interleaves a literal
 * newline between line elements; under `white-space: pre` those newlines still
 * render, so with block lines you would get double spacing and every measured
 * offset would be wrong. The line elements themselves now provide the breaks.
 */
const lineAnchors: ShikiTransformer = {
  name: 'grill-algo:line-anchors',

  line(node, line) {
    node.properties['data-line'] = String(line)
    this.addClassToHast(node, 'block')

    // An empty line is an empty block box — zero height, which would collapse
    // the row and shift every line below it out of alignment.
    if (node.children.length === 0) {
      node.children.push({ type: 'text', value: ZERO_WIDTH_SPACE })
    }
  },

  code(node) {
    node.children = node.children.filter((child) => child.type === 'element')
    this.addClassToHast(node, 'block')
  },

  pre(node) {
    // Drop the theme's background so the surrounding panel's surface token
    // shows through; the theme still owns every foreground colour.
    const style = node.properties.style
    if (typeof style === 'string') {
      node.properties.style = style
        .split(';')
        .filter((decl) => decl.trim() !== '' && !decl.includes('background-color'))
        .join(';')
    }
    this.addClassToHast(node, 'font-mono text-code-14')
  },
}

export type HighlightedCode = {
  /** Static HTML. Safe to pass to a client component as a plain string prop. */
  html: string
  /** Line count, so the client never has to parse the HTML to know its bounds. */
  lineCount: number
}

export async function highlightCode(
  code: string,
  language: Language,
): Promise<HighlightedCode> {
  const source = code.replace(/\n+$/, '')
  const highlighter = await getHighlighter()

  return {
    html: highlighter.codeToHtml(source, {
      lang: language,
      theme: THEME,
      transformers: [lineAnchors],
    }),
    lineCount: source.split('\n').length,
  }
}
