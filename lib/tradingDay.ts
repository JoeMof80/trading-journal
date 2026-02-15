/**
 * Trading day utilities.
 *
 * A "trading day" runs from `cutoffHour` UTC on day N to `cutoffHour` UTC on
 * day N+1. So if cutoffHour=22 (10pm UTC), then:
 *   - 2025-02-10 22:01 UTC  →  trading date "2025-02-11"  (new day has begun)
 *   - 2025-02-11 21:59 UTC  →  trading date "2025-02-11"  (still same day)
 *   - 2025-02-11 22:00 UTC  →  trading date "2025-02-12"  (next day starts)
 *
 * This places the boundary after the NY close / spread hour and before the
 * Asian session, which is the natural reset point for most forex traders.
 */

export const DEFAULT_CUTOFF_HOUR_UTC = 22;

/**
 * Returns the trading date string (YYYY-MM-DD) for a given UTC cutoff hour.
 * Defaults to "now" if no date is passed.
 */
export function getTradingDate(
  cutoffHourUtc: number = DEFAULT_CUTOFF_HOUR_UTC,
  now: Date = new Date(),
): string {
  const utcHour = now.getUTCHours();
  const base = new Date(now);

  // If we're past the cutoff, the trading date is tomorrow's calendar date
  if (utcHour >= cutoffHourUtc) {
    base.setUTCDate(base.getUTCDate() + 1);
  }

  return base.toISOString().split("T")[0];
}

/**
 * Returns the trading date N days ago relative to the current trading date.
 * Useful for bucketing (e.g. "7 trading days ago").
 */
export function getTradingDateDaysAgo(
  daysAgo: number,
  cutoffHourUtc: number = DEFAULT_CUTOFF_HOUR_UTC,
): string {
  const now = new Date();
  const utcHour = now.getUTCHours();
  const base = new Date(now);
  if (utcHour >= cutoffHourUtc) base.setUTCDate(base.getUTCDate() + 1);
  base.setUTCDate(base.getUTCDate() - daysAgo);
  return base.toISOString().split("T")[0];
}
