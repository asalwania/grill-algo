"use client";

import { useEffect, useRef, useState } from "react";

import type { ApproachBlock, ApproachCheck, ApproachMove } from "@/lib/types";

/**
 * The derivation, read top to bottom with a flow spine down the side.
 *
 * Shared across every problem that ships an `approach.ts`, and it knows NOTHING
 * about any of them — it knows how to draw a block and how to keep the spine in
 * step with the scroll, and that is all. The moves arrive as plain data from
 * the server, so the problem's generator never enters the browser bundle; same
 * discipline as the shipped frames and the paper sheet.
 *
 * The spine is a real sequence, not decoration: understand → concretize → brute
 * → waste → insight → plan → poke → cost, each move earning the next. That is
 * what justifies the numbers.
 */
export function ApproachReader({ moves }: { moves: ApproachMove[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(moves[0]?.id ?? "");

  // Scroll-spy: the spine node that lights up is whichever move sits in the
  // reading band. Observed against the content column, not the viewport, so it
  // works inside the dialog's own scroll.
  useEffect(() => {
    const root = scrollRef.current;
    if (!root) return;
    const sections = root.querySelectorAll<HTMLElement>("[data-move]");
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActive((entry.target as HTMLElement).dataset.move ?? "");
          }
        }
      },
      { root, rootMargin: "-45% 0px -50% 0px", threshold: 0 },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [moves]);

  const jump = (id: string) => {
    scrollRef.current
      ?.querySelector(`[data-move="${id}"]`)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)] lg:grid-cols-[minmax(0,230px)_minmax(0,1fr)] lg:grid-rows-1">
      <Spine moves={moves} active={active} onJump={jump} />

      <div
        ref={scrollRef}
        className="min-h-0 overflow-y-auto px-20 py-24 lg:px-32 lg:py-32"
      >
        <div className="mx-auto flex max-w-[720px] flex-col gap-16">
          {moves.map((move, index) => (
            <MoveCard key={move.id} move={move} index={index} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* the spine                                                                  */
/* -------------------------------------------------------------------------- */

function Spine({
  moves,
  active,
  onJump,
}: {
  moves: ApproachMove[];
  active: string;
  onJump: (id: string) => void;
}) {
  return (
    <nav
      aria-label="The flow"
      className="flex-none border-b border-border-hairline bg-surface-canvas px-20 py-14 lg:border-b-0 lg:border-r lg:px-24 lg:py-32"
    >
      <p className="mb-16 hidden font-mono text-mono-13 tracking-label-wide text-text-muted-dim lg:block">
        THE FLOW
      </p>

      <ol className="relative flex gap-8 overflow-x-auto lg:flex-col lg:gap-4 lg:overflow-visible">
        {/* The rail behind the nodes — desktop only; on mobile the nodes are a
            horizontal strip and a connecting line would fight the scroll. */}
        <span
          aria-hidden="true"
          className="absolute left-[13px] top-[10px] bottom-[10px] hidden w-px bg-border-hairline lg:block"
        />
        {moves.map((move, index) => {
          const on = move.id === active;
          return (
            <li key={move.id} className="relative flex-none lg:flex-auto">
              <button
                onClick={() => onJump(move.id)}
                aria-current={on ? "true" : undefined}
                className="group flex items-center gap-10 rounded-control py-8 pr-8 lg:w-full"
              >
                <span
                  className={[
                    "relative z-10 grid h-[27px] w-[27px] flex-none place-items-center rounded-pill border bg-surface-canvas font-mono text-mono-13 transition-colors",
                    on && move.climax
                      ? "border-signal-violet-border-mid bg-signal-violet-fill text-signal-violet-on"
                      : on
                        ? "border-signal-cyan-border-mid bg-signal-cyan-fill text-signal-cyan"
                        : "border-border-hairline text-text-muted-dim group-hover:text-text-muted",
                  ].join(" ")}
                >
                  {index}
                </span>
                <span
                  className={[
                    "whitespace-nowrap font-mono text-mono-13 tracking-label transition-colors lg:whitespace-normal",
                    on ? "text-text-primary" : "text-text-muted group-hover:text-text-primary",
                  ].join(" ")}
                >
                  {move.label}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/* -------------------------------------------------------------------------- */
/* a move                                                                     */
/* -------------------------------------------------------------------------- */

function MoveCard({ move, index }: { move: ApproachMove; index: number }) {
  return (
    <section
      data-move={move.id}
      className={[
        "scroll-mt-16 rounded-card border p-24",
        move.climax
          ? "border-signal-violet-border bg-signal-violet-fill shadow-card-glow"
          : "border-border-hairline bg-surface-raised",
      ].join(" ")}
    >
      <p
        className={[
          "font-mono text-mono-13 tracking-label-wide",
          move.climax ? "text-signal-violet-on" : "text-signal-cyan",
        ].join(" ")}
      >
        <span className="text-text-muted-dim">STAGE {index}</span> · {move.label.toUpperCase()}
      </p>

      {move.title && (
        <h3 className="mt-10 font-display text-display-24 text-text-primary text-balance">
          {move.title}
        </h3>
      )}

      <div className="mt-14 flex flex-col gap-14">
        {move.blocks.map((block, i) => (
          <Block key={i} block={block} />
        ))}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* the blocks                                                                 */
/* -------------------------------------------------------------------------- */

function Block({ block }: { block: ApproachBlock }) {
  switch (block.kind) {
    case "text":
      return <p className="text-narration text-text-muted">{block.text}</p>;

    case "restate":
      return (
        <div className="flex flex-col gap-8 rounded-control border border-border-hairline-subtle bg-surface-canvas px-16 py-14">
          {block.rows.map((row, i) => (
            <div key={i} className="flex flex-wrap items-baseline gap-10">
              <span className="min-w-[64px] font-mono text-mono-13 tracking-label text-text-muted-dim">
                {row.label}
              </span>
              <span className="text-narration-sm text-text-primary">{row.text}</span>
            </div>
          ))}
        </div>
      );

    case "code":
      return <CodeBlock caption={block.caption} code={block.code} mark={block.mark} />;

    case "aside":
      return <Aside tone={block.tone} label={block.label} text={block.text} />;

    case "pivot":
      return (
        <p className="rounded-control border border-signal-cyan-border bg-signal-cyan-fill-weak px-20 py-16 font-display text-display-24 text-text-primary text-balance">
          {block.text}
        </p>
      );

    case "insight":
      return (
        <div className="flex flex-col gap-12">
          <p className="font-display text-display-32 text-signal-violet-on text-balance">
            {block.statement}
          </p>
          <p className="text-narration text-text-muted">{block.detail}</p>
        </div>
      );

    case "checks":
      return (
        <div className="flex flex-col gap-8">
          {block.rows.map((row, i) => (
            <Check key={i} row={row} />
          ))}
        </div>
      );

    case "cost":
      return (
        <div className="flex flex-col gap-12">
          <div className="flex flex-col gap-8">
            {block.rows.map((row, i) => (
              <div
                key={i}
                className={[
                  "grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-14 rounded-control border px-16 py-12",
                  row.win
                    ? "border-signal-cyan-border-mid bg-signal-cyan-fill"
                    : "border-border-hairline-subtle bg-surface-canvas",
                ].join(" ")}
              >
                <span className="font-mono text-mono-13 tracking-label text-text-muted">
                  {row.label.toUpperCase()}
                </span>
                <Metric label="time" value={row.time} win={row.win} strike={!row.win} />
                <Metric label="space" value={row.space} win={row.win} />
              </div>
            ))}
          </div>
          <p className="text-narration-sm text-text-muted">{block.takeaway}</p>
        </div>
      );
  }
}

function Metric({
  label,
  value,
  win,
  strike = false,
}: {
  label: string;
  value: string;
  win: boolean;
  strike?: boolean;
}) {
  return (
    <span className="flex items-baseline gap-4">
      <span className="font-mono text-mono-13 tracking-label text-text-muted-dim">{label}</span>
      <span
        className={[
          "font-mono text-code-14 tabular-nums",
          win ? "text-signal-cyan" : "text-text-muted",
          strike ? "line-through decoration-text-muted-dim" : "",
        ].join(" ")}
      >
        {value}
      </span>
    </span>
  );
}

function Check({ row }: { row: ApproachCheck }) {
  const found = row.result !== "[]" && row.result !== "false";
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-14 gap-y-8 rounded-control border border-border-hairline-subtle bg-surface-canvas px-16 py-12 sm:grid-cols-[minmax(120px,190px)_minmax(0,1fr)_auto]">
      <span className="font-mono text-code-14 tabular-nums text-text-primary">{row.input}</span>
      <span className="col-span-2 text-narration-sm text-text-muted sm:col-span-1 sm:col-start-2">
        {row.why}
      </span>
      <span
        className={[
          "col-start-2 row-start-1 justify-self-end whitespace-nowrap font-mono text-mono-13 sm:col-start-3",
          found ? "text-signal-green-on" : "text-text-muted-dim",
        ].join(" ")}
      >
        → {row.result}
      </span>
    </div>
  );
}

function CodeBlock({
  caption,
  code,
  mark = [],
}: {
  caption?: string;
  code: string;
  mark?: number[];
}) {
  const marked = new Set(mark);
  const lines = code.split("\n");
  return (
    <div className="flex flex-col gap-8">
      {caption && (
        <span className="font-mono text-mono-13 tracking-label text-text-muted-dim">
          {caption.toUpperCase()}
        </span>
      )}
      <pre className="overflow-x-auto rounded-control border border-border-hairline-subtle bg-surface-canvas py-12 font-mono text-code-14">
        {lines.map((line, i) => {
          const on = marked.has(i + 1);
          return (
            <div
              key={i}
              className={[
                "whitespace-pre px-16",
                on
                  ? "border-l-2 border-signal-cyan bg-signal-cyan-fill-weak text-text-primary"
                  : "border-l-2 border-transparent text-text-muted",
              ].join(" ")}
            >
              {line || " "}
            </div>
          );
        })}
      </pre>
    </div>
  );
}

function Aside({
  tone,
  label,
  text,
}: {
  tone: "note" | "caution";
  label: string;
  text: string;
}) {
  const caution = tone === "caution";
  return (
    <div
      className={[
        "flex flex-col gap-8 rounded-control border-l-2 py-8 pl-16 pr-4 sm:flex-row sm:gap-12",
        caution
          ? "border-signal-amber bg-signal-amber-fill"
          : "border-signal-cyan-border bg-signal-cyan-fill-weak",
      ].join(" ")}
    >
      <span
        className={[
          "flex-none font-mono text-mono-13 tracking-label",
          caution ? "text-signal-amber" : "text-signal-cyan",
        ].join(" ")}
      >
        {label.toUpperCase()}
      </span>
      <span className="text-narration-sm text-text-primary">{text}</span>
    </div>
  );
}
