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
  Music,
  Search,
  Smartphone,
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
import {
  donationReceiptUrl,
  eventUrl,
  paths,
  ticketUrl,
} from "@/routes/paths";
import hero from "@/assets/svc-grounds.jpg";

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
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        <section className="relative isolate overflow-hidden bg-primary">
          <img src={hero} alt="" className="absolute inset-0 -z-20 h-full w-full object-cover" />
          <div className="absolute inset-0 -z-10 bg-primary/80" />
          <PageContainer className="py-14 text-center text-primary-foreground sm:py-16">
            <nav aria-label="Breadcrumb" className="mb-4 text-xs opacity-80 sm:text-sm">
              <Link to={paths.home} className="hover:underline">Home</Link> / Student Programmes / {title}
            </nav>
            <h1 className="text-3xl font-bold sm:text-5xl">{title}</h1>
            <p className="mx-auto mt-3 max-w-2xl text-sm opacity-90 sm:text-base">{intro}</p>
          </PageContainer>
        </section>
        <PageContainer className="py-10 sm:py-14">{children}</PageContainer>
      </main>
      <SiteFooter />
    </div>
  );
}

const Empty = ({ icon: Icon, text }: { icon: typeof Ticket; text: string }) => (
  <div className="rounded-2xl border border-dashed p-10 text-center text-muted-foreground">
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
      className="group overflow-hidden rounded-2xl border bg-card shadow-card transition hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className="aspect-[4/3] overflow-hidden bg-muted">
        {e.poster_url ? (
          <img src={e.poster_url} alt={e.title} loading="lazy" className="h-full w-full object-cover transition group-hover:scale-105" />
        ) : (
          <div className="flex h-full items-center justify-center text-primary"><CalendarDays className="h-10 w-10" /></div>
        )}
      </div>
      <div className="space-y-2 p-4">
        <Badge variant="secondary">{eventDate(e.event_date)}</Badge>
        <h3 className="line-clamp-2 font-semibold">{e.title}</h3>
        <p className="flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="h-4 w-4" />{e.venue || "Venue to be announced"}</p>
        <p className="font-bold text-primary">{Number(e.ticket_price) > 0 ? kes(e.ticket_price) : "Free entry"}</p>
      </div>
    </Link>
  );
}

export function EventsGrid() {
  const q = useEvents();
  const today = new Date().toISOString().slice(0, 10);
  const rows = (q.data ?? []).filter((e) => e.event_date >= today);
  if (q.isLoading) return <Spinner />;
  if (q.error) return <Alert variant="destructive"><AlertDescription>{q.error.message}</AlertDescription></Alert>;
  if (!rows.length) return <Empty icon={CalendarDays} text="No upcoming events have been published yet." />;
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {rows.map((e) => <EventCard key={e.id} e={e} />)}
    </div>
  );
}

/** Event details with simulated M-Pesa ticket purchase; the server sets price, capacity and ticket number. */
export function EventDetail({ e }: { e: EventRow }) {
  const { user } = useAuth();
  const nav = useNavigate();
  const sold = useQuery({ queryKey: ["eventSeats", e.id], queryFn: () => svc.seatsSold(e.id) });
  const [qty, setQty] = useState(1);
  const [attendee, setAttendee] = useState("");
  const [phone, setPhone] = useState("");
  const buy = useAction(svc.buyTicket, ["tickets", "eventSeats"]);
  const left = e.capacity != null ? Math.max(e.capacity - (sold.data ?? 0), 0) : null;
  const past = e.event_date < new Date().toISOString().slice(0, 10);
  const run = (success: boolean) =>
    buy.mutate(
      { id: e.id, quantity: qty, attendee, phone: phone.replace(/\s/g, ""), success },
      { onSuccess: (id) => (id ? nav(ticketUrl(id)) : alert("Simulated payment failed. No ticket was issued.")) },
    );
  return (
    <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
      <article className="space-y-5">
        {e.poster_url && <img src={e.poster_url} alt={e.title} className="max-h-[480px] w-full rounded-2xl object-cover" />}
        <h2 className="text-2xl font-bold">{e.title}</h2>
        <div className="grid gap-2 text-sm sm:grid-cols-2">
          <p className="flex gap-2"><CalendarDays className="h-4 w-4 text-primary" />{eventDate(e.event_date)}</p>
          <p className="flex gap-2"><Clock className="h-4 w-4 text-primary" />{eventTime(e)}</p>
          <p className="flex gap-2"><MapPin className="h-4 w-4 text-primary" />{e.venue || "Venue to be announced"}</p>
          <p className="flex gap-2"><HeartHandshake className="h-4 w-4 text-primary" />{e.organizer}</p>
        </div>
        <p className="whitespace-pre-line text-muted-foreground">{e.description}</p>
        {e.contact && <p className="text-sm">Enquiries: {e.contact}</p>}
      </article>
      <aside className="h-fit space-y-4 rounded-2xl border bg-card p-5 shadow-card lg:sticky lg:top-24">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Get tickets</h3>
          <span className="text-lg font-bold text-primary">{Number(e.ticket_price) > 0 ? kes(e.ticket_price) : "Free"}</span>
        </div>
        {left != null && <p className="text-sm text-muted-foreground">{left} ticket(s) remaining</p>}
        {past ? (
          <p className="text-sm text-muted-foreground">This event has already taken place.</p>
        ) : !user ? (
          <Button asChild className="w-full"><Link to={`${paths.auth}?redirect=${encodeURIComponent(eventUrl(e.id))}`}>Sign in to buy tickets</Link></Button>
        ) : left === 0 ? (
          <p className="text-sm font-semibold text-destructive">Sold out</p>
        ) : (
          <>
            <div className="space-y-1.5"><Label htmlFor="att">Attendee name</Label><Input id="att" value={attendee} onChange={(x) => setAttendee(x.target.value)} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label htmlFor="qty">Tickets</Label><Input id="qty" type="number" min={1} max={Math.min(10, left ?? 10)} value={qty} onChange={(x) => setQty(Math.max(1, Number(x.target.value) || 1))} /></div>
              <div className="space-y-1.5"><Label htmlFor="tph">M-Pesa phone</Label><Input id="tph" inputMode="tel" placeholder="07XX XXX XXX" value={phone} onChange={(x) => setPhone(x.target.value)} /></div>
            </div>
            <div className="flex justify-between border-y py-3 font-bold"><span>Total</span><span className="text-primary">{kes(Number(e.ticket_price) * qty)}</span></div>
            <Alert><AlertTriangle className="h-4 w-4" /><AlertDescription><strong>Simulated M-Pesa (test mode).</strong> No money is charged.</AlertDescription></Alert>
            <Button className="w-full" disabled={buy.isPending || !phone || !attendee} onClick={() => run(true)}>
              {buy.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Smartphone className="h-4 w-4" />} Simulate successful payment
            </Button>
            <Button variant="outline" className="w-full" disabled={buy.isPending || !phone || !attendee} onClick={() => run(false)}>Simulate failed payment</Button>
          </>
        )}
      </aside>
    </div>
  );
}

