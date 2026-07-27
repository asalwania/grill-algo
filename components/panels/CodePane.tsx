import type { Language } from "@/lib/types";
import { highlightCode } from "@/lib/highlight";

type CodePaneProps = {
  /** Fixed, read-only source. Highlighted here, at build time. */
  code: string;
  language: Language;
};

/**
 * Server component: Shiki runs at build time and the highlighted markup is
 * baked into the prerendered payload. No client JS, no highlighter shipped.
 */
export async function CodePane({ code, language }: CodePaneProps) {
  const { html, lineCount } = await highlightCode(code, language);
  const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1);

  return (
    <div className="overflow-hidden rounded-card border border-border-hairline bg-surface-raised">
      <div className="flex">
        {/* Decorative: position already carried by each code line's own
            data-line, so a screen reader gains nothing from these digits. */}
        <div
          aria-hidden
          className="flex-none select-none border-r border-border-hairline-subtle py-20 pl-16 pr-12 text-right font-mono text-code-14 tabular-nums text-text-muted-dim"
        >
          {lineNumbers.map((n) => (
            <div key={n}>{n}</div>
          ))}
        </div>

        {/* min-w-0 lets this flex child shrink below the <pre>'s intrinsic
            width so overflow-x-auto actually scopes the scroll here, not to
            the page. */}
        <div className="min-w-0 flex-1 overflow-x-auto py-20 pl-16 pr-20">
          <div dangerouslySetInnerHTML={{ __html: html }} />
        </div>
      </div>
    </div>
  );
}
