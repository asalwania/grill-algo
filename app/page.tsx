import type { Metadata } from "next";
import Link from "next/link";

import { SiteFooter, SiteHeader, SkipLink } from "@/components/chrome";
import { ScrollScrubbedTrace } from "@/components/home";
import { TwoSumFlatView } from "@/content/problems/two-sum/FlatView";
import sampleOptimized from "@/content/problems/two-sum/frames.sample.optimized.json";
import { CATALOG } from "@/content/catalog";
import type { TwoSumFrame } from "@/lib/types";

// Title deliberately omitted: the root layout's `default` already IS this
// page's title, and setting it here would run it through the `%s` template and
// say "Execution Visualizer" twice.
export const metadata: Metadata = {
  description:
    "Step through real algorithm execution, one frame at a time — no guessing, no hand-waving. The NeetCode 150, one built properly so far.",
};

/**
 * The frame the hero renders as a still. Mid-run on purpose: four entries on
 * the wall and a lit tile read as "something is happening", where frame 0 is an
 * empty map and frame 24 gives away the ending of the scroll demo two beats
 * before you reach it.
 */
const HERO_FRAME = 15;

/**
 * The homepage. Five beats: hero, premise, the scroll-scrubbed demonstration,
 * pillars, close.
 *
 * The demonstration is the only animated thing on the page, on purpose. Text
 * that fades in on scroll would cost SSR'd content (a landing page's first
 * render is its job) to buy an effect nobody came for; the algorithm stepping
 * as you scroll is the effect they came for.
 *
 * Every beat is numbered in its eyebrow and every one of them ends above the
 * fold of the next, which is the whole answer to "am I supposed to scroll?" —
 * the page never presents a screen that looks finished.
 *
 * Imports ONE frame file directly rather than going through getProblem(), which
 * would load all four cases, both approaches, four languages of solutions and
 * the mdx — 25 frames is all this page shows. The hero still costs nothing
 * extra: it renders one frame out of that same array through the same flat
 * renderer the scroll demo already pulls into the bundle.
 */
