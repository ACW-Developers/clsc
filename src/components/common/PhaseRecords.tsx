import { useState } from "react";
import { ChevronLeft, ChevronRight, HeartHandshake, Loader2, Search, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useOrders } from "@/hooks/bookshop/useOrders";
import { useDonations } from "@/hooks/programmes/useDonations";
import { useAction } from "@/hooks/useHospitality";
import { ordersService, orderStatuses, type OrderStatus } from "@/services/bookshop/orders";
import { donationsService } from "@/services/programmes/donations";
import { kes } from "@/lib/booking";
import { Link } from "react-router-dom";
import { useBookshopReceipts } from "@/hooks/bookshop/useCatalog";
import { bookshopReceiptUrl } from "@/routes/paths";
import { branchName } from "@/services/bookshop/catalog";

type RecordRow = { id: string; user_id: string; reference: string; description: string; amount: number; status: string; admin_notes: string | null; created_at: string };

/** Future-phase records reuse current authentication; payment state remains server-owned. */
export function PhaseRecords({ kind, management = false }: { kind: "orders" | "donations"; management?: boolean }) {
  const orders = useOrders(management && kind === "orders");
  const donations = useDonations(management && kind === "donations");
  const query = kind === "orders" ? orders : donations;
  const receipts = useBookshopReceipts();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<RecordRow | null>(null);
  const [status, setStatus] = useState<OrderStatus>("pending");
  const [notes, setNotes] = useState("");
  const save = useAction(async (row: RecordRow) => {
    if (kind === "orders") return ordersService.update(row.id, status, notes);
    return donationsService.updateNotes(row.id, notes);
  }, [kind], "Record updated");
  const Icon = kind === "orders" ? ShoppingBag : HeartHandshake;
  const statuses = kind === "orders" ? orderStatuses : ["pending", "received", "cancelled"];
  const rows = (query.data ?? []).filter((row) =>
    (filter === "all" || row.status === filter) &&
    `${row.reference} ${row.description} ${management ? row.user_id : ""}`.toLowerCase().includes(search.toLowerCase())
  );
  const current = Math.min(page, Math.max(0, Math.ceil(rows.length / 10) - 1));

  return <section className="space-y-4" aria-label={management ? `${kind} management records` : `My ${kind} records`}>
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative min-w-0 flex-1 basis-48">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" aria-hidden="true" />
        <Input className="pl-9" aria-label={`Search ${kind}`} placeholder={`Search ${kind}`} value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} />
      </div>
      <Select value={filter} onValueChange={(value) => { setFilter(value); setPage(0); }}>
        <SelectTrigger className="w-40" aria-label={`Filter ${kind} by status`}><SelectValue /></SelectTrigger>
        <SelectContent><SelectItem value="all">All statuses</SelectItem>{statuses.map((s) => <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>)}</SelectContent>
      </Select>
    </div>
    {query.isLoading ? <div role="status" className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /><span className="sr-only">Loading {kind}</span></div>
      : query.error ? <Alert variant="destructive"><AlertDescription>{query.error.message}</AlertDescription></Alert>
      : !rows.length ? <div className="border-y py-12 text-center"><Icon className="mx-auto mb-3 h-8 w-8 text-muted-foreground" /><h2 className="font-semibold">{query.data?.length ? "No matching records" : `No ${kind} yet`}</h2><p className="mt-1 text-sm text-muted-foreground">{query.data?.length ? "No records match these filters." : management ? `No ${kind} have been recorded.` : kind === "orders" ? "Your bookshop orders will appear here." : "Your programme donations will appear here."}</p></div>
      : <>
        <div className="divide-y border-y">
          {rows.slice(current * 10, current * 10 + 10).map((row) => <div key={row.id} className="flex min-w-0 flex-wrap items-center justify-between gap-3 py-4">
            <div className="min-w-0 flex-1 basis-48"><p className="break-all font-semibold">{row.reference}</p><p className="break-words text-sm text-muted-foreground">{row.description}</p><p className="text-xs text-muted-foreground">{new Date(row.created_at).toLocaleDateString()}</p>{management && <p className="break-all text-xs text-muted-foreground">Customer ID: {row.user_id}</p>}</div>
            <div className="flex flex-wrap items-center gap-3"><span className="font-semibold">{kes(row.amount)}</span><Badge variant="secondary" className="capitalize">{row.status}</Badge>{kind === "orders" && receipts.data?.filter(r => r.order_id === row.id).map(r => <Button key={r.id} asChild variant="outline" size="sm"><Link to={bookshopReceiptUrl(r.id)}>Receipt · {branchName(r.branch)}</Link></Button>)}<Button variant="outline" size="sm" onClick={() => { setSelected(row); setNotes(row.admin_notes ?? ""); const value = orderStatuses.find((s) => s === row.status); setStatus(value ?? "pending"); }}>View</Button></div>
          </div>)}
        </div>
        <div className="flex items-center justify-end gap-3"><span className="text-sm text-muted-foreground">{current + 1} / {Math.ceil(rows.length / 10)}</span><Button size="icon" variant="outline" aria-label="Previous page" disabled={current === 0} onClick={() => setPage(current - 1)}><ChevronLeft className="h-4 w-4" /></Button><Button size="icon" variant="outline" aria-label="Next page" disabled={(current + 1) * 10 >= rows.length} onClick={() => setPage(current + 1)}><ChevronRight className="h-4 w-4" /></Button></div>
      </>}
    <Dialog open={!!selected} onOpenChange={(open) => { if (!open) setSelected(null); }}><DialogContent className="max-w-[calc(100%-8px)] sm:max-w-lg"><DialogHeader><DialogTitle>{selected?.reference}</DialogTitle></DialogHeader>{selected && <div className="space-y-4"><p className="break-words">{selected.description}</p><p className="font-semibold">{kes(selected.amount)}</p>{management ? <form className="space-y-4" onSubmit={async (e) => { e.preventDefault(); await save.mutateAsync(selected).then(() => setSelected(null)).catch(() => undefined); }}>
      {kind === "orders" && <div className="space-y-2"><Label htmlFor="record-status">Order status</Label><Select value={status} onValueChange={(value) => { const next = orderStatuses.find((s) => s === value); if (next) setStatus(next); }}><SelectTrigger id="record-status"><SelectValue /></SelectTrigger><SelectContent>{orderStatuses.map((s) => <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>)}</SelectContent></Select></div>}
      <div className="space-y-2"><Label htmlFor="record-notes">Internal notes</Label><Textarea id="record-notes" value={notes} onChange={(e) => setNotes(e.target.value)} /></div><Button type="submit" disabled={save.isPending}>{save.isPending && <Loader2 className="h-4 w-4 animate-spin" />}Save changes</Button>
    </form> : <Badge variant="secondary" className="capitalize">{selected.status}</Badge>}</div>}</DialogContent></Dialog>
  </section>;
}