import { useState, useMemo } from "react";
import { FOREX_PAIRS } from "@/lib/constants";
import { FlagColor } from "@/types/types";
import { getTradingDate, getTradingDateDaysAgo } from "@/lib/tradingDay";

export type SortKey = "symbol" | "category" | "date" | "flag";

type Pair = (typeof FOREX_PAIRS)[number];

const FLAG_ORDER: FlagColor[] = [
  "red",
  "orange",
  "green",
  "blue",
  "cyan",
  "pink",
  "purple",
  "none",
];

export function useFilterSort(
  pairFlags: Record<string, FlagColor>,
  latestDates: Record<string, string>, // pairId → most recent analysis date
  cutoffHourUtc: number,
) {
  const [flagFilters, setFlagFilters] = useState<FlagColor[]>([]);
  const [sortKey, setSortKey] = useState<SortKey>("category");

  const toggleFlagFilter = (color: FlagColor) => {
    setFlagFilters((prev) =>
      prev.includes(color) ? prev.filter((c) => c !== color) : [...prev, color],
    );
  };

  const clearFilters = () => setFlagFilters([]);

  // 1. Filter
  const filtered: Pair[] = useMemo(() => {
    if (flagFilters.length === 0) return FOREX_PAIRS;
    return FOREX_PAIRS.filter((p) =>
      flagFilters.includes(pairFlags[p.id] ?? "none"),
    );
  }, [flagFilters, pairFlags]);

  // 2. Sort
  const sorted: Pair[] = useMemo(() => {
    const copy = [...filtered];
    switch (sortKey) {
      case "symbol":
        return copy.sort((a, b) => a.name.localeCompare(b.name));
      case "category":
        return copy.sort((a, b) =>
          a.category === b.category
            ? a.name.localeCompare(b.name)
            : a.category.localeCompare(b.category),
        );
      case "date":
        return copy.sort((a, b) => {
          const da = latestDates[a.id] ?? "";
          const db = latestDates[b.id] ?? "";
          if (!da && !db) return a.name.localeCompare(b.name);
          if (!da) return 1;
          if (!db) return -1;
          return db.localeCompare(da); // newest first
        });
      case "flag":
        return copy.sort((a, b) => {
          const fa = FLAG_ORDER.indexOf(pairFlags[a.id] ?? "none");
          const fb = FLAG_ORDER.indexOf(pairFlags[b.id] ?? "none");
          return fa === fb ? a.name.localeCompare(b.name) : fa - fb;
        });
    }
  }, [filtered, sortKey, latestDates, pairFlags]);

  // 3. Group with subheaders
  const grouped: { heading: string | null; pairs: Pair[] }[] = useMemo(() => {
    if (sortKey === "category") {
      const categories = [...new Set(sorted.map((p) => p.category))];
      return categories.map((cat) => ({
        heading: cat,
        pairs: sorted.filter((p) => p.category === cat),
      }));
    }

    if (sortKey === "flag") {
      const seen = new Set<FlagColor>();
      const groups: { heading: string | null; pairs: Pair[] }[] = [];
      for (const pair of sorted) {
        const flag = pairFlags[pair.id] ?? "none";
        if (!seen.has(flag)) {
          seen.add(flag);
          groups.push({ heading: flagHeading(flag), pairs: [] });
        }
        groups[groups.length - 1].pairs.push(pair);
      }
      return groups;
    }

    if (sortKey === "date") {
      // All date comparisons use the trading day boundary, not midnight
      const todayTd = getTradingDate(cutoffHourUtc);
      const day1ago = getTradingDateDaysAgo(1, cutoffHourUtc);
      const day2ago = getTradingDateDaysAgo(2, cutoffHourUtc);
      const day3ago = getTradingDateDaysAgo(3, cutoffHourUtc);
      const day4ago = getTradingDateDaysAgo(4, cutoffHourUtc);
      const day5ago = getTradingDateDaysAgo(5, cutoffHourUtc);
      const day6ago = getTradingDateDaysAgo(6, cutoffHourUtc);
      const day30ago = getTradingDateDaysAgo(30, cutoffHourUtc);

      // Each exact trading date in "this week" gets its own subheader
      const thisWeekDates = [
        day1ago,
        day2ago,
        day3ago,
        day4ago,
        day5ago,
        day6ago,
      ];

      const buckets: { heading: string; test: (d: string) => boolean }[] = [
        {
          heading: "Today",
          test: (d) => d === todayTd,
        },
        // One bucket per day in the past 6 trading days
        ...thisWeekDates.map((dateStr) => ({
          heading: formatDateHeading(dateStr),
          test: (d: string) => d === dateStr,
        })),
        {
          heading: "This month",
          test: (d) => !!d && d >= day30ago && d < day6ago,
        },
        {
          heading: "Older",
          test: (d) => !!d && d < day30ago,
        },
        {
          heading: "No analysis",
          test: (d) => !d,
        },
      ];

      const groups: { heading: string | null; pairs: Pair[] }[] = [];
      for (const bucket of buckets) {
        const pairs = sorted.filter((p) =>
          bucket.test(latestDates[p.id] ?? ""),
        );
        if (pairs.length > 0) groups.push({ heading: bucket.heading, pairs });
      }
      return groups;
    }

    // symbol — flat, no subheader
    return [{ heading: null, pairs: sorted }];
  }, [sorted, sortKey, pairFlags, cutoffHourUtc]);

  return {
    flagFilters,
    sortKey,
    setSortKey,
    toggleFlagFilter,
    clearFilters,
    grouped,
    totalVisible: filtered.length,
  };
}

function flagHeading(flag: FlagColor): string {
  const labels: Record<FlagColor, string> = {
    none: "Unflagged",
    red: "Red — Bearish",
    orange: "Orange — Bearish lean",
    green: "Green — Bullish",
    blue: "Blue — Active trade",
    cyan: "Cyan — Watching",
    pink: "Pink — Watching",
    purple: "Purple — Macro / News",
  };
  return labels[flag];
}

function formatDateHeading(dateStr: string): string {
  const date = new Date(dateStr + "T12:00:00Z"); // noon UTC avoids DST edge cases
  return date.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "short",
  }); // e.g. "Monday, 10 Feb"
}
