import { useState } from "react";
import { Activity, Globe, Eye, Monitor, Laptop } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
} from "recharts";
import { useTraffic } from "@/hooks/analytics/useTraffic";
import { StatCard } from "@/components/common/StatCard";
import {
  chartColors,
  chartTooltipStyle,
  dailyActivity,
} from "./analyticsPresentation";

export function TrafficAnalytics() {
  const q = useTraffic();
  const [period, setPeriod] = useState(30);
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - period + 1);
  const events = (q.data ?? []).filter(
    (event) => new Date(event.created_at) >= start,
  );
  const visits = events.filter((event) => event.event_type === "visit");
  const dailyClicks = dailyActivity(
    events.filter((event) => event.event_type === "click"),
    period,
  );
  const days = dailyActivity(visits, period).map((day, index) => ({
    ...day,
    clicks: dailyClicks[index]?.count ?? 0,
  }));
  const breakdown = (field: "device" | "os" | "path") =>
    [...new Set(visits.map((event) => event[field]))]
      .map((name) => ({
        name,
        count: visits.filter((event) => event[field] === name).length,
      }))
      .sort((a, b) => b.count - a.count);
  const devices = breakdown("device"),
    systems = breakdown("os"),
    pages = breakdown("path").slice(0, 6);
  const panel = "min-w-0 rounded-lg border bg-card p-4";
  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <Activity className="mt-1 h-5 w-5 text-primary" />
          <div>
            <h2 className="text-xl font-semibold">
              Traffic · Last {period} days
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Visits, clicks, devices and operating systems
            </p>
          </div>
        </div>
        <select
          aria-label="Traffic date range"
          className="h-10 rounded-md border bg-card px-3 text-sm"
          value={period}
          onChange={(event) => setPeriod(Number(event.target.value))}
        >
          <option value={7}>Last 7 days</option>
          <option value={14}>Last 14 days</option>
          <option value={30}>Last 30 days</option>
        </select>
      </div>
      {q.isLoading ? (
        <p role="status" className="py-6 text-muted-foreground">
          Loading traffic…
        </p>
      ) : q.error ? (
        <p role="alert" className="text-destructive">
          {q.error.message}
        </p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            <StatCard
              label="Total visits"
              value={visits.length}
              icon={Eye}
              detail={`${events.filter((event) => event.event_type === "click").length} control clicks`}
            />
            <StatCard
              label="Countries"
              value="Unavailable"
              icon={Globe}
              detail="Location is not collected"
            />
            <StatCard
              label="Top device"
              value={devices[0]?.name ?? "—"}
              icon={Monitor}
              detail={`${devices[0]?.count ?? 0} visits`}
            />
            <StatCard
              label="Top operating system"
              value={systems[0]?.name ?? "—"}
              icon={Laptop}
              detail={`${systems[0]?.count ?? 0} visits`}
            />
          </div>
          {!events.length && (
            <p className="text-sm text-muted-foreground">
              No traffic recorded in this period.
            </p>
          )}
          <div className="grid gap-3 lg:grid-cols-2">
            <section className={panel}>
              <h3 className="mb-4 text-sm font-medium">
                Visits & clicks over time
              </h3>
              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={days}>
                    <CartesianGrid
                      stroke="hsl(var(--border))"
                      strokeDasharray="3 3"
                    />
                    <XAxis
                      dataKey="day"
                      minTickGap={30}
                      fontSize={10}
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <YAxis allowDecimals={false} width={30} fontSize={10} />
                    <Tooltip contentStyle={chartTooltipStyle} />
                    <Legend
                      iconType="circle"
                      iconSize={8}
                      wrapperStyle={{ fontSize: 11 }}
                    />
                    <Line
                      name="Visits"
                      dataKey="count"
                      type="monotone"
                      stroke={chartColors[0]}
                      strokeWidth={2}
                      dot={false}
                      isAnimationActive={false}
                    />
                    <Line
                      name="Clicks"
                      dataKey="clicks"
                      type="monotone"
                      stroke={chartColors[3]}
                      strokeWidth={2}
                      dot={false}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </section>
            <section className={panel}>
              <h3 className="mb-4 text-sm font-medium">Devices</h3>
              {devices.length ? (
                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={devices}
                        dataKey="count"
                        nameKey="name"
                        outerRadius="75%"
                        label={({ value }) => value}
                        isAnimationActive={false}
                      >
                        {devices.map((item, index) => (
                          <Cell
                            key={item.name}
                            fill={chartColors[index % chartColors.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={chartTooltipStyle} />
                      <Legend
                        iconType="square"
                        iconSize={8}
                        wrapperStyle={{ fontSize: 11 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex h-60 items-center justify-center text-sm text-muted-foreground">
                  No device data
                </div>
              )}
            </section>
            <section className={panel}>
              <h3 className="mb-4 text-sm font-medium">Operating systems</h3>
              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={systems}>
                    <CartesianGrid
                      stroke="hsl(var(--border))"
                      strokeDasharray="3 3"
                    />
                    <XAxis dataKey="name" fontSize={10} interval={0} />
                    <YAxis allowDecimals={false} width={30} fontSize={10} />
                    <Tooltip contentStyle={chartTooltipStyle} />
                    <Bar
                      name="Visits"
                      dataKey="count"
                      fill={chartColors[1]}
                      maxBarSize={48}
                      radius={[3, 3, 0, 0]}
                      isAnimationActive={false}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>
            <section className={panel}>
              <h3 className="mb-4 text-sm font-medium">Top pages</h3>
              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={pages}
                    layout="vertical"
                    margin={{ right: 16 }}
                  >
                    <CartesianGrid
                      stroke="hsl(var(--border))"
                      strokeDasharray="3 3"
                    />
                    <XAxis type="number" allowDecimals={false} fontSize={10} />
                    <YAxis
                      dataKey="name"
                      type="category"
                      width={105}
                      fontSize={10}
                      tickFormatter={(value: string) =>
                        value.length > 17 ? `${value.slice(0, 16)}…` : value
                      }
                    />
                    <Tooltip contentStyle={chartTooltipStyle} />
                    <Bar
                      name="Visits"
                      dataKey="count"
                      fill={chartColors[2]}
                      maxBarSize={22}
                      radius={[0, 3, 3, 0]}
                      isAnimationActive={false}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>
          </div>
          <p className="text-xs text-muted-foreground">
            {new Set(events.map((event) => event.session_id)).size} recorded
            browser sessions (not unique people). Browser names, countries and
            referrals are not collected. Devices and operating systems are
            browser-reported.
            {(q.data?.length ?? 0) >= 10000 &&
              " Limited to the most recent 10,000 events."}
          </p>
        </>
      )}
    </section>
  );
}
