import { CodePane } from "@/components/panels/CodePane";
import { highlightJavaScript } from "@/lib/highlight";

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

/**
 * Server component: Shiki runs here, at build time. The page has no dynamic
 * inputs, so it prerenders and the highlighted HTML is baked into the payload.
 */
export default async function CodeHighlightPage() {
  const { html, lineCount } = await highlightJavaScript(SNIPPET);

  return (
    <main className="p-32">
      <div className="max-w-[640px]">
        <CodePane html={html} lineCount={lineCount} />
      </div>
    </main>
  );
}
