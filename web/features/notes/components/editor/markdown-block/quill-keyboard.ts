import type { Quill } from "react-quill-new";

const keyboardBindingsBackup = new WeakMap<Quill, unknown>();

/** Pause Quill keyboard bindings while typing inside a markdown textarea. */
export function pauseQuillKeyboard(quill: Quill): void {
  const keyboard = (quill as Quill & { keyboard?: { bindings: unknown } })
    .keyboard;
  if (!keyboard || keyboardBindingsBackup.has(quill)) return;

  keyboardBindingsBackup.set(quill, keyboard.bindings);
  (keyboard as { bindings: unknown }).bindings = {};
}

export function resumeQuillKeyboard(quill: Quill): void {
  const keyboard = (quill as Quill & { keyboard?: { bindings: unknown } })
    .keyboard;
  const backup = keyboardBindingsBackup.get(quill);
  if (!keyboard || backup === undefined) return;

  (keyboard as { bindings: unknown }).bindings = backup;
  keyboardBindingsBackup.delete(quill);
}
