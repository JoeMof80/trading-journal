/**
 * Persists the trading day cutoff hour to localStorage.
 * Exposes it app-wide — import this hook wherever you need the cutoff.
 */
"use client";

import { useState, useEffect } from "react";
import { DEFAULT_CUTOFF_HOUR_UTC } from "@/lib/tradingDay";

const STORAGE_KEY = "tradelog:cutoffHourUtc";

export function useTradingDaySettings() {
  const [cutoffHourUtc, setCutoffHourUtcState] = useState<number>(
    DEFAULT_CUTOFF_HOUR_UTC,
  );

  // Hydrate from localStorage on mount (safe — only runs client-side)
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      const parsed = parseInt(stored, 10);
      if (!isNaN(parsed) && parsed >= 0 && parsed <= 23) {
        setCutoffHourUtcState(parsed);
      }
    }
  }, []);

  const setCutoffHourUtc = (hour: number) => {
    const clamped = Math.max(0, Math.min(23, Math.round(hour)));
    localStorage.setItem(STORAGE_KEY, String(clamped));
    setCutoffHourUtcState(clamped);
  };

  return { cutoffHourUtc, setCutoffHourUtc };
}
