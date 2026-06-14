import { format } from "date-fns";
import { ru as dateFnsRu } from "date-fns/locale";
import { ruMessages } from "./messages/ru";

export { ruMessages };

type MessageParams = Record<string, string | number>;

function getNestedValue(obj: unknown, keys: string[]): unknown {
  let value: unknown = obj;
  for (const key of keys) {
    if (value && typeof value === "object" && key in value) {
      value = (value as Record<string, unknown>)[key];
    } else {
      return undefined;
    }
  }
  return value;
}

export function t(key: string, params?: MessageParams): string {
  const value = getNestedValue(ruMessages, key.split("."));
  if (typeof value !== "string") {
    return key;
  }
  if (!params) {
    return value;
  }
  return Object.entries(params).reduce(
    (acc, [paramKey, paramValue]) =>
      acc.replaceAll(`{${paramKey}}`, String(paramValue)),
    value,
  );
}

/** Russian plural forms: [one, few, many] — e.g. заметка / заметки / заметок */
export function pluralRu(
  count: number,
  forms: [string, string, string],
): string {
  const abs = Math.abs(count);
  const mod10 = abs % 10;
  const mod100 = abs % 100;
  if (mod100 >= 11 && mod100 <= 19) {
    return forms[2];
  }
  if (mod10 === 1) {
    return forms[0];
  }
  if (mod10 >= 2 && mod10 <= 4) {
    return forms[1];
  }
  return forms[2];
}

export const NOTE_WORD_FORMS: [string, string, string] = [
  "заметка",
  "заметки",
  "заметок",
];

export const PERSON_WORD_FORMS: [string, string, string] = [
  "человек",
  "человека",
  "человек",
];

export function noteWord(count: number): string {
  return pluralRu(count, NOTE_WORD_FORMS);
}

export function personWord(count: number): string {
  return pluralRu(count, PERSON_WORD_FORMS);
}

export function formatNoteDate(date: Date | string | number): string {
  return format(new Date(date), "d MMM yyyy", { locale: dateFnsRu });
}

export const appMetadata = {
  title: ruMessages.app.name,
  description: ruMessages.app.description,
};
