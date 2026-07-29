"use client";

import {
  ArrayMemoryProblemView,
  type ArrayMemoryProblemViewProps,
} from "@/components/problem";
import { ProblemBrief } from "./ProblemBrief";
import { ENCODE_AND_DECODE_STRINGS_CHROME } from "./chrome";

/**
 * Encode and Decode Strings' learning view — a thin wrapper that supplies this
 * problem's chrome and brief to the shared one. Everything else on the page is
 * common to the whole array-plus-memory family.
 *
 * A CLIENT module because `ProblemChrome` holds functions, which cannot cross
 * the RSC boundary; the route passes only plain data and lets this supply the
 * rest.
 */
export function ProblemView(
  props: Omit<ArrayMemoryProblemViewProps, "chrome" | "brief">,
) {
  return (
    <ArrayMemoryProblemView
      {...props}
      chrome={ENCODE_AND_DECODE_STRINGS_CHROME}
      brief={ProblemBrief}
    />
  );
}
