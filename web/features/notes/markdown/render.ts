import {
  MARKDOWN_EMPTY_HTML_CLASS,
  MARKDOWN_EMPTY_PLACEHOLDER,
} from "./constants";
import { parseMarkdownToHtml } from "./parse";
import { sanitizeMarkdownHtml } from "./sanitize-html";

/**
 * Full markdown preview pipeline: parse → sanitize → safe HTML string.
 */
export function renderMarkdownPreviewHtml(source: string): string {
  const trimmed = source.trim();
  if (!trimmed) {
    return `<p class="${MARKDOWN_EMPTY_HTML_CLASS}">${MARKDOWN_EMPTY_PLACEHOLDER}</p>`;
  }

  const rawHtml = parseMarkdownToHtml(trimmed);
  return sanitizeMarkdownHtml(rawHtml);
}

/**
 * First non-empty line for card/search previews (no HTML).
 */
export function markdownToPreviewLine(source: string): string {
  const firstLine = source
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line.length > 0);

  return firstLine ?? "[Markdown]";
}
