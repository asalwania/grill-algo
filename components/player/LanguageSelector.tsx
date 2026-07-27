"use client";

import { usePlayerDispatch, usePlayerState } from "./PlayerProvider";
import type { Language } from "@/lib/types";

const LANGUAGES: { value: Language; label: string }[] = [
  { value: "javascript", label: "JavaScript" },
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
  { value: "go", label: "Go" },
];

const PILL_BASE =
  "flex h-[32px] items-center justify-center rounded-pill px-14 font-mono text-mono-13 tracking-label-wide transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal-cyan";
const PILL_ACTIVE =
  "border border-signal-cyan-border-mid bg-signal-cyan-fill text-signal-cyan";
const PILL_INACTIVE =
  "border border-border-hairline bg-transparent text-text-muted hover:border-signal-cyan-border-mid hover:text-text-primary";

/**
 * F14 — four pills (S3: "JavaScript (active), Python, Java, Go"). Dispatch-only,
 * same shape as ApproachTabs: swapping the code listing and re-deriving the
 * active line from the new language's `Solution.lineMap` both fall out of
 * `state.language` downstream. Frames, scene, vars and narration never move —
 * that separation is F14's whole point.
 */
export function LanguageSelector() {
  const { language } = usePlayerState();
  const dispatch = usePlayerDispatch();

  return (
    <div role="tablist" aria-label="Language" className="flex items-center gap-8">
      {LANGUAGES.map((entry) => {
        const isActive = language === entry.value;
        return (
          <button
            key={entry.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() =>
              dispatch({ type: "SET_LANGUAGE", language: entry.value })
            }
            className={`${PILL_BASE} ${isActive ? PILL_ACTIVE : PILL_INACTIVE}`}
          >
            {entry.label}
          </button>
        );
      })}
    </div>
  );
}
