import { useMemo, useRef, useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { CalendarCheck, Check, ChevronLeft, ChevronRight, Loader2, Users } from "lucide-react";
import { SiteHeader } from "@/components/common/SiteHeader";
import { SiteFooter } from "@/components/common/SiteFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/hooks/useAuth";
import { useAction, useBookedRanges, useServices, useSubServices } from "@/hooks/useHospitality";
import { hospitalityService as svc } from "@/services/hospitality";
import { checkoutUrl, paths, serviceUrl } from "@/routes/paths";
import { estimateTotal, kes, nextAvailable, nights, overlaps } from "@/lib/booking";
import { cn } from "@/lib/utils";
import { categoryConfig } from "@/config/facilityCategories";
import NotFoundPage from "@/pages/NotFoundPage";

const addDays = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};

const FacilityPage = () => {
  const { slug = "", id = "" } = useParams();
  const { user } = useAuth();
  const loc = useLocation();
  const nav = useNavigate();
  const subs = useSubServices();
  const services = useServices();
  const ranges = useBookedRanges(id);
  const [img, setImg] = useState(0);
  const galleryRef = useRef<HTMLDivElement>(null);
  const category = categoryConfig(slug);
  const [requests, setRequests] = useState<Record<string, string>>({});
  const showImage = (index: number) => {
    setImg(index);
    galleryRef.current?.children[index]?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "nearest", inline: "center" });
  };
  const [f, setF] = useState({ start: "", end: "", startTime: "", endTime: "", guests: "1", notes: "" });
  const [err, setErr] = useState("");
  const create = useAction(svc.createBooking, ["bookings", "ranges"]);

  const fac = subs.data?.find((s) => s.id === id);
  const parent = services.data?.find((s) => s.id === fac?.service_id);
  const minDate = addDays(fac?.min_notice_days ?? 0);
  const next = useMemo(() => nextAvailable(ranges.data ?? [], minDate), [ranges.data, minDate]);
  const clash = !!(f.start && f.end && overlaps(ranges.data ?? [], f.start, f.end));
  const total = fac ? estimateTotal(fac.price, fac.price_unit, f.start, f.end, Number(f.guests) || 1) : null;

  if (subs.isLoading) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  if (!fac || !fac.is_published) return <NotFoundPage />;
  const gallery = fac.images.length ? fac.images : fac.image_url ? [fac.image_url] : [];

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setErr("");
    if (!f.start || !f.end) return setErr("Choose your start and end dates");
    if (f.end < f.start) return setErr("End date must be on or after start date");
    if (clash) return setErr("Those dates are already reserved. Try from " + next);
    const g = Number(f.guests);
    if (!Number.isInteger(g) || g < 1) return setErr("Enter a valid number of guests");
    if (fac.capacity && g > fac.capacity) return setErr(`This facility holds at most ${fac.capacity} guests`);
    create.mutate(
      {
        sub_service_id: fac.id,
        start_date: f.start,
        end_date: f.end,
        start_time: f.startTime || undefined,
        end_time: f.endTime || undefined,
        guests: g,
        notes: [...category.requests.filter((key) => requests[key]?.trim()).map((key) => `${key}: ${requests[key].trim()}`), f.notes.trim()].filter(Boolean).join("\n").slice(0, 1000) || undefined,
      },
      { onSuccess: (b) => nav(checkoutUrl(b.id)) },
    );
  };

  return (
    <div className="flex min-h-screen min-w-0 flex-col overflow-x-hidden">
      <SiteHeader />
      <main className="container flex-1 py-8">
        <Link to={serviceUrl(slug)} className="mb-4 inline-flex items-center gap-1 text-sm text-primary hover:underline">
          <ChevronLeft className="h-4 w-4" /> {parent?.name ?? "Back"}
        </Link>
        <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
          <div className="min-w-0 space-y-6">
            <div className="relative overflow-hidden rounded-lg bg-muted shadow-card">
              <div ref={galleryRef} className="flex aspect-[16/10] snap-x snap-mandatory overflow-x-auto" aria-label="Facility photo gallery" onScroll={(e) => { const w = e.currentTarget.clientWidth; if (w) setImg(Math.round(e.currentTarget.scrollLeft / w)); }}>
                {gallery.map((photo, i) => <img key={photo} src={photo} alt={`${fac.name} photo ${i + 1}`} loading={i === 0 ? "eager" : "lazy"} decoding="async" width={1200} height={750} className="h-full w-full shrink-0 snap-center object-cover" />)}
              </div>
              {gallery.length > 1 && (
                <>
                  <Button size="icon" variant="secondary" className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full" aria-label="Previous photo" onClick={() => showImage((img - 1 + gallery.length) % gallery.length)}><ChevronLeft className="h-5 w-5" /></Button>
                  <Button size="icon" variant="secondary" className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full" aria-label="Next photo" onClick={() => showImage((img + 1) % gallery.length)}><ChevronRight className="h-5 w-5" /></Button>
                </>
              )}
            </div>
            {gallery.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {gallery.map((g, i) => (
                  <Button variant="ghost" key={g} onClick={() => showImage(i)} aria-label={`Show photo ${i + 1}`} className={cn("h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2 p-0", i === img ? "border-primary" : "border-transparent opacity-70")}>
                    <img src={g} alt="" className="h-full w-full object-cover" />
                  </Button>
                ))}
              </div>
            )}
            <div>
              <h1 className="text-3xl font-bold">{fac.name}</h1>
              <p className="mt-1 text-lg font-semibold text-primary">{kes(fac.price)} {fac.price != null && <span className="text-sm font-normal text-muted-foreground">{fac.price_unit}</span>}</p>
              <p className="mt-4 whitespace-pre-line text-muted-foreground">{fac.description}</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border bg-card p-4">
                <p className="mb-2 text-sm font-semibold">{category.capacity}</p>
                <p className="flex items-center gap-2 text-sm text-muted-foreground"><Users className="h-4 w-4 text-primary" /> {fac.capacity ? `Up to ${fac.capacity}` : "Ask CSLC"}</p>
              </div>
              <div className="rounded-xl border bg-card p-4">
                <p className="mb-2 text-sm font-semibold">Availability</p>
                <p className="text-sm text-muted-foreground">{fac.is_available ? `Next available: ${next}` : "Not taking bookings right now"}</p>
              </div>
            </div>
            {fac.details && typeof fac.details === "object" && !Array.isArray(fac.details) && <dl className="grid gap-4 border-y py-5 sm:grid-cols-2">{category.information.map((key) => { const value = (fac.details as Record<string, unknown>)[key]; return typeof value === "string" && value ? <div key={key}><dt className="text-xs font-semibold uppercase text-muted-foreground">{key}</dt><dd className="mt-1 text-sm">{value}</dd></div> : null; })}</dl>}
            {fac.amenities.length > 0 && (
              <div>
                <p className="mb-2 font-semibold">Amenities</p>
                <ul className="grid gap-2 sm:grid-cols-2">
                  {fac.amenities.map((a) => <li key={a} className="flex items-center gap-2 text-sm"><Check className="h-4 w-4 text-primary" /> {a}</li>)}
                </ul>
              </div>
            )}
          </div>

          <aside className="min-w-0 h-fit rounded-lg border bg-card p-4 sm:p-6 shadow-card lg:sticky lg:top-24" aria-label="Book this facility">
            <h2 className="flex items-center gap-2 text-xl font-bold"><CalendarCheck className="h-5 w-5 text-primary" /> Book this facility</h2>
            {ranges.data && ranges.data.length > 0 && (
              <div className="mt-3 rounded-lg bg-muted p-3 text-xs">
                <p className="font-semibold">Reserved (paid) dates</p>
                {ranges.data.map((r) => <p key={r.start_date + r.end_date}>{r.start_date} → {r.end_date}</p>)}
              </div>
            )}
            {!fac.is_available ? (
              <Alert className="mt-4"><AlertDescription>This facility is not taking bookings at the moment.</AlertDescription></Alert>
            ) : !user ? (
              <div className="mt-4 space-y-3">
                <p className="text-sm text-muted-foreground">Sign in or create an account to book.</p>
                <Button asChild className="w-full"><Link to={`${paths.auth}?next=${encodeURIComponent(loc.pathname)}`}>Sign in to book</Link></Button>
                <Button asChild variant="outline" className="w-full"><Link to={`${paths.auth}?mode=signup&next=${encodeURIComponent(loc.pathname)}`}>Create account</Link></Button>
              </div>
            ) : (
              <form onSubmit={submit} className="mt-4 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5"><Label htmlFor="fs">{category.start}</Label><Input id="fs" type="date" min={minDate} value={f.start} onChange={(e) => setF({ ...f, start: e.target.value })} /></div>
                  <div className="space-y-1.5"><Label htmlFor="fe">{category.end}</Label><Input id="fe" type="date" min={f.start || minDate} value={f.end} onChange={(e) => setF({ ...f, end: e.target.value })} /></div>
                  <div className="space-y-1.5"><Label htmlFor="ts">Start time <span className="text-muted-foreground">(optional)</span></Label><Input id="ts" type="time" value={f.startTime} onChange={(e) => setF({ ...f, startTime: e.target.value })} /></div>
                  <div className="space-y-1.5"><Label htmlFor="te">End time <span className="text-muted-foreground">(optional)</span></Label><Input id="te" type="time" value={f.endTime} onChange={(e) => setF({ ...f, endTime: e.target.value })} /></div>
                </div>
                {clash && <p className="text-xs text-destructive">Those dates overlap a paid reservation. Next open date: {next}</p>}
                <div className="space-y-1.5"><Label htmlFor="fg">{category.capacity}</Label><Input id="fg" type="number" min={1} max={fac.capacity ?? undefined} value={f.guests} onChange={(e) => setF({ ...f, guests: e.target.value })} /></div>
                {category.requests.map((key) => <div key={key} className="space-y-1.5"><Label htmlFor={`request-${key}`}>{key}</Label><Input id={`request-${key}`} maxLength={180} value={requests[key] ?? ""} onChange={(e) => setRequests({ ...requests, [key]: e.target.value })} /></div>)}
                <div className="space-y-1.5"><Label htmlFor="fn">Notes / special requests</Label><Textarea id="fn" maxLength={1000} value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></div>
                <div className="rounded-xl bg-secondary p-4 text-sm">
                  <div className="flex justify-between"><span>Days</span><span>{f.start && f.end && f.end >= f.start ? nights(f.start, f.end) : "–"}</span></div>
                  <div className="mt-1 flex justify-between text-base font-bold"><span>Total</span><span className="text-primary">{total != null ? kes(total) : fac.price == null ? "Price on request" : "–"}</span></div>
                </div>
                {err && <Alert variant="destructive"><AlertDescription>{err}</AlertDescription></Alert>}
                <Button type="submit" className="w-full" disabled={create.isPending}>
                  {create.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Review & pay
                </Button>
              </form>
            )}
          </aside>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
};
export default FacilityPage;
