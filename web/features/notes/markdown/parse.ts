import { Marked } from "marked";

import {
  escapeHtml,
  escapeHtmlAttribute,
  sanitizeMarkdownHref,
} from "./href-policy";

const markdownParser = new Marked({
  gfm: true,
  breaks: true,
  renderer: {
    link({ href, title, text }) {
      const safeHref = href ? sanitizeMarkdownHref(href) : null;
      const label = escapeHtml(text);
      if (!safeHref) return label;

      const titleAttr = title ? ` title="${escapeHtmlAttribute(title)}"` : "";
      return `<a href="${escapeHtmlAttribute(safeHref)}"${titleAttr} rel="noopener noreferrer" target="_blank">${label}</a>`;
    },
    image({ href, title, text }) {
      const safeSrc = href ? sanitizeMarkdownHref(href) : null;
      if (!safeSrc) return escapeHtml(text || "");

      const alt = escapeHtml(text || "");
      const titleAttr = title ? ` title="${escapeHtmlAttribute(title)}"` : "";
      return `<img src="${escapeHtmlAttribute(safeSrc)}" alt="${alt}"${titleAttr} loading="lazy" decoding="async">`;
    },
  },
});

export function parseMarkdownToHtml(source: string): string {
  return markdownParser.parse(source) as string;
}
