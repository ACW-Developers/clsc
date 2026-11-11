export function verifiedTestPayment(
  payment: { status?: string; domain?: string; reference?: string; amount?: number; currency?: string },
  expected: { reference: string; amount_minor: number; currency: string },
) {
  return payment.status === "success" && payment.domain === "test" &&
    payment.reference === expected.reference && payment.amount === expected.amount_minor &&
    payment.currency === expected.currency;
}

const allowedOrigins = new Set([
  "http://localhost:8080",
  "https://id-preview--9b8a21c0-ae89-49dd-9c7e-067f57eea87a.lovable.app",
  "https://9b8a21c0-ae89-49dd-9c7e-067f57eea87a.lovableproject.com",
  "https://ufungamano.netlify.app",
]);

export function checkoutOrigin(origin: string) {
  return allowedOrigins.has(origin);
}

// Stable JSON so identical checkout payloads compare equal regardless of key order (jsonb reorders keys).
const canonical = (v: unknown): string =>
  Array.isArray(v) ? `[${v.map(canonical).join(",")}]`
  : v && typeof v === "object" ? `{${Object.keys(v as object).sort().map((k) => `${JSON.stringify(k)}:${canonical((v as Record<string, unknown>)[k])}`).join(",")}}`
  : JSON.stringify(v);

export const PROMPT_REUSE_MS = 120_000;
type PromptSession = { reference: string; payload: unknown; created_at: string; provider: string; status: string };
/** An identical M-Pesa checkout still waiting for the customer's PIN is reused instead of sending a second prompt. */
export function reusablePrompt(sessions: PromptSession[], payload: unknown, now = Date.now()) {
  const key = canonical(payload);
  return sessions.find((s) => s.provider === "mpesa" && s.status === "pending" && now - Date.parse(s.created_at) < PROMPT_REUSE_MS && canonical(s.payload) === key)?.reference ?? null;
}

/** Customer-facing wording for Daraja result codes. */
export function mpesaReason(code: unknown, desc?: unknown) {
  const c = String(code);
  if (c === "1032") return "You cancelled the M-Pesa prompt. No money was taken and no receipt was issued.";
  if (c === "1037") return "The M-Pesa prompt timed out before a PIN was entered. Please try again.";
  if (c === "1") return "Your M-Pesa balance is too low for this payment.";
  if (c === "2001") return "The M-Pesa PIN entered was incorrect. Please try again.";
  return typeof desc === "string" && desc.trim() ? `M-Pesa: ${desc.trim().slice(0, 160)}` : "The M-Pesa payment was not completed. No receipt was issued.";
}
