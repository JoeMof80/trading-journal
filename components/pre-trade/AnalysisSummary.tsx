import { SUMMARY_FIELDS } from "@/constants";
import { Analysis } from "@/types/types";

export function AnalysisSummary({ analysis }: { analysis: Analysis }) {
  const hasAny = SUMMARY_FIELDS.some(
    (f) => !!(analysis[f.key] as string)?.trim(),
  );
  if (!hasAny) return null;

  return (
    <>
      {SUMMARY_FIELDS.map(({ label, key }) => {
        const text = (analysis[key] as string | null | undefined)?.trim();
        return (
          <div
            key={label}
            className="flex flex-1 items-center min-w-0 ml-3 gap-2"
          >
            <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/90">
              {label}
            </label>
            <label className="text-xs text-foreground/80 truncate">
              {text || "—"}
            </label>
          </div>
        );
      })}
    </>
  );
}
