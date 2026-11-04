// Daraja (M-Pesa) sandbox STK Push helpers. Credentials stay server-side.
const BASE = "https://sandbox.safaricom.co.ke";

function creds() {
  const key = Deno.env.get("MPESA_CONSUMER_KEY"), secret = Deno.env.get("MPESA_CONSUMER_SECRET");
  const passkey = Deno.env.get("MPESA_PASSKEY"), shortcode = Deno.env.get("MPESA_SHORTCODE");
  if (!key || !secret || !passkey || !shortcode) throw new Error("M-Pesa is not configured");
  return { key, secret, passkey, shortcode };
}

function stamp() {
  // Daraja expects East Africa Time, YYYYMMDDHHmmss.
  const d = new Date(Date.now() + 3 * 3600_000).toISOString();
  const timestamp = d.slice(0, 19).replace(/[-T:]/g, "");
  const { passkey, shortcode } = creds();
  return { timestamp, password: btoa(shortcode + passkey + timestamp), shortcode };
}

async function token() {
  const { key, secret } = creds();
  const r = await fetch(`${BASE}/oauth/v1/generate?grant_type=client_credentials`, { headers: { Authorization: `Basic ${btoa(`${key}:${secret}`)}` } });
  const body = await r.json().catch(() => ({}));
  if (!r.ok || !body.access_token) throw new Error("M-Pesa authentication failed");
  return body.access_token as string;
}

async function call(path: string, payload: unknown) {
  const r = await fetch(`${BASE}${path}`, { method: "POST", headers: { Authorization: `Bearer ${await token()}`, "Content-Type": "application/json" }, body: JSON.stringify(payload) });
  return { ok: r.ok, body: await r.json().catch(() => ({})) };
}

export const toMsisdn = (phone: string) => phone.replace(/^\+/, "").replace(/^0/, "254");

export async function stkPush(o: { phone: string; amount: number; account: string; callbackUrl: string; description: string }) {
  const { timestamp, password, shortcode } = stamp();
  const msisdn = toMsisdn(o.phone);
  const { ok, body } = await call("/mpesa/stkpush/v1/processrequest", {
    BusinessShortCode: shortcode, Password: password, Timestamp: timestamp, TransactionType: "CustomerPayBillOnline",
    Amount: o.amount, PartyA: msisdn, PartyB: shortcode, PhoneNumber: msisdn, CallBackURL: o.callbackUrl,
    AccountReference: o.account.slice(0, 12), TransactionDesc: o.description.slice(0, 13),
  });
  if (!ok || body.ResponseCode !== "0" || typeof body.CheckoutRequestID !== "string") throw new Error(body.errorMessage ?? body.ResponseDescription ?? "M-Pesa request failed");
  return body.CheckoutRequestID as string;
}

/** Returns "success", "failed" (with reason) or "pending" based on Daraja's own record. */
export async function stkQuery(checkoutRequestId: string): Promise<{ state: "success" | "failed" | "pending"; reason?: string }> {
  const { timestamp, password, shortcode } = stamp();
  const { body } = await call("/mpesa/stkpushquery/v1/query", { BusinessShortCode: shortcode, Password: password, Timestamp: timestamp, CheckoutRequestID: checkoutRequestId });
  if (body.ResultCode === "0" || body.ResultCode === 0) return { state: "success" };
  if (body.ResultCode !== undefined && body.ResultCode !== null) return { state: "failed", reason: String(body.ResultDesc ?? "Payment was not completed") };
  return { state: "pending" };
}
