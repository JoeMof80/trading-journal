"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { generateClient } from "aws-amplify/data";
import { Amplify } from "aws-amplify";
import type { Schema } from "@/amplify/data/resource";
import outputs from "@/amplify_outputs.json";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { FOREX_PAIRS } from "@/constants";
import { FileText, Loader2, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { TradeAnalysisRow, TradeAnalysisHeader } from "./TradeAnalysisRow";
import { AnalysisReportDialog } from "./AnalysisReportDialog";
import { FlagIcon } from "./FlagIcon";
import { DraftAnalysis } from "@/types/types";

if (outputs && Object.keys(outputs).length > 0) {
  Amplify.configure(outputs);
}

const client = generateClient<Schema>();

type Analysis = Schema["PreTradeAnalysis"]["type"];

// ── Flag system ───────────────────────────────────────────────────────────────

export type FlagColor =
  | "none"
  | "red"
  | "orange"
  | "yellow"
  | "green"
  | "blue"
  | "purple";

const FLAG_OPTIONS: {
  value: FlagColor;
  rowBg: string;
  label: string;
  iconClass: string;
}[] = [
  {
    value: "none",
    rowBg: "",
    label: "None — unreviewed",
    iconClass: "text-muted-foreground/30",
  },
  {
    value: "red",
    rowBg: "bg-red-50/40",
    label: "Red — bearish, avoid longs",
    iconClass: "text-red-500",
  },
  {
    value: "orange",
    rowBg: "bg-orange-50/40",
    label: "Orange — bearish lean, uncertain",
    iconClass: "text-orange-400",
  },
  {
    value: "yellow",
    rowBg: "bg-yellow-50/40",
    label: "Yellow — neutral, watching",
    iconClass: "text-yellow-400",
  },
  {
    value: "green",
    rowBg: "bg-green-50/40",
    label: "Green — bullish, look for longs",
    iconClass: "text-green-500",
  },
  {
    value: "blue",
    rowBg: "bg-blue-50/40",
    label: "Blue — active trade / prime setup",
    iconClass: "text-blue-500",
  },
  {
    value: "purple",
    rowBg: "bg-purple-50/40",
    label: "Purple — macro / news watch",
    iconClass: "text-purple-500",
  },
];

function getFlagOption(color: FlagColor) {
  return FLAG_OPTIONS.find((f) => f.value === color) ?? FLAG_OPTIONS[0];
}

// ── Row-level flag picker ─────────────────────────────────────────────────────

// Coloured options only — "none" is achieved by clicking the active colour again
const FLAG_COLORS = FLAG_OPTIONS.filter((o) => o.value !== "none");

function RowFlagPicker({
  flag,
  onChange,
}: {
  flag: FlagColor;
  onChange: (c: FlagColor) => void;
}) {
  const current = getFlagOption(flag);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6"
          title={flag === "none" ? "Set flag" : `Flag: ${current.label}`}
        >
          <FlagIcon
            className={`transition-colors ${current.iconClass}`}
            filled={flag !== "none"}
            size={13}
          />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        side="right"
        align="start"
        sideOffset={6}
        alignOffset={-6}
        className="flex flex-row p-1"
      >
        {FLAG_COLORS.map((opt) => (
          <DropdownMenuItem
            key={opt.value}
            onSelect={() => onChange(flag === opt.value ? "none" : opt.value)}
            title={opt.label}
            className={`flex items-center justify-center p-1.5 cursor-pointer rounded
              ${flag === opt.value ? "bg-muted ring-1 ring-inset ring-border" : ""}`}
          >
            <FlagIcon
              className={`shrink-0 ${opt.iconClass}`}
              filled
              size={13}
            />
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ── Summary chips in accordion header ─────────────────────────────────────────

const SUMMARY_FIELDS: { label: string; key: keyof Analysis }[] = [
  { label: "W", key: "weekly" },
  { label: "D", key: "daily" },
  { label: "4H", key: "fourHr" },
  { label: "1H", key: "oneHr" },
];

function AnalysisSummary({ analysis }: { analysis: Analysis }) {
  const hasAny = SUMMARY_FIELDS.some(
    (f) => !!(analysis[f.key] as string)?.trim(),
  );
  if (!hasAny) return null;

  return (
    <div className="flex items-center gap-1 min-w-0 flex-1 ml-2">
      {SUMMARY_FIELDS.map(({ label, key }) => {
        const text = (analysis[key] as string | null | undefined)?.trim();
        return (
          <div
            key={label}
            className="flex items-center gap-1 flex-1 min-w-0 bg-background/50 rounded px-1.5 py-0.5 border border-border/40"
          >
            <span className="text-[10px] font-bold text-muted-foreground/50 shrink-0 uppercase">
              {label}
            </span>
            <span className="text-[11px] text-muted-foreground truncate">
              {text || "—"}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── Autosave indicator ────────────────────────────────────────────────────────

type SaveStatus = "idle" | "pending" | "saving" | "saved";

function AutosaveIndicator({ status }: { status: SaveStatus }) {
  if (status === "idle") return null;
  return (
    <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
      {status === "saving" && <Loader2 className="h-2.5 w-2.5 animate-spin" />}
      {status === "saving" && "Saving…"}
      {status === "saved" && <span className="text-green-500">Saved</span>}
      {status === "pending" && "…"}
    </span>
  );
}

// ── Empty draft ───────────────────────────────────────────────────────────────

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

// ── Main component ────────────────────────────────────────────────────────────

export default function PreTradeAnalysis() {
  const [analyses, setAnalyses] = useState<Record<string, Analysis[]>>({});
  const [drafts, setDrafts] = useState<Record<string, DraftAnalysis>>({});
  const [saveStatus, setSaveStatus] = useState<Record<string, SaveStatus>>({});
  const [deleting, setDeleting] = useState<Record<string, boolean>>({});

  const [pairFlags, setPairFlags] = useState<Record<string, FlagColor>>({});
  const [rowFlags, setRowFlags] = useState<Record<string, FlagColor>>({});

  const [reportState, setReportState] = useState<{
    open: boolean;
    pairName: string;
    analysis: (Analysis & DraftAnalysis) | null;
  }>({ open: false, pairName: "", analysis: null });

  const autosaveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>(
    {},
  );

  useEffect(() => {
    if (!client.models.PreTradeAnalysis) {
      console.warn(
        "PreTradeAnalysis model not found. Run `npx ampx sandbox` to deploy.",
      );
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
        const existing = analyses[pairId]?.find((a) => a.date === today);
        const { errors } = existing
          ? await client.models.PreTradeAnalysis.update({
              id: existing.id,
              ...payload,
            })
          : await client.models.PreTradeAnalysis.create({
              pairId,
              date: today,
              ...payload,
            });
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
    [analyses],
  );

  const setDraftField = useCallback(
    (pairId: string, field: keyof DraftAnalysis, value: string) => {
      setDrafts((prev) => {
        const updated = {
          ...(prev[pairId] ?? { ...EMPTY_DRAFT }),
          [field]: value,
        };
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

  const openReport = (
    pairName: string,
    analysis: Analysis | DraftAnalysis,
    date: string,
  ) => {
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

  return (
    <div className="container mx-auto p-4">
      <Accordion
        type="single"
        collapsible
        defaultValue="item-1"
        className="w-full"
      >
        {FOREX_PAIRS.map((pair) => {
          const today = new Date().toISOString().split("T")[0];
          const allAnalyses = analyses[pair.id] ?? [];
          const pairAnalyses = allAnalyses.filter((a) => a.date !== today);
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

          const status = saveStatus[pair.id] ?? "idle";
          const pairFlag = pairFlags[pair.id] ?? "none";
          const pairFlagOpt = getFlagOption(pairFlag);
          const latestAnalysis = allAnalyses[allAnalyses.length - 1] ?? null;

          return (
            <AccordionItem key={pair.id} value={pair.id}>
              {/*
               * Accordion header — neutral bg, no text underline.
               * [&>svg] targets the built-in chevron from shadcn AccordionTrigger.
               * hover:no-underline and [&]:no-underline override shadcn defaults.
               * data-[state=open] applies a light grey tint when expanded.
               */}
              <AccordionTrigger
                className="
                  px-3 rounded-sm
                  no-underline hover:no-underline
                  [&]:no-underline [&_*]:no-underline
                  hover:bg-muted/50
                  data-[state=open]:bg-muted/60
                  transition-colors
                  [&>svg]:shrink-0
                "
              >
                <div className="flex items-center gap-2 w-full mr-2 min-w-0">
                  {/* Flag as pure indicator — colour only, not interactive */}
                  <FlagIcon
                    className={`shrink-0 transition-colors ${pairFlagOpt.iconClass}`}
                    filled={pairFlag !== "none"}
                    size={13}
                  />
                  <span className="text-sm font-bold tracking-wider shrink-0">
                    {pair.name}
                  </span>
                  {latestAnalysis && (
                    <AnalysisSummary analysis={latestAnalysis} />
                  )}
                </div>
              </AccordionTrigger>

              <AccordionContent>
                <TradeAnalysisHeader />

                {/* ── Draft row (today) ── */}
                <TradeAnalysisRow
                  date={today}
                  values={draft}
                  onChange={(field, value) =>
                    setDraftField(pair.id, field, value)
                  }
                  dateColumnActions={
                    <>
                      <AutosaveIndicator status={status} />
                      <RowFlagPicker
                        flag={rowFlags[`draft-${pair.id}`] ?? "none"}
                        onChange={(c) => {
                          setRowFlags((prev) => ({
                            ...prev,
                            [`draft-${pair.id}`]: c,
                          }));
                          setPairFlags((prev) => ({ ...prev, [pair.id]: c }));
                        }}
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 text-muted-foreground hover:text-foreground"
                        onClick={() => openReport(pair.name, draft, today)}
                        title="Preview report"
                      >
                        <FileText className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 text-muted-foreground hover:text-destructive"
                        onClick={() => clearDraft(pair.id)}
                        title="Clear draft"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </>
                  }
                />

                {/* ── Historical rows ── */}
                {pairAnalyses.length === 0 ? (
                  <>
                    <Separator className="my-4" />
                    <p className="text-xs text-muted-foreground ml-3">
                      No previous analysis. Today's entry autosaves as you type.
                    </p>
                  </>
                ) : (
                  pairAnalyses.map((analysis) => {
                    const isDeleting = deleting[analysis.id] ?? false;
                    const rowFlag = rowFlags[analysis.id] ?? "none";
                    const rowFlagOpt = getFlagOption(rowFlag);

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
                          dateColumnActions={
                            <>
                              <RowFlagPicker
                                flag={rowFlag}
                                onChange={(c) => {
                                  setRowFlags((prev) => ({
                                    ...prev,
                                    [analysis.id]: c,
                                  }));
                                  const isLatest =
                                    analysis.id ===
                                    allAnalyses[allAnalyses.length - 1]?.id;
                                  if (isLatest)
                                    setPairFlags((prev) => ({
                                      ...prev,
                                      [pair.id]: c,
                                    }));
                                }}
                              />
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6 text-muted-foreground hover:text-foreground"
                                onClick={() =>
                                  openReport(pair.name, analysis, analysis.date)
                                }
                                title="View report"
                              >
                                <FileText className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                disabled={isDeleting}
                                onClick={() => deleteAnalysis(analysis.id)}
                                title="Delete"
                              >
                                {isDeleting ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Trash2 className="h-3.5 w-3.5" />
                                )}
                              </Button>
                            </>
                          }
                        />
                      </div>
                    );
                  })
                )}
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>

      <AnalysisReportDialog
        open={reportState.open}
        onOpenChange={(open) => setReportState((s) => ({ ...s, open }))}
        pairName={reportState.pairName}
        analysis={reportState.analysis}
      />
    </div>
  );
}
