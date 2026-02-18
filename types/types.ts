import { Schema } from "@/amplify/data/resource";

export type Sentiment = "bullish" | "bearish" | "flat" | "none";

export type DraftAnalysis = {
  weekly: string;
  weeklyScreenshot: string;
  weeklySentiment: Sentiment;
  daily: string;
  dailyScreenshot: string;
  dailySentiment: Sentiment;
  fourHr: string;
  fourHrScreenshot: string;
  fourHrSentiment: Sentiment;
  oneHr: string;
  oneHrScreenshot: string;
  oneHrSentiment: Sentiment;
};

export type Analysis = Schema["PreTradeAnalysis"]["type"];

export type FlagColor =
  | "none"
  | "red"
  | "orange"
  | "green"
  | "blue"
  | "cyan"
  | "pink"
  | "purple";

export type SaveStatus = "idle" | "pending" | "saving" | "saved";
