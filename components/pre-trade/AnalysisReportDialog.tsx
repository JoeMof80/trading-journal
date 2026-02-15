"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";
import { DraftAnalysis } from "@/types/types";
import { getUrl } from "aws-amplify/storage";

type ReportAnalysis = { id: string; date: string } & DraftAnalysis;

const TIMEFRAME_FIELDS: {
  label: string;
  note: keyof DraftAnalysis;
  screenshot: keyof DraftAnalysis;
}[] = [
  { label: "Weekly",  note: "weekly",  screenshot: "weeklyScreenshot"  },
  { label: "Daily",   note: "daily",   screenshot: "dailyScreenshot"   },
  { label: "4 Hour",  note: "fourHr",  screenshot: "fourHrScreenshot"  },
  { label: "1 Hour",  note: "oneHr",   screenshot: "oneHrScreenshot"   },
];

// Resolves an S3 key → signed URL. Returns raw value if it's already a
// data URI (legacy base64) or empty string.
async function resolveScreenshot(value: string): Promise<string> {
  if (!value || value.startsWith("data:")) return value;
  try {
    const { url } = await getUrl({ path: value, options: { expiresIn: 3600 } });
    return url.toString();
  } catch {
    return "";
  }
}

function TimeframeSection({
  label,
  note,
  screenshotKey,
}: {
  label: string;
  note: string;
  screenshotKey: string;
}) {
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!screenshotKey) { setResolvedUrl(null); return; }
    resolveScreenshot(screenshotKey).then(setResolvedUrl);
  }, [screenshotKey]);

  const hasContent = note.trim() || screenshotKey;
  if (!hasContent) return null;

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground/90">
        {label}
      </h3>
      {screenshotKey && (
        resolvedUrl
          ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={resolvedUrl}
              alt={`${label} chart`}
              className="w-full rounded-md border object-contain max-h-90"
            />
          ) : (
            <div className="flex items-center justify-center w-full aspect-video bg-muted/30 rounded border text-xs text-muted-foreground gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading…
            </div>
          )
      )}
      {note.trim() && (
        <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">
          {note}
        </p>
      )}
    </div>
  );
}

export function AnalysisReportDialog({
  open,
  onOpenChange,
  pairName,
  analysis,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pairName: string;
  analysis: ReportAnalysis | null;
}) {
  if (!analysis) return null;

  const sections = TIMEFRAME_FIELDS.map((tf) => ({
    label: tf.label,
    note: (analysis[tf.note] as string) ?? "",
    screenshotKey: (analysis[tf.screenshot] as string) ?? "",
  })).filter((s) => s.note.trim() || s.screenshotKey);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span className="text-lg font-bold tracking-wider">{pairName}</span>
            <span className="text-sm font-normal text-muted-foreground/80 tabular-nums">
              {analysis.date}
            </span>
          </DialogTitle>
        </DialogHeader>

        {sections.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            No analysis data for this entry.
          </p>
        ) : (
          <div className="flex flex-col gap-6 py-2">
            {sections.map((section, i) => (
              <div key={section.label}>
                {i > 0 && <Separator className="mb-6" />}
                <TimeframeSection {...section} />
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
