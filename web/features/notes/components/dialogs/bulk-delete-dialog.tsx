"use client";

import { AlertTriangle } from "lucide-react";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { noteWord, t } from "@/lib/i18n";

interface BulkDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  count: number;
  isPending?: boolean;
}

export function BulkDeleteDialog({
  open,
  onOpenChange,
  onConfirm,
  count,
  isPending = false,
}: BulkDeleteDialogProps) {
  return (
    <ConfirmationDialog
      open={open}
      onOpenChange={onOpenChange}
      onConfirm={onConfirm}
      title={
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="h-5 w-5 text-destructive" />
          </div>
          {t("notes.deleteNotesTitle")}
        </div>
      }
      description={t("notes.deleteNotesDescription", {
        count,
        word: noteWord(count),
      })}
      confirmLabel={t("common.delete")}
      variant="destructive"
      isPending={isPending}
    />
  );
}
