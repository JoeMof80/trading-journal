import { TIMEFRAMES } from "@/constants";
import { TimeframeCard } from "./TimeframeCard";
import { DraftAnalysis } from "@/types/types";

export function TradeAnalysisRow({
  date,
  values,
  onChange,
  readOnly = false,
  rowActions,
}: {
  date: string;
  values: DraftAnalysis;
  onChange?: (field: keyof DraftAnalysis, value: string) => void;
  readOnly?: boolean;
  rowActions?: React.ReactNode;
}) {
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

  return (
    <div className="flex w-full gap-4 items-start">
      {/* Date — left */}
      <p className="ml-3 text-xs font-medium text-muted-foreground tabular-nums pt-1 min-w-fit">
        {date}
      </p>

      {/* Timeframe cards — matched by index so label casing doesn't matter */}
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

      {/* Action buttons — right */}
      <div className="flex flex-col justify-end gap-1 self-stretch min-w-fit">
        {rowActions}
      </div>
    </div>
  );
}
