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
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/common/StatCard";
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
              <StatCard
                key={s.label}
                label={s.label}
                value={s.value}
                icon={s.icon}
              />
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
              <div className="grid gap-3 sm:grid-cols-2">
                {low.map((s) => (
                  <article
                    key={`${s.book_id}-${s.branch}`}
                    className="rounded-lg border border-accent/40 bg-card p-4"
                  >
                    <div className="mb-3 flex items-start justify-between gap-2">
                      <AlertTriangle className="h-5 w-5 text-accent" />
                      <Badge
                        variant={s.quantity === 0 ? "destructive" : "secondary"}
                      >
                        {s.quantity === 0 ? "Out of stock" : "Low stock"}
                      </Badge>
                    </div>
                    <h3 className="font-semibold">{s.title}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {branchName(s.branch)}
                    </p>
                    <div className="mt-4 flex justify-between border-t pt-3 text-sm">
                      <strong>{s.quantity} copies left</strong>
                      <span className="text-muted-foreground">
                        Threshold: {s.low_stock_threshold}
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
          <section>
            <h2 className="mb-4 font-semibold">Branch inventory</h2>
            <div className="overflow-x-auto rounded-lg border bg-card">
              <table className="w-full min-w-[600px] text-sm">
                <thead className="bg-muted text-left text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="p-4">Book</th>
                    <th className="p-4">Branch</th>
                    <th className="p-4 text-right">Stock</th>
                    <th className="p-4 text-right">Alert level</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {stocks.map((s) => (
                    <tr
                      key={`${s.book_id}-${s.branch}`}
                      className="border-t transition-colors hover:bg-muted/50"
                    >
                      <td className="p-4 font-medium">{s.title}</td>
                      <td className="p-4 text-muted-foreground">
                        {branchName(s.branch)}
                      </td>
                      <td className="p-4 text-right font-semibold tabular-nums">
                        {s.quantity}
                      </td>
                      <td className="p-4 text-right tabular-nums">
                        {s.low_stock_threshold}
                      </td>
                      <td className="p-4">
                        <Badge
                          variant={
                            !s.quantity
                              ? "destructive"
                              : s.quantity <= s.low_stock_threshold
                                ? "secondary"
                                : "outline"
                          }
                        >
                          {!s.is_available
                            ? "Unavailable"
                            : !s.quantity
                              ? "Out of stock"
                              : s.quantity <= s.low_stock_threshold
                                ? "Low stock"
                                : "Available"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!stocks.length && (
                <p className="p-8 text-muted-foreground">
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
