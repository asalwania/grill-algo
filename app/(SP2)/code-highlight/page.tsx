import { CodePane } from "@/components/panels/CodePane";
import { Harness } from "./Harness";

/* Fixed and read-only, per the code-pane rule — nothing here ever executes in
   the browser. Exactly 12 lines. */
const SNIPPET = `function twoSum(nums, target) {
  const seen = new Map();

  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];

    if (seen.has(complement)) {
      return [seen.get(complement), i];
    }

    seen.set(nums[i], i);
  }
}`;
const LINE_COUNT = 12;

/**
 * Server component: Shiki runs here, at build time. The page has no dynamic
 * inputs, so it prerenders and the highlighted HTML is baked into the payload.
 * CodePane is passed as children into the client Harness so the highlighted
 * markup stays server-rendered — only the active-line index lives client-side.
 */
export default function CodeHighlightPage() {
  return (
    <main className="p-32">
      <div className="max-w-[640px]">
        <Harness lineCount={LINE_COUNT}>
          <CodePane code={SNIPPET} language="javascript" />
        </Harness>
      </div>
    </main>
  );
}
