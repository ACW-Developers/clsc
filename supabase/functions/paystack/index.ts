import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3";
import { checkoutOrigin, verifiedTestPayment } from "./policy.ts";
import { stkPush, stkQuery } from "./mpesa.ts";

const phone = z.string().regex(/^(\+?254|0)[17][0-9]{8}$/);
const payload = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("booking"), id: z.string().uuid(), phone }),
  z.object({ kind: z.literal("bookshop"), branch: z.enum(["yaya", "kisumu"]), phone, items: z.array(z.object({ book_id: z.string().uuid(), quantity: z.number().int().min(1).max(99) })).min(1).max(50) }),
  z.object({ kind: z.literal("event"), id: z.string().uuid(), quantity: z.number().int().min(1).max(10), attendee: z.string().trim().min(2).max(120), phone }),
  z.object({ kind: z.literal("donation"), name: z.string().trim().min(2).max(120), email: z.string().trim().email().max(200), phone, amount: z.number().int().min(10).max(1000000), message: z.string().trim().max(400), fund: z.enum(["general", "leadership-development", "spiritual-formation", "mentorship-life-skills", "student-wellbeing"]).default("general"), frequency: z.enum(["once", "monthly", "quarterly", "annually"]).default("once") }),
]);
// Server-owned labels: the donation description is composed here, never taken verbatim from the browser.
const fundLabels = { general: "Where most needed", "leadership-development": "Leadership Development", "spiritual-formation": "Spiritual Formation & Discipleship", "mentorship-life-skills": "Mentorship & Life Skills", "student-wellbeing": "Student Wellbeing & Campus Engagement" } as const;
const frequencyLabels = { once: "One-time gift", monthly: "Monthly pledge", quarterly: "Quarterly pledge", annually: "Annual pledge" } as const;
const bodySchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("initialize"), payload, origin: z.string().url(), provider: z.enum(["paystack", "mpesa"]).default("paystack") }),
  z.object({ action: z.literal("verify"), reference: z.string().regex(/^CSLC-(TEST|MPESA)-[a-f0-9-]{36}$/) }),
]);
const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const secret = Deno.env.get("PAYSTACK_SECRET_KEY") ?? "";
  const paystackReady = secret.startsWith("sk_test_");
  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  async function api(path: string, body?: unknown) {
    const response = await fetch(`https://api.paystack.co${path}`, {
      method: body ? "POST" : "GET",
      headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/json" },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const result = await response.json();
    if (!response.ok || !result.status) throw new Error("Paystack could not process this request. Check your test account configuration and try again.");
    return result.data;
  }
  async function verify(reference: string, uid?: string) {
    const { data: session, error } = await db.from("payment_sessions").select("*").eq("reference", reference).maybeSingle();
    if (error || !session || (uid && session.user_id !== uid)) return json({ error: "Payment not found" }, 404);
    if (session.status === "completed") return json({ kind: session.kind, id: session.result_id, status: "completed" });
    if (session.status === "failed") return json({ kind: session.kind, status: "failed", error: session.failure_reason ?? "The M-Pesa payment was not completed. No receipt was issued." });
    if (session.provider === "mpesa") {
      if (session.status === "review") return json({ kind: session.kind, status: "review" });
      const result = await stkQuery(session.checkout_request_id);
      if (result.state === "pending") return json({ kind: session.kind, status: "pending" });
      if (result.state === "failed") {
        await db.from("payment_sessions").update({ status: "failed", failure_reason: result.reason }).eq("id", session.id).eq("status", "pending");
        return json({ kind: session.kind, status: "failed", error: result.reason });
      }
      const done = await db.rpc("finalize_paystack", { _reference: reference, _amount: session.amount_minor, _currency: "KES" });
      if (done.error) return json({ error: "Payment verification could not finish. Please retry." }, 500);
      return json(done.data);
    }
    if (!paystackReady) return json({ error: "Paystack test payments are not configured." }, 503);
    const transaction = await api(`/transaction/verify/${encodeURIComponent(reference)}`);
    if (!verifiedTestPayment(transaction, session)) return json({ status: "pending", error: "Payment has not been confirmed as a matching successful test transaction. No receipt was issued." }, 409);
    const result = await db.rpc("finalize_paystack", { _reference: reference, _amount: transaction.amount, _currency: transaction.currency });
    if (result.error) return json({ error: "Payment verification could not finish. Please retry." }, 500);
    return json(result.data);
  }
  try {
    const raw = await req.text();
    // Daraja STK callback: matched by per-session token, then confirmed with Daraja's own status query.
    const cbToken = new URL(req.url).searchParams.get("mpesa");
    if (cbToken) {
      const cb = JSON.parse(raw)?.Body?.stkCallback;
      const id = typeof cb?.CheckoutRequestID === "string" ? cb.CheckoutRequestID : "";
      const { data: s } = await db.from("payment_sessions").select("reference,callback_token").eq("checkout_request_id", id).maybeSingle();
      if (!s || s.callback_token !== cbToken) return json({ ResultCode: 0, ResultDesc: "Ignored" });
      const receipt = cb?.CallbackMetadata?.Item?.find((i: { Name: string }) => i.Name === "MpesaReceiptNumber")?.Value;
      if (cb.ResultCode === 0 && typeof receipt === "string" && /^[A-Z0-9]{8,12}$/.test(receipt)) await db.from("payment_sessions").update({ provider_receipt: receipt }).eq("checkout_request_id", id);
      await verify(s.reference);
      return json({ ResultCode: 0, ResultDesc: "Accepted" });
    }
    // Paystack retries signed webhooks; finalization is atomic and idempotent.
    const signature = req.headers.get("x-paystack-signature");
    if (signature) {
      if (!/^[a-f0-9]{128}$/i.test(signature)) return json({ error: "Invalid signature" }, 401);
      const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-512" }, false, ["verify"]);
      const bytes = new Uint8Array(signature.match(/.{2}/g)?.map((v) => parseInt(v, 16)) ?? []);
      if (!await crypto.subtle.verify("HMAC", key, bytes, new TextEncoder().encode(raw))) return json({ error: "Invalid signature" }, 401);
      const event = JSON.parse(raw);
      if (event.event !== "charge.success") return json({ received: true });
      const reference = z.string().regex(/^CSLC-TEST-[a-f0-9-]{36}$/).safeParse(event.data?.reference);
      if (!reference.success) return json({ received: true });
      return await verify(reference.data);
    }
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Please sign in" }, 401);
    const auth = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });
    const { data: claims, error: authError } = await auth.auth.getClaims(authHeader.slice(7));
    if (authError || !claims?.claims?.sub) return json({ error: "Please sign in" }, 401);
    const uid = claims.claims.sub;
    const parsed = bodySchema.safeParse(JSON.parse(raw));
    if (!parsed.success) return json({ error: "Check your payment details and try again" }, 400);
    const input = parsed.data;
    if (input.action === "initialize" && input.payload.kind === "donation") {
      const d = input.payload;
      d.message = `${fundLabels[d.fund]} · ${frequencyLabels[d.frequency]}${d.message ? ` — ${d.message}` : ""}`;
    }
    if (input.action === "verify") return await verify(input.reference, uid);
    if (!checkoutOrigin(input.origin) || req.headers.get("origin") !== input.origin) return json({ error: "This site is not approved for payment return links yet" }, 400);
    const { data: account } = await db.auth.admin.getUserById(uid);
    if (!account?.user?.email) return json({ error: "Your account needs an email address" }, 400);
    const quote = await db.rpc("paystack_quote", { _uid: uid, _kind: input.payload.kind, _payload: input.payload });
    if (quote.error || !quote.data) return json({ error: quote.error?.message ?? "Payment amount is unavailable" }, 400);
    const { count } = await db.from("payment_sessions").select("id", { count: "exact", head: true }).eq("user_id", uid).gte("created_at", new Date(Date.now() - 60_000).toISOString());
    if ((count ?? 0) >= 5) return json({ error: "Please wait a minute before trying again" }, 429);
    if (input.provider === "mpesa") {
      if (quote.data % 100 !== 0) return json({ error: "M-Pesa needs a whole-shilling amount" }, 400);
      const reference = `CSLC-MPESA-${crypto.randomUUID()}`, callback_token = crypto.randomUUID();
      const { error: e1 } = await db.from("payment_sessions").insert({ user_id: uid, kind: input.payload.kind, reference, payload: input.payload, amount_minor: quote.data, provider: "mpesa", callback_token });
      if (e1) return json({ error: "Unable to prepare checkout" }, 500);
      try {
        const checkoutId = await stkPush({ phone: input.payload.phone, amount: quote.data / 100, account: "CSLC", description: `CSLC ${input.payload.kind}`, callbackUrl: `${Deno.env.get("SUPABASE_URL")}/functions/v1/paystack?mpesa=${callback_token}` });
        await db.from("payment_sessions").update({ checkout_request_id: checkoutId }).eq("reference", reference);
      } catch (e) {
        await db.from("payment_sessions").update({ status: "failed", failure_reason: "Could not send the M-Pesa prompt" }).eq("reference", reference);
        console.error("STK push failed", (e as Error).message);
        return json({ error: "We couldn't send the M-Pesa prompt. Check the phone number and try again." }, 502);
      }
      return json({ reference, provider: "mpesa" });
    }
    if (!paystackReady) return json({ error: "Paystack test payments are not configured." }, 503);
    const reference = `CSLC-TEST-${crypto.randomUUID()}`;
    const { error: insertError } = await db.from("payment_sessions").insert({ user_id: uid, kind: input.payload.kind, reference, payload: input.payload, amount_minor: quote.data });
    if (insertError) return json({ error: "Unable to prepare checkout" }, 500);
    const checkout = await api("/transaction/initialize", { email: account.user.email, amount: quote.data, currency: "KES", reference, callback_url: `${input.origin}/payments/return`, metadata: { payment_type: input.payload.kind, mode: "test" } });
    if (typeof checkout.authorization_url !== "string" || new URL(checkout.authorization_url).origin !== "https://checkout.paystack.com") return json({ error: "Invalid checkout destination" }, 502);
    await db.from("payment_sessions").update({ authorization_url: checkout.authorization_url }).eq("reference", reference);
    return json({ authorization_url: checkout.authorization_url, reference });
  } catch (e) {
    console.error("payment error", (e as Error).message);
    return json({ error: "Payment could not be processed. Please try again." }, 502);
  }
});