export function MyTickets({ management = false }: { management?: boolean }) {
  const q = useTickets(management);
  if (q.isLoading) return <Spinner />;
  if (q.error) return <Alert variant="destructive"><AlertDescription>{q.error.message}</AlertDescription></Alert>;
  if (!q.data?.length) return <Empty icon={Ticket} text={management ? "No tickets have been sold yet." : "Your event tickets will appear here."} />;
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {q.data.map((t) => (
        <div key={t.id} className="flex items-center justify-between gap-3 rounded-xl border bg-card p-4">
          <div className="min-w-0">
            <p className="truncate font-semibold">{t.events?.title}</p>
            <p className="text-xs text-muted-foreground">{t.ticket_number} · {t.quantity} ticket(s) · {kes(t.amount)}</p>
            <p className="text-xs text-muted-foreground">{t.events && eventDate(t.events.event_date)} · {t.attendee_name}</p>
          </div>
          <Button asChild size="sm" variant="outline"><Link to={ticketUrl(t.id)}><Ticket className="h-4 w-4" />View</Link></Button>
        </div>
      ))}
    </div>
  );
}

const kindIcon = { document: FileText, image: ImageIcon, link: Link2, video: Video, audio: Music } as const;

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
  const topics = [...new Set(all.filter((m) => cat === "all" || m.category === cat).map((m) => m.topic).filter(Boolean))].sort();
  const rows = useMemo(
    () =>
      all.filter(
        (m) =>
          (cat === "all" || m.category === cat) &&
          (topic === "all" || m.topic === topic) &&
          (kind === "all" || m.kind === kind) &&
          `${m.title} ${m.description} ${m.topic}`.toLowerCase().includes(term.trim().toLowerCase()),
      ),
    [all, cat, topic, kind, term],
  );
  const open = (m: Pick<MaterialRow, "id">) => {
    if (user) void svc.logView(m.id).then(() => history.refetch());
  };
  return (
    <div className="space-y-5">
      {user && (
        <div className="flex gap-2">
          <Button size="sm" variant={tab === "all" ? "default" : "outline"} onClick={() => setTab("all")}>All materials</Button>
          <Button size="sm" variant={tab === "history" ? "default" : "outline"} onClick={() => setTab("history")}><History className="h-4 w-4" />Reading history</Button>
        </div>
      )}
      {tab === "history" ? (
        history.isLoading ? <Spinner /> : !history.data?.length ? <Empty icon={History} text="Materials you open will appear here." /> : (
          <ul className="divide-y rounded-xl border bg-card">
            {history.data.map((h) => h.materials && (
              <li key={h.id} className="flex items-center justify-between gap-3 p-4">
                <div className="min-w-0"><p className="truncate font-medium">{h.materials.title}</p><p className="text-xs text-muted-foreground">{h.materials.category}{h.materials.topic ? ` · ${h.materials.topic}` : ""} · {new Date(h.viewed_at).toLocaleString("en-KE")}</p></div>
                <Button asChild size="sm" variant="outline"><a href={h.materials.url} target="_blank" rel="noreferrer">Open again</a></Button>
              </li>
            ))}
          </ul>
        )
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="relative sm:col-span-2 lg:col-span-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input aria-label="Search materials" placeholder="Search materials" className="pl-9" value={term} onChange={(e) => setTerm(e.target.value)} />
            </div>
            <Select value={cat} onValueChange={(v) => { setCat(v); setTopic("all"); }}>
              <SelectTrigger aria-label="Category"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="all">All categories</SelectItem>{cats.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={topic} onValueChange={setTopic}>
              <SelectTrigger aria-label="Topic"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="all">All topics</SelectItem>{topics.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={kind} onValueChange={setKind}>
              <SelectTrigger aria-label="Type"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="all">All types</SelectItem>{Object.keys(kindIcon).map((c) => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          {q.isLoading ? <Spinner /> : q.error ? <Alert variant="destructive"><AlertDescription>{q.error.message}</AlertDescription></Alert> : !rows.length ? (
            <Empty icon={FileText} text={all.length ? "No materials match these filters." : "No programme materials have been published yet."} />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {rows.map((m) => {
                const Icon = kindIcon[m.kind as keyof typeof kindIcon] ?? FileText;
                return (
                  <article key={m.id} className="flex flex-col rounded-2xl border bg-card p-5 shadow-card">
                    {m.kind === "image" ? <img src={m.url} alt={m.title} loading="lazy" className="mb-4 aspect-video w-full rounded-lg object-cover" /> : (
                      <span className="mb-4 w-fit rounded-lg bg-primary/10 p-3 text-primary"><Icon className="h-6 w-6" /></span>
                    )}
                    <div className="mb-2 flex flex-wrap gap-1"><Badge variant="secondary">{m.category}</Badge>{m.topic && <Badge variant="outline">{m.topic}</Badge>}</div>
                    <h3 className="font-semibold">{m.title}</h3>
                    <p className="mt-1 line-clamp-3 flex-1 text-sm text-muted-foreground">{m.description}</p>
                    <div className="mt-4 flex gap-2">
                      <Button asChild size="sm"><a href={m.url} target="_blank" rel="noreferrer" onClick={() => open(m)}><ExternalLink className="h-4 w-4" />Open</a></Button>
                      {m.kind !== "link" && <Button asChild size="sm" variant="outline"><a href={m.url} download onClick={() => open(m)}><Download className="h-4 w-4" />Download</a></Button>}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

const presets = [500, 1000, 2500, 5000];

/** Donation form for visitors and signed-in users; the server records amounts and issues receipts. */
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
  const run = (success: boolean) =>
    give.mutate(
      { ...f, phone: f.phone.replace(/\s/g, ""), success },
      { onSuccess: (id) => (id ? nav(donationReceiptUrl(id)) : alert("Simulated payment failed. No donation was recorded.")) },
    );
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setF({ ...f, [k]: k === "amount" ? Number(e.target.value) : e.target.value });
  return (
    <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-2">
      <section className="space-y-4">
        <HeartHandshake className="h-10 w-10 text-primary" />
        <h2 className="text-2xl font-bold">Support student programmes</h2>
        <p className="text-muted-foreground">Your contribution supports CSLC student programmes. Every donation receives a receipt{user ? " and appears in your donation history." : "."}</p>
        {!user && <p className="text-sm"><Link to={paths.auth} className="text-primary hover:underline">Sign in</Link> to keep a donation history in your account.</p>}
      </section>
      <form className="space-y-4 rounded-2xl border bg-card p-6 shadow-card" onSubmit={(e) => { e.preventDefault(); run(true); }}>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {presets.map((a) => <Button key={a} type="button" variant={f.amount === a ? "default" : "outline"} onClick={() => setF({ ...f, amount: a })}>{kes(a)}</Button>)}
        </div>
        <div className="space-y-1.5"><Label htmlFor="amt">Amount (KES)</Label><Input id="amt" type="number" min={10} value={f.amount || ""} onChange={set("amount")} required /></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5"><Label htmlFor="dn">Full name</Label><Input id="dn" value={f.name} onChange={set("name")} required /></div>
          <div className="space-y-1.5"><Label htmlFor="de">Email</Label><Input id="de" type="email" value={f.email} onChange={set("email")} required /></div>
        </div>
        <div className="space-y-1.5"><Label htmlFor="dp">M-Pesa phone</Label><Input id="dp" inputMode="tel" placeholder="07XX XXX XXX" value={f.phone} onChange={set("phone")} required /></div>
        <div className="space-y-1.5"><Label htmlFor="dm">Message (optional)</Label><Textarea id="dm" maxLength={500} value={f.message} onChange={set("message")} /></div>
        <Alert><AlertTriangle className="h-4 w-4" /><AlertDescription><strong>Simulated M-Pesa (test mode).</strong> No money is charged.</AlertDescription></Alert>
        <Button type="submit" className="w-full" disabled={give.isPending}>
          {give.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Smartphone className="h-4 w-4" />} Simulate successful donation of {kes(f.amount)}
        </Button>
        <Button type="button" variant="outline" className="w-full" disabled={give.isPending} onClick={() => run(false)}>Simulate failed payment</Button>
      </form>
    </div>
  );
}
