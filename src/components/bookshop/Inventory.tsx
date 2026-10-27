import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { Package, TrendingUp, AlertTriangle, ShoppingBag } from "lucide-react";
import { useCatalog } from "@/hooks/bookshop/useCatalog";
import { useOrders } from "@/hooks/bookshop/useOrders";
import { Button } from "@/components/ui/button";
import { branches, branchName } from "@/services/bookshop/catalog";
import { kes } from "@/lib/booking";
export function Inventory() {
  const q = useCatalog(),
    orders = useOrders(true),
    [branch, setBranch] = useState("all");
  const stocks = (q.data ?? [])
    .flatMap((b) =>
      b.bookshop_stock.map((s) => ({ ...s, title: b.title, price: b.price })),
    )
    .filter((s) => branch === "all" || s.branch === branch);
  const paid = (orders.data ?? []).filter(
    (o) =>
      o.payment_status === "paid" &&
      o.branch &&
      (branch === "all" || o.branch === branch),
  );
  const low = stocks.filter((s) => s.quantity <= s.low_stock_threshold);
  const chart = branches
    .filter((b) => branch === "all" || b.id === branch)
    .map((b) => ({
      name: b.name,
      stock: stocks
        .filter((s) => s.branch === b.id)
        .reduce((n, s) => n + s.quantity, 0),
      sales: paid
        .filter((o) => o.branch === b.id)
        .reduce((n, o) => n + Number(o.amount), 0),
    }));
  return (
    <section className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {[{ id: "all", name: "All branches" }, ...branches].map((b) => (
          <Button
            key={b.id}
            variant={branch === b.id ? "default" : "outline"}
            onClick={() => setBranch(b.id)}
          >
            {b.name}
          </Button>
        ))}
      </div>
      {q.isLoading || orders.isLoading ? (
        <p>Loading inventory…</p>
      ) : q.error || orders.error ? (
        <p className="text-destructive">
          {q.error?.message ?? orders.error?.message}
        </p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            {[
              {
                label: "Copies in stock",
                value: stocks.reduce((n, s) => n + s.quantity, 0),
                icon: Package,
              },
              {
                label: "Sales (simulated)",
                value: kes(paid.reduce((n, o) => n + Number(o.amount), 0)),
                icon: TrendingUp,
              },
              {
                label: "Paid test orders",
                value: paid.length,
                icon: ShoppingBag,
              },
              {
                label: "Low-stock entries",
                value: low.length,
                icon: AlertTriangle,
              },
            ].map((s) => (
              <article key={s.label} className="rounded-lg border bg-card p-4">
                <s.icon className="mb-3 h-5 w-5 text-primary" />
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="mt-2 break-words text-xl font-bold">{s.value}</p>
              </article>
            ))}
          </div>
          <div className="grid gap-6 xl:grid-cols-2">
            {[
              { key: "stock", title: "Stock by branch", unit: "copies" },
              {
                key: "sales",
                title: "Sales by branch · Simulated",
                unit: "KES",
              },
            ].map((c) => (
              <section key={c.key} className="min-w-0 border-y py-5">
                <h2 className="mb-4 font-semibold">{c.title}</h2>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chart}>
                      <CartesianGrid
                        stroke="hsl(var(--border))"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="name"
                        tick={{
                          fill: "hsl(var(--muted-foreground))",
                          fontSize: 12,
                        }}
                      />
                      <YAxis
                        tick={{
                          fill: "hsl(var(--muted-foreground))",
                          fontSize: 12,
                        }}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "hsl(var(--card))",
                          borderColor: "hsl(var(--border))",
                          color: "hsl(var(--foreground))",
                        }}
                        formatter={(v) => [
                          c.key === "sales" ? kes(Number(v)) : v,
                          c.unit,
                        ]}
                      />
                      <Bar
                        isAnimationActive={false}
                        dataKey={c.key}
                        fill={
                          c.key === "stock"
                            ? "hsl(var(--primary))"
                            : "hsl(var(--accent))"
                        }
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </section>
            ))}
          </div>
          <section>
            <h2 className="mb-4 flex items-center gap-2 font-semibold">
              <AlertTriangle className="h-5 w-5 text-accent" />
              Low-stock alerts
            </h2>
            {!low.length ? (
              <p className="border-y py-8 text-muted-foreground">
                No low-stock alerts for this branch.
              </p>
            ) : (
              <div className="divide-y border-y">
                {low.map((s) => (
                  <div
                    key={`${s.book_id}-${s.branch}`}
                    className="flex flex-wrap justify-between gap-2 py-3"
                  >
                    <div>
                      <p className="font-medium">{s.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {branchName(s.branch)}
                      </p>
                    </div>
                    <p
                      className={
                        s.quantity === 0 ? "text-destructive" : "text-primary"
                      }
                    >
                      {s.quantity} left · Alert at {s.low_stock_threshold}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>
          <section>
            <h2 className="mb-4 font-semibold">Branch inventory</h2>
            <div className="divide-y border-y">
              {stocks.length ? (
                stocks.map((s) => (
                  <div
                    key={`${s.book_id}-${s.branch}`}
                    className="flex flex-wrap justify-between gap-3 py-3 text-sm"
                  >
                    <span>
                      {s.title} · {branchName(s.branch)}
                    </span>
                    <span>
                      {s.quantity} copies ·{" "}
                      {s.is_available ? "Available" : "Unavailable"}
                    </span>
                  </div>
                ))
              ) : (
                <p className="py-8 text-muted-foreground">
                  No branch inventory has been added.
                </p>
              )}
            </div>
          </section>
        </>
      )}
    </section>
  );
}
