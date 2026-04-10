/**
 * Resolves the canonical site URL for auth redirects, magic links, and invite links.
 *
 * Priority:
 *   1. NEXT_PUBLIC_SITE_URL env var (set in Vercel for prod/preview)
 *   2. window.location.origin (browser context, e.g. local dev)
 *   3. http://localhost:3000 (SSR fallback)
 *
 * Intentionally left unset in .env.local so local dev uses window.location.origin
 * and reset flows work against the running dev server.
 */
export function getSiteUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (envUrl) return envUrl.replace(/\/$/, "");
  if (typeof window !== "undefined") return window.location.origin;
  return "http://localhost:3000";
}
