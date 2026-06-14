import { Quill } from "react-quill-new";

import { MARKDOWN_BLOCK_EMBED } from "@/features/notes/markdown";

type QuillDeltaInstance = {
  retain(length: number): QuillDeltaInstance;
  delete(length: number): QuillDeltaInstance;
  insert(value: unknown): QuillDeltaInstance;
};

const Delta = Quill.import("delta") as {
  new (): QuillDeltaInstance;
};

type MarkdownBlockBlotInstance = {
  value(): string;
};

type ScrollWithQuill = {
  quill?: Quill;
};

/** Resolve the Quill instance that owns a markdown-block DOM node. */
export function getQuillFromMarkdownNode(node: HTMLElement): Quill | null {
  const blot = Quill.find(node) as { scroll?: ScrollWithQuill } | null;
  if (blot?.scroll?.quill) return blot.scroll.quill;

  const editor = node.closest(".ql-editor") as
    | (HTMLElement & { __quill?: Quill })
    | null;
  return editor?.__quill ?? null;
}

export function isMarkdownEditorReadOnly(node: HTMLElement): boolean {
  const editor = node.closest(".ql-editor");
  return editor?.classList.contains("ql-disabled") ?? false;
}

/** Notify ReactQuill listeners after the embed value is committed on blur. */
export function notifyEditorContentChange(node: HTMLElement): void {
  const quill = getQuillFromMarkdownNode(node);
  if (!quill) return;

  const emitter = (
    quill as Quill & {
      emitter?: { emit: (name: string, ...args: unknown[]) => void };
    }
  ).emitter;
  if (!emitter) return;

  const contents = quill.getContents();
  emitter.emit("text-change", contents, contents, "user");
}

/** Sync delta + undo stack after the user leaves edit mode. */
export function commitMarkdownEmbedValue(
  node: HTMLElement,
  newValue: string,
): void {
  const quill = getQuillFromMarkdownNode(node);
  if (!quill) return;

  const blot = Quill.find(node) as MarkdownBlockBlotInstance | null;
  if (!blot) return;

  if (blot.value() === newValue) return;

  const index = quill.getIndex(
    blot as unknown as Parameters<Quill["getIndex"]>[0],
  );
  const change = new Delta()
    .retain(index)
    .delete(1)
    .insert({ [MARKDOWN_BLOCK_EMBED]: newValue });

  quill.updateContents(
    change as unknown as Parameters<Quill["updateContents"]>[0],
    "user",
  );
}
