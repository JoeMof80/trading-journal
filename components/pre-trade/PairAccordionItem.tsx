import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import { getFlagOption, SUMMARY_FIELDS, TIMEFRAMES } from "@/lib/constants";
import { Analysis, DraftAnalysis, FlagColor, SaveStatus } from "@/types/types";
import { AnalysisSummary } from "./AnalysisSummary";
import { RowFlagPicker } from "./RowFlagPicker";
import { TradeAnalysisRow } from "./TradeAnalysisRow";
import { Badge } from "../ui/badge";
import { ChevronDown, FileChartLine } from "lucide-react";
import { sentimentClass } from "./SentimentPicker";
import { cn } from "@/lib/utils";

type Pair = { id: string; name: string };

export function PairAccordionItem({
  pair,
  allAnalyses,
  draft,
  saveStatus,
  deleting,
  pairFlag,
  isOpen,
  today,
  cutoffHourUtc,
  currentHourKey,
  onFlagChange,
  onDraftChange,
  onViewReport,
  onClearDraft,
  onDeleteAnalysis,
  onUpdateHistoricalAnalysis,
  onViewHistoryReport,
}: {
  pair: Pair;
  allAnalyses: Analysis[];
  draft: DraftAnalysis;
  saveStatus: SaveStatus;
  deleting: Record<string, boolean>;
  pairFlag: FlagColor;
  isOpen: boolean;
  today: string;
  cutoffHourUtc: number;
  currentHourKey: string;
  onFlagChange: (c: FlagColor) => void;
  onDraftChange: (field: keyof DraftAnalysis, value: string) => void;
  onViewReport: () => void;
  onClearDraft: () => void;
  onDeleteAnalysis: (id: string) => void;
  onUpdateHistoricalAnalysis: (id: string, field: keyof DraftAnalysis, value: string) => void;
  onViewHistoryReport: (analysis: Analysis) => void;
}) {
  const currentHourAnalysis = allAnalyses.find(
    (a) => a.timestamp && a.timestamp.startsWith(currentHourKey),
  );
  const pairAnalyses = allAnalyses.filter(
    (a) => !a.timestamp || !a.timestamp.startsWith(currentHourKey),
  );
  const latestAnalysis = allAnalyses[0] ?? null;

  // The report to show when clicking the header preview button:
  // prefer today's draft if it has content, otherwise the latest saved analysis.
  const draftHasContent = Object.entries(draft).some(
    ([key, value]) => !key.includes("Sentiment") && value && value.trim(),
  );
  const headerReportAnalysis = draftHasContent ? null : latestAnalysis;
  const showHeaderReport = draftHasContent || !!latestAnalysis;

  return (
    <AccordionItem value={pair.id} className="overflow-hidden">
      <AccordionTrigger
        className="
          py-1 rounded-sm
          no-underline hover:no-underline
          hover:bg-muted/70
          data-[state=open]:bg-muted/80
          transition-colors
          [&>svg:last-child]:hidden
          [&>h3]:min-w-0
          [&>h3]:overflow-hidden
        "
      >
        <div className="flex w-full gap-4 items-center min-w-0">
          {/* Left fixed — flag + symbol + preview button */}
          <div className="flex items-center w-32 shrink-0 gap-1.5">
            <div onClick={(e) => e.stopPropagation()}>
              <RowFlagPicker flag={pairFlag} onChange={onFlagChange} />
            </div>
            <Badge
              variant="secondary"
              className="text-xs font-bold tracking-wider"
            >
              {pair.name}
            </Badge>
            {showHeaderReport && (
              <div
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  if (headerReportAnalysis) {
                    onViewHistoryReport(headerReportAnalysis);
                  } else {
                    onViewReport();
                  }
                }}
                onKeyDown={(e) => e.key === "Enter" && e.currentTarget.click()}
                title="Preview latest report"
                className="flex items-center justify-center h-6 w-6 rounded-sm text-muted-foreground/50 hover:text-foreground hover:bg-accent transition-colors cursor-pointer shrink-0"
              >
                <FileChartLine className="h-3.5 w-3.5" />
              </div>
            )}
          </div>

          {/* Timeframe columns — divider on each to align with content rows */}
          {isOpen
            ? SUMMARY_FIELDS.map(({ label, sentimentKey }, i) => {
                // When open and showing today's draft, read sentiment from draft for real-time updates.
                // Otherwise use latestAnalysis (historical rows or when draft is empty).
                const isShowingCurrentHour = currentHourAnalysis && isOpen;
                const sentiment =
                  (draft[sentimentKey as keyof typeof draft] as string) ||
                  (latestAnalysis?.[sentimentKey] as string | null);
                return (
                  <div
                    key={label}
                    className="flex flex-1 items-center min-w-0 ml-3"
                  >
                    <span
                      className={cn(
                        "text-xs font-semibold uppercase tracking-widest transition-colors",
                        sentimentClass(sentiment),
                      )}
                    >
                      {TIMEFRAMES[i]}
                    </span>
                  </div>
                );
              })
            : ((() => {
                const draftHasContent = Object.entries(draft).some(
                  ([key, value]) =>
                    !key.includes("Sentiment") && value && value.trim(),
                );
                if (draftHasContent) {
                  // Show current draft (merge into latestAnalysis if it exists for better display)
                  return (
                    <AnalysisSummary
                      analysis={
                        latestAnalysis
                          ? { ...latestAnalysis, ...draft }
                          : ({
                              pairId: pair.id,
                              timestamp: new Date().toISOString(),
                              ...draft,
                              id: "draft",
                              createdAt: "",
                              updatedAt: "",
                            } as Analysis)
                      }
                    />
                  );
                } else if (latestAnalysis) {
                  // No draft content, show most recent saved analysis directly (no merge needed)
                  return <AnalysisSummary analysis={latestAnalysis} />;
                } else {
                  return null;
                }
              })() ?? (
                <span className="text-xs text-muted-foreground/60 w-full ml-3">
                  No analysis yet
                </span>
              ))}

          {/* Right fixed — chevron */}
          <div className="w-8 shrink-0 flex justify-center">
            <ChevronDown
              className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          </div>
        </div>
      </AccordionTrigger>

      <AccordionContent>
        <TradeAnalysisRow
          timestamp={new Date().toISOString()}
          values={draft}
          onChange={onDraftChange}
          saveStatus={saveStatus}
          onViewReport={onViewReport}
          onDelete={onClearDraft}
          cutoffHourUtc={cutoffHourUtc}
        />
        {pairAnalyses.length === 0 ? (
          <>
            <Separator className="my-4" />
            <p className="text-xs text-muted-foreground ml-3">
              No previous analysis. Today&apos;s entry autosaves as you type.
            </p>
          </>
        ) : (
          pairAnalyses.map((analysis) => {
            const rowFlagOpt = getFlagOption("none");
            return (
              <div
                key={analysis.id}
                className={`rounded-sm ${rowFlagOpt.rowBg}`}
              >
                <TradeAnalysisRow
                  timestamp={analysis.timestamp}
                  values={{
                    weekly: analysis.weekly ?? "",
                    weeklyScreenshot: analysis.weeklyScreenshot ?? "",
                    weeklySentiment: (analysis.weeklySentiment ??
                      "none") as DraftAnalysis["weeklySentiment"],
                    daily: analysis.daily ?? "",
                    dailyScreenshot: analysis.dailyScreenshot ?? "",
                    dailySentiment: (analysis.dailySentiment ??
                      "none") as DraftAnalysis["dailySentiment"],
                    fourHr: analysis.fourHr ?? "",
                    fourHrScreenshot: analysis.fourHrScreenshot ?? "",
                    fourHrSentiment: (analysis.fourHrSentiment ??
                      "none") as DraftAnalysis["fourHrSentiment"],
                    oneHr: analysis.oneHr ?? "",
                    oneHrScreenshot: analysis.oneHrScreenshot ?? "",
                    oneHrSentiment: (analysis.oneHrSentiment ??
                      "none") as DraftAnalysis["oneHrSentiment"],
                  }}
                  onChange={(field, value) =>
                    onUpdateHistoricalAnalysis(analysis.id, field, value)
                  }
                  onViewReport={() => onViewHistoryReport(analysis)}
                  onDelete={() => onDeleteAnalysis(analysis.id)}
                  isDeleting={deleting[analysis.id] ?? false}
                />
              </div>
            );
          })
        )}
      </AccordionContent>
    </AccordionItem>
  );
}
