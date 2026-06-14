"use client";

import { formatNoteDate, noteWord, personWord, t } from "@/lib/i18n";

export function useTranslations() {
  return { t, noteWord, personWord, formatNoteDate };
}
