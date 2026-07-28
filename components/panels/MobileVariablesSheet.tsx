"use client";

import { motion, useMotionValue, animate } from "framer-motion";
import { useCallback, useEffect, useRef, useState, type PointerEvent } from "react";
import type { Frame } from "@/lib/types";
import { VariablesPanel } from "./VariablesPanel";

type MobileVariablesSheetProps = {
  frame: Frame;
  className?: string;
};

const COLLAPSED_HEIGHT = 56;
const HALF_HEIGHT = 320;
const SNAP_THRESHOLD = (COLLAPSED_HEIGHT + HALF_HEIGHT) / 2;
// Below this much total pointer travel, a press-release reads as a tap
// (toggle), not a drag (snap-to-nearest).
const TAP_MOVEMENT_THRESHOLD_PX = 6;

/**
 * F15 — variables move into a bottom sheet on mobile, snapping between
 * collapsed (just the handle + label) and half. Drives `height` directly
 * (not a `y` transform) so the sheet's own box clips its content — the
 * standard transform-drag trick doesn't apply here since the handle has to
 * stay pinned to the sheet's OWN top edge at every height, not slide with it.
 */
export function MobileVariablesSheet({ frame, className = "" }: MobileVariablesSheetProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const height = useMotionValue(COLLAPSED_HEIGHT);
  const totalMovement = useRef(0);

  useEffect(() => {
    const controls = animate(height, isExpanded ? HALF_HEIGHT : COLLAPSED_HEIGHT, {
      type: "spring",
      stiffness: 380,
      damping: 38,
    });
    return () => controls.stop();
  }, [isExpanded, height]);

  const handlePointerDown = useCallback((event: PointerEvent<HTMLButtonElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    totalMovement.current = 0;
  }, []);

  const handlePointerMove = useCallback(
    (event: PointerEvent<HTMLButtonElement>) => {
      if (event.buttons !== 1) return;
      totalMovement.current += Math.abs(event.movementY);
      const next = height.get() - event.movementY;
      height.set(Math.min(HALF_HEIGHT, Math.max(COLLAPSED_HEIGHT, next)));
    },
    [height],
  );

  const handlePointerUp = useCallback(() => {
    if (totalMovement.current < TAP_MOVEMENT_THRESHOLD_PX) {
      setIsExpanded((value) => !value);
    } else {
      setIsExpanded(height.get() > SNAP_THRESHOLD);
    }
  }, [height]);

  return (
    <motion.div
      style={{ height }}
      className={`overflow-hidden rounded-t-card border border-b-0 border-border-hairline bg-surface-raised ${className}`}
    >
      <button
        type="button"
        aria-expanded={isExpanded}
        aria-label="Toggle variables panel"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="flex w-full flex-col items-center gap-8 py-10"
        style={{ touchAction: "none" }}
      >
        <span aria-hidden className="h-4 w-36 rounded-pill bg-border-idle" />
        <span className="font-mono text-mono-13 tracking-label-wide text-text-muted">
          VARIABLES
        </span>
      </button>
      <div className="max-h-[248px] overflow-y-auto px-16 pb-16">
        <VariablesPanel frame={frame} />
      </div>
    </motion.div>
  );
}
