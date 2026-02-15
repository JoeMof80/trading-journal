import { Analysis, FlagColor } from "../types/types";

export const FLAG_OPTIONS: {
  value: FlagColor;
  rowBg: string;
  label: string;
  iconClass: string;
}[] = [
  {
    value: "none",
    rowBg: "",
    label: "None — unreviewed",
    iconClass: "text-muted-foreground/50",
  },
  {
    value: "red", // FF5252
    rowBg: "bg-[#FF5252]/10 dark:bg-[#FF5252]/20",
    label: "Red — bearish, avoid longs",
    iconClass: "text-[#FF5252]",
  },
  {
    value: "orange", // FBC12C
    rowBg: "bg-[#FBC12C]/10 dark:bg-[#FBC12C]/20",
    label: "Orange — bearish lean, uncertain",
    iconClass: "text-[#FBC12C]",
  },
  {
    value: "green", // 81C784
    rowBg: "bg-[#81C784]/10 dark:bg-[#81C784]/20",
    label: "Green — bullish, look for longs",
    iconClass: "text-[#81C784]",
  },
  {
    value: "blue", // 297AFF
    rowBg: "bg-[#297AFF]/10 dark:bg-[#297AFF]/20",
    label: "Blue — active trade / prime setup",
    iconClass: "text-[#297AFF]",
  },
  {
    value: "cyan", // 06E5FF
    rowBg: "bg-[#06E5FF]/10 dark:bg-[#06E5FF]/20",
    label: "Cyan — neutral, watching",
    iconClass: "text-[#06E5FF]",
  },
  {
    value: "pink", // F48FB1
    rowBg: "bg-[#F48FB1]/10 dark:bg-[#F48FB1]/20",
    label: "Pink — neutral, watching",
    iconClass: "text-[#F48FB1]",
  },
  {
    value: "purple", // BA68C8
    rowBg: "bg-[#BA68C8]/10 dark:bg-[#BA68C8]/20",
    label: "Purple — macro / news watch",
    iconClass: "text-[#BA68C8]",
  },
];

export const FLAG_COLORS = FLAG_OPTIONS.filter((o) => o.value !== "none");

export function getFlagOption(color: FlagColor) {
  return FLAG_OPTIONS.find((f) => f.value === color) ?? FLAG_OPTIONS[0];
}
