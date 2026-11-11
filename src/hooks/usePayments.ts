import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { paymentsService, type PaymentInput, type PaymentProvider } from "@/services/payments";

export const usePayment = (opts: { inline?: boolean } = {}) => {
  const [method, setMethod] = useState<PaymentProvider>("mpesa");
  const m = useMutation({ mutationFn: paymentsService.start });
  return { ...m, method, setMethod, mutate: (p: PaymentInput) => m.mutate({ ...p, provider: method, inline: opts.inline }) };
};

/** How long we keep listening for an M-Pesa confirmation before asking the customer to check again. */
export const PAYMENT_WAIT_MS = 180_000;

/**
 * Tracks one payment until it settles. The server rings a data-free doorbell on `pay-<reference>`
 * whenever the payment's status changes (e.g. Safaricom's callback); polling is the fallback.
 */
export function usePaymentStatus(reference: string) {
  const started = useRef(Date.now());
  const [, tick] = useState(0);
  useEffect(() => { started.current = Date.now(); }, [reference]);
  const q = useQuery({
    queryKey: ["paymentVerification", reference],
    queryFn: () => paymentsService.verify(reference),
    enabled: !!reference,
    retry: 1,
    staleTime: Infinity,
    refetchInterval: (query) => (query.state.data?.status === "pending" && Date.now() - started.current < PAYMENT_WAIT_MS ? 6000 : false),
  });
  const refetch = q.refetch;
  useEffect(() => {
    if (!reference) return;
    const ch = supabase.channel(`pay-${reference}`).on("broadcast", { event: "status" }, () => void refetch()).subscribe();
    const t = setTimeout(() => tick((n) => n + 1), PAYMENT_WAIT_MS + 500);
    return () => { clearTimeout(t); supabase.removeChannel(ch); };
  }, [reference, refetch]);
  const waiting = q.data?.status === "pending" && Date.now() - started.current < PAYMENT_WAIT_MS;
  const retry = () => { started.current = Date.now(); void refetch(); };
  return { ...q, waiting, retry };
}
