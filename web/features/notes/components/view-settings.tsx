"use client";

import {
  ArrowDown,
  ArrowUp,
  Calendar,
  Check,
  FileText,
  Grid3x3,
  LayoutGrid,
  List,
  Settings2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import type { SortBy, SortOrder, ViewMode } from "@/features/preferences";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface ViewSettingsProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  sortBy: SortBy;
  onSortByChange: (sortBy: SortBy) => void;
  sortOrder: SortOrder;
  onSortOrderChange: (order: SortOrder) => void;
}

export function ViewSettings({
  viewMode,
  onViewModeChange,
  sortBy,
  onSortByChange,
  sortOrder,
  onSortOrderChange,
}: ViewSettingsProps) {
  const [open, setOpen] = useState(false);

  const SortIcon = sortOrder === "asc" ? ArrowUp : ArrowDown;

  const viewModes = useMemo(
    () =>
      [
        {
          value: "masonry" as const,
          label: t("notes.viewMasonry"),
          icon: LayoutGrid,
        },
        { value: "grid" as const, label: t("notes.viewGrid"), icon: Grid3x3 },
        { value: "list" as const, label: t("notes.viewList"), icon: List },
      ] as const,
    [],
  );

  const sortOptions = useMemo(
    () =>
      [
        {
          value: "updatedAt" as const,
          label: t("notes.sortUpdatedAt"),
          icon: Calendar,
        },
        {
          value: "createdAt" as const,
          label: t("notes.sortCreatedAt"),
          icon: Calendar,
        },
        {
          value: "title" as const,
          label: t("notes.sortTitle"),
          icon: FileText,
        },
      ] as const,
    [],
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 px-3 gap-2 border-border/60 hover:border-primary/50 hover:bg-primary/5 hover:text-primary transition-all shadow-none rounded-full"
        >
          <Settings2 className="h-4 w-4" />
          <span className="text-xs font-medium">{t("notes.view")}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2" align="end">
        <div className="space-y-1.5">
          <div className="space-y-0.5">
            <div className="px-2 py-1.5">
              <span className="text-[10px] font-medium text-muted-foreground/70 uppercase tracking-wider">
                {t("notes.sort")}
              </span>
            </div>
            <div className="space-y-0.5">
              {sortOptions.map((option) => {
                const Icon = option.icon;
                const isSelected = sortBy === option.value;
                return (
                  <div key={option.value} className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onSortByChange(option.value)}
                      className={cn(
                        "flex-1 flex items-center gap-2.5 px-2 py-1.5 rounded-sm text-sm transition-colors",
                        "hover:bg-primary/5",
                        isSelected
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-muted-foreground",
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-3.5 w-3.5 transition-colors",
                          isSelected
                            ? "text-primary"
                            : "text-muted-foreground/60",
                        )}
                      />
                      <span className="flex-1 text-left">{option.label}</span>
                      {isSelected && <Check className="h-3 w-3 text-primary" />}
                    </button>
                    {isSelected && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSortOrderChange(
                            sortOrder === "asc" ? "desc" : "asc",
                          );
                        }}
                        className={cn(
                          "flex items-center justify-center px-2 py-1.5 rounded-sm text-xs font-medium transition-colors",
                          "bg-primary/10 text-primary",
                          "hover:bg-primary/15",
                          "border border-primary/20",
                        )}
                        title={
                          sortOrder === "asc"
                            ? t("notes.sortDesc")
                            : t("notes.sortAsc")
                        }
                      >
                        <SortIcon className="h-4 w-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <Separator className="my-1.5" />

          <div className="space-y-0.5">
            <div className="px-2 py-1.5">
              <span className="text-[10px] font-medium text-muted-foreground/70 uppercase tracking-wider">
                {t("notes.view")}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1">
              {viewModes.map((mode) => {
                const Icon = mode.icon;
                const isSelected = viewMode === mode.value;
                return (
                  <button
                    type="button"
                    key={mode.value}
                    onClick={() => {
                      onViewModeChange(mode.value);
                      setOpen(false);
                    }}
                    className={cn(
                      "flex flex-col items-center justify-center gap-1.5 px-2 py-2 rounded-sm text-xs transition-colors",
                      "hover:bg-primary/5",
                      isSelected
                        ? "bg-primary/10 text-primary font-medium border border-primary/20"
                        : "text-muted-foreground",
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-3.5 w-3.5 transition-colors",
                        isSelected
                          ? "text-primary"
                          : "text-muted-foreground/60",
                      )}
                    />
                    <span>{mode.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
