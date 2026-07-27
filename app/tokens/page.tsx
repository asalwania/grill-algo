import type { ReactNode } from "react";

/* Token reference sheet. Every value on this page comes from a token in
   app/globals.css — there are no arbitrary values and no default Tailwind
   classes anywhere below. If something renders wrong, the token is wrong. */

export const metadata = { title: "Tokens — Execution Visualizer" };

function Section({
  n,
  title,
  note,
  children,
}: {
  n: string;
  title: string;
  note?: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-24">
      <div className="flex flex-col gap-8">
        <div className="flex items-baseline gap-14">
          <span className="font-mono text-mono-13 text-text-muted-dim">{n}</span>
          <h2 className="font-display text-display-32 text-text-primary">
            {title}
          </h2>
        </div>
        {note ? (
          <p className="max-w-2xl font-sans text-body-16 text-text-muted">
            {note}
          </p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function Grid({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-16 sm:grid-cols-2 lg:grid-cols-3">
      {children}
    </div>
  );
}

function Swatch({
  chip,
  name,
  value,
  note,
}: {
  chip: ReactNode;
  name: string;
  value: string;
  note?: string;
}) {
  return (
    <div className="flex flex-col gap-12 rounded-card border border-border-hairline bg-surface-raised p-16">
      {chip}
      <div className="flex flex-col gap-4">
        <span className="font-mono text-mono-13 text-text-primary">{name}</span>
        <span className="font-mono text-mono-13 text-text-muted-dim">
          {value}
        </span>
        {note ? (
          <span className="font-sans text-narration-sm text-text-muted">
            {note}
          </span>
        ) : null}
      </div>
    </div>
  );
}

function Flag({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-chip border border-signal-amber-border bg-signal-amber-fill px-14 py-12 font-sans text-narration-sm text-signal-amber">
      {children}
    </p>
  );
}

/* Stage backdrop, so translucent surfaces and glows are judged against the
   same gradient they sit on in the real learning view. */
function Stage({ children }: { children: ReactNode }) {
  return (
    <div
      className="flex flex-wrap items-center gap-32 rounded-card border border-border-hairline p-32"
      style={{
        background:
          "radial-gradient(ellipse at 50% 40%, var(--color-surface-spotlight), var(--color-surface-canvas) 70%)",
      }}
    >
      {children}
    </div>
  );
}

function Label({ children }: { children: ReactNode }) {
  return (
    <span className="font-mono text-mono-13 text-text-muted-dim">
      {children}
    </span>
  );
}

export default function TokensPage() {
  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-72 px-20 py-72 lg:px-72">
      <header className="flex flex-col gap-16">
        <span className="font-mono text-mono-13 text-signal-cyan">
          DESIGN TOKENS
        </span>
        <h1 className="font-display text-display-48 text-text-primary">
          Execution Visualizer
        </h1>
        <p className="max-w-2xl font-sans text-body-16 text-text-muted">
          Every token available to the app, rendered at real size. Tailwind&rsquo;s
          default palette, type scale, radii, shadows and spacing ladder have
          been deleted — nothing outside this page compiles.
        </p>
      </header>

      {/* ================================================================== */}
      <Section
        n="01"
        title="Surfaces"
        note="surface-glass carries backdrop-blur-panel; surface-glass-dim does not."
      >
        <Grid>
          <Swatch
            chip={
              <div className="h-64 rounded-chip border border-border-hairline bg-surface-canvas" />
            }
            name="surface-canvas"
            value="#0A0B0F"
            note="Base app background."
          />
          <Swatch
            chip={
              <div className="h-64 rounded-chip border border-border-hairline bg-surface-raised" />
            }
            name="surface-raised"
            value="#14161D"
            note="Bottom sheets, transport bar, step chip."
          />
          <Swatch
            chip={
              <div className="h-64 rounded-chip border border-border-hairline bg-surface-spotlight" />
            }
            name="surface-spotlight"
            value="#12141C"
            note="Radial-gradient centre behind the stage."
          />
          <Swatch
            chip={
              <div className="h-64 rounded-chip border border-border-hairline bg-surface-floor" />
            }
            name="surface-floor"
            value="rgba(255,255,255,0.028)"
            note="LVD 3D floor plane."
          />
          <Swatch
            chip={
              <div className="h-64 rounded-chip border border-border-hairline bg-surface-skeleton" />
            }
            name="surface-skeleton"
            value="rgba(255,255,255,0.035)"
            note="PI skeleton bar fill."
          />
        </Grid>

        <Stage>
          <div className="flex flex-col gap-12">
            <div className="h-64 w-56 rounded-card border border-border-hairline bg-surface-glass backdrop-blur-panel" />
            <Label>surface-glass + blur-panel</Label>
          </div>
          <div className="flex flex-col gap-12">
            <div className="h-64 w-56 rounded-card border border-border-hairline bg-surface-glass-dim" />
            <Label>surface-glass-dim / no blur</Label>
          </div>
        </Stage>

        <Flag>
          UNRESOLVED — surface-glass-dim (0.5, no blur) appears exactly once, on
          PI&rsquo;s skeleton cards. Intentional &ldquo;unloaded&rdquo; treatment,
          or an unfinished card? If the former it stays; if the latter, delete
          the token and use surface-glass.
        </Flag>
      </Section>

      {/* ================================================================== */}
      <Section n="02" title="Text">
        <Grid>
          <Swatch
            chip={
              <p className="font-sans text-body-16 text-text-primary">
                The quick brown fox
              </p>
            }
            name="text-primary"
            value="#E8EAF0"
          />
          <Swatch
            chip={
              <p className="font-sans text-body-16 text-text-muted">
                The quick brown fox
              </p>
            }
            name="text-muted"
            value="#8B93A7"
          />
          <Swatch
            chip={
              <p className="font-sans text-body-16 text-text-muted-dim">
                The quick brown fox
              </p>
            }
            name="text-muted-dim"
            value="rgba(139,147,167,0.6)"
            note="Inactive line numbers, idle index labels."
          />
        </Grid>
        <Flag>
          MS&rsquo;s one-off greys at 0.5 / 0.55 / 0.7 / 0.85 are not exposed.
          They must collapse onto text-muted or text-muted-dim.
        </Flag>
      </Section>

      {/* ================================================================== */}
      <Section n="03" title="Borders">
        <Grid>
          <Swatch
            chip={
              <div className="h-64 rounded-chip border border-border-hairline bg-surface-canvas" />
            }
            name="border-hairline"
            value="rgba(255,255,255,0.08)"
            note="Default — outer card edges."
          />
          <Swatch
            chip={
              <div className="h-64 rounded-chip border border-border-hairline-subtle bg-surface-canvas" />
            }
            name="border-hairline-subtle"
            value="rgba(255,255,255,0.06)"
            note="Internal dividers, 3D grid lines."
          />
          <Swatch
            chip={
              <div className="h-64 rounded-chip border border-border-idle bg-surface-canvas" />
            }
            name="border-idle"
            value="rgba(255,255,255,0.10)"
            note="Untouched array tiles."
          />
          <Swatch
            chip={
              <div className="h-64 rounded-control border border-border-idle-slot bg-surface-canvas" />
            }
            name="border-idle-slot"
            value="rgba(255,255,255,0.08)"
            note="RESOLVED — LVD's 0.09 dropped in favour of LVM/MS."
          />
        </Grid>
      </Section>

      {/* ================================================================== */}
      <Section
        n="04"
        title="Signals"
        note="Four hues, one RGB each. The alpha ramp is role-based: fill-weak, fill, fill-strong, border, border-mid, border-strong."
      >
        <Stage>
          <div className="flex flex-col gap-14">
            <Label>signal-cyan &mdash; executing</Label>
            <div className="flex flex-wrap gap-10">
              <span className="rounded-pill border border-signal-cyan-border bg-signal-cyan-fill-weak px-14 py-8 font-mono text-mono-13 text-signal-cyan-on">
                fill-weak .07
              </span>
              <span className="rounded-pill border border-signal-cyan-border bg-signal-cyan-fill px-14 py-8 font-mono text-mono-13 text-signal-cyan-on">
                fill .14
              </span>
              <span className="rounded-pill border border-signal-cyan-border-mid bg-signal-cyan-fill-strong px-14 py-8 font-mono text-mono-13 text-signal-cyan-on">
                fill-strong .20
              </span>
              <span className="rounded-pill border border-signal-cyan-border-strong bg-signal-cyan-fill-strong px-14 py-8 font-mono text-mono-13 text-signal-cyan-on">
                border-strong .70
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-14">
            <Label>signal-amber &mdash; comparing</Label>
            <div className="flex flex-wrap gap-10">
              <span className="rounded-pill border border-signal-amber-border bg-signal-amber-fill px-14 py-8 font-mono text-mono-13 text-signal-amber-on">
                fill .10
              </span>
              <span className="rounded-pill border border-signal-amber-border-mid bg-signal-amber-fill px-14 py-8 font-mono text-mono-13 text-signal-amber-on">
                border-mid .45
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-14">
            <Label>signal-violet &mdash; stored</Label>
            <div className="flex flex-wrap gap-10">
              <span className="rounded-pill border border-signal-violet-border bg-signal-violet-fill px-14 py-8 font-mono text-mono-13 text-signal-violet-on">
                fill .12
              </span>
              <span className="rounded-pill border border-signal-violet-border-mid bg-signal-violet-fill-strong px-14 py-8 font-mono text-mono-13 text-signal-violet-on">
                fill-strong .16
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-14">
            <Label>signal-green &mdash; match / return</Label>
            <div className="flex flex-wrap gap-10">
              <span className="rounded-pill border border-signal-green-border bg-signal-green-fill px-14 py-8 font-mono text-mono-13 text-signal-green-on">
                fill .10
              </span>
              <span className="rounded-pill border border-signal-green-border bg-signal-green-fill-strong px-14 py-8 font-mono text-mono-13 text-signal-green-on">
                fill-strong .12
              </span>
            </div>
          </div>
        </Stage>

        <Grid>
          <Swatch
            chip={<div className="h-64 rounded-chip bg-signal-cyan" />}
            name="signal-cyan / -on"
            value="#3DDCFF / #3DDCFF"
          />
          <Swatch
            chip={<div className="h-64 rounded-chip bg-signal-amber" />}
            name="signal-amber / -on"
            value="#FFB454 / #FFB454"
          />
          <Swatch
            chip={
              <div className="flex h-64 gap-4">
                <div className="flex-1 rounded-chip bg-signal-violet" />
                <div className="flex-1 rounded-chip bg-signal-violet-on" />
              </div>
            }
            name="signal-violet / -on"
            value="#A78BFA / #C4B2FD"
          />
          <Swatch
            chip={
              <div className="flex h-64 gap-4">
                <div className="flex-1 rounded-chip bg-signal-green" />
                <div className="flex-1 rounded-chip bg-signal-green-on" />
              </div>
            }
            name="signal-green / -on"
            value="#4ADE80 / #86EFAC"
          />
          <Swatch
            chip={<div className="h-64 rounded-chip bg-link-cyan-hover" />}
            name="link-cyan-hover"
            value="#8FEAFF"
            note="Declared in all 5 files, renders nowhere."
          />
        </Grid>

        <Flag>
          Cyan and amber have no lighter text-on-chip pairing, so -on aliases
          the base hue. Violet and green do. Decide whether cyan/amber need real
          pairings before a tinted chip with a light label is designed.
        </Flag>
      </Section>

      {/* ================================================================== */}
      <Section n="05" title="Typography">
        <div className="flex flex-col gap-24 rounded-card border border-border-hairline bg-surface-raised p-32">
          <div className="flex flex-col gap-8">
            <Label>display-48 &middot; Instrument Serif 400 &middot; 48/1.1</Label>
            <p className="font-display text-display-48 text-text-primary">
              Two Sum
            </p>
          </div>
          <div className="flex flex-col gap-8">
            <Label>display-32 &middot; Instrument Serif 400 &middot; 32/1.2</Label>
            <p className="font-display text-display-32 text-text-primary">
              Hash Map Lookup
            </p>
          </div>
          <div className="flex flex-col gap-8">
            <Label>
              display-24 &middot; Instrument Serif 400 &middot; 24/1.2 (RESOLVED)
            </Label>
            <p className="font-display text-display-24 text-text-primary">
              Looking for the complement of the current value
            </p>
          </div>
          <div className="flex flex-col gap-8">
            <Label>body-16 &middot; Inter 400 &middot; 16/1.55</Label>
            <p className="max-w-2xl font-sans text-body-16 text-text-muted">
              Given an array of integers and a target, return the indices of the
              two numbers such that they add up to the target.
            </p>
          </div>
          <div className="flex flex-col gap-8">
            <Label>narration &middot; Inter 500 &middot; 16/1.5 &middot; desktop</Label>
            <p className="font-sans text-narration font-medium text-text-primary">
              Looking for complement 7 &mdash; not in memory yet.
            </p>
          </div>
          <div className="flex flex-col gap-8">
            <Label>narration-sm &middot; Inter 500 &middot; 14/1.5 &middot; mobile</Label>
            <p className="font-sans text-narration-sm font-medium text-text-primary">
              Looking for complement 7 &mdash; not in memory yet.
            </p>
          </div>
          <div className="flex flex-col gap-8">
            <Label>mono-13 &middot; JetBrains Mono &middot; 13px</Label>
            <p className="font-mono text-mono-13 text-text-primary">
              O(n) TIME &middot; O(n) SPACE &middot; STEP 04 / 11
            </p>
          </div>
          <div className="flex flex-col gap-8">
            <Label>tracking &middot; not covered by the audit</Label>
            <p className="font-display text-display-24 tracking-display text-text-primary">
              tracking-display &middot; -0.01em
            </p>
            <p className="font-mono text-mono-13 tracking-label text-text-muted">
              TRACKING-LABEL 0.08EM
            </p>
            <p className="font-mono text-mono-13 tracking-label-wide text-text-muted">
              TRACKING-LABEL-WIDE 0.1EM
            </p>
            <p className="font-mono text-mono-13 tracking-label-wider text-text-muted">
              TRACKING-LABEL-WIDER 0.12EM
            </p>
            <p className="font-mono text-mono-13 tracking-label-widest text-text-muted">
              TRACKING-LABEL-WIDEST 0.14EM
            </p>
          </div>
          <div className="flex flex-col gap-8">
            <Label>code-14 &middot; JetBrains Mono &middot; 14/1.65 &middot; desktop</Label>
            <pre className="font-mono text-code-14 text-text-primary">{`for i, n in enumerate(nums):
    if target - n in seen:
        return [seen[target - n], i]`}</pre>
          </div>
          <div className="flex flex-col gap-8">
            <Label>code-13 &middot; JetBrains Mono &middot; 13/1.6 &middot; mobile</Label>
            <pre className="font-mono text-code-13 text-text-primary">{`for i, n in enumerate(nums):
    if target - n in seen:
        return [seen[target - n], i]`}</pre>
          </div>
        </div>

        <Flag>
          Desktop narration is 16px, not 14 &mdash; possibly a copy-paste of
          body-16. Confirm before the compare bar is built. Weight 600 is not
          exposed; drop it from the font import if nothing needs it.
        </Flag>
      </Section>

      {/* ================================================================== */}
      <Section
        n="06"
        title="Spacing"
        note="Named in pixels — p-20 is 20px, not 5rem. DSR's ladder plus the five undocumented values the product actually uses (10, 14, 20, 22, 72)."
      >
        <div className="flex flex-col gap-8 rounded-card border border-border-hairline bg-surface-raised p-24">
          {[4, 8, 10, 12, 14, 16, 20, 22, 24, 32, 48, 56, 64, 72].map((px) => (
            <div key={px} className="flex items-center gap-16">
              <span className="w-48 shrink-0 text-right font-mono text-mono-13 text-text-muted-dim">
                {px}px
              </span>
              <span
                className="h-8 rounded-tag-sm bg-signal-cyan-fill-strong"
                style={{ width: `${px}px` }}
              />
            </div>
          ))}
        </div>
        <div className="flex flex-wrap items-end gap-24 rounded-card border border-border-hairline bg-surface-raised p-24">
          <div className="flex flex-col gap-12">
            <Label>size-96 &middot; desktop array tile</Label>
            <div className="size-96 rounded-control border border-border-idle" />
          </div>
          <div className="flex flex-col gap-12">
            <Label>size-50 &middot; mobile array tile</Label>
            <div className="size-50 rounded-control border border-border-idle" />
          </div>
        </div>

        <Flag>
          UNRESOLVED &mdash; the mobile transport sheet uses 16/20/34 padding in
          LVM but 16/20/20 in MS. 34px is the iPhone home-indicator inset, so
          this is probably pb-20 plus env(safe-area-inset-bottom) rather than a
          token. Confirm, then pick one.
        </Flag>
      </Section>

      {/* ================================================================== */}
      <Section n="07" title="Radius">
        <Grid>
          <Swatch
            chip={
              <div className="h-64 rounded-pill border border-border-idle bg-surface-canvas" />
            }
            name="rounded-pill"
            value="999px"
          />
          <Swatch
            chip={
              <div className="h-64 rounded-card border border-border-idle bg-surface-canvas" />
            }
            name="rounded-card"
            value="14px"
          />
          <Swatch
            chip={
              <div className="h-64 rounded-control border border-border-idle bg-surface-canvas" />
            }
            name="rounded-control"
            value="10px"
          />
          <Swatch
            chip={
              <div className="h-64 rounded-chip border border-border-idle bg-surface-canvas" />
            }
            name="rounded-chip"
            value="8px"
          />
          <Swatch
            chip={
              <div className="h-64 rounded-bar border border-border-idle bg-surface-canvas" />
            }
            name="rounded-bar"
            value="7px"
            note="PI mini bar-chart only."
          />
          <Swatch
            chip={
              <div className="h-64 rounded-cell-sm border border-border-idle bg-surface-canvas" />
            }
            name="rounded-cell-sm"
            value="5px"
          />
          <Swatch
            chip={
              <div className="h-64 rounded-tag-sm border border-border-idle bg-surface-canvas" />
            }
            name="rounded-tag-sm"
            value="4px"
          />
        </Grid>

        <Stage>
          <div className="flex flex-col gap-12">
            <Label>icon button &mdash; desktop</Label>
            <div className="size-48 rounded-control border border-border-hairline bg-surface-raised" />
          </div>
          <div className="flex flex-col gap-12">
            <Label>icon button &mdash; mobile</Label>
            <div className="size-48 rounded-pill border border-border-hairline bg-surface-raised" />
          </div>
        </Stage>

        <Flag>
          UNRESOLVED &mdash; the same icon button is square (10px) on desktop and
          circular (999px) on mobile. A wholesale shape change, not drift. DSR
          documents only the desktop form.
        </Flag>
      </Section>

      {/* ================================================================== */}
      <Section
        n="08"
        title="Component treatments"
        note="Desktop and mobile disagree on all four of these. LVM and MS agree with each other, so this reads as a deliberate fork — but it has never been confirmed as one."
      >
        <Stage>
          <div className="flex flex-col gap-16">
            <Label>desktop</Label>
            <div className="flex flex-wrap items-center gap-22">
              <div className="flex size-96 items-center justify-center rounded-control border border-border-idle font-mono text-mono-13 text-text-muted-dim">
                2
              </div>
              <div className="flex size-96 items-center justify-center rounded-control border border-signal-cyan-border-strong bg-signal-cyan-fill-strong font-mono text-mono-13 text-signal-cyan shadow-tile-active">
                7
              </div>
              <div className="flex size-96 items-center justify-center rounded-control border border-signal-violet-border bg-signal-violet-fill font-mono text-mono-13 text-signal-violet-on shadow-tile-done">
                11
              </div>
              <div className="flex size-48 items-center justify-center rounded-chip border border-signal-violet-border bg-signal-violet-fill font-mono text-mono-13 text-signal-violet-on shadow-slot-filled">
                k
              </div>
              <div className="relative h-64 w-4">
                <div
                  className="absolute inset-0 animate-beam-pulse rounded-pill shadow-beam"
                  style={{
                    background:
                      "linear-gradient(var(--color-signal-cyan), transparent)",
                  }}
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-16">
            <Label>mobile</Label>
            <div className="flex flex-wrap items-center gap-22">
              <div className="flex size-50 items-center justify-center rounded-control border border-border-idle font-mono text-mono-13 text-text-muted-dim">
                2
              </div>
              <div className="flex size-50 items-center justify-center rounded-control border border-signal-cyan-border-strong bg-signal-cyan-fill-strong font-mono text-mono-13 text-signal-cyan shadow-tile-active-mobile">
                7
              </div>
              <div className="flex size-50 items-center justify-center rounded-control border border-signal-violet-border-mid bg-signal-violet-fill-strong font-mono text-mono-13 text-signal-violet-on shadow-tile-done-mobile">
                11
              </div>
              <div className="flex size-32 items-center justify-center rounded-cell-sm border border-signal-violet-border-mid bg-signal-violet-fill-strong font-mono text-mono-13 text-signal-violet-on shadow-slot-filled-mobile">
                k
              </div>
              <div className="relative h-48 w-4">
                <div
                  className="absolute inset-0 animate-beam-pulse rounded-pill shadow-beam-mobile"
                  style={{
                    background:
                      "linear-gradient(var(--color-signal-violet-beam), var(--color-signal-cyan))",
                  }}
                />
              </div>
            </div>
          </div>
        </Stage>

        <Grid>
          <Swatch
            chip={
              <div className="flex h-64 items-center justify-center rounded-pill bg-surface-canvas">
                <span className="size-14 rounded-pill border-2 border-signal-cyan bg-surface-canvas shadow-node" />
              </div>
            }
            name="shadow-node"
            value="0 0 16px rgba(61,220,255,0.75)"
            note="Identical in all 5 files."
          />
          <Swatch
            chip={
              <div className="flex h-64 items-center justify-center rounded-chip bg-surface-canvas font-mono text-mono-13 text-text-muted">
                0.16s ease
              </div>
            }
            name="default transition"
            value="--default-transition-duration"
            note="Bare `transition` already uses it."
          />
        </Grid>

        <Flag>
          UNRESOLVED &mdash; tile-active, tile-done, slot-filled and the scan beam
          all differ between desktop and mobile. Both sets are exposed so
          neither platform is silently changed. Decide whether the fork is real.
        </Flag>
      </Section>
    </main>
  );
}
