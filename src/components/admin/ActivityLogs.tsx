import { useMemo, useState } from "react";
import {
  Activity,
  ChevronDown,
  FilePlus2,
  FileX2,
  PencilLine,
  type LucideIcon,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { useLogs, useLogTrend } from "@/hooks/useHospitality";
import type { ActivityLog } from "@/services/hospitality";
import { Pager, State, Toolbar } from "./AdminViews";
import { chartColors, chartTooltipStyle, dailyActivity } from "./analyticsPresentation";

const PAGE = 10;
const modules = [
  "Hospitality",
  "Bookshop",
  "Student Programmes",
  "Support",
  "Reviews",
  "Users & Access",
  "About & Content",
  "Settings",
];
const ops: Record<string, { label: string; icon: LucideIcon; variant: "default" | "secondary" | "destructive" }> = {
  insert: { label: "Created", icon: FilePlus2, variant: "default" },
  update: { label: "Updated", icon: PencilLine, variant: "secondary" },
  delete: { label: "Deleted", icon: FileX2, variant: "destructive" },
};

type Change = { from: unknown; to: unknown };
const field = (k: string) =>
  k.replace(/_/g, " ").replace(/\bid\b/i, "ID").replace(/^./, (c) => c.toUpperCase());
const show = (v: unknown) =>
  v === null || v === undefined || v === ""
    ? "—"
    : typeof v === "boolean"
      ? v ? "Yes" : "No"
      : String(v).replace(/_/g, " ");
const initials = (n: string) =>
  n.split(/\s+|@/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("") || "S";

function Changes({ changes }: { changes: Record<string, Change> }) {
  const list = Object.entries(changes);
  if (!list.length) return null;
  return (
    <details className="group mt-2">
      <summary className="inline-flex cursor-pointer list-none items-center gap-1 rounded text-xs font-semibold text-primary outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <ChevronDown className="h-3.5 w-3.5 transition-transform group-open:rotate-180" />
        {list.length} field{list.length > 1 ? "s" : ""} changed
      </summary>
      <dl className="mt-2 grid gap-1.5 rounded-md border bg-muted/40 p-3 text-xs">
        {list.map(([k, c]) => (
          <div key={k} className="grid gap-1 sm:grid-cols-[9rem_1fr]">
            <dt className="font-medium text-muted-foreground">{field(k)}</dt>
            <dd className="min-w-0 break-words">
              <span className="text-muted-foreground line-through decoration-muted-foreground/50">{show(c.from)}</span>
              <span className="mx-1.5 text-muted-foreground">→</span>
              <span className="font-medium">{show(c.to)}</span>
            </dd>
          </div>
        ))}
      </dl>
    </details>
  );
}

function LogRow({ l }: { l: ActivityLog }) {
  const op = ops[l.operation] ?? ops.update;
  const name = l.actor_name || (l.actor_id ? "Former user" : "System");
  const role = !l.actor_id ? (l.actor_name ? "Guest" : "Automated") : null;
  const at = new Date(l.created_at);
  return (
    <li className="grid gap-3 border-t p-4 first:border-t-0 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,2fr)_9rem] lg:items-start lg:gap-6">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
          {initials(name)}
        </span>
        <div className="min-w-0">
          <p className="truncate font-medium">{name}</p>
          {role && <p className="text-xs text-muted-foreground">{role}</p>}
        </div>
      </div>
      <div className="min-w-0">
        <p className="flex flex-wrap items-center gap-2 font-semibold">
          <op.icon className="h-4 w-4 shrink-0 text-primary" aria-hidden />
          {l.action}
          <Badge variant={op.variant} className="font-normal">{op.label}</Badge>
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{l.module}</span>
          {l.summary && <> · {l.summary}</>}
        </p>
        {l.changes && typeof l.changes === "object" && (
          <Changes changes={l.changes as Record<string, Change>} />
        )}
      </div>
      <time dateTime={l.created_at} className="text-sm lg:text-right">
        <span className="block">
          {at.toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
        </span>
        <span className="text-xs text-muted-foreground">
          {at.toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" })}
        </span>
      </time>
    </li>
  );
}

const selectCls = "h-10 rounded-md border bg-card px-3 text-sm";

/** Staff activity log: who did what, to which record, with field-level changes. */
export function ActivityLogs() {
  const [term, setTerm] = useState("");
  const [page, setPage] = useState(1);
  const [module, setModule] = useState("all");
  const [operation, setOperation] = useState("all");
  const [period, setPeriod] = useState("all");
  const since = useMemo(() => {
    if (period === "all") return undefined;
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - Number(period) + 1);
    return d.toISOString();
  }, [period]);
  const q = useLogs({ page, pageSize: PAGE, module, operation, since, term: term.trim() });
  const trend = useLogTrend(7);
  const chart = useMemo(() => {
    const rows = trend.data ?? [];
    const by = (o: string) => dailyActivity(rows.filter((r) => r.operation === o), 7);
    const [c, u, d] = [by("insert"), by("update"), by("delete")];
    return c.map((day, i) => ({ day: day.day, Created: day.count, Updated: u[i].count, Deleted: d[i].count }));
  }, [trend.data]);
  const reset = <T,>(set: (v: T) => void) => (v: T) => {
    set(v);
    setPage(1);
  };
  const total = q.data?.total ?? 0;

  return (
    <div className="space-y-5">
      <section className="rounded-lg border bg-card p-4 sm:p-5">
        <h3 className="mb-5 flex items-center gap-2 font-semibold">
          <Activity className="h-5 w-5 text-primary" />
          Activity (Last 7 Days)
        </h3>
        <State q={trend} empty={false}>
          <div
            className="h-56"
            role="img"
            aria-label={chart
              .map((d) => `${d.day}: ${d.Created} created, ${d.Updated} updated, ${d.Deleted} deleted`)
              .join("; ")}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chart} margin={{ right: 16 }}>
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
                <XAxis dataKey="day" fontSize={11} minTickGap={15} stroke="hsl(var(--muted-foreground))" />
                <YAxis allowDecimals={false} width={30} fontSize={11} />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Created" stackId="a" fill={chartColors[0]} isAnimationActive={false} />
                <Bar dataKey="Updated" stackId="a" fill={chartColors[1]} isAnimationActive={false} />
                <Bar dataKey="Deleted" stackId="a" fill={chartColors[3] ?? chartColors[2]} radius={[3, 3, 0, 0]} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </State>
      </section>

      <div>
        <Toolbar term={term} setTerm={reset(setTerm)}>
          <select aria-label="Filter by module" value={module} onChange={(e) => reset(setModule)(e.target.value)} className={selectCls}>
            <option value="all">All modules</option>
            {modules.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
          <select aria-label="Filter by type of change" value={operation} onChange={(e) => reset(setOperation)(e.target.value)} className={selectCls}>
            <option value="all">All changes</option>
            {Object.entries(ops).map(([k, o]) => <option key={k} value={k}>{o.label}</option>)}
          </select>
          <select aria-label="Filter by date" value={period} onChange={(e) => reset(setPeriod)(e.target.value)} className={selectCls}>
            <option value="all">All time</option>
            <option value="1">Today</option>
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
        </Toolbar>
        <p className="text-xs text-muted-foreground">
          {total} matching {total === 1 ? "entry" : "entries"} · local times · site visits are reported separately in Settings.
        </p>
      </div>

      <State q={q} empty={!q.data?.rows.length}>
        <div className={`overflow-hidden rounded-lg border bg-card transition-opacity ${q.isPlaceholderData ? "opacity-60" : ""}`}>
          <div className="hidden bg-muted px-4 py-3 text-left text-sm font-semibold lg:grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,2fr)_9rem] lg:gap-6">
            <span>User</span>
            <span>Action & record</span>
            <span className="text-right">Date & time</span>
          </div>
          <ul>
            {q.data?.rows.map((l) => <LogRow key={l.id} l={l} />)}
          </ul>
        </div>
        <Pager page={page} total={total} set={setPage} />
      </State>
    </div>
  );
}
