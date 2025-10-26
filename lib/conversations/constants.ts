export type DateRangeValue = "24h" | "7d" | "30d" | "90d";

export const RANGE_TO_DAYS: Record<DateRangeValue, number> = {
  "24h": 1,
  "7d": 7,
  "30d": 30,
  "90d": 90,
};
