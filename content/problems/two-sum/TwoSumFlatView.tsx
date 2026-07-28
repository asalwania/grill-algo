"use client";

import { ArrayMemoryFlatView } from "@/components/problem";
import type { ArrayMemoryFrame } from "@/lib/types";
import { TWO_SUM_CHROME } from "./chrome";

type TwoSumFlatViewProps = {
  frame: ArrayMemoryFrame;
  isFallback?: boolean;
  floatingControls?: boolean;
  className?: string;
};

/**
 * The shared flat view, bound to Two Sum's chrome.
 *
 * This wrapper exists because of a hard RSC rule: `ProblemChrome` holds
 * FUNCTIONS, and a Server Component cannot pass a function to a Client
 * Component. The homepage (`app/page.tsx`) is a Server Component and renders
 * the flat view twice, so the chrome has to be attached on the client side of
 * the boundary — here — rather than handed across it.
 *
 * Same reasoning as `ProblemView.tsx`, one layer down: the route passes plain
 * data, and the problem's own client module supplies the rest.
 */
export function TwoSumFlatView(props: TwoSumFlatViewProps) {
  return <ArrayMemoryFlatView {...props} chrome={TWO_SUM_CHROME} />;
}
