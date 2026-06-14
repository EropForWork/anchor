import {
  renderMarkdownPreviewHtml,
  sanitizeMarkdownHref,
} from "@/features/notes/markdown";

import {
  MARKDOWN_BLOCK_CLASS,
  MARKDOWN_BLOCK_EDITING_CLASS,
  MARKDOWN_PREVIEW_CLASS,
  MARKDOWN_SOURCE_CLASS,
} from "./constants";
import {
  beginMarkdownBlockEditing,
  consumeMarkdownOutsidePointerBlur,
  endMarkdownBlockEditing,
} from "./editing-state";
import {
  commitMarkdownEmbedValue,
  getQuillFromMarkdownNode,
  isMarkdownEditorReadOnly,
  notifyEditorContentChange,
} from "./quill-bridge";
import { pauseQuillKeyboard, resumeQuillKeyboard } from "./quill-keyboard";
import { bindMarkdownSourceField } from "./source-field";

export function setMarkdownPreviewHtml(
  preview: HTMLElement,
  source: string,
): void {
  preview.innerHTML = renderMarkdownPreviewHtml(source);
}

function handlePreviewLinkClick(event: MouseEvent): void {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;

  const anchor = target.closest("a");
  if (!anchor) return;

  const href = anchor.getAttribute("href");
  if (!href) return;

  event.preventDefault();
  event.stopPropagation();

  const safeHref = sanitizeMarkdownHref(href);
  if (!safeHref) return;

  window.open(safeHref, "_blank", "noopener,noreferrer");
}

function restoreSourceFocus(source: HTMLTextAreaElement): void {
  const start = source.selectionStart ?? source.value.length;
  const end = source.selectionEnd ?? start;
  source.focus();
  source.setSelectionRange(start, end);
}

function handleSourceBlur(
  node: HTMLElement,
  source: HTMLTextAreaElement,
  exitEditMode: () => void,
): void {
  window.setTimeout(() => {
    if (!node.classList.contains(MARKDOWN_BLOCK_EDITING_CLASS)) return;

    const active = document.activeElement;
    if (active && (node.contains(active) || active === source)) return;

    if (consumeMarkdownOutsidePointerBlur()) {
      exitEditMode();
      return;
    }

    // Quill occasionally pulls focus to .ql-editor during typing — restore it.
    if (active instanceof HTMLElement && active.closest(".ql-editor")) {
      restoreSourceFocus(source);
      return;
    }

    exitEditMode();
  }, 0);
}

export function attachMarkdownBlockHandlers(
  node: HTMLElement,
  preview: HTMLElement,
  source: HTMLTextAreaElement,
): void {
  const enterEditMode = () => {
    if (isMarkdownEditorReadOnly(node)) return;
    if (node.classList.contains(MARKDOWN_BLOCK_EDITING_CLASS)) return;

    const quill = getQuillFromMarkdownNode(node);
    if (quill) pauseQuillKeyboard(quill);
    beginMarkdownBlockEditing(node);

    node.classList.add(MARKDOWN_BLOCK_EDITING_CLASS);
    preview.hidden = true;
    source.hidden = false;
    source.focus();
    const end = source.value.length;
    source.setSelectionRange(end, end);
  };

  const exitEditMode = () => {
    if (!node.classList.contains(MARKDOWN_BLOCK_EDITING_CLASS)) return;

    const quill = getQuillFromMarkdownNode(node);
    const newValue = source.value;

    setMarkdownPreviewHtml(preview, newValue);
    node.classList.remove(MARKDOWN_BLOCK_EDITING_CLASS);
    preview.hidden = false;
    source.hidden = true;
    endMarkdownBlockEditing();
    if (quill) resumeQuillKeyboard(quill);

    commitMarkdownEmbedValue(node, newValue);
    notifyEditorContentChange(node);
  };

  preview.addEventListener("click", handlePreviewLinkClick);
  preview.addEventListener("mousedown", (event) => {
    if (isMarkdownEditorReadOnly(node)) return;
    if ((event.target as HTMLElement).closest("a")) return;
    event.preventDefault();
    enterEditMode();
  });

  source.addEventListener("blur", () =>
    handleSourceBlur(node, source, exitEditMode),
  );

  source.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    event.preventDefault();
    source.blur();
  });
}

export function createMarkdownBlockElements(markdown: string): {
  node: HTMLElement;
  preview: HTMLElement;
  source: HTMLTextAreaElement;
} {
  const preview = document.createElement("div");
  preview.className = MARKDOWN_PREVIEW_CLASS;
  setMarkdownPreviewHtml(preview, markdown);

  const source = document.createElement("textarea");
  source.className = MARKDOWN_SOURCE_CLASS;
  source.value = markdown;
  source.hidden = true;
  source.spellcheck = false;
  source.placeholder = "Write markdown…";
  source.setAttribute("aria-label", "Markdown source");
  source.rows = 1;

  const node = document.createElement("div");
  node.className = MARKDOWN_BLOCK_CLASS;
  node.setAttribute("contenteditable", "false");
  node.appendChild(preview);
  node.appendChild(source);

  attachMarkdownBlockHandlers(node, preview, source);
  bindMarkdownSourceField(source);
  return { node, preview, source };
}

export function focusMarkdownBlockForEdit(node: HTMLElement): void {
  if (isMarkdownEditorReadOnly(node)) return;
  const preview = node.querySelector(`.${MARKDOWN_PREVIEW_CLASS}`);
  preview?.dispatchEvent(
    new MouseEvent("mousedown", { bubbles: true, cancelable: true }),
  );
}
