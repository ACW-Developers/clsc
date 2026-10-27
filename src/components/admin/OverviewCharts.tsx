
import {
  ResponsiveContainer,
  BarChart,
  Bar,
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

type Transaction = {
  created_at: string;
  amount: number;
  status: string;
};

type OverviewChartsProps = {
  bookings: BookingRow[];
  orders?: Transaction[];
  donations?: Transaction[];
};

const MODULE_COLORS = {
  bookings: "#F37021",
  orders: "#7C3AED",
  donations: "#0D9488",
};

const formatNumber = (value: number) =>
  new Intl.NumberFormat("en-KE").format(value);

const tooltipStyle = {
  backgroundColor: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "12px",
  color: "hsl(var(--foreground))",
  boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
  padding: "10px 14px",
};

export function OverviewCharts({
  bookings,
  orders = [],
  donations = [],
}: OverviewChartsProps) {
  const totalBookings = bookings.length;
  const totalOrders = orders.length;
  const totalDonations = donations.length;

  const totalRecords =
    totalBookings + totalOrders + totalDonations;

  // Last six calendar months, oldest to newest.
  const months = Array.from({ length: 6 }, (_, i) => {
    const date = new Date();
    date.setDate(1);
    date.setHours(0, 0, 0, 0);
    date.setMonth(date.getMonth() - 5 + i);

    const key = [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
    ].join("-");

    return {
      key,
      month: date.toLocaleDateString("en", {
        month: "short",
        year: "2-digit",
      }),
      bookings: bookings.filter((item) =>
        item.created_at?.startsWith(key),
      ).length,
      orders: orders.filter((item) =>
        item.created_at?.startsWith(key),
      ).length,
      donations: donations.filter((item) =>
        item.created_at?.startsWith(key),
      ).length,
    };
  });

  // Combined activity distribution across all three modules.
  const moduleDistribution = [
    {
      name: "Hospitality Bookings",
      shortName: "Bookings",
      value: totalBookings,
      color: MODULE_COLORS.bookings,
    },
    {
      name: "Bookshop E-commerce",
      shortName: "Orders",
      value: totalOrders,
      color: MODULE_COLORS.orders,
    },
    {
      name: "Donations",
      shortName: "Donations",
      value: totalDonations,
      color: MODULE_COLORS.donations,
    },
  ].map((item) => ({
    ...item,
    percentage:
      totalRecords > 0
        ? (item.value / totalRecords) * 100
        : 0,
  }));

  const cardClass =
    "min-w-0 rounded-2xl border border-border/70 bg-card p-5 shadow-sm transition-shadow duration-200 hover:shadow-md sm:p-6";

  const headingClass =
    "text-base font-semibold tracking-tight text-foreground";

  const mutedClass = "text-sm text-muted-foreground";

  return (
    <div className="min-w-0 space-y-6">

      {/* Monthly module activity */}
      <section className={cardClass}>
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className={headingClass}>
              Module Activity Overview
            </h2>
            <p className={`mt-1 ${mutedClass}`}>
              Compare monthly bookings, e-commerce orders and donations.
            </p>
          </div>

          <span className="w-fit rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
            Last 6 months
          </span>
        </div>

        <div
          className="h-72 min-w-0 sm:h-80"
          role="img"
          aria-label={months
            .map(
              (item) =>
                `${item.month}: ${item.bookings} bookings, ${item.orders} orders, ${item.donations} donations`,
            )
            .join("; ")}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={months}
              margin={{
                top: 12,
                right: 12,
                left: 8,
                bottom: 16,
              }}
              barGap={5}
              barCategoryGap="24%"
            >
              <CartesianGrid
                stroke="hsl(var(--border))"
                strokeDasharray="4 4"
                vertical={false}
              />

              <XAxis
                dataKey="month"
                type="category"
                tick={{
                  fill: "hsl(var(--muted-foreground))",
                  fontSize: 11,
                }}
                axisLine={{
                  stroke: "hsl(var(--border))",
                }}
                tickLine={false}
                tickMargin={10}
                label={{
                  value: "Month",
                  position: "insideBottom",
                  offset: -8,
                  fill: "hsl(var(--muted-foreground))",
                  fontSize: 12,
                }}
              />

              <YAxis
                type="number"
                domain={[0, (max: number) => Math.max(5, max)]}
                allowDecimals={false}
                width={42}
                tick={{
                  fill: "hsl(var(--muted-foreground))",
                  fontSize: 11,
                }}
                axisLine={{
                  stroke: "hsl(var(--border))",
                }}
                tickLine={false}
                tickMargin={8}
                label={{
                  value: "Number of records",
                  angle: -90,
                  position: "insideLeft",
                  fill: "hsl(var(--muted-foreground))",
                  fontSize: 11,
                  style: { textAnchor: "middle" },
                }}
              />

              <Tooltip
                contentStyle={tooltipStyle}
                cursor={{
                  fill: "hsl(var(--muted))",
                  opacity: 0.3,
                }}
                formatter={(value, name) => [
                  formatNumber(Number(value)),
                  name,
                ]}
                labelFormatter={(label) => `Month: ${label}`}
              />

              <Legend
                verticalAlign="top"
                align="right"
                height={36}
                iconType="circle"
                iconSize={8}
                wrapperStyle={{
                  fontSize: "12px",
                  paddingBottom: "12px",
                }}
              />

              <Bar
                name="Bookings"
                dataKey="bookings"
                fill={MODULE_COLORS.bookings}
                radius={[5, 5, 0, 0]}
                maxBarSize={28}
                isAnimationActive={false}
              />

              <Bar
                name="E-commerce Orders"
                dataKey="orders"
                fill={MODULE_COLORS.orders}
                radius={[5, 5, 0, 0]}
                maxBarSize={28}
                isAnimationActive={false}
              />

              <Bar
                name="Donations"
                dataKey="donations"
                fill={MODULE_COLORS.donations}
                radius={[5, 5, 0, 0]}
                maxBarSize={28}
                isAnimationActive={false}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Combined module distribution and monthly records */}
      <div className="grid min-w-0 grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Combined pie chart */}
        <section className={cardClass}>
          <div className="mb-2">
            <h2 className={headingClass}>
              Overall Module Distribution
            </h2>
            <p className={`mt-1 ${mutedClass}`}>
              Combined share of hospitality, bookshop e-commerce and donations.
            </p>
          </div>

          {totalRecords > 0 ? (
            <>
              <div
                className="relative h-64 min-w-0 sm:h-72"
                role="img"
                aria-label={moduleDistribution
                  .map(
                    (item) =>
                      `${item.name}: ${item.value} records, ${item.percentage.toFixed(1)} percent`,
                  )
                  .join("; ")}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={moduleDistribution}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius="52%"
                      outerRadius="78%"
                      paddingAngle={3}
                      cornerRadius={4}
                      stroke="hsl(var(--card))"
                      strokeWidth={3}
                      isAnimationActive={false}
                    >
                      {moduleDistribution.map((item) => (
                        <Cell
                          key={item.name}
                          fill={item.color}
                        />
                      ))}
                    </Pie>

                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(value, name) => {
                        const item = moduleDistribution.find(
                          (entry) => entry.name === name,
                        );

                        return [
                          `${formatNumber(Number(value))} records (${item?.percentage.toFixed(1) ?? "0.0"}%)`,
                          name,
                        ];
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>

                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xs text-muted-foreground">
                    Total Records
                  </span>
                  <span className="mt-1 text-3xl font-bold tracking-tight text-foreground">
                    {formatNumber(totalRecords)}
                  </span>
                </div>
              </div>

              {/* Detailed module legend */}
              <div className="mt-3 space-y-4">
                {moduleDistribution.map((item) => (
                  <div key={item.name} className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2">
                        <span
                          className="h-3 w-3 shrink-0 rounded-full"
                          style={{
                            backgroundColor: item.color,
                          }}
                          aria-hidden="true"
                        />
                        <span className="truncate text-sm font-medium text-foreground">
                          {item.name}
                        </span>
                      </div>

                      <div className="flex shrink-0 items-center gap-3">
                        <span className="text-sm font-semibold tabular-nums text-foreground">
                          {formatNumber(item.value)}
                        </span>
                        <span className="w-14 text-right text-xs tabular-nums text-muted-foreground">
                          {item.percentage.toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    <div
                      className="h-1.5 overflow-hidden rounded-full bg-muted"
                      role="progressbar"
                      aria-label={`${item.name} share`}
                      aria-valuenow={Number(item.percentage.toFixed(1))}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    >
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${item.percentage}%`,
                          backgroundColor: item.color,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex h-64 flex-col items-center justify-center text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <span className="text-xl">◔</span>
              </div>

              <p className="font-medium text-foreground">
                No records available yet
              </p>

              <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                The combined chart will display bookings, orders and
                donations as records are captured.
              </p>
            </div>
          )}
        </section>

        {/* Monthly records table */}
        <section className={cardClass}>
          <div className="mb-5">
            <h2 className={headingClass}>
              Monthly Records
            </h2>
            <p className={`mt-1 ${mutedClass}`}>
              Monthly breakdown across all three modules.
            </p>
          </div>

          <div className="overflow-x-auto rounded-xl border border-border/70">
            <table className="w-full min-w-[420px] border-collapse text-sm">
              <thead>
                <tr className="bg-muted/60 text-left">
                  <th className="px-4 py-3 font-semibold text-muted-foreground">
                    Month
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-muted-foreground">
                    Bookings
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-muted-foreground">
                    Orders
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-muted-foreground">
                    Donations
                  </th>
                </tr>
              </thead>

              <tbody>
                {months.map((month) => (
                  <tr
                    key={month.key}
                    className="border-t border-border/60 transition-colors hover:bg-muted/30"
                  >
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-foreground">
                      {month.month}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {formatNumber(month.bookings)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {formatNumber(month.orders)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {formatNumber(month.donations)}
                    </td>
                  </tr>
                ))}
              </tbody>

              <tfoot>
                <tr className="border-t-2 border-border bg-muted/40 font-semibold">
                  <td className="px-4 py-3 text-foreground">
                    Total
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-foreground">
                    {formatNumber(totalBookings)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-foreground">
                    {formatNumber(totalOrders)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-foreground">
                    {formatNumber(totalDonations)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <p className="mt-3 text-xs text-muted-foreground">
            The table displays the last six calendar months.
            Totals include all records supplied to this component.
          </p>
        </section>
      </div>
    </div>
  );
}
