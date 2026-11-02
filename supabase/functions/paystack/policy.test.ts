import { describe, it, expect } from "vitest";
import { verifiedTestPayment, checkoutOrigin } from "./policy";

const expected = { reference: "CSLC-TEST-transaction", amount_minor: 100000, currency: "KES" };
const paid = { status: "success", domain: "test", reference: expected.reference, amount: 100000, currency: "KES" };
describe("Paystack test-only verification", () => {
  it("accepts a matching successful test payment", () => expect(verifiedTestPayment(paid, expected)).toBe(true));
  it("rejects live payments", () => expect(verifiedTestPayment({ ...paid, domain: "live" }, expected)).toBe(false));
  it("rejects a different amount", () => expect(verifiedTestPayment({ ...paid, amount: 1 }, expected)).toBe(false));
  it("rejects a different currency", () => expect(verifiedTestPayment({ ...paid, currency: "NGN" }, expected)).toBe(false));
  it("rejects a different reference", () => expect(verifiedTestPayment({ ...paid, reference: "other" }, expected)).toBe(false));
  it("rejects failed payments", () => expect(verifiedTestPayment({ ...paid, status: "failed" }, expected)).toBe(false));
  it("rejects external callback origins", () => expect(checkoutOrigin("https://example.com")).toBe(false));
});