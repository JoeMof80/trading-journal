import { useCallback, useEffect, useRef, useState } from "react";
import { generateClient } from "aws-amplify/data";
import { Amplify } from "aws-amplify";
import type { Schema } from "@/amplify/data/resource";
import outputs from "@/amplify_outputs.json";
import { Analysis, DraftAnalysis, FlagColor, SaveStatus } from "@/types/types";

if (outputs && Object.keys(outputs).length > 0) {
  Amplify.configure(outputs);
}

const client = generateClient<Schema>();

const EMPTY_DRAFT: DraftAnalysis = {
  weekly: "",
  weeklyScreenshot: "",
  daily: "",
  dailyScreenshot: "",
  fourHr: "",
  fourHrScreenshot: "",
  oneHr: "",
  oneHrScreenshot: "",
};

const AUTOSAVE_DELAY_MS = 1500;

export type ReportState = {
  open: boolean;
  pairName: string;
  analysis: (Analysis & DraftAnalysis) | null;
};

export function usePreTradeAnalysis() {
  const [analyses, setAnalyses] = useState<Record<string, Analysis[]>>({});
  const [drafts, setDrafts] = useState<Record<string, DraftAnalysis>>({});
  const [saveStatus, setSaveStatus] = useState<Record<string, SaveStatus>>({});
  const [deleting, setDeleting] = useState<Record<string, boolean>>({});
  const [pairFlags, setPairFlags] = useState<Record<string, FlagColor>>({});
  const [reportState, setReportState] = useState<ReportState>({
    open: false,
    pairName: "",
    analysis: null,
  });

  const autosaveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // Keep a ref to analyses so persistAnalysis always reads the latest value,
  // avoiding the stale-closure bug where useCallback captures an old snapshot.
  const analysesRef = useRef(analyses);
  useEffect(() => {
    analysesRef.current = analyses;
  }, [analyses]);

  useEffect(() => {
    if (!client.models.PreTradeAnalysis) {
      console.warn("PreTradeAnalysis model not found. Run `npx ampx sandbox` to deploy.");
      return;
    }
    const sub = client.models.PreTradeAnalysis.observeQuery().subscribe({
      next: ({ items }) => {
        const grouped: Record<string, Analysis[]> = {};
        for (const item of items) {
          if (!grouped[item.pairId]) grouped[item.pairId] = [];
          grouped[item.pairId].push(item);
        }
        for (const key in grouped) {
          grouped[key].sort(
            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
          );
        }
        setAnalyses(grouped);
      },
      error: (err) => console.error("Subscription error:", err),
    });
    return () => {
      sub.unsubscribe();
      Object.values(autosaveTimers.current).forEach(clearTimeout);
    };
  }, []);

  const getDraft = (pairId: string): DraftAnalysis =>
    drafts[pairId] ?? { ...EMPTY_DRAFT };

  // No dependency on `analyses` — reads via ref instead to avoid stale closure.
  const persistAnalysis = useCallback(
    async (pairId: string, draft: DraftAnalysis) => {
      if (!client.models.PreTradeAnalysis) return;
      setSaveStatus((prev) => ({ ...prev, [pairId]: "saving" }));
      const today = new Date().toISOString().split("T")[0];
      const payload = {
        weekly: draft.weekly || undefined,
        weeklyScreenshot: draft.weeklyScreenshot || undefined,
        daily: draft.daily || undefined,
        dailyScreenshot: draft.dailyScreenshot || undefined,
        fourHr: draft.fourHr || undefined,
        fourHrScreenshot: draft.fourHrScreenshot || undefined,
        oneHr: draft.oneHr || undefined,
        oneHrScreenshot: draft.oneHrScreenshot || undefined,
      };
      try {
        // Use the ref so we always get the latest analyses, not a stale closure
        const existing = analysesRef.current[pairId]?.find((a) => a.date === today);
        const { errors } = existing
          ? await client.models.PreTradeAnalysis.update({ id: existing.id, ...payload })
          : await client.models.PreTradeAnalysis.create({ pairId, date: today, ...payload });
        if (errors) {
          console.error("Save errors:", errors);
          setSaveStatus((prev) => ({ ...prev, [pairId]: "idle" }));
        } else {
          setSaveStatus((prev) => ({ ...prev, [pairId]: "saved" }));
          setTimeout(
            () => setSaveStatus((prev) => ({ ...prev, [pairId]: "idle" })),
            2500,
          );
        }
      } catch (err) {
        console.error("Save failed:", err);
        setSaveStatus((prev) => ({ ...prev, [pairId]: "idle" }));
      }
    },
    [], // stable — reads analyses via ref, not closure
  );

  const setDraftField = useCallback(
    (pairId: string, field: keyof DraftAnalysis, value: string) => {
      setDrafts((prev) => {
        const updated = { ...(prev[pairId] ?? { ...EMPTY_DRAFT }), [field]: value };
        clearTimeout(autosaveTimers.current[pairId]);
        setSaveStatus((s) => ({ ...s, [pairId]: "pending" }));
        autosaveTimers.current[pairId] = setTimeout(() => {
          persistAnalysis(pairId, updated);
        }, AUTOSAVE_DELAY_MS);
        return { ...prev, [pairId]: updated };
      });
    },
    [persistAnalysis],
  );

  const clearDraft = (pairId: string) => {
    clearTimeout(autosaveTimers.current[pairId]);
    setDrafts((prev) => ({ ...prev, [pairId]: { ...EMPTY_DRAFT } }));
    setSaveStatus((prev) => ({ ...prev, [pairId]: "idle" }));
  };

  const deleteAnalysis = async (id: string) => {
    if (!client.models.PreTradeAnalysis) return;
    setDeleting((prev) => ({ ...prev, [id]: true }));
    try {
      await client.models.PreTradeAnalysis.delete({ id });
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setDeleting((prev) => ({ ...prev, [id]: false }));
    }
  };

  const openReport = (pairName: string, analysis: Analysis | DraftAnalysis, date: string) => {
    setReportState({
      open: true,
      pairName,
      analysis: {
        ...analysis,
        date,
        id: (analysis as Analysis).id ?? "draft",
      } as Analysis & DraftAnalysis,
    });
  };

  const closeReport = () => setReportState((s) => ({ ...s, open: false }));

  return {
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
  };
}
