import { Activity, ChartPie } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import type { BookingRow } from "@/services/hospitality";
import {
  chartColors,
  chartTooltipStyle,
  dailyActivity,
} from "./analyticsPresentation";

type Transaction = { created_at: string; amount: number; status: string };
export function OverviewCharts({
  bookings,
  orders = [],
  donations = [],
}: {
  bookings: BookingRow[];
  orders?: Transaction[];
  donations?: Transaction[];
}) {
  const activity = dailyActivity([...bookings, ...orders, ...donations], 7);
  const distribution = [
    { name: "Hospitality", value: bookings.length },
    { name: "Bookshop", value: orders.length },
    { name: "Donations", value: donations.length },
  ];
  const total = distribution.reduce((sum, item) => sum + item.value, 0);
  return (
    <div className="grid min-w-0 gap-4 lg:grid-cols-2">
      <section className="min-w-0 rounded-lg border bg-card p-4 sm:p-5">
        <div className="mb-6 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <Activity className="mt-1 h-5 w-5 text-primary" />
            <div>
              <h3 className="font-semibold">Weekly module activity</h3>
              <p className="mt-1 text-xs text-muted-foreground">Last 7 days</p>
            </div>
          </div>
          <span className="text-xs font-medium text-primary">
            {activity.reduce((sum, item) => sum + item.count, 0)} records
          </span>
        </div>
        <div
          className="h-72"
          role="img"
          aria-label={activity
            .map((item) => `${item.day}: ${item.count} records`)
            .join("; ")}
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={activity}
              margin={{ top: 10, right: 12, bottom: 10, left: 0 }}
            >
              <CartesianGrid
                stroke="hsl(var(--border))"
                strokeDasharray="3 3"
              />
              <XAxis
                dataKey="day"
                fontSize={11}
                minTickGap={15}
                stroke="hsl(var(--muted-foreground))"
              />
              <YAxis
                allowDecimals={false}
                width={30}
                fontSize={11}
                stroke="hsl(var(--muted-foreground))"
              />
              <Tooltip contentStyle={chartTooltipStyle} />
              <Line
                dataKey="count"
                name="Records"
                type="monotone"
                stroke={chartColors[0]}
                strokeWidth={2}
                dot={{ r: 3 }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>
      <section className="min-w-0 rounded-lg border bg-card p-4 sm:p-5">
        <h3 className="flex items-center gap-3 font-semibold">
          <ChartPie className="h-5 w-5 text-primary" />
          Module distribution
        </h3>
        {total ? (
          <div
            className="relative mt-4 h-72"
            role="img"
            aria-label={distribution
              .map((item) => `${item.name}: ${item.value}`)
              .join("; ")}
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={distribution.filter((item) => item.value > 0)}
                  dataKey="value"
                  nameKey="name"
                  innerRadius="55%"
                  outerRadius="78%"
                  paddingAngle={3}
                  stroke="hsl(var(--card))"
                  isAnimationActive={false}
                >
                  {distribution
                    .filter((item) => item.value > 0)
                    .map((item) => (
                      <Cell
                        key={item.name}
                        fill={chartColors[distribution.indexOf(item)]}
                      />
                    ))}
                </Pie>
                <Tooltip contentStyle={chartTooltipStyle} />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: 12 }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-x-0 top-[42%] text-center">
              <p className="text-2xl font-bold">{total}</p>
              <p className="text-xs text-muted-foreground">Total records</p>
            </div>
          </div>
        ) : (
          <div className="flex h-72 items-center justify-center text-sm text-muted-foreground">
            No module records yet
          </div>
        )}
      </section>
    </div>
  );
}
