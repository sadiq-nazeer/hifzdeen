/**
 * Canonical base URL for the site. Used for metadataBase, sitemap, robots, and Open Graph.
 * Set NEXT_PUBLIC_SITE_URL in production (e.g. https://hifzdeen.com). On Vercel, VERCEL_URL is used if unset.
 */
export function getSiteUrl(): string {
  const env = process.env.NEXT_PUBLIC_SITE_URL;
  if (env) return env.endsWith("/") ? env.slice(0, -1) : env;
  const vercel = process.env.VERCEL_URL;
  if (vercel) return `https://${vercel}`;
  return "https://quranic-practice.local";
}
