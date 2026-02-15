import { Analysis, FlagColor } from "./types/types";

export const FOREX_PAIRS = [
  { id: "18", name: "AUDCAD", category: "Forex" },
  { id: "19", name: "AUDCHF", category: "Forex" },
  { id: "1", name: "AUDJPY", category: "Forex" },
  { id: "20", name: "AUDNZD", category: "Forex" },
  { id: "2", name: "AUDUSD", category: "Forex" },
  { id: "21", name: "CADCHF", category: "Forex" },
  { id: "3", name: "CADJPY", category: "Forex" },
  { id: "4", name: "CHFJPY", category: "Forex" },
  { id: "5", name: "EURAUD", category: "Forex" },
  { id: "22", name: "EURCAD", category: "Forex" },
  { id: "6", name: "EURCHF", category: "Forex" },
  { id: "7", name: "EURGBP", category: "Forex" },
  { id: "8", name: "EURJPY", category: "Forex" },
  { id: "23", name: "EURNZD", category: "Forex" },
  { id: "9", name: "EURUSD", category: "Forex" },
  { id: "24", name: "GBPAUD", category: "Forex" },
  { id: "10", name: "GBPCAD", category: "Forex" },
  { id: "25", name: "GBPCHF", category: "Forex" },
  { id: "11", name: "GBPJPY", category: "Forex" },
  { id: "26", name: "GBPNZD", category: "Forex" },
  { id: "12", name: "GBPUSD", category: "Forex" },
  { id: "27", name: "NZDCAD", category: "Forex" },
  { id: "28", name: "NZDCHF", category: "Forex" },
  { id: "13", name: "NZDJPY", category: "Forex" },
  { id: "14", name: "NZDUSD", category: "Forex" },
  { id: "15", name: "USDCAD", category: "Forex" },
  { id: "16", name: "USDCHF", category: "Forex" },
  { id: "17", name: "USDJPY", category: "Forex" },
  { id: "29", name: "XAGUSD", category: "Forex" },
  { id: "30", name: "XAUUSD", category: "Forex" },
  { id: "33", name: "DJI", category: "Indices" },
  { id: "36", name: "DXY", category: "Indices" },
  { id: "35", name: "FTSE", category: "Indices" },
  { id: "40", name: "NAS100", category: "Indices" },
  { id: "32", name: "NDX", category: "Indices" },
  { id: "34", name: "RUT", category: "Indices" },
  { id: "31", name: "SPX", category: "Indices" },
  { id: "37", name: "UKOIL", category: "Indices" },
  { id: "39", name: "US500", category: "Indices" },
  { id: "38", name: "USOIL", category: "Indices" },
  { id: "42", name: "CL1!", category: "Futures" },
  { id: "43", name: "GC1!", category: "Futures" },
  { id: "41", name: "WTI", category: "Futures" },
];

export const TIMEFRAMES = ["Weekly", "Daily", "4 Hour", "1 Hour"];

export const SUMMARY_FIELDS: { label: string; key: keyof Analysis }[] = [
  { label: "W", key: "weekly" },
  { label: "D", key: "daily" },
  { label: "4H", key: "fourHr" },
  { label: "1H", key: "oneHr" },
];

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
