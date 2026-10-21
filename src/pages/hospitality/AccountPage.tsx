import { useMemo, useState, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { CalendarCheck, Loader2 } from "lucide-react";
import { SiteHeader } from "@/components/common/SiteHeader";
import { SiteFooter } from "@/components/common/SiteFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAction, useBookedRanges, useMyBookings, useServices, useSubServices } from "@/hooks/useHospitality";
import { hospitalityService as svc } from "@/services/hospitality";

const today = () => new Date().toISOString().slice(0, 10);

const AccountPage = () => {
  const [params] = useSearchParams();
  const services = useServices();
  const subs = useSubServices();
  const mine = useMyBookings();
  const [f, setF] = useState({ sub: "", start: "", end: "", guests: "1", notes: "" });
  const [err, setErr] = useState("");
  const ranges = useBookedRanges(f.sub || undefined);
  const create = useAction(svc.createBooking, ["bookings", "ranges"], "Booking request sent");
  const cancel = useAction((id: string) => svc.updateBookingStatus(id, "cancelled"), ["bookings", "ranges"], "Booking cancelled");

  const available = (subs.data ?? []).filter((s) => s.is_available && s.is_published);
  const svcName = (id: string) => services.data?.find((s) => s.id === id)?.name ?? "";
  const clash = useMemo(() => f.start && f.end && (ranges.data ?? []).some((r) => r.start_date <= f.end && r.end_date >= f.start), [f.start, f.end, ranges.data]);

  const submit = (e: FormEvent) => {
    e.preventDefault(); setErr("");
    if (!f.sub || !f.start || !f.end) return setErr("Choose a facility and dates");
    if (f.end < f.start) return setErr("End date must be on or after start date");
    if (clash) return setErr("Those dates are already taken for this facility");
    const g = Number(f.guests);
    if (!Number.isInteger(g) || g < 1 || g > 10000) return setErr("Enter a valid number of guests");
    create.mutate({ sub_service_id: f.sub, start_date: f.start, end_date: f.end, guests: g, notes: f.notes.trim().slice(0, 1000) || undefined },
      { onSuccess: () => setF({ sub: "", start: "", end: "", guests: "1", notes: "" }) });
  };

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <div className="container grid flex-1 gap-8 py-10 lg:grid-cols-[1fr_1.2fr]">
        <section id="book" className="rounded-2xl border bg-card p-6 shadow-card" aria-label="Book">
          <h1 className="flex items-center gap-2 text-2xl font-bold"><CalendarCheck className="h-6 w-6 text-primary" /> Book Now</h1>
          <p className="mb-5 text-sm text-muted-foreground">{params.get("book") ? "Pick a facility and dates. Availability updates live." : "Request a new booking."}</p>
          {available.length === 0 && !subs.isLoading ? (
            <Alert><AlertDescription>No facilities are open for booking yet. Please check back soon.</AlertDescription></Alert>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-1.5"><Label htmlFor="sub">Facility</Label>
                <select id="sub" value={f.sub} onChange={(e) => setF({ ...f, sub: e.target.value })} className="h-11 w-full rounded-md border bg-background px-3 text-sm">
                  <option value="">Select…</option>
                  {available.map((s) => <option key={s.id} value={s.id}>{svcName(s.service_id)} — {s.name}{s.price != null ? ` (KES ${s.price} ${s.price_unit})` : ""}</option>)}
                </select>
              </div>
              {f.sub && (
                <div className="rounded-lg bg-muted p-3 text-xs">
                  <p className="font-semibold">Already reserved dates</p>
                  {ranges.isLoading ? "Checking…" : ranges.data?.length ? ranges.data.map((r) => <p key={r.start_date + r.end_date}>{r.start_date} → {r.end_date}</p>) : <p>All upcoming dates are open.</p>}
                </div>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5"><Label htmlFor="s">Start</Label><Input id="s" type="date" min={today()} value={f.start} onChange={(e) => setF({ ...f, start: e.target.value })} /></div>
                <div className="space-y-1.5"><Label htmlFor="e">End</Label><Input id="e" type="date" min={f.start || today()} value={f.end} onChange={(e) => setF({ ...f, end: e.target.value })} /></div>
              </div>
              {clash && <p className="text-xs text-destructive">Those dates overlap an existing reservation.</p>}
              <div className="space-y-1.5"><Label htmlFor="g">Guests</Label><Input id="g" type="number" min={1} value={f.guests} onChange={(e) => setF({ ...f, guests: e.target.value })} /></div>
              <div className="space-y-1.5"><Label htmlFor="n">Notes</Label><Textarea id="n" maxLength={1000} value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></div>
              {err && <Alert variant="destructive"><AlertDescription>{err}</AlertDescription></Alert>}
              <Button type="submit" disabled={create.isPending} className="w-full">{create.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Request Booking</Button>
            </form>
          )}
        </section>
        <section aria-label="My bookings">
          <h2 className="mb-4 text-2xl font-bold">My Bookings</h2>
          {mine.isLoading ? <Loader2 className="h-5 w-5 animate-spin text-primary" /> : mine.error ? <Alert variant="destructive"><AlertDescription>{(mine.error as Error).message}</AlertDescription></Alert> : !mine.data?.length ? (
            <p className="rounded-2xl border border-dashed p-8 text-center text-muted-foreground">You have no bookings yet.</p>
          ) : (
            <div className="grid gap-3">
              {mine.data.map((b) => (
                <div key={b.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-4">
                  <div>
                    <p className="font-semibold">{b.sub_services?.services?.name} — {b.sub_services?.name}</p>
                    <p className="text-sm text-muted-foreground">{b.start_date} → {b.end_date} · {b.guests} guest(s)</p>
                    {b.admin_notes && <p className="text-xs text-muted-foreground">Note from CSLC: {b.admin_notes}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={b.status === "confirmed" ? "default" : b.status === "rejected" || b.status === "cancelled" ? "destructive" : "secondary"} className="capitalize">{b.status}</Badge>
                    {(b.status === "pending" || b.status === "confirmed") && <Button size="sm" variant="outline" disabled={cancel.isPending} onClick={() => cancel.mutate(b.id)}>Cancel</Button>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
      <SiteFooter />
    </div>
  );
};
export default AccountPage;
