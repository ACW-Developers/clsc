import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Loader2, Smartphone } from "lucide-react";
import { SiteHeader } from "@/components/common/SiteHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { usePayment } from "@/hooks/usePayments";
import { hospitalityService as svc } from "@/services/hospitality";
import { accountView } from "@/routes/paths";
import { bookingLabel, kes, labelVariant } from "@/lib/booking";

const CheckoutPage = () => {
  const { id = "" } = useParams();
  const q = useQuery({
    queryKey: ["bookings", "one", id],
    queryFn: () => svc.getBooking(id),
  });
  const [phone, setPhone] = useState("");
  const pay = usePayment();
  const b = q.data;
  const label = b ? bookingLabel(b) : null;
  const run = () => pay.mutate({ kind: "booking", id, phone: phone.replace(/\s/g, "") });

  return (
    <div className="min-h-screen bg-muted">
      <SiteHeader />
      <main className="container max-w-xl py-10">
        {q.isLoading ? (
          <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
        ) : !b ? (
          <Alert variant="destructive">
            <AlertDescription>Booking not found.</AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-5 rounded-2xl border bg-card p-6 shadow-card">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold">Review & pay</h1>
                <p className="text-sm text-muted-foreground">
                  {b.sub_services?.services?.name} — {b.sub_services?.name}
                </p>
              </div>
              {label && <Badge variant={labelVariant(label)}>{label}</Badge>}
            </div>
            <dl className="grid grid-cols-2 gap-y-2 rounded-xl bg-secondary p-4 text-sm">
              <dt>Dates</dt>
              <dd className="text-right">
                {b.start_date} → {b.end_date}
              </dd>
              {b.start_time && (
                <>
                  <dt>Time</dt>
                  <dd className="text-right">
                    {b.start_time.slice(0, 5)}
                    {b.end_time ? ` – ${b.end_time.slice(0, 5)}` : ""}
                  </dd>
                </>
              )}
              <dt>Guests</dt>
              <dd className="text-right">{b.guests}</dd>
              <dt className="text-base font-bold">Total</dt>
              <dd className="text-right text-base font-bold text-primary">
                {kes(b.total_amount)}
              </dd>
            </dl>
            {b.notes && (
              <section className="border-y py-3 text-sm">
                <h2 className="font-semibold">Booking details</h2>
                <p className="mt-1 whitespace-pre-line break-words text-muted-foreground">
                  {b.notes}
                </p>
              </section>
            )}
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Paystack checkout (test mode).</strong> Use Paystack test payment details only; no real money is charged.
              </AlertDescription>
            </Alert>
            {b.payment_status === "paid" ? (
              <Button asChild className="w-full">
                <Link to={accountView("receipts")}>View my receipts</Link>
              </Button>
            ) : b.status !== "pending" ? (
              <p className="text-sm text-muted-foreground">
                This booking can no longer be paid.
              </p>
            ) : b.total_amount == null ? (
              <p className="text-sm text-muted-foreground">
                This facility has no price yet. CSLC will contact you to confirm
                the amount.
              </p>
            ) : (
              <div className="space-y-3">
                {b.payment_status === "failed" && (
                  <Alert variant="destructive">
                    <AlertDescription>
                      The last payment failed. You can try again.
                    </AlertDescription>
                  </Alert>
                )}
                <div className="space-y-1.5">
                  <Label htmlFor="ph">Phone number</Label>
                  <Input
                    id="ph"
                    inputMode="tel"
                    placeholder="07XX XXX XXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
                <Button
                  className="w-full"
                  disabled={pay.isPending || !phone}
                  onClick={run}
                >
                  {pay.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Smartphone className="h-4 w-4" />
                  )}{" "}
                  Pay with Paystack (Test) · {kes(b.total_amount)}
                </Button>
                {pay.error && <p role="alert" className="text-sm text-destructive">{pay.error.message}</p>}
              </div>
            )}
            <Link
              to={accountView("bookings")}
              className="block text-center text-sm text-primary hover:underline"
            >
              Go to my bookings
            </Link>
          </div>
        )}
      </main>
    </div>
  );
};
export default CheckoutPage;