export default function Home() {
  const frames = sampleOptimized as unknown as TwoSumFrame[];

  return (
    <>
      <SkipLink />

      {/* Decorative only, and the reason the page stops reading as a flat black
          rectangle: a spotlight behind the hero plus a grid that fades out
          before it can compete with anything. `fixed` so it costs one paint and
          never scrolls; `pointer-events-none` so it cannot eat a click. */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_55%_at_50%_-8%,var(--color-surface-spotlight),transparent_72%)]" />
        <div className="absolute inset-0 opacity-60 [background-image:linear-gradient(var(--color-border-hairline-subtle)_1px,transparent_1px),linear-gradient(90deg,var(--color-border-hairline-subtle)_1px,transparent_1px)] [background-size:72px_72px] [mask-image:radial-gradient(ellipse_75%_45%_at_50%_0%,#000,transparent)]" />
      </div>

      {/* The decor layer is `fixed` (and so painted above static content), so
          the document has to be lifted over it explicitly. This wrapper is also
          what finally makes SiteFooter's `mt-auto` mean anything. */}
      <div className="relative flex min-h-dvh flex-col">
        <SiteHeader />
        <main
          id="main"
          className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col px-24 lg:px-72"
        >
          {/* ================= 01 — hero ================================== */}
          <section className="flex min-h-[calc(100dvh-160px)] flex-col justify-between gap-48 pt-48 pb-24">
            <div className="grid flex-1 items-center gap-48 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)] lg:gap-72">
              <div className="flex flex-col gap-24">
                <Eyebrow>NeetCode {CATALOG.length} · execution traces</Eyebrow>

                <h1 className="max-w-[900px] font-display text-display-32 tracking-display lg:text-display-48">
                  Watch algorithms think.
                </h1>

                <p className="max-w-[560px] text-body-16 text-text-muted">
                  Step through real execution, one frame at a time — no guessing,
                  no hand-waving. Every frame you see was produced by a function
                  that actually computes the answer.
                </p>

                <div className="flex flex-wrap items-center gap-16">
                  {/* The halo is a sibling, not a box-shadow: a shadow on the
                      pill would animate the pill's own compositing layer, and
                      this way `motion-reduce` just stops one decorative div. */}
                  <span className="relative inline-flex">
                    <span
                      aria-hidden="true"
                      className="absolute -inset-8 rounded-pill bg-signal-cyan-fill-weak blur-panel animate-halo motion-reduce:animate-none"
                    />
                    <Link
                      href="/problems/two-sum"
                      className="relative rounded-pill border border-signal-cyan-border-mid bg-signal-cyan-fill px-24 py-12 font-mono text-mono-13 tracking-label-wide text-signal-cyan shadow-card-glow transition-colors hover:border-signal-cyan-border-strong"
                    >
                      RUN TWO SUM
                    </Link>
                  </span>
                  <Link
                    href="/problems"
                    className="rounded-pill border border-border-hairline px-24 py-12 font-mono text-mono-13 tracking-label-wide text-text-muted transition-colors hover:border-border-idle hover:text-text-primary"
                  >
                    ALL {CATALOG.length} PROBLEMS
                  </Link>
                </div>

                <dl className="flex flex-wrap items-center gap-x-24 gap-y-12 border-t border-border-hairline pt-24 font-mono text-mono-13">
                  {FACTS.map((fact) => (
                    <div key={fact.label} className="flex items-baseline gap-8">
                      <dt className="sr-only">{fact.label}</dt>
                      <dd className="text-text-primary">{fact.value}</dd>
                      <span className="tracking-label text-text-muted-dim uppercase">
                        {fact.label}
                      </span>
                    </div>
                  ))}
                </dl>
              </div>

              {/* Not a screenshot and not a mock — the shipped renderer, handed
                  one real frame. */}
              <figure className="flex flex-col gap-12">
                <div className="overflow-hidden rounded-card border border-border-hairline bg-surface-glass shadow-card-glow backdrop-blur-panel">
                  <TwoSumFlatView
                    frame={frames[HERO_FRAME]}
                    floatingControls={false}
                  />
                </div>
                <figcaption className="flex items-center justify-between gap-12 font-mono text-mono-13 tracking-label text-text-muted-dim">
                  <span>FRAME {HERO_FRAME + 1} / {frames.length}</span>
                  <span>NOT A MOCK — THE REAL TRACE</span>
                </figcaption>
              </figure>
            </div>

            <ScrollCue />
          </section>

          {/* ============ 01 — premise, and the demonstration it sets up === */}
          <section className="flex flex-col gap-16 border-t border-border-hairline pt-48 pb-24 lg:pt-72">
            <Eyebrow>01 — the premise</Eyebrow>
            <p className="max-w-[760px] font-display text-display-24 lg:text-display-32">
              Most people memorise the solution. Almost nobody{" "}
              <span className="text-signal-cyan">sees it run.</span>
            </p>
            <p className="max-w-[640px] text-body-16 text-text-muted">
              Below is the real optimized trace for Two Sum — the same frames the
              player uses, generated by a function that actually computes the
              answer. Scroll, and it executes.
            </p>
          </section>

          {/* Deliberately NOT its own numbered beat — it is beat 01's payoff,
              and it carries its own header ("TWO SUM — OPTIMIZED / STEP nn"),
              which would read as two competing labels stacked on each other. */}
          <ScrollScrubbedTrace frames={frames} />

          {/* ================= 02 — what you get ========================== */}
          <section className="flex flex-col gap-32 border-t border-border-hairline py-48 lg:py-72">
            <Eyebrow>02 — what the player gives you</Eyebrow>
            <ul className="grid list-none gap-16 sm:grid-cols-2 lg:grid-cols-4">
              {PILLARS.map((pillar, index) => (
                <li
                  key={pillar.label}
                  className="group flex flex-col gap-12 rounded-card border border-border-hairline bg-surface-glass p-24 transition-colors hover:border-signal-cyan-border"
                >
                  <span className="font-mono text-mono-13 tracking-label text-text-muted-dim">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="font-mono text-mono-13 tracking-label-widest text-signal-cyan uppercase">
                    {pillar.label}
                  </span>
                  <p className="text-body-16 text-text-muted">{pillar.body}</p>
                </li>
              ))}
            </ul>
          </section>

          {/* ================= 03 — close ================================= */}
          <section className="flex flex-col items-start gap-24 border-t border-border-hairline py-48 lg:py-72">
            <Eyebrow>03 — the rest of the list</Eyebrow>
            <p className="max-w-[760px] font-display text-display-24 lg:text-display-32">
              {CATALOG.length} problems on the list. One built properly so far.
            </p>
            <p className="max-w-[640px] text-body-16 text-text-muted">
              The rest are the NeetCode 150, in NeetCode&rsquo;s order, linking
              straight to LeetCode until they get the same treatment.
            </p>
            <div className="flex flex-wrap items-center gap-16">
              <Link
                href="/problems"
                className="rounded-pill border border-signal-cyan-border-mid bg-signal-cyan-fill px-24 py-12 font-mono text-mono-13 tracking-label-wide text-signal-cyan transition-colors hover:border-signal-cyan-border-strong"
              >
                BROWSE THE CATALOG
              </Link>
              <Link
                href="/problems/two-sum"
                className="rounded-pill border border-border-hairline px-24 py-12 font-mono text-mono-13 tracking-label-wide text-text-muted transition-colors hover:border-border-idle hover:text-text-primary"
              >
                RUN TWO SUM
              </Link>
            </div>
          </section>
        </main>
        <SiteFooter />
      </div>
    </>
  );
}

