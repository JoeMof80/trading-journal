import { Analysis } from "@/types/types";

export const TIMEFRAMES = ["Weekly", "Daily", "1Hr", "4Hr"];

export const SUMMARY_FIELDS: { label: string; key: keyof Analysis }[] = [
  { label: "W", key: "weekly" },
  { label: "D", key: "daily" },
  { label: "4H", key: "fourHr" },
  { label: "1H", key: "oneHr" },
];
