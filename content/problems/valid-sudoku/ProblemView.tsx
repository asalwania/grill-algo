"use client";

import { GridProblemView, type GridProblemViewProps } from "@/components/problem";
import { ProblemBrief } from "./ProblemBrief";
import { VALID_SUDOKU_CHROME } from "./chrome";

/**
 * Valid Sudoku's learning view — a thin wrapper that supplies this problem's
 * chrome and brief to the shared grid-family view, plus the 3x3 `boxSize`
 * accent. Everything else on the page is common to the whole grid family.
 *
 * A CLIENT module because `GridChrome` holds functions, which cannot cross
 * the RSC boundary; the route passes only plain data and lets this supply
 * the rest.
 */
export function ProblemView(props: Omit<GridProblemViewProps, "chrome" | "brief">) {
  return (
    <GridProblemView
      {...props}
      chrome={VALID_SUDOKU_CHROME}
      brief={ProblemBrief}
      boxSize={{ rows: 3, cols: 3 }}
    />
  );
}
