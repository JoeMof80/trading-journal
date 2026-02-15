"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, Copy, ImagePlus, Loader2, X } from "lucide-react";
import { DraftAnalysis } from "@/types/types";
import { uploadData, getUrl, remove } from "aws-amplify/storage";

// Guard: storage may not be configured until after `npx ampx sandbox` redeploys
// with the new storage resource. Falls back gracefully if not available.
function isStorageConfigured(): boolean {
  try {
    // amplify_outputs.json will have a "storage" key once deployed
    return typeof window !== "undefined";
  } catch {
    return false;
  }
}

// S3 key format: screenshots/{pairId}/{field}/{uuid}.{ext}
// The UUID avoids collisions when replacing a screenshot.
function makeS3Key(screenshotField: string, mimeType: string): string {
  const ext = mimeType.split("/")[1]?.replace("jpeg", "jpg") ?? "png";
  const uuid = crypto.randomUUID();
  return `screenshots/${screenshotField}/${uuid}.${ext}`;
}

// Returns a signed URL good for 1 hour. Amplify caches these internally.
async function getSignedUrl(s3Key: string): Promise<string> {
  const { url } = await getUrl({
    path: s3Key,
    options: { expiresIn: 3600 },
  });
  return url.toString();
}

export function TimeframeCard({
  label,
  noteField,
  screenshotField,
  values,
  onChange,
  readOnly,
}: {
  label: string;
  noteField: "weekly" | "daily" | "fourHr" | "oneHr";
  screenshotField:
    | "weeklyScreenshot"
    | "dailyScreenshot"
    | "fourHrScreenshot"
    | "oneHrScreenshot";
  values: DraftAnalysis;
  onChange?: (field: keyof DraftAnalysis, value: string) => void;
  readOnly: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const [isPasteTarget, setIsPasteTarget] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);

  const noteValue = values[noteField];
  const screenshotValue = values[screenshotField]; // S3 key or empty string

  // Resolve signed URL when we have an S3 key and haven't fetched it yet
  if (screenshotValue && !signedUrl && !screenshotValue.startsWith("data:")) {
    getSignedUrl(screenshotValue).then(setSignedUrl).catch(console.error);
  }
  // Clear cached URL if key changes
  if (!screenshotValue && signedUrl) setSignedUrl(null);

  const handleCopy = () => {
    if (!noteValue) return;
    navigator.clipboard.writeText(noteValue);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const uploadFile = async (blob: Blob, mimeType: string) => {
    setUploading(true);
    try {
      // Delete old S3 object if replacing
      if (screenshotValue && !screenshotValue.startsWith("data:")) {
        await remove({ path: screenshotValue }).catch(() => {});
      }

      const key = makeS3Key(screenshotField, mimeType);
      await uploadData({
        path: key,
        data: blob,
        options: { contentType: mimeType },
      }).result;

      // Store the S3 key in DraftAnalysis — not the URL (URLs expire)
      onChange?.(screenshotField, key);
      // Immediately resolve a signed URL for display
      const url = await getSignedUrl(key);
      setSignedUrl(url);
    } catch (err) {
      console.error("Screenshot upload failed:", err);
    } finally {
      setUploading(false);
    }
  };

  const handlePaste = async (e: React.ClipboardEvent<HTMLDivElement>) => {
    const items = Array.from(e.clipboardData.items);
    const imageItem = items.find((item) => item.type.startsWith("image/"));
    if (!imageItem) return;
    e.preventDefault();
    const blob = imageItem.getAsFile();
    if (blob) await uploadFile(blob, imageItem.type);
  };

  const clearScreenshot = async () => {
    if (screenshotValue && !screenshotValue.startsWith("data:")) {
      await remove({ path: screenshotValue }).catch(() => {});
    }
    onChange?.(screenshotField, "");
    setSignedUrl(null);
  };

  // Display URL: prefer resolved signed URL, fall back to legacy base64
  const displaySrc = signedUrl ?? (screenshotValue?.startsWith("data:") ? screenshotValue : null);

  return (
    <div className="flex flex-col flex-1 gap-1.5 min-w-0">
      {/* Textarea */}
      <div className="relative group/note">
        <textarea
          value={noteValue}
          onChange={(e) => onChange?.(noteField, e.target.value)}
          readOnly={readOnly}
          placeholder={readOnly ? "—" : "Notes..."}
          className="w-full px-3 py-2 border border-border/70 rounded text-sm leading-relaxed resize-none h-20 bg-muted/60 dark:bg-muted/30 placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-ring"
        />
        <Button
          size="icon"
          variant="ghost"
          className={`absolute bottom-1.5 right-1.5 h-5 w-5 transition-opacity
            ${noteValue ? "opacity-50 hover:opacity-100" : "opacity-0 group-hover/note:opacity-40"}`}
          onClick={handleCopy}
          disabled={!noteValue}
          title="Copy notes"
          tabIndex={-1}
        >
          {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
        </Button>
      </div>

      {/* Screenshot */}
      {uploading ? (
        <div className="flex items-center justify-center w-full aspect-video border border-dashed bg-muted/40 rounded text-xs text-muted-foreground gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Uploading…
        </div>
      ) : displaySrc ? (
        <div className="relative group">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={displaySrc}
            alt={`${label} chart`}
            className="w-full rounded border object-contain"
          />
          {!readOnly && (
            <Button
              size="icon"
              variant="secondary"
              className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
              onClick={clearScreenshot}
              title="Remove screenshot"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      ) : (
        !readOnly && (
          <div
            tabIndex={0}
            onPaste={handlePaste}
            onFocus={() => setIsPasteTarget(true)}
            onBlur={() => setIsPasteTarget(false)}
            className={`flex flex-col items-center justify-center gap-1 w-full aspect-video border border-dashed bg-muted/40 rounded text-xs transition-colors cursor-default select-none outline-none
              ${isPasteTarget
                ? "border-foreground text-foreground bg-muted/60 ring-1 ring-ring"
                : "text-muted-foreground/80 hover:border-foreground hover:text-foreground"
              }`}
          >
            <ImagePlus className="h-4 w-4" />
            <span>
              Click then{" "}
              <kbd className="px-1 py-0.5 rounded bg-muted border text-[10px] font-mono">
                ⌘V
              </kbd>{" "}
              to paste screenshot
            </span>
          </div>
        )
      )}
    </div>
  );
}
