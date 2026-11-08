import { describe, expect, it } from "vitest";
import { donationSchema } from "./donations";

const valid = {
  name: "Jane Doe",
  email: "jane@example.com",
  phone: "0712 345 678",
  amount: 1000,
  message: "",
  fund: "general",
  frequency: "once",
} as const;

describe("donation rules", () => {
  it("accepts a valid gift and strips spaces from the phone", () => {
    const r = donationSchema.parse(valid);
    expect(r.phone).toBe("0712345678");
  });
  it("rejects gifts under KSh 10", () => {
    expect(donationSchema.safeParse({ ...valid, amount: 9 }).success).toBe(false);
  });
  it("rejects gifts over KSh 1,000,000", () => {
    expect(donationSchema.safeParse({ ...valid, amount: 1_000_001 }).success).toBe(false);
  });
  it("requires whole-shilling amounts", () => {
    expect(donationSchema.safeParse({ ...valid, amount: 100.5 }).success).toBe(false);
  });
  it("requires a Kenyan mobile number", () => {
    expect(donationSchema.safeParse({ ...valid, phone: "0812345678" }).success).toBe(false);
  });
  it("rejects unknown designations", () => {
    expect(donationSchema.safeParse({ ...valid, fund: "admin" }).success).toBe(false);
  });
});
