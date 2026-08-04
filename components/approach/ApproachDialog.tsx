"use client";

import { useEffect, useRef, useState } from "react";

import type { ApproachMove } from "@/lib/types";
import { ApproachReader } from "./ApproachReader";

/**
 * "How to solve it" — the trigger, and the walkthrough it opens over the page.
 *
 * Same argument as the paper trace (SP4): the learning view is
 * `lg:h-screen lg:overflow-hidden` and nothing below the fold exists, so a
 * long-form reading surface cannot be a region within it — it is a MODE laid
 * over the page. A native `<dialog>` brings the four things a hand-rolled
 * overlay always gets wrong: the top layer (so it clears the scene's WebGL
 * canvas and the fixed mobile footer), a focus trap, Escape-to-close, and
 * `::backdrop`.
 *
 * The reader is mounted only while open, keyed on the open count, so reopening
 * always starts at the top rather than resuming a scroll position.
 */
export function ApproachDialog({
  moves,
  title,
}: {
  moves: ApproachMove[];
  title: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [opens, setOpens] = useState(0);
  const [open, setOpen] = useState(false);

  // `showModal()` has no declarative equivalent — the top layer and the focus
  // trap only exist when the element is opened through it.
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (open && !node.open) node.showModal();
    if (!open && node.open) node.close();
  }, [open]);

  // Escape and the backdrop close the dialog without going through our state,
  // so the element is the source of truth and React follows it.
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const onClose = () => setOpen(false);
    node.addEventListener("close", onClose);
    return () => node.removeEventListener("close", onClose);
  }, []);

  return (
    <>
      <button
        onClick={() => {
          setOpens((n) => n + 1);
          setOpen(true);
        }}
        className="rounded-control border border-border-hairline bg-surface-raised px-12 py-6 font-mono text-mono-13 tracking-label text-text-muted transition-colors hover:border-signal-cyan-border hover:text-signal-cyan"
      >
        <span aria-hidden="true">◆</span> HOW TO SOLVE IT
      </button>

      <dialog
        ref={ref}
        aria-label={`${title} — how to approach it`}
        // Backdrop click: the dialog's own box is the panel below, so a click
        // that lands on the <dialog> element itself landed outside it.
        onClick={(e) => {
          if (e.target === ref.current) setOpen(false);
        }}
        className="m-0 max-h-none max-w-none bg-transparent p-0 backdrop:bg-[rgba(6,7,11,0.82)] backdrop:backdrop-blur-[3px] open:fixed open:inset-0 open:h-full open:w-full"
      >
        {open && (
          <div className="flex h-full w-full flex-col bg-surface-canvas">
            <header className="flex flex-none flex-wrap items-center justify-between gap-12 border-b border-border-hairline px-20 py-14 lg:px-32">
              <div>
                <p className="font-mono text-mono-13 tracking-label-wide text-signal-cyan">
                  THE APPROACH
                </p>
                <p className="mt-2 text-narration-sm text-text-muted">
                  Not the solution — the road to it. {title}, reasoned out from a
                  blank page.
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-control border border-border-hairline px-12 py-8 font-mono text-mono-13 text-text-muted transition-colors hover:border-signal-cyan-border hover:text-text-primary"
              >
                CLOSE <span aria-hidden="true">esc</span>
              </button>
            </header>

            <div className="flex min-h-0 flex-1 flex-col">
              <ApproachReader key={opens} moves={moves} />
            </div>
          </div>
        )}
      </dialog>
    </>
  );
}
