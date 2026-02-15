import { FlagColor } from "@/types/types";
import { FLAG_OPTIONS } from "@/constants";
import { FlagIcon } from "./FlagIcon";
import { SortKey } from "../../hooks/useFilterSort";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ArrowUpDown } from "lucide-react";
import { Separator } from "../ui/separator";

const FLAG_FILTER_OPTIONS = FLAG_OPTIONS; // includes "none"

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "category", label: "Category" },
  { key: "symbol", label: "Symbol" },
  { key: "date", label: "Latest date" },
  { key: "flag", label: "Flag" },
];

export function FilterSortBar({
  flagFilters,
  sortKey,
  totalVisible,
  totalAll,
  onToggleFlag,
  onClearFilters,
  onSortChange,
}: {
  flagFilters: FlagColor[];
  sortKey: SortKey;
  totalVisible: number;
  totalAll: number;
  onToggleFlag: (c: FlagColor) => void;
  onClearFilters: () => void;
  onSortChange: (k: SortKey) => void;
}) {
  const currentSort = SORT_OPTIONS.find((o) => o.key === sortKey)!;
  const hasActiveFilters = flagFilters.length > 0;

  return (
    <div className="sticky top-12 z-40 flex items-center gap-2 py-2 mb-3 px-4 -mx-4 bg-background/90 backdrop-blur-sm border-b">
      <div className="flex items-center gap-1.5">
        {FLAG_FILTER_OPTIONS.map((opt) => {
          const active = flagFilters.includes(opt.value);
          return (
            <button
              key={opt.value}
              onClick={() => onToggleFlag(opt.value)}
              title={opt.label}
              className={cn(
                "flex items-center justify-center h-6 w-6 rounded-sm border transition-colors",
                active
                  ? "border-foreground/40 bg-muted"
                  : "border-transparent hover:border-border hover:bg-muted/50",
              )}
            >
              <FlagIcon
                className={opt.iconClass}
                filled={opt.value !== "none"}
                size={16}
              />
            </button>
          );
        })}
      </div>
      {hasActiveFilters && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span>
            {totalVisible} / {totalAll}
          </span>
          <button
            onClick={onClearFilters}
            className="flex items-center gap-0.5 hover:text-foreground transition-colors"
            title="Clear filters"
          >
            <X className="h-3 w-3" />
            Clear
          </button>
        </div>
      )}
      <Separator orientation="vertical" className="h-4" />
      <div className="flex items-center gap-1.5">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-foreground px-2"
            >
              <ArrowUpDown className="h-3 w-3" />
              {currentSort.label}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {SORT_OPTIONS.map((opt) => (
              <DropdownMenuItem
                key={opt.key}
                onSelect={() => onSortChange(opt.key)}
                className={cn(
                  "text-xs cursor-pointer",
                  sortKey === opt.key && "font-medium text-foreground",
                )}
              >
                {opt.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
