import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Loader2,
  Receipt as ReceiptIcon,
  Search,
  Wallet,
  BookOpen,
  Building2,
  Printer,
  ArrowUpRight,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useReceipts } from "@/hooks/useHospitality";
import { bookshopReceiptUrl, donationReceiptUrl, receiptUrl, ticketUrl } from "@/routes/paths";
import { useDonations } from "@/hooks/programmes/useDonations";
import { useTickets } from "@/hooks/programmes/useProgrammes";
import { useBookshopReceipts } from "@/hooks/bookshop/useCatalog";
import { branchName } from "@/services/bookshop/catalog";
import { kes } from "@/lib/booking";

/** Unified receipts listing for hospitality and bookshop. */
export function ReceiptsTable() {
  const q = useReceipts();
  const books = useBookshopReceipts();
  const donations = useDonations();
  const tickets = useTickets();
  const [term, setTerm] = useState("");

  const rows = useMemo(
    () =>
      [
        ...(q.data ?? []).map((r) => ({
          ...r,
          business: "CSLC Hospitality",
          category: "Hospitality",
          url: receiptUrl(r.id),
        })),
        ...(books.data ?? []).map((r) => ({
          ...r,
          business: `CSLC Bookshop · ${branchName(r.branch)}`,
          category: "Bookshop",
          url: bookshopReceiptUrl(r.id),
        })),
        ...(tickets.data ?? []).map((r) => ({
          ...r,
          receipt_number: r.ticket_number,
          business: "CSLC Student Programmes · Event ticket",
          category: "Events",
          url: ticketUrl(r.id),
        })),
        ...(donations.data ?? [])
          .filter((r) => r.receipt_number)
          .map((r) => ({
            ...r,
            receipt_number: r.receipt_number as string,
            phone: r.donor_phone,
            business: "CSLC Student Programmes · Donation",
            category: "Donations",
            url: donationReceiptUrl(r.id),
          })),
      ]
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
        .filter((r) =>
          `${r.receipt_number} ${r.business} ${r.phone ?? ""} ${r.method}`
            .toLowerCase()
            .includes(term.trim().toLowerCase()),
        ),
    [q.data, books.data, tickets.data, donations.data, term],
  );

  if (q.isLoading || books.isLoading) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
      </div>
    );
  }

  if (q.error || books.error) {
    return (
      <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-5 text-sm text-destructive">
        Unable to load receipts: {q.error?.message ?? books.error?.message}
      </div>
    );
  }

  const totalAmount = rows.reduce(
    (sum, receipt) => sum + Number(receipt.amount || 0),
    0,
  );

  const hospitalityCount = rows.filter(
    (r) => r.category === "Hospitality",
  ).length;

  const bookshopCount = rows.filter((r) => r.category === "Bookshop").length;

  const stats = [
    {
      label: "Receipts Found",
      value: rows.length.toLocaleString(),
      icon: ReceiptIcon,
    },
    {
      label: "Total Amount",
      value: kes(totalAmount),
      icon: Wallet,
    },
    {
      label: "Hospitality",
      value: hospitalityCount.toLocaleString(),
      icon: Building2,
    },
    {
      label: "Bookshop",
      value: bookshopCount.toLocaleString(),
      icon: BookOpen,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page heading */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Receipts</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            View, search, and print hospitality and bookshop receipts.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm text-muted-foreground">
          <ReceiptIcon className="h-4 w-4 text-primary" />
          Unified receipt register
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              key={stat.label}
              className="min-w-0 rounded-xl border bg-card p-4 shadow-sm transition-shadow hover:shadow-md sm:p-5"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-medium text-muted-foreground sm:text-sm">
                  {stat.label}
                </p>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="h-4 w-4 text-primary" />
                </span>
              </div>

              <p className="mt-3 break-words text-xl font-bold tracking-tight sm:text-2xl">
                {stat.value}
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                {stat.detail}
              </p>
            </div>
          );
        })}
      </div>

      {/* Search and register */}
      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <div className="flex flex-col gap-4 border-b p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div>
            <h3 className="font-semibold">Receipt Register</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {rows.length} {rows.length === 1 ? "record" : "records"} displayed
            </p>
          </div>

          <div className="relative w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="h-10 pl-9"
              placeholder="Search number, business, phone..."
              value={term}
              onChange={(e) => setTerm(e.target.value)}
            />
          </div>
        </div>

        {!rows.length ? (
          <div className="flex flex-col items-center px-5 py-14 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <ReceiptIcon className="h-7 w-7 text-muted-foreground" />
            </span>

            <h3 className="mt-4 font-semibold">
              {term ? "No matching receipts" : "No receipts yet"}
            </h3>

            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              {term
                ? "Try a different receipt number, business, or phone number."
                : "Receipts will appear here when payment records are available."}
            </p>

            {term && (
              <Button
                className="mt-4"
                variant="outline"
                onClick={() => setTerm("")}
              >
                Clear search
              </Button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-5 py-4 font-medium">Receipt</th>
                    <th className="px-5 py-4 font-medium">Business</th>
                    <th className="px-5 py-4 font-medium">Date & Time</th>
                    <th className="px-5 py-4 font-medium">Payment</th>
                    <th className="px-5 py-4 text-right font-medium">Amount</th>
                    <th className="px-5 py-4 text-right font-medium">Action</th>
                  </tr>
                </thead>

                <tbody className="divide-y">
                  {rows.map((r) => (
                    <tr
                      key={`${r.category}-${r.id}`}
                      className="transition-colors hover:bg-muted/30"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                            <ReceiptIcon className="h-5 w-5 text-primary" />
                          </span>
                          <span className="font-semibold">
                            {r.receipt_number}
                          </span>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <p className="font-medium">{r.business}</p>
                        <span className="mt-1 inline-flex rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground">
                          {r.category}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4">
                        <p>
                          {new Date(r.created_at).toLocaleDateString(
                            undefined,
                            {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            },
                          )}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {new Date(r.created_at).toLocaleTimeString(
                            undefined,
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <span className="rounded-md border px-2.5 py-1.5 text-xs font-medium">
                          {r.method}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-right font-bold tabular-nums">
                        {kes(r.amount)}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <Button asChild size="sm" variant="outline">
                          <Link to={r.url}>
                            <Printer className="mr-2 h-4 w-4" />
                            View / Print
                            <ArrowUpRight className="ml-1 h-3 w-3" />
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Responsive mobile cards */}
            <div className="grid gap-3 p-3 md:hidden">
              {rows.map((r) => (
                <div
                  key={`${r.category}-${r.id}`}
                  className="rounded-xl border p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <ReceiptIcon className="h-5 w-5 text-primary" />
                      </span>
                      <div className="min-w-0">
                        <p className="break-all font-semibold">
                          {r.receipt_number}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {r.category}
                        </p>
                      </div>
                    </div>

                    <p className="shrink-0 text-right font-bold text-primary">
                      {kes(r.amount)}
                    </p>
                  </div>

                  <div className="mt-4 space-y-2 border-t pt-3 text-sm">
                    <div className="flex justify-between gap-3">
                      <span className="text-muted-foreground">Business</span>
                      <span className="text-right font-medium">
                        {r.business}
                      </span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className="text-muted-foreground">Date</span>
                      <span className="text-right">
                        {new Date(r.created_at).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className="text-muted-foreground">Payment</span>
                      <span>{r.method}</span>
                    </div>
                  </div>

                  <Button asChild className="mt-4 w-full" variant="outline">
                    <Link to={r.url}>
                      <Printer className="mr-2 h-4 w-4" />
                      View / Print Receipt
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
