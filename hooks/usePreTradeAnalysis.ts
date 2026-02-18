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

// Returns current hour as full ISO timestamp rounded to the hour
function getCurrentHourTimestamp(): string {
  const now = new Date();
  now.setMinutes(0, 0, 0);
  return now.toISOString();
}

// Returns current hour as "YYYY-MM-DDTHH" for draft keying
function getCurrentHourKey(): string {
  const now = new Date();
  return now.toISOString().slice(0, 13); // "2026-02-16T14"
}

// Returns full ISO timestamp for current minute
function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

const EMPTY_DRAFT: DraftAnalysis = {
  weekly: "",
  weeklyScreenshot: "",
  weeklySentiment: "none",
  daily: "",
  dailyScreenshot: "",
  dailySentiment: "none",
  fourHr: "",
  fourHrScreenshot: "",
  fourHrSentiment: "none",
  oneHr: "",
  oneHrScreenshot: "",
  oneHrSentiment: "none",
};

const AUTOSAVE_DELAY_MS = 1500;

export type ReportState = {
  open: boolean;
  pairName: string;
  analysis: (Analysis & DraftAnalysis) | null;
};

function analysisToDF(a: Analysis): DraftAnalysis {
  return {
    weekly: a.weekly ?? "",
    weeklyScreenshot: a.weeklyScreenshot ?? "",
    weeklySentiment: (a.weeklySentiment ??
      "none") as DraftAnalysis["weeklySentiment"],
    daily: a.daily ?? "",
    dailyScreenshot: a.dailyScreenshot ?? "",
    dailySentiment: (a.dailySentiment ??
      "none") as DraftAnalysis["dailySentiment"],
    fourHr: a.fourHr ?? "",
    fourHrScreenshot: a.fourHrScreenshot ?? "",
    fourHrSentiment: (a.fourHrSentiment ??
      "none") as DraftAnalysis["fourHrSentiment"],
    oneHr: a.oneHr ?? "",
    oneHrScreenshot: a.oneHrScreenshot ?? "",
    oneHrSentiment: (a.oneHrSentiment ??
      "none") as DraftAnalysis["oneHrSentiment"],
  };
}

