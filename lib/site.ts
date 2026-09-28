/**
 * Absolute origin of the site, used for Open Graph images, the sitemap and robots.txt.
 * Prefers NEXT_PUBLIC_SITE_URL, then the production domain Vercel exposes automatically,
 * so a deploy never advertises localhost links.
 */
function resolveSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/+$/, "");

  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
  if (vercel) return `https://${vercel}`;

  return "http://localhost:3000";
}

export const siteUrl = resolveSiteUrl();
