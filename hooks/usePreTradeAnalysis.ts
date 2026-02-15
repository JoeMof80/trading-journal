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
  const [pairFlags, setPairFlagsState] = useState<Record<string, FlagColor>>({});
  const [reportState, setReportState] = useState<ReportState>({
    open: false,
    pairName: "",
    analysis: null,
  });

  const autosaveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // Ref so persistAnalysis always reads the latest analyses without
  // being re-created on every render (avoids stale closure on update path).
  const analysesRef = useRef(analyses);
  useEffect(() => { analysesRef.current = analyses; }, [analyses]);

  // pairSettingsId: pairId → Amplify record id, needed for upsert on flag change
  const pairSettingsIdRef = useRef<Record<string, string>>({});

  // ── Subscriptions ────────────────────────────────────────────────────────

  useEffect(() => {
    if (!client.models.PreTradeAnalysis) {
      console.warn("PreTradeAnalysis model not found. Run `npx ampx sandbox`.");
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
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
          );
        }
        setAnalyses(grouped);
      },
      error: (err) => console.error("Analysis subscription error:", err),
    });
    return () => {
      sub.unsubscribe();
      Object.values(autosaveTimers.current).forEach(clearTimeout);
    };
  }, []);

  useEffect(() => {
    if (!client.models.PairSettings) {
      console.warn("PairSettings model not found. Run `npx ampx sandbox`.");
      return;
    }
    const sub = client.models.PairSettings.observeQuery().subscribe({
      next: ({ items }) => {
        const flags: Record<string, FlagColor> = {};
        for (const item of items) {
          flags[item.pairId] = (item.flag ?? "none") as FlagColor;
          pairSettingsIdRef.current[item.pairId] = item.id;
        }
        setPairFlagsState(flags);
      },
      error: (err) => console.error("PairSettings subscription error:", err),
    });
    return () => sub.unsubscribe();
  }, []);

  // ── Flag persistence ─────────────────────────────────────────────────────

  const setPairFlag = useCallback(async (pairId: string, flag: FlagColor) => {
    // Optimistic update first — UI responds instantly
    setPairFlagsState((prev) => ({ ...prev, [pairId]: flag }));

    if (!client.models.PairSettings) return;
    const existingId = pairSettingsIdRef.current[pairId];
    try {
      if (existingId) {
        await client.models.PairSettings.update({ id: existingId, flag });
      } else {
        const { data: created } = await client.models.PairSettings.create({ pairId, flag });
        if (created) pairSettingsIdRef.current[pairId] = created.id;
      }
    } catch (err) {
      console.error("Flag save failed:", err);
    }
  }, []);

  // ── Analysis persistence ─────────────────────────────────────────────────

  const getDraft = (pairId: string): DraftAnalysis =>
    drafts[pairId] ?? { ...EMPTY_DRAFT };

  // `today` is passed in from the component so it uses the trading-day-aware
  // date (getTradingDate), keeping the upsert key consistent with what's stored.
  const persistAnalysis = useCallback(
    async (pairId: string, draft: DraftAnalysis, today: string) => {
      if (!client.models.PreTradeAnalysis) return;
      setSaveStatus((prev) => ({ ...prev, [pairId]: "saving" }));
      const payload = {
        weekly:            draft.weekly            || undefined,
        weeklyScreenshot:  draft.weeklyScreenshot  || undefined,
        daily:             draft.daily             || undefined,
        dailyScreenshot:   draft.dailyScreenshot   || undefined,
        fourHr:            draft.fourHr            || undefined,
        fourHrScreenshot:  draft.fourHrScreenshot  || undefined,
        oneHr:             draft.oneHr             || undefined,
        oneHrScreenshot:   draft.oneHrScreenshot   || undefined,
      };
      try {
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
    [],
  );

  const setDraftField = useCallback(
    (pairId: string, field: keyof DraftAnalysis, value: string, today: string) => {
      setDrafts((prev) => {
        const updated = { ...(prev[pairId] ?? { ...EMPTY_DRAFT }), [field]: value };
        clearTimeout(autosaveTimers.current[pairId]);
        setSaveStatus((s) => ({ ...s, [pairId]: "pending" }));
        autosaveTimers.current[pairId] = setTimeout(() => {
          persistAnalysis(pairId, updated, today);
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

  // ── Report dialog ────────────────────────────────────────────────────────

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
    setPairFlag,       // replaces setPairFlags — persists to Amplify
    reportState,
    closeReport,
    setDraftField,
    clearDraft,
    deleteAnalysis,
    openReport,
  };
}
