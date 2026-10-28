import { useMemo, useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  CalendarCheck,
  Check,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Users,
} from "lucide-react";

import { SiteHeader } from "@/components/common/SiteHeader";
import { SiteFooter } from "@/components/common/SiteFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/hooks/useAuth";
import {
  useAction,
  useBookedRanges,
  useServices,
  useSubServices,
} from "@/hooks/useHospitality";
import { hospitalityService as svc } from "@/services/hospitality";
import { checkoutUrl, paths, serviceUrl } from "@/routes/paths";
import {
  estimateTotal,
  kes,
  nextAvailable,
  nights,
  overlaps,
} from "@/lib/booking";
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
  const [requests, setRequests] = useState<Record<string, string>>({});
  const [err, setErr] = useState("");

  const category = categoryConfig(slug);
  const create = useAction(svc.createBooking, ["bookings", "ranges"]);

  const [f, setF] = useState({
    start: "",
    end: "",
    startTime: "",
    endTime: "",
    guests: "1",
    notes: "",
  });

  const fac = subs.data?.find((s) => s.id === id);
  const parent = services.data?.find((s) => s.id === fac?.service_id);
  const minDate = addDays(fac?.min_notice_days ?? 0);

  const next = useMemo(
    () => nextAvailable(ranges.data ?? [], minDate),
    [ranges.data, minDate],
  );

  const clash = Boolean(
    f.start && f.end && overlaps(ranges.data ?? [], f.start, f.end),
  );

  const total = fac
    ? estimateTotal(
        fac.price,
        fac.price_unit,
        f.start,
        f.end,
        Number(f.guests) || 1,
      )
    : null;

  if (subs.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!fac || !fac.is_published) return <NotFoundPage />;

  const gallery = fac.images.length
    ? fac.images
    : fac.image_url
      ? [fac.image_url]
      : [];

  // Switch images without creating a horizontal scrollbar.
  const showImage = (index: number) => {
    setImg((index + gallery.length) % gallery.length);
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setErr("");

    if (!f.start || !f.end) {
      return setErr("Choose your start and end dates");
    }

    if (f.end < f.start) {
      return setErr("End date must be on or after start date");
    }

    if (clash) {
      return setErr("Those dates are already reserved. Try from " + next);
    }

    const g = Number(f.guests);

    if (!Number.isInteger(g) || g < 1) {
      return setErr("Enter a valid number of guests");
    }

    if (fac.capacity && g > fac.capacity) {
      return setErr(`This facility holds at most ${fac.capacity} guests`);
    }

    create.mutate(
      {
        sub_service_id: fac.id,
        start_date: f.start,
        end_date: f.end,
        start_time: f.startTime || undefined,
        end_time: f.endTime || undefined,
        guests: g,
        notes:
          [
            ...category.requests
              .filter((key) => requests[key]?.trim())
              .map((key) => `${key}: ${requests[key].trim()}`),
            f.notes.trim(),
          ]
            .filter(Boolean)
            .join("\n")
            .slice(0, 1000) || undefined,
      },
      { onSuccess: (b) => nav(checkoutUrl(b.id)) },
    );
  };

  return (
    <div className="flex min-h-screen min-w-0 flex-col overflow-x-hidden">
      <SiteHeader />

      <main className="container min-w-0 flex-1 py-8">
        <Link
          to={serviceUrl(slug)}
          className="mb-4 inline-flex items-center gap-1 text-sm text-primary hover:underline"
        >
          <ChevronLeft className="h-4 w-4" />
          {parent?.name ?? "Back"}
        </Link>

        <div className="grid min-w-0 items-start gap-8 lg:grid-cols-[1.4fr_1fr]">
          {/* Facility details and image gallery */}
          <div className="min-w-0 space-y-6">
            <div className="relative min-w-0 overflow-hidden rounded-xl bg-muted shadow-card">
              {/* Main image slider: no horizontal scrollbar */}
              <div
                className="relative aspect-[16/10] w-full overflow-hidden"
                aria-label="Facility photo gallery"
                aria-roledescription="carousel"
              >
                {gallery.length > 0 ? (
                  <div
                    className="flex h-full transition-transform duration-500 ease-in-out motion-reduce:transition-none"
                    style={{
                      transform: `translateX(-${img * 100}%)`,
                    }}
                  >
                    {gallery.map((photo, i) => (
                      <div
                        key={`${photo}-${i}`}
                        className="h-full w-full min-w-full shrink-0"
                        aria-hidden={i !== img}
                      >
                        <img
                          src={photo}
                          alt={`${fac.name} photo ${i + 1}`}
                          loading={i === 0 ? "eager" : "lazy"}
                          decoding="async"
                          width={1200}
                          height={750}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                    No facility images available
                  </div>
                )}

                {gallery.length > 1 && (
                  <>
                    <Button
                      size="icon"
                      variant="secondary"
                      className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full shadow-md"
                      aria-label="Previous photo"
                      onClick={() =>
                        showImage((img - 1 + gallery.length) % gallery.length)
                      }
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </Button>

                    <Button
                      size="icon"
                      variant="secondary"
                      className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full shadow-md"
                      aria-label="Next photo"
                      onClick={() => showImage((img + 1) % gallery.length)}
                    >
                      <ChevronRight className="h-5 w-5" />
                    </Button>

                    <div className="absolute bottom-3 right-3 rounded-full bg-black/65 px-3 py-1 text-xs font-medium text-white">
                      {img + 1} / {gallery.length}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Responsive thumbnail grid: wraps instead of scrolling */}
            {gallery.length > 1 && (
              <div
                className="grid grid-cols-4 gap-2 sm:grid-cols-5 md:grid-cols-4 xl:grid-cols-5"
                aria-label="Choose facility photo"
              >
                {gallery.map((photo, i) => (
                  <button
                    type="button"
                    key={`${photo}-${i}`}
                    onClick={() => showImage(i)}
                    aria-label={`Show photo ${i + 1}`}
                    aria-pressed={i === img}
                    className={cn(
                      "group relative aspect-[5/3] min-w-0 overflow-hidden rounded-lg border-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                      i === img
                        ? "border-primary ring-1 ring-primary/20"
                        : "border-transparent opacity-75 hover:border-primary/50 hover:opacity-100",
                    )}
                  >
                    <img
                      src={photo}
                      alt={`Facility thumbnail ${i + 1}`}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Facility information */}
            <div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                {fac.name}
              </h1>

              <p className="mt-2 text-lg font-semibold text-primary">
                {kes(fac.price)}{" "}
                {fac.price != null && (
                  <span className="text-sm font-normal text-muted-foreground">
                    {fac.price_unit}
                  </span>
                )}
              </p>

              <p className="mt-4 whitespace-pre-line leading-7 text-muted-foreground">
                {fac.description}
              </p>
            </div>

            {/* Capacity and availability */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border bg-card p-4">
                <p className="mb-2 text-sm font-semibold">
                  {category.capacity}
                </p>

                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4 shrink-0 text-primary" />
                  {fac.capacity ? `Up to ${fac.capacity}` : "Ask CSLC"}
                </p>
              </div>

              <div className="rounded-xl border bg-card p-4">
                <p className="mb-2 text-sm font-semibold">Availability</p>

                <p className="text-sm text-muted-foreground">
                  {fac.is_available
                    ? `Next available: ${next}`
                    : "Not taking bookings right now"}
                </p>
              </div>
            </div>

            {/* Additional details */}
            {fac.details &&
              typeof fac.details === "object" &&
              !Array.isArray(fac.details) && (
                <dl className="grid gap-4 border-y py-5 sm:grid-cols-2">
                  {category.information.map((key) => {
                    const value = (fac.details as Record<string, unknown>)[key];

                    return typeof value === "string" && value ? (
                      <div key={key} className="min-w-0">
                        <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          {key}
                        </dt>
                        <dd className="mt-1 break-words text-sm">{value}</dd>
                      </div>
                    ) : null;
                  })}
                </dl>
              )}

            {/* Amenities */}
            {fac.amenities.length > 0 && (
              <div>
                <p className="mb-3 font-semibold">Amenities</p>

                <ul className="grid gap-3 sm:grid-cols-2">
                  {fac.amenities.map((amenity) => (
                    <li
                      key={amenity}
                      className="flex min-w-0 items-start gap-2 text-sm"
                    >
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{amenity}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Booking panel */}
          <aside
            className="relative z-10 h-fit min-w-0 overflow-hidden rounded-xl border bg-card p-4 shadow-card sm:p-6 lg:sticky lg:top-24"
            aria-label="Book this facility"
          >
            <div className="-mx-4 -mt-4 mb-5 border-b bg-primary/5 p-4 sm:-mx-6 sm:-mt-6 sm:p-6">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-primary">
                {parent?.name}
              </p>

              <h2 className="flex items-center gap-2 text-xl font-bold">
                <CalendarCheck className="h-5 w-5 shrink-0 text-primary" />
                Book this facility
              </h2>

              <p className="mt-2 text-sm text-muted-foreground">
                {kes(fac.price)} {fac.price != null && fac.price_unit}
              </p>
            </div>

            {/* Existing paid reservations */}
            {ranges.data && ranges.data.length > 0 && (
              <div className="mb-4 rounded-lg bg-muted p-3 text-xs">
                <p className="mb-2 font-semibold">Reserved (paid) dates</p>

                <div className="space-y-1">
                  {ranges.data.map((r) => (
                    <p key={r.start_date + r.end_date}>
                      {r.start_date} → {r.end_date}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {!fac.is_available ? (
              <Alert className="mt-4">
                <AlertDescription>
                  This facility is not taking bookings at the moment.
                </AlertDescription>
              </Alert>
            ) : !user ? (
              <div className="mt-4 space-y-3">
                <p className="text-sm text-muted-foreground">
                  Sign in or create an account to book.
                </p>

                <Button asChild className="w-full">
                  <Link
                    to={`${paths.auth}?next=${encodeURIComponent(loc.pathname)}`}
                  >
                    Sign in to book
                  </Link>
                </Button>

                <Button asChild variant="outline" className="w-full">
                  <Link
                    to={`${paths.auth}?mode=signup&next=${encodeURIComponent(loc.pathname)}`}
                  >
                    Create account
                  </Link>
                </Button>
              </div>
            ) : (
              <form onSubmit={submit} className="mt-4 space-y-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="min-w-0 space-y-1.5">
                    <Label htmlFor="fs">{category.start}</Label>
                    <Input
                      id="fs"
                      type="date"
                      min={minDate}
                      value={f.start}
                      onChange={(e) => setF({ ...f, start: e.target.value })}
                      required
                    />
                  </div>

                  <div className="min-w-0 space-y-1.5">
                    <Label htmlFor="fe">{category.end}</Label>
                    <Input
                      id="fe"
                      type="date"
                      min={f.start || minDate}
                      value={f.end}
                      onChange={(e) => setF({ ...f, end: e.target.value })}
                      required
                    />
                  </div>

                  <div className="min-w-0 space-y-1.5">
                    <Label htmlFor="ts">
                      Start time{" "}
                      <span className="text-muted-foreground">(optional)</span>
                    </Label>
                    <Input
                      id="ts"
                      type="time"
                      value={f.startTime}
                      onChange={(e) =>
                        setF({ ...f, startTime: e.target.value })
                      }
                    />
                  </div>

                  <div className="min-w-0 space-y-1.5">
                    <Label htmlFor="te">
                      End time{" "}
                      <span className="text-muted-foreground">(optional)</span>
                    </Label>
                    <Input
                      id="te"
                      type="time"
                      value={f.endTime}
                      onChange={(e) => setF({ ...f, endTime: e.target.value })}
                    />
                  </div>
                </div>

                {clash && (
                  <p className="text-xs text-destructive">
                    Those dates overlap a paid reservation. Next open date:{" "}
                    {next}
                  </p>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="fg">{category.capacity}</Label>
                  <Input
                    id="fg"
                    type="number"
                    min={1}
                    max={fac.capacity ?? undefined}
                    value={f.guests}
                    onChange={(e) => setF({ ...f, guests: e.target.value })}
                    required
                  />
                </div>

                {category.requests.map((key) => (
                  <div key={key} className="space-y-1.5">
                    <Label htmlFor={`request-${key}`}>{key}</Label>
                    <Input
                      id={`request-${key}`}
                      maxLength={180}
                      value={requests[key] ?? ""}
                      onChange={(e) =>
                        setRequests({
                          ...requests,
                          [key]: e.target.value,
                        })
                      }
                    />
                  </div>
                ))}

                <div className="space-y-1.5">
                  <Label htmlFor="fn">Notes / special requests</Label>
                  <Textarea
                    id="fn"
                    maxLength={1000}
                    value={f.notes}
                    onChange={(e) => setF({ ...f, notes: e.target.value })}
                  />
                </div>

                {/* Booking cost summary */}
                <div className="rounded-xl bg-secondary p-4 text-sm">
                  <div className="flex justify-between gap-3">
                    <span>Days</span>
                    <span>
                      {f.start && f.end && f.end >= f.start
                        ? nights(f.start, f.end)
                        : "–"}
                    </span>
                  </div>

                  <div className="mt-2 flex items-start justify-between gap-3 text-base font-bold">
                    <span>Total</span>
                    <span className="text-right text-primary">
                      {total != null
                        ? kes(total)
                        : fac.price == null
                          ? "Price on request"
                          : "–"}
                    </span>
                  </div>
                </div>

                {err && (
                  <Alert variant="destructive">
                    <AlertDescription>{err}</AlertDescription>
                  </Alert>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={create.isPending || clash}
                >
                  {create.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Review & pay
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
