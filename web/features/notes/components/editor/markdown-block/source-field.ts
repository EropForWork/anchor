import { MARKDOWN_SOURCE_CLASS, MARKDOWN_SOURCE_SELECTOR } from "./constants";

function stopEventPropagation(event: Event): void {
  event.stopPropagation();
}

function insertTextAtCursor(source: HTMLTextAreaElement, text: string): void {
  const start = source.selectionStart ?? source.value.length;
  const end = source.selectionEnd ?? start;
  source.value = `${source.value.slice(0, start)}${text}${source.value.slice(end)}`;
  const cursor = start + text.length;
  source.setSelectionRange(cursor, cursor);
}

function handleSourcePaste(event: ClipboardEvent): void {
  event.preventDefault();
  event.stopPropagation();

  const source = event.target;
  if (!(source instanceof HTMLTextAreaElement)) return;

  const text = event.clipboardData?.getData("text/plain") ?? "";
  if (!text) return;

  insertTextAtCursor(source, text);
}

/** Prevent Quill from handling clipboard and input events inside the source field. */
export function bindMarkdownSourceField(source: HTMLTextAreaElement): void {
  const isolateFromQuill = stopEventPropagation;

  source.addEventListener("paste", handleSourcePaste, true);
  source.addEventListener("copy", isolateFromQuill, true);
  source.addEventListener("cut", isolateFromQuill, true);
  source.addEventListener("beforeinput", isolateFromQuill);
  source.addEventListener("input", isolateFromQuill);
  source.addEventListener("compositionstart", isolateFromQuill);
  source.addEventListener("compositionupdate", isolateFromQuill);
  source.addEventListener("compositionend", isolateFromQuill);
  source.addEventListener("keydown", (event) => event.stopPropagation());
}

export function isMarkdownSourceElement(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    Boolean(target.closest(MARKDOWN_SOURCE_SELECTOR))
  );
}

export { MARKDOWN_SOURCE_CLASS, MARKDOWN_SOURCE_SELECTOR };
