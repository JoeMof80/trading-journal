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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { FOREX_PAIRS, TIMEFRAMES } from "@/constants";
import { Check, Loader2, Plus, Trash2 } from "lucide-react";

if (outputs && Object.keys(outputs).length > 0) {
  Amplify.configure(outputs);
}

const client = generateClient<Schema>();

// Maps TIMEFRAMES labels to model field keys
const TF_KEYS: Record<string, "weekly" | "daily" | "fourHr" | "oneHr"> = {
  Weekly: "weekly",
  Daily: "daily",
  "4hr": "fourHr",
  "1hr": "oneHr",
};

type Analysis = Schema["PreTradeAnalysis"]["type"];

type DraftAnalysis = {
  weekly: string;
  daily: string;
  fourHr: string;
  oneHr: string;
};

const EMPTY_DRAFT: DraftAnalysis = {
  weekly: "",
  daily: "",
  fourHr: "",
  oneHr: "",
};

export default function PreTradeAnalysis() {
  // analyses keyed by pairId
  const [analyses, setAnalyses] = useState<Record<string, Analysis[]>>({});
  // draft state keyed by pairId
  const [drafts, setDrafts] = useState<Record<string, DraftAnalysis>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [deleting, setDeleting] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // Subscribe to all PreTradeAnalysis records
    const sub = client.models.PreTradeAnalysis.observeQuery().subscribe({
      next: ({ items }) => {
        // Group by pairId
        const grouped: Record<string, Analysis[]> = {};
        for (const item of items) {
          if (!grouped[item.pairId]) grouped[item.pairId] = [];
          grouped[item.pairId].push(item);
        }
        // Sort each group by date descending
        for (const key in grouped) {
          grouped[key].sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
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

  const setDraft = (pairId: string, field: keyof DraftAnalysis, value: string) => {
    setDrafts((prev) => ({
      ...prev,
      [pairId]: { ...getDraft(pairId), [field]: value },
    }));
  };

  const clearDraft = (pairId: string) => {
    setDrafts((prev) => ({ ...prev, [pairId]: { ...EMPTY_DRAFT } }));
  };

  const saveAnalysis = async (pairId: string) => {
    const draft = getDraft(pairId);
    setSaving((prev) => ({ ...prev, [pairId]: true }));
    try {
      const { errors } = await client.models.PreTradeAnalysis.create({
        pairId,
        date: new Date().toISOString().split("T")[0],
        weekly: draft.weekly || undefined,
        daily: draft.daily || undefined,
        fourHr: draft.fourHr || undefined,
        oneHr: draft.oneHr || undefined,
      });
      if (errors) {
        console.error("Save errors:", errors);
      } else {
        clearDraft(pairId);
      }
    } catch (err) {
      console.error("Save failed:", err);
    } finally {
      setSaving((prev) => ({ ...prev, [pairId]: false }));
    }
  };

  const deleteAnalysis = async (id: string) => {
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

          return (
            <AccordionItem key={pair.id} value={pair.id}>
              <AccordionTrigger>
                <Badge
                  variant="outline"
                  className="text-sm font-bold tracking-wider"
                >
                  {pair.name}
                </Badge>
              </AccordionTrigger>
              <AccordionContent>
                {/* New entry row */}
                <AnalysisRow
                  date={new Date().toISOString().split("T")[0]}
                  values={draft}
                  onChange={(field, value) => setDraft(pair.id, field, value)}
                  actions={
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

                {/* Saved entries */}
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
                        <AnalysisRow
                          date={analysis.date}
                          values={{
                            weekly: analysis.weekly ?? "",
                            daily: analysis.daily ?? "",
                            fourHr: analysis.fourHr ?? "",
                            oneHr: analysis.oneHr ?? "",
                          }}
                          readOnly
                          actions={
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

// Shared row component for both new-entry and read-only saved entries
function AnalysisRow({
  date,
  values,
  onChange,
  readOnly = false,
  actions,
}: {
  date: string;
  values: DraftAnalysis;
  onChange?: (field: keyof DraftAnalysis, value: string) => void;
  readOnly?: boolean;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex w-full gap-4">
      <p className="flex flex-col flex-1 ml-3 text-xs font-medium text-muted-foreground tabular-nums pt-1 min-w-fit">
        {date}
      </p>
      {TIMEFRAMES.map((tf) => {
        const field = TF_KEYS[tf];
        return (
          <div key={tf} className="flex flex-col flex-1 gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {tf}
            </label>
            <textarea
              value={values[field]}
              onChange={(e) => onChange?.(field, e.target.value)}
              readOnly={readOnly}
              placeholder={readOnly ? "—" : "Notes..."}
              className="mt-1 p-2 border rounded text-sm leading-relaxed resize-none h-20 bg-muted/40 placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-60"
            />
          </div>
        );
      })}
      {/* Action buttons column */}
      <div className="flex flex-col justify-center gap-2 mt-5">
        {actions}
      </div>
    </div>
  );
}
