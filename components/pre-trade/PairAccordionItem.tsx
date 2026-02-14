import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import { getFlagOption, TIMEFRAMES } from "@/constants";
import { Analysis, DraftAnalysis, FlagColor, SaveStatus } from "@/types/types";
import { AnalysisSummary } from "./AnalysisSummary";
import { RowFlagPicker } from "./RowFlagPicker";
import { TradeAnalysisRow } from "./TradeAnalysisRow";
import { Badge } from "../ui/badge";
import { ChevronDown } from "lucide-react";

type Pair = { id: string; name: string };

export function PairAccordionItem({
  pair,
  allAnalyses,
  draft,
  saveStatus,
  deleting,
  pairFlag,
  isOpen,
  onFlagChange,
  onDraftChange,
  onViewReport,
  onClearDraft,
  onDeleteAnalysis,
  onViewHistoryReport,
}: {
  pair: Pair;
  allAnalyses: Analysis[];
  draft: DraftAnalysis;
  saveStatus: SaveStatus;
  deleting: Record<string, boolean>;
  pairFlag: FlagColor;
  isOpen: boolean;
  onFlagChange: (c: FlagColor) => void;
  onDraftChange: (field: keyof DraftAnalysis, value: string) => void;
  onViewReport: () => void;
  onClearDraft: () => void;
  onDeleteAnalysis: (id: string) => void;
  onViewHistoryReport: (analysis: Analysis) => void;
}) {
  const today = new Date().toISOString().split("T")[0];
  const pairAnalyses = allAnalyses.filter((a) => a.date !== today);
  const latestAnalysis = allAnalyses[allAnalyses.length - 1] ?? null;

  return (
    <AccordionItem value={pair.id}>
      <AccordionTrigger
        className="
          py-1 rounded-sm
          no-underline hover:no-underline
          hover:bg-muted/70
          data-[state=open]:bg-muted/80
          transition-colors
          [&>svg:last-child]:hidden
        "
      >
        <div className="flex w-full gap-4 items-center">
          <div className="flex items-center w-32 gap-2 shrink-0">
            <div onClick={(e) => e.stopPropagation()}>
              <RowFlagPicker flag={pairFlag} onChange={onFlagChange} />
            </div>
            <Badge
              variant="secondary"
              className="text-xs font-bold tracking-wider"
            >
              {pair.name}
            </Badge>
          </div>
          {isOpen ? (
            TIMEFRAMES.map((tf) => (
              <div key={tf} className="flex flex-1 items-center min-w-0 ml-3">
                <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/90">
                  {tf}
                </span>
              </div>
            ))
          ) : latestAnalysis ? (
            <AnalysisSummary analysis={latestAnalysis} />
          ) : (
            <span className="text-xs text-muted-foreground/60 w-full ml-3">
              No analysis yet
            </span>
          )}
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
          date={today}
          values={draft}
          onChange={onDraftChange}
          saveStatus={saveStatus}
          onViewReport={onViewReport}
          onDelete={onClearDraft}
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
                  date={analysis.date}
                  readOnly
                  values={{
                    weekly: analysis.weekly ?? "",
                    weeklyScreenshot: analysis.weeklyScreenshot ?? "",
                    daily: analysis.daily ?? "",
                    dailyScreenshot: analysis.dailyScreenshot ?? "",
                    fourHr: analysis.fourHr ?? "",
                    fourHrScreenshot: analysis.fourHrScreenshot ?? "",
                    oneHr: analysis.oneHr ?? "",
                    oneHrScreenshot: analysis.oneHrScreenshot ?? "",
                  }}
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
