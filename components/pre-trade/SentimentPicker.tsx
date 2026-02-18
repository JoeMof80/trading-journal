import { Sentiment } from "@/types/types";
import { TrendingUp, TrendingDown, MoveRight } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { cn } from "@/lib/utils";

export const SENTIMENT_OPTIONS: {
  value: Sentiment;
  label: string;
  icon: React.ReactNode;
  iconClass: string;
}[] = [
  { value: "bullish", label: "Bullish",      icon: <TrendingUp   className="h-3.5 w-3.5" />, iconClass: "text-green-500" },
  { value: "bearish", label: "Bearish",      icon: <TrendingDown className="h-3.5 w-3.5" />, iconClass: "text-red-500"   },
  { value: "flat",    label: "Flat/neutral", icon: <MoveRight    className="h-3.5 w-3.5" />, iconClass: "text-amber-500" },
];

export function sentimentClass(sentiment: Sentiment | string | null | undefined): string {
  switch (sentiment) {
    case "bullish": return "text-green-500";
    case "bearish": return "text-red-500";
    case "flat":    return "text-amber-500";
    default:        return "text-muted-foreground/70";
  }
}

export function getSentimentOption(sentiment: Sentiment) {
  return SENTIMENT_OPTIONS.find((o) => o.value === sentiment);
}

export function SentimentPicker({
  sentiment,
  onChange,
}: {
  sentiment: Sentiment;
  onChange: (s: Sentiment) => void;
}) {
  const current = getSentimentOption(sentiment);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div
          role="button"
          tabIndex={0}
          className={cn(
            "flex items-center justify-center h-6 w-6 rounded-sm cursor-pointer transition-colors",
            sentiment === "bullish" ? "bg-green-500/15 text-green-500 hover:bg-green-500/25" :
            sentiment === "bearish" ? "bg-red-500/15 text-red-500 hover:bg-red-500/25" :
            sentiment === "flat"    ? "bg-amber-500/15 text-amber-500 hover:bg-amber-500/25" :
            "text-muted-foreground/30 hover:bg-accent hover:text-foreground"
          )}
          title={current ? current.label : "Set sentiment"}
          onKeyDown={(e) => e.key === "Enter" && e.currentTarget.click()}
        >
          {current
            ? current.icon
            : <TrendingUp className="h-3.5 w-3.5" />
          }
        </div>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        side="bottom"
        align="end"
        sideOffset={4}
        className="flex flex-row p-1"
      >
        {SENTIMENT_OPTIONS.map((opt) => (
          <DropdownMenuItem
            key={opt.value}
            onSelect={() => onChange(sentiment === opt.value ? "none" : opt.value)}
            title={opt.label}
            className={cn(
              "flex items-center justify-center p-1.5 cursor-pointer rounded",
              opt.iconClass,
              sentiment === opt.value && "bg-muted ring-1 ring-inset ring-border"
            )}
          >
            {opt.icon}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
