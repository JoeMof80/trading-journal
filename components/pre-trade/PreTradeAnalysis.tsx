"use client";

import { useMemo, useState } from "react";
import { Accordion } from "@/components/ui/accordion";
import { usePreTradeAnalysis } from "../../hooks/usePreTradeAnalysis";
import { useFilterSort } from "../../hooks/useFilterSort";
import { PairAccordionItem } from "./PairAccordionItem";
import { AnalysisReportDialog } from "./AnalysisReportDialog";
import { FilterSortBar } from "./FilterSortBar";
import { useTradingDaySettings } from "../../hooks/useTradingDaySettings";
import { getTradingDate } from "@/lib/tradingDay";
import { FOREX_PAIRS } from "@/lib/constants";

export default function PreTradeAnalysis() {
  const [openPair, setOpenPair] = useState<string>("");

  const {
    analyses,
    getDraft,
    saveStatus,
    deleting,
    pairFlags,
    setPairFlag,
    reportState,
    closeReport,
    setDraftField,
    clearDraft,
    deleteAnalysis,
    updateHistoricalAnalysis,
    openReport,
    currentHourKey,
  } = usePreTradeAnalysis();

  // Build pairId → latest analysis timestamp for "sort by date"
  const latestDates = useMemo(() => {
    const map: Record<string, string> = {};
    for (const pair of FOREX_PAIRS) {
      const list = analyses[pair.id];
      if (list?.length) map[pair.id] = list[0].timestamp;
    }
    return map;
  }, [analyses]);

  const { cutoffHourUtc } = useTradingDaySettings();
  const today = getTradingDate(cutoffHourUtc);

  const {
    flagFilters,
    sortKey,
    setSortKey,
    toggleFlagFilter,
    clearFilters,
    grouped,
    totalVisible,
  } = useFilterSort(pairFlags, latestDates, cutoffHourUtc);

  return (
    <div className="p-4 pt-0">
      <FilterSortBar
        flagFilters={flagFilters}
        sortKey={sortKey}
        totalVisible={totalVisible}
        totalAll={FOREX_PAIRS.length}
        onToggleFlag={toggleFlagFilter}
        onClearFilters={clearFilters}
        onSortChange={setSortKey}
      />

      {grouped.map((group, gi) => (
        <div key={gi}>
          {group.heading && (
            <div className="flex items-center gap-3 mt-4 mb-1 px-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                {group.heading}
              </span>
              <div className="flex-1 border-t border-border/40" />
              <span className="text-[10px] text-muted-foreground/40">
                {group.pairs.length}
              </span>
            </div>
          )}

          <Accordion
            type="single"
            collapsible
            value={openPair}
            onValueChange={setOpenPair}
            className="w-full"
          >
            {group.pairs.map((pair) => {
              const allAnalyses = analyses[pair.id] ?? [];
              const draft = getDraft(pair.id);

              return (
                <PairAccordionItem
                  key={pair.id}
                  pair={pair}
                  allAnalyses={allAnalyses}
                  draft={draft}
                  saveStatus={saveStatus(pair.id)}
                  deleting={deleting}
                  pairFlag={pairFlags[pair.id] ?? "none"}
                  isOpen={openPair === pair.id}
                  today={today}
                  cutoffHourUtc={cutoffHourUtc}
                  currentHourKey={currentHourKey}
                  onFlagChange={(c) => setPairFlag(pair.id, c)}
                  onDraftChange={(field, value) =>
                    setDraftField(pair.id, field, value)
                  }
                  onViewReport={() =>
                    openReport(pair.name, draft, new Date().toISOString())
                  }
                  onClearDraft={() => clearDraft(pair.id)}
                  onDeleteAnalysis={deleteAnalysis}
                  onUpdateHistoricalAnalysis={updateHistoricalAnalysis}
                  onViewHistoryReport={(analysis) =>
                    openReport(pair.name, analysis, analysis.timestamp)
                  }
                />
              );
            })}
          </Accordion>
        </div>
      ))}

      {totalVisible === 0 && (
        <p className="text-xs text-muted-foreground text-center py-8">
          No pairs match the current filter.
        </p>
      )}

      <AnalysisReportDialog
        open={reportState.open}
        onOpenChange={(open) => !open && closeReport()}
        pairName={reportState.pairName}
        analysis={reportState.analysis}
      />
    </div>
  );
}
