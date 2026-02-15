"use client";

import { useTradingDaySettings } from "@/hooks/useTradingDaySettings";
import { DEFAULT_CUTOFF_HOUR_UTC } from "@/lib/tradingDay";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => ({
  value: i,
  label: `${String(i).padStart(2, "0")}:00 UTC`,
}));

// Rough session context shown next to each hour to aid selection
const SESSION_HINTS: Partial<Record<number, string>> = {
  21: "after NY close",
  22: "after spread hour (default)",
  23: "before Tokyo open",
  0: "Tokyo open",
  7: "Frankfurt open",
  8: "London open",
};

export default function TradingDaySettings() {
  const { cutoffHourUtc, setCutoffHourUtc } = useTradingDaySettings();

  return (
    <div className="flex flex-col gap-4 max-w-sm">
      <div>
        <h3 className="text-sm font-semibold mb-1">Trading day cutoff</h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          The hour (UTC) at which a new trading day begins. Entries created
          after this time are grouped under the next calendar date. Set this
          after your session ends — typically after the NY close and spread
          hour.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Label htmlFor="cutoff-select" className="text-sm shrink-0">
          New day starts at
        </Label>
        <Select
          value={String(cutoffHourUtc)}
          onValueChange={(v) => setCutoffHourUtc(parseInt(v, 10))}
        >
          <SelectTrigger id="cutoff-select" className="w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {HOUR_OPTIONS.map(({ value, label }) => (
              <SelectItem key={value} value={String(value)}>
                <span>{label}</span>
                {SESSION_HINTS[value] && (
                  <span className="ml-2 text-xs text-muted-foreground">
                    — {SESSION_HINTS[value]}
                  </span>
                )}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {cutoffHourUtc !== DEFAULT_CUTOFF_HOUR_UTC && (
        <Button
          variant="ghost"
          size="sm"
          className="self-start h-7 text-xs text-muted-foreground"
          onClick={() => setCutoffHourUtc(DEFAULT_CUTOFF_HOUR_UTC)}
        >
          Reset to default (22:00 UTC)
        </Button>
      )}
    </div>
  );
}
