import { TIMEFRAMES } from "@/constants";
import { TimeframeCard } from "./TimeframeCard";
import { DraftAnalysis } from "@/types/types";

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

// Rendered once above all data rows — spacer matches the date column width
export function TradeAnalysisHeader() {
  return (
    <div className="flex w-full gap-4 items-start mb-1">
      {/* Spacer matching the date column */}
      <div className="ml-3 w-20 shrink-0" />

      {TIMEFRAMES.map((tf) => (
        <div key={tf} className="flex flex-1 min-w-0 mt-3">
          <label className="ml-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {tf}
          </label>
        </div>
      ))}
    </div>
  );
}

export function TradeAnalysisRow({
  date,
  dateColumnActions,
  values,
  onChange,
  readOnly = false,
}: {
  date: string;
  /** Controls stacked under the date — flag picker, report button, clear/delete */
  dateColumnActions?: React.ReactNode;
  values: DraftAnalysis;
  onChange?: (field: keyof DraftAnalysis, value: string) => void;
  readOnly?: boolean;
}) {
  return (
    <div className="flex w-full gap-4 items-start border-t py-4">
      {/* Date column — fixed width, date on top, icon buttons stacked below */}
      <div className="ml-3 w-20 shrink-0 flex flex-col gap-1 pt-3">
        <p className="text-xs font-medium text-muted-foreground tabular-nums">
          {date}
        </p>
        {dateColumnActions && (
          <div className="flex gap-0.5 items-start -ml-1.5">
            {dateColumnActions}
          </div>
        )}
      </div>

      {/* Timeframe cards */}
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
    </div>
  );
}