export function usePreTradeAnalysis() {
  const [analyses, setAnalyses] = useState<Record<string, Analysis[]>>({});
  // Drafts now keyed by `pairId-hourKey` e.g. "13-2026-02-16T14"
  const [drafts, setDrafts] = useState<Record<string, DraftAnalysis>>({});
  const [saveStatus, setSaveStatus] = useState<Record<string, SaveStatus>>({});
  const [deleting, setDeleting] = useState<Record<string, boolean>>({});
  const [pairFlags, setPairFlagsState] = useState<Record<string, FlagColor>>(
    {},
  );
  const [reportState, setReportState] = useState<ReportState>({
    open: false,
    pairName: "",
    analysis: null,
  });
  const [currentHourKey, setCurrentHourKey] = useState(getCurrentHourKey());

  const autosaveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>(
    {},
  );
  const analysesRef = useRef(analyses);
  useEffect(() => {
    analysesRef.current = analyses;
  }, [analyses]);
  const pairSettingsIdRef = useRef<Record<string, string>>({});

  // ── Hourly draft refresh ─────────────────────────────────────────────────
  // Check every minute if the hour has changed. If so, persist current drafts
  // (if non-empty) and reset to fresh drafts with new timestamps.

  useEffect(() => {
    const interval = setInterval(() => {
      const newHourKey = getCurrentHourKey();
      if (newHourKey !== currentHourKey) {
        console.log(
          "Hour changed, refreshing drafts:",
          currentHourKey,
          "→",
          newHourKey,
        );

        // Persist all non-empty drafts before clearing
        setDrafts((prev) => {
          Object.entries(prev).forEach(([key, draft]) => {
            const isEmpty =
              !draft.weekly && !draft.daily && !draft.fourHr && !draft.oneHr;
            if (!isEmpty) {
              const pairId = key.split("-")[0];
              // Fire off save without waiting
              persistAnalysis(pairId, draft).catch(console.error);
            }
          });
          // Clear all drafts
          return {};
        });

        setCurrentHourKey(newHourKey);
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [currentHourKey]);

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
          if (!item || !item.pairId) continue; // Skip null/deleted items
          if (!grouped[item.pairId]) grouped[item.pairId] = [];
          grouped[item.pairId].push(item);
        }
        // Sort by timestamp descending (newest first)
        for (const key in grouped) {
          grouped[key].sort(
            (a, b) =>
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
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
    if (!client.models.PairSettings) return;
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
    setPairFlagsState((prev) => ({ ...prev, [pairId]: flag }));
    if (!client.models.PairSettings) return;
    const existingId = pairSettingsIdRef.current[pairId];
    try {
      if (existingId) {
        await client.models.PairSettings.update({ id: existingId, flag });
      } else {
        const { data: created } = await client.models.PairSettings.create({
          pairId,
          flag,
        });
        if (created) pairSettingsIdRef.current[pairId] = created.id;
      }
    } catch (err) {
      console.error("Flag save failed:", err);
    }
  }, []);

  // ── Draft management ─────────────────────────────────────────────────────

  const getDraft = (pairId: string): DraftAnalysis => {
    const key = `${pairId}-${currentHourKey}`;
    return drafts[key] ?? { ...EMPTY_DRAFT };
  };

  // Create or update the current hour's record
  const persistAnalysis = useCallback(
    async (pairId: string, draft: DraftAnalysis) => {
      if (!client.models.PreTradeAnalysis) return;
      const key = `${pairId}-${currentHourKey}`;
      setSaveStatus((prev) => ({ ...prev, [key]: "saving" }));

      const hourTimestamp = getCurrentHourTimestamp();

      // Check if a record already exists for this hour
      const existing = analysesRef.current[pairId]?.find(
        (a) => a.timestamp && a.timestamp.startsWith(currentHourKey),
      );

      const payload = {
        pairId,
        timestamp: hourTimestamp,
        weekly: draft.weekly || undefined,
        weeklyScreenshot: draft.weeklyScreenshot || undefined,
        weeklySentiment: draft.weeklySentiment || undefined,
        daily: draft.daily || undefined,
        dailyScreenshot: draft.dailyScreenshot || undefined,
        dailySentiment: draft.dailySentiment || undefined,
        fourHr: draft.fourHr || undefined,
        fourHrScreenshot: draft.fourHrScreenshot || undefined,
        fourHrSentiment: draft.fourHrSentiment || undefined,
        oneHr: draft.oneHr || undefined,
        oneHrScreenshot: draft.oneHrScreenshot || undefined,
        oneHrSentiment: draft.oneHrSentiment || undefined,
      };

      try {
        const { errors } = existing
          ? await client.models.PreTradeAnalysis.update({
              id: existing.id,
              ...payload,
            })
          : await client.models.PreTradeAnalysis.create(payload);
        if (errors) {
          console.error("Save errors:", errors);
          setSaveStatus((prev) => ({ ...prev, [key]: "idle" }));
        } else {
          setSaveStatus((prev) => ({ ...prev, [key]: "saved" }));
          setTimeout(
            () => setSaveStatus((prev) => ({ ...prev, [key]: "idle" })),
            2500,
          );
        }
      } catch (err) {
        console.error("Save failed:", err);
        setSaveStatus((prev) => ({ ...prev, [key]: "idle" }));
      }
    },
    [currentHourKey],
  );

  const setDraftField = useCallback(
    (pairId: string, field: keyof DraftAnalysis, value: string) => {
      const key = `${pairId}-${currentHourKey}`;
      setDrafts((prev) => {
        const current = prev[key] ?? { ...EMPTY_DRAFT };
        const updated = { ...current, [field]: value };
        clearTimeout(autosaveTimers.current[key]);
        setSaveStatus((s) => ({ ...s, [key]: "pending" }));
        autosaveTimers.current[key] = setTimeout(() => {
          persistAnalysis(pairId, updated);
        }, AUTOSAVE_DELAY_MS);
        return { ...prev, [key]: updated };
      });
    },
    [currentHourKey, persistAnalysis],
  );

  const clearDraft = async (pairId: string) => {
    const key = `${pairId}-${currentHourKey}`;
    clearTimeout(autosaveTimers.current[key]);
    
    // If a saved record exists for the current hour, delete it too
    const existing = analysesRef.current[pairId]?.find(
      (a) => a.timestamp && a.timestamp.startsWith(currentHourKey),
    );
    if (existing) {
      await deleteAnalysis(existing.id);
    }
    
    setDrafts((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    setSaveStatus((prev) => ({ ...prev, [key]: "idle" }));
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

  // Update a historical analysis record directly (not current draft)
  const updateHistoricalAnalysis = async (
    id: string,
    field: keyof DraftAnalysis,
    value: string,
  ) => {
    if (!client.models.PreTradeAnalysis) return;
    
    // Find the analysis being edited
    const analysis = Object.values(analysesRef.current)
      .flat()
      .find((a) => a.id === id);
    if (!analysis) return;

    // Build update payload with only the changed field
    const payload: any = { id };
    payload[field] = value || undefined;

    try {
      await client.models.PreTradeAnalysis.update(payload);
    } catch (err) {
      console.error("Update failed:", err);
    }
  };

  // ── Report ───────────────────────────────────────────────────────────────

  const openReport = (
    pairName: string,
    analysis: Analysis | DraftAnalysis,
    timestamp: string,
  ) => {
    setReportState({
      open: true,
      pairName,
      analysis: {
        ...analysis,
        timestamp,
        id: (analysis as Analysis).id ?? "draft",
      } as Analysis & DraftAnalysis,
    });
  };

  const closeReport = () => setReportState((s) => ({ ...s, open: false }));

  return {
    analyses,
    getDraft,
    saveStatus: (pairId: string) =>
      saveStatus[`${pairId}-${currentHourKey}`] ?? "idle",
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
    currentHourKey, // Export so components can filter current hour
  };
}
