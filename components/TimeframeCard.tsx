import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, Copy, ImagePlus, X } from "lucide-react";
import { DraftAnalysis } from "@/types/types";

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

  const noteValue = values[noteField];
  const screenshotValue = values[screenshotField];

  const handleCopy = () => {
    if (!noteValue) return;
    navigator.clipboard.writeText(noteValue);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const clearScreenshot = () => onChange?.(screenshotField, "");

  function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  const storeImage = async (blob: Blob) => {
    const base64 = await fileToBase64(blob as File);
    onChange?.(screenshotField, base64);
  };

  const handlePaste = async (e: React.ClipboardEvent<HTMLDivElement>) => {
    const items = Array.from(e.clipboardData.items);
    const imageItem = items.find((item) => item.type.startsWith("image/"));
    if (!imageItem) return;
    e.preventDefault();
    const blob = imageItem.getAsFile();
    if (blob) await storeImage(blob);
  };

  return (
    <div className="flex flex-col flex-1 gap-1.5 min-w-0">
      {/* Textarea with copy button overlaid in bottom-right corner */}
      <div className="relative group/note">
        <textarea
          value={noteValue}
          onChange={(e) => onChange?.(noteField, e.target.value)}
          readOnly={readOnly}
          placeholder={readOnly ? "—" : "Notes..."}
          className="w-full px-3 py-2 border rounded text-sm leading-relaxed resize-none h-20 bg-muted/40 placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring"
        />
        {/* Copy button — appears on hover or when there's content */}
        <Button
          size="icon"
          variant="ghost"
          className={`absolute bottom-1.5 right-1.5 h-5 w-5 transition-opacity
            ${noteValue ? "opacity-40 hover:opacity-100" : "opacity-0 group-hover/note:opacity-30"}`}
          onClick={handleCopy}
          disabled={!noteValue}
          title="Copy notes"
          tabIndex={-1}
        >
          {copied ? (
            <Check className="h-3 w-3 text-green-500" />
          ) : (
            <Copy className="h-3 w-3" />
          )}
        </Button>
      </div>

      {/* Screenshot */}
      {screenshotValue ? (
        <div className="relative group">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={screenshotValue}
            alt={`${label} chart`}
            className="w-full rounded border object-contain"
          />
          {!readOnly && (
            <Button
              size="icon"
              variant="secondary"
              className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
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
              ${
                isPasteTarget
                  ? "border-foreground text-foreground bg-muted/60 ring-1 ring-ring"
                  : "text-muted-foreground hover:border-foreground hover:text-foreground"
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
