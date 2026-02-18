import React, { useState } from "react";
import { SUMMARY_FIELDS } from "@/lib/constants";
import { Analysis, Sentiment } from "@/types/types";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { sentimentClass } from "./SentimentPicker";

export function AnalysisSummary({ analysis }: { analysis: Analysis | null }) {
  const [openPopover, setOpenPopover] = useState<string | null>(null);

  if (!analysis) return null;

  const hasAny = SUMMARY_FIELDS.some(
    (f) => !!(analysis[f.key] as string)?.trim(),
  );
  if (!hasAny) return null;

  // Helper to handle enter/leave for both trigger and content
  const handleEnter = (label: string) => setOpenPopover(label);
  const handleLeave = () => setOpenPopover(null);

  return (
    <div className="grid grid-cols-4 flex-1 gap-4 min-w-0">
      {SUMMARY_FIELDS.map(({ label, key, sentimentKey }) => {
        const text = (analysis[key] as string | null | undefined)?.trim();
        const sentiment = analysis[sentimentKey] as
          | Sentiment
          | null
          | undefined;

        if (!text) {
          return (
            <div
              key={label}
              className="flex items-center gap-1.5 min-w-0 ml-3 opacity-30"
            >
              <span className="text-xs font-semibold uppercase tracking-widest">
                {label}
              </span>
              <span className="text-xs text-foreground/75">—</span>
            </div>
          );
        }

        return (
          <Popover
            key={label}
            open={openPopover === label}
            onOpenChange={(open) => !open && setOpenPopover(null)}
          >
            <PopoverTrigger asChild>
              <div
                className="flex items-center gap-1.5 min-w-0"
                onMouseEnter={() => handleEnter(label)}
                onMouseLeave={handleLeave}
              >
                <span
                  className={cn(
                    "text-xs font-semibold uppercase tracking-widest shrink-0 ml-3 transition-colors",
                    sentimentClass(sentiment),
                  )}
                >
                  {label}
                </span>
                <span className="text-xs text-foreground/75 truncate">
                  {text}
                </span>
              </div>
            </PopoverTrigger>

            <PopoverContent
              side="bottom"
              align="start"
              sideOffset={-25}
              alignOffset={0}
              onMouseEnter={() => handleEnter(label)}
              onMouseLeave={handleLeave}
              className="w-96 p-0 bg-muted border shadow-2xl overflow-hidden rounded-md z-50"
            >
              <div className="flex items-start gap-1.5 min-w-0 p-2">
                <span
                  className={cn(
                    "text-xs font-semibold uppercase tracking-widest shrink-0 ml-1 transition-colors",
                    sentimentClass(sentiment),
                  )}
                >
                  {label}
                </span>
                <span className="text-xs text-foreground/75">{text}</span>
              </div>
            </PopoverContent>
          </Popover>
        );
      })}
    </div>
  );
}
