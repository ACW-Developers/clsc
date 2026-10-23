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
  const bookingId = r.data?.booking_id;
  const b = useQuery({
    queryKey: ["bookings", "one", r.data?.booking_id],
    queryFn: () => bookingId ? svc.getBooking(bookingId) : Promise.resolve(null),
    enabled: !!bookingId,
  });
  const rc = r.data;
  const download = () => {
    if (!rc) return;
    const copy = document.getElementById("receipt")?.cloneNode(true) as HTMLElement | undefined;
    copy?.querySelectorAll("img").forEach((img) => { img.src = new URL(img.src, window.location.origin).href; });
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>${rc.receipt_number}</title><style>body{font:13px monospace;margin:24px}article{max-width:320px;margin:auto}header{text-align:center}img{max-width:230px;height:auto}dl{display:grid;grid-template-columns:1fr 1fr;gap:10px}dd{margin:0;text-align:right;overflow-wrap:anywhere}.receipt-total{display:flex;justify-content:space-between;border-block:1px dashed;padding:16px 0;font-weight:bold}footer{text-align:center}h1{font-size:18px}</style></head><body>${copy?.outerHTML ?? ""}</body></html>`;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([html], { type: "text/html" }));
    a.download = `${rc?.receipt_number}.html`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  return (
    <div className="min-h-screen bg-muted py-10 print:bg-card print:py-0">
      <div className="container max-w-lg">
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
            <article id="receipt" className="pos-receipt mx-auto max-w-sm border bg-card p-5 shadow-card sm:p-7 print:border-0 print:shadow-none">
              <header className="border-b border-dashed pb-5 text-center">
                <BrandLogo className="mx-auto h-16 max-w-full object-contain" />
                <p className="mt-3 text-xs text-muted-foreground">{site.location}<br />{site.phone}</p>
                <h1 className="mt-4 text-lg font-bold">PAYMENT RECEIPT</h1>
                <p className="mt-1 text-xs">{rc.receipt_number}</p>
                <p className="mt-1 text-xs text-muted-foreground">{new Date(rc.created_at).toLocaleString()}</p>
              </header>
              <dl className="mt-5 grid grid-cols-[1fr_1.3fr] gap-x-3 gap-y-3 text-xs">
                <dt className="text-muted-foreground">Facility</dt><dd className="text-right">{b.data?.sub_services?.services?.name} — {b.data?.sub_services?.name}</dd>
                <dt className="text-muted-foreground">Dates</dt><dd className="text-right">{b.data?.start_date} → {b.data?.end_date}</dd>
                <dt className="text-muted-foreground">Guests</dt><dd className="text-right">{b.data?.guests}</dd>
                 {b.data?.start_time && <><dt className="text-muted-foreground">Time</dt><dd className="text-right">{b.data.start_time.slice(0, 5)}{b.data.end_time ? ` – ${b.data.end_time.slice(0, 5)}` : ""}</dd></>}
                <dt className="text-muted-foreground">Payment method</dt><dd className="text-right">{rc.method}</dd>
                <dt className="text-muted-foreground">Phone</dt><dd className="text-right">{rc.phone}</dd>
                <dt className="text-muted-foreground">Simulation reference</dt><dd className="text-right">{rc.reference}</dd>
              </dl>
              {b.data?.notes && <section className="mt-4 border-t border-dashed pt-3 text-xs"><h2 className="font-bold">Booking details</h2><p className="mt-1 whitespace-pre-line break-words">{b.data.notes}</p></section>}
              <div className="receipt-total mt-5 flex justify-between gap-3 border-y border-dashed py-4 text-base font-bold">
                <span>Amount paid</span><span className="text-primary">{kes(rc.amount)}</span>
              </div>
              <p className="mt-5 text-center text-xs">
                Test receipt: this payment was simulated and is not a real M-Pesa transaction.
              </p>
              <footer className="mt-4 text-center text-xs text-muted-foreground">Thank you for choosing CSLC.<br />{site.email}</footer>
            </article>
          </>
        )}
      </div>
    </div>
  );
};
export default ReceiptPage;
