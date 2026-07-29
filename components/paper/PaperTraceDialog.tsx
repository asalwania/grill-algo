"use client";

import { useEffect, useRef, useState } from "react";

import type { PaperStroke } from "@/lib/types";
import { PaperSheet } from "./PaperSheet";

/**
 * "Run it on paper" — the trigger, and the sheet it opens over the page.
 *
 * ## Why a dialog and not a panel
 *
 * The learning view is `lg:h-screen lg:overflow-hidden` on purpose: the scene,
 * code pane and controls are laid out against the viewport and nothing below
 * the fold exists. A sheet of paper cannot be appended to that without
 * breaking the contract every other panel is built on. So the paper trace is a
 * MODE laid over the page rather than a region within it.
 *
 * A native `<dialog>` rather than a hand-rolled overlay, because it brings the
 * four things such an overlay always gets wrong: the top layer (so it clears
 * the scene's WebGL canvas and the fixed mobile footer without a z-index
 * fight), a focus trap, Escape-to-close, and `::backdrop`.
 *
 * The sheet is mounted only while open, keyed on the open count, so reopening
 * always starts from a blank page rather than resuming a finished one.
 */
export function PaperTraceDialog({
  strokes,
  title,
}: {
  strokes: PaperStroke[];
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
        className="rounded-control border border-border-hairline bg-surface-raised px-12 py-6 font-mono text-mono-13 tracking-label text-text-muted transition-colors hover:border-signal-amber-border-mid hover:text-signal-amber"
      >
        <span aria-hidden="true">✎</span> RUN IT ON PAPER
      </button>

      <dialog
        ref={ref}
        aria-label={`${title} — dry run on paper`}
        // Backdrop click: the dialog's own box is the panel below, so a click
        // that lands on the <dialog> element itself landed outside it.
        onClick={(e) => {
          if (e.target === ref.current) setOpen(false);
        }}
        className="m-0 max-h-none max-w-none bg-transparent p-0 backdrop:bg-[rgba(6,7,11,0.82)] backdrop:backdrop-blur-[3px] open:fixed open:inset-0 open:h-full open:w-full"
      >
        {open && (
          <div className="flex h-full w-full flex-col">
            <header className="flex flex-none flex-wrap items-center justify-between gap-12 border-b border-border-hairline bg-surface-canvas px-20 py-14 lg:px-32">
              <div>
                <p className="font-mono text-mono-13 tracking-label-wide text-signal-amber">
                  ON PAPER
                </p>
                <p className="mt-2 text-narration-sm text-text-muted">
                  There is no test runner at a whiteboard. This is {title},
                  dry-run by hand.
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-control border border-border-hairline px-12 py-8 font-mono text-mono-13 text-text-muted transition-colors hover:border-signal-cyan-border hover:text-text-primary"
              >
                CLOSE <span aria-hidden="true">esc</span>
              </button>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto bg-surface-canvas px-20 py-24 lg:px-32">
              <PaperSheet key={opens} strokes={strokes} className="mx-auto" />
            </div>
          </div>
        )}
      </dialog>
    </>
  );
}
