import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/site";

/**
 * Three routes ship in the production build but are not part of the product:
 * `/context-canvas` and `/code-highlight` are SP1's and SP2's spike pages, and
 * `/tokens` is P2's design-token swatch sheet. AGENTS.md keeps the spikes as
 * the record of where decisions came from, so they are not deleted — but they
 * should not be indexed either, or they become the first thing a search engine
 * finds under this domain.
 *
 * This hides them from crawlers, not from visitors. Anyone who guesses the URL
 * still gets the page; that is acceptable for a swatch sheet and a spinning
 * cube, and the alternative (excluding them from the build) would mean the
 * spike routes rot silently.
 *
 * No sitemap here on purpose — that is still F18's, along with canonical URLs,
 * the OG image route and JSON-LD.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/tokens", "/context-canvas", "/code-highlight"],
    },
    host: SITE_URL,
  };
}
