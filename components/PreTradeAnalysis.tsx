"use client";

import { useEffect, useState } from "react";
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
import { Bookmark, Check, Loader2, Trash2 } from "lucide-react";
import { TradeAnalysisRow } from "./TradeAnalysisRow";
import { DraftAnalysis } from "@/types/types";

if (outputs && Object.keys(outputs).length > 0) {
  Amplify.configure(outputs);
}

const client = generateClient<Schema>();

type Analysis = Schema["PreTradeAnalysis"]["type"];

// ── Flag system ───────────────────────────────────────────────────────────────
//
// Matches TradingView's watchlist flag colours.
// Suggested usage:
//
//   🔴 Red    — Strong bearish bias. Clear downtrend across timeframes. Avoid longs.
//   🟠 Orange — Bearish lean but uncertain. Conflicting signals or ranging market.
//   🟡 Yellow — Neutral / watching. No clear edge yet. Monitor for setup.
//   🟢 Green  — Bullish bias. Trend aligned, looking for long entries.
//   🔵 Blue   — Active trade or prime setup ready to execute.
//   🟣 Purple — Macro/fundamental watch. High-impact event or news driver.
//   ⬜ None   — Unreviewed / no flag.

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
  bg: string;
  headerBg: string;
  label: string;
}[] = [
  {
    value: "none",
    bg: "bg-muted",
    headerBg: "bg-muted/30",
    label: "None — unreviewed",
  },
  {
    value: "red",
    bg: "bg-red-500",
    headerBg: "bg-red-50/70",
    label: "Red — bearish, avoid longs",
  },
  {
    value: "orange",
    bg: "bg-orange-400",
    headerBg: "bg-orange-50/70",
    label: "Orange — bearish lean, uncertain",
  },
  {
    value: "yellow",
    bg: "bg-yellow-400",
    headerBg: "bg-yellow-50/70",
    label: "Yellow — neutral, watching",
  },
  {
    value: "green",
    bg: "bg-green-500",
    headerBg: "bg-green-50/70",
    label: "Green — bullish, look for longs",
  },
  {
    value: "blue",
    bg: "bg-blue-500",
    headerBg: "bg-blue-50/70",
    label: "Blue — active trade / prime setup",
  },
  {
    value: "purple",
    bg: "bg-purple-500",
    headerBg: "bg-purple-50/70",
    label: "Purple — macro / news watch",
  },
];

function getFlagOption(color: FlagColor) {
  return FLAG_OPTIONS.find((f) => f.value === color) ?? FLAG_OPTIONS[0];
}

// ── Flag picker ───────────────────────────────────────────────────────────────
// Bookmark icon rotated 90° to match TradingView's flag appearance.
// Integrated directly into the pair badge.

