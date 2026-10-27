import { Globe, MousePointerClick, Eye, Monitor } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";
import { useTraffic } from "@/hooks/analytics/useTraffic";
import { StatCard } from "@/components/common/StatCard";
export function TrafficAnalytics() {
  const q = useTraffic(), events = q.data ?? [];
  const visits = events.filter((e) => e.event_type === "visit");
  const days = Array.from({ length: 30 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - 29 + i); const key = d.toISOString().slice(0, 10); return { day: d.toLocaleDateString("en", { day: "numeric", month: "short" }), visits: events.filter((e) => e.event_type === "visit" && e.created_at.startsWith(key)).length, clicks: events.filter((e) => e.event_type === "click" && e.created_at.startsWith(key)).length }; });
  const breakdown = (field: "device" | "os" | "path") => [...new Set(visits.map((e) => e[field]))].map((name) => ({ name, count: visits.filter((e) => e[field] === name).length })).sort((a, b) => b.count - a.count);
  return <section className="space-y-6">
    <div><h2 className="text-xl font-semibold">Traffic Analytics</h2><p className="mt-1 text-sm text-muted-foreground">Last 30 days · recorded page views and control clicks · tracking starts from this update</p></div>
    {q.isLoading ? <p>Loading traffic…</p> : q.error ? <p role="alert" className="text-destructive">{q.error.message}</p> : <>
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4"><StatCard label="Page views" value={visits.length} icon={Eye} /><StatCard label="Clicks" value={events.length - visits.length} icon={MousePointerClick} /><StatCard label="Browser sessions" value={new Set(events.map((e) => e.session_id)).size} icon={Monitor} detail="Not unique people" /><StatCard label="Countries" value="Unavailable" icon={Globe} detail="Location data is not collected" /></div>
    {events.length >= 10000 && <p className="text-xs text-muted-foreground">Showing the most recent 10,000 events in this period.</p>}
    {!events.length && <p className="border-y py-6 text-sm text-muted-foreground">No traffic has been recorded yet.</p>}
    <section className="border-y py-5"><h3 className="mb-4 font-semibold">Visits & clicks over time</h3><div className="h-64 min-w-0"><ResponsiveContainer width="100%" height="100%"><LineChart data={days}><CartesianGrid stroke="hsl(var(--border))" vertical={false} /><XAxis dataKey="day" minTickGap={30} fontSize={11} stroke="hsl(var(--muted-foreground))" /><YAxis allowDecimals={false} width={32} fontSize={11} /><Tooltip contentStyle={{ background: "hsl(var(--card))", borderColor: "hsl(var(--border))", color: "hsl(var(--foreground))" }} /><Line name="Page views" dataKey="visits" stroke="hsl(var(--primary))" dot={false} isAnimationActive={false} /><Line name="Clicks" dataKey="clicks" stroke="hsl(var(--accent))" dot={false} isAnimationActive={false} /></LineChart></ResponsiveContainer></div><p className="text-xs text-muted-foreground">Maroon: page views · Gold: clicks</p></section>
    <div className="grid gap-6 lg:grid-cols-3">{(["device", "os", "path"] as const).map((field) => <section key={field} className="min-w-0"><h3 className="mb-3 font-semibold">{field === "device" ? "Devices" : field === "os" ? "Operating systems" : "Top pages"}</h3>{breakdown(field).slice(0, 8).map((r) => <div key={r.name} className="flex justify-between gap-3 border-b py-3 text-sm"><span className="break-all">{r.name}</span><strong>{r.count}</strong></div>)}{!visits.length && <p className="text-sm text-muted-foreground">No recorded visits</p>}</section>)}</div>
    <p className="border-t pt-4 text-xs text-muted-foreground">Devices and operating systems are browser-reported. Countries, referral sources, session duration and historical traffic are unavailable. No personal details or form contents are collected.</p>
    </>}
  </section>;
}