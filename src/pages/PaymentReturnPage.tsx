import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { SiteHeader } from "@/components/common/SiteHeader";
import { Button } from "@/components/ui/button";
import { paymentsService } from "@/services/payments";
import { useCart } from "@/hooks/bookshop/useCart";
import { paths, receiptUrl, bookshopReceiptUrl, ticketUrl, donationReceiptUrl } from "@/routes/paths";
export default function PaymentReturnPage() {
  const [params] = useSearchParams();
  const reference = params.get("reference") ?? params.get("trxref") ?? sessionStorage.getItem("cslc-payment-reference") ?? "";
  const nav = useNavigate(), client = useQueryClient();
  const cart = useCart();
  const q = useQuery({ queryKey: ["paymentVerification", reference], queryFn: () => paymentsService.verify(reference), enabled: !!reference, retry: false, staleTime: Infinity });
  useEffect(() => {
    const payment = q.data;
    if (payment?.status !== "completed" || !payment.id) return;
    sessionStorage.removeItem("cslc-payment-reference");
    if (payment.kind === "bookshop") cart.clear();
    void client.invalidateQueries();
    const url = { booking: receiptUrl, bookshop: bookshopReceiptUrl, event: ticketUrl, donation: donationReceiptUrl }[payment.kind];
    nav(url(payment.id), { replace: true });
  }, [q.data, client, nav]);
  return <div className="min-h-screen bg-background"><SiteHeader /><main className="container max-w-xl space-y-5 py-16 text-center">
    <h1 className="text-2xl font-bold">Paystack test payment</h1>
    {q.isFetching ? <><Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" /><p>Checking your payment…</p></> : <>
      <p role="status" className="text-muted-foreground">{q.data?.status === "review" ? "Your test payment was verified, but availability or pricing changed. CSLC must review it before issuing a receipt. Do not pay again." : q.error?.message ?? "No payment reference was found. No receipt has been issued."}</p>
      {reference && q.data?.status !== "review" && <Button onClick={() => void q.refetch()}>Check payment again</Button>}
      <Button asChild variant="outline"><Link to={paths.account}>My dashboard</Link></Button>
    </>}
  </main></div>;
}