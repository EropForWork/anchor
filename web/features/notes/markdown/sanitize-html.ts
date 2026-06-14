import DOMPurify from "isomorphic-dompurify";

import { sanitizeMarkdownHref } from "./href-policy";

const ALLOWED_TAGS = [
  "p",
  "br",
  "strong",
  "em",
  "b",
  "i",
  "u",
  "s",
  "del",
  "ins",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "ul",
  "ol",
  "li",
  "blockquote",
  "pre",
  "code",
  "a",
  "hr",
  "table",
  "thead",
  "tbody",
  "tr",
  "th",
  "td",
  "img",
] as const;

const ALLOWED_ATTR = [
  "href",
  "title",
  "target",
  "rel",
  "class",
  "src",
  "alt",
  "colspan",
  "rowspan",
] as const;

let hooksInstalled = false;

function installSanitizerHooks(): void {
  if (hooksInstalled) return;
  hooksInstalled = true;

  DOMPurify.addHook("uponSanitizeAttribute", (node, data) => {
    if (data.attrName !== "href" && data.attrName !== "src") return;

    const safe = sanitizeMarkdownHref(data.attrValue);
    if (!safe) {
      data.keepAttr = false;
      if (data.attrName === "href" && node.tagName === "A") {
        node.setAttribute("role", "text");
      }
      return;
    }

    data.attrValue = safe;
  });

  DOMPurify.addHook("afterSanitizeAttributes", (node) => {
    if (node.tagName !== "A") return;
    if (!node.hasAttribute("href")) return;
    node.setAttribute("target", "_blank");
    node.setAttribute("rel", "noopener noreferrer");
  });
}

installSanitizerHooks();

/**
 * Defense-in-depth HTML sanitizer for markdown preview output.
 * Strips scripts, event handlers, and dangerous URLs even if the parser missed them.
 */
export function sanitizeMarkdownHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [...ALLOWED_TAGS],
    ALLOWED_ATTR: [...ALLOWED_ATTR],
    ALLOW_DATA_ATTR: false,
    ALLOW_UNKNOWN_PROTOCOLS: false,
  });
}