/** Numbered section marker. The numbering is the wayfinding — it tells you
 *  there is more page below without a word of instruction. */
function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-12">
      <span className="font-mono text-mono-13 tracking-label-widest text-text-muted-dim uppercase">
        {children}
      </span>
      <span aria-hidden="true" className="h-px flex-1 bg-border-hairline" />
    </div>
  );
}

/**
 * The literal answer to "am I supposed to scroll?". Pure CSS — a client
 * component for a decorative dot would be an absurd trade. `animate-none` under
 * `motion-reduce` leaves the label, which still says what to do.
 */
function ScrollCue() {
  return (
    <div className="flex items-center gap-12 font-mono text-mono-13 tracking-label-wide text-text-muted-dim">
      <span
        aria-hidden="true"
        className="flex h-24 w-14 justify-center rounded-pill border border-border-idle pt-4"
      >
        <span className="h-4 w-px animate-scroll-hint bg-signal-cyan motion-reduce:animate-none" />
      </span>
      SCROLL — THE ALGORITHM STEPS WITH YOU
    </div>
  );
}

const FACTS = [
  { value: "25", label: "frames" },
  { value: "4", label: "languages" },
  { value: "2", label: "approaches" },
  { value: "0", label: "guesswork" },
];

const PILLARS = [
  {
    label: "3D execution",
    body: "The array is a floor of tiles, the hash map a wall of slots. Shape and motion carry the structure; every value stays readable text.",
  },
  {
    label: "Four languages",
    body: "JavaScript, Python, Java and Go. The highlighted line follows the trace into whichever listing you are reading.",
  },
  {
    label: "Brute vs. optimized",
    body: "Toggle between them mid-run. The wall rises, the beams collapse, and the complexity readout changes with it.",
  },
  {
    label: "Scrub and reverse",
    body: "Every frame is a full snapshot, so stepping backwards is exactly as cheap as stepping forwards.",
  },
];
