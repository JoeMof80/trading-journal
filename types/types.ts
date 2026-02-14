import { Schema } from "@/amplify/data/resource";

export type DraftAnalysis = {
  weekly: string;
  weeklyScreenshot: string;
  daily: string;
  dailyScreenshot: string;
  fourHr: string;
  fourHrScreenshot: string;
  oneHr: string;
  oneHrScreenshot: string;
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