function FlaggedBadge({
  name,
  flag,
  onChange,
}: {
  name: string;
  flag: FlagColor;
  onChange: (c: FlagColor) => void;
}) {
  const [open, setOpen] = useState(false);
  const current = getFlagOption(flag);

  // Colour for the bookmark icon itself
  const iconColor: Record<FlagColor, string> = {
    none: "text-muted-foreground/40",
    red: "text-red-500",
    orange: "text-orange-400",
    yellow: "text-yellow-400",
    green: "text-green-500",
    blue: "text-blue-500",
    purple: "text-purple-500",
  };

  return (
    <div className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
      <div
        role="button"
        tabIndex={0}
        title={`Flag: ${current.label}`}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => e.key === "Enter" && setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-md border px-2.5 py-0.5 text-sm font-bold tracking-wider hover:bg-muted/60 transition-colors focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer select-none"
      >
        {/* Bookmark rotated 90° = flag pointing right, like TradingView */}
        <Bookmark
          className={`h-3.5 w-3.5 shrink-0 rotate-270 transition-colors ${
            flag !== "none"
              ? `${iconColor[flag]} fill-current`
              : iconColor[flag]
          }`}
        />
        {name}
      </div>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-8 z-20 flex flex-col gap-0.5 rounded-md border bg-popover p-2 shadow-md min-w-[230px]">
            {FLAG_OPTIONS.map((opt) => (
              <div
                key={opt.value}
                role="button"
                tabIndex={0}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                onKeyDown={(e) =>
                  e.key === "Enter" && (onChange(opt.value), setOpen(false))
                }
                className={`flex items-center gap-2.5 rounded px-2 py-1.5 text-xs text-left hover:bg-muted transition-colors w-full cursor-pointer
                  ${flag === opt.value ? "bg-muted font-semibold" : ""}`}
              >
                <Bookmark
                  className={`h-3 w-3 rotate-270 shrink-0 ${
                    opt.value === "none"
                      ? "text-muted-foreground/40"
                      : `${iconColor[opt.value]} fill-current`
                  }`}
                />
                {opt.label}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── Summary snippet ───────────────────────────────────────────────────────────
// Shows all four timeframes as labelled truncated chips, aligned with
// the expanded content columns.

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
            className="flex items-center gap-1 flex-1 min-w-0 bg-background/60 rounded px-1.5 py-0.5 border border-border/50"
          >
            <span className="text-[10px] font-bold text-muted-foreground/60 shrink-0 uppercase">
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

// ── Main component ────────────────────────────────────────────────────────────

export default function PreTradeAnalysis() {
  const [analyses, setAnalyses] = useState<Record<string, Analysis[]>>({});
  const [drafts, setDrafts] = useState<Record<string, DraftAnalysis>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [deleting, setDeleting] = useState<Record<string, boolean>>({});
  const [flags, setFlags] = useState<Record<string, FlagColor>>({});

  useEffect(() => {
    if (!client.models.PreTradeAnalysis) {
      console.warn(
        "PreTradeAnalysis model not found. Run `npx ampx sandbox` to deploy the updated schema.",
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
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
          );
        }
        setAnalyses(grouped);
      },
      error: (err) => console.error("Subscription error:", err),
    });
    return () => sub.unsubscribe();
  }, []);

  const getDraft = (pairId: string): DraftAnalysis =>
    drafts[pairId] ?? { ...EMPTY_DRAFT };

  const setDraftField = (
    pairId: string,
    field: keyof DraftAnalysis,
    value: string,
  ) => {
    setDrafts((prev) => ({
      ...prev,
      [pairId]: { ...getDraft(pairId), [field]: value },
    }));
  };

  const clearDraft = (pairId: string) => {
    setDrafts((prev) => ({ ...prev, [pairId]: { ...EMPTY_DRAFT } }));
  };

  const saveAnalysis = async (pairId: string) => {
    if (!client.models.PreTradeAnalysis) return;
    const draft = getDraft(pairId);
    setSaving((prev) => ({ ...prev, [pairId]: true }));
    try {
      const { errors } = await client.models.PreTradeAnalysis.create({
        pairId,
        date: new Date().toISOString().split("T")[0],
        weekly: draft.weekly || undefined,
        weeklyScreenshot: draft.weeklyScreenshot || undefined,
        daily: draft.daily || undefined,
        dailyScreenshot: draft.dailyScreenshot || undefined,
        fourHr: draft.fourHr || undefined,
        fourHrScreenshot: draft.fourHrScreenshot || undefined,
        oneHr: draft.oneHr || undefined,
        oneHrScreenshot: draft.oneHrScreenshot || undefined,
      });
      if (errors) console.error("Save errors:", errors);
      else clearDraft(pairId);
    } catch (err) {
      console.error("Save failed:", err);
    } finally {
      setSaving((prev) => ({ ...prev, [pairId]: false }));
    }
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

  return (
    <div className="container mx-auto p-4">
      <Accordion
        type="single"
        collapsible
        defaultValue="item-1"
        className="w-full"
      >
        {FOREX_PAIRS.map((pair) => {
          const pairAnalyses = analyses[pair.id] ?? [];
          const draft = getDraft(pair.id);
          const isSaving = saving[pair.id] ?? false;
          const flag = flags[pair.id] ?? "none";
          const flagOpt = getFlagOption(flag);
          const latestAnalysis = pairAnalyses[0] ?? null;

          return (
            <AccordionItem key={pair.id} value={pair.id}>
              <AccordionTrigger
                className={`px-3 rounded-sm transition-colors ${flagOpt.headerBg}`}
              >
                {/* Use w-full so the summary can stretch across the full trigger width */}
                <div className="flex items-center gap-2 w-full mr-2 min-w-0">
                  <FlaggedBadge
                    name={pair.name}
                    flag={flag}
                    onChange={(c) =>
                      setFlags((prev) => ({ ...prev, [pair.id]: c }))
                    }
                  />
                  {latestAnalysis && (
                    <AnalysisSummary analysis={latestAnalysis} />
                  )}
                </div>
              </AccordionTrigger>

              <AccordionContent>
                <TradeAnalysisRow
                  date={new Date().toISOString().split("T")[0]}
                  values={draft}
                  onChange={(field, value) =>
                    setDraftField(pair.id, field, value)
                  }
                  rowActions={
                    <>
                      <Button
                        size="icon"
                        variant="default"
                        className="h-8 w-8"
                        disabled={isSaving}
                        onClick={() => saveAnalysis(pair.id)}
                        title="Save analysis"
                      >
                        {isSaving ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Check className="h-3.5 w-3.5" />
                        )}
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                        onClick={() => clearDraft(pair.id)}
                        title="Clear draft"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </>
                  }
                />

                {pairAnalyses.length === 0 ? (
                  <>
                    <Separator className="my-4" />
                    <p className="text-xs text-muted-foreground ml-3">
                      No saved analysis yet. Fill in the fields above and press
                      save.
                    </p>
                  </>
                ) : (
                  pairAnalyses.map((analysis) => {
                    const isDeleting = deleting[analysis.id] ?? false;
                    return (
                      <div key={analysis.id}>
                        <Separator className="my-4" />
                        <TradeAnalysisRow
                          date={analysis.date}
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
                          readOnly
                          rowActions={
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-destructive hover:text-red-600 hover:bg-red-50"
                              disabled={isDeleting}
                              onClick={() => deleteAnalysis(analysis.id)}
                              title="Delete analysis"
                            >
                              {isDeleting ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="h-3.5 w-3.5" />
                              )}
                            </Button>
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
    </div>
  );
}
