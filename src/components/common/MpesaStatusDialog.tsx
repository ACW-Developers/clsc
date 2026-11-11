import { useEffect, useRef } from "react";
import { AlertTriangle, Check, Loader2, RotateCw, Smartphone, X } from "lucide-react";
import mpesaLogo from "@/assets/payments/mpesa.webp";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { usePaymentStatus } from "@/hooks/usePayments";
import { cn } from "@/lib/utils";
import type { PaymentStatus } from "@/services/payments";

interface Props {
  reference: string | null;
  reused?: boolean;
  amount: string;
  phone: string;
  onClose: () => void;
  onCompleted: (payment: PaymentStatus & { id: string }) => void;
}

/** Live M-Pesa STK status: updates the moment Safaricom reports back, then hands over the receipt. */
export function MpesaStatusDialog({ reference, reused, amount, phone, onClose, onCompleted }: Props) {
  const q = usePaymentStatus(reference ?? "");
  const status = q.data?.status;
  const handed = useRef<string | null>(null), onDone = useRef(onCompleted);
  onDone.current = onCompleted;
  useEffect(() => {
    const p = q.data;
    if (p?.status !== "completed" || !p.id || handed.current === reference) return;
    handed.current = reference;
    const id = p.id;
    setTimeout(() => onDone.current({ ...p, id }), 1400);
  }, [q.data, reference]);

  const done = status === "completed", failed = status === "failed" || (!!q.error && !q.data);
  const timedOut = status === "pending" && !q.waiting;
  const step = done ? 3 : status === "pending" || q.isLoading ? 2 : 1;
  const steps = ["Prompt sent", "Enter your PIN", "Confirmed"];

  return (
    <Dialog open={!!reference} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md overflow-hidden p-0">
        <div className={cn("flex flex-col items-center gap-3 px-6 pb-4 pt-8 text-center transition-colors duration-500", done ? "bg-success/10" : failed ? "bg-destructive/10" : "bg-secondary")}>
          <div className={cn("flex h-16 w-16 items-center justify-center rounded-full text-primary-foreground shadow-lift", done ? "animate-pop-in bg-success" : failed ? "animate-pop-in bg-destructive" : status === "review" ? "bg-accent text-accent-foreground" : "bg-primary")}>
            {done ? <Check className="h-8 w-8" /> : failed ? <X className="h-8 w-8" /> : status === "review" ? <AlertTriangle className="h-7 w-7" /> : timedOut ? <Smartphone className="h-7 w-7" /> : <Loader2 className="h-7 w-7 animate-spin" />}
          </div>
          <DialogHeader className="space-y-1 text-center sm:text-center">
            <DialogTitle className="text-xl">
              {done ? "Payment confirmed" : failed ? "Payment not completed" : status === "review" ? "Payment under review" : timedOut ? "Still waiting for M-Pesa" : "Check your phone"}
            </DialogTitle>
            <DialogDescription role="status" aria-live="polite">
              {done ? "Thank you! Your receipt is ready — opening it now…"
                : failed ? (q.data?.error ?? q.error?.message ?? "No money was taken and no receipt was issued.")
                : status === "review" ? "Your payment was received, but stock or pricing changed. CSLC will review it before issuing a receipt. Please don't pay again."
                : timedOut ? "We haven't heard back from Safaricom yet. If you entered your PIN, tap Check again."
                : reused ? `A prompt is already waiting on ${phone}. Enter your M-Pesa PIN to approve ${amount}.`
                : `We sent an M-Pesa prompt to ${phone}. Enter your PIN to approve ${amount}.`}
            </DialogDescription>
          </DialogHeader>
        </div>
        <div className="space-y-5 px-6 pb-6 pt-5">
          <ol className="grid grid-cols-3 gap-2" aria-label="Payment progress">
            {steps.map((label, i) => {
              const n = i + 1, active = n === step && !done && !failed, complete = n < step || done;
              return (
                <li key={label} className="flex flex-col items-center gap-1.5 text-center">
                  <span className={cn("h-1.5 w-full rounded-full transition-colors duration-500", complete ? "bg-success" : active ? "animate-pulse bg-primary" : failed && n === step ? "bg-destructive" : "bg-muted")} />
                  <span className={cn("text-[11px] font-medium", complete || active ? "text-foreground" : "text-muted-foreground")}>{label}</span>
                </li>
              );
            })}
          </ol>
          <div className="flex items-center justify-between rounded-lg border bg-card px-4 py-3 text-sm">
            <img src={mpesaLogo} alt="M-Pesa" className="h-6 w-20 object-contain" />
            <span className="font-semibold">{amount}</span>
          </div>
          {!done && (
            <div className="flex flex-col gap-2 sm:flex-row-reverse">
              {timedOut || status === "pending" ? (
                <Button className="flex-1" variant={timedOut ? "default" : "outline"} onClick={q.retry} disabled={q.isFetching}>
                  <RotateCw className={cn("h-4 w-4", q.isFetching && "animate-spin")} /> Check again
                </Button>
              ) : failed ? (
                <Button className="flex-1" onClick={onClose}>Try again</Button>
              ) : null}
              <Button className="flex-1" variant="ghost" onClick={onClose}>Close</Button>
            </div>
          )}
          {!done && !failed && <p className="text-center text-xs text-muted-foreground">This updates automatically. Closing it won't cancel a payment you've approved — your receipt will still appear under My receipts.</p>}
        </div>
      </DialogContent>
    </Dialog>
  );
}
