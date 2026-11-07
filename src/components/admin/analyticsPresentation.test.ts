import { describe, expect, it } from "vitest";
import {
  dailyActivity,
  dailyBreakdown,
  periodTotals,
} from "./analyticsPresentation";

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

describe("overview period trends", () => {
  const now = new Date(2026, 10, 7, 12);
  const at = (d: number, amount: number) => ({
    created_at: new Date(2026, 10, d, 9).toISOString(),
    amount,
  });

  it("compares the last 7 days with the 7 days before", () => {
    const rows = [at(7, 300), at(2, 100), at(31 - 31 + 1, 50), at(-5, 999)];
    // Nov 1..7 current = 300+100+50, Oct 25..31 previous = none
    const r = periodTotals(rows, 7, (x) => x.amount, now);
    expect(r.current).toBe(450);
    expect(r.previous).toBe(0);
    expect(r.change).toBeNull();
  });

  it("reports percentage change against the prior period", () => {
    const rows = [at(6, 150), at(-1, 100)]; // Oct 30 is in the prior week
    const r = periodTotals(rows, 7, (x) => x.amount, now);
    expect(r.change).toBe(50);
  });

  it("splits daily sums by module key", () => {
    const rows = [
      { created_at: new Date(2026, 10, 7, 8).toISOString(), key: "Bookshop", value: 200 },
      { created_at: new Date(2026, 10, 7, 9).toISOString(), key: "Bookshop", value: 50 },
      { created_at: new Date(2026, 10, 6, 9).toISOString(), key: "Events", value: 500 },
    ];
    const r = dailyBreakdown(rows, 2, ["Bookshop", "Events"], now);
    expect(r[0]).toMatchObject({ Bookshop: 0, Events: 500 });
    expect(r[1]).toMatchObject({ Bookshop: 250, Events: 0 });
  });
});
