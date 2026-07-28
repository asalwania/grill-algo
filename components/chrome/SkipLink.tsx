/**
 * Visible only on keyboard focus. Sits before the header so it is the first
 * tab stop on the page.
 *
 * F18 still owns the full keyboard pass and the rest of the SEO/a11y work;
 * this is here because a skip link is part of the chrome it skips, and adding
 * a nav without one just makes the tab order worse.
 */
export function SkipLink({ href = "#main" }: { href?: string }) {
  return (
    <a
      href={href}
      className="sr-only focus:not-sr-only focus:absolute focus:top-12 focus:left-12 focus:z-50 focus:rounded-chip focus:border focus:border-signal-cyan-border-mid focus:bg-surface-raised focus:px-16 focus:py-8 focus:font-mono focus:text-mono-13 focus:text-signal-cyan"
    >
      Skip to content
    </a>
  );
}
