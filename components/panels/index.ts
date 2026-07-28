// CodePane is deliberately NOT re-exported here: it's a server-only component
// (lib/highlight.ts imports 'server-only'), and re-exporting it from a barrel
// that client components also import from taints the whole barrel as
// client-reachable before tree-shaking can drop the unused export — Next
// fails the build. Import it directly from "./CodePane" (see SP2, app/(SP2)/
// code-highlight/page.tsx, and app/problems/[slug]/page.tsx).
export { CodePaneStack } from "./CodePaneStack";
export { ActiveLineBar } from "./ActiveLineBar";
export { VariablesPanel } from "./VariablesPanel";
export { MobileVariablesSheet } from "./MobileVariablesSheet";
export { NarrationStrip } from "./NarrationStrip";
export { ComplexityReadout } from "./ComplexityReadout";
