import { describe, expect, it } from "vitest";
import { bookingLabel, estimateTotal, nextAvailable, overlaps } from "./booking";

describe("booking rules", () => {
  it("charges per day inclusive of both dates", () => {
    expect(estimateTotal(1000, "per day", "2026-11-01", "2026-11-03", 2)).toBe(3000);
  });
  it("charges per person per day", () => {
    expect(estimateTotal(500, "per person", "2026-11-01", "2026-11-02", 3)).toBe(3000);
  });
  it("detects overlapping reservations", () => {
    expect(overlaps([{ start_date: "2026-11-02", end_date: "2026-11-04" }], "2026-11-04", "2026-11-05")).toBe(true);
    expect(overlaps([{ start_date: "2026-11-02", end_date: "2026-11-04" }], "2026-11-05", "2026-11-06")).toBe(false);
  });
  it("finds the next open date after reserved ranges", () => {
    expect(nextAvailable([{ start_date: "2026-11-01", end_date: "2026-11-03" }, { start_date: "2026-11-04", end_date: "2026-11-05" }], "2026-11-02")).toBe("2026-11-06");
  });
  it("only paid bookings read as fully paid", () => {
    expect(bookingLabel({ status: "pending", payment_status: "unpaid" })).toBe("Awaiting payment");
    expect(bookingLabel({ status: "confirmed", payment_status: "paid" })).toBe("Fully paid");
    expect(bookingLabel({ status: "pending", payment_status: "failed" })).toBe("Payment failed");
  });
});
