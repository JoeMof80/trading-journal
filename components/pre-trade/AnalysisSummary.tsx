import { SUMMARY_FIELDS } from "@/lib/constants";
import { Analysis } from "@/types/types";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function AnalysisSummary({ analysis }: { analysis: Analysis }) {
  const hasAny = SUMMARY_FIELDS.some(
    (f) => !!(analysis[f.key] as string)?.trim(),
  );
  if (!hasAny) return null;

  return (
    <TooltipProvider delayDuration={300}>
      <div className="grid grid-cols-4 flex-1 gap-4 min-w-0">
        {SUMMARY_FIELDS.map(({ label, key }) => {
          const text = (analysis[key] as string | null | undefined)?.trim();
          return (
            <Tooltip key={label}>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1.5 cursor-default min-w-0">
                  <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/70 shrink-0 ml-3">
                    {label}
                  </span>
                  <span className="text-xs text-foreground/75 truncate">
                    {text || "—"}
                  </span>
                </div>
              </TooltipTrigger>
              {text && (
                <TooltipContent
                  side="bottom"
                  className="max-w-64 whitespace-pre-wrap text-xs leading-relaxed"
                >
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
                    {label === "W"
                      ? "Weekly"
                      : label === "D"
                        ? "Daily"
                        : label === "4H"
                          ? "4 Hour"
                          : "1 Hour"}
                  </p>
                  {text}
                </TooltipContent>
              )}
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
