import { normalizeUrl } from "@/features/notes/link-utils";

const HOST_LIKE = /^(?:[\w-]+(?:\.[\w-]+)+|localhost)(?::\d+)?(?:[/?#].*)?$/i;

const BLOCKED_SCHEMES = ["javascript:", "data:", "vbscript:", "file:"] as const;

const ALLOWED_SCHEMES = ["http://", "https://", "mailto:", "tel:"] as const;

/**
 * Returns a safe href for rendered markdown, or null if the URL must not be linked.
 * Stricter than editor link-utils: blocks file:// and other local schemes in preview.
 */
export function sanitizeMarkdownHref(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const lower = trimmed.toLowerCase();
  for (const blocked of BLOCKED_SCHEMES) {
    if (lower.startsWith(blocked)) return null;
  }

  const normalized = normalizeUrl(trimmed);
  const normalizedLower = normalized.toLowerCase();

  for (const scheme of ALLOWED_SCHEMES) {
    if (normalizedLower.startsWith(scheme)) return normalized;
  }

  if (HOST_LIKE.test(normalized)) return `https://${normalized}`;
  return null;
}

export function escapeHtml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function escapeHtmlAttribute(value: string): string {
  return escapeHtml(value).replaceAll("`", "&#96;");
}
