import { MARKDOWN_SOURCE_SELECTOR } from "./constants";

let activeEditingNode: HTMLElement | null = null;
let blurFromOutsidePointer = false;

export function beginMarkdownBlockEditing(node: HTMLElement): void {
  activeEditingNode = node;
  blurFromOutsidePointer = false;
}

export function endMarkdownBlockEditing(): void {
  activeEditingNode = null;
  blurFromOutsidePointer = false;
}

export function isMarkdownBlockEditing(): boolean {
  if (activeEditingNode !== null) return true;

  const active = document.activeElement;
  return (
    active instanceof HTMLElement &&
    Boolean(active.closest(MARKDOWN_SOURCE_SELECTOR))
  );
}

export function getActiveMarkdownEditingNode(): HTMLElement | null {
  return activeEditingNode;
}

export function consumeMarkdownOutsidePointerBlur(): boolean {
  const wasOutside = blurFromOutsidePointer;
  blurFromOutsidePointer = false;
  return wasOutside;
}

export function markMarkdownOutsidePointer(): void {
  if (!activeEditingNode) return;
  blurFromOutsidePointer = true;
}
