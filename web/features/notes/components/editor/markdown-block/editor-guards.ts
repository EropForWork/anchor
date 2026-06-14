import { MARKDOWN_SOURCE_SELECTOR } from "./constants";
import {
  getActiveMarkdownEditingNode,
  isMarkdownBlockEditing,
  markMarkdownOutsidePointer,
} from "./editing-state";

let installed = false;

/**
 * One-time document guards so Quill does not steal focus/selection while the
 * user types in a markdown source textarea.
 */
export function installMarkdownEditorGuards(): void {
  if (installed || typeof document === "undefined") return;
  installed = true;

  // Quill subscribes to selectionchange on document (bubble). Capture first.
  document.addEventListener(
    "selectionchange",
    (event) => {
      if (!isMarkdownBlockEditing()) return;

      const active = document.activeElement;
      if (!(active instanceof HTMLTextAreaElement)) return;
      if (!active.matches(MARKDOWN_SOURCE_SELECTOR)) return;

      event.stopImmediatePropagation();
    },
    true,
  );

  const handleOutsidePointer = (event: Event) => {
    if (!isMarkdownBlockEditing()) return;

    const target = event.target;
    if (!(target instanceof Node)) return;

    const node = getActiveMarkdownEditingNode();
    if (!node || node.contains(target)) return;

    markMarkdownOutsidePointer();
  };

  document.addEventListener("mousedown", handleOutsidePointer, true);
  document.addEventListener("touchstart", handleOutsidePointer, true);
}
