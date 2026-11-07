import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  BedDouble,
  CalendarCheck,
  ChartPie,
  HeartHandshake,
  Inbox,
  LineChart as LineIcon,
  Package,
  ShoppingBag,
  Sparkles,
  Ticket,
  TrendingDown,
  TrendingUp,
  Users as UsersIcon,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { kes } from "@/lib/booking";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useBookings, useProfiles } from "@/hooks/useHospitality";
import { useOrders } from "@/hooks/bookshop/useOrders";
import { useCatalog } from "@/hooks/bookshop/useCatalog";
import { useDonations } from "@/hooks/programmes/useDonations";
import { useEvents, useTickets } from "@/hooks/programmes/useProgrammes";
import { useContributions } from "@/hooks/programmes/useResources";
import { useAllTickets, useEnquiries } from "@/hooks/useSupport";
import {
  chartTooltipStyle,
  dailyBreakdown,
  periodTotals,
} from "./analyticsPresentation";

const RANGES = [7, 30, 90] as const;
type Range = (typeof RANGES)[number];
const MODULES = [
  { key: "Hospitality", tone: "--primary" },
  { key: "Bookshop", tone: "--chart-2" },
  { key: "Events", tone: "--chart-4" },
  { key: "Donations", tone: "--chart-3" },
] as const;
const hsl = (tone: string, alpha?: number) =>
  alpha === undefined ? `hsl(var(${tone}))` : `hsl(var(${tone}) / ${alpha})`;
const compact = (n: number) =>
  new Intl.NumberFormat("en-KE", { notation: "compact", maximumFractionDigits: 1 }).format(n);
const inPeriod = (iso: string, days: number) => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - days + 1);
  return new Date(iso).getTime() >= start.getTime();
};

function Trend({ change, days }: { change: number | null; days: number }) {
  if (change === null)
    return (
      <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[11px] font-semibold text-accent-foreground">
        New this period
      </span>
    );
  const up = change >= 0;
  const Icon = up ? TrendingUp : TrendingDown;
  return (
    <span className="flex flex-wrap items-center gap-1 text-[11px]">
      <span
        className="flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-semibold"
        style={{
          color: hsl(up ? "--chart-3" : "--destructive"),
          background: hsl(up ? "--chart-3" : "--destructive", 0.12),
        }}
      >
        <Icon className="h-3 w-3" />
        {Math.abs(change).toFixed(change % 1 ? 1 : 0)}%
      </span>
      <span className="text-muted-foreground">vs prior {days}d</span>
    </span>
  );
}

function Spark({ data, tone }: { data: number[]; tone: string }) {
  const id = `spark${tone.replace(/\W/g, "")}`;
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 opacity-80" aria-hidden>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data.map((v) => ({ v }))} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={hsl(tone)} stopOpacity={0.35} />
              <stop offset="100%" stopColor={hsl(tone)} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area dataKey="v" type="monotone" stroke={hsl(tone)} strokeWidth={1.5} fill={`url(#${id})`} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function KpiCard({
  label,
  value,
  icon: Icon,
  tone,
  change,
  days,
  detail,
  spark,
  onClick,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  tone: string;
  change?: number | null;
  days: number;
  detail?: string;
  spark?: number[];
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative min-w-0 overflow-hidden rounded-xl border bg-card p-4 pb-12 text-left shadow-card transition duration-300 hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span className="absolute inset-y-0 left-0 w-1" style={{ background: hsl(tone) }} />
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <span className="rounded-lg p-2" style={{ color: hsl(tone), background: hsl(tone, 0.12) }}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-1 break-words text-xl font-bold tracking-tight sm:text-2xl">{value}</p>
      <div className="relative z-10 mt-2 min-h-5">
        {change !== undefined ? (
          <Trend change={change} days={days} />
        ) : (
          detail && <p className="text-[11px] text-muted-foreground">{detail}</p>
        )}
        {change !== undefined && detail && (
          <p className="mt-1 text-[11px] text-muted-foreground">{detail}</p>
        )}
      </div>
      {spark && <Spark data={spark} tone={tone} />}
    </button>
  );
}

function Panel({
  title,
  icon: Icon,
  aside,
  className,
  children,
}: {
  title: string;
  icon: LucideIcon;
  aside?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cn("min-w-0 rounded-xl border bg-card p-4 shadow-card sm:p-5", className)}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <h3 className="flex items-center gap-2 font-semibold">
          <Icon className="h-5 w-5 text-primary" />
          {title}
        </h3>
        {aside}
      </div>
      {children}
    </section>
  );
}

