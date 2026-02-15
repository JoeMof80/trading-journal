import { TIMEFRAMES } from "@/lib/constants";
import { getTradingDate } from "@/lib/tradingDay";
import { TimeframeCard } from "./TimeframeCard";
import { DraftAnalysis } from "@/types/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Ellipsis, FileText, Loader2, Trash2 } from "lucide-react";

import { useTradingDaySettings } from "../../hooks/useTradingDaySettings";

// Shows the trading date with a contextual hint when the calendar date and
// trading date differ (i.e. between cutoff hour and midnight).
// e.g.  "2025-02-16"          — normal, no hint needed
//       "2025-02-16 · since 22:00 UTC"  — between 10pm and midnight
function DateLabel({ date, isDraft }: { date: string; isDraft: boolean }) {
  const { cutoffHourUtc } = useTradingDaySettings();

  // Only the draft row ever needs the hint — historical rows have a fixed date.
  const showHint =
    isDraft &&
    (() => {
      const now = new Date();
      const utcHour = now.getUTCHours();
      const calendarDate = now.toISOString().split("T")[0];
      const tradingDate = getTradingDate(cutoffHourUtc);
      // Hint is relevant when we're past the cutoff but before midnight —
      // i.e. the trading date is already tomorrow's calendar date.
      return utcHour >= cutoffHourUtc && tradingDate !== calendarDate;
    })();

  return (
    <div className="ml-10 flex flex-col gap-0.5">
      <p className="text-xs font-medium text-foreground/70 tabular-nums">
        {date}
      </p>
      {showHint && (
        <p className="text-[10px] text-muted-foreground/50 tabular-nums">
          since {String(cutoffHourUtc).padStart(2, "0")}:00 UTC
        </p>
      )}
    </div>
  );
}

const TF_FIELDS: Array<{
  note: "weekly" | "daily" | "fourHr" | "oneHr";
  screenshot:
    | "weeklyScreenshot"
    | "dailyScreenshot"
    | "fourHrScreenshot"
    | "oneHrScreenshot";
}> = [
  { note: "weekly", screenshot: "weeklyScreenshot" },
  { note: "daily", screenshot: "dailyScreenshot" },
  { note: "fourHr", screenshot: "fourHrScreenshot" },
  { note: "oneHr", screenshot: "oneHrScreenshot" },
];

export function TradeAnalysisRow({
  date,
  values,
  onChange,
  readOnly = false,
  onViewReport,
  onDelete,
  isDeleting = false,
  saveStatus,
}: {
  date: string;
  values: DraftAnalysis;
  onChange?: (field: keyof DraftAnalysis, value: string) => void;
  readOnly?: boolean;
  onViewReport?: () => void;
  onDelete?: () => void;
  isDeleting?: boolean;
  saveStatus?: "idle" | "pending" | "saving" | "saved";
}) {
  return (
    <div className="flex w-full gap-4 items-start border-t border-border/60 py-4">
      <div className="w-32 shrink-0 flex flex-col gap-1 pt-3">
        <DateLabel date={date} isDraft={!readOnly} />
        {saveStatus && saveStatus !== "idle" && (
          <span className="text-[10px] text-muted-foreground/80 flex items-center gap-0.5">
            {saveStatus === "saving" && (
              <Loader2 className="h-2.5 w-2.5 animate-spin" />
            )}
            {saveStatus === "saving" && "Saving\u2026"}
            {saveStatus === "saved" && (
              <span className="text-green-500">Saved</span>
            )}
            {saveStatus === "pending" && "\u2026"}
          </span>
        )}
      </div>

      {TIMEFRAMES.map((tf, i) => {
        const { note, screenshot } = TF_FIELDS[i];
        return (
          <TimeframeCard
            key={tf}
            label={tf}
            noteField={note}
            screenshotField={screenshot}
            values={values}
            onChange={onChange}
            readOnly={readOnly}
          />
        );
      })}

      <div className="w-8 shrink-0 flex items-start">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground/60 hover:text-foreground"
            >
              <Ellipsis className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={4}>
            {onViewReport && (
              <DropdownMenuItem
                onSelect={onViewReport}
                className="flex items-center gap-2 cursor-pointer"
              >
                <FileText className="h-3.5 w-3.5" />
                {readOnly ? "View report" : "Preview report"}
              </DropdownMenuItem>
            )}
            {onViewReport && onDelete && <DropdownMenuSeparator />}
            {onDelete && (
              <DropdownMenuItem
                onSelect={onDelete}
                disabled={isDeleting}
                className="flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive"
              >
                {isDeleting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
                {readOnly ? "Delete" : "Clear draft"}
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
