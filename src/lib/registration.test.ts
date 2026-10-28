import { describe, expect, it } from "vitest";
import { signupSchema } from "./registration";
describe("Signup consent", () => {
  const account = {
    fullName: "Test User",
    email: "test@example.com",
    password: "secure-test-123",
  };
  it("blocks unchecked consent", () => {
    expect(signupSchema.safeParse({ ...account, consent: false }).success).toBe(
      false,
    );
  });
  it("blocks missing consent", () => {
    expect(signupSchema.safeParse(account).success).toBe(false);
  });
  it("accepts explicit consent", () => {
    expect(signupSchema.safeParse({ ...account, consent: true }).success).toBe(
      true,
    );
  });
});
