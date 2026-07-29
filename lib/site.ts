/**
 * The site's own absolute origin, resolved at build time.
 *
 * Next needs this for `metadataBase` — without it, every relative OG/canonical
 * URL resolves against `localhost:3000` and social previews break the moment
 * someone pastes a link. It is derived rather than hard-coded so the same build
 * is correct on a preview deployment, on production, and locally.
 *
 * Order matters:
 *  - `NEXT_PUBLIC_SITE_URL` is the explicit override — set it once a real
 *    custom domain exists, since that is the only value a host cannot infer.
 *  - `VERCEL_PROJECT_PRODUCTION_URL` is the STABLE production hostname.
 *    Deliberately preferred over `VERCEL_URL`, which is the per-deployment
 *    hostname and changes on every push — canonical URLs pointing at it would
 *    fragment across deployments.
 *  - localhost last, so `pnpm dev` and `pnpm build` work with no env at all.
 *
 * Neither Vercel variable is prefixed `NEXT_PUBLIC_`, so this module must stay
 * server-side. It is only imported by metadata/robots, which are.
 */
function resolveSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/$/, "");

  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercel) return `https://${vercel}`;

  return "http://localhost:3000";
}

export const SITE_URL = resolveSiteUrl();
