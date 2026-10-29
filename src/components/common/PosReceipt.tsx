import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Download, Loader2, Printer } from "lucide-react";
import { BrandLogo } from "@/components/common/BrandLogo";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { site } from "@/config/site";
import { kes } from "@/lib/booking";

export type ReceiptRow = [label: string, value: ReactNode];

interface Props {
  loading?: boolean;
  error?: string | null;
  title: string;
  subtitle?: string;
  number?: string;
  date?: string;
  rows: ReceiptRow[];
  children?: ReactNode;
  totalLabel?: string;
  amount?: number | null;
  note?: string;
  thanks?: string;
  backTo: string;
  backLabel: string;
}

/** Universal CSLC POS receipt used by hospitality, bookshop, tickets and donations. */
export function PosReceipt(p: Props) {
  const download = () => {
    const copy = document.getElementById("receipt")?.cloneNode(true) as
      | HTMLElement
      | undefined;
    copy?.querySelectorAll("img").forEach((img) => {
      img.src = new URL(img.src, window.location.origin).href;
    });
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>${p.number}</title><style>body{font:13px monospace;margin:24px}article{max-width:320px;margin:auto}header{text-align:center}img{max-width:230px;height:auto}dl{display:grid;grid-template-columns:1fr 1fr;gap:10px}dd{margin:0;text-align:right;overflow-wrap:anywhere}.receipt-total{display:flex;justify-content:space-between;border-block:1px dashed;padding:16px 0;font-weight:bold}footer{text-align:center}h1{font-size:18px}</style></head><body>${copy?.outerHTML ?? ""}</body></html>`;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([html], { type: "text/html" }));
    a.download = `${p.number ?? "receipt"}.html`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  return (
    <div className="min-h-screen bg-muted py-10 print:bg-card print:py-0">
      <div className="container max-w-lg">
        {p.loading ? (
          <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
        ) : p.error || !p.number ? (
          <Alert variant="destructive">
            <AlertDescription>{p.error ?? "Receipt not found."}</AlertDescription>
          </Alert>
        ) : (
          <>
            <div className="mb-4 flex flex-wrap justify-between gap-2 print:hidden">
              <Button asChild variant="outline">
                <Link to={p.backTo}>{p.backLabel}</Link>
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={download}>
                  <Download className="h-4 w-4" /> Download
                </Button>
                <Button onClick={() => window.print()}>
                  <Printer className="h-4 w-4" /> Print
                </Button>
              </div>
            </div>
            <article
              id="receipt"
              className="pos-receipt mx-auto max-w-sm border bg-card p-5 shadow-card sm:p-7 print:border-0 print:shadow-none"
            >
              <header className="border-b border-dashed pb-5 text-center">
                <BrandLogo className="mx-auto h-16 max-w-full object-contain" />
                <p className="mt-3 text-xs text-muted-foreground">
                  {site.location}
                  <br />
                  {site.phone}
                </p>
                <h1 className="mt-4 text-lg font-bold">{p.title}</h1>
                {p.subtitle && <p className="text-xs">{p.subtitle}</p>}
                <p className="mt-1 text-xs">{p.number}</p>
                {p.date && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(p.date).toLocaleString("en-KE")}
                  </p>
                )}
              </header>
              <dl className="mt-5 grid grid-cols-[1fr_1.3fr] gap-x-3 gap-y-3 text-xs">
                {p.rows.map(([k, v]) => (
                  <div key={k} className="contents">
                    <dt className="text-muted-foreground">{k}</dt>
                    <dd className="break-words text-right">{v}</dd>
                  </div>
                ))}
              </dl>
              {p.children}
              <div className="receipt-total mt-5 flex justify-between gap-3 border-y border-dashed py-4 text-base font-bold">
                <span>{p.totalLabel ?? "Amount paid"}</span>
                <span className="text-primary">{kes(p.amount)}</span>
              </div>
              <p className="mt-5 text-center text-xs">
                {p.note ??
                  "Test receipt: this payment was simulated and is not a real M-Pesa transaction."}
              </p>
              <footer className="mt-4 text-center text-xs text-muted-foreground">
                {p.thanks ?? "Thank you for choosing CSLC."}
                <br />
                {site.email}
              </footer>
            </article>
          </>
        )}
      </div>
    </div>
  );
}
