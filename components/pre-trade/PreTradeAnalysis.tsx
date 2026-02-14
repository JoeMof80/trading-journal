"use client";

import { useState } from "react";
import { Accordion } from "@/components/ui/accordion";
import { FOREX_PAIRS } from "@/constants";
import { usePreTradeAnalysis } from "../../hooks/usePreTradeAnalysis";
import { PairAccordionItem } from "./PairAccordionItem";
import { AnalysisReportDialog } from "./AnalysisReportDialog";

export default function PreTradeAnalysis() {
  const [openPair, setOpenPair] = useState<string>("");

  const {
    analyses,
    getDraft,
    saveStatus,
    deleting,
    pairFlags,
    setPairFlags,
    reportState,
    closeReport,
    setDraftField,
    clearDraft,
    deleteAnalysis,
    openReport,
  } = usePreTradeAnalysis();

  return (
    <div className="p-4">
      <Accordion
        type="single"
        collapsible
        value={openPair}
        onValueChange={setOpenPair}
        className="w-full"
      >
        {FOREX_PAIRS.map((pair) => {
          const today = new Date().toISOString().split("T")[0];
          const allAnalyses = analyses[pair.id] ?? [];
          const todaysSaved = allAnalyses.find((a) => a.date === today);
          const rawDraft = getDraft(pair.id);
          const draftIsEmpty = Object.values(rawDraft).every((v) => !v);
          const draft =
            draftIsEmpty && todaysSaved
              ? {
                  weekly: todaysSaved.weekly ?? "",
                  weeklyScreenshot: todaysSaved.weeklyScreenshot ?? "",
                  daily: todaysSaved.daily ?? "",
                  dailyScreenshot: todaysSaved.dailyScreenshot ?? "",
                  fourHr: todaysSaved.fourHr ?? "",
                  fourHrScreenshot: todaysSaved.fourHrScreenshot ?? "",
                  oneHr: todaysSaved.oneHr ?? "",
                  oneHrScreenshot: todaysSaved.oneHrScreenshot ?? "",
                }
              : rawDraft;

          return (
            <PairAccordionItem
              key={pair.id}
              pair={pair}
              allAnalyses={allAnalyses}
              draft={draft}
              saveStatus={saveStatus[pair.id] ?? "idle"}
              deleting={deleting}
              pairFlag={pairFlags[pair.id] ?? "none"}
              isOpen={openPair === pair.id}
              onFlagChange={(c) =>
                setPairFlags((prev) => ({ ...prev, [pair.id]: c }))
              }
              onDraftChange={(field, value) =>
                setDraftField(pair.id, field, value)
              }
              onViewReport={() => openReport(pair.name, draft, today)}
              onClearDraft={() => clearDraft(pair.id)}
              onDeleteAnalysis={deleteAnalysis}
              onViewHistoryReport={(analysis) =>
                openReport(pair.name, analysis, analysis.date)
              }
            />
          );
        })}
      </Accordion>

      <AnalysisReportDialog
        open={reportState.open}
        onOpenChange={(open) => !open && closeReport()}
        pairName={reportState.pairName}
        analysis={reportState.analysis}
      />
    </div>
  );
}
