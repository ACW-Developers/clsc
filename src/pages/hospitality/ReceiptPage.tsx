import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Download, Loader2, Printer } from "lucide-react";
import { BrandLogo } from "@/components/common/BrandLogo";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { hospitalityService as svc } from "@/services/hospitality";
import { site } from "@/config/site";
import { accountView } from "@/routes/paths";
import { kes } from "@/lib/booking";

const ReceiptPage = () => {
  const { id = "" } = useParams();
  const r = useQuery({ queryKey: ["receipts", "one", id], queryFn: () => svc.getReceipt(id) });
  const b = useQuery({
    queryKey: ["bookings", "one", r.data?.booking_id],
    queryFn: () => svc.getBooking(r.data!.booking_id),
    enabled: !!r.data,
  });
  const rc = r.data;
  const download = () => {
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>${rc?.receipt_number}</title></head><body>${document.getElementById("receipt")?.outerHTML ?? ""}</body></html>`;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([html], { type: "text/html" }));
    a.download = `${rc?.receipt_number}.html`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-muted py-10 print:bg-card print:py-0">
      <div className="container max-w-2xl">
        {r.isLoading ? (
          <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
        ) : !rc ? (
          <Alert variant="destructive"><AlertDescription>Receipt not found.</AlertDescription></Alert>
        ) : (
          <>
            <div className="mb-4 flex flex-wrap justify-between gap-2 print:hidden">
              <Button asChild variant="outline"><Link to={accountView("receipts")}>Back to receipts</Link></Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={download}><Download className="h-4 w-4" /> Download</Button>
                <Button onClick={() => window.print()}><Printer className="h-4 w-4" /> Print</Button>
              </div>
            </div>
            <article id="receipt" className="rounded-2xl border bg-card p-8 shadow-card print:border-0 print:shadow-none" style={{ fontFamily: "sans-serif" }}>
              <div className="flex flex-wrap items-start justify-between gap-4 border-b pb-5">
                <BrandLogo className="h-12" />
                <div className="text-right text-sm">
                  <p className="text-lg font-bold">RECEIPT</p>
                  <p>{rc.receipt_number}</p>
                  <p className="text-muted-foreground">{new Date(rc.created_at).toLocaleString()}</p>
                </div>
              </div>
              <dl className="mt-5 grid grid-cols-2 gap-y-2 text-sm">
                <dt className="text-muted-foreground">Facility</dt><dd className="text-right">{b.data?.sub_services?.services?.name} — {b.data?.sub_services?.name}</dd>
                <dt className="text-muted-foreground">Dates</dt><dd className="text-right">{b.data?.start_date} → {b.data?.end_date}</dd>
                <dt className="text-muted-foreground">Guests</dt><dd className="text-right">{b.data?.guests}</dd>
                <dt className="text-muted-foreground">Payment method</dt><dd className="text-right">{rc.method}</dd>
                <dt className="text-muted-foreground">Phone</dt><dd className="text-right">{rc.phone}</dd>
                <dt className="text-muted-foreground">Simulation reference</dt><dd className="text-right">{rc.reference}</dd>
              </dl>
              <div className="mt-5 flex justify-between border-t pt-4 text-lg font-bold">
                <span>Amount paid</span><span className="text-primary">{kes(rc.amount)}</span>
              </div>
              <p className="mt-6 rounded-lg bg-secondary p-3 text-xs">
                Test receipt: this payment was simulated and is not a real M-Pesa transaction.
              </p>
              <p className="mt-4 text-center text-xs text-muted-foreground">{site.name} · {site.location} · {site.email} · {site.phone}</p>
            </article>
          </>
        )}
      </div>
    </div>
  );
};
export default ReceiptPage;
