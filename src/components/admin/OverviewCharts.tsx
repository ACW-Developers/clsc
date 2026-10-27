import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import type { BookingRow } from "@/services/hospitality";

type Transaction = { created_at: string; amount: number; status: string };
export function OverviewCharts({ bookings, orders = [], donations = [] }: { bookings: BookingRow[]; orders?: Transaction[]; donations?: Transaction[] }) {
  const months = Array.from({ length: 6 }, (_, i) => {
    const date = new Date();
    date.setDate(1);
    date.setMonth(date.getMonth() - 5 + i);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const rows = bookings.filter((b) => b.created_at.startsWith(key));
    return {
      month: date.toLocaleDateString("en", { month: "short" }),
      bookings: rows.length,
      orders: orders.filter((o) => o.created_at.startsWith(key)).length,
      donations: donations.filter((o) => o.created_at.startsWith(key)).length,
    };
  });
  const categories = [
    ...new Set(bookings.map((b) => b.sub_services?.services?.name ?? "Other")),
  ].map((name) => ({
    name,
    bookings: bookings.filter(
      (b) => (b.sub_services?.services?.name ?? "Other") === name,
    ).length,
  }));
  return (
    <div className="grid min-w-0 gap-6 xl:grid-cols-2">
      <section className="min-w-0 border-y py-5">
        <h2 className="font-semibold">Module activity over time</h2>
        <p className="mb-4 text-xs text-muted-foreground">
          Last six months · record creation date
        </p>
        <div
          className="h-64"
          role="img"
          aria-label={months
            .map((m) => `${m.month}: ${m.bookings} bookings`)
            .join(", ")}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={months}>
              <CartesianGrid vertical={false} stroke="hsl(var(--border))" />
              <XAxis
                dataKey="month"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <YAxis
                allowDecimals={false}
                width={30}
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  borderColor: "hsl(var(--border))",
                  color: "hsl(var(--foreground))",
                }}
              />
              <Bar name="Orders" dataKey="orders" fill="hsl(var(--accent))" radius={[4,4,0,0]} isAnimationActive={false} />
              <Bar name="Donations" dataKey="donations" fill="hsl(var(--muted-foreground))" radius={[4,4,0,0]} isAnimationActive={false} />
              <Bar
                name="Bookings"
                dataKey="bookings"
                fill="hsl(var(--primary))"
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
                isAnimationActive={false}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="text-xs text-muted-foreground">Maroon: bookings · Gold: orders · Grey: donations</p>
      </section>
      <section className="min-w-0 border-y py-5">
        <h2 className="mb-4 font-semibold">Bookings by category</h2>
        {categories.length ? (
          <div className="space-y-4">
            {categories.map((c) => (
              <div key={c.name}>
                <div className="mb-1 flex justify-between gap-2 text-sm">
                  <span>{c.name}</span>
                  <strong>{c.bookings}</strong>
                </div>
                <progress
                  className="category-progress h-2 w-full"
                  value={c.bookings}
                  max={Math.max(1, bookings.length)}
                  aria-label={c.name}
                />
              </div>
            ))}
          </div>
        ) : (
          <p className="py-12 text-sm text-muted-foreground">
            No bookings recorded yet.
          </p>
        )}
      </section>
    </div>
  );
}
