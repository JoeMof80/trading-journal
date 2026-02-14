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

export const TIMEFRAMES = ["Weekly", "Daily", "1Hr", "4Hr"];

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
    value: "red",
    rowBg: "bg-red-50/60 dark:bg-red-950/40",
    label: "Red — bearish, avoid longs",
    iconClass: "text-red-500",
  },
  {
    value: "orange",
    rowBg: "bg-amber-50/60 dark:bg-amber-950/40",
    label: "Orange — bearish lean, uncertain",
    iconClass: "text-amber-400",
  },
  {
    value: "green",
    rowBg: "bg-green-50/60 dark:bg-green-950/40",
    label: "Green — bullish, look for longs",
    iconClass: "text-green-500",
  },
  {
    value: "blue",
    rowBg: "bg-blue-50/60 dark:bg-blue-950/40",
    label: "Blue — active trade / prime setup",
    iconClass: "text-blue-500",
  },
  {
    value: "cyan",
    rowBg: "bg-cyan-50/60 dark:bg-cyan-950/40",
    label: "Cyan — neutral, watching",
    iconClass: "text-cyan-500",
  },
  {
    value: "pink",
    rowBg: "bg-pink-50/60 dark:bg-pink-950/40",
    label: "Pink — neutral, watching",
    iconClass: "text-pink-500",
  },
  {
    value: "purple",
    rowBg: "bg-purple-50/60 dark:bg-purple-950/40",
    label: "Purple — macro / news watch",
    iconClass: "text-purple-500",
  },
];

export const FLAG_COLORS = FLAG_OPTIONS.filter((o) => o.value !== "none");

export function getFlagOption(color: FlagColor) {
  return FLAG_OPTIONS.find((f) => f.value === color) ?? FLAG_OPTIONS[0];
}
