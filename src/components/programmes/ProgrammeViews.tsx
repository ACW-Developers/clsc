import { useMemo, useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  CalendarDays,
  Clock,
  Download,
  ExternalLink,
  FileText,
  HeartHandshake,
  History,
  Image as ImageIcon,
  Link2,
  Loader2,
  MapPin,
  ArrowUpRight,
  Music,
  Search,
  Smartphone,
  X,
  ZoomIn,
  Info,
  Ticket,
  Video,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { SiteHeader } from "@/components/common/SiteHeader";
import { SiteFooter } from "@/components/common/SiteFooter";
import { PageContainer } from "@/components/common/PageContainer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useAction } from "@/hooks/useHospitality";
import {
  useEvents,
  useMaterials,
  useReadingHistory,
  useTickets,
} from "@/hooks/programmes/useProgrammes";
import {
  eventDate,
  eventTime,
  programmesService as svc,
  type EventRow,
  type MaterialRow,
} from "@/services/programmes/programmes";
import { kes } from "@/lib/booking";
import { donationReceiptUrl, eventUrl, paths, ticketUrl } from "@/routes/paths";
import hero from "@/assets/banner.jpg";

/** Public page wrapper with the standard CSLC hero, breadcrumb and centred title. */
export function ProgrammeFrame({
  title,
  intro,
  children,
}: {
  title: string;
  intro: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground selection:bg-primary/20">
      <SiteHeader />
      <main className="flex-1">
        <section className="relative isolate overflow-hidden bg-slate-950">
          <img
            src={hero}
            alt=""
            className="absolute inset-0 -z-20 h-full w-full object-cover"
          />
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-slate-950/65 via-slate-950/65 to-slate-950/65" />
          <PageContainer className="relative py-16 text-center text-white sm:py-20 lg:py-32">
            <nav
              aria-label="Breadcrumb"
              className="mb-2 inline-flex items-center gap-2 px-4 py-2 text-md font-bold text-white/80 backdrop-blur sm:text-sm"
            >
              <Link to={paths.home} className="hover:underline">
                Home
              </Link>{" "}
              / Student Programmes / {title}
            </nav>
            <h1 className="text-balance text-3xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              {title}
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-white/80 sm:text-base">
              {intro}
            </p>
          </PageContainer>
        </section>
        <PageContainer className="py-8 sm:py-12 lg:py-14">
          {children}
        </PageContainer>
      </main>
      <SiteFooter />
    </div>
  );
}

const Empty = ({ icon: Icon, text }: { icon: typeof Ticket; text: string }) => (
  <div className="rounded-2xl border border-dashed border-border/80 bg-card/70 px-6 py-12 text-center text-muted-foreground shadow-sm sm:px-10">
    <Icon className="mx-auto mb-3 h-8 w-8" />
    {text}
  </div>
);
const Spinner = () => (
  <div role="status" className="flex justify-center py-12">
    <Loader2 className="h-6 w-6 animate-spin text-primary" />
  </div>
);

export function EventCard({ e }: { e: EventRow }) {
  return (
    <Link
      to={eventUrl(e.id)}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl"
    >
      {/* Event poster */}
      <div className="relative aspect-[12/10] overflow-hidden bg-muted">
        {e.poster_url ? (
          <img
            src={e.poster_url}
            alt={e.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/10 via-muted to-primary/5">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-background shadow-sm">
              <CalendarDays className="h-8 w-8 text-primary" />
            </div>
          </div>
        )}

        {/* Image overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/10" />

        {/* Date badge */}
        <div className="absolute left-4 top-4 flex items-center gap-2 rounded-xl border border-white/20 bg-white/95 px-3 py-2 text-slate-900 shadow-lg backdrop-blur">
          <CalendarDays className="h-4 w-4 text-primary" />
          <span className="text-xs font-bold">{eventDate(e.event_date)}</span>
        </div>

        {/* Event label */}
        <div className="absolute bottom-4 left-4">
          <Badge className="border-0 bg-primary px-3 py-1 text-white shadow-md hover:bg-primary">
            Upcoming Event
          </Badge>
        </div>
      </div>

      {/* Event information */}
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="flex-1 space-y-4">
          {/* Title */}
          <h3 className="line-clamp-2 text-lg font-bold leading-snug tracking-tight transition-colors group-hover:text-primary sm:text-xl">
            {e.title}
          </h3>

          {/* Event details */}
          <div className="space-y-3">
            <div className="flex items-start gap-3 text-sm text-muted-foreground">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <MapPin className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70">
                  Venue
                </p>
                <p className="mt-0.5 line-clamp-1 font-medium text-foreground">
                  {e.venue || "Venue to be announced"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Price and action footer */}
        <div className="mt-5 flex items-center justify-between gap-3 border-t border-border/70 pt-4">
          <div>
            <p className="text-xs font-medium text-muted-foreground">
              Ticket price
            </p>
            <p className="mt-0.5 text-lg font-bold tracking-tight text-primary">
              {Number(e.ticket_price) > 0 ? kes(e.ticket_price) : "Free entry"}
            </p>
          </div>

          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary transition-all duration-300 group-hover:bg-primary group-hover:text-white">
            <ArrowUpRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}

export function EventsGrid() {
  const q = useEvents();
  const today = new Date().toISOString().slice(0, 10);
  const rows = (q.data ?? []).filter((e) => e.event_date >= today);
  if (q.isLoading) return <Spinner />;
  if (q.error)
    return (
      <Alert variant="destructive">
        <AlertDescription>{q.error.message}</AlertDescription>
      </Alert>
    );
  if (!rows.length)
    return (
      <Empty
        icon={CalendarDays}
        text="No upcoming events have been published yet."
      />
    );
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
      {rows.map((e) => (
        <EventCard key={e.id} e={e} />
      ))}
    </div>
  );
}

/** Event details with simulated M-Pesa ticket purchase; the server sets price, capacity and ticket number. */
export function EventDetail({ e }: { e: EventRow }) {
  const { user } = useAuth();
  const nav = useNavigate();
  const sold = useQuery({
    queryKey: ["eventSeats", e.id],
    queryFn: () => svc.seatsSold(e.id),
  });
  const [qty, setQty] = useState(1);
  const [attendee, setAttendee] = useState("");
  const [phone, setPhone] = useState("");
  const buy = useAction(svc.buyTicket, ["tickets", "eventSeats"]);
  const left =
    e.capacity != null ? Math.max(e.capacity - (sold.data ?? 0), 0) : null;
  const past = e.event_date < new Date().toISOString().slice(0, 10);
  const run = (success: boolean) =>
    buy.mutate(
      {
        id: e.id,
        quantity: qty,
        attendee,
        phone: phone.replace(/\s/g, ""),
        success,
      },
      {
        onSuccess: (id) =>
          id
            ? nav(ticketUrl(id))
            : alert("Simulated payment failed. No ticket was issued."),
      },
    );
  const [posterOpen, setPosterOpen] = useState(false);
  return (
    <>
      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.8fr)] lg:gap-10">
        {/* Event information */}
        <article className="min-w-0 space-y-7">
          {/* Event poster */}
          {e.poster_url && (
            <button
              type="button"
              onClick={() => setPosterOpen(true)}
              aria-label="View event poster"
              className="group relative block w-full overflow-hidden rounded-2xl border border-border/70 bg-muted text-left shadow-md transition-all duration-300 hover:shadow-xl"
            >
              <div className="relative aspect-[16/10] max-h-[560px] w-full">
                <img
                  src={e.poster_url}
                  alt={`${e.title} event poster`}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/10 opacity-70 transition-opacity group-hover:opacity-100" />

                <span className="absolute bottom-4 right-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/55 px-4 py-2 text-xs font-semibold text-white shadow-lg backdrop-blur-md">
                  <ZoomIn className="h-4 w-4" />
                  View full poster
                </span>
              </div>
            </button>
          )}

          {/* Event heading */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                <CalendarDays className="h-3.5 w-3.5" />
                Event details
              </span>
              {past && (
                <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                  Event concluded
                </span>
              )}
            </div>

            <h2 className="text-2xl font-bold leading-tight tracking-tight sm:text-3xl lg:text-4xl">
              {e.title}
            </h2>
          </div>

          {/* Event information cards */}
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              {
                icon: CalendarDays,
                label: "Event date",
                value: eventDate(e.event_date),
              },
              {
                icon: Clock,
                label: "Time",
                value: eventTime(e),
              },
              {
                icon: MapPin,
                label: "Venue",
                value: e.venue || "Venue to be announced",
              },
              {
                icon: HeartHandshake,
                label: "Organiser",
                value: e.organizer || "CSLC",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="flex min-w-0 items-start gap-3 rounded-xl border border-border/70 bg-card p-4 transition-colors hover:border-primary/30"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <item.icon className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {item.label}
                  </p>
                  <p className="mt-1 break-words text-sm font-semibold text-foreground">
                    {item.value}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Description */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 border-b border-border/70 pb-3">
              <Info className="h-5 w-5 text-primary" />
              <h3 className="font-semibold tracking-tight">About this event</h3>
            </div>

            <p className="whitespace-pre-line text-sm leading-7 text-muted-foreground sm:text-base">
              {e.description ||
                "More information about this event will be available soon."}
            </p>
          </section>

          {/* Contact information */}
          {e.contact && (
            <div className="rounded-xl border border-border/70 bg-muted/40 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Enquiries and further information
              </p>
              <p className="mt-1 text-sm font-semibold text-foreground">
                {e.contact}
              </p>
            </div>
          )}
        </article>

        {/* Ticket booking panel */}
        <aside className="h-fit overflow-hidden rounded-2xl border border-border/70 bg-card shadow-lg shadow-black/[0.04] lg:sticky lg:top-24">
          {/* Panel heading */}
          <div className="border-b border-border/70 bg-muted/30 p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Ticket className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-bold tracking-tight">Get your tickets</h3>
                  <p className="text-xs text-muted-foreground">
                    Secure your event spot
                  </p>
                </div>
              </div>

              <div className="text-right">
                <p className="text-xs text-muted-foreground">
                  Price per ticket
                </p>
                <p className="text-lg font-bold text-primary">
                  {Number(e.ticket_price) > 0 ? kes(e.ticket_price) : "Free"}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-5 p-5 sm:p-6">
            {/* Ticket availability */}
            {left != null && (
              <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2.5">
                <span className="text-sm text-muted-foreground">
                  Ticket availability
                </span>
                <span
                  className={`text-sm font-semibold ${left === 0 ? "text-destructive" : "text-foreground"}`}
                >
                  {left === 0 ? "Sold out" : `${left} remaining`}
                </span>
              </div>
            )}

            {past ? (
              <div className="rounded-xl bg-muted/50 p-4 text-center">
                <CalendarDays className="mx-auto h-7 w-7 text-muted-foreground" />
                <p className="mt-2 text-sm font-semibold">
                  This event has ended
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Ticket booking is no longer available.
                </p>
              </div>
            ) : !user ? (
              <div className="space-y-4 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Ticket className="h-7 w-7" />
                </div>
                <div>
                  <p className="font-semibold">Ready to attend?</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    Sign in to your account to book tickets and manage your
                    event registration.
                  </p>
                </div>
                <Button asChild className="h-11 w-full font-semibold">
                  <Link
                    to={`${paths.auth}?next=${encodeURIComponent(eventUrl(e.id))}`}
                  >
                    Sign in to buy tickets
                  </Link>
                </Button>
              </div>
            ) : left === 0 ? (
              <div className="rounded-xl bg-destructive/5 p-4 text-center">
                <p className="font-semibold text-destructive">
                  Tickets sold out
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Unfortunately, no tickets are currently available.
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="att">Attendee name</Label>
                  <Input
                    id="att"
                    value={attendee}
                    onChange={(x) => setAttendee(x.target.value)}
                    placeholder="Enter attendee's full name"
                    className="h-11"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="qty">Number of tickets</Label>
                  <Input
                    id="qty"
                    type="number"
                    min={1}
                    max={Math.min(10, left ?? 10)}
                    value={qty}
                    aria-label="Number of tickets"
                    onChange={(x) =>
                      setQty(
                        Math.min(
                          Math.min(10, left ?? 10),
                          Math.max(1, Number(x.target.value) || 1),
                        ),
                      )
                    }
                    className="h-11"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="tph">M-Pesa phone number</Label>
                  <Input
                    id="tph"
                    inputMode="tel"
                    placeholder="07XX XXX XXX"
                    value={phone}
                    onChange={(x) => setPhone(x.target.value)}
                    className="h-11"
                  />
                </div>

                {/* Total */}
                <div className="rounded-xl border border-primary/20 bg-primary/[0.04] p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {qty} ticket(s)
                    </span>
                    <span className="text-sm font-medium">
                      {kes(Number(e.ticket_price) * qty)}
                    </span>
                  </div>
                  <div className="my-3 border-t border-primary/10" />
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">Total amount</span>
                    <span className="text-xl font-bold text-primary">
                      {kes(Number(e.ticket_price) * qty)}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Button
                    className="h-11 w-full font-semibold"
                    disabled={
                      buy.isPending || !phone.trim() || !attendee.trim()
                    }
                    onClick={() => run(true)}
                  >
                    {buy.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Smartphone className="mr-2 h-4 w-4" />
                    )}
                    Simulate successful payment
                  </Button>

                  <Button
                    variant="outline"
                    className="h-11 w-full"
                    disabled={
                      buy.isPending || !phone.trim() || !attendee.trim()
                    }
                    onClick={() => run(false)}
                  >
                    Simulate failed payment
                  </Button>
                </div>

                <p className="text-center text-xs leading-relaxed text-muted-foreground">
                  Payment is currently running in test mode. No actual M-Pesa
                  transaction will be initiated.
                </p>
              </>
            )}
          </div>
        </aside>
      </div>

      {/* Floating poster lightbox */}
      {posterOpen && e.poster_url && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-3 backdrop-blur-md sm:p-8"
          onClick={() => setPosterOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Event poster preview"
        >
          <button
            type="button"
            onClick={() => setPosterOpen(false)}
            aria-label="Close poster preview"
            className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-md transition hover:bg-white/20 sm:right-7 sm:top-7"
          >
            <X className="h-5 w-5" />
          </button>

          <div
            className="relative flex max-h-[90vh] max-w-6xl items-center justify-center"
            onClick={(event) => event.stopPropagation()}
          >
            <img
              src={e.poster_url}
              alt={`${e.title} full event poster`}
              className="max-h-[88vh] max-w-full rounded-xl object-contain shadow-2xl"
            />
          </div>
        </div>
      )}
    </>
  );
}

export function MyTickets({ management = false }: { management?: boolean }) {
  const q = useTickets(management);
  if (q.isLoading) return <Spinner />;
  if (q.error)
    return (
      <Alert variant="destructive">
        <AlertDescription>{q.error.message}</AlertDescription>
      </Alert>
    );
  if (!q.data?.length)
    return (
      <Empty
        icon={Ticket}
        text={
          management
            ? "No tickets have been sold yet."
            : "Your event tickets will appear here."
        }
      />
    );
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {q.data.map((t) => (
        <div
          key={t.id}
          className="flex items-center justify-between gap-3 rounded-2xl border border-border/70 bg-card p-4 shadow-sm transition hover:border-primary/30 hover:shadow-md sm:p-5"
        >
          <div className="min-w-0">
            <p className="truncate font-semibold">{t.events?.title}</p>
            <p className="text-xs text-muted-foreground">
              {t.ticket_number} · {t.quantity} ticket(s) · {kes(t.amount)}
            </p>
            <p className="text-xs text-muted-foreground">
              {t.events && eventDate(t.events.event_date)} · {t.attendee_name}
            </p>
          </div>
          <Button asChild size="sm" variant="outline">
            <Link to={ticketUrl(t.id)}>
              <Ticket className="h-4 w-4" />
              View
            </Link>
          </Button>
        </div>
      ))}
    </div>
  );
}

