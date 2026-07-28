"use client";

import { useEffect, useRef, useState } from "react";

export type RailItem = {
  id: string;
  label: string;
  count: number;
};

/**
 * Section navigation for /problems. 150 cards down 18 sections is a very long
 * page; this is what makes it skimmable without flattening NeetCode's ordering
 * into a filter (settled — the order is the curriculum).
 *
 * Desktop: a sticky column beside the sections. Mobile: a sticky horizontal
 * scroller under the hero.
 *
 * Scroll-spy is IntersectionObserver, not a scroll handler — the browser does
 * the work off the main thread and there is no continuous value to throttle.
 * Only the discrete active id becomes state, which is the same rule AGENTS.md
 * imposes on the player.
 *
 * `scrollRootId` names the element the sections scroll INSIDE, when they scroll
 * inside one at all. /problems freezes its chrome at lg and scrolls only the
 * card column, so above that breakpoint the viewport is the wrong root — every
 * section would read as visible at once and the rail would stick on the first.
 */
export function CategoryRail({
  items,
  scrollRootId,
}: {
  items: RailItem[];
  scrollRootId?: string;
}) {
  const [activeId, setActiveId] = useState(items[0]?.id ?? "");
  const activeChip = useRef<HTMLAnchorElement | null>(null);

  useEffect(() => {
    const sections = items
      .map((item) => document.getElementById(item.id))
      .filter((element): element is HTMLElement => element !== null);

    if (sections.length === 0) return;

    // Visibility alone is ambiguous while several sections straddle the
    // viewport, so track the full set and pick the topmost visible one.
    const visible = new Set<string>();

    // Which element actually scrolls is a CSS decision made at a breakpoint, so
    // ask the CSS rather than re-declaring the breakpoint in JS: the container
    // is only a root once it is a scroller.
    const resolveRoot = () => {
      const element = scrollRootId
        ? document.getElementById(scrollRootId)
        : null;
      if (!element) return null;
      return getComputedStyle(element).overflowY === "visible" ? null : element;
    };

    let observer: IntersectionObserver | null = null;
    let root: HTMLElement | null | undefined;

    const observe = () => {
      const next = resolveRoot();
      if (observer && next === root) return;
      root = next;
      observer?.disconnect();
      visible.clear();

      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) visible.add(entry.target.id);
            else visible.delete(entry.target.id);
          }
          const topmost = items.find((item) => visible.has(item.id));
          if (topmost) setActiveId(topmost.id);
        },
        // Bias the band toward the top of the scrollport: a section counts as
        // "current" once its heading is near the top, not when its last card
        // finally scrolls away.
        { root, rootMargin: "-10% 0px -70% 0px", threshold: 0 },
      );

      for (const section of sections) observer.observe(section);
    };

    observe();
    // Crossing the breakpoint swaps the scroller in or out from under us.
    window.addEventListener("resize", observe);
    return () => {
      window.removeEventListener("resize", observe);
      observer?.disconnect();
    };
  }, [items, scrollRootId]);

  // Keep the active chip in view on mobile, where the rail scrolls sideways.
  // `nearest` on both axes so this never scrolls the PAGE, only the strip.
  useEffect(() => {
    activeChip.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "nearest",
    });
  }, [activeId]);

  return (
    // The mobile chrome (full-bleed bar, blur, hairline) is expressed with
    // max-lg: rather than undone at lg:. `--blur-*: initial` in globals.css
    // deletes Tailwind's blur scale, so there is no `backdrop-blur-none` to
    // undo it with.
    <nav
      aria-label="Problem categories"
      // At lg nothing around it scrolls, so `sticky` is inert there and the
      // rail instead has to fit — and scroll on its own — inside a grid area of
      // fixed height. 18 categories overflow a short viewport.
      className="sticky top-0 z-20 max-lg:-mx-24 max-lg:border-b max-lg:border-border-hairline max-lg:bg-surface-glass max-lg:px-24 max-lg:py-12 max-lg:backdrop-blur-panel lg:max-h-full lg:self-start lg:overflow-y-auto"
    >
      <ul className="flex gap-8 overflow-x-auto lg:flex-col lg:gap-4 lg:overflow-visible">
        {items.map((item) => {
          const active = item.id === activeId;
          return (
            <li key={item.id} className="shrink-0 lg:shrink">
              <a
                ref={active ? activeChip : null}
                href={`#${item.id}`}
                aria-current={active ? "true" : undefined}
                className={`flex items-center gap-8 whitespace-nowrap rounded-chip px-12 py-8 text-narration-sm transition-colors lg:whitespace-normal ${
                  active
                    ? "bg-signal-cyan-fill-weak text-text-primary"
                    : "text-text-muted hover:text-text-primary"
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`hidden h-16 w-0 border-l-2 transition-colors lg:block ${
                    active ? "border-signal-cyan" : "border-transparent"
                  }`}
                />
                {item.label}
                <span className="font-mono text-mono-13 text-text-muted-dim">
                  {item.count}
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
