import { Analysis } from "@/types/types";

export const TIMEFRAMES = ["Weekly", "Daily", "4H", "1H"];

export const SUMMARY_FIELDS: {
  label: string;
  key: keyof Analysis;
  sentimentKey: keyof Analysis;
}[] = [
  { label: "W",  key: "weekly",  sentimentKey: "weeklySentiment"  },
  { label: "D",  key: "daily",   sentimentKey: "dailySentiment"   },
  { label: "4H", key: "fourHr",  sentimentKey: "fourHrSentiment"  },
  { label: "1H", key: "oneHr",   sentimentKey: "oneHrSentiment"   },
];