const kindIcon = {
  document: FileText,
  image: ImageIcon,
  link: Link2,
  video: Video,
  audio: Music,
} as const;

export function MaterialsBrowser() {
  const { user } = useAuth();
  const q = useMaterials();
  const history = useReadingHistory();
  const [term, setTerm] = useState("");
  const [cat, setCat] = useState("all");
  const [topic, setTopic] = useState("all");
  const [kind, setKind] = useState("all");
  const [tab, setTab] = useState<"all" | "history">("all");
  const all = q.data ?? [];
  const cats = [...new Set(all.map((m) => m.category))].sort();
  const topics = [
    ...new Set(
      all
        .filter((m) => cat === "all" || m.category === cat)
        .map((m) => m.topic)
        .filter(Boolean),
    ),
  ].sort();
  const rows = useMemo(
    () =>
      all.filter(
        (m) =>
          (cat === "all" || m.category === cat) &&
          (topic === "all" || m.topic === topic) &&
          (kind === "all" || m.kind === kind) &&
          `${m.title} ${m.description} ${m.topic}`
            .toLowerCase()
            .includes(term.trim().toLowerCase()),
      ),
    [all, cat, topic, kind, term],
  );
  const open = (m: Pick<MaterialRow, "id">) => {
    if (user) void svc.logView(m.id).then(() => history.refetch());
  };
  return (
    <div className="space-y-7">
      {/* Page controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
            Learning Materials
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Explore programme resources, documents and learning content.
          </p>
        </div>

        {user && (
          <div className="inline-flex w-fit items-center gap-1 rounded-xl border border-border/70 bg-muted/40 p-1">
            <Button
              size="sm"
              variant={tab === "all" ? "default" : "ghost"}
              className="rounded-lg"
              onClick={() => setTab("all")}
            >
              <FileText className="mr-2 h-4 w-4" />
              All materials
            </Button>

            <Button
              size="sm"
              variant={tab === "history" ? "default" : "ghost"}
              className="rounded-lg"
              onClick={() => setTab("history")}
            >
              <History className="mr-2 h-4 w-4" />
              Reading history
            </Button>
          </div>
        )}
      </div>

      {/* Reading history */}
      {tab === "history" ? (
        history.isLoading ? (
          <Spinner />
        ) : !history.data?.length ? (
          <div className="rounded-2xl border border-dashed border-border bg-muted/20 px-5 py-14 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <History className="h-7 w-7" />
            </div>
            <h3 className="mt-4 font-semibold">No reading history yet</h3>
            <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
              Materials you open will automatically appear here, making it easy
              to return to your previous learning resources.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-5"
              onClick={() => setTab("all")}
            >
              Browse materials
            </Button>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
            <div className="flex flex-col gap-2 border-b border-border/70 bg-muted/20 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="font-semibold">Recently viewed</h3>
                <p className="text-xs text-muted-foreground">
                  Your previously opened learning resources
                </p>
              </div>
              <Badge variant="secondary">
                {history.data.length}{" "}
                {history.data.length === 1 ? "record" : "records"}
              </Badge>
            </div>

            <div className="divide-y divide-border/70">
              {history.data.map((h) => {
                if (!h.materials) return null;

                const HistoryIcon =
                  kindIcon[h.materials.kind as keyof typeof kindIcon] ??
                  FileText;

                return (
                  <div
                    key={h.id}
                    className="group flex flex-col gap-4 p-4 transition-colors hover:bg-muted/20 sm:flex-row sm:items-center sm:justify-between sm:px-5"
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <HistoryIcon className="h-5 w-5" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <h4 className="truncate text-sm font-semibold">
                          {h.materials.title}
                        </h4>

                        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                          <span>{h.materials.category}</span>
                          {h.materials.topic && (
                            <>
                              <span>•</span>
                              <span>{h.materials.topic}</span>
                            </>
                          )}
                        </div>

                        <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Clock className="h-3.5 w-3.5" />
                          {new Date(h.viewed_at).toLocaleString("en-KE", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </p>
                      </div>
                    </div>

                    <Button
                      asChild
                      size="sm"
                      variant="outline"
                      className="w-full shrink-0 sm:w-auto"
                    >
                      <a
                        href={h.materials.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Open again
                      </a>
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        )
      ) : (
        <>
          {/* Search and filters */}
          <section className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm sm:p-5">
            <div className="mb-4 flex items-center gap-2">
              <Search className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold">Find learning materials</h3>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="relative sm:col-span-2 lg:col-span-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  aria-label="Search materials"
                  placeholder="Search by title or keyword..."
                  className="h-11 rounded-xl pl-9"
                  value={term}
                  onChange={(e) => setTerm(e.target.value)}
                />
              </div>

              <Select
                value={cat}
                onValueChange={(v) => {
                  setCat(v);
                  setTopic("all");
                }}
              >
                <SelectTrigger
                  className="h-11 rounded-xl"
                  aria-label="Category"
                >
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {cats.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={topic} onValueChange={setTopic}>
                <SelectTrigger className="h-11 rounded-xl" aria-label="Topic">
                  <SelectValue placeholder="Topic" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All topics</SelectItem>
                  {topics.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={kind} onValueChange={setKind}>
                <SelectTrigger className="h-11 rounded-xl" aria-label="Type">
                  <SelectValue placeholder="Material type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  {Object.keys(kindIcon).map((c) => (
                    <SelectItem key={c} value={c} className="capitalize">
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filter summary */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-4">
              <p className="text-sm text-muted-foreground">
                Showing{" "}
                <span className="font-semibold text-foreground">
                  {rows.length}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-foreground">
                  {all.length}
                </span>{" "}
                materials
              </p>

              {(term || cat !== "all" || topic !== "all" || kind !== "all") && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-primary hover:text-primary"
                  onClick={() => {
                    setTerm("");
                    setCat("all");
                    setTopic("all");
                    setKind("all");
                  }}
                >
                  <X className="mr-1.5 h-3.5 w-3.5" />
                  Clear filters
                </Button>
              )}
            </div>
          </section>

          {/* Loading, errors and empty states */}
          {q.isLoading ? (
            <div className="flex min-h-[220px] items-center justify-center">
              <Spinner />
            </div>
          ) : q.error ? (
            <Alert variant="destructive" className="rounded-xl">
              <AlertDescription>{q.error.message}</AlertDescription>
            </Alert>
          ) : !rows.length ? (
            <div className="rounded-2xl border border-dashed border-border bg-muted/20 px-5 py-14 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                <FileText className="h-7 w-7" />
              </div>

              <h3 className="mt-4 font-semibold">
                {all.length
                  ? "No matching materials"
                  : "No materials published yet"}
              </h3>

              <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
                {all.length
                  ? "Try changing your search term or adjusting the selected filters."
                  : "Programme learning resources will appear here once they have been published."}
              </p>

              {all.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-5"
                  onClick={() => {
                    setTerm("");
                    setCat("all");
                    setTopic("all");
                    setKind("all");
                  }}
                >
                  Reset filters
                </Button>
              )}
            </div>
          ) : (
            <>
              {/* Material cards */}
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {rows.map((m) => {
                  const Icon =
                    kindIcon[m.kind as keyof typeof kindIcon] ?? FileText;

                  return (
                    <article
                      key={m.id}
                      className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl"
                    >
                      {/* Preview area */}
                      <div className="relative aspect-[16/9] overflow-hidden bg-muted">
                        {m.kind === "image" ? (
                          <a
                            href={m.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => open(m)}
                            aria-label={`View ${m.title}`}
                            className="block h-full w-full"
                          >
                            <img
                              src={m.url}
                              alt={m.title}
                              loading="lazy"
                              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/20">
                              <span className="flex h-11 w-11 scale-90 items-center justify-center rounded-full bg-white/90 text-slate-900 opacity-0 shadow-lg transition-all group-hover:scale-100 group-hover:opacity-100">
                                <ExternalLink className="h-5 w-5" />
                              </span>
                            </div>
                          </a>
                        ) : (
                          <div className="flex h-full flex-col items-center justify-center gap-3 bg-gradient-to-br from-primary/[0.10] via-muted to-primary/[0.04]">
                            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/10 bg-background shadow-sm transition-transform duration-300 group-hover:-translate-y-1">
                              <Icon className="h-8 w-8 text-primary" />
                            </div>
                            <span className="rounded-full border border-border/70 bg-background/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                              {m.kind} resource
                            </span>
                          </div>
                        )}

                        {/* Resource type */}
                        <div className="absolute left-3 top-3 pointer-events-none">
                          <Badge className="border border-white/20 bg-black/60 text-white shadow-sm backdrop-blur-md hover:bg-black/60">
                            {m.kind}
                          </Badge>
                        </div>
                      </div>

                      {/* Material details */}
                      <div className="flex flex-1 flex-col p-5">
                        <div className="mb-3 flex flex-wrap gap-1.5">
                          <Badge
                            variant="secondary"
                            className="max-w-full truncate"
                          >
                            {m.category}
                          </Badge>
                          {m.topic && (
                            <Badge
                              variant="outline"
                              className="max-w-full truncate"
                            >
                              {m.topic}
                            </Badge>
                          )}
                        </div>

                        <h3 className="line-clamp-2 text-base font-bold leading-snug tracking-tight transition-colors group-hover:text-primary">
                          {m.title}
                        </h3>

                        <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-muted-foreground">
                          {m.description ||
                            "Explore this learning resource for additional programme information."}
                        </p>

                        {/* Actions */}
                        <div className="mt-5 flex items-center gap-2 border-t border-border/70 pt-4">
                          <Button asChild size="sm" className="h-10 flex-1">
                            <a
                              href={m.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => open(m)}
                            >
                              <ExternalLink className="mr-2 h-4 w-4" />
                              Open material
                            </a>
                          </Button>

                          {m.kind !== "link" && (
                            <Button
                              asChild
                              size="icon"
                              variant="outline"
                              className="h-10 w-10 shrink-0"
                            >
                              <a
                                href={m.url}
                                download
                                onClick={() => open(m)}
                                aria-label={`Download ${m.title}`}
                                title="Download material"
                              >
                                <Download className="h-4 w-4" />
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

const presets = [500, 1000, 2500, 5000];

/** Donations are available only to authenticated users. Payment is simulated in this flow. */
export function DonateForm() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [f, setF] = useState({
    name: (user?.user_metadata?.full_name as string) ?? "",
    email: user?.email ?? "",
    phone: "",
    amount: 1000,
    message: "",
  });
  const give = useAction(svc.donate, ["donations"]);

  const run = (success: boolean) => {
    // Client-side guard: do not call the donation action for signed-out visitors.
    if (!user) {
      nav(`${paths.auth}?next=${encodeURIComponent("/student-programmes")}`);
      return;
    }

    give.mutate(
      { ...f, phone: f.phone.replace(/\s/g, ""), success },
      {
        onSuccess: (id) =>
          id
            ? nav(donationReceiptUrl(id))
            : alert("Simulated payment failed. No donation was recorded."),
      },
    );
  };

  const set =
    (k: keyof typeof f) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setF((current) => ({
        ...current,
        [k]: k === "amount" ? Number(e.target.value) : e.target.value,
      }));

  // Use a direct image URL, not an Unsplash webpage URL or a missing local import.
  const campaignImage =
    "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1600&q=85";

  return (
    <div className="mx-auto grid max-w-7xl items-stretch gap-6 lg:grid-cols-2 lg:gap-8">
      {/* LEFT: Donation campaign and impact */}
      <section className="relative isolate flex min-h-[520px] flex-col overflow-hidden rounded-3xl bg-primary text-white shadow-xl lg:sticky lg:top-28 lg:min-h-[680px] lg:self-start">
        <div className="relative h-48 w-full overflow-hidden sm:h-64 lg:h-72">
          <img
            src={campaignImage}
            alt="Students learning and working together"
            loading="lazy"
            onError={(event) => {
              // Keep the layout intact if the external image provider is unavailable.
              event.currentTarget.style.display = "none";
            }}
            className="absolute inset-0 h-full w-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/10 to-transparent" />
          <div className="absolute bottom-4 left-5 right-5 hidden sm:block sm:bottom-5 sm:left-7">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-300 sm:text-sm">
              Invest in the next generation
            </p>
            <h2 className="mt-2 max-w-xl text-2xl font-bold tracking-tight sm:text-3xl">
              Help students learn, grow and lead.
            </h2>
          </div>
        </div>

        <div className="relative z-10 flex flex-1 flex-col justify-between gap-8 p-5 sm:p-8 lg:p-9">
          <p className="max-w-lg text-sm leading-7 text-white/70 sm:text-base">
            By supporting CSLC student programmes, you help strengthen
            initiatives that nurture leadership, build character and equip
            students to make a meaningful difference in their communities.
          </p>

          <div className="space-y-5">
            <div className="rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur-md sm:p-6">
              <h3 className="mb-4 text-lg font-semibold">
                Why your contribution matters
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-500/20 text-orange-300">
                    <HeartHandshake className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="font-semibold">Empower student leaders</p>
                    <p className="mt-1 text-sm leading-6 text-white/70">
                      Help nurture responsible, confident and service-minded
                      future leaders.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-500/20 text-orange-300">
                    <CalendarDays className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="font-semibold">Strengthen programmes</p>
                    <p className="mt-1 text-sm leading-6 text-white/70">
                      Contribute towards student activities, learning
                      opportunities and leadership development.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-500/20 text-orange-300">
                    <HeartHandshake className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="font-semibold">Be part of lasting change</p>
                    <p className="mt-1 text-sm leading-6 text-white/70">
                      Join a community committed to helping students discover
                      their potential.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm text-white/80">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-500 text-white">
                <HeartHandshake className="h-5 w-5" />
              </span>
              <p>
                <span className="font-semibold text-white">
                  Every contribution counts.
                </span>{" "}
                Give what you can and be part of the journey.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* RIGHT: Signed-in donation form or sign-in prompt */}
      <section className="min-w-0 rounded-3xl border border-border/70 bg-card shadow-xl shadow-black/[0.04]">
        {!user ? (
          <div className="flex min-h-[420px] flex-col items-center justify-center p-6 text-center sm:p-10">
            <span className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <HeartHandshake className="h-8 w-8" />
            </span>
            <h3 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Sign in to make a donation
            </h3>
            <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">
              Please sign in to your CSLC account before donating. This helps
              link your contribution and receipt to your account.
            </p>
            <Button
              asChild
              className="mt-6 h-12 w-full max-w-sm rounded-xl font-semibold"
            >
              <Link
                to={`${paths.auth}?next=${encodeURIComponent("/student-programmes")}`}
              >
                Sign in to continue
              </Link>
            </Button>
            <p className="mt-4 text-sm text-muted-foreground">
              Don’t have an account? Sign in or create one to get started.
            </p>
          </div>
        ) : (
          <form
            className="space-y-6 p-5 sm:p-8 lg:p-9"
            onSubmit={(e) => {
              e.preventDefault();
              if (!user) {
                nav(
                  `${paths.auth}?next=${encodeURIComponent("/student-programmes")}`,
                );
                return;
              }
              if (!Number.isFinite(f.amount) || f.amount < 10) {
                alert("Please enter a donation amount of at least KSh 10.");
                return;
              }
              run(true);
            }}
          >
            <div className="border-b border-border/70 pb-5">
              <h3 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Make a donation
              </h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Choose an amount and enter your details to support CSLC student
                programmes.
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <HeartHandshake className="h-4 w-4 text-primary" />
                  Give with purpose
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-primary" />
                  Donation receipt
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <Label className="text-sm font-semibold">
                  Choose your contribution
                </Label>
                <p className="mt-1 text-xs text-muted-foreground">
                  Select an amount or enter your own.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {presets.map((a) => (
                  <Button
                    key={a}
                    type="button"
                    variant={f.amount === a ? "default" : "outline"}
                    aria-pressed={f.amount === a}
                    onClick={() =>
                      setF((current) => ({ ...current, amount: a }))
                    }
                    className={`h-12 rounded-xl font-semibold transition-all ${f.amount === a ? "shadow-md shadow-primary/20" : "border-border/80 hover:border-primary/50 hover:bg-primary/5"}`}
                  >
                    {kes(a)}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amt">Donation amount (KES)</Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
                  KSh
                </span>
                <Input
                  id="amt"
                  type="number"
                  min={10}
                  step="1"
                  inputMode="numeric"
                  value={f.amount || ""}
                  onChange={set("amount")}
                  placeholder="Enter amount"
                  required
                  className="h-12 rounded-xl pl-14 text-base font-semibold"
                />
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold">Your details</h4>
              <div className="space-y-2">
                <Label htmlFor="dn">Full name</Label>
                <Input
                  id="dn"
                  autoComplete="name"
                  value={f.name}
                  onChange={set("name")}
                  placeholder="Enter your full name"
                  required
                  className="h-12 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="de">Email address</Label>
                <Input
                  id="de"
                  type="email"
                  autoComplete="email"
                  value={f.email}
                  onChange={set("email")}
                  placeholder="you@example.com"
                  required
                  className="h-12 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dp">M-Pesa phone number</Label>
                <Input
                  id="dp"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="07XX XXX XXX"
                  value={f.phone}
                  onChange={set("phone")}
                  required
                  className="h-12 rounded-xl"
                />
                <p className="text-xs text-muted-foreground">
                  Enter the phone number for the payment prompt.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dm">
                  Message{" "}
                  <span className="font-normal text-muted-foreground">
                    (optional)
                  </span>
                </Label>
                <Textarea
                  id="dm"
                  maxLength={500}
                  rows={3}
                  value={f.message}
                  onChange={set("message")}
                  placeholder="Leave an encouraging message..."
                  className="resize-y rounded-xl"
                />
              </div>
            </div>

            <div className="rounded-2xl border border-primary/20 bg-primary/[0.04] p-4 sm:p-5">
              <p className="text-sm text-muted-foreground">Your contribution</p>
              <div className="mt-2 flex items-center justify-between gap-3">
                <span className="font-medium">Total donation</span>
                <span className="text-2xl font-bold tracking-tight text-primary">
                  {kes(Math.max(0, Number(f.amount) || 0))}
                </span>
              </div>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                Thank you for supporting student development through CSLC.
              </p>
            </div>

            <div className="space-y-3">
              <Button
                type="submit"
                className="h-12 w-full rounded-xl text-sm font-semibold shadow-md shadow-primary/15 transition-all hover:shadow-lg"
                disabled={
                  give.isPending ||
                  !Number.isFinite(f.amount) ||
                  f.amount < 10 ||
                  !f.name.trim() ||
                  !f.email.trim() ||
                  !f.phone.trim()
                }
              >
                {give.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing donation...
                  </>
                ) : (
                  <>
                    <Smartphone className="mr-2 h-4 w-4" />
                    Simulate donation of{" "}
                    {kes(Math.max(0, Number(f.amount) || 0))}
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-11 w-full rounded-xl"
                disabled={give.isPending}
                onClick={() => run(false)}
              >
                Simulate failed payment
              </Button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}