export function OverviewDashboard({ go }: { go: (v: string) => void }) {
  const [days, setDays] = useState<Range>(30);
  const [hidden, setHidden] = useState<string[]>([]);
  const { user } = useAuth();
  const b = useBookings(),
    p = useProfiles(),
    orders = useOrders(true),
    books = useCatalog(),
    donations = useDonations(true),
    tickets = useTickets(true),
    events = useEvents(true),
    contrib = useContributions(true),
    support = useAllTickets(),
    enquiries = useEnquiries();
  const core = [b, orders, donations, tickets, p];
  const loading = core.some((q) => q.isLoading);

  const m = useMemo(() => {
    const revenue = [
      ...(b.data ?? [])
        .filter((x) => x.payment_status === "paid")
        .map((x) => ({ created_at: x.created_at, key: "Hospitality", value: Number(x.total_amount ?? 0) })),
      ...(orders.data ?? [])
        .filter((x) => x.payment_status === "paid")
        .map((x) => ({ created_at: x.created_at, key: "Bookshop", value: Number(x.amount) })),
      ...(tickets.data ?? []).map((x) => ({ created_at: x.created_at, key: "Events", value: Number(x.amount) })),
      ...(donations.data ?? [])
        .filter((x) => x.status === "received")
        .map((x) => ({ created_at: x.created_at, key: "Donations", value: Number(x.amount) })),
    ];
    const series = dailyBreakdown(revenue, days, MODULES.map((x) => x.key));
    const sparkOf = <T extends { created_at: string }>(rows: T[], v: (r: T) => number = () => 1) =>
      dailyBreakdown(rows.map((r) => ({ created_at: r.created_at, key: "v", value: v(r) })), days, ["v"]).map(
        (d) => d.v as number,
      );
    const bookingsP = (b.data ?? []).filter((x) => inPeriod(x.created_at, days));
    const categories = Object.entries(
      bookingsP.reduce<Record<string, number>>((acc, x) => {
        const name = x.sub_services?.services?.name ?? "Other";
        acc[name] = (acc[name] ?? 0) + 1;
        return acc;
      }, {}),
    )
      .map(([name, value]) => ({ name, value }))
      .sort((a, z) => z.value - a.value);
    const statuses = ["pending", "confirmed", "completed", "cancelled", "rejected"].map((s) => ({
      status: s,
      value: bookingsP.filter((x) => x.status === s).length,
    }));
    const lowStock = (books.data ?? []).flatMap((bk) =>
      bk.bookshop_stock.filter((s) => s.quantity <= s.low_stock_threshold),
    ).length;
    const today = new Date().toISOString().slice(0, 10);
    const attention = [
      { label: "Pending bookings", value: (b.data ?? []).filter((x) => x.status === "pending").length, view: "bookings", icon: CalendarCheck },
      { label: "Open support tickets", value: (support.data ?? []).filter((x) => x.status === "open").length, view: "support", icon: Inbox },
      { label: "New contact enquiries", value: (enquiries.data ?? []).filter((x) => x.status === "new").length, view: "support", icon: Inbox },
      { label: "Contributions to review", value: (contrib.data ?? []).filter((x) => x.status === "pending").length, view: "contributions", icon: Sparkles },
      { label: "Low-stock book lines", value: lowStock, view: "inventory", icon: Package },
    ];
    return {
      revenue,
      series,
      revenueT: periodTotals(revenue, days, (r) => r.value),
      revenueSpark: sparkOf(revenue, (r) => r.value),
      mix: MODULES.map((mod) => ({
        ...mod,
        value: revenue.filter((r) => r.key === mod.key && inPeriod(r.created_at, days)).reduce((n, r) => n + r.value, 0),
      })),
      bookingsT: periodTotals(b.data ?? [], days),
      bookingsSpark: sparkOf(b.data ?? []),
      pendingBookings: attention[0].value,
      ordersT: periodTotals(orders.data ?? [], days),
      ordersSpark: sparkOf(orders.data ?? []),
      ticketsT: periodTotals(tickets.data ?? [], days, (t) => t.quantity),
      ticketsSpark: sparkOf(tickets.data ?? [], (t) => t.quantity),
      upcoming: (events.data ?? []).filter((e) => e.event_date >= today && e.is_published).length,
      donationsT: periodTotals((donations.data ?? []).filter((d) => d.status === "received"), days, (d) => Number(d.amount)),
      donationsSpark: sparkOf((donations.data ?? []).filter((d) => d.status === "received"), (d) => Number(d.amount)),
      usersT: periodTotals(p.data ?? [], days),
      usersSpark: sparkOf(p.data ?? []),
      categories,
      statuses,
      attention,
      lowStock,
    };
  }, [b.data, orders.data, tickets.data, donations.data, p.data, books.data, events.data, contrib.data, support.data, enquiries.data, days]);

  const mixTotal = m.mix.reduce((n, x) => n + x.value, 0);
  const openItems = m.attention.reduce((n, x) => n + x.value, 0);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const name = (user?.user_metadata?.full_name as string | undefined)?.split(" ")[0];
  const statusMax = Math.max(1, ...m.statuses.map((s) => s.value));

  return (
    <div className="space-y-5">
      <header className="relative overflow-hidden rounded-2xl bg-primary p-5 text-primary-foreground shadow-card sm:p-7">
        <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-accent/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-primary-foreground/10 blur-3xl" />
        <div className="relative flex flex-wrap items-end justify-between gap-5">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-[0.2em] opacity-75">
              {new Date().toLocaleDateString("en-KE", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </p>
            <h2 className="mt-2 text-2xl font-bold sm:text-3xl">
              {greeting}
              {name ? `, ${name}` : ""}
            </h2>
            <p className="mt-2 max-w-xl text-sm opacity-85">
              {loading
                ? "Gathering the latest CSLC records…"
                : `${kes(m.revenueT.current)} collected across all departments in the last ${days} days · ${openItems} item${openItems === 1 ? "" : "s"} need${openItems === 1 ? "s" : ""} attention.`}
            </p>
          </div>
          <div role="group" aria-label="Reporting period" className="flex rounded-full bg-primary-foreground/10 p-1 backdrop-blur">
            {RANGES.map((r) => (
              <button
                key={r}
                type="button"
                aria-pressed={days === r}
                onClick={() => setDays(r)}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-xs font-semibold transition",
                  days === r ? "bg-primary-foreground text-primary shadow" : "opacity-80 hover:opacity-100",
                )}
              >
                {r} days
              </button>
            ))}
          </div>
        </div>
      </header>

      {core.some((q) => q.error) && (
        <Alert variant="destructive">
          <AlertDescription>Some records could not be loaded. Refresh to try again.</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {loading
          ? Array.from({ length: 8 }, (_, i) => <Skeleton key={i} className="h-36 rounded-xl" />)
          : (
            <>
              <KpiCard label="Total revenue" value={kes(m.revenueT.current)} icon={Wallet} tone="--primary" change={m.revenueT.change} days={days} spark={m.revenueSpark} onClick={() => go("orders")} />
              <KpiCard label="Hospitality bookings" value={String(m.bookingsT.current)} icon={BedDouble} tone="--chart-2" change={m.bookingsT.change} days={days} detail={`${m.pendingBookings} awaiting review`} spark={m.bookingsSpark} onClick={() => go("bookings")} />
              <KpiCard label="Bookshop orders" value={String(m.ordersT.current)} icon={ShoppingBag} tone="--chart-5" change={m.ordersT.change} days={days} spark={m.ordersSpark} onClick={() => go("orders")} />
              <KpiCard label="Event tickets sold" value={String(m.ticketsT.current)} icon={Ticket} tone="--chart-4" change={m.ticketsT.change} days={days} detail={`${m.upcoming} upcoming event${m.upcoming === 1 ? "" : "s"}`} spark={m.ticketsSpark} onClick={() => go("events")} />
              <KpiCard label="Donations received" value={kes(m.donationsT.current)} icon={HeartHandshake} tone="--chart-3" change={m.donationsT.change} days={days} spark={m.donationsSpark} onClick={() => go("donations")} />
              <KpiCard label="New members" value={String(m.usersT.current)} icon={UsersIcon} tone="--chart-2" change={m.usersT.change} days={days} detail={`${p.data?.length ?? 0} registered in total`} spark={m.usersSpark} onClick={() => go("users")} />
              <KpiCard label="Needs attention" value={String(openItems)} icon={AlertTriangle} tone="--accent" days={days} detail="Bookings, support & submissions" onClick={() => go("support")} />
              <KpiCard label="Low-stock alerts" value={String(m.lowStock)} icon={Package} tone="--destructive" days={days} detail="Book lines at or below threshold" onClick={() => go("inventory")} />
            </>
          )}
      </div>

      <div className="grid min-w-0 gap-4 lg:grid-cols-3">
        <Panel
          title="Revenue trend"
          icon={LineIcon}
          className="lg:col-span-2"
          aside={<span className="text-xs text-muted-foreground">Daily, last {days} days</span>}
        >
          <div className="mb-3 flex flex-wrap gap-2">
            {MODULES.map((mod) => {
              const off = hidden.includes(mod.key);
              return (
                <button
                  key={mod.key}
                  type="button"
                  aria-pressed={!off}
                  onClick={() => setHidden((h) => (off ? h.filter((k) => k !== mod.key) : [...h, mod.key]))}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition",
                    off ? "opacity-45" : "bg-secondary/60",
                  )}
                >
                  <span className="h-2 w-2 rounded-full" style={{ background: hsl(mod.tone) }} />
                  {mod.key}
                </button>
              );
            })}
          </div>
          <div className="h-72" role="img" aria-label={`Revenue per day by department over the last ${days} days`}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={m.series} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                <defs>
                  {MODULES.map((mod) => (
                    <linearGradient key={mod.key} id={`rev-${mod.key}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={hsl(mod.tone)} stopOpacity={0.4} />
                      <stop offset="100%" stopColor={hsl(mod.tone)} stopOpacity={0.02} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" fontSize={11} minTickGap={24} tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground))" />
                <YAxis width={44} fontSize={11} tickLine={false} axisLine={false} tickFormatter={compact} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={chartTooltipStyle} formatter={(v: number, n: string) => [kes(v), n]} />
                {MODULES.filter((mod) => !hidden.includes(mod.key)).map((mod) => (
                  <Area
                    key={mod.key}
                    dataKey={mod.key}
                    stackId="rev"
                    type="monotone"
                    stroke={hsl(mod.tone)}
                    strokeWidth={2}
                    fill={`url(#rev-${mod.key})`}
                    animationDuration={700}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Revenue mix" icon={ChartPie}>
          {mixTotal ? (
            <>
              <div className="relative h-48" role="img" aria-label={m.mix.map((x) => `${x.key}: ${kes(x.value)}`).join("; ")}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={m.mix.filter((x) => x.value > 0)} dataKey="value" nameKey="key" innerRadius="62%" outerRadius="88%" paddingAngle={3} stroke="hsl(var(--card))" animationDuration={700}>
                      {m.mix.filter((x) => x.value > 0).map((x) => (
                        <Cell key={x.key} fill={hsl(x.tone)} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={chartTooltipStyle} formatter={(v: number) => kes(v)} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-lg font-bold">KSh {compact(mixTotal)}</p>
                  <p className="text-[11px] text-muted-foreground">{days}-day total</p>
                </div>
              </div>
              <ul className="mt-4 space-y-2.5">
                {m.mix.map((x) => (
                  <li key={x.key} className="flex items-center gap-2 text-sm">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: hsl(x.tone) }} />
                    <span className="flex-1">{x.key}</span>
                    <span className="font-semibold">{kes(x.value)}</span>
                    <span className="w-10 text-right text-xs text-muted-foreground">{Math.round((x.value / mixTotal) * 100)}%</span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="flex h-64 items-center justify-center text-center text-sm text-muted-foreground">No paid transactions in the last {days} days</p>
          )}
        </Panel>
      </div>

      <div className="grid min-w-0 gap-4 lg:grid-cols-3">
        <Panel title="Bookings by category" icon={BedDouble}>
          {m.categories.length ? (
            <div className="h-64" role="img" aria-label={m.categories.map((c) => `${c.name}: ${c.value}`).join("; ")}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={m.categories} layout="vertical" margin={{ top: 0, right: 16, bottom: 0, left: 0 }}>
                  <XAxis type="number" hide allowDecimals={false} />
                  <YAxis type="category" dataKey="name" width={110} fontSize={11} tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip contentStyle={chartTooltipStyle} cursor={{ fill: "hsl(var(--muted))" }} />
                  <Bar dataKey="value" name="Bookings" radius={[0, 6, 6, 0]} barSize={16} fill={hsl("--chart-2")} animationDuration={700} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="flex h-64 items-center justify-center text-sm text-muted-foreground">No bookings in the last {days} days</p>
          )}
        </Panel>

        <Panel title="Booking pipeline" icon={CalendarCheck}>
          <ul className="space-y-4">
            {m.statuses.map((s) => (
              <li key={s.status}>
                <div className="mb-1.5 flex justify-between text-sm">
                  <span className="capitalize">{s.status}</span>
                  <span className="font-semibold">{s.value}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${(s.value / statusMax) * 100}%`,
                      background: hsl(
                        s.status === "pending" ? "--accent" : s.status === "confirmed" ? "--primary" : s.status === "completed" ? "--chart-3" : "--destructive",
                      ),
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Action centre" icon={AlertTriangle}>
          <ul className="divide-y">
            {m.attention.map((a) => (
              <li key={a.label}>
                <button type="button" onClick={() => go(a.view)} className="group flex w-full items-center gap-3 py-2.5 text-left text-sm">
                  <span className="rounded-lg bg-secondary p-2 text-primary"><a.icon className="h-4 w-4" /></span>
                  <span className="flex-1">{a.label}</span>
                  <span className={cn("min-w-7 rounded-full px-2 py-0.5 text-center text-xs font-bold", a.value ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground")}>{a.value}</span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
                </button>
              </li>
            ))}
          </ul>
          <Button variant="outline" size="sm" className="mt-3 w-full" onClick={() => go("bookings")}>
            Review bookings
          </Button>
        </Panel>
      </div>
    </div>
  );
}
