import { useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Receipt as ReceiptIcon, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useReceipts } from "@/hooks/useHospitality";
import { receiptUrl } from "@/routes/paths";
import { kes } from "@/lib/booking";

/** Receipts list; RLS shows customers their own, staff all. */
export function ReceiptsTable() {
  const q = useReceipts();
  const [term, setTerm] = useState("");
  const rows = (q.data ?? []).filter((r) => r.receipt_number.toLowerCase().includes(term.toLowerCase()) || (r.phone ?? "").includes(term));
  if (q.isLoading) return <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />;
  if (q.error) return <p className="text-destructive">{(q.error as Error).message}</p>;
  return (
    <div className="space-y-4">
      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search receipts…" value={term} onChange={(e) => setTerm(e.target.value)} />
      </div>
      {!rows.length ? (
        <p className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">No receipts yet. Receipts appear after a successful (simulated) payment.</p>
      ) : (
        <div className="grid gap-3">
          {rows.map((r) => (
            <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary"><ReceiptIcon className="h-5 w-5 text-primary" /></span>
                <div>
                  <p className="font-semibold">{r.receipt_number}</p>
                  <p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()} · {r.method}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold text-primary">{kes(r.amount)}</span>
                <Button asChild size="sm" variant="outline"><Link to={receiptUrl(r.id)}>View / print</Link></Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
