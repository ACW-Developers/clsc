import { supabase } from "@/integrations/supabase/client";
export type PaymentInput =
  | { kind: "booking"; id: string; phone: string }
  | { kind: "bookshop"; branch: string; items: { book_id: string; quantity: number }[]; phone: string }
  | { kind: "event"; id: string; quantity: number; attendee: string; phone: string }
  | { kind: "donation"; name: string; email: string; phone: string; amount: number; message: string };
async function invoke(body: unknown) {
  const { data, error } = await supabase.functions.invoke("paystack", { body });
  if (error) {
    const context = (error as { context?: Response }).context;
    const details = context ? await context.json().catch(() => null) : null;
    throw new Error(details?.error ?? "Payment could not be processed. Please try again.");
  }
  return data;
}
export const paymentsService = {
  async start(payload: PaymentInput) {
    const data = await invoke({ action: "initialize", payload, origin: window.location.origin });
    if (!data?.authorization_url || new URL(data.authorization_url).origin !== "https://checkout.paystack.com") throw new Error("Checkout is unavailable");
    sessionStorage.setItem("cslc-payment-reference", data.reference);
    window.location.assign(data.authorization_url);
  },
  async verify(reference: string): Promise<{ kind: PaymentInput["kind"]; id?: string; status: string }> {
    return invoke({ action: "verify", reference });
  },
};