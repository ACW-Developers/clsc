import { describe, expect, it } from "vitest";
import { dailyActivity } from "./analyticsPresentation";

describe("dashboard daily activity", () => {
  it("fills all seven calendar days and counts only records in the period", () => {
    const records = [
      { created_at: new Date(2026, 9, 21, 12).toISOString() },
      { created_at: new Date(2026, 9, 22, 0).toISOString() },
      { created_at: new Date(2026, 9, 24, 10).toISOString() },
      { created_at: new Date(2026, 9, 24, 23).toISOString() },
      { created_at: new Date(2026, 9, 29, 0).toISOString() },
    ];
    const result = dailyActivity(records, 7, new Date(2026, 9, 28, 12));
    expect(result).toHaveLength(7);
    expect(result.map((day) => day.count)).toEqual([1, 0, 2, 0, 0, 0, 0]);
  });
});