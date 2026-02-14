import { FlagColor } from "@/types/types";

export const FLAG_OPTIONS: {
  value: FlagColor;
  rowBg: string;
  label: string;
  iconClass: string;
}[] = [
  { value: "none",   rowBg: "",                                  label: "None — unreviewed",            iconClass: "text-muted-foreground/50" },
  { value: "red",    rowBg: "bg-red-50/60 dark:bg-red-950/40",   label: "Red — bearish, avoid longs",   iconClass: "text-red-500"             },
  { value: "orange", rowBg: "bg-amber-50/60 dark:bg-amber-950/40", label: "Orange — bearish lean",      iconClass: "text-amber-400"           },
  { value: "green",  rowBg: "bg-green-50/60 dark:bg-green-950/40", label: "Green — bullish, look for longs", iconClass: "text-green-500"      },
  { value: "blue",   rowBg: "bg-blue-50/60 dark:bg-blue-950/40", label: "Blue — active trade / prime setup", iconClass: "text-blue-500"      },
  { value: "cyan",   rowBg: "bg-cyan-50/60 dark:bg-cyan-950/40", label: "Cyan — neutral, watching",     iconClass: "text-cyan-500"            },
  { value: "pink",   rowBg: "bg-pink-50/60 dark:bg-pink-950/40", label: "Pink — interest, watching",    iconClass: "text-pink-500"            },
  { value: "purple", rowBg: "bg-purple-50/60 dark:bg-purple-950/40", label: "Purple — macro / news watch", iconClass: "text-purple-500"     },
];

export const FLAG_COLORS = FLAG_OPTIONS.filter((o) => o.value !== "none");

export function getFlagOption(color: FlagColor) {
  return FLAG_OPTIONS.find((f) => f.value === color) ?? FLAG_OPTIONS[0];
}
