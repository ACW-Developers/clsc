import { expect, test } from "bun:test";
import { canClaim, isApprovedEmail } from "./policy";

test("new approved mailbox can register", () => {
  expect(isApprovedEmail("odongoclinton3@gmail.com")).toBe(true);
});
test("previous mailbox cannot register", () => {
  expect(isApprovedEmail("amosclinton196@gmail.com")).toBe(false);
});
test("approved mailbox must confirm email before claiming", () => {
  expect(canClaim("odongoclinton3@gmail.com", undefined)).toBe(false);
  expect(canClaim("odongoclinton3@gmail.com", "2026-10-21T19:00:00Z")).toBe(true);
});