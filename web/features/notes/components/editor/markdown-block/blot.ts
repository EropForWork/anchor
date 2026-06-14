import { Quill } from "react-quill-new";

import type { QuillInstance } from "@/features/notes";
import { MARKDOWN_BLOCK_EMBED } from "@/features/notes/markdown";

import { MARKDOWN_BLOCK_CLASS, MARKDOWN_SOURCE_CLASS } from "./constants";
import { createMarkdownBlockElements, focusMarkdownBlockForEdit } from "./dom";
import { installMarkdownEditorGuards } from "./editor-guards";

const BlockEmbed = Quill.import("blots/block/embed") as {
  new (): { domNode: HTMLElement };
  create(value?: string): HTMLElement;
};

class MarkdownBlockBlot extends BlockEmbed {
  static blotName = MARKDOWN_BLOCK_EMBED;
  static tagName = "div";
  static className = MARKDOWN_BLOCK_CLASS;

  static create(value?: string) {
    const markdown = typeof value === "string" ? value : "";
    const { node } = createMarkdownBlockElements(markdown);
    return node;
  }

  static value(domNode: HTMLElement): string {
    const source = domNode.querySelector(
      `.${MARKDOWN_SOURCE_CLASS}`,
    ) as HTMLTextAreaElement | null;
    return source?.value ?? "";
  }
}

let registered = false;

export function registerMarkdownBlockBlot(): void {
  if (registered || typeof window === "undefined") return;

  installMarkdownEditorGuards();
  Quill.register(`formats/${MARKDOWN_BLOCK_EMBED}`, MarkdownBlockBlot, true);
  registered = true;
}

export function insertMarkdownBlock(quill: QuillInstance): void {
  const sel = quill.getSelection(true);
  const index = sel?.index ?? Math.max(0, quill.getLength() - 1);
  quill.insertEmbed(index, MARKDOWN_BLOCK_EMBED, "", "user");
  quill.setSelection(index + 1, 0, "user");

  window.setTimeout(() => {
    const blocks = quill.root.querySelectorAll(`.${MARKDOWN_BLOCK_CLASS}`);
    const last = blocks[blocks.length - 1] as HTMLElement | undefined;
    if (last) focusMarkdownBlockForEdit(last);
  }, 0);
}
