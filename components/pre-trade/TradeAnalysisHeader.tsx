import { TIMEFRAMES } from "@/lib/constants";

export function TradeAnalysisHeader() {
  return (
    <div className="flex w-full gap-4 items-start">
      <div className="w-32 shrink-0" />
      {TIMEFRAMES.map((tf) => (
        <div key={tf} className="flex flex-1 min-w-0 m-3 mb-1">
          <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/90">
            {tf}
          </label>
        </div>
      ))}
      <div className="w-8 shrink-0" />
    </div>
  );
}
