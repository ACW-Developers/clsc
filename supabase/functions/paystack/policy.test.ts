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
import { reusablePrompt, mpesaReason, PROMPT_REUSE_MS } from "./policy";
describe("M-Pesa duplicate prompt protection", () => {
  const now = Date.parse("2026-11-11T20:00:00Z");
  const payload = { kind: "bookshop", branch: "yaya", phone: "0712345678", items: [{ book_id: "a", quantity: 2 }] };
  const s = { reference: "CSLC-MPESA-1", provider: "mpesa", status: "pending", created_at: new Date(now - 30_000).toISOString(), payload: { phone: "0712345678", items: [{ quantity: 2, book_id: "a" }], branch: "yaya", kind: "bookshop" } };
  it("reuses an identical prompt that is still waiting", () => expect(reusablePrompt([s], payload, now)).toBe("CSLC-MPESA-1"));
  it("sends a new prompt when the cart changed", () => expect(reusablePrompt([s], { ...payload, items: [{ book_id: "a", quantity: 3 }] }, now)).toBeNull());
  it("sends a new prompt after the previous one failed", () => expect(reusablePrompt([{ ...s, status: "failed" }], payload, now)).toBeNull());
  it("sends a new prompt once the waiting window has passed", () => expect(reusablePrompt([{ ...s, created_at: new Date(now - PROMPT_REUSE_MS - 1).toISOString() }], payload, now)).toBeNull());
  it("explains a cancelled prompt", () => expect(mpesaReason(1032)).toMatch(/cancelled/));
});
